package server

import (
	"context"
	"io/fs"
	"mime"
	"net/http"
	"path"
	"path/filepath"
	"regexp"
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
	HTTP   *httpx.Server
	Router *goltmux.Router
	/*ContextRoot defines the url prefix for all api routes*/
	ContextRoot string
	/*ProxyLocation defines a prefix used from outside to route to this instance. E.g. if you use a reverse proxy, the location url has to be defined here in order to provide correct path of resources.		 */
	ProxyLocation    string
	ApiRoutePrefix   string
	databaseFileName string
	assets           fs.FS
	uiSrc            fs.FS
	moduleCreator    []func() Module
	modules          []Module
	indexHtml        string
}

func (svr *Server) WithModule(creator func() Module) *Server {
	svr.moduleCreator = append(svr.moduleCreator, creator)
	return svr
}

func (svr *Server) WithDBFile(databaseFileName string) *Server {
	svr.databaseFileName = databaseFileName
	return svr
}

func (svr *Server) WithAssets(assets fs.FS) *Server {
	svr.assets = assets
	return svr
}

func (svr *Server) WithUISrc(uiSrc fs.FS) *Server {
	svr.uiSrc = uiSrc
	return svr
}

func (svr *Server) WithContextRoot(contextRoot string) *Server {
	svr.ContextRoot = contextRoot
	return svr
}

func (svr *Server) WithProxyLocation(proxyLocation string) *Server {
	svr.ProxyLocation = proxyLocation
	return svr
}
func (svr *Server) WithApiRoutePrefix(apiRoutePrefix string) *Server {
	svr.ApiRoutePrefix = apiRoutePrefix
	return svr
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

func (svr *Server) setupDB() (*sqlite.Connection, *db.MigrationInfo, error) {
	connection, err := sqlite.NewConnection(svr.databaseFileName + "?_fk=on") // with foreign key support
	if err != nil {
		return nil, nil, err
	}

	d, err := iofs.New(svr.assets, "migrations")
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

func (svr *Server) Run() error {
	connection, _, err := svr.setupDB()
	if err != nil {
		return err
	}
	fullPrefix := path.Join(svr.ProxyLocation, svr.ContextRoot)
	svr.indexHtml, err = httpx.GenerateReplacedIndexHTML(svr.uiSrc, fullPrefix, `{apiUrl: "`+path.Join(fullPrefix, svr.ApiRoutePrefix)+`", contextRoot: "`+fullPrefix+`"}`)
	if err != nil {
		panic(err)
	}
	svr.Router.NotFoundHandler = func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, svr.ContextRoot) {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		if isIndexAsset(r.URL.Path) {
			filePath := r.URL.Path[len(svr.ContextRoot):]
			mimeType := mime.TypeByExtension(filepath.Ext(filePath))
			w.Header().Set("Content-Type", mimeType)
			http.ServeFileFS(w, r, svr.uiSrc, filePath)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(svr.indexHtml))
	}

	root := router.NewRoute(path.Join(svr.ContextRoot, svr.ApiRoutePrefix), func(method, path string, handler http.HandlerFunc) {
		svr.Router.HandleMethod(method, path, handler)
	})
	for _, creator := range svr.moduleCreator {
		module := creator()
		svr.modules = append(svr.modules, module)
		module.Setup(root)
	}

	svr.HTTP.WithMiddleware(func(req *http.Request) *http.Request {
		return req.WithContext(context.WithValue(req.Context(), request.CtxKeyDatabase, db.WithStatementLogger(connection)))
	})

	/*_ = svr.Router.Walk(func(route *mux.Route, router *mux.Router, ancestors []*mux.Route) error {
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

	return svr.HTTP.ListenAndServe()
}
func isIndexAsset(path string) bool {
	match, _ := regexp.MatchString("/assets/(index|icon)-[\\w-]+\\.(css|js|svg)$", path)
	return match
}
