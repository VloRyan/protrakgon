package db

import "github.com/vloryan/go-libs/sqlx/pagination"

type CRUDRepository[T any, F any] interface {
	Save(tx Transaction, item T) error
	GetByID(tx Transaction, id int) (T, error)
	GetAll(tx Transaction, page *pagination.Page, filter F) ([]T, error)
	Delete(tx Transaction, id int) error
}
