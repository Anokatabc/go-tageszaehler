/** @type {HTMLDivElement} */
let monthDropdown;
/** @type {HTMLDivElement} */
let yearDropdown;
/** @type {HTMLDivElement} */
let dayDropdown;

document.addEventListener('DOMContentLoaded', function(){
  console.log('Dom fertig geladen, initialisiere Dropdowns.')
  monthDropdown = document.getElementById('month-select');
  yearDropdown = document.getElementById('year-select');
  dayDropdown = document.getElementById('day-select');
  datepicker = document.getElementById('datepicker');
  const calendarElement = document.querySelector('input[type="date"]')
  console.log('Dropdowns zugewiesen, lade Funktionen.')
  yearSelect();
  monthSelect(); //befülle Dropdown mit Monaten, aktueller Monat Vorauswahl
  daySelect();

  datepicker.addEventListener('click', setupDatepicker);
  calendarElement.addEventListener('changeDate', pickDate);

  document.getElementById('addDay').addEventListener('click', addDay);
  document.getElementById('addWeek').addEventListener('click', addWeek);

  document.getElementById('days').addEventListener('click', function(event) {
    if (event.target.classList.contains('delete-day-btn')){
      const row = event.target.closest('.workdays');
      // const dayLabel = row.querySelector('.day-label').textContent;
      row.remove();
      console.log('Zeile'+dayLabel+'gelöscht.');
    }
  });
  document.getElementById('day-select').addEventListener('change', function(){
    dayCount = parseInt(dayDropdown.value);
    weekCount = 0;
  });
  document.getElementById('month-select').addEventListener('change', function(){
    clearPage();
  });
  document.getElementById('clear').addEventListener('click', function(){
    clearPage();
  });
  document.getElementById('year-select').addEventListener('change', function(){
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
 
function setupDatepicker(event){
  event.preventDefault();
  // event.target.showPicker();
  // console.log(datepicker.childNodes);
  // console.dir(datepicker);
  // datepicker.children.forEach(node => {
  //   console.log(node.nodeName, node.className);
  // });

  // console.log(datepicker); // Überprüfe, ob `datepicker` korrekt initialisiert wurde
}

function pickDate(event){
  event.preventDefault();
}

function clearPage(){
  document.querySelectorAll('.workdays').forEach(el => el.remove());
  //todo: auch header löschen
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

const monthList = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
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

/*Errechnet das Datum des zur Woche gehörigen Montags und gibt dieses zurück
  Die Woche geht von Sonntag bis Samstag*/
function calculateMonday(year, month, date) {
  
  const dateCheck = new Date(parseInt(year), parseInt(month), parseInt(date));
  if (isNaN(dateCheck.getTime())) {
    console.error("calculateMonday: Ungültiges Datum!");
    return null;
  }
  console.log("dateCheck="+dateCheck);

  const dayOfWeek = dateCheck.getDay(); //0-6
  // console.log("Übergebener Wochentag"+weekdays[dayOfWeek]+" ; "+date);

  let daysToMonday = 0;

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
    if (date-1 < 1) return date;
    daysToMonday = -1;
    console.log("case 2")
    break;
  case 3: //Mi
    if (date-2 < 1) return date;
    daysToMonday = -2;
    console.log("case 3")
    break;
  case 4: //Do
    if (date-3 < 1) return date;
    daysToMonday = -3;
    console.log("case 4")
    break;
  case 5: //Fr
    if (date-4 < 1) return date;
    daysToMonday = -4;
    console.log("case 5")
    break;
  case 6: //Sa
    if (date-5 < 1) return date;
    daysToMonday = -5;
    console.log("case 6")
    break;
  }

  const monday = new Date(year, month, (parseInt(date)+daysToMonday)); //todo: ggf. anpassen für Monatsenden/anfänge?

  console.log("calculateMonday="+parseInt(monday.getDate())+" is monday? -> "+weekdays[monday.getDay()]+". Monat: "+monthList[monday.getMonth()]+";"+monday.getMonth());
  return monday.getDate();
}


// function addWeek(){
  //   let targetDate;
  //   if (weekCount == 0){
    //     targetDate = new Date (parseInt(yearDropdown.value), parseInt(monthDropdown.value), parseInt(dayDropdown.value));
    //   }
    //   else if (weekCount > 0 && weekCount < 5){
      //     targetDate = new Date (parseInt(yearDropdown.value), parseInt(monthDropdown.value), parseInt(dayDropdown.value)+weekCount*7);
      //   } else {
        //     console.error("Maximale Wochenanzahl erreicht!")
        //     return;
        //   }
        
        
        //   // console.log("daydropdown.value"+dayDropdown.value+"wird in calculateMonday gegeben")
        
        //   const calculatedMonday = calculateMonday(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()); 
        //   //todo: besser mit date-objekt? ^
        
        //   console.log("result calculateMonday: "+calculateMonday(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()))
        //   /* 
        //   Montag kalkuliert
        //   Tage Montag bis Freitag befüllen
        
        //   */
        //   const container = document.getElementById('days');
//   const div = document.createElement('div'); //ggf. Klasse vergeben
//   div.className = 'workdays';
//   div.id = 'workdays';
//   div.innerHTML = `
//     <h2>Arbeitswoche vom ${calculatedMonday}. bis ${calculatedMonday+4}.</h2>
//   `
//   container.appendChild(div);
//   for (let i = 0; i<5; i++){
  //     const dayNumber = calculatedMonday + i;
  //     const date = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), dayNumber);
  //     const weekdayIndex = date.getDay();
  //     switch (weekdayIndex){
    //       case 6: continue;
    //       case 0: continue;
    //     }
    //     if (dayNumber > calculateDaysInSelectedMonth(parseInt(monthDropdown.value))){
      //       console.error('End of month reached!')
      //       break;
      //     }
      //     addDayHTML(dayNumber, weekdayIndex);
      //   }
      //   // 
      //   console.log(weekCount)
      //   weekCount++;
      // }
      

/**return null if month is fully free*/
function findNextFreeWorkdayInMonth(date){
const daysContainer = document.getElementById('days');
const month = date.getMonth();
const year = date.getFullYear();



//lässt sich querySelectorAll im Großen und Ganzen so verallgemeinern, dass es nach allen erdenklichen Attributen sucht, die dem angegebenen String entsprechen? Egal ob id, class, value, es findet alles das '.workdays' enthält?
//Wobei hier nicht document durchsucht wird, sondern daysContainer - ist das richtig? In diesem Fall weiß man: "days" ist ein Container mit einigen Unterelementen - und die möchte ich durchsuchen.
const existingDays = Array.from(daysContainer.querySelectorAll('.workdays'))
  .map(item => parseInt(item.querySelector('.day-label').textContent.match(/\d+/)[0]));

if (existingDays.length === 0){
  console.log("- - - keine Tage im Monat ausgefüllt, starte am Anfang")
  return null
} 

if 
console.log(`Alle ${calculateDaysInSelectedMonth(parseInt(monthDropdown.value))} Tage sind bereits generiert.`);
return null;

console.log(`Next free day (not necessarily workday) is date `,existingDays.length+1);
return existingDays.length+1;


}

let weekCount = 0;
function addWeek(){
  
  let selectedDate = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), parseInt(dayDropdown.value));
  const totalDaysInMonth = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value)+1, 0);
  const nextAvailableWorkday = findNextFreeWorkdayInMonth(selectedDate);

  let mondayDate = calculateMonday(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())



  for (let i = 1; i < totalDaysInMonth; i++){
    if (i === nextAvailableWorkday){

    }
  }

  //review
  //gegeben: year, month, day
  //gesucht: relativer Montag
  //Tage 1-5 (Mo. - Fr.) hinzufügen
  //Nächsten fehlenden Wochentag ermitteln... days.innerhtml != null und ab 1 hochzählen bi


  if (weekCount == 0){
    targetDate = new Date (parseInt(yearDropdown.value), parseInt(monthDropdown.value), parseInt(dayDropdown.value));
  }
  else if (weekCount > 0 && weekCount < 5){
    targetDate = new Date (parseInt(yearDropdown.value), parseInt(monthDropdown.value), parseInt(dayDropdown.value)+weekCount*7);
  } else {
    console.error("Maximale Wochenanzahl erreicht!")
    return;
  }



  // console.log("daydropdown.value"+dayDropdown.value+"wird in calculateMonday gegeben")

  const calculatedMonday = calculateMonday(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()); 
  //todo: besser mit date-objekt? ^
  
  console.log("result calculateMonday: "+calculateMonday(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()))
  /* 
  Montag kalkuliert
  Tage Montag bis Freitag befüllen

  */
  const container = document.getElementById('days');
  const h2 = document.createElement('h2'); //ggf. Klasse vergeben
  h2.className = `week`;
  h2.id = `week_${weekCount}`;
  h2.innerHTML = `
    <h2>Arbeitswoche vom ${calculatedMonday}. bis ${calculatedMonday+4}.</h2>
  `
  container.appendChild(h2);

  for (let i = 0; i<5; i++){
    const dayNumber = calculatedMonday + i;
    const date = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), dayNumber);
    const weekday = date.getDay();

    switch (weekday){
      case 6: continue;
      case 0: continue;
      // case new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), weekday+i).getMonth() != parseInt(monthDropdown.value): continue;
    }

    if (dayNumber + weekday > calculateDaysInSelectedMonth(parseInt(monthDropdown.value))){
      console.error('End of month reached!',calculateDaysInSelectedMonth(parseInt(monthDropdown.value)))
      break;
    }

    addDayHTML(dayNumber, weekday);
  }
  // 
  console.log(weekCount)
  weekCount++;
}

