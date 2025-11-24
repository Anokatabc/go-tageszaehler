const monthList = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
const weekdays = ['So','Mo','Di','Mi','Do','Fr','Sa']
/* window.onload = function() {
  monthSelect();
} */

let today = new Date();

const monthDropdown = document.getElementById('month-select');
function monthSelect(){
  if (!monthDropdown) {
    console.error('Dropdown ungültig!')
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

const yearDropdown = document.getElementById('year-select');
function yearSelect(){
  if (!yearDropdown) {
    console.error('Dropdown ungültig!')
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

const dayDropdown = document.getElementById('day-select')
function daySelect(){
  if (dayDropdown == null) {
    console.error('Dropdown ungültig!')
    return
  }

  dayDropdown.innerHTML = ''

  const daysInThisMonth = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
  for (let i = 1; i <= daysInThisMonth; i++){
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
  if (weekdays[preselectedDay] == "Sa") preselectedDate+2;
  dayDropdown.value = preselectedDate;

  console.log('Days Months Dropdown erfolgreich befüllt!')
}

let weekCounter = 0;
function addWeek(){
  let date = today.getDate();
  let weekday = today.getDay();
  let dayList;
  //for (let i = 0; )
}

let dayCount = 1;
function addDay(){
  if (dayCount >= 31) {
    alert('Das Maximum von 31 Tagen erreicht!')
    return;
  };
  //dayCount++;
  const selectedMonth = parseInt(monthDropdown.value);
  const year = today.getFullYear();
  const date = new Date(year, selectedMonth, dayCount)

  const weekdayIndex = date.getDay(); //0 = So, 6 = Sa
  const weekday = weekdays[weekdayIndex];

  if (weekday == 'Sa' || weekday == 'So'){

  }

  const container = document.getElementById('days');

  const div = document.createElement('div');
  div.className = 'workdays'
  div.innerHTML = `
    <label>Tag ${dayCount}. - ${weekday}</label>
    <input type="text" class="start" placeholder="HH:MM">
    <input type="text" class="end" placeholder="HH:MM">
  `
  container.appendChild(div);

  if (weekday == 'Fr') dayCount = dayCount+3;
  else if (weekday == 'Sa') dayCount = dayCount+2;
  else dayCount++;
  return;
}

/* function totalDaysInMonth(month) {
  if (NaN.month) {
    month = month.parseInt
  }
  var now = new Date(2025, month, 1);
  //console.log("full year = "+now.getFullYear)
  console.log( new Date(now.getFullYear(), now.getMonth()+1, 0).getDate());
  } */

document.addEventListener('DOMContentLoaded', function(){
  console.log('Dom fertig geladen, lade Funktionen')
  yearSelect();
  monthSelect(); //befülle Dropdown mit Monaten, aktueller Monat Vorauswahl
  daySelect();

  document.getElementById('addDay').addEventListener('click', addDay);
  document.getElementById('addWeek').addEventListener('click', addWeek);
  document.getElementById('month-select').addEventListener('change', function(){
    daySelect();
  })
})

//todos:
// preventDefault auf submit und validieren, ggf. vereinheitlichen (0en) append leading 0s