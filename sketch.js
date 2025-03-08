let circles = [];
let running = false;
let lastChangeTime = 0;
let chosenScaleObj;
let startStopButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  let sizes = Math.sqrt(windowWidth * windowHeight);
  Startstopbutton(sizes);
}

function draw() {
  let sizes = Math.sqrt(windowWidth * windowHeight);
  clear();

  if (running) {
    for (let circle of circles) {
      circle.update(circles, sizes);
      circle.display();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let sizes = Math.sqrt(windowWidth * windowHeight);
  setButtonStyle(startStopButton, sizes);
}









