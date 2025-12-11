const monthYearElement = document.getElementById('monthYear');
const datesElement = document.getElementById('dates');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

nextBtn.addEventListener('click', () => {
  syncDropdowns();
});
prevBtn.addEventListener('click', () => {
  syncDropdowns();
});

/**@type Date */
let currentDate = new Date();

datepicker = document.getElementById('datepicker');
calendar = document.getElementById('calendar');
calendarLabel = document.getElementById('calendar-label');
datepicker.addEventListener('click', () => {
  console.log("test");
  calendar.style.display = "flex"
});



document.addEventListener('click', (event) => {
  if (!calendar.contains(event.target) && event.target !== datepicker) {
    calendar.style.display = "none"; // Kalender ausblenden
    console.log("Kalender ausgeblendet");
  }
});

let currentYear = currentDate.getFullYear();
let currentMonth = currentDate.getMonth();


function syncDropdowns(){
  window.yearDropdown.value = monthYearElement.textContent.match(/\d+/)[0];
  const monthName = monthYearElement.textContent.replace(/\d+/, '').trim();
  window.monthDropdown.value = monthListStr[monthName];
  if (isNaN(monthListStr[monthName])){
    console.error("Fehler bei der Dropdown-Synchronisierung: Monat nicht in Liste gefunden.")
  }
}

function syncCalendar(resetToJanuary){
  if (window.monthDropdown && window.yearDropdown) {
    currentYear = parseInt(window.yearDropdown.value);
    currentMonth = (resetToJanuary) ? 0 : parseInt(window.monthDropdown.value);
    currentDate = new Date(currentYear, currentMonth, 1);
  }
}

