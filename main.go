package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"embed"
	"html/template"

	"github.com/anokatabc/tageszaehler/metrics"
	//"github.com/anokatabc/tageszaehler/routes"
	"github.com/rs/zerolog/log"

	"github.com/julienschmidt/httprouter"
)

//go:embed templates/*
//go:embed static/*
var embeddedFS embed.FS

var indexHtml = "index.html"

var templates = template.Must(template.ParseFS(embeddedFS, "templates/*.html"))

func init() {
	fmt.Println("Launching server...")
}

func main() {
	router := httprouter.New()

	defer func() {
		fmt.Println("Beende Server...")
	}()

	//router.GET("/index.html", )
	router.GET("/", func(w http.ResponseWriter, r *http.Request, params httprouter.Params){

	err := templates.ExecuteTemplate(w, indexHtml, nil)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})
	router.POST("/", func(w http.ResponseWriter, r *http.Request, params httprouter.Params){
		err := r.ParseForm()
		if err != nil {
			fmt.Print(fmt.Errorf("Parse-Fehler! Beende Funktion"))
			return
		}
		  leftOne := r.FormValue("leftOne")
			rightOne := r.FormValue("rightOne")
			leftTwo := r.FormValue("leftTwo")
			rightTwo := r.FormValue("rightTwo")
			leftThree := r.FormValue("leftThree")
			rightThree := r.FormValue("rightThree")
			leftFour := r.FormValue("leftFour")
			rightFour := r.FormValue("rightFour")
			leftFive := r.FormValue("leftFive")
			rightFive := r.FormValue("rightFive")
			timeResult, timeResultt, errTwo := calculateHours(leftOne, rightOne)
			timeResultTwo, timeResulttTwo, errThree := calculateHours(leftTwo, rightTwo)
			timeResultThree, timeResulttThree, errFour := calculateHours(leftThree, rightThree)
			timeResultFour, timeResulttFour, errFive := calculateHours(leftFour, rightFour)
			timeResultFive, timeResulttFive, errSix := calculateHours(leftFive, rightFive)
			if (errTwo != nil)||(errThree != nil)||(errFour != nil)||(errFive != nil)||(errSix != nil) {
				fmt.Print(fmt.Errorf("error calculateHours"))
			}

        // Ergebnis an Browser senden
        fmt.Fprintf(w, "<h1><ul>Tag 1</ul></h1><p>%v Stunden, %v Minuten</p>", timeResult, timeResultt)
        fmt.Fprintf(w, "<h1><ul>Tag 2</ul></h1><p>%v Stunden, %v Minuten</p>", timeResultTwo, timeResulttTwo)
        fmt.Fprintf(w, "<h1><ul>Tag 3</ul></h1><p>%v Stunden, %v Minuten</p>", timeResultThree, timeResulttThree)
        fmt.Fprintf(w, "<h1><ul>Tag 4</ul></h1><p>%v Stunden, %v Minuten</p>", timeResultFour, timeResulttFour)
        fmt.Fprintf(w, "<h1><ul>Tag 5</ul></h1><p>%v Stunden, %v Minuten</p>", timeResultFive, timeResulttFive)
        fmt.Fprintf(w, "<h1><ul>Gesamt:</ul></h1><p>%v Stunden, %v Minuten</p>", timeResult+timeResultTwo+timeResultThree+timeResultFour+timeResultFive, timeResultt+timeResulttTwo+timeResulttThree+timeResulttFour+timeResulttFive)

	})
	router.GET("/health", metrics.Uptime())

	router.ServeFiles("/static/*filepath", http.FS(embeddedFS))

	httpServer := http.Server{Addr: ":3000", Handler: router}
	fmt.Println("Server läuft auf http://localhost:3000\n- abrufbar via Browser über diese Adresse")

	err := httpServer.ListenAndServe()

	log.Fatal().Err(err).Msg("server failed")

	// router.GET("/", ...)
}

func calculateHours(left, right string) (hours, minutes int, err error) {
	leftHours, leftMinutes, err := parseTime(left)
	if err != nil {
		return 0,0, err
	}
	rightHours, rightMinutes, err := parseTime(right)
	if err != nil {
		return 0,0, err
	}

	startShift := leftHours*60 + leftMinutes
	endShift := rightHours*60 + rightMinutes
	
	workminutes := (endShift-startShift)%60
	workhours := int((endShift-startShift)/60)


	return workhours, workminutes, nil
}

func parseTime(timeStr string) (hours, minutes int, err error){
  timeArr := strings.Split(timeStr, ":")
  if len(timeArr) != 2 {return 0, 0, err}

	hours, err = strconv.Atoi(timeArr[0])
	if err != nil {return 0, 0, fmt.Errorf("")}
	minutes, err = strconv.Atoi(timeArr[1])
	if err != nil {return 0, 0, fmt.Errorf("")}

	if hours < 0 || hours > 23 {
		return 0, 0, fmt.Errorf("Stunden müssen zwischen 0 und 23 liegen")
	}
	if minutes < 0 || minutes > 59 {
		return 0, 0, fmt.Errorf("Minuten müssen zwischen 0 und 59 liegen")
	}

	return hours, minutes, nil
}