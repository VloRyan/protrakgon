package db

import (
	"database/sql"
)

// Transaction is an interface that models the standard sql transaction.
// To ensure `TxFunc` funcs cannot commit or rollback a transaction those methods are not included here.
type Transaction interface {
	Select(dest any, query string, args ...any) error
	Exec(query string, args ...any) (sql.Result, error)
}
type (
	TxFunc     func(tx Transaction) error
	Connection interface {
		Transaction
		DoTransaction(txFunc TxFunc) error
		Close() error
	}
)
