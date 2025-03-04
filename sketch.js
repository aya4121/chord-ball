// ====================
// グローバル変数
// ====================
let circles = [];
let running = false;   // シミュレーション実行中かどうか
let startStopButton;

// 各スケール（Major/Minor）にキー、モード、音階配列をセット
let availableScales = [
  // Major Scales
  { key: 'C', mode: 'major', scale: [43, 48, 52, 55, 60, 64, 67, 72] },
  { key: 'D', mode: 'major', scale: [45, 50, 54, 57, 62, 66, 69, 74] },
  { key: 'E', mode: 'major', scale: [47, 52, 56, 59, 64, 68, 71, 76] },
  { key: 'F', mode: 'major', scale: [43, 48, 53, 57, 60, 65, 69, 72] },
  { key: 'G', mode: 'major', scale: [45, 50, 55, 59, 62, 67, 71, 74] },
  { key: 'A', mode: 'major', scale: [44, 49, 52, 57, 61, 64, 69, 73] },
  { key: 'B', mode: 'major', scale: [46, 51, 54, 59, 63, 66, 71, 75] },
  // Minor Scales
  { key: 'C', mode: 'minor', scale: [43, 48, 51, 55, 60, 63, 67, 72] },
  { key: 'D', mode: 'minor', scale: [45, 50, 53, 57, 62, 65, 69, 74] },
  { key: 'E', mode: 'minor', scale: [47, 52, 55, 59, 64, 67, 71, 76] },
  { key: 'F', mode: 'minor', scale: [44, 48, 53, 56, 60, 65, 68, 72] },
  { key: 'G', mode: 'minor', scale: [46, 50, 55, 58, 62, 67, 70, 74] },
  { key: 'A', mode: 'minor', scale: [45, 48, 52, 57, 60, 64, 69, 72] },
  { key: 'B', mode: 'minor', scale: [47, 50, 54, 59, 62, 66, 71, 74] }
];

// 各キーに対応する基本色相
let hueMapping = {
  'C': 90,
  'D': 50,
  'E': 150,
  'F': 350,
  'G': 190,
  'A': 320,
  'B': 0
};

// 選ばれたスケール（オブジェクト形式：{ key, mode, scale }）
let chosenScaleObj;

// ====================
// setup 関数
// ====================
function setup() {
  createCanvas(windowWidth, windowHeight);
  let sizes = Math.sqrt(windowWidth * windowHeight);

// スケール係数としてウィンドウ面積の平方根を取得

  // ボタンのサイズを調整（適切な係数を設定）
  let buttonWidth = sizes / 5;
  let buttonHeight = sizes / 10;

  // スタート/ストップボタンの作成と設定
  startStopButton = createButton('Start');
  startStopButton.position(
    (windowWidth - buttonWidth) / 2,
    (windowHeight - buttonHeight) / 2
  );

  // ボタンのスタイル調整（スケールに応じて変更）
  startStopButton.style('width', buttonWidth + 'px');    
  startStopButton.style('height', buttonHeight + 'px');  
  startStopButton.style('font-size', (buttonWidth /6) + 'px'); // 文字サイズを自動調整
  startStopButton.style('padding', (buttonHeight / 10) + 'px ' + (buttonWidth / 20) + 'px'); // 余白
  startStopButton.style('border-radius', (buttonHeight / 5) + 'px'); // 角を丸く

  startStopButton.mousePressed(toggleRunning);
}



// ====================
// draw 関数
// ====================
function draw() {
  clear();
  
  // シミュレーション実行中の場合は各Circleを更新
  if (running) {
    for (let circle of circles) {
      circle.update(circles);
    }
  } 
}

// ====================
// シミュレーションの開始／停止を切り替える関数
// ====================
function toggleRunning() {
  running = !running;
  
  if (running) {
    // シミュレーション開始時、新たなスケールでCircleを生成
    initCircles();
    startStopButton.html('Stop');
  } else {
    // 停止時、Circleをクリア
    circles = [];
    startStopButton.html('Start');
  }
}

// ====================
// 新たなスケールでCircleを初期化する関数
// ====================
function initCircles() {
  sizes = Math.sqrt(windowWidth * windowHeight);
  circles = [];
  
  // 利用可能なスケールからランダムに1つ選択
  chosenScaleObj = random(availableScales);
  let chosenScale = chosenScaleObj.scale;
  let keyLetter = chosenScaleObj.key;
  
  // キーに対応する基本色相を取得
  let hueValbase = hueMapping[keyLetter];
  
  // モードに応じた明度の設定（major: 90, minor: 70）
  let brightVal = chosenScaleObj.mode === 'major' ? 90 : 70;
  
  // スケール内の最低音と最高音を取得
  let minNote = chosenScale[0];
  let maxNote = chosenScale[chosenScale.length - 1];

  // HSBモードに設定
  colorMode(HSB, 360, 100, 100);

  // 選ばれたスケール内の各MIDIノートからCircleを生成
  for (let i = 0; i < chosenScale.length; i++) {
    let note = chosenScale[i];
    
    // ノートに応じたサイズと彩度のマッピング
    let radius = map(note, minNote, maxNote,sizes/10, sizes/40);
    let satVal = map(note, minNote, maxNote, 0, 65);
    // 基本色相を中心に、ノートに応じて色相を変化させる
    let hueVal = map(note, minNote, maxNote, hueValbase - 50, hueValbase + 50);
    
    // HSB から RGB へ変換
    let c = color(hueVal, satVal, brightVal);
    
    // Circle オブジェクトを生成して配列に追加
    circles.push(new Circle(
      random(50, width - 50),
      random(50, height - 50),
      radius,
      random(-5, 5),
      random(-5, 5),
      red(c),
      green(c),
      blue(c),
      note
    ));
  }
  
  // 必要に応じてRGBモードに戻す
  colorMode(RGB, 255);
}

// ====================
// windowResized() を追加して、ウィンドウサイズ変更に対応（オプション）
// ====================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}





















