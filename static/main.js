let dayCount = 0;
           
const monthList = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]

/* window.onload = function() {
  monthSelect();
} */

function monthSelect(){
  const dropdown = document.getElementById('month-select');
  if (!dropdown) {
    console.error('Dropdown existiert noch nicht')
    return
  }

  for (let i = 0; i < monthList.length; i++){
    const option = document.createElement('option');
    option.value = i;
    option.textContent = monthList[i];
    dropdown.appendChild(option)
  }

  const currentMonth = new Date().getMonth();
  dropdown.value = currentMonth;
}

function addDay() {
  if (dayCount >= 31) return;
  dayCount++;
  const container = document.getElementById('days');
  const div = document.createElement('div');
  div.innerText = `
    <label>Tag ${dayCount}. - (${weekday})</label>
    <input type="text" class="start" placeholder="HH:MM">
    <input type="text" class="end" placeholder="HH:MM">
  `
  container.appendChild(div);
}