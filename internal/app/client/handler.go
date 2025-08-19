package client

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/vloryan/go-libs/httpx"
	"github.com/vloryan/go-libs/httpx/router"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/protrakgon/internal/app/server"
	"github.com/vloryan/protrakgon/internal/app/server/db"
	"github.com/vloryan/protrakgon/internal/app/server/request"
)

type Handler struct {
	jsonapi.GenericHandler[*Client]
	Service Service
}

func (h *Handler) RegisterRoutes(route router.RouteElement) {
	h.DocumentUpdaters = append(h.DocumentUpdaters, server.SelfLinkUpdaterInstance)
	clientRoute := route.SubRoute("client")
	clientRoute.POST("", h.Handle(h.Create))
	clientRoute.PATCH(":clientID", h.Handle(h.Update))
	clientRoute.GET("", h.Handle(h.GetAll))
	clientRoute.GET("new", h.Handle(h.New))
	clientRoute.GET(":clientID", h.Handle(h.Get))
	clientRoute.DELETE(":clientID", h.Handle(h.Delete))
}

func (h *Handler) Create(req *http.Request) (data *jsonapi.DocumentData[*Client], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		item := &Client{}
		if err := httpx.ShouldBindWith(req, item, jsonapi.Binding); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind body", err)
		}
		if err := h.Service.Save(tx, item); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to save item", err)
		}

		data = jsonapi.NewDocumentData[*Client](item, "/client")
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

func (h *Handler) Update(req *http.Request) (data *jsonapi.DocumentData[*Client], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		clientID := request.QueryInt(req, ":clientID", 0)
		item, err := h.Service.GetByID(tx, int(clientID))
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get client", err)
		}
		if item == nil {
			return jsonapi.NewError(http.StatusInternalServerError, "client with id: "+strconv.Itoa(int(clientID))+" not found", err)
		}

		if err := httpx.ShouldBindWith(req, item, jsonapi.Binding); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind body", err)
		}
		if item.ID != clientID {
			if item.ID != 0 {
				return jsonapi.NewError(http.StatusBadRequest, "clientID of url does not match with request body", nil)
			}
			item.ID = clientID
		}

		if err := h.Service.Save(tx, item); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to save slot", err)
		}

		data = jsonapi.NewDocumentData[*Client](item, "/client")
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create slot", err)
		}
	}
	return data, nil
}

func (h *Handler) GetAll(req *http.Request) (data *jsonapi.DocumentData[*Client], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		filter := &Filter{}
		page := jsonapi.ExtractPagination(req)

		if err := httpx.BindQuery(req, filter); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind query", err)
		}
		items, err := h.Service.GetAll(tx, page, filter)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		data = jsonapi.NewDocumentData[*Client](items, "/client")
		data.Page = page
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

func (h *Handler) Get(req *http.Request) (data *jsonapi.DocumentData[*Client], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		id := request.QueryInt(req, ":clientID", 0)
		item, err := h.Service.GetByID(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		if item == nil {
			return jsonapi.NewError(http.StatusBadRequest, "item not found", nil)
		}
		data = jsonapi.NewDocumentData[*Client](item, "/client")
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

func (h *Handler) New(_ *http.Request) (data *jsonapi.DocumentData[*Client], jErr *jsonapi.Error) {
	data = jsonapi.NewDocumentData[*Client](&Client{Name: "New Client"}, "/client")
	return data, nil
}

func (h *Handler) Delete(req *http.Request) (data *jsonapi.DocumentData[*Client], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		id := request.QueryInt(req, ":clientID", 0)
		err := h.Service.Delete(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
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
