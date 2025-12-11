document.addEventListener('DOMContentLoaded', callTimeAndDay);

function callTimeAndDay(){
    updateClock();
    const now = new Date();
    let delay = 1000 - now.getMilliseconds()
    setTimeout(timeAndDay, delay);
}

function timeAndDay() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock(){

    const today = new Date();
    // today.setHours(13, 12, 5)
    const date = String(today.getDate()).padStart(2, '0');
    const month = monthList[today.getMonth()];

    const day = today.getDay();

    const dayList = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];

    const hour = String(today.getHours()).padStart(2, '0');
    let twelve_hour = String(today.getHours()).padStart(2, '0');
    const minute = String(today.getMinutes()).padStart(2, '0');
    const second = String(today.getSeconds()).padStart(2, '0');

    let designator = (twelve_hour >=12) ? "" : "(AM)";

    twelve_hour = (hour >=12) ? hour - 12 : hour;

    if (hour === 12){
        if (minute === 0){
            designator = " Mittag";
        }
    }
    if (hour === 0){
        if (minute === 0){
            designator = " Mitternacht";
        }
    }

    const field = document.getElementById('timeAndDay-field');

    // field.textContent = dayList[day]+" "+day+" . Uhrzeit: "+hour+":"+minute+":"+second+" "+designator;
    // let pmAddendum = {designator ===}
    field.textContent = `${dayList[day]}, ${date}. ${month}   ${hour}:${minute}:${second} ${designator}`;
}