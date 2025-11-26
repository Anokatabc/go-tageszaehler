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
  console.log('Dropdowns zugewiesen, lade Funktionen.')
  yearSelect();
  monthSelect(); //befülle Dropdown mit Monaten, aktueller Monat Vorauswahl
  daySelect();

  document.getElementById('addDay').addEventListener('click', addDay);
  document.getElementById('addWeek').addEventListener('click', addWeek);
  document.getElementById('days').addEventListener('click', function(event) {
    if (event.target.classList.contains('delete-day-btn')){
      const row = event.target.closest('.workdays');
      // const dayLabel = row.querySelector('.day-label').textContent;
      row.remove();
      console.log('Zeile'+dayLabel+'gelöscht.')
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
 
function clearPage(){
  document.querySelectorAll('.workdays').forEach(el => el.remove());
  weekCount = 0; //für 'Woche hinzufügen' Button

  //besser?
  // const workdays = document.getElementsByClassName('workdays');
  // Array.from(workdays).forEach(element => element.remove());

  dayCount = 1;
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

function calculateMonday(year, month, date) {
  
  const dateCheck = new Date(parseInt(year), parseInt(month), parseInt(date));
  if (isNaN(dateCheck.getTime())) {
    console.error("calculateMonday: Ungültiges Datum!");
    return null;
  }
  console.log("dateCheck="+dateCheck);

  const dayOfWeek = dateCheck.getDay(); //0-6
  console.log("Übergebener Wochentag"+weekdays[dayOfWeek]+" ; "+date);

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
  const monday = new Date(year, month, (parseInt(date)+daysToMonday));

  console.log("calculateMonday="+parseInt(monday.getDate())+" is monday? -> "+weekdays[monday.getDay()]+". Monat: "+monthList[monday.getMonth()]+";"+monday.getMonth());
  return monday.getDate();
}

let weekCount = 0;
function addWeek(){
  let targetDate;
  if (weekCount == 0){
    targetDate = new Date (parseInt(yearDropdown.value), parseInt(monthDropdown.value), parseInt(dayDropdown.value));
  }
  else if (weekCount > 0 && weekCount < 5){
    targetDate = new Date (parseInt(yearDropdown.value), parseInt(monthDropdown.value), parseInt(dayDropdown.value)+weekCount*7);
  } else {
    console.error("Maximale Wochenanzahl erreicht!")
    return;
  }
  console.log("daydropdown.value"+dayDropdown.value+"wird in calculateMonday gegeben")

  const calculatedMonday = calculateMonday(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  console.log("result calculateMonday: "+calculateMonday(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()))
  /* 
  Montag kalkuliert
  Tage Montag bis Freitag befüllen

  */
  for (let i = 0; i<5; i++){
    const dayNumber = calculatedMonday + i;
    const date = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), dayNumber);
    const weekdayIndex = date.getDay();
    switch (weekdayIndex){
      case 6: continue;
      case 0: continue;
    }
    if (date.getDate() >= calculateDaysInSelectedMonth(parseInt(monthDropdown.value))){
      console.error('End of month reached!')
      break;
    }

    addDayHTML(dayNumber, weekdayIndex);
  }
  // 
  console.log(weekCount)
  weekCount++;
}

let dayCount;
function addDay(){
  console.log("dayCount:"+dayCount)
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
    console.log("dayCount:"+dayCount)
    if (dayCount > daysInSelectedMonth){
      alert('Maximum erreicht!');
      return;
    }
  }

  addDayHTML(dayCount, weekdayIndex);

  if (weekday == 'Fr') dayCount+=3;
  else if (weekday == 'Sa') dayCount+=2;
  else dayCount++;
  console.log("dayCount:"+dayCount)
  return;
}
 
function addDayHTML(date, day){
  const container = document.getElementById('days');
  const div = document.createElement('div');
  div.className = 'workdays'
  div.innerHTML = `
      <label class="day-label">Tag ${String(date).padStart(2, '0')}. - ${weekdays[day]}</label>
      <input type="text" class="start" name="day${date}_start" placeholder="HH:MM">
      <input type="text" class="end" name="day${date}_end" placeholder="HH:MM">
      <button type="button" class="delete-day-btn">❌</button>
  `
  container.appendChild(div);
}

function calculateDaysInSelectedMonth(month){
  return new Date(parseInt(yearDropdown.value), month+1, 0).getDate()
}

//todos
//mit string replace für texteingabe arbeiten