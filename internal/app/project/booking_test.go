package project

import (
	"errors"
	"reflect"
	"slices"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/vloryan/go-libs/sqlx/pagination"
	"github.com/vloryan/go-libs/testhelper"
	"github.com/vloryan/protrakgon/internal/app/server/api"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

var (
	defaultProject = &Project{
		ID:   1,
		Name: "Default",
	}
	activityWork = &Activity{
		ID:       1,
		Project:  defaultProject,
		Unit:     ActivityUnitTime,
		Billable: true,
		Name:     "Work",
	}
	defaultOpenBooking = &Booking{
		ID:       2,
		Project:  defaultProject,
		Activity: activityWork,
		Start:    testhelper.FixedNow.Truncate(time.Minute),
		Amount:   -1,
	}
)

var defaultClosedBooking = &Booking{
	ID:       1,
	Project:  defaultProject,
	Activity: activityWork,
	Start:    testhelper.FixedNow.Truncate(time.Minute).Add(time.Hour * -24),
	End:      testhelper.Ptr(testhelper.FixedNow.Truncate(time.Minute).Add(time.Hour * -1)),
	Amount:   60,
}

type inMemBookingRepository struct {
	Bookings      []*Booking
	SavedBookings []*Booking
}

func (r *inMemBookingRepository) Save(_ db.Transaction, item *Booking) error {
	if item.ID == 0 {
		item.ID = len(r.Bookings) + 1
	}
	r.Bookings = append(r.Bookings, item)
	r.SavedBookings = append(r.SavedBookings, item)
	return nil
}

func (r *inMemBookingRepository) GetByID(_ db.Transaction, id int) (*Booking, error) {
	return r.Bookings[id], nil
}

func (r *inMemBookingRepository) GetAll(_ db.Transaction, _ *pagination.Page, filter *BookingFilter) ([]*Booking, error) {
	var matchingBooking []*Booking
	for _, booking := range r.Bookings {
		if filter.ProjectID != nil && booking.Project.ID != *filter.ProjectID {
			continue
		}
		if filter.ActivityID != nil && booking.Activity.ID != *filter.ActivityID {
			continue
		}
		if filter.From != nil && !r.match(booking.Start, filter.FromComparator, *filter.From) {
			continue
		}
		if filter.Until != nil {
			if booking.End == nil || !r.match(*booking.End, filter.UntilComparator, *filter.Until) {
				continue
			}
		} else {
			if booking.End != nil {
				continue
			}
		}
		matchingBooking = append(matchingBooking, booking)
	}
	return matchingBooking, nil
}

func (r *inMemBookingRepository) Delete(_ db.Transaction, id int) error {
	r.Bookings = slices.Delete(r.Bookings, id, id)
	return nil
}

func (r *inMemBookingRepository) match(a time.Time, c CompareOperator, b time.Time) bool {
	switch c {
	case CompareOperatorEqual:
		return a.Equal(b)
	case CompareOperatorNotEqual:
		return a != b
	case CompareOperatorGreaterThan:
		return a.After(b)
	case CompareOperatorGreaterThanOrEqual:
		return a.Equal(b) || a.After(b)
	case CompareOperatorLessThan:
		return a.Before(b)
	case CompareOperatorLessThanOrEqual:
		return a.Equal(b) || a.After(b)
	}
	return false
}

type scenario struct {
	bookings   []*Booking
	activities []*Activity
}
type activityServiceMock struct {
	Content []*Activity
}

func (a *activityServiceMock) Save(tx db.Transaction, item *Activity) error {
	a.Content = append(a.Content, item)
	return nil
}

func (a *activityServiceMock) GetAll(tx db.Transaction, page *pagination.Page, filter *ActivityFilter) ([]*Activity, error) {
	return a.Content, nil
}

func (a *activityServiceMock) GetByID(tx db.Transaction, id int) (*Activity, error) {
	for _, activity := range a.Content {
		if activity.ID == id {
			return activity, nil
		}
	}
	return nil, nil
}

func (a *activityServiceMock) Delete(tx db.Transaction, id int) error {
	for i, activity := range a.Content {
		if activity.ID == id {
			a.Content = append(a.Content[:i], a.Content[i+1:]...)
		}
	}
	return nil
}

func buildScenario(g scenario) (BookingService, *inMemBookingRepository) {
	repo := &inMemBookingRepository{
		Bookings: g.bookings,
	}
	return &bookingService{
		CRUDService: api.NewCRUDService(repo),
		now: func() time.Time {
			return testhelper.FixedNow
		},
		activityService: &activityServiceMock{Content: g.activities},
	}, repo
}

/*
func TestDefaultService_Start(t *testing.T) {
	tests := []struct {
		name string
		booking *Booking
		want *Booking
	}{{
		name: "GIVEN booking with projectId and activity THEN set start",
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
		},
		want: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow.Truncate(time.Minute),
		},
	}, {
		name: "GIVEN booking with start THEN override start",
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    time.Time{}.Add(time.Hour * 24),
		},
		want: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow.Truncate(time.Minute),
		},
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &bookingService{
				now: func() time.Time {
					return testhelper.FixedNow
				},
			}
			tt.booking.Start=

			if !reflect.DeepEqual(tt.booking, tt.want) {
				t.Errorf("Start() = %v, want %v", tt.booking, tt.want)
			}
		})
	}
}
*/

func TestDefaultService_GetOpenBooking(t *testing.T) {
	tests := []struct {
		name      string
		given     scenario
		projectID int
		want      *Booking
		wantErr   bool
	}{{
		name: "GIVEN open booking THEN return open booking",
		given: scenario{
			bookings: []*Booking{defaultOpenBooking},
		},
		projectID: defaultProject.ID,
		want:      defaultOpenBooking,
		wantErr:   false,
	}, {
		name: "GIVEN closed booking THEN return nil",
		given: scenario{
			bookings: []*Booking{defaultClosedBooking},
		},
		projectID: defaultProject.ID,
		want:      nil,
		wantErr:   false,
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s, _ := buildScenario(tt.given)

			got, err := s.GetOpenBooking(nil, tt.projectID)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetOpenBooking() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetOpenBooking() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func timeZone(name string) *time.Location {
	t, err := time.LoadLocation(name)
	if err != nil {
		panic(err)
	}
	return t
}

func TestDefaultService_Save(t *testing.T) {
	tests := []struct {
		name    string
		given   scenario
		booking *Booking
		want    []*Booking
		wantErr error
	}{{
		name:  "GIVEN open booking and empty database THEN save booking truncated to minutes",
		given: scenario{activities: []*Activity{activityWork}},
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow,
			Amount:   -1,
		},
		want: []*Booking{{
			ID:       1,
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow.Truncate(time.Minute),
			Amount:   -1,
		}},
	}, {
		name:  "GIVEN open booking and open booking in database THEN throw ErrOpenBookingExists",
		given: scenario{bookings: []*Booking{defaultOpenBooking}, activities: []*Activity{activityWork}},
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow,
			Amount:   -1,
		},
		wantErr: ErrOpenBookingExists,
	}, {
		name: "GIVEN open booking and same open booking in database THEN save booking",
		given: scenario{bookings: []*Booking{{
			ID:       7,
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow,
			Amount:   -1,
		}}, activities: []*Activity{activityWork}},
		booking: &Booking{
			ID:       7,
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow.Add(4 * time.Minute),
			Amount:   -1,
		},
		want: []*Booking{{
			ID:       7,
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow.Truncate(time.Minute).Add(4 * time.Minute),
			Amount:   -1,
		}},
	}, {
		name:  "GIVEN booking with end before start THEN throw ErrBookingEndsBeforeStart",
		given: scenario{bookings: []*Booking{defaultOpenBooking}, activities: []*Activity{activityWork}},
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow,
			End:      testhelper.Ptr(testhelper.FixedNow.Add(-24 * time.Hour)),
		},
		wantErr: ErrBookingEndsBeforeStart,
	}, {
		name:  "GIVEN booking with end on different day THEN throw illegalEnd",
		given: scenario{activities: []*Activity{activityWork}},
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow,
			End:      testhelper.Ptr(testhelper.FixedNow.Add(48 * time.Hour)),
		},
		wantErr: ErrBookingEndsOnDifferentDay,
	}, {
		name:  "GIVEN booking with end on different day only in UTC THEN save booking",
		given: scenario{activities: []*Activity{activityWork}},
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    time.Date(2026, 3, 2, 0, 0, 0, 0, timeZone("Europe/Berlin")),                 // UTC 23:00 on 2026-03-01
			End:      testhelper.Ptr(time.Date(2026, 3, 2, 1, 0, 0, 0, timeZone("Europe/Berlin"))), // UTC 00:00 on 2026-03-02
			Amount:   -1,
		},
		want: []*Booking{{
			ID:       1,
			Project:  defaultProject,
			Activity: activityWork,
			Start:    time.Date(2026, 3, 2, 0, 0, 0, 0, timeZone("Europe/Berlin")),
			End:      testhelper.Ptr(time.Date(2026, 3, 2, 1, 0, 0, 0, timeZone("Europe/Berlin"))),
			Amount:   60,
		}},
	}, {
		name:  "GIVEN booking with different timezones THEN throw differentTimezones",
		given: scenario{activities: []*Activity{activityWork}},
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    time.Date(2026, 3, 2, 0, 0, 0, 0, time.UTC),
			End:      testhelper.Ptr(time.Date(2026, 3, 2, 1, 0, 0, 0, timeZone("Europe/Berlin"))),
			Amount:   -1,
		},
		wantErr: ErrDifferentTimezones,
	}, {
		name: "GIVEN booking with unknown activity THEN throw unknownActivity",
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
		},
		wantErr: ErrUnknownActivity,
	}, {
		name:  "GIVEN booking with invalid amount THEN throw amountDiffToEnd",
		given: scenario{activities: []*Activity{activityWork}},
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow,
			End:      testhelper.Ptr(testhelper.FixedNow.Add(1 * time.Hour)), // 60
			Amount:   120,
		},
		wantErr: ErrAmountDiffToEnd,
	}, {
		name:  "GIVEN booking which ends on next day at exact midnight THEN save booking",
		given: scenario{activities: []*Activity{activityWork}},
		booking: &Booking{
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow,
			End:      testhelper.Ptr(testhelper.FixedNow.Truncate(24 * time.Hour).Add(24 * time.Hour)),
			Amount:   -1,
		},
		want: []*Booking{{
			ID:       1,
			Project:  defaultProject,
			Activity: activityWork,
			Start:    testhelper.FixedNow.Truncate(time.Minute),
			End:      testhelper.Ptr(testhelper.FixedNow.Truncate(24 * time.Hour).Add(24 * time.Hour)),
			Amount:   207,
		}},
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s, repo := buildScenario(tt.given)
			err := s.Save(nil, tt.booking)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Save() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr == nil {
				if diff := cmp.Diff(tt.want, repo.SavedBookings); diff != "" {
					t.Errorf("Save() mismatch in repo (-want +got):\n%s", diff)
				}
			}
		})
	}
}
