package project

import (
	"encoding/csv"
	"io"
	"strconv"
	"time"
)

func WriteAsCSV(writer io.Writer, bookings []*Booking) error {
	csvWriter := csv.NewWriter(writer)
	if err := csvWriter.Write([]string{"id", "start", "end", "activityName", "description", "billable", "amount"}); err != nil {
		return err
	}
	for _, booking := range bookings {
		end := ""
		if booking.End != nil {
			end = booking.End.Format(time.RFC3339)
		}
		description := ""
		if booking.Description != nil {
			description = *booking.Description
		}
		data := []string{strconv.Itoa(booking.ID),
			booking.Start.Format(time.RFC3339),
			end,
			booking.Activity.Name,
			description,
			strconv.FormatInt(int64(booking.Activity.BillableAmountUnit), 10),
			strconv.FormatFloat(booking.Activity.Amount, 'f', 2, 64)}
		if err := csvWriter.Write(data); err != nil {
			return err
		}
	}
	csvWriter.Flush()
	return nil
}
