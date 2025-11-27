package main

import (
	"fmt"
	"io/fs"
	"net/http"
	"slices"
	"strconv"
	"strings"
	"time"

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

	monthNames := []string{
		"Januar", "Februar", "März", "April", "Mai", "Juni",
		"Juli", "August", "September", "Oktober", "November", "Dezember",
	}

	weekdayNames := []string{
		"Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag",
	}

	weekdayNamesShort := []string{
		"So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa.",
	}

	router.POST("/results.html", func(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Parse-Fehler! Beende Funktion", http.StatusBadRequest)
			return
		}

		// templates.ExecuteTemplate(w, resultsHtml, nil) //

		monthStr := r.PostFormValue("month")
		yearStr := r.PostFormValue("year")

		month, _ := strconv.Atoi(monthStr)
		month = month + 1 // 0-11 in JS, 1-12 in Go
		year, _ := strconv.Atoi(yearStr)

		var monthName string

		if month >= 1 && month <= 12 {
			monthName = monthNames[month-1] //Rückkorrektur auf 0 damit Schleifenlogik funktioniert
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
			fmt.Println("key => ", key)

			workdaySuffix := strings.TrimPrefix(key, "day")
			workday := strings.TrimSuffix(workdaySuffix, "_start")

			startTime := r.PostFormValue("day" + workday + "_start")
			endTime := r.PostFormValue("day" + workday + "_end")

			// workdays, _ := strconv.Atoi(workday)
			if startTime == "" || endTime == "" {
				fmt.Printf("Tag %s: Start oder Ende fehlt.", workday)
				fmt.Fprintf(w, "Tag %s: Startzeit oder Endzeit fehlt.", workday)
				continue
			}

			workTimes[workday] = TimeEntry{
				Start: startTime,
				End:   endTime,
			}

			fmt.Printf("----------------------\nTag hinzugefügt: %s: %s - %s", workday, startTime, endTime)
		}

		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		fmt.Fprintf(w, "<h3>Empfangene Daten:</h3>")
		fmt.Fprintf(w, "<h3>Arbeitsstunden - %s %d:</h3>", monthName, year)

		var incrMinutes int
		var incrHours int
		var weekMinutes int
		var weekHours int

		//dayKeys := slices.Sorted(maps.Keys(workTimes))
		dayKeys := make([]string, 0, len(workTimes))
		for key := range workTimes {
			dayKeys = append(dayKeys, key)
		}
		
		dayKeysInt := make([]int, 0, len(dayKeys))
		for _, keyStr := range dayKeys {
			keyInt, err := strconv.Atoi(keyStr)
			if err != nil {
				err.Error()
				continue
			}
			dayKeysInt = append(dayKeysInt, keyInt)
		}

		slices.Sort(dayKeysInt)

		var lastWeek int

		for _, day := range dayKeysInt {
			times := workTimes[strconv.Itoa(day)]
			dayStr, _ := strconv.Atoi(strconv.Itoa(day))

			currentDate := createDate(year, month, day)
			weekNumber := getWeekNumber(currentDate)
			weekdayName := weekdayNames[currentDate.Weekday()]

			if weekNumber != lastWeek {
				if lastWeek != 0 {
					fmt.Fprintf(w, "<hr>")
					totalWeekMinutes := weekMinutes % 60
					totalWeekHours := weekHours + int(weekMinutes/60)

					fmt.Fprintf(w, "<p><b>Wochensumme: %02d:%02d</p></b>", totalWeekHours, totalWeekMinutes)
					fmt.Fprintf(w, "<hr>")
				}
				weekMinutes = 0
				weekHours = 0

				mondayDate := getMondayOfWeek(currentDate)
				fridayDate := mondayDate.AddDate(0, 0, 4)

				fmt.Fprintf(w, "<h4>KW %v (Mo. %02v.%02v. - Fr. %02v.%02v.)</h4>",
					weekNumber,
					mondayDate.Day(),
					int(mondayDate.Month()),
					fridayDate.Day(),
					int(fridayDate.Month()))

				lastWeek = weekNumber
			}

			fmt.Fprintf(w, "<p><b>%s, %02v.%s %v</b>: %02v bis %02v gearbeitet.</p>\n",
				weekdayName, dayStr, monthName, year, times.Start, times.End)

			hours, minutes, err := calculateHours(times.Start, times.End)
			if err != nil {
				fmt.Println("Fehler bei der Arbeitszeitberechnung am", day, monthName, year, err.Error())
				fmt.Fprintf(w, "<p style='color:red;'>Problem am %02v %v %v - Am Vormittag (%v) oder am Nachmittag (%v): %v</p>", day, monthName, year, times.Start, times.End, err.Error())
				continue
			}

			weekMinutes += minutes
			weekHours += hours

			incrMinutes += minutes
			incrHours += hours

			fmt.Fprintf(w, "Arbeitszeit %s: %v Stunden, %v Minuten", weekdayNamesShort[currentDate.Weekday()], hours, minutes)
		}

		if lastWeek != 0 {
			totalWeekMinutes := weekMinutes % 60
			totalWeekHours := weekHours + int(weekMinutes/60)
			fmt.Fprintf(w, "<p><b>Wochensumme KW %v: %02d Stunden, %02d Minuten</p></b>", lastWeek, totalWeekHours, totalWeekMinutes)
		}

		totalMinutes := incrMinutes % 60
		totalHours := incrHours + int(incrMinutes/60)
		fmt.Fprintf(w, "<hr><b><u><p>Gesamtarbeitszeit</u></b> %v %v: %d Stunden, %d Minuten", monthName, year, totalHours, totalMinutes)

		fmt.Fprintf(w, "<hr>")
		fmt.Fprintf(w, "<br><a href='/'>Zurück</a>")
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

func getWeekNumber(date time.Time) int {
	_, week := date.ISOWeek()
	return week
}

func getMondayOfWeek(date time.Time) time.Time {
	weekday := date.Weekday()
	daysToMonday := 0
	switch weekday {
	case 0:
		daysToMonday += 1
	case 1:
		daysToMonday = 0 //nötig?
	case 2:
		daysToMonday -= 1
	case 3:
		daysToMonday -= 2
	case 4:
		daysToMonday -= 3
	case 5:
		daysToMonday -= 4
	case 6:
		daysToMonday -= 5
	}
	return createDate(int(date.Year()), int(date.Month()), date.Day()+daysToMonday)
}

func createDate(year, month, day int) time.Time {
	return time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
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

/*
function setupFormatting(input){
  input.addEventListener('input', function() {
    // Nur Ziffern erlauben
    let value = input.value.replace(/[^0-9]/g, '');

    // Max 4 Ziffern
    if (value.length > 4) {
      value = value.slice(0, 4);
    }

    // Bei 4 Ziffern: Doppelpunkt in der Mitte einfügen
    if (value.length === 4) {
      input.value = value.slice(0, 2) + ':' + value.slice(2);
    } else {
      input.value = value;
    }
  });
}
*/

//todo:
//Dezember "unbekannt"
//Zwischenspeicher wird durch "zurücksetzen" (js-button) nicht geleert
//KW wird vor und über Monat hinaus angegeben.
//Auswertung (bzw. Anzeige) beginnt eine Woche zu spät? Aber nur manchmal
//Wochenrechnung aktuell komplett durcheinander.
