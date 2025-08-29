package project

import (
	"github.com/vloryan/go-libs/jsonapi"
)

var (
	Projects   = NewService(NewRepository())
	Activities = NewActivityService(NewActivityRepository())
	Slots      = NewSlotService(NewSlotRepository())
)

func Handlers() []jsonapi.ResourceHandler {
	return []jsonapi.ResourceHandler{
		NewHandler(),
		NewSlotHandler(),
		NewActivityHandler(),
	}
}
