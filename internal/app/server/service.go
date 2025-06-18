package server

import (
	"github.com/vloryan/go-libs/sqlx/pagination"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

type CrudService[T any, F any] interface {
	Save(tx db.Transaction, item T) error
	GetAll(tx db.Transaction, page *pagination.Page, filter F) ([]T, error)
	GetByID(tx db.Transaction, id int) (T, error)
	Delete(tx db.Transaction, id int) error
}
