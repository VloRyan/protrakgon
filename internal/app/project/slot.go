package project

import (
	"errors"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/go-libs/reflectx"
	"github.com/vloryan/go-libs/sqlx/pagination"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

type Slot struct {
	ID          int        `json:"id,omitempty"`
	ProjectID   int        `json:"projectId,omitempty"`
	Activity    Activity   `json:"activity"`
	Start       time.Time  `json:"start,omitempty" db:"started_at"`
	End         *time.Time `json:"end,omitempty" db:"ended_at"`
	Description *string    `json:"description,omitempty"`
}

func (p *Slot) SetIdentifier(id *jsonapi.ResourceIdentifierObject) {
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
	p.ID = int(idInt)
}

func (p *Slot) GetIdentifier() *jsonapi.ResourceIdentifierObject {
	id := &jsonapi.ResourceIdentifierObject{
		Type: "project.slot",
	}
	if p.ID != 0 {
		id.ID = strconv.Itoa(p.ID)
	}
	return id
}

type SlotFilter struct {
	ProjectID           *int            `form:"filter[projectID]"`
	Activity            *Activity       `form:"filter[activity]"`
	StartTime           *time.Time      `form:"filter[startTime]"`
	StartTimeComparator CompareOperator `form:"filter[startTimeComparator]"`
	EndTime             *time.Time      `form:"filter[endTime]"`
	EndTimeComparator   CompareOperator `form:"filter[endTimeComparator]"`
	IsOpen              *bool           `form:"filter[isOpen]"`
	Description         *string         `form:"filter[description]"`
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
	ErrOpenSlotExists      = errors.New("open slot exists")
	ErrSlotEndsBeforeStart = errors.New("slot ends before start")
)

type SlotService interface {
	Start(slot *Slot)
	Save(tx db.Transaction, slot *Slot) error
	GetAll(tx db.Transaction, page *pagination.Page, filter *SlotFilter) ([]*Slot, error)
	GetByID(tx db.Transaction, id int) (*Slot, error)
	GetOpenSlot(tx db.Transaction, projectID int) (*Slot, error)
	Delete(tx db.Transaction, id int) error
}

func NewSlotService(repo db.CRUDRepository[*Slot, *SlotFilter]) SlotService {
	return &slotService{slotRepo: repo, now: time.Now}
}

type slotService struct {
	slotRepo db.CRUDRepository[*Slot, *SlotFilter]
	now      func() time.Time
}

func (s *slotService) Start(slot *Slot) {
	slot.Start = s.now().UTC().Truncate(time.Minute)
}

func (s *slotService) Save(tx db.Transaction, slot *Slot) error {
	slot.Start = slot.Start.UTC().Truncate(time.Minute)
	if slot.End == nil {
		openSlot, err := s.GetOpenSlot(tx, slot.ProjectID)
		if err != nil {
			return err
		}
		if openSlot != nil && openSlot.ID != slot.ID {
			return ErrOpenSlotExists
		}
	} else {
		newEnd := slot.End.UTC().Truncate(time.Minute)
		slot.End = &newEnd
		if slot.End != nil && slot.Start.After(*slot.End) {
			return ErrSlotEndsBeforeStart
		}
	}
	return s.slotRepo.Save(tx, slot)
}

func (s *slotService) GetAll(tx db.Transaction, page *pagination.Page, filter *SlotFilter) ([]*Slot, error) {
	return s.slotRepo.GetAll(tx, page, filter)
}

func (s *slotService) GetByID(tx db.Transaction, id int) (*Slot, error) {
	return s.slotRepo.GetByID(tx, id)
}

func (s *slotService) GetOpenSlot(tx db.Transaction, projectID int) (*Slot, error) {
	trueConst := true
	openSlots, err := s.slotRepo.GetAll(tx, pagination.First(), &SlotFilter{
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

func (s *slotService) Delete(tx db.Transaction, id int) error {
	return s.slotRepo.Delete(tx, id)
}

type SlotRepository struct{}

func NewSlotRepository() db.CRUDRepository[*Slot, *SlotFilter] {
	return &SlotRepository{}
}

func (r *SlotRepository) Save(tx db.Transaction, slot *Slot) error {
	if slot.ID == 0 {
		stmt := `INSERT INTO slot (project_id, activity, started_at, ended_at, description) 
				  VALUES (:projectId, :activity, :start, :end, :description)`

		result, err := tx.Exec(stmt, slot)
		if err != nil {
			return err
		}
		id, err := result.LastInsertId()
		if err != nil {
			return err
		}
		slot.ID = int(id)
	} else {
		stmt := `UPDATE slot 
				    SET
						project_id  = :projectId, 
						activity    = :activity,
						started_at  = :start,
						ended_at    = :end,
				        description = :description
				  WHERE 
				        id = :id`

		result, err := tx.Exec(stmt, slot)
		if err != nil {
			return err
		}
		affected, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if affected == 0 {
			return errors.New("update failed: 0 rows affected")
		}
	}

	return nil
}

func (r *SlotRepository) GetByID(tx db.Transaction, id int) (*Slot, error) {
	slot := &Slot{}
	stmt := `SELECT id, project_id, activity, started_at, ended_at, description
			   FROM slot 
			  WHERE id = :id`

	if err := tx.Select(slot, stmt, map[string]any{"id": id}); err != nil {
		return nil, err
	}
	if slot.ID == 0 {
		return nil, nil
	}
	return slot, nil
}

func (r *SlotRepository) GetAll(tx db.Transaction, page *pagination.Page, filter *SlotFilter) ([]*Slot, error) {
	projects := make([]*Slot, 0, 10)
	stmt := `SELECT id, project_id, activity, started_at, ended_at, description
             FROM slot`
	countStmt := `SELECT COUNT(*) AS total_count 
				    FROM slot`

	var orderArgs []string
	s := Slot{}
	t := reflect.TypeOf(s)

	for _, sort := range page.Sort {
		var dir string
		var fieldName string
		if strings.HasPrefix(sort, "-") {
			fieldName = sort[1:]
			dir = " DESC"
		} else {
			fieldName = sort
		}
		field, ok := t.FieldByNameFunc(func(s string) bool {
			return strings.EqualFold(s, fieldName)
		})
		if !ok {
			return nil, errors.New("field " + fieldName + " not found")
		}
		dbTag := reflectx.Tag(field, "db")
		dbField := dbTag.Value
		if dbField == "" {
			dbField = fieldName
		}
		orderArgs = append(orderArgs, dbField+dir)
	}
	whereClause, whereParams := r.toWhereClause(filter)
	selectParams := make(map[string]any)
	for k, v := range whereParams {
		selectParams[k] = v
	}
	if len(whereClause) > 0 {
		stmt += "\n" + whereClause
		countStmt += "\n" + whereClause
	}

	if len(orderArgs) > 0 {
		stmt += "\nORDER BY " + strings.Join(orderArgs, ", ")
	}

	if page.Offset != 0 {
		stmt += "\nOFFSET :offset"
		selectParams["offset"] = page.Offset
	}
	if page.Limit != -1 {
		stmt += "\nLIMIT :limit"
		selectParams["limit"] = page.Limit
	}
	if len(whereParams) > 0 {
		if err := tx.Select(page, countStmt, whereParams); err != nil {
			return nil, err
		}
	} else {
		if err := tx.Select(page, countStmt); err != nil {
			return nil, err
		}
	}

	if err := tx.Select(&projects, stmt, selectParams); err != nil {
		return nil, err
	}
	return projects, nil
}

func (r *SlotRepository) Delete(tx db.Transaction, id int) error {
	stmt := `DELETE 
             FROM slot
             WHERE id = :id`

	result, err := tx.Exec(stmt, map[string]interface{}{"id": id})
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected != 1 {
		return errors.New("delete failed: " + strconv.Itoa(int(affected)) + " rows affected")
	}
	return err
}

func (r *SlotRepository) toWhereClause(filter *SlotFilter) (string, map[string]any) {
	clause := ""
	parts := make([]string, 0, 10)
	m := make(map[string]any)
	if filter.ProjectID != nil {
		m["projectId"] = filter.ProjectID
		parts = append(parts, "project_id = :projectId")
	}
	if filter.Activity != nil {
		m["activity"] = *filter.Activity
		parts = append(parts, "activity = :activity")
	}
	if filter.StartTime != nil {
		m["startTime"] = *filter.StartTime
		switch filter.StartTimeComparator {
		case CompareOperatorEqual:
			parts = append(parts, "started_at = :startTime")
		case CompareOperatorNotEqual:
			parts = append(parts, "started_at <> :startTime")
		case CompareOperatorLessThan:
			parts = append(parts, "started_at < :startTime")
		case CompareOperatorLessThanOrEqual:
			parts = append(parts, "started_at >= :startTime")
		case CompareOperatorGreaterThan:
			parts = append(parts, "started_at > :startTime")
		case CompareOperatorGreaterThanOrEqual:
			parts = append(parts, "started_at >= :startTime")
		}
	}
	if filter.EndTime != nil {
		m["endTime"] = *filter.EndTime
		switch filter.EndTimeComparator {
		case CompareOperatorEqual:
			parts = append(parts, "ended_at = :endTime")
		case CompareOperatorNotEqual:
			parts = append(parts, "ended_at <> :endTime")
		case CompareOperatorLessThan:
			parts = append(parts, "ended_at < :endTime")
		case CompareOperatorLessThanOrEqual:
			parts = append(parts, "ended_at >= :endTime")
		case CompareOperatorGreaterThan:
			parts = append(parts, "ended_at > :endTime")
		case CompareOperatorGreaterThanOrEqual:
			parts = append(parts, "ended_at >= :endTime")
		}

	}
	if filter.IsOpen != nil {
		if *filter.IsOpen {
			parts = append(parts, "ended_at IS NULL")
		} else {
			parts = append(parts, "ended_at IS NOT NULL")
		}
	}
	if filter.Description != nil {
		m["description"] = "%" + strings.ToLower(*filter.Description) + "%"
		parts = append(parts, "description LIKE :description")
	}
	if len(parts) > 0 {
		clause = "WHERE " + strings.Join(parts, " AND ")
	}
	return clause, m
}
