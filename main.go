package main

import (
	"fmt"
	"io/fs"
	"net/http"
	"slices"
	"strconv"
	"strings"

	"github.com/getlantern/systray"

	"embed"
	"html/template"

	"github.com/anokatabc/tageszaehler/metrics"
	"github.com/anokatabc/tageszaehler/utils"
	"github.com/rs/zerolog/log"

	"github.com/julienschmidt/httprouter" //Standard-Router probieren
)

var debug bool = true

//go:embed templates/*
//go:embed static/*
var embeddedFS embed.FS

const indexHtml = "index.html"
const resultsHtml = "results.html"
const howtoHtml = "howto.html"

// irgendwann nicht mehr global deklarieren
var templates = template.Must(template.ParseFS(embeddedFS, "templates/*.html"))

/*Zentrale Datenstruktur, die alle anderen beinhaltet. Zur Übergabe und Ausführung als Template*/
type Content struct {
	MonthName string
	Year      int
	WorkTimes []TimeEntry
	//WeekTimes []Weeks
	TotalTime TotalTime
}

/*Gesamtarbeitszeit im Monat*/
type TotalTime struct {
	Hours   int
	Minutes int
}

/*Datenstruktur für alle tagesrelevanten Daten*/
type TimeEntry struct {
	Weekday              string
	Start                string
	End                  string
	WorkdayDate          string
	RelativeMonday       int
	RelativeFriday       int
	Error                string
	Hours                int
	Minutes              int
	IsFirstWorkdayInWeek bool
	IsLastWorkdayInWeek  bool
	WeekHours            int
	WeekMinutes          int
	WeekNumber           int
}

/*Datenstruktur für alle wochenrelevanten Daten*/
// type Weeks struct {
// 	WeekNumber int
// 	Hours      int
// 	Minutes    int
// 	Monday     int
// 	Friday     int
// }

/*Array mit Monatnamen 0 = Januar, 11 = Dezember (wie in Javascript)*/
var monthNames = []string{
	"Januar", "Februar", "März", "April", "Mai", "Juni",
	"Juli", "August", "September", "Oktober", "November", "Dezember",
}

/*Array mit Tagesnamen 0 = Sonntag, 6 = Samstag (wie in Javascript)*/
var weekdayNames = []string{
	"Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag",
}

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
	//router.GET("/howto.html", )
	router.GET("/index.html", func(w http.ResponseWriter, r *http.Request, params httprouter.Params) {

		err := templates.ExecuteTemplate(w, indexHtml, nil)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})
	router.GET("/", func(w http.ResponseWriter, r *http.Request, params httprouter.Params) {

		err := templates.ExecuteTemplate(w, indexHtml, nil)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})
	router.GET("/howto.html", func(w http.ResponseWriter, r *http.Request, params httprouter.Params) {

		err := templates.ExecuteTemplate(w, howtoHtml, nil)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	})

	// weekdayNamesShort := []string{
	// 	"So.", "Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa.",
	// }

	router.POST("/results.html", func(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "parse-fehler! beende funktion", http.StatusBadRequest)
			return
		}

		handlePost(w, r, params)
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
	fmt.Println("\nServer läuft auf http://localhost:3000\n- abrufbar via Browser über diese Adresse")

	err := httpServer.ListenAndServe()

	log.Fatal().Err(err).Msg("\nserver failed")

	// router.GET("/", ...)
	systray.Run(onReady, nil)
}

func onReady() {
	systray.SetTitle("Mein Server")
	systray.SetTooltip("Webseite ist aufrufbar unter http://localhost:3000")
	mQuit := systray.AddMenuItem("Beenden", "Server beenden")

	//Warte auf Klick auf "Beenden"
	go func() {
		<-mQuit.ClickedCh
		systray.Quit()
	}()
}

