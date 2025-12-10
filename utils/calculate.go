package utils

import (
	"fmt"
	"strconv"
	"strings"
)

// Funktion nimmt zwei Strings jeweils im Format "HH:MM"
//
//	2 Rückgabewerte: Stunden und Restminuten
//	Links: Startzeit
//	Rechts: Endzeit
//	Links wird von Rechts subtrahiert, um die Gesamtarbeitszeit zu ermitteln
func CalculateHours(left, right string) (hours, minutes int, err error) {
	//Jeweils
	//Umwandlung String in Integerwerte von Stunden und Minuten
	leftHours, leftMinutes, err := ParseTime(left)
	if err != nil {
		return 0, 0, err
	}
	rightHours, rightMinutes, err := ParseTime(right)
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
func ParseTime(timeStr string) (hours, minutes int, err error) {
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
