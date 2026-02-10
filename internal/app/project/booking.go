package project

import (
	"errors"
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
	"github.com/vloryan/protrakgon/internal/app/server/api"
	"github.com/vloryan/protrakgon/internal/app/server/db"
	"github.com/vloryan/protrakgon/internal/app/server/request"
)

type Booking struct {
	ID          int        `json:"id,omitempty"`
	Project     *Project   `json:"project,omitempty"`
	Activity    *Activity  `json:"activity,omitempty"`
	Start       time.Time  `json:"start,omitempty" db:"started_at"`
	End         *time.Time `json:"end,omitempty" db:"ended_at"`
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
	return nil
}

type BookingFilter struct {
	ProjectID       *int            `form:"filter[projectId]"`
	ActivityID      *int            `form:"filter[activityId]"`
	From            *time.Time      `form:"filter[from]"`
	FromComparator  CompareOperator `form:"filter[fromComparator]"`
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
		fieldFilter := tableFilter.Column("started_at").AsDate()
		switch f.FromComparator {
		case CompareOperatorEqual:
			criteria = criteria.And(fieldFilter.Eq(f.From, filter.AsDate))
		case CompareOperatorNotEqual:
			criteria = criteria.And(fieldFilter.Neq(f.From, filter.AsDate))
		case CompareOperatorLessThan:
			criteria = criteria.And(fieldFilter.Lt(f.From, filter.AsDate))
		case CompareOperatorLessThanOrEqual:
			criteria = criteria.And(fieldFilter.LtEq(f.From, filter.AsDate))
		case CompareOperatorGreaterThan:
			criteria = criteria.And(fieldFilter.Gt(f.From, filter.AsDate))
		case CompareOperatorGreaterThanOrEqual:
			criteria = criteria.And(fieldFilter.GtEq(f.From, filter.AsDate))
		}
	}
	if f.Until != nil {
		fieldFilter := tableFilter.Column("ended_at").AsDate()
		switch f.UntilComparator {
		case CompareOperatorEqual:
			criteria = criteria.And(fieldFilter.Eq(f.Until, filter.AsDate))
		case CompareOperatorNotEqual:
			criteria = criteria.And(fieldFilter.Neq(f.Until, filter.AsDate))
		case CompareOperatorLessThan:
			criteria = criteria.And(fieldFilter.Lt(f.Until, filter.AsDate))
		case CompareOperatorLessThanOrEqual:
			criteria = criteria.And(fieldFilter.LtEq(f.Until, filter.AsDate))
		case CompareOperatorGreaterThan:
			criteria = criteria.And(fieldFilter.Gt(f.Until, filter.AsDate))
		case CompareOperatorGreaterThanOrEqual:
			criteria = criteria.And(fieldFilter.GtEq(f.Until, filter.AsDate))
		}
	}
	if f.IsOpen != nil {
		if *f.IsOpen {
			criteria = criteria.And(tableFilter.Column("ended_at").IsNil())
		} else {
			criteria = criteria.And(tableFilter.Column("ended_at").IsNil().Not())
		}
	}
	if f.Description != nil {
		criteria = criteria.And(tableFilter.Column("description").Like("%" + strings.ToLower(*f.Description) + "%"))
	}
	if f.IsBillable != nil {
		if *f.IsBillable == true {
			criteria = criteria.And(filter.NewTable("activity").Column("billable_amount_unit").Neq(BillableAmountUnitNone))
		} else {
			criteria = criteria.And(filter.NewTable("activity").Column("billable_amount_unit").Eq(BillableAmountUnitNone))
		}

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
)

type BookingHandler struct {
	api.CRUDResourceHandler[*Booking, *BookingFilter]
}

func (h *BookingHandler) RegisterRoutes(route router.RouteElement) {
	h.CRUDResourceHandler.RegisterRoutes(route)
	route.GET("project/:projectID/booking/csv", h.DownloadCSV)
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

type BookingService interface {
	Save(tx db.Transaction, booking *Booking) error
	GetAll(tx db.Transaction, page *pagination.Page, filter *BookingFilter) ([]*Booking, error)
	GetByID(tx db.Transaction, id int) (*Booking, error)
	GetOpenBooking(tx db.Transaction, projectID int) (*Booking, error)
	Delete(tx db.Transaction, id int) error
}

func NewBookingService(repo db.CRUDRepository[*Booking, *BookingFilter]) BookingService {
	return &bookingService{
		CRUDService: api.NewCRUDService(repo),
		now:         time.Now,
	}
}

type bookingService struct {
	api.CRUDService[*Booking, *BookingFilter]
	now func() time.Time
}

func (s *bookingService) Save(tx db.Transaction, booking *Booking) error {
	if booking.Start.IsZero() {
		booking.Start = s.now().UTC().Truncate(time.Minute)
	}

	booking.Start = booking.Start.UTC().Truncate(time.Minute)
	if booking.End == nil {
		activity, err := Activities.GetByID(tx, booking.Activity.ID)
		if err != nil {
			return err
		}
		if activity.BillableAmountUnit == BillableAmountUnitPerDay {
			booking.Start = booking.Start.UTC().Truncate(time.Hour)
			startOfNextDay := booking.Start.UTC().Add(time.Hour * 24)
			booking.End = &startOfNextDay
		} else {
			openBooking, err := s.GetOpenBooking(tx, booking.Project.ID)
			if err != nil {
				return err
			}
			if openBooking != nil && openBooking.ID != booking.ID {
				return ErrOpenBookingExists
			}
		}
	} else {
		newEnd := booking.End.UTC().Truncate(time.Minute)
		booking.End = &newEnd
		if booking.Start.After(*booking.End) {
			return ErrBookingEndsBeforeStart
		}
		if booking.Start.Truncate(24*time.Hour) != newEnd.Truncate(24*time.Hour) {
			return ErrBookingEndsOnDifferentDay
		}
	}
	return s.CRUDService.Save(tx, booking)
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
		ColumnNames: []string{"project_id", "activity_id", "started_at", "ended_at", "description"},
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
				{Name: "billable_amount_unit", Alias: "Activity.billable_amount_unit"},
				{Name: "amount", Alias: "Activity.Amount"},
				{Name: "icon", Alias: "Activity.Icon"},
			},
		}},
	})
}
