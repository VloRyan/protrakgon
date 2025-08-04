package project

import (
	"encoding/csv"
	"io"
	"strconv"
	"time"
)

func WriteAsCSV(writer io.Writer, slots []*Slot) error {
	csvWriter := csv.NewWriter(writer)
	if err := csvWriter.Write([]string{"id", "projectId", "activity", "start", "end", "description"}); err != nil {
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
		data := []string{strconv.Itoa(slot.ID), strconv.Itoa(slot.ProjectID), activityToString(slot.Activity), slot.Start.Format(time.RFC3339), end, description}
		if err := csvWriter.Write(data); err != nil {
			return err
		}
	}
	csvWriter.Flush()
	return nil
}

func activityToString(activity Activity) string {
	switch activity {
	case ActivityBreak:
		return "break"
	case ActivityWork:
		return "work"
	}
	return ""
}
