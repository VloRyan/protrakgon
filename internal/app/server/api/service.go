package api

import (
	"github.com/vloryan/go-libs/sqlx/pagination"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

type CRUDService[T any, F Filter] interface {
	Save(tx db.Transaction, item T) error
	GetAll(tx db.Transaction, page *pagination.Page, filter F) ([]T, error)
	GetByID(tx db.Transaction, id int) (T, error)
	Delete(tx db.Transaction, id int) error
}

func NewCRUDService[T any, F Filter](repo db.CRUDRepository[T, F]) CRUDService[T, F] {
	return &service[T, F]{
		repo: repo,
	}
}

type service[T any, F Filter] struct {
	repo db.CRUDRepository[T, F]
}

func (s service[T, F]) Save(tx db.Transaction, item T) error {
	if validater, ok := any(item).(Validater); ok {
		if err := validater.Validate(); err != nil {
			return err
		}
	}
	return s.repo.Save(tx, item)
}

func (s service[T, F]) GetAll(tx db.Transaction, page *pagination.Page, filter F) ([]T, error) {
	return s.repo.GetAll(tx, page, filter)
}

func (s service[T, F]) GetByID(tx db.Transaction, id int) (T, error) {
	return s.repo.GetByID(tx, id)
}

func (s service[T, F]) Delete(tx db.Transaction, id int) error {
	return s.repo.Delete(tx, id)
}
