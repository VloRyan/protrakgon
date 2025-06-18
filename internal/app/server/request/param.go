package request

import (
	"net/http"
	"strconv"

	"github.com/vloryan/protrakgon/internal/app/server/db"
)

func DB(req *http.Request) db.Connection {
	return req.Context().Value(CtxKeyDatabase).(db.Connection)
}

func Query(req *http.Request, name string) string {
	return req.URL.Query().Get(name)
}

func QueryInt(req *http.Request, name string, def int) int {
	value := req.URL.Query().Get(name)
	if value == "" {
		return def
	}
	u, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return def
	}
	return int(u)
}
