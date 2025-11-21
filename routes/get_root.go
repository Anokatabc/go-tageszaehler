package routes

import (
	"fmt"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func GetIndex(message string) {
	fmt.Println(message)
}

func GetRoot(message string) HttpHandler {
	return func(writer http.ResponseWriter, request *http.Request, params httprouter.Params) {
		writer.WriteHeader(http.StatusOK)
		writer.Write([]byte(message))
	}
}
