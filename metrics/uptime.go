package metrics

import (
	"fmt"
	"net/http"
	"time"

	"github.com/anokatabc/tageszaehler/routes"
	"github.com/julienschmidt/httprouter"
)

var launchTime time.Time

func init() {
	launchTime = time.Now()
}

func Uptime() routes.HttpHandler {
	return func(wr http.ResponseWriter, req *http.Request, par httprouter.Params) {
		uptimeMs := int(time.Since(launchTime).Milliseconds())
		string := fmt.Sprintf("Server running for %v milliseconds\n", uptimeMs)
		fmt.Println(string)
	}
}


