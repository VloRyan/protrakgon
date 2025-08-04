package project

import (
	"errors"
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/go-libs/sqlx/pagination"
	"github.com/vloryan/protrakgon/internal/app/client"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

type Project struct {
	ID          int            `json:"id,omitempty"`
	Name        string         `json:"name,omitempty"`
	Client      *client.Client `json:"client,omitempty"`
	Description *string        `json:"description,omitempty"`
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

type Service interface {
	Save(tx db.Transaction, project *Project) error
	GetByID(tx db.Transaction, id int) (*Project, error)
	GetAll(tx db.Transaction, page *pagination.Page, filter *Filter) ([]*Project, error)
	Delete(tx db.Transaction, id int) error
}

func NewService(repository db.CRUDRepository[*Project, *Filter]) Service {
	return &service{repo: repository}
}

type service struct {
	repo db.CRUDRepository[*Project, *Filter]
}

func (d *service) Save(tx db.Transaction, project *Project) error {
	return d.repo.Save(tx, project)
}

func (d *service) GetByID(tx db.Transaction, projectID int) (*Project, error) {
	return d.repo.GetByID(tx, projectID)
}

func (d *service) GetAll(tx db.Transaction, page *pagination.Page, filter *Filter) ([]*Project, error) {
	return d.repo.GetAll(tx, page, filter)
}

func (d *service) Delete(tx db.Transaction, id int) error {
	return d.repo.Delete(tx, id)
}

type Repository struct{}

func NewRepository() db.CRUDRepository[*Project, *Filter] {
	return &Repository{}
}

func (r *Repository) Save(tx db.Transaction, item *Project) error {
	if item.ID == 0 {
		stmt := `INSERT INTO project (name, client_id, description) 
				  VALUES (:name, :client.id, :description)`

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
		stmt := `UPDATE project 
				    SET
						name 		= :name, 
						client_id = :client.id,
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

func (r *Repository) GetByID(tx db.Transaction, projectID int) (*Project, error) {
	project := &Project{}
	stmt := `SELECT id, name, client_id AS ` + "`client.id`" + `, description
			   FROM project 
			  WHERE id = :id`

	if err := tx.Select(project, stmt, map[string]any{"id": projectID}); err != nil {
		return nil, err
	}
	if project.ID == 0 {
		return nil, nil
	}
	return project, nil
}

func (r *Repository) GetAll(tx db.Transaction, page *pagination.Page, filter *Filter) ([]*Project, error) {
	items := make([]*Project, 0, 10)
	stmt := `SELECT id, name, client_id AS ` + "`client.id`" + `, description 
             FROM project`
	countStmt := `SELECT COUNT(*) AS total_count 
				    FROM project`

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
             FROM project
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
	if filter.ClientID != nil {
		m["clientId"] = *filter.ClientID
		parts = append(parts, "clientId = :clientId")
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
