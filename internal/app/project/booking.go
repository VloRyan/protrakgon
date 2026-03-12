package project

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/vloryan/go-libs/httpx"
	"github.com/vloryan/go-libs/httpx/router"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/go-libs/sqlx/filter"
	"github.com/vloryan/go-libs/sqlx/pagination"
	"github.com/vloryan/go-libs/sqlx/statement"
	"github.com/vloryan/protrakgon/internal/app/server"
	"github.com/vloryan/protrakgon/internal/app/server/api"
	"github.com/vloryan/protrakgon/internal/app/server/db"
	"github.com/vloryan/protrakgon/internal/app/server/request"
)

type Booking struct {
	ID          int        `json:"id,omitempty"`
	Project     *Project   `json:"project,omitempty"`
	Activity    *Activity  `json:"activity,omitempty"`
	Start       time.Time  `json:"start,omitempty" db:"started_at,unix_timestamp"`
	Amount      int        `json:"amount,omitempty"`
	End         *time.Time `json:"end,omitempty" db:"ended_at,unix_timestamp"`
	Description *string    `json:"description,omitempty"`
}

func (s *Booking) SetIdentifier(id *jsonapi.ResourceIdentifierObject) {
	if id == nil || id.Type != "project.booking" {
		log.Error().Msgf("Booking identifier object is invalid")
		return
	}
	if len(id.ID) == 0 {
		return
	}
	idInt, err := strconv.ParseInt(id.ID, 10, 64)
	if err != nil {
		log.Err(err).Msg("Booking identifier is not a valid identifier")
		return
	}
	s.ID = int(idInt)
}

func (s *Booking) GetIdentifier() *jsonapi.ResourceIdentifierObject {
	id := &jsonapi.ResourceIdentifierObject{
		Type: "project.booking",
	}
	if s.ID != 0 {
		id.ID = strconv.Itoa(s.ID)
	}
	return id
}

func (s *Booking) Validate() error {
	if s == nil {
		return errors.New("booking is nil")
	}
	if s.Start.IsZero() {
		return errors.New("start is required")
	}
	if s.Project == nil || s.Project.ID == 0 {
		return errors.New("project is required")
	}
	if s.Activity == nil || s.Activity.ID == 0 {
		return errors.New("activity is required")
	}

	if s.End != nil {
		if s.Start.After(*s.End) {
			return ErrBookingEndsBeforeStart
		}
		if s.Start.Truncate(24*time.Hour) != s.End.Truncate(24*time.Hour) {
			return ErrBookingEndsOnDifferentDay
		}
		if s.Amount != -1 {
			amountInMin := int(s.End.Sub(s.Start).Minutes())
			if amountInMin != s.Amount {
				return ErrAmountDiffToEnd
			}
		}
	}

	return nil
}

type BookingFilter struct {
	ProjectID       *int            `form:"filter[projectId]"`
	ActivityID      *int            `form:"filter[activityId]"`
	From            *time.Time      `form:"filter[from]"`
	FromComparator  CompareOperator `form:"filter[fromComparator]"`
	Amount          *int            `form:"filter[amount]"`
	Until           *time.Time      `form:"filter[until]"`
	UntilComparator CompareOperator `form:"filter[untilComparator]"`
	IsOpen          *bool           `form:"filter[isOpen]"`
	IsBillable      *bool           `form:"filter[billable]"`
	Description     *string         `form:"filter[description]"`
}

