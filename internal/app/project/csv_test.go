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
		name     string
		bookings []*Booking
		wantErr  bool
	}{{
		name: "GIVEN open booking THEN write as csv with empty end and desc",
		bookings: []*Booking{
			{
				ID:       0,
				Activity: activityWork,
				Start:    testhelper.FixedNow,
			},
		},
	}, {
		name: "GIVEN closed booking THEN write as csv with empty desc",
		bookings: []*Booking{
			{
				ID:       1,
				Activity: activityBreak,
				Start:    testhelper.FixedNow.Add(1 * time.Minute),
				End:      testhelper.Ptr(testhelper.FixedNow.Add(3 * time.Minute)),
			},
		},
	}, {
		name: "GIVEN booking with desc THEN write as csv with  desc",
		bookings: []*Booking{
			{
				ID:          2,
				Project:     &Project{ID: 3},
				Activity:    activityBreak,
				Start:       testhelper.FixedNow,
				Description: testhelper.Ptr("desc"),
			},
		},
	}, {
		name: "GIVEN multiple bookings THEN write as csv with multiple lines",
		bookings: []*Booking{
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
			err := WriteAsCSV(writer, tt.bookings)
			if (err != nil) != tt.wantErr {
				t.Fatalf("WriteAsCSV() error = %v, wantErr %v", err, tt.wantErr)
			}
			want := header()
			for _, booking := range tt.bookings {
				want += toLine(booking)
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

func asLine(data []string) string {
	return strings.Join(data, ",") + "\n"
}

func asString(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

func toLine(booking *Booking) string {
	var end string
	if booking.End != nil {
		end = booking.End.Format(time.RFC3339)
	}
	return asLine([]string{
		strconv.Itoa(booking.ID),
		booking.Start.Format(time.RFC3339),
		end,
		booking.Activity.Name,
		asString(booking.Description),
		strconv.FormatBool(booking.Activity.Billable),
		strconv.FormatFloat(booking.Activity.Amount, 'f', 2, 64),
	})
}
