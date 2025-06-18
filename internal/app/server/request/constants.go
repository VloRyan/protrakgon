package request

const (
	CtxKeyDatabase    ContextKey = "DATABASE"
	CtxKeyTransaction ContextKey = "TRANSACTION"
)

type ContextKey string
