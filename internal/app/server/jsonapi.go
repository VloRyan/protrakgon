package server

import (
	"net/url"

	"github.com/vloryan/go-libs/httpx/router"
	"github.com/vloryan/go-libs/jsonapi"
)

type KeyValueResourceObject[T any] struct {
	ID    string
	Type  string
	Value T
}

func (k *KeyValueResourceObject[T]) SetIdentifier(id *jsonapi.ResourceIdentifierObject) {
	if id.Type != k.Type {
		return
	}
	k.ID = id.ID
}

func (k *KeyValueResourceObject[T]) GetIdentifier() *jsonapi.ResourceIdentifierObject {
	return &jsonapi.ResourceIdentifierObject{
		ID:   k.ID,
		Type: k.Type,
	}
}

var SelfLinkUpdaterInstance = &SelfLinkUpdater{}

type Extension interface {
	Apply(route router.RouteElement)
}

func NewJsonAPIModule(handlers []jsonapi.ResourceHandler) *JsonAPIModule {
	return &JsonAPIModule{
		handlers: handlers,
	}
}

type JsonAPIModule struct {
	handlers []jsonapi.ResourceHandler
	exts     []Extension
}

func (m *JsonAPIModule) WithExtension(ext Extension) Module {
	m.exts = append(m.exts, ext)
	return m
}

func (m *JsonAPIModule) Setup(route router.RouteElement) {
	SelfLinkUpdaterInstance.contextPath = route.Path()
	for _, h := range m.handlers {
		h.RegisterRoutes(route)
	}
	for _, e := range m.exts {
		e.Apply(route)
	}
}

type SelfLinkUpdater struct {
	contextPath string
}

func (u *SelfLinkUpdater) Update(doc *jsonapi.Document) error {
	if err := jsonapi.ForEachElem[*jsonapi.ResourceObject](doc.Data, func(e *jsonapi.ResourceObject) error {
		return u.updateSelfLink(e)
	}); err != nil {
		return err
	}
	if err := jsonapi.ForEachElem[*jsonapi.ResourceObject](doc.Included, func(e *jsonapi.ResourceObject) error {
		return u.updateSelfLink(e)
	}); err != nil {
		return err
	}
	return nil
}

func (u *SelfLinkUpdater) updateSelfLink(obj *jsonapi.ResourceObject) error {
	if obj.Links == nil {
		obj.Links = make(map[string]any)
	}
	if self, ok := obj.Links["self"]; ok {
		selfURI, err := url.JoinPath(u.contextPath, self.(string))
		if err != nil {
			return err
		}
		obj.Links["self"] = selfURI
	}
	return nil
}

func (u *SelfLinkUpdater) ContextPath() string {
	return u.contextPath
}
