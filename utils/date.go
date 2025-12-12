package utils

import (
	"fmt"
	"time"
)

// Ermittelt ISO-Wochennummer bzw. Kalenderwoche des übergebenen Datums
func GetWeekNumber(date time.Time) int {
	_, week := date.ISOWeek()

	// lastWeek, _ := getMondayOfWeek(date)
	// if date.Year() != lastWeek.AddDate(0, 0, 4).Year(){
	// 	return 53
	// }

	return week
}

// Ermittelt zugehöriges Montagsdatum zum mitgegebenen Datum. Fehler falls Montag im vergangenen Monat liegt
func GetMondayOfWeek(date time.Time) (time.Time, error) {
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

//Funktion erhält Integer für Jahr, Monat und Tag und erstellt ein Date-Objekt vgl. Javascript
//	Ungleich Javascript werden Monate 1-12 erwartet.
//	Bei Monat 13 wird automatisch aufs nächste Jahr gerechnet
func CreateDate(year, month, day int) time.Time {
	date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC)
	if date.Year() != year || int(date.Month()) != month || date.Day() != day {
		fmt.Sprintf("\n\nUngültiges Datum: Jahr=%v, Monat=%v/%v, Tag=%v\n\n", year, month, time.Month(month), day)
	}
	return date
}
