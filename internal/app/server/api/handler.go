package api

import (
	"errors"
	"net/http"
	"reflect"
	"strconv"
	"strings"

	"github.com/vloryan/go-libs/httpx"
	"github.com/vloryan/go-libs/httpx/router"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/go-libs/reflectx"
	"github.com/vloryan/protrakgon/internal/app/server/db"
	"github.com/vloryan/protrakgon/internal/app/server/request"
)

type Validater interface {
	Validate() error
}
type (
	OnNewFunc[T any]         func(item T, req *http.Request) error
	BindFilterFunc[F Filter] func(req *http.Request, f F) error
)

type CRUDResourceHandler[T any, F Filter] interface {
	RegisterRoutes(route router.RouteElement)

	Create(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error)
	Update(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error)
	GetAll(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error)
	Get(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error)
	New(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error)
	Delete(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error)

	WithOnNew(fun OnNewFunc[T]) CRUDResourceHandler[T, F]
	WithBindFilter(fun BindFilterFunc[F]) CRUDResourceHandler[T, F]
}

func NewCRUDResourceHandler[T any, F Filter](service CRUDService[T, F], selfPath string) CRUDResourceHandler[T, F] {
	var item T
	t := reflectx.TypeOf(item, true)
	return &DefaultCrudHandler[T, F]{
		GenericHandler: jsonapi.GenericHandler[T]{
			ResolveObjectWithReqFunc: Resolve,
		},
		Service:           service,
		selfPath:          selfPath,
		itemTypeName:      t.Name(),
		idPathPlaceholder: ":" + strings.ToLower(t.Name()) + "ID",
	}
}

type DefaultCrudHandler[T any, F Filter] struct {
	jsonapi.GenericHandler[T]
	Service           CRUDService[T, F]
	selfPath          string
	itemTypeName      string
	idPathPlaceholder string

	onNewFunc      OnNewFunc[T]
	bindFilterFunc BindFilterFunc[F]
}

func (h *DefaultCrudHandler[T, F]) RegisterRoutes(route router.RouteElement) {
	clientRoute := route.SubRoute(h.selfPath)
	clientRoute.POST("", h.Handle(h.Create))
	clientRoute.PATCH(h.idPathPlaceholder, h.Handle(h.Update))
	clientRoute.GET("", h.Handle(h.GetAll))
	clientRoute.GET("new", h.Handle(h.New))
	clientRoute.GET(h.idPathPlaceholder, h.Handle(h.Get))
	clientRoute.DELETE(h.idPathPlaceholder, h.Handle(h.Delete))
}

func (h *DefaultCrudHandler[T, F]) Create(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		item := h.createItem()
		if err := httpx.ShouldBindWith(req, item, jsonapi.Binding); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind body", err)
		}
		if err := h.Service.Save(tx, item); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to save item", err)
		}

		data = jsonapi.NewDocumentData[T](item, h.selfPath)
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create client", err)
		}
	}
	return data, nil
}

func (h *DefaultCrudHandler[T, F]) Update(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		id := request.QueryInt(req, h.idPathPlaceholder, 0)
		item, err := h.Service.GetByID(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get "+h.itemTypeName, err)
		}
		if v := reflect.ValueOf(item); v.Kind() == reflect.Ptr && v.IsNil() {
			return jsonapi.NewError(http.StatusInternalServerError, h.itemTypeName+" with id: "+strconv.Itoa(id)+" not found", err)
		}

		if err := httpx.ShouldBindWith(req, item, jsonapi.Binding); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind body", err)
		}
		if h.extractID(item) != id {
			return jsonapi.NewError(http.StatusBadRequest, "id of url does not match with request body", nil)
		}

		if err := h.Service.Save(tx, item); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to save "+h.itemTypeName, err)
		}

		data = jsonapi.NewDocumentData[T](item, h.selfPath)
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create booking", err)
		}
	}
	return data, nil
}

func (h *DefaultCrudHandler[T, F]) GetAll(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		filter := h.createFilter()
		page := jsonapi.ExtractPagination(req)

		if h.bindFilterFunc != nil {
			if err := h.bindFilterFunc(req, filter); err != nil {
				return jsonapi.NewError(http.StatusInternalServerError, "failed to bind query", err)
			}
		} else {
			if err := httpx.BindQuery(req, filter); err != nil {
				return jsonapi.NewError(http.StatusInternalServerError, "failed to bind query", err)
			}
		}

		items, err := h.Service.GetAll(tx, page, filter)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		data = jsonapi.NewDocumentData[T](items, h.selfPath)
		data.Page = page
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create "+h.itemTypeName, err)
		}
	}
	return data, nil
}

func (h *DefaultCrudHandler[T, F]) Get(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		id := request.QueryInt(req, h.idPathPlaceholder, 0)
		item, err := h.Service.GetByID(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		if v := reflect.ValueOf(item); v.Kind() == reflect.Ptr && v.IsNil() {
			return jsonapi.NewError(http.StatusBadRequest, "item not found", nil)
		}
		data = jsonapi.NewDocumentData[T](item, h.selfPath)
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create "+h.itemTypeName, err)
		}
	}
	return data, nil
}

func (h *DefaultCrudHandler[T, F]) New(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error) {
	newItem := h.createItem()
	data = jsonapi.NewDocumentData[T](newItem, h.selfPath)
	if h.onNewFunc != nil {
		if err := h.onNewFunc(newItem, req); err != nil {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create "+h.itemTypeName, err)
		}
	}
	return data, nil
}

func (h *DefaultCrudHandler[T, F]) Delete(req *http.Request) (data *jsonapi.DocumentData[T], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		id := request.QueryInt(req, h.idPathPlaceholder, 0)
		err := h.Service.Delete(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create "+h.itemTypeName, err)
		}
	}
	return data, nil
}

func (h *DefaultCrudHandler[T, F]) WithOnNew(fun OnNewFunc[T]) CRUDResourceHandler[T, F] {
	h.onNewFunc = fun
	return h
}

func (h *DefaultCrudHandler[T, F]) WithBindFilter(fun BindFilterFunc[F]) CRUDResourceHandler[T, F] {
	h.bindFilterFunc = fun
	return h
}

func (h *DefaultCrudHandler[T, F]) createItem() T {
	var item T
	t := reflect.TypeOf(item)
	if t.Kind() != reflect.Ptr {
		return item
	}
	e := reflect.New(t.Elem())
	return e.Interface().(T)
}

func (h *DefaultCrudHandler[T, F]) createFilter() F {
	var filter F
	t := reflect.TypeOf(filter)
	if t.Kind() != reflect.Ptr {
		return filter
	}
	e := reflect.New(t.Elem())
	return e.Interface().(F)
}

func (h *DefaultCrudHandler[T, F]) extractID(item T) int {
	f := reflectx.FindField(item, "id")
	if f.IsValid() {
		return f.Interface().(int)
	}
	return -1
}
