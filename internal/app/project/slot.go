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

type Slot struct {
	ID          int        `json:"id,omitempty"`
	Project     *Project   `json:"project,omitempty"`
	Activity    *Activity  `json:"activity,omitempty"`
	Start       time.Time  `json:"start,omitempty" db:"started_at"`
	End         *time.Time `json:"end,omitempty" db:"ended_at"`
	Description *string    `json:"description,omitempty"`
}

func (s *Slot) SetIdentifier(id *jsonapi.ResourceIdentifierObject) {
	if id == nil || id.Type != "project.slot" {
		log.Error().Msgf("Slot identifier object is invalid")
		return
	}
	if len(id.ID) == 0 {
		return
	}
	idInt, err := strconv.ParseInt(id.ID, 10, 64)
	if err != nil {
		log.Err(err).Msg("Slot identifier is not a valid identifier")
		return
	}
	s.ID = int(idInt)
}

func (s *Slot) GetIdentifier() *jsonapi.ResourceIdentifierObject {
	id := &jsonapi.ResourceIdentifierObject{
		Type: "project.slot",
	}
	if s.ID != 0 {
		id.ID = strconv.Itoa(s.ID)
	}
	return id
}

func (s *Slot) Validate() error {
	if s == nil {
		return errors.New("slot is nil")
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

type SlotFilter struct {
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

func (f *SlotFilter) ToCriteria() filter.Criteria {
	criteria := filter.New()
	tableFilter := filter.NewTable("slot")
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
		switch f.FromComparator {
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
	ErrOpenSlotExists         = errors.New("open slot exists")
	ErrSlotEndsBeforeStart    = errors.New("slot ends before start")
	ErrSlotEndsOnDifferentDay = errors.New("slot ends on different day")
)

type SlotHandler struct {
	api.CRUDResourceHandler[*Slot, *SlotFilter]
}

func (h *SlotHandler) RegisterRoutes(route router.RouteElement) {
	h.CRUDResourceHandler.RegisterRoutes(route)
	route.GET("project/:projectID/slot/csv", h.DownloadCSV)
}

func NewSlotHandler() jsonapi.ResourceHandler {
	api.Register("project.slot", func(tx db.Transaction, id *jsonapi.ResourceIdentifierObject) (*jsonapi.ResourceObject, error) {
		iid, _ := strconv.ParseInt(id.ID, 10, 64)
		item, err := Slots.GetByID(tx, int(iid))
		if err != nil || item == nil {
			return nil, err
		}
		return jsonapi.MarshalResourceObject(item, nil)
	})

	return &SlotHandler{
		CRUDResourceHandler: api.NewCRUDResourceHandler[*Slot, *SlotFilter](Slots, "project/:projectID/slot").
			WithOnNew(func(item *Slot, req *http.Request) error {
				projectID := request.QueryInt(req, ":projectID", 0)
				item.Project = &Project{ID: projectID}
				return nil
			}).
			WithBindFilter(func(req *http.Request, f *SlotFilter) error {
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

func (h *SlotHandler) DownloadCSV(writer http.ResponseWriter, req *http.Request) {
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
	var slots []*Slot
	for _, item := range data.Items {
		slots = append(slots, item.Data)
	}
	_ = WriteAsCSV(writer, slots)
}

type SlotService interface {
	Save(tx db.Transaction, slot *Slot) error
	GetAll(tx db.Transaction, page *pagination.Page, filter *SlotFilter) ([]*Slot, error)
	GetByID(tx db.Transaction, id int) (*Slot, error)
	GetOpenSlot(tx db.Transaction, projectID int) (*Slot, error)
	Delete(tx db.Transaction, id int) error
}

func NewSlotService(repo db.CRUDRepository[*Slot, *SlotFilter]) SlotService {
	return &slotService{
		CRUDService: api.NewCRUDService(repo),
		now:         time.Now,
	}
}

type slotService struct {
	api.CRUDService[*Slot, *SlotFilter]
	now func() time.Time
}

func (s *slotService) Save(tx db.Transaction, slot *Slot) error {
	if slot.Start.IsZero() {
		slot.Start = s.now().UTC().Truncate(time.Minute)
	}

	slot.Start = slot.Start.UTC().Truncate(time.Minute)
	if slot.End == nil {
		openSlot, err := s.GetOpenSlot(tx, slot.Project.ID)
		if err != nil {
			return err
		}
		if openSlot != nil && openSlot.ID != slot.ID {
			return ErrOpenSlotExists
		}
	} else {
		newEnd := slot.End.UTC().Truncate(time.Minute)
		slot.End = &newEnd
		if slot.Start.After(*slot.End) {
			return ErrSlotEndsBeforeStart
		}
		if slot.Start.Truncate(24*time.Hour) != newEnd.Truncate(24*time.Hour) {
			return ErrSlotEndsOnDifferentDay
		}
	}
	return s.CRUDService.Save(tx, slot)
}

func (s *slotService) GetOpenSlot(tx db.Transaction, projectID int) (*Slot, error) {
	trueConst := true
	openSlots, err := s.GetAll(tx, pagination.First(), &SlotFilter{
		ProjectID: &projectID,
		IsOpen:    &trueConst,
	})
	if err != nil {
		return nil, err
	}
	if len(openSlots) > 0 {
		return openSlots[0], nil
	}
	return nil, nil
}

func NewSlotRepository() db.CRUDRepository[*Slot, *SlotFilter] {
	return api.NewCRUDRepository[*Slot, *SlotFilter](api.RepositoryParams{
		TableName:   "slot",
		IDColumn:    "id",
		ColumnNames: []string{"project_id", "activity_id", "started_at", "ended_at", "description"},
		Joins: []statement.TableJoinDefinition{{
			Table: statement.ObjectName{
				Name: "activity",
			},
			OnConditions: []string{"activity.id = slot.activity_id"},
			SelectFields: []statement.ColumnExpression{
				{Name: "id", Alias: "Activity.ID"},
				{Name: "name", Alias: "Activity.Name"},
				{Name: "project_id", Alias: "Activity.Project.ID"},
				{Name: "description", Alias: "Activity.Description"},
				{Name: "billable", Alias: "Activity.Billable"},
				{Name: "amount", Alias: "Activity.Amount"},
				{Name: "icon", Alias: "Activity.Icon"},
			},
		}},
	})
}
