package project

import (
	"errors"
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/go-libs/sqlx/filter"
	"github.com/vloryan/go-libs/sqlx/statement"
	"github.com/vloryan/protrakgon/internal/app/client"
	"github.com/vloryan/protrakgon/internal/app/server/api"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

type Project struct {
	ID          int            `json:"id,omitempty"`
	Name        string         `json:"name,omitempty"`
	Client      *client.Client `json:"client,omitempty"`
	Description *string        `json:"description,omitempty"`
}

func (p *Project) Validate() error {
	if p.Client == nil || p.Client.ID == 0 {
		return errors.New("client required")
	}
	return nil
}

func (p *Project) SetIdentifier(id *jsonapi.ResourceIdentifierObject) {
	if id == nil || id.Type != "project" {
		log.Error().Msgf("Project identifier object is invalid")
		return
	}
	if len(id.ID) == 0 {
		return
	}
	idInt, err := strconv.ParseInt(id.ID, 10, 64)
	if err != nil {
		log.Err(err).Msg("Project identifier is not a valid identifier")
		return
	}
	p.ID = int(idInt)
}

func (p *Project) GetIdentifier() *jsonapi.ResourceIdentifierObject {
	id := &jsonapi.ResourceIdentifierObject{
		Type: "project",
	}
	if p.ID != 0 {
		id.ID = strconv.Itoa(p.ID)
	}
	return id
}

type Filter struct {
	ID          *int    `form:"filter[id]"`
	Name        string  `form:"filter[name]"`
	ClientID    *int    `form:"filter[clientId]"`
	Description *string `form:"filter[description]"`
}

func (f *Filter) ToCriteria() filter.Criteria {
	criteria := filter.New()
	tableFilter := filter.NewTable("project")
	if f.ID != nil {
		criteria.And(tableFilter.Column("id").Eq(*f.ID))
	}
	if f.Name != "" {
		criteria = criteria.And(tableFilter.Column("name").
			ToLower().
			Like("%" + strings.ToLower(f.Name) + "%"))
	}
	if f.ClientID != nil {
		criteria.And(tableFilter.Column("clientId").Eq(*f.ClientID))
	}
	if f.Description != nil {
		criteria = criteria.And(tableFilter.Column("description").
			ToLower().
			Like("%" + strings.ToLower(*f.Description) + "%"))
	}
	return criteria
}

func NewHandler() jsonapi.ResourceHandler {
	return api.NewCRUDResourceHandler[*Project, *Filter](Projects, "/project")
}

func NewService(repository db.CRUDRepository[*Project, *Filter]) api.CRUDService[*Project, *Filter] {
	return api.NewCRUDService(repository)
}

func NewRepository() db.CRUDRepository[*Project, *Filter] {
	return api.NewCRUDRepository[*Project, *Filter](api.RepositoryParams{
		TableName:   "project",
		IDColumn:    "id",
		ColumnNames: []string{"name", "client_id", "description"},
		Joins: []statement.TableJoinDefinition{{
			Table: statement.ObjectName{
				Name: "client",
			},
			OnConditions: []string{"client.id = project.client_id"},
			SelectFields: []statement.ColumnExpression{
				{Name: "id", Alias: "Client.ID"},
				{Name: "name", Alias: "Client.Name"},
				{Name: "description", Alias: "Client.Description"},
			},
		}},
	})
}
