# syntax=docker/dockerfile:1
FROM gcr.io/distroless/base-debian12

WORKDIR /protrakgon

COPY bin/protrakgon-linux-arm64 ./

EXPOSE 8080

ENTRYPOINT ["/protrakgon/protrakgon-linux-arm64"]
