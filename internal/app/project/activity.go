package project

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/vloryan/go-libs/httpx"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/go-libs/sqlx/filter"
	"github.com/vloryan/protrakgon/internal/app/server"
	"github.com/vloryan/protrakgon/internal/app/server/api"
	"github.com/vloryan/protrakgon/internal/app/server/db"
	"github.com/vloryan/protrakgon/internal/app/server/request"
)

type ActivityUnit int

const (
	ActivityUnitTime ActivityUnit = iota
	ActivityUnitPiece
)

type Activity struct {
	ID          int          `json:"id,omitempty"`
	Project     *Project     `json:"project,omitempty"`
	Name        string       `json:"name,omitempty"`
	Description *string      `json:"description,omitempty"`
	Amount      float64      `json:"amount,omitempty"`
	Unit        ActivityUnit `json:"unit"`
	Billable    bool         `json:"billable,omitempty"`
	Icon        string       `json:"icon,omitempty"`
}

func (p *Activity) SetIdentifier(id *jsonapi.ResourceIdentifierObject) {
	if id == nil || id.Type != "project.activity" {
		log.Error().Msgf("Activity identifier object is invalid")
		return
	}
	if len(id.ID) == 0 {
		return
	}
	idInt, err := strconv.ParseInt(id.ID, 10, 64)
	if err != nil {
		log.Err(err).Msg("Activity identifier is not a valid identifier")
		return
	}
	p.ID = int(idInt)
}

func (p *Activity) GetIdentifier() *jsonapi.ResourceIdentifierObject {
	id := &jsonapi.ResourceIdentifierObject{
		Type: "project.activity",
	}
	if p.ID != 0 {
		id.ID = strconv.Itoa(p.ID)
	}
	return id
}

type ActivityFilter struct {
	ID        *int     `form:"filter[id]"`
	Name      string   `form:"filter[name]"`
	ProjectID *int     `form:"filter[projectId]"`
	Billable  *bool    `form:"filter[billable]"`
	Units     []int    `form:"filter[units]"`
	Amount    *float64 `form:"filter[amount]"`
}

func (f *ActivityFilter) ToCriteria() filter.Criteria {
	criteria := filter.New()
	tableFilter := filter.NewTable("activity")
	if f.ID != nil {
		criteria = criteria.And(tableFilter.Column("id").Eq(*f.ID))
	}
	if f.Name != "" {
		criteria = criteria.And(tableFilter.Column("name").
			ToLower().
			Like("%" + strings.ToLower(f.Name) + "%"))
	}
	if f.ProjectID != nil {
		criteria = criteria.And(tableFilter.Column("project_id").Eq(*f.ProjectID))
	}
	if f.Billable != nil {
		criteria = criteria.And(tableFilter.Column("billable").Eq(*f.Billable))
	}
	if len(f.Units) > 0 {
		values := make([]any, len(f.Units))
		for i := range f.Units {
			values[i] = f.Units[i]
		}
		criteria = criteria.And(tableFilter.Column("unit").In(values))
	}
	if f.Amount != nil {
		criteria = criteria.And(tableFilter.Column("amount").Eq(*f.Amount))
	}
	return criteria
}

func NewActivityService(repository db.CRUDRepository[*Activity, *ActivityFilter]) server.CrudService[*Activity, *ActivityFilter] {
	return api.NewCRUDService(repository)
}

func NewActivityRepository() db.CRUDRepository[*Activity, *ActivityFilter] {
	return api.NewCRUDRepository[*Activity, *ActivityFilter](api.RepositoryParams{
		TableName:   "activity",
		IDColumn:    "id",
		ColumnNames: []string{"name", "project_id", "description", "billable", "unit", "amount", "icon"},
	})
}

type ActivityHandler struct {
	api.CRUDResourceHandler[*Activity, *ActivityFilter]
}

func NewActivityHandler() jsonapi.ResourceHandler {
	api.Register("project.activity", func(tx db.Transaction, id *jsonapi.ResourceIdentifierObject) (*jsonapi.ResourceObject, error) {
		iid, _ := strconv.ParseInt(id.ID, 10, 64)
		item, err := Activities.GetByID(tx, int(iid))
		if err != nil || item == nil {
			return nil, err
		}
		return jsonapi.MarshalResourceObject(item, nil)
	})
	return api.NewCRUDResourceHandler[*Activity, *ActivityFilter](Activities, "project/:projectID/activity").
		WithOnNew(func(item *Activity, req *http.Request) error {
			projectID := request.QueryInt(req, ":projectID", 0)
			item.Project = &Project{ID: projectID}
			item.Icon = "bolt"
			return nil
		}).
		WithBindFilter(func(req *http.Request, f *ActivityFilter) error {
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
		})
}