func handlePost(w http.ResponseWriter, r *http.Request, params httprouter.Params) {
	//Instanziierung von Content{} zugunsten der Stück-für-Stück-Auffüllung
	//Dient der letztendlichen Übergabe an und Ausführung des Templates
	content := Content{}

	//Monat und Jahr aus JS hidden field entnommen
	monthStr := r.PostFormValue("month")
	yearStr := r.PostFormValue("year")

	month, _ := strconv.Atoi(monthStr) //Umwandlung in Integer
	month = month + 1                  // Monate sind 0-11 in JS, 1-12 in Go
	year, _ := strconv.Atoi(yearStr)

	var monthName string //Deklaration zwecks Scope über If-Verzweigungen
	if month >= 1 && month <= 12 {
		monthName = monthNames[month-1] //Rückkorrektur -1 weil Array-Indexe 0-11 sind
	} else {
		monthName = "Unbekannt"
	}

	content.MonthName = monthName
	content.Year = year

	sortedKeys := make([]int, 0, len(r.PostForm))

	for key := range r.PostForm { //Post erstmalig durchiterieren

		//hier soll nach Start-Tagen gefiltert werden,
		//	um nach diesen zu iterieren -> Ihr Format: "day${date}_start"
		if !strings.HasSuffix(key, "_start") {
			continue
		}
		if debug {
			// fmt.Println("debug: key => ", key)
		}

		//Aufbereitung des Schlüssels für Iterierung und Auslesen des Integers
		workdaySuffix := strings.TrimPrefix(key, "day")        //"day${date}_start" -> "${date}_start"
		workday := strings.TrimSuffix(workdaySuffix, "_start") // "${date}_start" -> "${date}" (Variable) -> Zahl 1 - 31
		workdayInt, _ := strconv.Atoi(workday)

		if workdayInt <= 0 || workdayInt > 31 {
			fmt.Printf("\nUngültiger Tag! workdayInt = %v", workdayInt)
		}
		sortedKeys = append(sortedKeys, workdayInt)
		slices.Sort(sortedKeys)
	}

	var totalMinutes int //zur Hochinkrementierung
	var totalHours int   //zur Hochinkrementierung

	for index, value := range sortedKeys {
		fmt.Printf("\nIndex und Wert aller sortedKeys (muss Anzahl Tagen entsprechen) = %v : %v", index, value)
	}

	type WeekData struct {
		Hours   int
		Minutes int
	}

	weekAccumulator := make(map[int]*WeekData)

	for index, workdayInt := range sortedKeys {

		fmt.Printf("\n------start-of-loop------------\n; index (loop) = %v and workdayInt (date) = %v", index, workdayInt)
		if debug {
			fmt.Println("\ndebug: workdayInt => ", workdayInt)
		}
		fmt.Printf("\nLänge von sortedKeys (muss Anzahl Tagen entsprechen) = %v", len(sortedKeys))

		workday := strconv.Itoa(workdayInt)                            //Integer zu String; Tag zw. 1 und 31
		workdayDate := utils.CreateDate(year, month, workdayInt).Day() //nötig?

		errf := fmt.Sprintf("\n- - -  --  --Monat String: %v Integer: %v", monthName, month)
		fmt.Print(errf)

		//Rück-Konkatenation der Strings zugunsten der Abfrage der Uhrzeiten
		startTime := r.PostFormValue("day" + workday + "_start") //Start-Uhrzeit
		endTime := r.PostFormValue("day" + workday + "_end")     //End-Uhrzeit

		var formError string

		//Einfache Validierung. Behandlung stc
		if startTime == "" || endTime == "" {
			formError = (fmt.Sprintf("\ntag %s: startzeit oder endzeit fehlt\n", workday))
			fmt.Print(formError)
			continue
		}

		workdayDateString := strconv.Itoa(workdayDate) // z.B. 16 -> "16"

		currentDate := utils.CreateDate(year, month, workdayInt)

		mondayDate, err := utils.GetMondayOfWeek(currentDate)

		for i := 0; i < 2; i++ {

		}
		fridayDate := mondayDate.AddDate(0, 0, 4)

		if fridayDate.Year() > year {
			daysInMonth := utils.CreateDate(year, month+1, 0).Day() //z.B. 31
			dateDiff := daysInMonth - mondayDate.Day()              //z.B. 3
			fridayDate = mondayDate.AddDate(0, 0, dateDiff)
			fmt.Println("Freitagsdatum liegt über dem aktuellen Jahr - neues Datum:", fridayDate.Local().UTC())
		}
		if err != nil {
			// formError += err.Error()
			fmt.Printf("\n<<<<<<<<<<<<<<<<<<<< < < < < < < Problem bei der Kalkulation des Montags: %v", err.Error())
		}

		monday := mondayDate.Day()
		friday := fridayDate.Day()

		test := fmt.Sprintf("\ntest:\nstart:%v\nend:%v\nweekday:%v\nworkdaydate:%v\nerror:%v\nrelativemonday:%v\nrelativefriday:%v\n", startTime, endTime, currentDate, workdayDateString, formError, monday, friday)
		fmt.Println(test)

		hours, minutes, err := utils.CalculateHours(startTime, endTime)
		if err != nil {
			formError += fmt.Sprintf("\nFehler bei der Kalkulation von %v, %v. %v: %v", weekdayNames[int(currentDate.Weekday())], workdayInt, monthNames[month-1], err.Error())
		}

		var isFirstWorkdayInWeek bool
		if index != 0 {
			isFirstWorkdayInWeek = utils.GetWeekNumber(utils.CreateDate(year, month, sortedKeys[index-1])) != utils.GetWeekNumber(currentDate)
		} else {
			isFirstWorkdayInWeek = true
		}

		var isLastWorkdayInWeek bool
		if index < len(sortedKeys)-1 {
			nextDate := utils.CreateDate(year, month, sortedKeys[index+1])
			isLastWorkdayInWeek = utils.GetWeekNumber(currentDate) != utils.GetWeekNumber(nextDate)
			if debug {
				fmt.Printf("\nIndex %d: currentWeek=%d, nextWeek=%d, isLast=%v",
					index, utils.GetWeekNumber(currentDate), utils.GetWeekNumber(nextDate), isLastWorkdayInWeek)
			}
		} else {
			isLastWorkdayInWeek = true
			fmt.Println("\nLetzter Tag in sortedKeys → isLastWorkdayInWeek = true")
		}

		weekNumber := utils.GetWeekNumber(currentDate)

		if weekAccumulator[weekNumber] == nil {
			weekAccumulator[weekNumber] = &WeekData{}
		}
		weekAccumulator[weekNumber].Hours += hours
		weekAccumulator[weekNumber].Minutes += minutes

		weekMinutes := weekAccumulator[weekNumber].Minutes % 60
		weekHours := weekAccumulator[weekNumber].Hours + (weekAccumulator[weekNumber].Minutes / 60)

		content.WorkTimes = append(content.WorkTimes, TimeEntry{
			Start:                startTime,
			End:                  endTime,
			Weekday:              weekdayNames[int(currentDate.Weekday())],
			WorkdayDate:          workdayDateString,
			Error:                formError,
			RelativeMonday:       monday,
			RelativeFriday:       friday,
			Hours:                hours,
			Minutes:              minutes,
			IsFirstWorkdayInWeek: isFirstWorkdayInWeek,
			IsLastWorkdayInWeek:  isLastWorkdayInWeek,
			WeekNumber:           weekNumber,
			WeekHours:            weekHours,
			WeekMinutes:          weekMinutes,
		})

		for dayIndex, day := range content.WorkTimes {
			fmt.Printf("\neach entry in WorKTimes - dayIndex %v, day %v", dayIndex, day)
		}

		fmt.Printf("\nZu content.WorkTimes hinzugefügt: \nStart: %v\nEnd: %v\nWeekday: %v\nWorkdayDate: %v\nError: %v\nRelativeMonday: %v\nRelativeFriday: %v\nHours: %v\nMinutes: %v\nWeekNumber: %v\nWeekHours: %v\nWeekMinutes: %v\n",
			startTime, endTime, weekdayNames[int(currentDate.Weekday())], workdayDateString, formError, monday, friday, hours, minutes, weekNumber, weekHours, weekMinutes)
		fmt.Printf("\nAktuelle Länge von content.WorkTimes: %d\n", len(content.WorkTimes))

		//testfix
		//totalMinutes += minutes % 60
		//totalHours += hours + int(minutes/60)
		totalMinutes += minutes
		totalHours += hours

		if debug {
			fmt.Printf("---------end-of-loop----------\n %v. Tag hinzugefügt: Datum=%v\n--------------", index+1, workdayInt)
		}

		if index == len(sortedKeys)-1 {
			fmt.Printf("\n-----------iteration completed - exiting loop. Hours: %v, Minutes: %v----------", totalHours, totalMinutes)
			content.TotalTime.Minutes = totalMinutes % 60
			content.TotalTime.Hours = totalHours + (int(totalMinutes / 60))
		}
	}

	fmt.Printf("Content vor Template-Ausführung: %+v\n", content)
	errt := templates.ExecuteTemplate(w, resultsHtml, content) //als Pointer
	if errt != nil {
		fmt.Println("\nfehler beim ausführen des templates:", errt.Error())
		http.Error(w, "fehler beim ausführen des templates", http.StatusInternalServerError)
	}
}

//pointer anschauen
//funktionale programmierung structs
