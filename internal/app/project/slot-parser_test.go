package project

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/vloryan/go-libs/testhelper"
)

func TestParseBookings(t *testing.T) {
	tests := []struct {
		name    string
		text    string
		want    []Booking
		wantErr bool
	}{{
		name: "one valid line",
		text: "2026-01-02\t20:15\t20:30\tTestActivity\ttest description",
		want: []Booking{{
			Activity: &Activity{
				Name: "TestActivity",
			},
			Start:       testhelper.ParseTime(nil, "2026-01-02T20:15:00Z"),
			End:         testhelper.Ptr(testhelper.ParseTime(nil, "2026-01-02T20:30:00Z")),
			Description: testhelper.Ptr("test description"),
		}},
	}, {
		name: "multi line",
		text: "2026-01-02\t20:15\t20:30\tTestActivity\ttest description\n" +
			"2026-01-03\t10:15\t10:30\tTestActivity2\ttest description2",
		want: []Booking{{
			Activity: &Activity{
				Name: "TestActivity",
			},
			Start:       testhelper.ParseTime(nil, "2026-01-02T20:15:00Z"),
			End:         testhelper.Ptr(testhelper.ParseTime(nil, "2026-01-02T20:30:00Z")),
			Description: testhelper.Ptr("test description"),
		}, {
			Activity: &Activity{
				Name: "TestActivity2",
			},
			Start:       testhelper.ParseTime(nil, "2026-01-03T10:15:00Z"),
			End:         testhelper.Ptr(testhelper.ParseTime(nil, "2026-01-03T10:30:00Z")),
			Description: testhelper.Ptr("test description2"),
		}},
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseBookings(tt.text)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParseBookings() error = %v, wantErr %v", err, tt.wantErr)
			}

			if diff := cmp.Diff(got, tt.want); diff != "" {
				t.Errorf("ParseBookings() mismatch (-want +got):\n%s", diff)
			}
		})
	}
}
