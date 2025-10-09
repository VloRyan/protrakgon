package client

import (
	"strconv"

	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/protrakgon/internal/app/server/api"
	"github.com/vloryan/protrakgon/internal/app/server/db"
)

var Clients = NewService(NewRepository())

func Handlers() []jsonapi.ResourceHandler {
	api.Register("client", func(tx db.Transaction, id *jsonapi.ResourceIdentifierObject) (*jsonapi.ResourceObject, error) {
		iid, _ := strconv.ParseInt(id.ID, 10, 64)
		item, err := Clients.GetByID(tx, int(iid))
		if err != nil || item == nil {
			return nil, err
		}
		return jsonapi.MarshalResourceObject(item, nil)
	})

	return []jsonapi.ResourceHandler{
		api.NewCRUDResourceHandler(Clients, "/client"),
	}
}
