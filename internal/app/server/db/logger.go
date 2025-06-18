package db

import (
	"database/sql"
	"fmt"
	"reflect"

	"github.com/rs/zerolog/log"
)

type StatementLogger struct {
	db Connection
}

func (s StatementLogger) Close() error {
	log.Debug().Msg("Close")
	return s.db.Close()
}

func (s StatementLogger) DoTransaction(txFunc TxFunc) error {
	log.Debug().Msg("Begin transaction")
	err := s.db.DoTransaction(func(tx Transaction) error {
		logger := &statementLoggerTX{tx: tx}
		return txFunc(logger)
	})
	log.Debug().Msg("End transaction")
	return err
}

func WithStatementLogger(db Connection) Connection {
	return &StatementLogger{db: db}
}

func (s StatementLogger) Exec(query string, args ...any) (sql.Result, error) {
	log.Debug().Str("Query", query).Str("args", printArgs(args)).Msg("Exec")
	return s.db.Exec(query, args...)
}

func (s StatementLogger) Select(dest any, query string, args ...any) error {
	log.Debug().Str("Query", query).Str("args", printArgs(args)).Msg("Select")
	return s.db.Select(dest, query, args...)
}

type statementLoggerTX struct {
	tx Transaction
}

func (s *statementLoggerTX) Select(dest any, query string, args ...any) error {
	log.Debug().Str("Query", query).Str("args", printArgs(args)).Msg("  Select")
	return s.tx.Select(dest, query, args...)
}

func (s *statementLoggerTX) Exec(query string, args ...any) (sql.Result, error) {
	log.Debug().Str("Query", query).Str("args", printArgs(args)).Msg("  Exec")
	return s.tx.Exec(query, args...)
}

func printArgs(args []any) string {
	values := ""
	for _, arg := range args {
		if values != "" {
			values += ", "
		}
		v := reflect.ValueOf(arg)
		if v.Kind() == reflect.Slice || v.Kind() == reflect.Array && v.Len() > 5 {
			values += "[...]"
			continue
		}
		if v.Kind() == reflect.Struct || v.Kind() == reflect.Ptr && v.Elem().Kind() == reflect.Struct {
			values += v.Type().String() + "{...}"
			continue
		}
		values += fmt.Sprintf("%+v", arg)
	}
	return "[" + values + "]"
}
