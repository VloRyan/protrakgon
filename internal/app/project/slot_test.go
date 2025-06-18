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
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

var (
	defaultProjectID = 1
	defaultOpenSlot  = &Slot{
		ID:        2,
		ProjectID: defaultProjectID,
		Activity:  ActivityWork,
		Start:     testhelper.FixedNow.Truncate(time.Minute),
	}
)
var defaultClosedSlot = &Slot{
	ID:        1,
	ProjectID: defaultProjectID,
	Activity:  ActivityWork,
	Start:     testhelper.FixedNow.Truncate(time.Minute).Add(time.Hour * -24),
	End:       testhelper.Ptr(testhelper.FixedNow.Truncate(time.Minute).Add(time.Hour * -1)),
}

type inMemSlotRepository struct {
	Slots      []*Slot
	SavedSlots []*Slot
}

func (r *inMemSlotRepository) Save(_ db.Transaction, item *Slot) error {
	if item.ID == 0 {
		item.ID = len(r.Slots) + 1
	}
	r.Slots = append(r.Slots, item)
	r.SavedSlots = append(r.SavedSlots, item)
	return nil
}

func (r *inMemSlotRepository) GetByID(_ db.Transaction, id int) (*Slot, error) {
	return r.Slots[id], nil
}

func (r *inMemSlotRepository) GetAll(_ db.Transaction, _ *pagination.Page, filter *SlotFilter) ([]*Slot, error) {
	var matchingSlot []*Slot
	for _, slot := range r.Slots {
		if filter.ProjectID != nil && slot.ProjectID != *filter.ProjectID {
			continue
		}
		if filter.Activity != nil && slot.Activity != *filter.Activity {
			continue
		}
		if filter.StartTime != nil && !r.match(slot.Start, filter.StartTimeComparator, *filter.StartTime) {
			continue
		}
		if filter.EndTime != nil {
			if slot.End == nil || !r.match(*slot.End, filter.EndTimeComparator, *filter.EndTime) {
				continue
			}
		} else {
			if slot.End != nil {
				continue
			}
		}
		matchingSlot = append(matchingSlot, slot)
	}
	return matchingSlot, nil
}

func (r *inMemSlotRepository) Delete(_ db.Transaction, id int) error {
	r.Slots = slices.Delete(r.Slots, id, id)
	return nil
}

func (r *inMemSlotRepository) match(a time.Time, c CompareOperator, b time.Time) bool {
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
	slots []*Slot
}

func buildScenario(g scenario) (SlotService, *inMemSlotRepository) {
	repo := &inMemSlotRepository{
		Slots: g.slots,
	}
	return &slotService{
		slotRepo: repo,
		now: func() time.Time {
			return testhelper.FixedNow
		},
	}, repo
}

func TestDefaultService_Start(t *testing.T) {
	tests := []struct {
		name string
		slot *Slot
		want *Slot
	}{{
		name: "GIVEN slot with projectId and activity THEN set start",
		slot: &Slot{
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
		},
		want: &Slot{
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     testhelper.FixedNow.Truncate(time.Minute),
		},
	}, {
		name: "GIVEN slot with start THEN override start",
		slot: &Slot{
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     time.Time{}.Add(time.Hour * 24),
		},
		want: &Slot{
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     testhelper.FixedNow.Truncate(time.Minute),
		},
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &slotService{
				now: func() time.Time {
					return testhelper.FixedNow
				},
			}
			s.Start(tt.slot)

			if !reflect.DeepEqual(tt.slot, tt.want) {
				t.Errorf("Start() = %v, want %v", tt.slot, tt.want)
			}
		})
	}
}

func TestDefaultService_GetOpenSlot(t *testing.T) {
	tests := []struct {
		name      string
		given     scenario
		projectID int
		want      *Slot
		wantErr   bool
	}{{
		name: "GIVEN open slot THEN return open slot",
		given: scenario{
			slots: []*Slot{defaultOpenSlot},
		},
		projectID: defaultProjectID,
		want:      defaultOpenSlot,
		wantErr:   false,
	}, {
		name: "GIVEN closed slot THEN return nil",
		given: scenario{
			slots: []*Slot{defaultClosedSlot},
		},
		projectID: defaultProjectID,
		want:      nil,
		wantErr:   false,
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s, _ := buildScenario(tt.given)

			got, err := s.GetOpenSlot(nil, tt.projectID)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetOpenSlot() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("GetOpenSlot() got = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestDefaultService_Save(t *testing.T) {
	tests := []struct {
		name    string
		given   scenario
		slot    *Slot
		want    *Slot
		wantErr error
	}{{
		name:  "GIVEN open slot and empty database THEN save slot truncated to minutes",
		given: scenario{},
		slot: &Slot{
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     testhelper.FixedNow,
		},
		want: &Slot{
			ID:        1,
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     testhelper.FixedNow.Truncate(time.Minute),
		},
	}, {
		name:  "GIVEN open slot and open slot in database THEN throw ErrOpenSlotExists",
		given: scenario{slots: []*Slot{defaultOpenSlot}},
		slot: &Slot{
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     testhelper.FixedNow,
		},
		wantErr: ErrOpenSlotExists,
	}, {
		name: "GIVEN open slot and same open slot in database THEN save slot",
		given: scenario{slots: []*Slot{{
			ID:        7,
			ProjectID: defaultProjectID,
			Activity:  ActivityBreak,
			Start:     testhelper.FixedNow,
		}}},
		slot: &Slot{
			ID:        7,
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     testhelper.FixedNow.Add(4 * time.Minute),
		},
		want: &Slot{
			ID:        7,
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     testhelper.FixedNow.Truncate(time.Minute).Add(4 * time.Minute),
		},
	}, {
		name:  "GIVEN slot with end before start THEN throw ErrSlotEndsBeforeStart",
		given: scenario{slots: []*Slot{defaultOpenSlot}},
		slot: &Slot{
			ProjectID: defaultProjectID,
			Activity:  ActivityWork,
			Start:     testhelper.FixedNow,
			End:       testhelper.Ptr(testhelper.FixedNow.Add(time.Hour * -24)),
		},
		wantErr: ErrSlotEndsBeforeStart,
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s, repo := buildScenario(tt.given)
			if err := s.Save(nil, tt.slot); !errors.Is(err, tt.wantErr) {
				t.Fatalf("Save() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr == nil {
				if diff := cmp.Diff(tt.want, repo.SavedSlots[0]); diff != "" {
					t.Errorf("Save() mismatch (-want +got):\n%s", diff)
				}
			}
		})
	}
}
