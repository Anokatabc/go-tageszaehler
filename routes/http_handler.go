package routes

import (
	"net/http"

	"github.com/julienschmidt/httprouter"
)

// Handler = Response, Request, Parameter
type HttpHandler = func(http.ResponseWriter, *http.Request, httprouter.Params)
