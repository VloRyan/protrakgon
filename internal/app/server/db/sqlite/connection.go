package sqlite

import (
	"errors"
	"fmt"
	"strings"

	"github.com/mattn/go-sqlite3"
	"github.com/vloryan/go-libs/sqlx"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

type Connection struct {
	*sqlx.DB
}

func NewConnection(fileName string) (*Connection, error) {
	d, err := sqlx.Open("sqlite3", fileName)
	if err != nil {
		return nil, err
	}
	return &Connection{DB: d}, nil
}

func (c *Connection) DoTransaction(txFunc db.TxFunc) error {
	return WithTransaction(c.DB, txFunc)
}

// WithTransaction creates a new transaction and handles rollback/commit based on the
// error object returned by the `TxFunc`
func WithTransaction(db *sqlx.DB, fn db.TxFunc) (err error) {
	tx, err := db.Begin()
	if err != nil {
		return
	}

	defer func() {
		if p := recover(); p != nil {
			// a panic occurred, rollback and re-panic
			_ = tx.Rollback()
			panic(p)
		} else if err != nil {
			// something went wrong, rollback
			_ = tx.Rollback()
		} else {
			// all good, commit
			err = tx.Commit()
		}
	}()

	err = fn(tx)
	if err == nil {
		err = checkForeignKey(tx)
	}
	return err
}

type foreignKeyCheck struct {
	Table  string
	RowID  int
	Parent string
	FkID   int
}

func checkForeignKey(tx *sqlx.Transaction) error {
	var violations []string
	var results []*foreignKeyCheck
	err := tx.Select(&results, "PRAGMA foreign_key_check;")
	if err != nil {
		return err
	}
	for _, result := range results {
		violations = append(violations, fmt.Sprintf("{Table: %s, RowId: %d, Parent: %s, FkId: %d}",
			result.Table, result.RowID, result.Parent, result.FkID))
	}

	if len(violations) > 0 {
		return fmt.Errorf("foreign_key_check failed:%s", strings.Join(violations, ", "))
	}
	return nil
}

func IsFkConstraintFailed(err error) bool {
	var sqliteErr sqlite3.Error
	if errors.As(err, &sqliteErr) {
		return errors.Is(sqliteErr.Code, sqlite3.ErrConstraint)
	}
	return false
}
