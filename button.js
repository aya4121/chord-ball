function Startstopbutton(sizes){
  startStopButton = createButton('Start');
  setButtonStyle(startStopButton, sizes);
  startStopButton.mousePressed(() => toggleRunning(sizes));
}

function toggleRunning(sizes) {
  running = !running;
  
  if (running) {
    initCircles(sizes);
    lastChangeTime = millis();
    startStopButton.html('Stop');
  } else {
    circles = [];
    startStopButton.html('Start');
  }
}

function setButtonStyle(button, sizes) {
  let buttonWidth = sizes / 5;
  let buttonHeight = sizes / 10;

  button.position(
    (windowWidth - buttonWidth) / 2,
    (windowHeight - buttonHeight) / 2
  );
  button.style('width', buttonWidth + 'px');
  button.style('height', buttonHeight + 'px');
  button.style('font-size', (buttonWidth / 6) + 'px');
  button.style('padding', (buttonHeight / 10) + 'px ' + (buttonWidth / 20) + 'px');
  button.style('border-radius', (buttonHeight / 5) + 'px');
  
}