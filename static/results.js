const table = document.getElementsByTagName('table')[0];
const main = document.querySelector('.content');
const body = document.getElementsByTagName('body')[0];
const reduceBtn = document.getElementById('reduce');
const enhanceBtn = document.getElementById('enhance');

reduceBtn.addEventListener('click', () => {
  console.log("reduce table")
  main.style.width = "40%";
  // body.style.textAlign = "center";
  // body.style.justifyContent = "center";
});

enhanceBtn.addEventListener('click', () => {
  console.log("enhance table")
  main.style.width = "80%";
  // body.style.textAlign = "start";
  // body.style.justifyContent = "start";
});

