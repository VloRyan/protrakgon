package sqlite

import (
	"github.com/golang-migrate/migrate/v4/database"
	migrateSqlite "github.com/golang-migrate/migrate/v4/database/sqlite3"
)

func MigrateDriver(db *Connection) (database.Driver, error) {
	return migrateSqlite.WithInstance(db.DB.DB, &migrateSqlite.Config{})
}
