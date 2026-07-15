let circles = [];
let running = false;
let lastChangeTime = 0;
let chosenScaleObj;
let startStopButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  const sizes = Math.sqrt(windowWidth * windowHeight);
  createStartStopButton(sizes);
}

function draw() {
  const sizes = Math.sqrt(windowWidth * windowHeight);
  clear();

  if (running) {
    for (const circle of circles) {
      circle.update(circles, sizes);
      circle.display();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  const sizes = Math.sqrt(windowWidth * windowHeight);
  setButtonStyle(startStopButton, sizes);
}





