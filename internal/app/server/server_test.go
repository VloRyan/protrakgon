package server

import (
	"os"
	"testing"

	"github.com/vloryan/protrakgon/internal/app/server/db/sqlite"
)

const anyVersion = -1

func Test_performMigrations(t *testing.T) {
	tests := []struct {
		name        string
		wantVersion int
		wantErr     bool
	}{
		{name: "initial state", wantVersion: anyVersion},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv := Server{
				assets: os.DirFS("../../../assets"),
			}
			connection, err := sqlite.NewConnection(":memory:")
			if err != nil {
				t.Fatal(err)
			}
			info, err := srv.performMigrations(connection)
			if (err != nil) != tt.wantErr {
				t.Fatalf("performMigrations() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantVersion != anyVersion && info.CurrentVersion != uint(tt.wantVersion) {
				t.Errorf("performMigrations() currentVersion = %v, want %v", info.CurrentVersion, tt.wantVersion)
			}
		})
	}
}
