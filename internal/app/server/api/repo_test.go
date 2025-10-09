package api

import (
	"fmt"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/stretchr/testify/assert"
)

type entity struct {
	ID int
}

type testItem struct {
	Field        string
	FieldWithTag string `db:"otherName"`
	unexported   string //nolint:unused
	Entity       entity
	EntityPtr    *entity
}

func Test_extractParamNames(t *testing.T) {
	tests := []struct {
		name    string
		columns []string
		want    []string
		wantErr assert.ErrorAssertionFunc
	}{
		{
			name:    "Exact name",
			columns: []string{"Field"},
			want:    []string{"Field"},
			wantErr: assert.NoError,
		}, {
			name:    "Lower name",
			columns: []string{"field"},
			want:    []string{"Field"},
			wantErr: assert.NoError,
		}, {
			name:    "DB tag",
			columns: []string{"otherName"},
			want:    []string{"FieldWithTag"},
			wantErr: assert.NoError,
		}, {
			name:    "Nested entity",
			columns: []string{"entity_id"},
			want:    []string{"Entity.id"},
			wantErr: assert.NoError,
		}, {
			name:    "Nested entityPtr",
			columns: []string{"entityptr_id"},
			want:    []string{"EntityPtr.id"},
			wantErr: assert.NoError,
		}, {
			name:    "No match",
			columns: []string{"any"},
			want:    nil,
			wantErr: assert.Error,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := extractParamNames(tt.columns, testItem{})
			if !tt.wantErr(t, err, fmt.Sprintf("extractParamNames(%v)", tt.columns)) {
				return
			}
			if diff := cmp.Diff(tt.want, got); diff != "" {
				t.Errorf("extractParamNames() mismatch (-want +got):\n%s", diff)
			}
		})
	}
}