func (f *BookingFilter) ToCriteria() filter.Criteria {
	criteria := filter.New()
	tableFilter := filter.NewTable("booking")
	if f.ProjectID != nil {
		criteria = criteria.And(tableFilter.Column("project_id").Eq(*f.ProjectID))
	}
	if f.ActivityID != nil {
		criteria = criteria.And(tableFilter.Column("activity_id").Eq(*f.ActivityID))
	}
	if f.From != nil {
		fieldFilter := tableFilter.Column("started_at")
		unixTimestamp := (*f.From).UTC().Truncate(time.Hour).Unix()
		switch f.FromComparator {
		case CompareOperatorEqual:
			criteria = criteria.And(fieldFilter.Eq(unixTimestamp))
		case CompareOperatorNotEqual:
			criteria = criteria.And(fieldFilter.Neq(unixTimestamp))
		case CompareOperatorLessThan:
			criteria = criteria.And(fieldFilter.Lt(unixTimestamp))
		case CompareOperatorLessThanOrEqual:
			criteria = criteria.And(fieldFilter.LtEq(unixTimestamp))
		case CompareOperatorGreaterThan:
			criteria = criteria.And(fieldFilter.Gt(unixTimestamp))
		case CompareOperatorGreaterThanOrEqual:
			criteria = criteria.And(fieldFilter.GtEq(unixTimestamp))
		}
	}
	if f.Amount != nil {
		criteria = criteria.And(tableFilter.Column("amount").Eq(*f.Amount))
	}
	if f.Until != nil {
		fieldFilter := tableFilter.Column("started_at").WithParamName("booking_started_at_until")
		unixTimestamp := (*f.Until).UTC().Truncate(time.Hour).Unix()
		switch f.UntilComparator {
		case CompareOperatorEqual:
			criteria = criteria.And(fieldFilter.Eq(unixTimestamp))
		case CompareOperatorNotEqual:
			criteria = criteria.And(fieldFilter.Neq(unixTimestamp))
		case CompareOperatorLessThan:
			criteria = criteria.And(fieldFilter.Lt(unixTimestamp))
		case CompareOperatorLessThanOrEqual:
			criteria = criteria.And(fieldFilter.LtEq(unixTimestamp))
		case CompareOperatorGreaterThan:
			criteria = criteria.And(fieldFilter.Gt(unixTimestamp))
		case CompareOperatorGreaterThanOrEqual:
			criteria = criteria.And(fieldFilter.GtEq(unixTimestamp))
		}
	}
	if f.IsOpen != nil {
		if *f.IsOpen {
			criteria = criteria.And(tableFilter.Column("amount").Eq(-1))
		} else {
			criteria = criteria.And(tableFilter.Column("amount").Neq(-1))
		}
	}
	if f.Description != nil {
		criteria = criteria.And(tableFilter.Column("description").Like("%" + strings.ToLower(*f.Description) + "%"))
	}
	if f.IsBillable != nil {
		criteria = criteria.And(filter.NewTable("activity").Column("billable").Eq(*f.IsBillable))
	}
	return criteria
}

type CompareOperator int

const (
	CompareOperatorEqual CompareOperator = iota
	CompareOperatorNotEqual
	CompareOperatorLessThan
	CompareOperatorLessThanOrEqual
	CompareOperatorGreaterThan
	CompareOperatorGreaterThanOrEqual
)

var (
	ErrOpenBookingExists         = errors.New("open booking exists")
	ErrBookingEndsBeforeStart    = errors.New("booking ends before start")
	ErrBookingEndsOnDifferentDay = errors.New("booking ends on different day")
	ErrUnknownActivity           = errors.New("unknown activity")
	ErrAmountDiffToEnd           = errors.New("booking amount differs to duration end-start")
)

type BookingHandler struct {
	api.CRUDResourceHandler[*Booking, *BookingFilter]
}

func (h *BookingHandler) RegisterRoutes(route router.RouteElement) {
	h.CRUDResourceHandler.RegisterRoutes(route)
	route.GET("project/:projectID/booking/csv", h.DownloadCSV)
	route.POST("project/:projectID/booking/bulk", h.BulkImport)
}

