/** @type {HTMLDivElement} */
// let monthDropdown;
/** @type {HTMLDivElement} */
// let yearDropdown;
/** @type {HTMLDivElement} */
// let dayDropdown;
const pasteTextarea = document.getElementById('textarea');
const textareaBtn = document.getElementById('textarea-btn');
document.getElementById('textarea-info').addEventListener('click', () => {
  alert("Hier kann ein beliebig langer String eingefügt werden. Alle Uhrzeiten-Werte im Format HH:MM werden beim Einfügen der Reihe nach in bestehende Formularfelder eingefügt. \n(Dazu müssen natürlich bereits Tage/Wochen hinzugefügt worden sein).\n\nSofern das automatische Einfügen aus irgendeinem Grund nicht funktioniert hat, kann es über den Button erneut eingefügt werden. Das automatische Einfügen reagiert auf die Einfüge-Aktion, nicht einfache Eingaben.")
});

document.addEventListener('DOMContentLoaded', function(){

  document.getElementById('textarea-show').addEventListener('click', () => {
    setTimeout(textAreaShow, 50);
  });

  document.getElementById('textarea-btn').addEventListener('click', pasteTimes);

  pasteTextarea.addEventListener('paste', () => {
    pasteTimes();

    setTimeout(pasteTimes, 100)
  });

  console.log('Dom fertig geladen, initialisiere Dropdowns.')
  window.monthDropdown = document.getElementById('month-select');
  window.yearDropdown = document.getElementById('year-select');
  window.dayDropdown = document.getElementById('day-select');
  datepicker = document.getElementById('datepicker');
  const calendarElement = document.querySelector('input[type="date"]')
  console.log('Dropdowns zugewiesen, lade Funktionen.')
  yearSelect();
  monthSelect(); //befülle Dropdown mit Monaten, aktueller Monat Vorauswahl
  daySelect();

  datepicker.addEventListener('click', setupDatepicker);
  calendarElement.addEventListener('changeDate', pickDate);

  document.getElementById('addWeek').addEventListener('click', addWeek);

  document.getElementById('days').addEventListener('click', function(event) {
    // Einzelne Tage löschen
    if (event.target.classList.contains('delete-day-btn')) {
      const row = event.target.closest('.workdays');
      const dayLabel = row.querySelector('.day-label').textContent;
      row.remove();
      console.log('Zeile ' + dayLabel + ' gelöscht.');
    }
  
    // Ganze Woche löschen
    if (event.target.classList.contains('delete-week-btn')) {
      const h2 = event.target.closest('h2.week');
      const weekLabel = h2.textContent.trim().split('\n')[0]; // Nur den Text ohne Button
    
      // Finde alle .workdays nach diesem <h2> bis zum nächsten <h2>
      let nextElement = h2.nextElementSibling;
      const elementsToRemove = [];
    
      while (nextElement && !nextElement.classList.contains('week')) {
        if (nextElement.classList.contains('workdays')) {
          elementsToRemove.push(nextElement);
        }
        nextElement = nextElement.nextElementSibling;
      }
    
      elementsToRemove.forEach(el => el.remove());
      
      h2.remove();
      
      console.log(`Woche "${weekLabel}" komplett gelöscht (${elementsToRemove.length} Tage).`);
  }
  });
  document.getElementById('day-select').addEventListener('change', function(){
    syncCalendar();
    dayCount = parseInt(dayDropdown.value);
    weekCount = 0;
  });
  document.getElementById('month-select').addEventListener('change', function(){
    syncCalendar();
    clearPage();
  });
  document.getElementById('clear').addEventListener('click', function(){
    clearPage();
  });
  document.getElementById('year-select').addEventListener('change', function(){
    syncCalendar(true);
    clearPage();
    monthDropdown.value = 0;
    let nextWorkday = 1;
    switch (new Date(parseInt(yearDropdown.value), 0, 1).getDay()){
      case 0:
        nextWorkday += 1;
        break;
      case 6:
        nextWorkday += 2;
        break;
    }
    // (new Date(parseInt(yearDropdown.value), 1, 1).getDay() == 0) ? nextWorkday+=1 : nextWorkday-=3;
    dayDropdown.value = nextWorkday;
  });
  document.querySelector('form').addEventListener('submit', function(event) {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-select').value;
    if (!document.querySelector('input[name="month"]')) {
        const monthInput = document.createElement('input');
        monthInput.type = 'hidden';
        monthInput.name = 'month';
        monthInput.value = month;
        this.appendChild(monthInput);
    }

    if (!document.querySelector('input[name="year"]')) {
        const yearInput = document.createElement('input');
        yearInput.type = 'hidden';
        yearInput.name = 'year';
        yearInput.value = year;
        this.appendChild(yearInput);
    }
  });
  
});
 
