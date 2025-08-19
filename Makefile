NAME = $(notdir $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST)))))
build-ui:
	npm run build --prefix ui

build-server:
	env GOOS=linux GOARCH=amd64 CGO_ENABLED=1 go build -buildvcs=false -o bin/$(NAME)-linux-amd64
	env GOOS=linux GOARCH=arm64 CGO_ENABLED=1 CC="zig cc -target aarch64-linux" CXX="zig cc -target aarch64-linux" go build -buildvcs=false -o bin/$(NAME)-linux-arm64

build: clean build-ui build-server

test:
	go test ./...

vet:
	go vet ./...

lint:
	golangci-lint run

fmt:
	gofumpt -l -w .

clean: clean-ui clean-server

clean-server:
	go clean
	rm -fr ./bin

clean-ui:
	rm -fr ./ui/dist

docker: build
	docker build -t $(NAME):arm-latest --target arm .
	docker build -t $(NAME):amd-latest --target amd .

docker-run:
	docker rm $(NAME) -f
	docker run --name $(NAME) -v ./db:/$(NAME)/db -p 8080:8080 $(NAME):amd-latest
