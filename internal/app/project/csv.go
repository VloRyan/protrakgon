package project

import (
	"encoding/csv"
	"io"
	"strconv"
	"time"
)

func WriteAsCSV(writer io.Writer, slots []*Slot) error {
	csvWriter := csv.NewWriter(writer)
	if err := csvWriter.Write([]string{"id", "start", "end", "activityName", "description", "billable", "amount"}); err != nil {
		return err
	}
	for _, slot := range slots {
		end := ""
		if slot.End != nil {
			end = slot.End.Format(time.RFC3339)
		}
		description := ""
		if slot.Description != nil {
			description = *slot.Description
		}
		data := []string{strconv.Itoa(slot.ID), slot.Start.Format(time.RFC3339), end, slot.Activity.Name, description, strconv.FormatBool(slot.Activity.Billable), strconv.FormatFloat(slot.Activity.Amount, 'f', 2, 64)}
		if err := csvWriter.Write(data); err != nil {
			return err
		}
	}
	csvWriter.Flush()
	return nil
}
