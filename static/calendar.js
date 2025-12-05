const monthYearElement = document.getElementById('monthYear');
const datesElement = document.getElementById('dates');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

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

const updateCalendar = () => {


  const firstDay = new Date(currentYear, currentMonth, 0);
  const lastDay = new Date(currentYear, currentMonth+1, 0);
  const totalDays = lastDay.getDate();
  const firstDayIndex = firstDay.getDay();
  const lastDayIndex = lastDay.getDay();

  const monthYearString = currentDate.toLocaleString('default', {
    month: 'long', 
    year: 'numeric' //...
  });
  monthYearElement.textContent = monthYearString;

  let datesHTML = '';

  for(let i = firstDayIndex; i>0; i--){
    const prevDate = new Date (currentYear, currentMonth, 0 - i+1);
    datesHTML += `<div id="${new Date(currentYear, currentMonth, prevDate.getDate()).toDateString()}" class="date inactive">${prevDate.getDate()}</div>`;
  }

  for (let i = 1; i <= totalDays; i++){
    const date = new Date (currentYear, currentMonth, i);
    const activeClass = date.toDateString() === new Date().toDateString() ? 'active' : '';
    datesHTML += `<div id="${new Date(currentYear, currentMonth, date.getDate()).toDateString()}" class="date ${activeClass}">${i}</div>`;
  }

  for (let i = 1; i <= 7 - lastDayIndex; i++){
    const nextDate = new Date(currentYear, currentMonth+1, i);
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

/**Errechnet die Wochennr. im Jahr (KW) */
function ISOWeek(year, month, day){
  //const isLeapYear = new Date(year, 2, 0).getDate() === 29; //true/false
  //const daysInYear = (isLeapYear) ? 366 : 365;
  const thursdayDate = calculateThursday(year, month, day);
  const firstThursdayDate = calculateThursday(year, 0, 4); //4 damit nicht versehentlich im Jahr gesprungen wird (Do., Fr., Sa. oder So. des Vorjahres)

  //let weekDiff = ((firstThursdayDate-thursdayDate)/(1000*3600*24*7)-1)*(-1);
  const weekDiff = 1 + Math.round((thursdayDate - firstThursdayDate) / (7*24*3600*1000));
  //if (thursdayDate.getFullYear() < year && !day<thursdayDate.getDate()){weekDiff--; console.log("Donnerstag würde im nächsten Jahr liegen, erhöhe Wochenzähler auf 1.")}
  //if (thursdayDate.getFullYear() > year && !day>thursdayDate.getDate()){weekDiff--; console.log("Donnerstag würde im nächsten Jahr liegen, reduziere Wochenzähler auf 52 (oder 53?).")}
  console.log(weekDiff);
  return weekDiff;
}

/**Errechnet den relativen Donnerstag zugehörig zum mitgegebenen Daten.
 ** Rückgabe: Date-Objekt (Y/M/D) des Donnerstags
 */
function calculateThursday(year, month, day) {
  let date = new Date(Date.UTC(year, month, day));

  let jsWeekday = date.getUTCDay(); //0-6
  let isoWeekday = jsWeekday === 0 ? 7 : jsWeekday; //nach ISO ist Sonntag 7, nicht 0 wie JS
  
  //0=>7-3=4
  //1: 4-1=3
  //2: 4-2=2
  //3: 4-3=1
  //4: 4-4=0
  //5: 4-5=-1
  //6: 4-6=-2
  let dateDiff = 4 - isoWeekday; //z.B. 4-7=-3


  date.setUTCDate(date.getUTCDate() + dateDiff); //date+-3
  return date;
}

function handleDateClick(event){
  const target = event.target;
  console.log(`Listener registriert auf ${target.id}`);
  if (target.classList.contains('active') && !target.classList.contains('inactive')){
    console.log(`removed active on ${target.id}`)
    target.classList.remove('active');
    console.log(target.classList);
  } else if (!target.classList.contains('active') && !target.classList.contains('inactive')) {
    console.log(`added active on ${target.id}`)
    target.classList.add('active');
    console.log(target.classList);
  }
}

let mousedownTarget = null;
function handleDatedown(mousedown) {
  mousedown.preventDefault();
  mousedownTarget = mousedown.target.id;
  console.log(`stored mousedown target: ${mousedownTarget}`);
}

// let mouseupTarget = null;
function handleDateup(mouseup) {
  let mouseupTarget = mouseup.target.id;
  console.log(`stored mouseup target: ${mouseupTarget}`);
  handleDateRange(mousedownTarget, mouseupTarget);
}

function handleDateRange(mousedown, mouseup){
  if (mousedown == mouseup){
    console.log("Keine Range");
    return
  }
  startDate = new Date(mousedown);
  endDate = new Date(mouseup);

  if (endDate < startDate){
    startDate = new Date(mouseup);
    endDate = new Date(mousedown);
  }

  console.log(endDate.getDate()-startDate.getDate())


  for (let i = 0; i<=(endDate.getDate()-startDate.getDate()); i++){
    document.getElementById(`${new Date(
      startDate.getFullYear(), 
      startDate.getMonth(), 
      startDate.getDate()+i).toDateString()}`).classList.add('active');
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
  // console.dir(eachDate);



// function registerDateListeners() {
//   const eachDate = document.querySelectorAll('.date');
//   eachDate.forEach(el => {
//     console.log(`el.dataset.listener = ${el.dataset.listener}`)
//     if (el.dataset.listener !== 'true'){
//       console.log(`el.dataset.listener = ${el.dataset.listener}`)
//       el.addEventListener('click', () => {
//         console.log(`Listener registriert auf ${el}`)
//         console.log(`el.dataset.listener = ${el.dataset.listener}`)
//       });
//       el.dataset.listener = 'true';
//       console.log("setting el.dataset.listener to true")
//     } else {
//       console.log("listener already active, returning...")
//       return
//     }
//   });
// }

prevBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendar();
});

nextBtn.addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar();
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

});
//Logik überholen
/* document.getElementById('datepicker-add-btn').addEventListener('click', () => {
  // let selectedDays = []
  checkIterateDate = new Date(currentYear, currentMonth, 1);
  
  const container = document.getElementById('days');

  for (let i=0; i<new Date(currentYear, currentMonth+1, 0).getDate(); i++){
    console.log("iteration:",i)

    dateIdString = document.getElementById(`${new Date(currentYear, currentMonth, i+1).toDateString()}`);
    if (dateIdString == null){
      console.log("iterated date is null, continue - iteration: ",i)
      continue;
    }

    if (dateIdString.classList.contains('active') &&
    !dateIdString.classList.contains('inactive')){
      tempDate = new Date(currentYear, currentMonth, i+1);

      let isFirstWorkdayInWeek;
      if (i === 0){
        isFirstWorkdayInWeek = true;
      } else {
        isFirstWorkdayInWeek = calculateMonday(
          tempDate.getFullYear(), 
          tempDate.getMonth(),
          i+1
        ) !== calculateMonday(
          tempDate.getFullYear(), 
          tempDate.getMonth(),
          i
        )
      }

      let isLastWorkdayInWeek;
      if (i === new Date(tempDate.getFullYear(), tempDate.getMonth()+1, 0).getDate()){
        isLastWorkdayInWeek = true;
      } else {
        isLastWorkdayInWeek = calculateMonday(
          tempDate.getFullYear(), 
          tempDate.getMonth(),
          1+i
        ) !== calculateMonday(
          tempDate.getFullYear(), 
          tempDate.getMonth(),
          4+i
        )
      }


      if (tempDate == null){
        console.log("tempDate is null, continue - iteration: ",i,"corresponding date was not selected.")
        continue;
      }
      // selectedDays[i] = document.getElementById(tempDate.getDate())
      if (tempDate.getDay() !== 0 && tempDate.getDay() !== 6){
        let div 
        
        if (isFirstWorkdayInWeek){
          div = document.createElement('div'); //ggf. Klasse vergeben
          div.className = 'workdays';
          div.id = 'workdays';
          div.innerHTML += `
          <h2>Arbeitswoche vom ${calculateMonday(tempDate.getFullYear(), tempDate.getMonth(), i+1)}. bis ${tempDate.getFullYear(), tempDate.getMonth, i+5}.</h2>
          `
        }
        
        addDayHTML(tempDate.getDate(), tempDate.getDay())
        
        if (isLastWorkdayInWeek){
          document.getElementById('workdays').innerHTML += `</div>`
        }
        document.getElementById('workdays').appendChild(div);

      } else {
        console.error("Hinzuzufügender Tag ist ein Samstag oder Sonntag!")
      }




    }
  }
}); */

// https://www.youtube.com/watch?v=OcncrLyddAs


//erweitert: live auf drag reagieren und Tage hinzufügen