package api

import (
	"fmt"
	"net/http"

	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/protrakgon/internal/app/server/db"
	"github.com/vloryan/protrakgon/internal/app/server/request"
)

type (
	ResolverFunc = func(tx db.Transaction, id *jsonapi.ResourceIdentifierObject) (*jsonapi.ResourceObject, error)
	IResolver    interface {
		Resolve(req *http.Request, id *jsonapi.ResourceIdentifierObject) (*jsonapi.ResourceObject, *jsonapi.Error)
		Register(typeString string, resolverFunc ResolverFunc)
	}
)

var resolverMap = make(map[string]ResolverFunc)

func Register(typeString string, resolverFunc ResolverFunc) {
	resolverMap[typeString] = resolverFunc
}

func Resolve(req *http.Request, id *jsonapi.ResourceIdentifierObject) (*jsonapi.ResourceObject, *jsonapi.Error) {
	resolver := resolverMap[id.Type]
	if resolver == nil {
		return nil, nil
	}
	con := request.DB(req)
	item, err := resolver(con, id)
	if err != nil {
		return nil, jsonapi.NewError(http.StatusInternalServerError, fmt.Sprintf("failed to resolve item with id: %v", id), err)
	}
	return item, nil
}