let dayCount;
function addDay(){
  // console.log("dayCount:"+dayCount)
  let daysInSelectedMonth = calculateDaysInSelectedMonth(parseInt(monthDropdown.value));
  if (dayCount > daysInSelectedMonth) {
    alert(`Das Maximum von ${daysInSelectedMonth} Tagen im ${monthList[parseInt(monthDropdown.value)]} ${parseInt(yearDropdown.value)} erreicht!`)
    return;
  };
    let date = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), dayCount)

  const weekdayIndex = date.getDay(); //0 = So, 6 = Sa
  const weekday = weekdays[weekdayIndex];

  while (weekday == 'Sa' || weekday == 'So'){
    dayCount++
    console.log("Samstag oder Sonntag erreicht - Counter wird inkrementiert.")
    // console.log("dayCount:"+dayCount)
    if (dayCount > daysInSelectedMonth){
      alert('Maximum erreicht!');
      return;
    }
  }

  addDayHTML(dayCount, weekdayIndex);
  if (weekday == 'Fr') dayCount+=3;
  else if (weekday == 'Sa') dayCount+=2;
  else dayCount++;
  // console.log("dayCount:"+dayCount)
  return;
}
 
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

//Funktion fügt Tage zum Formular auf der index.html hinzu.
function addDayHTML(date, weekday){
  const container = document.getElementById('days');
  const div = document.createElement('div');
  div.className = 'workdays'
  div.innerHTML = `
      <label class="day-label">Tag ${String(date).padStart(2, '0')}. - ${weekdays[weekday]}</label>
      <input type="text" class="start" name="day${date}_start" placeholder="HH:MM" value="${startTimes[Math.floor(Math.random()*startTimes.length)]}">
      <input type="text" class="end" name="day${date}_end" placeholder="HH:MM" value="${endTimes[Math.floor(Math.random()*endTimes.length)]}">
      <button type="button" tabindex="-1" class="delete-day-btn">❌</button>
  `
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
  const year = date.getYear();
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
//Problem: Wenn Woche über Monatsene hinausragt, werden alle weiteren Wochen mit reduzierten Tagen erstellt.
//außerdem 1. Woche bisweilen fehlerhaft wenn unvollständig

//Tag Counter wird nach Löschen nicht zurückgesetzt.
//Dynamisch ermitteln welche Tage fehlen und chronologisch auffüllen
//Tag und Woche reagieren nicht aufeinander. Bestehende Wochen werden ignoriert und Tag erstellt vom 1. des Monats. Woche ebenfalls.
//"Arbeitswoche vom ... zum ..." wird beim Tag nicht generiert.#
//Format der Felder vereinheitlichen - divs setzen. Ggf. Template?

//datepicker Kalender Range auswählbar machen und entsprechende Tage hinzufügen
// ggf. relevant für Statistikanwendungen
//go: Monatangabe

//Wochenüberschrift entfernen, wenn alle Tage entfernt wurden
//Wochenweise löschen ermöglichen?


//console.log(element.classList)
//console.log(element.id)
//console.log(element.attributes)
//console.log(element.tagName)