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
	"github.com/rs/zerolog/log"

	"github.com/julienschmidt/httprouter" //Standard-Router probieren
)

var debug bool = true

//go:embed templates/*
//go:embed static/*
var embeddedFS embed.FS

const indexHtml = "index.html"
const resultsHtml = "results.html"

// irgendwann nicht mehr global deklarieren
var templates = template.Must(template.ParseFS(embeddedFS, "templates/*.html"))

/*Zentrale Datenstruktur, die alle anderen beinhaltet. Zur Übergabe und Ausführung als Template*/
type Content struct {
	MonthName string
	Year      int
	WorkTimes []TimeEntry
	WeekTimes []Weeks
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
}

/*Datenstruktur für alle wochenrelevanten Daten*/
type Weeks struct {
	WeekNumber int
	Hours      int
	Minutes    int
	Monday     int
	Friday     int
}

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
	router.GET("/", func(w http.ResponseWriter, r *http.Request, params httprouter.Params) {

		err := templates.ExecuteTemplate(w, indexHtml, nil)

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

	for index, workdayInt := range sortedKeys { //z.B. 1, 2, 3, 6, 7, 8, 9, 10, 13, 14

		fmt.Printf("\n------start-of-loop------------\n; index (loop) = %v and workdayInt (date) = %v", index, workdayInt)
		if debug {
			fmt.Println("\ndebug: workdayInt => ", workdayInt)
		}
		fmt.Printf("\nLänge von sortedKeys (muss Anzahl Tagen entsprechen) = %v", len(sortedKeys))

		workday := strconv.Itoa(workdayInt)                      //Integer zu String; Tag zw. 1 und 31
		workdayDate := createDate(year, month, workdayInt).Day() //nötig?

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

		currentDate := createDate(year, month, workdayInt)

		mondayDate, err := getMondayOfWeek(currentDate)
		fridayDate := mondayDate.AddDate(0, 0, 4)
		if err != nil {
			// formError += err.Error()
			fmt.Printf("\n<<<<<<<<<<<<<<<<<<<< < < < < < < Problem bei der Kalkulation des Montags: %v", err.Error())
		}

		monday := mondayDate.Day()
		friday := fridayDate.Day()

		test := fmt.Sprintf("\ntest:\nstart:%v\nend:%v\nweekday:%v\nworkdaydate:%v\nerror:%v\nrelativemonday:%v\nrelativefriday:%v\n", startTime, endTime, currentDate, workdayDateString, formError, monday, friday)
		fmt.Println(test)

		hours, minutes, err := calculateHours(startTime, endTime)
		if err != nil {
			formError += fmt.Sprintf("\nFehler bei der Kalkulation von %v, %v. %v: %v", weekdayNames[int(currentDate.Weekday())], workdayInt, monthNames[month-1], err.Error())
		}

		var isFirstWorkdayInWeek bool
		if index != 0 {
			isFirstWorkdayInWeek = getWeekNumber(createDate(year, month, sortedKeys[index-1])) != getWeekNumber(currentDate)
		} else {
			isFirstWorkdayInWeek = true
		}

		content.WorkTimes = append(content.WorkTimes, TimeEntry{
			Start:                startTime,                                //bspw. 08:13
			End:                  endTime,                                  //bspw. 16:35
			Weekday:              weekdayNames[int(currentDate.Weekday())], //check
			WorkdayDate:          workdayDateString,                        //bspw. "16"
			Error:                formError,                                // "" oder Fehler
			RelativeMonday:       monday,
			RelativeFriday:       friday,
			Hours:                hours,
			Minutes:              minutes,
			IsFirstWorkdayInWeek: isFirstWorkdayInWeek,
		})

		fmt.Printf("\nZu content.WorkTimes hinzugefügt: \nStart: %v\nEnd: %v\nWeekday: %v\nWorkdayDate: %v\nError: %v\nRelativeMonday: %v\nRelativeFriday: %v\nHours: %v\nMinutes: %v\n", startTime, endTime, weekdayNames[int(currentDate.Weekday())], workdayDateString, formError, monday, friday, hours, minutes)
		// fmt.Printf("\nLänge von content.WorkTimes: %v\n", len(content.WorkTimes))
		// fmt.Printf("\nWorkTimes hinzugefügt: %+v\n", content.WorkTimes[len(content.WorkTimes)-1])
		fmt.Printf("\nAktuelle Länge von content.WorkTimes: %d\n", len(content.WorkTimes))

		totalMinutes += minutes % 60
		totalHours += hours + int(minutes/60)

		if debug {
			fmt.Printf("---------end-of-loop----------\n %v. Tag hinzugefügt: Datum=%v\n--------------", index+1, workdayInt)
		}

		if index == len(sortedKeys)-1 {
			fmt.Println("\n-----------exiting loop 1----------")
			content.TotalTime.Minutes = totalMinutes % 60
			content.TotalTime.Hours = totalHours + (int(totalMinutes / 60))
		}

	}

	for index, day := range sortedKeys {
		if index == 0 {
			fmt.Println("\n------entering loop 2-------")
		}
		fmt.Println("- - - loop 2 start; round", index)
		fmt.Printf("\nLänge von sortedKeys: %v", len(sortedKeys))
		fmt.Printf("\nAktueller Durchlauf: %v", index)
		fmt.Printf("\nNächster theoretischer Durchlauf: %v", index+1)

		var weekMinutes int
		var weekHours int

		if day == 0 {
			fmt.Println("\n------------ error: day is 0 (has to be at least 1 and at most 31)")
			return
		}
		fmt.Printf("\nVorm Check: Länge von content.WorkTimes = %v, Variable day, die eingesetzt wird = %v", len(content.WorkTimes), day)

		var currentIteration TimeEntry
		for _, entry := range content.WorkTimes {
			if entry.WorkdayDate == strconv.Itoa(day) {
				currentIteration = entry
				break
			}
		}

		currentDate := createDate(year, month, day)
		fmt.Printf("Erstelle date für day %v: %v", day, currentDate)

		weekNumber := getWeekNumber(currentDate)

		weekHours += currentIteration.Hours
		weekMinutes += currentIteration.Minutes
		fmt.Printf("weekNumber: %v", weekNumber)
		mondayDate, errg := getMondayOfWeek(currentDate)
		monday := mondayDate.Day()
		friday := monday + 4
		if errg != nil {
			fmt.Println(errg.Error())
			monday = 0
			friday = 0
		}

		var isLastWorkdayInWeek bool
		isLastIndexInList := index == len(sortedKeys)-1
		if !isLastIndexInList {
			isLastWorkdayInWeek = getWeekNumber(createDate(year, month, sortedKeys[index+1])) != getWeekNumber(currentDate)
		}
		fmt.Printf("\n??isLastWorkdayInWeek is %v, date: %v", isLastWorkdayInWeek, day)
		fmt.Printf("\n??isLastIndexInList is %v, date: %v", isLastIndexInList, day)

		if isLastWorkdayInWeek || isLastIndexInList {
			content.WeekTimes = append(content.WeekTimes, Weeks{
				WeekNumber: weekNumber,
				Monday:     monday,
				Friday:     friday,
				Hours:      weekHours,
				Minutes:    weekMinutes,
			})
			fmt.Printf("\nZu content.weekTimes hinzugefügt: \nWeekNumber: weekNumber - %v,Monday: \nmonday - %v,Friday: \nfriday - %v,Hours: \nweekHours - %v,Minutes: \nweekMinutes - %v", weekNumber, monday, friday, weekHours, weekMinutes)
		}
		if index == len(sortedKeys) {
			fmt.Println("------leaving loop 2-------")
		} else {
			fmt.Println("- - - - end of loop 2 (repeating)")
		}
	}

	fmt.Printf("Content vor Template-Ausführung: %+v\n", content)
	errt := templates.ExecuteTemplate(w, resultsHtml, content)
	if errt != nil {
		fmt.Println("\nfehler beim ausführen des templates:", errt.Error())
		http.Error(w, "fehler beim ausführen des templates", http.StatusInternalServerError) //header?
	}

}
func getWeekNumber(date time.Time) int {
	year, week := date.ISOWeek()
	if year != date.Year() { //test
		return 1
	}
	return week
}

// Ermittelt zugehöriges Montagsdatum zum mitgegebenen Datum. Fehler falls Montag im vergangenen Monat liegt
func getMondayOfWeek(date time.Time) (time.Time, error) {
	weekday := date.Weekday()
	daysToMonday := 0
	switch weekday {
	case 0:
		daysToMonday += 1
	case 1:
		daysToMonday = 0
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
	mondayDate := date.AddDate(0, 0, daysToMonday)

	if int(mondayDate.Weekday()) != 1 {
		return date, fmt.Errorf("Montag konnte nicht errechnet werden")
	}
	if mondayDate.Month() != date.Month() {
		return mondayDate, fmt.Errorf("Montag liegt im vergangenen Monat")
	}
	return mondayDate, nil
}

// Funktion erhält Integer für Jahr, Monat und Tag und erstellt ein Date-Objekt vgl. Javascript
func createDate(year, month, day int) time.Time {
	date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
	if date.Year() != year || int(date.Month()) != month || date.Day() != day {
		panic(fmt.Sprintf("\n\nUngültiges Datum: Jahr=%v, Monat=%v/%v, Tag=%v\n\n", year, month, time.Month(month), day))
	}
	return date
}

// Funktion nimmt zwei Strings jeweils im Format "HH:MM"
//
//	2 Rückgabewerte: Stunden und Restminuten
//	Links: Startzeit
//	Rechts: Endzeit
//	Links wird von Rechts subtrahiert, um die Gesamtarbeitszeit zu ermitteln
func calculateHours(left, right string) (hours, minutes int, err error) {
	//Jeweils
	//Umwandlung String in Integerwerte von Stunden und Minuten
	leftHours, leftMinutes, err := parseTime(left)
	if err != nil {
		return 0, 0, err
	}
	rightHours, rightMinutes, err := parseTime(right)
	if err != nil {
		return 0, 0, err
	}

	//Startzeit in Minuten (z.B. 08:05) = 8*60 + 5
	startShift := leftHours*60 + leftMinutes
	//Schlusszeit in Minuten
	endShift := rightHours*60 + rightMinutes

	if endShift < startShift {
		return 0, 0, fmt.Errorf("Endzeit liegt vor Startzeit")
	}

	//%60 gibt Restminuten, die keine volle Stunde ergeben
	workminutes := (endShift - startShift) % 60

	//Endminuten minus Startminuten ergibt Dezimalzahl von Stunden und Anteilstunden Arbeitszeit. I
	//Int-Konvertierung schneidet Kommastellen ab - es verbleiben die vollen Stunden
	workhours := int((endShift - startShift) / 60)

	return workhours, workminutes, nil
}

/*
Funktion nimmt einen Uhrzeit-String (z.B. 08:00) und wandelt ihn in Integer um

	Rückgabe: Stunden und Minuten Restzeit
	Alternativ: 0 und Fehlermeldung bei Minuswerten oder > 23 Stunden / > 59 Minuten
*/
func parseTime(timeStr string) (hours, minutes int, err error) {
	//Erstellt ein String-Array bestehend aus zwei Einträgen aus einer Tageszeitangabe im Format HH:MM
	timeArr := strings.Split(timeStr, ":")
	if len(timeArr) != 2 {
		return 0, 0, fmt.Errorf("\nFunktion Parsetime erwartet genau 2 Werte")
	}

	hours, err = strconv.Atoi(timeArr[0])
	if err != nil {
		return 0, 0, fmt.Errorf("\nKonnte Stunden nicht umwandeln (Eingabeformat muss `HH:MM´ sein)")
	}
	minutes, err = strconv.Atoi(timeArr[1])
	if err != nil {
		return 0, 0, fmt.Errorf("\nKonnte Minuten nicht umwandeln (Eingabeformat muss `HH:MM´ sein)")
	}

	if hours < 0 || hours > 23 {
		return 0, 0, fmt.Errorf("\nStunden müssen zwischen 0 und 23 liegen")
	}
	if minutes < 0 || minutes > 59 {
		return 0, 0, fmt.Errorf("\nMinuten müssen zwischen 0 und 59 liegen")
	}
	if hours <= 0 && minutes <= 0 {
		return 0, 0, fmt.Errorf("\nKeine gültigen Zahlenwerte")
	}

	return hours, minutes, nil
}

//Schleifen konsolidieren
