// ====================
// グローバル変数
// ====================
let circles = [];
let running = false;   // シミュレーション実行中かどうか
let startStopButton;

// スケールを切り替える時間管理用
let lastChangeTime = 0;          // 最後にスケールを変えた時刻
let scaleChangeInterval = 7000;  // 切り替え間隔(ミリ秒) ここでは6秒

// 変化のトランジション時間（ミリ秒）
let transitionTime = 1000;

let availableScales = [
  // Major Scales
  { key: 'C',  mode: 'major', scale: [43,48,52,55,60,64,67,72], sharp: 0 },
  { key: 'C#', mode: 'major', scale: [44,49,53,56,61,65,68,73], sharp: 2 },
  { key: 'D',  mode: 'major', scale: [45,50,54,57,62,66,69,74], sharp: 1 },
  { key: 'D#', mode: 'major', scale: [43,46,51,55,58,63,67,70], sharp: 2 },
  { key: 'E',  mode: 'major', scale: [44,47,52,56,59,64,68,71], sharp: 1 },
  { key: 'F',  mode: 'major', scale: [45,48,53,57,60,65,69,72], sharp: 0 },
  { key: 'F#', mode: 'major', scale: [46,49,54,58,61,66,70,73], sharp: 3 },
  { key: 'G',  mode: 'major', scale: [43,47,50,55,59,62,67,71], sharp: 0 },
  { key: 'G#', mode: 'major', scale: [44,48,51,56,60,63,68,72], sharp: 2 },
  { key: 'A',  mode: 'major', scale: [45,49,52,57,61,64,69,73], sharp: 1 },
  { key: 'A#', mode: 'major', scale: [46,50,53,58,62,65,70,74], sharp: 1 },
  { key: 'B',  mode: 'major', scale: [47,51,54,59,63,66,71,75], sharp: 2 },

  // Minor Scales
  { key: 'Cm',  mode: 'minor', scale: [43,48,51,55,60,63,67,72], sharp: 1 },
  { key: 'C#m', mode: 'minor', scale: [44,49,52,56,61,64,68,73], sharp: 2 },
  { key: 'Dm',  mode: 'minor', scale: [45,50,53,57,62,65,69,74], sharp: 0 },
  { key: 'D#m', mode: 'minor', scale: [46,51,54,58,63,66,70,75], sharp: 3 },
  { key: 'Em',  mode: 'minor', scale: [43,47,52,55,59,64,67,71], sharp: 0 },
  { key: 'Fm',  mode: 'minor', scale: [44,48,53,56,60,65,68,72], sharp: 1 },
  { key: 'F#m', mode: 'minor', scale: [45,49,54,57,61,66,69,73], sharp: 2 },
  { key: 'Gm',  mode: 'minor', scale: [46,50,55,58,62,67,70,74], sharp: 1 },
  { key: 'G#m', mode: 'minor', scale: [44,47,51,56,59,63,68,71], sharp: 2 },
  { key: 'Am',  mode: 'minor', scale: [45,48,52,57,60,64,69,72], sharp: 0 },
  { key: 'A#m', mode: 'minor', scale: [46,49,53,58,61,65,70,73], sharp: 2 },
  { key: 'Bm',  mode: 'minor', scale: [47,50,54,59,62,66,71,74], sharp: 1 }
];


// 各キーに対応する基本色相
let hueMapping = {
  'C': 120,
  'C#': 60,
  'D': 30,
  'D#': 150,
  'E': 90,
  'F': 0,
  'F#': 330,
  'G': 210,
  'G#': 240,
  'A': 300,
  'A#': 270,
  'B': 120,
  
  'Cm': 120,
  'C#m': 60,
  'Dm': 30,
  'D#m': 150,
  'Em': 90,
  'Fm': 0,
  'F#m': 330,
  'Gm': 210,
  'G#m': 240,
  'Am': 300,
  'A#m': 270,
  'Bm': 120
    
};

// 選ばれたスケール（オブジェクト形式：{ key, mode, scale }）
let chosenScaleObj;

// ====================
// setup 関数
// ====================
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  let sizes = Math.sqrt(windowWidth * windowHeight);
  let buttonWidth = sizes / 5;
  let buttonHeight = sizes / 10;
  
  startStopButton = createButton('Start');
  startStopButton.position(
    (windowWidth - buttonWidth) / 2,
    (windowHeight - buttonHeight) / 2
  );
  startStopButton.style('width', buttonWidth + 'px');
  startStopButton.style('height', buttonHeight + 'px');
  startStopButton.style('font-size', (buttonWidth / 6) + 'px');
  startStopButton.style('padding', (buttonHeight / 10) + 'px ' + (buttonWidth / 20) + 'px');
  startStopButton.style('border-radius', (buttonHeight / 5) + 'px');
  
  startStopButton.mousePressed(toggleRunning);
}

// ====================
// draw 関数
// ====================
function draw() {
  clear();

  if (running) {
    // 各 Circle の更新（内部でトランジション更新も行う）
    for (let circle of circles) {
      circle.update(circles);
    }
    
    // scaleChangeInterval 経過後、各 Circle のスケールのトランジションを開始
    if (millis() - lastChangeTime > scaleChangeInterval) {
      lastChangeTime = millis();
      updateCirclesScale();
    }
  }
}

// ====================
// シミュレーションの開始／停止を切り替える関数
// ====================
function toggleRunning() {
  running = !running;
  
  if (running) {
    initCircles();
    lastChangeTime = millis();
    startStopButton.html('Stop');
  } else {
    circles = [];
    startStopButton.html('Start');
  }
}

// ====================
// 初回の Circle を生成する関数
// ====================
function initCircles() {
  let sizes = Math.sqrt(windowWidth * windowHeight);
  let oldPositions = circles.map(circle => ({ x: circle.x, y: circle.y }));
  circles = [];
  
  let newScaleObj;
  do {
    newScaleObj = random(availableScales);
  } while (newScaleObj === chosenScaleObj);
  
  chosenScaleObj = newScaleObj;
  
  for (let i = 0; i < chosenScaleObj.scale.length; i++) {
    let posX = (oldPositions[i] !== undefined) ? oldPositions[i].x : random(20, width - 20);
    let posY = (oldPositions[i] !== undefined) ? oldPositions[i].y : random(20, height - 20);
    circles.push(new Circle(posX, posY, chosenScaleObj, i, sizes));
  }
  
  colorMode(RGB, 255);
}

// ====================
// 既存の Circle のスケール情報のトランジションを開始する関数
// ====================
function updateCirclesScale() {
  let sizes = Math.sqrt(windowWidth * windowHeight);
  let newScaleObj;
  do {
    newScaleObj = random(availableScales);
  } while (newScaleObj === chosenScaleObj);
  
  chosenScaleObj = newScaleObj;
  
  // 各 Circle に対してトランジション開始
  for (let circle of circles) {
    circle.startScaleTransition(newScaleObj, sizes);
  }
  
  colorMode(RGB, 255);
}

// ====================
// ウィンドウサイズ変更に対応
// ====================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}





















