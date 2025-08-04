package project

import (
	"bytes"
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
	"github.com/vloryan/go-libs/testhelper"
)

func TestWriteAsCSV(t *testing.T) {
	tests := []struct {
		name    string
		slots   []*Slot
		want    string
		wantErr bool
	}{{
		name: "GIVEN open slot THEN write as csv with empty end and desc",
		slots: []*Slot{
			{
				ID:        0,
				ProjectID: 1,
				Activity:  ActivityWork,
				Start:     testhelper.FixedNow,
			},
		},
		want: `id,projectId,activity,start,end,description
0,1,work,` + testhelper.FixedNow.Format(time.RFC3339) + `,,
`,
	}, {
		name: "GIVEN closed slot THEN write as csv with empty desc",
		slots: []*Slot{
			{
				ID:        1,
				ProjectID: 2,
				Activity:  ActivityBreak,
				Start:     testhelper.FixedNow.Add(1 * time.Minute),
				End:       testhelper.Ptr(testhelper.FixedNow.Add(3 * time.Minute)),
			},
		},
		want: `id,projectId,activity,start,end,description
1,2,break,` + testhelper.FixedNow.Add(1*time.Minute).Format(time.RFC3339) + `,` + testhelper.FixedNow.Add(3*time.Minute).Format(time.RFC3339) + `,
`,
	}, {
		name: "GIVEN slot with desc THEN write as csv with  desc",
		slots: []*Slot{
			{
				ID:          2,
				ProjectID:   3,
				Activity:    ActivityBreak,
				Start:       testhelper.FixedNow,
				Description: testhelper.Ptr("desc"),
			},
		},
		want: `id,projectId,activity,start,end,description
2,3,break,` + testhelper.FixedNow.Format(time.RFC3339) + `,,desc
`,
	}, {
		name: "GIVEN multiple slots THEN write as csv with multiple lines",
		slots: []*Slot{
			{
				ID:        1,
				ProjectID: 2,
				Activity:  ActivityBreak,
				Start:     testhelper.FixedNow,
			},
			{
				ID:        2,
				ProjectID: 3,
				Activity:  ActivityBreak,
				Start:     testhelper.FixedNow,
			},
			{
				ID:        3,
				ProjectID: 4,
				Activity:  ActivityBreak,
				Start:     testhelper.FixedNow,
			},
		},
		want: `id,projectId,activity,start,end,description
1,2,break,` + testhelper.FixedNow.Format(time.RFC3339) + `,,
2,3,break,` + testhelper.FixedNow.Format(time.RFC3339) + `,,
3,4,break,` + testhelper.FixedNow.Format(time.RFC3339) + `,,
`,
	}}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			writer := &bytes.Buffer{}
			err := WriteAsCSV(writer, tt.slots)
			if (err != nil) != tt.wantErr {
				t.Fatalf("WriteAsCSV() error = %v, wantErr %v", err, tt.wantErr)
			}
			got := writer.String()
			if diff := cmp.Diff(tt.want, got); diff != "" {
				t.Errorf("WriteAsCSV() mismatch (-want +got):\n%s", diff)
			}
		})
	}
}
