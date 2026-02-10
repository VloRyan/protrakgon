package project

import (
	"github.com/vloryan/go-libs/jsonapi"
)

var (
	Projects   = NewService(NewRepository())
	Activities = NewActivityService(NewActivityRepository())
	Bookings   = NewBookingService(NewBookingRepository())
)

func Handlers() []jsonapi.ResourceHandler {
	return []jsonapi.ResourceHandler{
		NewHandler(),
		NewBookingHandler(),
		NewActivityHandler(),
	}
}
