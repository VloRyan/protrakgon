package project

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/vloryan/go-libs/httpx"
	"github.com/vloryan/go-libs/httpx/router"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/protrakgon/internal/app/client"
	"github.com/vloryan/protrakgon/internal/app/server"
	"github.com/vloryan/protrakgon/internal/app/server/db"
	"github.com/vloryan/protrakgon/internal/app/server/request"
)

func NewHandler(clientService server.CrudService[*client.Client, *client.Filter]) *Handler {
	return &Handler{
		GenericHandler: jsonapi.GenericHandler[*Project]{
			ResolveObjectWithReqFunc: func(req *http.Request, id *jsonapi.ResourceIdentifierObject) (*jsonapi.ResourceObject, *jsonapi.Error) {
				tx := request.DB(req)
				if id.Type == "client" {
					iid, err := strconv.ParseInt(id.ID, 10, 64)
					if err != nil {
						return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to parse id", err)
					}
					cust, err := clientService.GetByID(tx, int(iid))
					if err != nil {
						return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to fetch client", err)
					}
					resObj, err := jsonapi.MarshalResourceObject(cust, nil)
					if err != nil {
						return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to marshal client", err)
					}
					resObj.Links = map[string]any{"self": "client/" + id.ID}
					return resObj, nil
				}
				return nil, jsonapi.NewError(http.StatusBadRequest, "unknown type "+id.Type, nil)
			},
			DocumentUpdaters: []jsonapi.DocumentUpdater{server.SelfLinkUpdaterInstance},
		},
		Service: NewService(NewRepository()),
		SlotHandler: &SlotHandler{
			Service: NewSlotService(NewSlotRepository()),
		},
		ActivityHandler: &ActivityHandler{},
	}
}

type Handler struct {
	jsonapi.GenericHandler[*Project]
	Service         Service
	SlotHandler     jsonapi.ResourceHandler
	ActivityHandler jsonapi.ResourceHandler
}

func (h *Handler) RegisterRoutes(route router.RouteElement) {
	projectRoute := route.SubRoute("project")
	projectRoute.POST("", h.Handle(h.Create))
	projectRoute.PATCH(":projectID", h.Handle(h.Update))
	projectRoute.GET("", h.Handle(h.GetAll))
	projectRoute.GET("new", h.Handle(h.New))
	projectRoute.GET(":projectID", h.Handle(h.Get))
	projectRoute.DELETE(":projectID", h.Handle(h.Delete))

	h.SlotHandler.RegisterRoutes(projectRoute)
	h.ActivityHandler.RegisterRoutes(projectRoute)
}

func (h *Handler) Create(req *http.Request) (data *jsonapi.DocumentData[*Project], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		item := &Project{}
		if err := httpx.ShouldBindWith(req, item, jsonapi.APIBinding); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind body", err)
		}
		if err := h.Service.Save(tx, item); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to save item", err)
		}

		data = jsonapi.NewDocumentData[*Project](item, "/project")
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create project", err)
		}
	}
	return data, nil
}

func (h *Handler) Update(req *http.Request) (data *jsonapi.DocumentData[*Project], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		projectID := request.QueryInt(req, ":projectID", 0)
		item, err := h.Service.GetByID(tx, projectID)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get project", err)
		}
		if item == nil {
			return jsonapi.NewError(http.StatusInternalServerError, "project with id: "+strconv.Itoa(int(projectID))+" not found", err)
		}

		if err := httpx.ShouldBindWith(req, item, jsonapi.APIBinding); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind body", err)
		}
		if item.ID != projectID {
			if item.ID != 0 {
				return jsonapi.NewError(http.StatusBadRequest, "projectID of url does not match with request body", nil)
			}
			item.ID = projectID
		}

		if err := h.Service.Save(tx, item); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to save slot", err)
		}

		data = jsonapi.NewDocumentData[*Project](item, "/project")
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

func (h *Handler) GetAll(req *http.Request) (data *jsonapi.DocumentData[*Project], jErr *jsonapi.Error) {
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
		data = jsonapi.NewDocumentData[*Project](items, "/project")
		data.Page = page
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create project", err)
		}
	}
	return data, nil
}