func NewBookingHandler() jsonapi.ResourceHandler {
	api.Register("project.booking", func(tx db.Transaction, id *jsonapi.ResourceIdentifierObject) (*jsonapi.ResourceObject, error) {
		iid, _ := strconv.ParseInt(id.ID, 10, 64)
		item, err := Bookings.GetByID(tx, int(iid))
		if err != nil || item == nil {
			return nil, err
		}
		return jsonapi.MarshalResourceObject(item, nil)
	})

	return &BookingHandler{
		CRUDResourceHandler: api.NewCRUDResourceHandler[*Booking, *BookingFilter](Bookings, "project/:projectID/booking").
			WithOnNew(func(item *Booking, req *http.Request) error {
				projectID := request.QueryInt(req, ":projectID", 0)
				item.Project = &Project{ID: projectID}
				item.Amount = -1
				return nil
			}).
			WithBindFilter(func(req *http.Request, f *BookingFilter) error {
				if err := httpx.BindQuery(req, f); err != nil {
					return err
				}
				if f.ProjectID == nil {
					projectID := request.QueryInt(req, ":projectID", 0)
					if projectID != 0 {
						f.ProjectID = &projectID
					}
				}
				return nil
			}),
	}
}

func (h *BookingHandler) DownloadCSV(writer http.ResponseWriter, req *http.Request) {
	data, err := h.GetAll(req)
	if err != nil {
		writer.WriteHeader(http.StatusInternalServerError)
		_, _ = writer.Write([]byte(err.Error()))
	}
	if data == nil || data.Items == nil || len(data.Items) == 0 {
		writer.WriteHeader(http.StatusNotFound)
		return
	}
	writer.Header().Set("Content-Type", "text/csv")
	writer.WriteHeader(http.StatusOK)
	var bookings []*Booking
	for _, item := range data.Items {
		bookings = append(bookings, item.Data)
	}
	_ = WriteAsCSV(writer, bookings)
}

func (h *BookingHandler) BulkImport(writer http.ResponseWriter, req *http.Request) {
	projectId := request.QueryInt(req, ":projectID", 0)
	if projectId == 0 {
		writer.WriteHeader(http.StatusBadRequest)
		_, _ = writer.Write([]byte("no project id provided"))
		return
	}
	body, err := io.ReadAll(req.Body)
	if err != nil {
		writer.WriteHeader(http.StatusBadRequest)
		_, _ = writer.Write([]byte(err.Error()))
		return
	}
	var bodyObject = struct {
		Lines []string
	}{}
	if err := json.Unmarshal(body, &bodyObject); err != nil {
		writer.WriteHeader(http.StatusBadRequest)
		_, _ = writer.Write([]byte(err.Error()))
		return
	}
	bookings := make([]*Booking, 0, len(bodyObject.Lines))
	for no, line := range bodyObject.Lines {
		if len(line) == 0 {
			continue
		}
		booking, err := ParseBooking(line)
		if err != nil {
			writer.WriteHeader(http.StatusBadRequest)
			_, _ = writer.Write([]byte(fmt.Sprintf("error parsing bookings at line %d: %s", no, err.Error())))
			return
		}
		bookings = append(bookings, &booking)
	}

	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		for _, booking := range bookings {
			activities, err := Activities.GetAll(tx, pagination.NewPage(0, 2), &ActivityFilter{
				Name:      booking.Activity.Name,
				ProjectID: &projectId,
			})
			if err != nil {
				return jsonapi.NewError(http.StatusInternalServerError, "failed to resolve activity '"+booking.Activity.Name+"'", err)
			}
			if len(activities) != 1 {
				return jsonapi.NewError(http.StatusBadRequest, "failed to resolve activity for name: "+booking.Activity.Name, nil)
			}
			booking.Activity = activities[0]
			booking.Project = &Project{ID: projectId}
			if err := Bookings.Save(tx, booking); err != nil {
				return jsonapi.NewError(http.StatusInternalServerError, "failed to save booking", err)
			}
		}
		return nil
	}); err != nil {
		var jErr *jsonapi.Error
		if errors.As(err, &jErr) {
			code, _ := strconv.ParseInt(jErr.Status, 10, 64)
			writer.Header().Set("Content-Type", "application/json")
			writer.WriteHeader(int(code))
			body, _ := json.Marshal(jErr)
			_, _ = writer.Write(body)
			return
		}
		writer.WriteHeader(http.StatusBadRequest)
		_, _ = writer.Write([]byte("failed to process bookings: " + err.Error()))
		return
	}
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(http.StatusOK)
}

