package project

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

func ParseBookings(text string) ([]Booking, error) {
	lines := strings.Split(text, "\n")
	bookings := make([]Booking, 0, len(lines))
	lineCount := 0
	for _, line := range lines {
		line = strings.TrimSpace(line)
		bookingLine, err := ParseBooking(line)
		if err != nil {
			return nil, fmt.Errorf("error parsing bookings at line %d: %w", lineCount+1, err)
		}
		bookings = append(bookings, bookingLine)
		lineCount++
	}
	return bookings, nil
}

func ParseBooking(csv string) (Booking, error) {
	values := strings.Split(csv, "\t")
	if len(values) != 5 {
		return Booking{}, errors.New("wrong number of values")
	}
	day, err := time.Parse("2006-01-02", values[0])
	if err != nil {
		return Booking{}, err
	}
	from, err := time.Parse("15:04", values[1])
	if err != nil {
		return Booking{}, err
	}
	until, err := time.Parse("15:04", values[2])
	if err != nil {
		return Booking{}, err
	}
	end := day.Add(time.Hour*time.Duration(until.Hour()) + time.Minute*time.Duration(until.Minute()))
	return Booking{
		Activity: &Activity{
			Name: values[3],
		},
		Start:       day.Add(time.Hour*time.Duration(from.Hour()) + time.Minute*time.Duration(from.Minute())),
		End:         &end,
		Description: &values[4],
	}, nil
}