func (h *Handler) Get(req *http.Request) (data *jsonapi.DocumentData[*Project], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		id := request.QueryInt(req, ":projectID", 0)
		item, err := h.Service.GetByID(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		if item == nil {
			return jsonapi.NewError(http.StatusBadRequest, "item not found", nil)
		}
		data = jsonapi.NewDocumentData[*Project](item, "/project")
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create project", err)
		}
	}
	return data, nil
}

func (h *Handler) New(_ *http.Request) (data *jsonapi.DocumentData[*Project], jErr *jsonapi.Error) {
	data = jsonapi.NewDocumentData[*Project](&Project{Name: "New Project"}, "/project")
	return data, nil
}

func (h *Handler) Delete(req *http.Request) (data *jsonapi.DocumentData[*Project], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		id := request.QueryInt(req, ":projectID", 0)
		err := h.Service.Delete(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		return nil
	}); err != nil {
		if errors.As(err, &jErr) {
			return nil, jErr
		} else {
			return nil, jsonapi.NewError(http.StatusInternalServerError, "failed to create project", err)
		}
	}
	return data, nil
}

type SlotHandler struct {
	jsonapi.GenericHandler[*Slot]
	Service SlotService
}

func (h *SlotHandler) RegisterRoutes(route router.RouteElement) {
	h.DocumentUpdaters = append(h.DocumentUpdaters, server.SelfLinkUpdaterInstance)
	route.POST(":projectID/slot", h.Handle(h.Create))
	route.PATCH(":projectID/slot/:slotID", h.Handle(h.Update))
	route.GET(":projectID/slot", h.Handle(h.GetAll))
	route.GET(":projectID/slot/new", h.Handle(h.New))
	route.GET(":projectID/slot/:slotID", h.Handle(h.Get))
	route.DELETE(":projectID/slot/:slotID", h.Handle(h.Delete))
}

func (h *SlotHandler) Create(req *http.Request) (data *jsonapi.DocumentData[*Slot], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		slot := &Slot{}
		if err := httpx.ShouldBindWith(req, slot, jsonapi.APIBinding); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind body", err)
		}
		projectID := request.QueryInt(req, ":projectID", 0)
		if slot.ProjectID != projectID {
			if slot.ProjectID != 0 {
				return jsonapi.NewError(http.StatusBadRequest, "projectID of url does not match with request body", nil)
			}
			slot.ProjectID = projectID
		}
		if slot.Start.IsZero() {
			h.Service.Start(slot)
		}
		if err := h.Service.Save(tx, slot); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to save slot", err)
		}
		data = jsonapi.NewDocumentData[*Slot](slot, fmt.Sprintf("/project/%d/slot", projectID))
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

func (h *SlotHandler) Update(req *http.Request) (data *jsonapi.DocumentData[*Slot], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		slotID := request.QueryInt(req, ":slotID", 0)
		slot, err := h.Service.GetByID(tx, slotID)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get slot", err)
		}
		if slot == nil {
			return jsonapi.NewError(http.StatusInternalServerError, "slot with id: "+strconv.Itoa(slotID)+" not found", err)
		}
		projectID := request.QueryInt(req, ":projectID", 0)
		if err := httpx.ShouldBindWith(req, slot, jsonapi.APIBinding); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind body", err)
		}
		if slot.ProjectID != projectID {
			if slot.ProjectID != 0 {
				return jsonapi.NewError(http.StatusBadRequest, "projectID of url does not match with request body", nil)
			}
			slot.ProjectID = projectID
		}
		if slot.ID != slotID {
			if slot.ID != 0 {
				return jsonapi.NewError(http.StatusBadRequest, "slotID of url does not match with request body", nil)
			}
			slot.ID = slotID
		}

		if err := h.Service.Save(tx, slot); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to save slot", err)
		}

		data = jsonapi.NewDocumentData[*Slot](slot, fmt.Sprintf("/project/%d/slot", projectID))
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

