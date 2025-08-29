package project

import (
	"bytes"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/vloryan/go-libs/testhelper"
)

var activityBreak = &Activity{
	ID:      2,
	Project: defaultProject,
	Name:    "Break",
}

func TestWriteAsCSV(t *testing.T) {
	tests := []struct {
		name    string
		slots   []*Slot
		wantErr bool
	}{{
		name: "GIVEN open slot THEN write as csv with empty end and desc",
		slots: []*Slot{
			{
				ID:       0,
				Activity: activityWork,
				Start:    testhelper.FixedNow,
			},
		},
	}, {
		name: "GIVEN closed slot THEN write as csv with empty desc",
		slots: []*Slot{
			{
				ID:       1,
				Activity: activityBreak,
				Start:    testhelper.FixedNow.Add(1 * time.Minute),
				End:      testhelper.Ptr(testhelper.FixedNow.Add(3 * time.Minute)),
			},
		},
	}, {
		name: "GIVEN slot with desc THEN write as csv with  desc",
		slots: []*Slot{
			{
				ID:          2,
				Project:     &Project{ID: 3},
				Activity:    activityBreak,
				Start:       testhelper.FixedNow,
				Description: testhelper.Ptr("desc"),
			},
		},
	}, {
		name: "GIVEN multiple slots THEN write as csv with multiple lines",
		slots: []*Slot{
			{
				ID:       1,
				Project:  &Project{ID: 2},
				Activity: activityBreak,
				Start:    testhelper.FixedNow,
			},
			{
				ID:       2,
				Project:  &Project{ID: 3},
				Activity: activityBreak,
				Start:    testhelper.FixedNow,
			},
			{
				ID:       3,
				Project:  &Project{ID: 4},
				Activity: activityBreak,
				Start:    testhelper.FixedNow,
			},
		},
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			writer := &bytes.Buffer{}
			err := WriteAsCSV(writer, tt.slots)
			if (err != nil) != tt.wantErr {
				t.Fatalf("WriteAsCSV() error = %v, wantErr %v", err, tt.wantErr)
			}
			want := header()
			for _, slot := range tt.slots {
				want += toLine(slot)
			}
			got := writer.String()
			if diff := cmp.Diff(want, got); diff != "" {
				t.Errorf("WriteAsCSV() mismatch (-want +got):\n%s", diff)
			}
		})
	}
}

func header() string {
	return "id,start,end,activityName,description,billable,amount\n"
}

type LineType struct {
	ID           int
	Start        time.Time
	End          *time.Time
	ActivityName string
	Description  string
	Billable     bool
	Amount       float64
}

func asLine(data []string) string {
	return strings.Join(data, ",") + "\n"
}

func asString(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

func toLine(slot *Slot) string {
	var end string
	if slot.End != nil {
		end = slot.End.Format(time.RFC3339)
	}
	return asLine([]string{
		strconv.Itoa(slot.ID),
		slot.Start.Format(time.RFC3339),
		end,
		slot.Activity.Name,
		asString(slot.Description),
		strconv.FormatBool(slot.Activity.Billable),
		strconv.FormatFloat(slot.Activity.Amount, 'f', 2, 64),
	})
}
