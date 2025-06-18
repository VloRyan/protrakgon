package main

import (
	"embed"
	"io/fs"
	"os"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/vloryan/go-libs/env"
	"github.com/vloryan/go-libs/jsonapi"
	"github.com/vloryan/protrakgon/internal/app/client"
	"github.com/vloryan/protrakgon/internal/app/project"
	"github.com/vloryan/protrakgon/internal/app/server"
)

//go:embed assets/*
var embedDir embed.FS

//go:embed ui/dist/*
var uiDistDir embed.FS

func main() {
	debug := env.GetOrDefaultBool("DEBUG", false)
	InitLog(debug)
	var assetDir fs.FS
	if debug {
		assetDir = os.DirFS("assets")
	} else {
		subFs, err := fs.Sub(embedDir, "assets")
		if err != nil {
			assetDir = embedDir
		} else {
			assetDir = subFs
		}
	}

	uiSrc, err := fs.Sub(uiDistDir, "ui/dist")
	if err != nil {
		panic(err)
	}

	srv := server.New().
		WithContextRoot("v1").
		WithModule(func() server.Module {
			return server.NewJsonAPIModule(domainHandler())
		}).
		WithAssets(assetDir).
		WithUISrc(uiSrc).
		WithDBFile("db/protrakgon.db")

	if err := srv.Run(); err != nil {
		panic(err)
	}
}

func domainHandler() []jsonapi.ResourceHandler {
	var handlers []jsonapi.ResourceHandler
	handlers = append(handlers, client.Handlers()...)
	handlers = append(handlers, project.Handlers()...)

	return handlers
}

func InitLog(debug bool) {
	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	if debug {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	} else {
		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	}
}
