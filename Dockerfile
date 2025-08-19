# syntax=docker/dockerfile:1
FROM gcr.io/distroless/base-debian12 AS amd

WORKDIR /protrakgon

COPY bin/protrakgon-linux-amd64 ./protrakgon

EXPOSE 8080

ENTRYPOINT ["/protrakgon/protrakgon"]

FROM gcr.io/distroless/base-debian12 AS arm

WORKDIR /protrakgon

COPY bin/protrakgon-linux-arm64 ./protrakgon

EXPOSE 8080

ENTRYPOINT ["/protrakgon/protrakgon"]
