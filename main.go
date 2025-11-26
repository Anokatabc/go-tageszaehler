package main

import (
	"fmt"
	"io/fs"
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

var debug bool = true

//go:embed templates/*
//go:embed static/*
var embeddedFS embed.FS

var indexHtml = "index.html"
var resultsHtml = "results.html"

var templates = template.Must(template.ParseFS(embeddedFS, "templates/*.html"))

func init() {
	fmt.Println("Launching server...")
}

func main() {
	if debug {
		fs.WalkDir(embeddedFS, ".", func(path string, d fs.DirEntry, err error) error {
			fmt.Println("Embedded file:", path)
			return nil
		})
	}

	router := httprouter.New()

	defer func() {
		fmt.Println("Beende Server...")
	}()

	//router.GET("/index.html", )
	//router.GET("/results.html", )
	router.GET("/", func(w http.ResponseWriter, r *http.Request, params httprouter.Params) {

		err := templates.ExecuteTemplate(w, indexHtml, nil)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})

	router.POST("/results.html", func(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
		err := r.ParseForm()
		templates.ExecuteTemplate(w, resultsHtml, nil)
		if err != nil {
			fmt.Print(fmt.Errorf("Parse-Fehler! Beende Funktion"))
			return
		}
		monthStr := r.PostFormValue("month")
		yearStr := r.PostFormValue("year")

		month, _ := strconv.Atoi(monthStr)
		year, _ := strconv.Atoi(yearStr)

		monthNames := []string{
			"Januar","Februar","März","April","Mai","Juni",
			"Juli","August","September","Oktober","November","Dezember",
		}

		var monthName string
		if month > 0 && month < len(monthNames) {
			monthName = monthNames[month]
		} else {
			monthName = "Unbekannt"
		}


		//"day${date}_start"
		type TimeEntry struct {
			Start string
			End   string
		}

		workTimes := make(map[string]TimeEntry)

		for key := range r.PostForm {
			if !strings.HasSuffix(key, "_start") {
				continue
			}
			fmt.Println("key => ",key)

			workdaySuffix := strings.TrimPrefix(key, "day")
			workday := strings.TrimSuffix(workdaySuffix, "_start")

			startTime := r.PostFormValue("day"+workday+"_start")
			endTime := r.PostFormValue("day"+workday+"_end")

			if startTime == "" || endTime == "" {
				fmt.Printf("Tag %s: Start oder Ende fehlt.",workday)
				continue
			}

			workTimes[workday] = TimeEntry{
				Start: startTime,
				End: endTime,
			}

			workTimes[workday] = TimeEntry{
				Start: startTime,
				End: endTime,
			}
			fmt.Printf("----------------------\nTag hinzugefügt: %s: %s - %s", workday, startTime, endTime)
		}
			
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			fmt.Fprintf(w, "<h2>Empfangene Daten:</h2>")
			var incrHours int;
			var incrMinutes int;
			for day, times := range workTimes {
				fmt.Fprintf(w, "<p><b>%02v.%s %v</b>: %02v bis %02v gearbeitet.</p>\n", day, monthName, year, times.Start, times.End)
				hours, minutes, err := calculateHours(times.Start, times.End)
				if err != nil {
					fmt.Println("Error")
				}
				incrHours += hours
				incrMinutes += minutes

				fmt.Fprintf(w, "<p>Arbeitszeit: %d Stunden, %d Minuten", hours, minutes)
			}
			
			totalMinutes := incrMinutes%60
			totalHours := incrHours + int(incrMinutes/60)
			fmt.Fprintf(w, "<p>Gesamtarbeitszeit in der Woche: %02d Stunden, %02d Minuten", totalHours, totalMinutes)

		// if errTwo != nil {
		// 	fmt.Print(fmt.Errorf("error calculateHours"))
		// }

		// Ergebnis an Browser senden
		// fmt.Fprintf(w, "<h1><ul>Tag 1</ul></h1><p>%v Stunden, %v Minuten</p>", timeResult, timeResultt)
	})

	router.GET("/health", metrics.Uptime())

	//router.ServeFiles("/static/*filepath", http.FS(embeddedFS))
	//router.ServeFiles("/static/*filepath", http.Dir("static"))
	staticFS, errFS := fs.Sub(embeddedFS, "static")
	if errFS != nil {
		log.Fatal().Err(errFS).Msg("sub-filesystem error")
	}
	router.ServeFiles("/static/*filepath", http.FS(staticFS))

	httpServer := http.Server{Addr: ":3000", Handler: router}
	fmt.Println("Server läuft auf http://localhost:3000\n- abrufbar via Browser über diese Adresse")

	err := httpServer.ListenAndServe()

	log.Fatal().Err(err).Msg("server failed")

	// router.GET("/", ...)
}

func calculateHours(left, right string) (hours, minutes int, err error) {
	leftHours, leftMinutes, err := parseTime(left)
	if err != nil {
		return 0, 0, err
	}
	rightHours, rightMinutes, err := parseTime(right)
	if err != nil {
		return 0, 0, err
	}

	startShift := leftHours*60 + leftMinutes
	endShift := rightHours*60 + rightMinutes

	workminutes := (endShift - startShift) % 60
	workhours := int((endShift - startShift) / 60)

	return workhours, workminutes, nil
}

func parseTime(timeStr string) (hours, minutes int, err error) {
	timeArr := strings.Split(timeStr, ":")
	if len(timeArr) != 2 {
		return 0, 0, err
	}

	hours, err = strconv.Atoi(timeArr[0])
	if err != nil {
		return 0, 0, fmt.Errorf("")
	}
	minutes, err = strconv.Atoi(timeArr[1])
	if err != nil {
		return 0, 0, fmt.Errorf("")
	}

	if hours < 0 || hours > 23 {
		return 0, 0, fmt.Errorf("Stunden müssen zwischen 0 und 23 liegen")
	}
	if minutes < 0 || minutes > 59 {
		return 0, 0, fmt.Errorf("Minuten müssen zwischen 0 und 59 liegen")
	}

	return hours, minutes, nil
}


//Post zu /results, neues Template