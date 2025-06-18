package project

import (
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/protrakgon/internal/app/client"
)

func Handlers() []jsonapi.ResourceHandler {
	return []jsonapi.ResourceHandler{
		NewHandler(client.Clients),
	}
}
