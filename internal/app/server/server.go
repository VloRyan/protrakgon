package server

import (
	"context"
	"io/fs"
	"net/http"
	"strings"

	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/vloryan/go-libs/httpx"
	"github.com/vloryan/go-libs/httpx/router"
	"github.com/vloryan/goltmux"
	"github.com/vloryan/protrakgon/internal/app/server/db"
	"github.com/vloryan/protrakgon/internal/app/server/db/sqlite"
	"github.com/vloryan/protrakgon/internal/app/server/request"
)

type Server struct {
	HTTP             *httpx.Server
	Router           *goltmux.Router
	ContextRoot      string
	databaseFileName string
	assets           fs.FS
	uiSrc            fs.FS
	moduleCreator    []func() Module
	modules          []Module
}

func (srv *Server) WithModule(creator func() Module) *Server {
	srv.moduleCreator = append(srv.moduleCreator, creator)
	return srv
}

func (srv *Server) WithDBFile(databaseFileName string) *Server {
	srv.databaseFileName = databaseFileName
	return srv
}

func (srv *Server) WithAssets(assets fs.FS) *Server {
	srv.assets = assets
	return srv
}

func (srv *Server) WithUISrc(uiSrc fs.FS) *Server {
	srv.uiSrc = uiSrc
	return srv
}

func (srv *Server) WithContextRoot(contextRoot string) *Server {
	srv.ContextRoot = contextRoot
	return srv
}

type Module interface {
	Setup(route router.RouteElement)
}

func New() *Server {
	r := goltmux.NewRouter()
	return &Server{
		HTTP:   httpx.NewServer(r),
		Router: r,
	}
}

func (srv *Server) setupDB() (*sqlite.Connection, *db.MigrationInfo, error) {
	connection, err := sqlite.NewConnection(srv.databaseFileName + "?_fk=on") // with foreign key support
	if err != nil {
		return nil, nil, err
	}

	d, err := iofs.New(srv.assets, "migrations")
	if err != nil {
		return nil, nil, err
	}
	drv, err := sqlite.MigrateDriver(connection)
	if err != nil {
		return nil, nil, err
	}
	info, err := db.DoMigration(drv, "migrations", d)
	if err != nil {
		return nil, nil, err
	}

	return connection, info, nil
}

func (srv *Server) Run() error {
	connection, _, err := srv.setupDB()
	if err != nil {
		return err
	}

	srcFileServer := http.FileServer(http.FS(srv.uiSrc))
	srv.Router.NotFoundHandler = func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/" || path == "/index.html" || strings.HasPrefix(path, "/assets/") {
			srcFileServer.ServeHTTP(w, r)
			return
		}
		http.ServeFileFS(w, r, srv.uiSrc, "index.html")
	}

	root := router.NewRoute(srv.ContextRoot, func(method, path string, handler http.HandlerFunc) {
		srv.Router.HandleMethod(method, path, handler)
	})
	for _, creator := range srv.moduleCreator {
		module := creator()
		srv.modules = append(srv.modules, module)
		module.Setup(root)
	}

	srv.HTTP.WithMiddleware(func(req *http.Request) *http.Request {
		return req.WithContext(context.WithValue(req.Context(), request.CtxKeyDatabase, db.WithStatementLogger(connection)))
	})

	/*srv.Router.HandleFunc(srv.ContextRoot, func(writer http.ResponseWriter, r *http.Request) {
		http.NotFound(writer, r)
	})*/

	/*_ = srv.Router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
		pathTemplate, err := route.GetPathTemplate()
		if err == nil {
			fmt.Println("ROUTE:", pathTemplate)
		}
		pathRegexp, err := route.GetPathRegexp()
		if err == nil {
			fmt.Println("Path regexp:", pathRegexp)
		}
		queriesTemplates, err := route.GetQueriesTemplates()
		if err == nil {
			fmt.Println("Queries templates:", strings.Join(queriesTemplates, ","))
		}
		queriesRegexps, err := route.GetQueriesRegexp()
		if err == nil {
			fmt.Println("Queries regexps:", strings.Join(queriesRegexps, ","))
		}
		methods, err := route.GetMethods()
		if err == nil {
			fmt.Println("Methods:", strings.Join(methods, ","))
		}
		fmt.Println()
		return nil
	})*/

	return srv.HTTP.ListenAndServe()
}
