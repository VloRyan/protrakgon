package client

import (
	"errors"
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/go-libs/sqlx/pagination"
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

type Service interface {
	Save(tx db.Transaction, item *Client) error
	GetByID(tx db.Transaction, id int) (*Client, error)
	GetAll(tx db.Transaction, page *pagination.Page, filter *Filter) ([]*Client, error)
	Delete(tx db.Transaction, id int) error
}

func NewService(repository db.CRUDRepository[*Client, *Filter]) Service {
	return &service{repo: repository}
}

type service struct {
	repo db.CRUDRepository[*Client, *Filter]
}

func (d *service) Save(tx db.Transaction, item *Client) error {
	return d.repo.Save(tx, item)
}

func (d *service) GetByID(tx db.Transaction, id int) (*Client, error) {
	return d.repo.GetByID(tx, id)
}

func (d *service) GetAll(tx db.Transaction, page *pagination.Page, filter *Filter) ([]*Client, error) {
	return d.repo.GetAll(tx, page, filter)
}

func (d *service) Delete(tx db.Transaction, id int) error {
	return d.repo.Delete(tx, id)
}

type Repository struct{}

func NewRepository() db.CRUDRepository[*Client, *Filter] {
	return &Repository{}
}

func (r *Repository) Save(tx db.Transaction, item *Client) error {
	if item.ID == 0 {
		stmt := `INSERT INTO client (name, description) 
				  VALUES (:name, :description)`

		result, err := tx.Exec(stmt, item)
		if err != nil {
			return err
		}
		id, err := result.LastInsertId()
		if err != nil {
			return err
		}
		item.ID = int(id)
		return nil
	} else {
		stmt := `UPDATE client 
				    SET
						name = :name, 
						description = :description
				  WHERE 
				        id = :id`

		result, err := tx.Exec(stmt, item)
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

func (r *Repository) GetByID(tx db.Transaction, id int) (*Client, error) {
	item := &Client{}
	stmt := `SELECT id, name, description 
			   FROM client 
			  WHERE id = :id`

	if err := tx.Select(item, stmt, map[string]any{"id": id}); err != nil {
		return nil, err
	}
	if item.ID == 0 {
		return nil, nil
	}
	return item, nil
}

func (r *Repository) GetAll(tx db.Transaction, page *pagination.Page, filter *Filter) ([]*Client, error) {
	items := make([]*Client, 0, 10)
	stmt := `SELECT id, name, description 
             FROM client`
	countStmt := `SELECT COUNT(*) AS total_count 
				    FROM client`

	whereClause, whereParams := r.toWhereClause(filter)
	selectParams := make(map[string]any)
	for k, v := range whereParams {
		selectParams[k] = v
	}
	if len(whereClause) > 0 {
		stmt += "\n" + whereClause
		countStmt += "\n" + whereClause
	}
	if page.Limit != -1 {
		stmt += "\nLIMIT :limit"
		selectParams["limit"] = page.Limit
		if page.Offset != 0 {
			stmt += "\nOFFSET :offset"
			selectParams["offset"] = page.Offset * page.Limit
		}
	}
	if len(whereClause) > 0 {
		if err := tx.Select(page, countStmt, whereParams); err != nil {
			return nil, err
		}
	} else {
		if err := tx.Select(page, countStmt); err != nil {
			return nil, err
		}
	}

	if err := tx.Select(&items, stmt, selectParams); err != nil {
		return nil, err
	}
	return items, nil
}

func (r *Repository) Delete(tx db.Transaction, id int) error {
	stmt := `DELETE 
             FROM client
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

func (r *Repository) toWhereClause(filter *Filter) (string, map[string]any) {
	clause := ""
	parts := make([]string, 0, 10)
	m := make(map[string]any)
	if filter.ID != nil {
		m["id"] = filter.ID
		parts = append(parts, "id = :id")
	}
	if filter.Name != "" {
		m["name"] = "%" + strings.ToLower(filter.Name) + "%"
		parts = append(parts, "name LIKE :name")
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
