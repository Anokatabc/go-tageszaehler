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
  document.getElementById('day-select').addEventListener('change', function(){
    dayCount = parseInt(dayDropdown.value);
  });
  document.getElementById('month-select').addEventListener('change', function(){
 
  document.querySelectorAll('.workdays').forEach(el => el.remove());

  //besser?
  // const workdays = document.getElementsByClassName('workdays');
  // Array.from(workdays).forEach(element => element.remove());

  dayCount = 1;
  daySelect();
  })
});

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
  let daysInSelectedMonth = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value)+1, 0).getDate();

  for (let i = 1; i <= daysInSelectedMonth; i++){
    //if (weekdays[(i%7)] == 'Sa' || weekdays[(i%7)] == 'So') continue;

    const date = new Date(today.getFullYear(), parseInt(monthDropdown.value), i);
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
  
  let dateCheck = new Date(parseInt(year), parseInt(month), parseInt(date));
  if (isNaN(dateCheck.getTime())) {
    console.error("calculateMonday: Ungültiges Datum!");
    return null;
  }
  console.log("dateCheck="+dateCheck)

  let dayOfWeek = dateCheck.getDay();
  console.log("dayOfWeek"+dayOfWeek)
  let daysToMonday = 0;

  switch (dayOfWeek){
  case 0:
    daysToMonday = 1;
    console.log("case 0")
    break;
  case 1:
    daysToMonday = 0;
    console.log("case 1")
    break;
  case 2:
    if (date-1 < 1) return date;
    daysToMonday = -1;
    console.log("case 2")
    break;
  case 3:
    if (date-2 < 1) return date;
    daysToMonday = -2;
    console.log("case 3")
    break;
  case 4:
    if (date-3 < 1) return date;
    daysToMonday = -3;
    console.log("case 4")
    break;
  case 5:
    if (date-4 < 1) return date;
    daysToMonday = -4;
    console.log("case 5")
    break;
  case 6:
    if (date-5 < 1) return date;
    daysToMonday = -5;
    console.log("case 6")
    break;
  }
  const monday = new Date(year, month, (parseInt(date)+daysToMonday));

  console.log("calculateMonday="+parseInt(monday.getDate()));
  return monday.getDate();
}

let weekCount = 0;
function addWeek(){
  let date = new Date (parseInt(yearDropdown.value), parseInt(monthDropdown.value), parseInt(dayDropdown.value));
  console.log("daydropdown.value"+dayDropdown.value+"wird in calculateMonday gegeben")
  dayDropdown.value = calculateMonday(date.getFullYear(), date.getMonth(), date.getDate());


}

let dayCount;
function addDay(){
  console.log("dayCount:"+dayCount)
  let daysInSelectedMonth = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value)+1, 0).getDate()
  if (dayCount > daysInSelectedMonth) {
    alert(`Das Maximum von ${daysInSelectedMonth} Tagen im ${monthList[parseInt(monthDropdown.value)]} ${parseInt(yearDropdown.value)} erreicht!`)
    return;
  };
    let date = new Date(parseInt(yearDropdown.value), parseInt(monthDropdown.value), dayCount)

    

  const weekdayIndex = date.getDay(); //0 = So, 6 = Sa
  const weekday = weekdays[weekdayIndex];

  if (weekday == 'Sa' || weekday == 'So'){
    dayCount++
    console.log("Samstag oder Sonntag erreicht - Funktion wird neu aufgerufen.")
    console.log("dayCount:"+dayCount)
    return;
  }

  addDayHTML(dayCount, weekday);

  if (weekday == 'Fr') dayCount+=3;
  else if (weekday == 'Sa') dayCount+=2;
  else dayCount++;
  console.log("dayCount:"+dayCount)
  return;
}
 
function addDayHTML(){
  const container = document.getElementById('days');
  const div = document.createElement('div');
  div.className = 'workdays'
  div.innerHTML = `
      <label class="day-label">Tag ${String(dayCount).padStart(2, '0')}. - ${weekday}</label>
      <input type="text" class="start" placeholder="HH:MM">
      <input type="text" class="end" placeholder="HH:MM">
  `
  container.appendChild(div);
}

//todos:
// preventDefault auf submit und validieren, ggf. vereinheitlichen (0en) append leading 0s