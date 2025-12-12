const textareaBtn = document.getElementById('textarea-btn');
document.getElementById('textarea-info').addEventListener('click', () => {
  alert("Hier kann ein beliebig langer String eingefügt werden. Alle Uhrzeiten-Werte im Format HH:MM werden beim Einfügen der Reihe nach in bestehende Formularfelder eingefügt. \n(Dazu müssen natürlich bereits Tage/Wochen hinzugefügt worden sein).\n\nSofern das automatische Einfügen aus irgendeinem Grund nicht funktioniert hat, kann es über den Button erneut eingefügt werden. Das automatische Einfügen reagiert auf die Einfüge-Aktion, nicht einfache Eingaben.")
});

  document.getElementById('textarea-show').addEventListener('click', () => {
    setTimeout(textAreaShow, 50);
  });

  document.getElementById('textarea-btn').addEventListener('click', pasteTimes);
  pasteTextarea.addEventListener('paste', () => {
    pasteTimes();

    setTimeout(pasteTimes, 100)
  });
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