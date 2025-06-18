package db

import (
	"errors"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/source"
)

type MigrationInfo struct {
	CurrentVersion  uint
	MigratedVersion uint
}

func (m *MigrationInfo) Migrated() bool {
	return m.MigratedVersion != m.CurrentVersion
}

func DoMigration(driver database.Driver, sourceName string, sourceInstance source.Driver) (*MigrationInfo, error) {
	migrations, err := migrate.NewWithInstance(sourceName, sourceInstance, "", driver)
	if err != nil {
		return nil, err
	}
	versionBefore, _, err := migrations.Version()
	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		return nil, err
	}
	if err := migrations.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return nil, err
	}
	versionAfter, _, err := migrations.Version()
	if err != nil {
		return nil, err
	}
	return &MigrationInfo{CurrentVersion: versionAfter, MigratedVersion: versionBefore}, nil
}
