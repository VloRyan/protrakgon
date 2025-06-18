package client

import "github.com/vloryan/go-libs/jsonapi"

var Clients = NewService(NewRepository())

func Handlers() []jsonapi.ResourceHandler {
	return []jsonapi.ResourceHandler{
		&Handler{
			Service: Clients,
		},
	}
}