func (h *SlotHandler) GetAll(req *http.Request) (data *jsonapi.DocumentData[*Slot], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		filter := &SlotFilter{}
		projectID := request.QueryInt(req, ":projectID", 0)
		if projectID != 0 {
			filter.ProjectID = &projectID
		}
		page := jsonapi.ExtractPagination(req)

		if err := httpx.BindQuery(req, filter); err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to bind query", err)
		}
		slots, err := h.Service.GetAll(tx, page, filter)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		data = jsonapi.NewDocumentData[*Slot](slots, fmt.Sprintf("/project/%d/slot", projectID))
		data.Page = page
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

func (h *SlotHandler) Get(req *http.Request) (data *jsonapi.DocumentData[*Slot], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		projectID := request.QueryInt(req, ":projectID", 0)
		if projectID == 0 {
			return jsonapi.NewError(http.StatusBadRequest, "invalid projectID", nil)
		}
		id := request.QueryInt(req, ":slotID", 0)
		item, err := h.Service.GetByID(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
		if item == nil {
			return jsonapi.NewError(http.StatusNotFound, "item not found", nil)
		}
		data = jsonapi.NewDocumentData[*Slot](item, fmt.Sprintf("/project/%d/slot", projectID))
		for _, item := range data.Items {
			if item.Links == nil {
				item.Links = make(map[string]any)
			}
			item.Links["self"] = fmt.Sprintf("project/%d/slot/%d", item.Data.ProjectID, item.Data.ID)
		}
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

func (h *SlotHandler) New(req *http.Request) (data *jsonapi.DocumentData[*Slot], jErr *jsonapi.Error) {
	projectID := request.QueryInt(req, ":projectID", 0)
	data = jsonapi.NewDocumentData[*Slot](&Slot{ProjectID: projectID, Start: time.Now().UTC()}, fmt.Sprintf("/project/%d/slot", projectID))
	for _, item := range data.Items {
		if item.Links == nil {
			item.Links = make(map[string]any)
		}
		item.Links["self"] = fmt.Sprintf("project/%d/slot", item.Data.ProjectID)
	}
	return data, nil
}

func (h *SlotHandler) Delete(req *http.Request) (data *jsonapi.DocumentData[*Slot], jErr *jsonapi.Error) {
	con := request.DB(req)
	if err := con.DoTransaction(func(tx db.Transaction) error {
		id := request.QueryInt(req, ":slotID", 0)
		err := h.Service.Delete(tx, id)
		if err != nil {
			return jsonapi.NewError(http.StatusInternalServerError, "failed to get items", err)
		}
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

type ActivityHandler struct {
	jsonapi.GenericHandler[*server.KeyValueResourceObject[any]]
}

func (h *ActivityHandler) RegisterRoutes(route router.RouteElement) {
	h.DocumentUpdaters = append(h.DocumentUpdaters, server.SelfLinkUpdaterInstance)
	route.GET("activity", h.Handle(h.GetActivities))
	route.GET("activity/:activityID", h.Handle(h.GetActivity))
}

var activities = []*server.KeyValueResourceObject[any]{
	{ID: "work", Type: "activity", Value: ActivityWork},
	{ID: "break", Type: "activity", Value: ActivityBreak},
}

func (h *ActivityHandler) GetActivities(_ *http.Request) (*jsonapi.DocumentData[*server.KeyValueResourceObject[any]], *jsonapi.Error) {
	return jsonapi.NewDocumentData[*server.KeyValueResourceObject[any]](activities, "project/activity"), nil
}

func (h *ActivityHandler) GetActivity(req *http.Request) (*jsonapi.DocumentData[*server.KeyValueResourceObject[any]], *jsonapi.Error) {
	id := request.Query(req, ":activityID")
	switch id {
	case "work":
		return jsonapi.NewDocumentData[*server.KeyValueResourceObject[any]](activities[0], "project/activity"), nil
	case "break":
		return jsonapi.NewDocumentData[*server.KeyValueResourceObject[any]](activities[1], "project/activity"), nil
	default:
		return nil, jsonapi.NewError(http.StatusBadRequest, "invalid activity ID", nil)
	}
}