const updateCalendar = () => {
  currentYear = currentDate.getFullYear();
  currentMonth = currentDate.getMonth();

  const firstDay = new Date(currentYear, currentMonth, 0);
  const lastDay = new Date(currentYear, currentMonth+1, 0);
  const totalDays = lastDay.getDate();
  const firstDayIndex = firstDay.getDay();
  const lastDayIndex = lastDay.getDay();

  const monthYearString = `${monthList[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  // currentDate.toLocaleString('default', {
  //   month: 'long', 
  //   year: 'numeric' //...
  // });
  monthYearElement.textContent = monthYearString;

  let datesHTML = '';

  //Vorherige Monatstage (befüllt ab letzten Tag verg. Monats bis zum ersten Kalendereintrag)
  for(let i = firstDayIndex; i>0; i--){
    const prevDate = new Date (currentYear, currentMonth, 0 - i+1);
    datesHTML += `<div id="${new Date(currentYear, currentMonth-1, prevDate.getDate()).toDateString()}" class="date inactive">${prevDate.getDate()}</div>`;
  }

  //Aktuelle Monatstage
  for (let i = 1; i <= totalDays; i++){
    const date = new Date (currentYear, currentMonth, i);
    const activeClass = date.toDateString() === new Date().toDateString() ? 'active' : '';
    datesHTML += `<div id="${new Date(currentYear, currentMonth, date.getDate()).toDateString()}" class="date ${activeClass}">${i}</div>`;
  }

  //Nächste Monatstage
  for (let i = 1; i <= 7 - lastDayIndex; i++){
    const nextDate = new Date(currentYear, currentMonth+1, i);
    // console.log("set inactive on ",nextDate);
    datesHTML += `<div id="${new Date(currentYear, currentMonth+1, nextDate.getDate()).toDateString()}" class="date inactive">${nextDate.getDate()}</div>`;
  }

  datesElement.innerHTML = datesHTML;
  
  // const elements = document.querySelectorAll('[class*="date"]');
  // const elements = document.querySelectorAll('[id*="date"]]');
  // elements.forEach(el => console.log(el));
registerDateListeners();

}
/**Validiert ob Jahr  zwischen 0 und 3000 liegt & eine Zahl ist*/
function isValidYear(year){
  return (year > 0 && year < 3000 && !isNaN(year))
}
/**Validiert ob Month zwischen 0 und 11 liegt & eine Zahl ist*/
function isValidMonth(month){
  return (month >= 0 && month <= 11 && !isNaN(month))
}
/**Validiert ob Day zwischen 0 und 366 liegt & eine Zahl ist*/
function isValidDay(day){
  return (day > 0 && day <= 366 && !isNaN(day))
}
/**Validiert ob Wochentag zwischen 0 und 6 liegt & eine Zahl ist*/
function isValidWeekday(day){
  return (day >= 0 && day <= 6 && !isNaN(day))
}

/**Errechnet die Wochennr. im Jahr (KW)
 ** Erwartet volles Datum als Parameter
 */
function ISOWeek(date){
  //const isLeapYear = new Date(year, 2, 0).getDate() === 29; //true/false
  //const daysInYear = (isLeapYear) ? 366 : 365;
  if (!isDateValid(date)){
    console.error("ISOWeek: Not a valid date: ",date,this);
    return null;
  }
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();  

  const thursdayDate = calculateThursday(date);
  console.log("thursdayDate: ",thursdayDate)
  const firstThursdayDate = calculateThursday(new Date(year, 0, 4)); //4 damit nicht versehentlich im Jahr gesprungen wird (Do., Fr., Sa. oder So. des Vorjahres)
  console.log("firstThursdayDate: ",firstThursdayDate)

  //let weekDiff = ((firstThursdayDate-thursdayDate)/(1000*3600*24*7)-1)*(-1);
  const weekNr = 1 + Math.round((thursdayDate - firstThursdayDate) / (7*24*3600*1000));

  console.log(`KW von ${date.toDateString()}: ${weekNr}`);
  return weekNr;
}

/**Errechnet den relativen Donnerstag zugehörig zum mitgegebenen Daten.
 ** Rückgabe: Date-Objekt (Y/M/D) des Donnerstags
 *@param {Date} date
 */
function calculateThursday(date) {
  // console.log("- - -- - - - - - - - -- -calculateThursday start ")
  if (!isDateValid(date)){
    console.error("calculateThursday: Not a valid date");
    return null;
  }
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();  
  let dateUtc = new Date(Date.UTC(year, month, day));
  // console.log("dateUtc: ",dateUtc)
  
  let jsWeekday = dateUtc.getUTCDay(); //0-6
  // console.log("dateUtc.getUTCDay(): ",dateUtc.getUTCDay())
  let isoWeekday = jsWeekday === 0 ? 7 : jsWeekday; //nach ISO ist Sonntag 7, nicht 0 wie JS
  
  //0=>7-3=4
  //1: 4-1=3
  //2: 4-2=2
  //3: 4-3=1
  //4: 4-4=0
  //5: 4-5=-1
  //6: 4-6=-2
  let dateDiff = 4 - isoWeekday; //z.B. 4-7=-3
  // console.log(`dateDiff ${dateDiff}=4  - isoWeekday ${isoWeekday}`)
  
  
  dateUtc.setUTCDate(dateUtc.getUTCDate() + dateDiff); //date+-3
  // console.log(`dateUtc.setUTCDate(${dateUtc.getUTCDate()} + dateDiff ${dateDiff});`);
  
  // console.log("- - -- - - - - - - - -- -calculateThursday end ")
  return dateUtc;
}

function handleDateClick(event){
  const target = event.target;
  if (!target.classList.contains('date')) {
    return;
  }
  console.log(`Listener registriert auf ${target.id}`);
    //   if(dateIncrement.getDay() !== 0 && dateIncrement.getDay() !== 6){ //So./Sa.-Validierung
    // }
  let clickedDate = new Date(target.id);
  if (isNaN(clickedDate.getTime())){
    console.error('Ungültiges Datum:',target.id,clickedDate);
    return;
  }
  const dayOfWeek = clickedDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6){
    console.log('Wochenende, überspringe ',clickedDate)
    return;
  }

  if (target.classList.contains('active') && !target.classList.contains('inactive')){
    console.log(`removed active on ${target.id}`)
    target.classList.remove('active');
    console.log(target.classList);
  } else if (!target.classList.contains('active') && !target.classList.contains('inactive')) {
    console.log(`added active on ${target.id}`)
    target.classList.add('active');
    console.log(target.classList);
    //selectedDateRange.push(clickedDate.getDate());
  }
}

let mousedownTarget = null;
function handleDatedown(mousedown) {
  mousedown.preventDefault();
  mousedownTarget = mousedown.target.id;
  // console.log(`stored mousedown target: ${mousedownTarget}`);
}

// let mouseupTarget = null;
function handleDateup(mouseup) {
  let mouseupTarget = mouseup.target.id;
  // console.log(`stored mouseup target: ${mouseupTarget}`);
  handleDateRange(mousedownTarget, mouseupTarget);
}

let selectedDateRange = [];

function handleDateRange(mousedown, mouseup){
  if (mousedown === mouseup){
    console.log("Keine Range");
    return
  }
  if (!mousedown || !mouseup){
    console.log("Ungültige Auswahl");
    return;
  }
  startDate = new Date(mousedown);
  endDate = new Date(mouseup);

  if (endDate.getMonth() !== startDate.getMonth()){
    console.error("Monate Mismatch!","endDate.getMonth()",endDate.getMonth(),"startDate.getMonth()",startDate.getMonth());
    return;
  }
  if (endDate < startDate){
    startDate = new Date(mouseup);
    endDate = new Date(mousedown);
  }

  console.log(endDate.getDate()-startDate.getDate())
  console.log("startDate.getDate()","-",startDate,"endDate.getDate()",endDate);

  //Gegeben: Ausgewähltes Anfangsdatum und Enddatum

  for (let i = 0; i<=(endDate.getDate()-startDate.getDate()); i++){
    let dateIncrement = new Date(
      startDate.getFullYear(), 
      startDate.getMonth(), 
      startDate.getDate()+i
    )
    if(dateIncrement.getDay() === 0 || dateIncrement.getDay() === 6){
      // console.log("skipping ",dateIncrement.getDate())
      continue;
    }
    document.getElementById(`${dateIncrement.toDateString()}`).classList.add('active');
    let dateHtml = document.getElementById(`${dateIncrement.toDateString()}`)
    console.log("dateHtml:",dateHtml);

}

}

function registerDateListeners() {
  const eachDate = document.querySelectorAll('.date');
  eachDate.forEach(el => {
    el.removeEventListener('click', handleDateClick);
    el.addEventListener('click', handleDateClick)
    el.addEventListener('mousedown', handleDatedown)
    el.addEventListener('mouseup', handleDateup)
  }
  // console.dir(eachDate);
)}

prevBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendar();
  syncDropdowns();
});

nextBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar();
  syncDropdowns();
});

document.getElementById('datepicker').addEventListener('click', () => {
  updateCalendar();
});

document.getElementById('datepicker-clear-btn').addEventListener('click', () => {
  checkIterateDate = new Date(currentYear, currentMonth, 1);
  for (let i=0; i<new Date(currentYear, currentMonth+1, 0).getDate(); i++){
    console.log("iteration:",i)
    document.getElementById(`${new Date(currentYear, currentMonth, 1+i).toDateString()}`).classList.remove('active');
  }

});

document.getElementById('datepicker-add-btn').addEventListener('click', () => {

  selectedDateRange.sort(function(a, b) {
    return a - b;
  });
  const daysContainer = document.getElementById('days');

    let selectedDates = Array.from(document.querySelectorAll('#dates .date.active:not(.inactive)'))
    .map(item => {
      const date = new Date(item.id);
      if (isNaN(date.getTime())) {
        console.warn(`Ungültige ID: ${item.id}`);
        return null;
      }
      return date.getDate();
    })
    .filter(date => date !== null)
    .sort((a, b) => a - b);

    console.log("selectedDates: ",selectedDates)

  let previousKw;
  for (let i=0; i<selectedDates.length; i++){ 
    const date = new Date(currentYear, currentMonth, selectedDates[i]);
    console.log("ISO of date",ISOWeek(date));
    previousKw = (i !== 0) ? ISOWeek(new Date(currentYear, currentMonth, selectedDates[i-1])) : 0;
    let currentKw = ISOWeek(date);
    if (currentKw !== previousKw){
      console.log(`Aktuelle KW ${currentKw} ungleich der letzten ${previousKw}`);
      const container = document.getElementById('days');
      const h2 = document.createElement('h2');
      h2.className = 'week';
      h2.id = `week_${currentKw}`;
      const mondayDate = calculateMonday(date).getDate();
      let fridayDate = mondayDate+4;
      const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();
      if (fridayDate > daysInMonth){
        fridayDate = daysInMonth;
      }
      h2.innerHTML = `Arbeitswoche vom ${mondayDate}. bis ${(fridayDate)}. ${monthList[currentMonth]}
<button type="button" class="delete-week-btn delete-btn" tabindex="-1">🗑️</button>`;;
      
      container.appendChild(h2);
    }
    console.log("- - - - - - - - - - call addDayHTML on",i)
    // addDayHTML(selectedDates[i]);
    addDayHTML(date.getDate());
  }
    calendar.style.display = "none"; // Kalender ausblenden
    console.log("Kalender ausgeblendet");
});

// https://www.youtube.com/watch?v=OcncrLyddAs


//erweitert: live auf drag reagieren und Tage hinzufügen