function isDateValid(dateString){
  return !isNaN(new Date(dateString));
}

function setupDatepicker(event){
  event.preventDefault();
  const position = datepicker.getBoundingClientRect();
  const calendarDiv = document.getElementById('calendar-outer');
  
  calendarDiv.style.position = 'absolute';
  calendarDiv.style.top = `${position.bottom+5}px`; //+ window.scrollY
  // calendarDiv.style.left = `${position.left-200}px`; //+ window.scrollX
  calendarDiv.style.left = "25%"
}

function pickDate(event){
  event.preventDefault();
}

function clearPage(){
  document.querySelectorAll('.workdays').forEach(el => el.remove());
  document.querySelectorAll('h2').forEach(el => el.remove());

  weekCount = 0; //für 'Woche hinzufügen' Button

  //besser?
  // const workdays = document.getElementsByClassName('workdays');
  // Array.from(workdays).forEach(element => element.remove());

  dayCount = 1; //todo: resetten basierend auf Monat... (if month && if year)
  //if sa/so
  //dayCount = preselectedDate;
  //dayDropdown.value = preselectedDate;
  //else = 1
  daySelect();
}

const monthList = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

const monthListStr = {
  "Januar": 0,
  "Februar": 1,
  "März": 2,
  "April": 3,
  "Mai": 4,
  "Juni": 5,
  "Juli": 6,
  "August": 7,
  "September": 8,
  "Oktober": 9,
  "November": 10,
  "Dezember": 11
};
const weekdays = ['So','Mo','Di','Mi','Do','Fr','Sa']
let today = new Date();
/* window.onload = function() {
  monthSelect();
} */


function monthSelect(){
  if (monthDropdown==null) {
    console.error('M-Dropdown ungültig!');
    return
  }
    
  for (let i = 0; i < monthList.length; i++){
    const option = document.createElement('option');
    option.value = i; //0-11 für Monate
    option.textContent = monthList[i];
    option.class
    monthDropdown.appendChild(option)
  }

  monthDropdown.value = today.getMonth();
  console.log('Months Dropdown erfolgreich befüllt!')
}

function yearSelect(){
  if (!yearDropdown) {
    console.error('Y-Dropdown ungültig!')
    return
  }
  for (let i = -1; i<2; i++){
    const option = document.createElement('option');
    option.value = today.getFullYear()+i; //Aktuelles Jahr +- 1
    option.textContent = `${today.getFullYear()+i}`;
    yearDropdown.appendChild(option)
  }

  yearDropdown.value = today.getFullYear();
  console.log('Year Dropdown erfolgreich befüllt!')
}