type BookingService interface {
	Save(tx db.Transaction, booking *Booking) error
	GetAll(tx db.Transaction, page *pagination.Page, filter *BookingFilter) ([]*Booking, error)
	GetByID(tx db.Transaction, id int) (*Booking, error)
	GetOpenBooking(tx db.Transaction, projectID int) (*Booking, error)
	Delete(tx db.Transaction, id int) error
}

func NewBookingService(repo db.CRUDRepository[*Booking, *BookingFilter]) BookingService {
	return &bookingService{
		CRUDService:     api.NewCRUDService(repo),
		now:             time.Now,
		activityService: Activities,
	}
}

type bookingService struct {
	api.CRUDService[*Booking, *BookingFilter]
	now             func() time.Time
	activityService server.CrudService[*Activity, *ActivityFilter]
}

func (s *bookingService) Save(tx db.Transaction, booking *Booking) error {
	if err := s.enhanceBooking(tx, booking); err != nil {
		return err
	}
	if booking.Activity.Unit == ActivityUnitTime && booking.Amount == -1 {
		openBooking, err := s.GetOpenBooking(tx, booking.Project.ID)
		if err != nil {
			return err
		}
		if openBooking != nil && openBooking.ID != booking.ID {
			return ErrOpenBookingExists
		}
	}
	return s.CRUDService.Save(tx, booking)
}
func (s *bookingService) enhanceBooking(tx db.Transaction, booking *Booking) error {
	var err error
	if booking.Activity, err = s.activityService.GetByID(tx, booking.Activity.ID); err != nil {
		return err
	}
	if booking.Activity == nil {
		return ErrUnknownActivity
	}

	if booking.Start.IsZero() {
		booking.Start = s.now()
	}

	switch booking.Activity.Unit {
	case ActivityUnitTime:
		booking.Start = booking.Start.UTC().Truncate(time.Minute)
		if booking.End == nil && booking.Amount != -1 {
			end := booking.Start.UTC().Add(time.Minute * time.Duration(booking.Amount)).Truncate(time.Minute)
			booking.End = &end
		}
		if booking.End != nil && booking.Amount == -1 {
			amountInMin := int(booking.End.Sub(booking.Start).Minutes())
			booking.Amount = amountInMin
		}
	case ActivityUnitPiece:
		booking.Start = booking.Start.UTC().Truncate(time.Hour) // start of day
		booking.End = nil
		if booking.Amount < 1 {
			booking.Amount = 1
		}
	}

	return nil
}

func (s *bookingService) GetOpenBooking(tx db.Transaction, projectID int) (*Booking, error) {
	trueConst := true
	openBookings, err := s.GetAll(tx, pagination.First(), &BookingFilter{
		ProjectID: &projectID,
		IsOpen:    &trueConst,
	})
	if err != nil {
		return nil, err
	}
	if len(openBookings) > 0 {
		return openBookings[0], nil
	}
	return nil, nil
}

func NewBookingRepository() db.CRUDRepository[*Booking, *BookingFilter] {
	return api.NewCRUDRepository[*Booking, *BookingFilter](api.RepositoryParams{
		TableName:   "booking",
		IDColumn:    "id",
		ColumnNames: []string{"project_id", "activity_id", "started_at", "amount", "ended_at", "description"},
		Joins: []statement.TableJoinDefinition{{
			Table: statement.ObjectName{
				Name: "activity",
			},
			OnConditions: []string{"activity.id = booking.activity_id"},
			SelectFields: []statement.ColumnExpression{
				{Name: "id", Alias: "Activity.ID"},
				{Name: "name", Alias: "Activity.Name"},
				{Name: "project_id", Alias: "Activity.Project.ID"},
				{Name: "description", Alias: "Activity.Description"},
				{Name: "billable", Alias: "Activity.billable"},
				{Name: "unit", Alias: "Activity.unit"},
				{Name: "amount", Alias: "Activity.Amount"},
				{Name: "icon", Alias: "Activity.Icon"},
			},
		}},
	})
}
