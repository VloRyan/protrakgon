package client

import (
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/go-libs/sqlx/filter"
	"github.com/vloryan/protrakgon/internal/app/server/api"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

type Client struct {
	ID          int     `json:"id,omitempty"`
	Name        string  `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}

func (p *Client) SetIdentifier(id *jsonapi.ResourceIdentifierObject) {
	if id == nil || id.Type != "client" {
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

func (p *Client) GetIdentifier() *jsonapi.ResourceIdentifierObject {
	id := &jsonapi.ResourceIdentifierObject{
		Type: "client",
	}
	if p.ID != 0 {
		id.ID = strconv.Itoa(p.ID)
	}
	return id
}

type Filter struct {
	ID          *int    `form:"filter[id]"`
	Name        string  `form:"filter[name]"`
	Description *string `form:"filter[description]"`
}

func (f *Filter) ToCriteria() filter.Criteria {
	criteria := filter.New()
	tableFilter := filter.NewTable("client")
	if f.ID != nil {
		criteria = criteria.And(tableFilter.Column("id").Eq(*f.ID))
	}
	if f.Name != "" {
		criteria = criteria.And(tableFilter.Column("name").
			ToLower().
			Like("%" + strings.ToLower(f.Name) + "%"))
	}
	if f.Description != nil {
		criteria = criteria.And(tableFilter.Column("description").
			ToLower().
			Like("%" + strings.ToLower(*f.Description) + "%"))
	}
	return criteria
}

func NewService(repository db.CRUDRepository[*Client, *Filter]) api.CRUDService[*Client, *Filter] {
	return api.NewCRUDService(repository)
}

func NewRepository() db.CRUDRepository[*Client, *Filter] {
	return api.NewCRUDRepository[*Client, *Filter](api.RepositoryParams{
		TableName:   "client",
		IDColumn:    "id",
		ColumnNames: []string{"name", "description"},
	})
}