//Filling Dropdown
function daySelect(){
  if (dayDropdown == null) {
    console.error('D-Dropdown ungültig!')
    return
  }

  dayDropdown.innerHTML = ''

  //Ermittle Monatslänge des ausgewählten Monats
  let daysInSelectedMonth = calculateDaysInSelectedMonth(parseInt(monthDropdown.value));

  for (let i = 1; i <= daysInSelectedMonth; i++){
    //if (weekdays[(i%7)] == 'Sa' || weekdays[(i%7)] == 'So') continue;

    const date = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), i);
    const weekdayIndex = date.getDay();  // 0-6
    const weekdayName = weekdays[weekdayIndex];
    
    if (weekdayName == 'Sa' || weekdayName == 'So') continue;

    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${i}. ${weekdayName}`;
    dayDropdown.appendChild(option);
  }

  let preselectedDate = today.getDate();
  let preselectedDay = today.getDay();
  if (weekdays[preselectedDay] == "So") preselectedDate++;
  if (weekdays[preselectedDay] == "Sa") preselectedDate+=2;

  if (today.getMonth() == parseInt(monthDropdown.value)){
    dayDropdown.value = preselectedDate;
    dayCount = parseInt(dayDropdown.value);
  }

  console.log('Days Dropdown erfolgreich befüllt!')
}

/**Errechnet das Datum des zur Woche gehörigen Montags und gibt dieses zurück
  Die Woche geht von Sonntag bis Samstag
  ** Rückgabe ist das Datum des Montags. Es wird nicht nach Monat validiert.
  *@param {Date} fulldate
  */
function calculateMonday(fulldate) {
  const dateCheck = new Date(
    fulldate.getFullYear(),
    fulldate.getMonth(),
    fulldate.getDate()
  );
  
  if (isNaN(dateCheck.getTime())) {
    console.error("calculateMonday: Ungültiges Datum!");
    alert("calculateMonday: Ungültiges Datum!");
    return null;
  }

  const dayOfWeek = dateCheck.getDay();
  
  let daysToMonday;
  switch (dayOfWeek){
  case 0: //So
    daysToMonday = 1;
    console.log("case 0")
    break;
  case 1: //Mo
    daysToMonday = 0;
    console.log("case 1")
    break;
  case 2: //Di
    daysToMonday = -1;
    console.log("case 2");
    break;
  case 3: //Mi
    daysToMonday = -2;
    console.log("case 3");
    break;
  case 4: //Do
    daysToMonday = -3;
    console.log("case 4");
    break;
  case 5: //Fr
    daysToMonday = -4;
    console.log("case 5");
    break;
  case 6: //Sa
    daysToMonday = -5;
    console.log("case 6");
    break;
  }
  
  const monday = new Date(dateCheck);
  monday.setDate(dateCheck.getDate() + daysToMonday);
  
  console.log(`calculateMonday: ${monday.getDate()} (${weekdays[monday.getDay()]})`);
  return monday;
}

/**
 * Ermittelt den nächsten freien Arbeitstag ab dem mitgegebenen Datum.
 * @param {Date} date - Das Startdatum (volles Datum) für die Suche
 * @returns {number|null} - Die Tagesnummer des nächsten freien Arbeitstags oder null, wenn kein freier Tag gefunden wurde
 */
function findNextFreeWorkdayInMonth(date) {
  const daysContainer = document.getElementById('days');
  const month = date.getMonth();
  const year = date.getFullYear();
  const startDay = date.getDate();

  //alle bereits eingetragenen Tage
  const existingDays = Array.from(daysContainer.querySelectorAll('.workdays'))
    .map(item => {
      const match = item.querySelector('.day-label').textContent.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    })
    .filter(day => day !== null);
  
    /**Gesamtlänge (letzter Tag) des Monats */
  const daysInMonth = calculateDaysInSelectedMonth(month);

  if (existingDays.length === 0) {
    console.log(`Keine Tage im Monat ausgefüllt, starte bei Tag ${startDay}`);
    //der erste Werktags des Monats (ab dayDropdown)
    for (let i = startDay; i <= daysInMonth; i++) {
      const testDate = new Date(year, month, i);
      if (testDate.getDay() !== 0 && testDate.getDay() !== 6) {
        return i; 
      }
    }
  }

  //der erste Werktags des Monats (ab dayDropdown)
  for (let i = startDay; i <= daysInMonth; i++) {
    const testDate = new Date(year, month, i);
    const dayOfWeek = testDate.getDay();
    
    // Wochenenden und bereits eingetragene Tage überspringen
    if (dayOfWeek === 0 || dayOfWeek === 6 || existingDays.includes(i)) {
      continue;
    }
    
    console.log(`Nächster freier Arbeitstag ab Tag ${startDay} ist der ${i}.`);
    return i;
  }

  console.log(`Kein freier Tag ab Tag ${startDay} gefunden`);
  return null;
}

// filepath: /opt/lampp/htdocs/projects/tageszaehler/static/main.js
let weekCount = 0;

function addWeek() {
  const selectedDate = new Date(
    parseInt(yearDropdown.value),
    parseInt(monthDropdown.value),
    parseInt(dayDropdown.value)
  );

  const daysInMonth = calculateDaysInSelectedMonth(parseInt(monthDropdown.value));
  
  let nextAvailableWorkday = findNextFreeWorkdayInMonth(selectedDate);
  
  if (nextAvailableWorkday === null) {
    alert('Alle Arbeitstage im Monat sind bereits eingetragen!');
    return;
  }

  const startDate = new Date(
    parseInt(yearDropdown.value),
    parseInt(monthDropdown.value),
    nextAvailableWorkday
  );

  const mondayDate = calculateMonday(startDate);
  
  let currentWorkday = (mondayDate.getMonth() === parseInt(monthDropdown.value)) 
    ? mondayDate.getDate() 
    : nextAvailableWorkday;

  //Wochenüberschrift
  const container = document.getElementById('days');
  const h2 = document.createElement('h2');
  h2.className = 'week';
  h2.id = `week_${weekCount}`;
  
  const fridayDate = new Date(mondayDate);
  fridayDate.setDate(mondayDate.getDate() + 4);
  if (fridayDate.getMonth() != mondayDate.getMonth()){
    fridayDate.setMonth(mondayDate.getMonth());
    fridayDate.setDate(daysInMonth);
  }
  
  h2.innerHTML = `<span style="text-wrap: nowrap;">Arbeitswoche vom</span> <span style="text-wrap: nowrap;">${currentWorkday}. bis ${fridayDate.getDate()}. ${monthList[currentMonth]}
  <button type="button" class="delete-week-btn delete-btn" tabindex="-1">🗑️</button></span>`;
  container.appendChild(h2);

  let addedDays = 0;
  let remainingDaysInWeek = 6-new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), currentWorkday).getDay();
  while (addedDays < remainingDaysInWeek && currentWorkday <= daysInMonth) {
    const currentDate = new Date(
      parseInt(yearDropdown.value),
      parseInt(monthDropdown.value),
      currentWorkday
    );
    
    const dayOfWeek = currentDate.getDay();
    
    // Überspringe Wochenenden
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentWorkday++;
      continue;
    }

    // Füge den Tag hinzu
    addDayHTML(currentWorkday);
    addedDays++;
    currentWorkday++;
  }

  weekCount++;
  
  // Aktualisiere dayCount für den nächsten freien Tag
  dayCount = currentWorkday;
}

let dayCount;
 
const startTimes = ["06:12","06:27","06:45","07:03","07:18","07:26","07:41","07:55","08:04",
  "08:17","08:29","08:46","08:53","09:05","09:14","09:27","09:35","09:48","10:02","10:10",
   "06:08","06:33","06:47","07:05","07:22","07:39","07:54","08:06","08:15","08:38","08:52",
   "09:04","09:16","09:28","09:41","09:56","10:03","10:11","10:22","10:29","25:14","07:72",
   "06:34","28:03","10:18"];
const endTimes = ["14:48","15:03","14:57","15:42","15:55","16:08","16:22","16:37","16:11",
  "16:49","17:02","17:18","17:34","17:12","17:48","17:56","18:03","18:15","16:44","17:27", 
  "14:42","15:11","14:59","15:37","15:51","16:03","16:28","16:17","16:46","17:04","17:22",
  "17:11","17:39","17:53","18:02","18:14","16:33","16:57","17:18","17:44","17:22","16:05",
  "18:77","14:59","61:15"];

/**Funktion fügt Tage zum Formular auf der index.html hinzu.
 ** Braucht 2 Parameter: Datum(Tag) und zugehöriger Wochentag
 ** (Ggf. umarbeiten um mit vollem Datum zu arbeiten)
 */
function addDayHTML(date){
  const container = document.getElementById('days');
  const div = document.createElement('div');
  // dayOfWeek = (weekday != null) ? weekday : new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), date).getDay();
  fullDate = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), date);
  dayOfWeek = fullDate.getDay();
  div.className = 'workdays'
  div.innerHTML = `
      <label class="day-label">Tag ${String(fullDate.getDate()).padStart(2, '0')}. - ${weekdays[dayOfWeek]}</label>
      <input type="text" class="start workday" name="day${date}_start" placeholder="HH:MM" >
      <input type="text" class="end workday" name="day${date}_end" placeholder="HH:MM" >
      <button type="button" tabindex="-1" class="delete-day-btn delete-btn">🗑️</button>
  `
  /* zum Testen austauschen:
  <input type="text" class="start workday" name="day${date}_start" placeholder="HH:MM" value="${startTimes[Math.floor(Math.random()*startTimes.length)]}">
  <input type="text" class="end workday" name="day${date}_end" placeholder="HH:MM" value="${endTimes[Math.floor(Math.random()*endTimes.length)]}">

  <input type="text" class="start workday" name="day${date}_start" placeholder="HH:MM" >
      <input type="text" class="end workday" name="day${date}_end" placeholder="HH:MM" >
  */

  container.appendChild(div);

  /** @type {HTMLDivElement} */
  const startInput = div.querySelector(".start");
  /** @type {HTMLDivElement} */
  const endInput = div.querySelector(".end");
  setupFormatting(startInput);
  setupFormatting(endInput);
}

function setupFormatting(input){
  input.addEventListener('input', function() {
    console.log("input",input);
    let content = input.value;
    if (content.length == 4 && !content.includes(":")){
      console.log("yes");
      // content.replace(/[^0-9]/g, '');
      input.value = content.slice(0, 2) + ":" + content.slice(2);
    } else return;
  });
}

function calculateDaysInSelectedMonth(month){
  return new Date(parseInt(yearDropdown.value), month+1, 0).getDate()
}

//continue
function calculateWorkdaysInSelectedMonth(date){
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDay();
  let monthLength = new Date(year, month+1, 0).getDate();
  let totalWorkdays = monthLength;
  for (let i = 0; i<monthLength; i++){
    // if ((date+i).getDate() === 0 || (date+i).getDate() === 6){
    if (new Date(year, month, day+i) === 0||new Date(year, month, day+i) === 6){
      totalWorkdays--;
    }
  }
  return totalWorkdays
}

//todos
//"Tag hinzufügen" entfernen


function pasteTimes(){
  const timesArray = textarea.value.match(/\d{2}:\d{2}/g) || [];
  // timesArray = ["02:40", "23:22", "12:11"];
  const daysArray = document.querySelectorAll('.workday');
  console.log("timesArray = ",timesArray)
  console.log("daysArray = ",daysArray)

  for (let i = 0; i < Math.min(daysArray.length, timesArray.length); i++) {
    console.log("daysArray[i]->",daysArray[i])
console.log("timesArray[i]->",timesArray[i])
    daysArray[i].value = timesArray[i];
  }
}

function textAreaShow(){
  if (pasteTextarea.style.display == 'block'){
    pasteTextarea.style.display = 'none'
  } else if (pasteTextarea.style.display == 'none'){
    pasteTextarea.style.display = 'block'
  }
  if (textareaBtn.style.display == 'block'){
    textareaBtn.style.display = 'none'
  } else if (textareaBtn.style.display == 'none'){
    textareaBtn.style.display = 'block'
  }
}