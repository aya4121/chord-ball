let accX = 0, accY = 0, accZ = 0;
function deviceMoved() {
  accX = accelerationX;
  accY = accelerationY;
  accZ = accelerationZ;
}

// 円の初期化。config.availableScales からランダムにスケールを選び、各 Circle を生成します。
function initCircles(sizes) {
  chosenScaleObj = random(config.availableScales);
  circles = []; // 配列を初期化

  for (let i = 0; i < chosenScaleObj.scale.length; i++) {
    circles.push(new Circle(chosenScaleObj, i, sizes));
  }
}

// 一定間隔で新しいスケールに切り替え、各円に遷移を開始させます。
function updateCirclesScale() {
  let newScaleObj;
  do {
    newScaleObj = random(config.availableScales);
  } while (newScaleObj === chosenScaleObj);

  chosenScaleObj = newScaleObj;

  for (let circle of circles) {
    circle.startScaleTransition(newScaleObj);
  }
}

class Circle {
  constructor(chosenScaleObj, index, sizes) {
    this.chosenScaleObj = chosenScaleObj;
    this.scale = chosenScaleObj.scale;
    this.index = index;
    // 円の大きさは config.circleRadiusMaxDivisor, circleRadiusMinDivisor で決定
    this.radius = map(this.index, 0, this.scale.length - 1, sizes / config.circleRadiusMaxDivisor, sizes / config.circleRadiusMinDivisor);
    this.x = random(this.radius, width - this.radius);
    this.y = random(this.radius, height - this.radius);
    this.updateScale();

    // 速度
    this.speedX = 0;
    this.speedY = 0;

    // p5.Oscillator の設定
    this.oscillator = new p5.Oscillator(config.oscillatorType);
    this.oscillator.amp(0);
    this.oscillator.start();

    this.env = new p5.Envelope();
    this.env.setADSR(
      config.envelopeADSR.attack,
      config.envelopeADSR.decay,
      config.envelopeADSR.sustain,
      config.envelopeADSR.release
    );
    this.env.setRange(config.envelopeRange.max, config.envelopeRange.min);

    // 顔の設定
    this.eyeType = "circle";
    this.mouthType = "smile";
    this.newEyeType = this.eyeType;
    this.newMouthType = this.mouthType;
    this.faceTransition = 1;

    this.angle = 0;
    this.angularVelocity = 0;
    this.switched = false;

    this.transitionActive = false;
    this.scaleTransition = 1;
    
    // -------------------------------
    // Sleep 機能のための状態変数の初期化
    this.sleeping = false;      // スリープ状態かどうか
    // ウィンドウ方式のための変数
    // rotation の前回値（sleep解除判定用）
    this.lastRotationX = rotationX;
    this.lastRotationY = rotationY;
    this.windowStartTime = undefined; // 一定期間の開始時刻
    this.windowStartX = undefined;    // 一定期間の開始位置 X
    this.windowStartY = undefined;    // 一定期間の開始位置 Y
    // 閾値の設定（ピクセル単位およびミリ秒単位）
    this.movementThreshold = config.movementThreshold * sizes; // このウィンドウ内での総移動量がこの値未満なら「静止」とみなす
    this.sleepTimeThreshold = 100; // 100ミリ秒以上の期間で評価
    // -------------------------------
    
    // （元の実装用に前回の位置も残す場合）
    this.prevX = this.x;
    this.prevY = this.y;
  }
  
   updateScale() {
    this.midiNote = this.scale[this.index];
    this.color = this.calculateColor(this.chosenScaleObj, this.index)}

  // config.hueMapping を利用して色を計算
  calculateColor(scaleObj, noteIndex) {
    let hueBase = config.hueMapping[scaleObj.key];
    let brightVal = (scaleObj.mode === 'major') ? 90 : 70;
    let hueOffset = 50;
    let satVal = map(noteIndex, 0, scaleObj.scale.length - 1, 0, 65);
    let hueVal = map(noteIndex, 0, scaleObj.scale.length - 1, hueBase - hueOffset, hueBase + hueOffset);
    return convertHSBtoRGB(hueVal, satVal, brightVal);
  }
  
  
update(circles, sizes) {
  const currentTime = millis();
  // ウィンドウの初期化：まだ開始時刻がセットされていなければ、今の時刻と位置をセット
  if (this.windowStartTime === undefined) {
    this.windowStartTime = currentTime;
    this.windowStartX = this.x;
    this.windowStartY = this.y;
  }
  
  const elapsed = currentTime - this.windowStartTime;
  const totalMovement = sqrt((this.x - this.windowStartX) ** 2 + (this.y - this.windowStartY) ** 2);
  
  if (elapsed >= this.sleepTimeThreshold) {
    if (totalMovement < this.movementThreshold) {
      if (!this.sleeping) {
        // 初めてスリープに入るとき、rotationX/Yを保存
        this.sleepRotationX = rotationX;
        this.sleepRotationY = rotationY;
      }
      this.sleeping = true;
      // 安定して静止しているなら、速度をリセットして振動を抑制
      this.speedX = 0;
      this.speedY = 0;
      this.angularVelocity = 0;
    } else {
      // 移動があった場合はウィンドウリセット
      this.windowStartTime = currentTime;
      this.windowStartX = this.x;
      this.windowStartY = this.y;
      this.sleeping = false;
    }
  } else {
    if (totalMovement >= this.movementThreshold) {
      this.windowStartTime = currentTime;
      this.windowStartX = this.x;
      this.windowStartY = this.y;
      this.sleeping = false;
    }
  }
  
  // スリープ状態の間、rotationX/Y の変化で wake up する
  if (this.sleeping) {
    const rotationDiffX = abs(rotationX - this.sleepRotationX);
    const rotationDiffY = abs(rotationY - this.sleepRotationY);
    if (rotationDiffX >= config.rotationWakeThreshold || rotationDiffY >= config.rotationWakeThreshold) {
      // 外部からの大きな入力があれば、sleep解除
      this.sleeping = false;
      // ウィンドウの初期化もリセット
      this.windowStartTime = currentTime;
      this.windowStartX = this.x;
      this.windowStartY = this.y;
    }
  }
  
  // sleep 状態なら、物理更新（move, checkCollision）はスキップ
  if (!this.sleeping) {
    // 外部入力による速度更新
    this.speedX += (rotationY * (config.rotationFactor*sizes));
    this.speedY += (rotationX * (config.rotationFactor*sizes));
    
    const maxSpeed = config.maxSpeed*sizes;
    this.speedX = constrain(this.speedX, -maxSpeed, maxSpeed);
    this.speedY = constrain(this.speedY, -maxSpeed, maxSpeed);

    // 円のサイズ再計算
    this.radius = map(this.index, 0, this.scale.length - 1, sizes / config.circleRadiusMaxDivisor, sizes / config.circleRadiusMinDivisor);


    // 移動処理
    this.move();

    // 衝突処理
    for (let other of circles) {
      if (this !== other) {
        this.checkCollision(other);
      }
    }
    
  }
    if (this.transitionActive) {
      this.updateScaleTransition();
    }
    // スケール変更の判定
    if (millis() - lastChangeTime > config.scaleChangeInterval) {
      lastChangeTime = millis();
      updateCirclesScale();
    }
  
  // 前回の位置更新（必要なら）
  this.prevX = this.x;
  this.prevY = this.y;
}

  

  // スケール遷移を開始（現在の状態と新規状態を保存して補間する）
  startScaleTransition(newScaleObj) {
    this.transitionActive = true;
    this.scaleTransition = 0;

    this.oldTransitionTarget = {
      midiNote: this.midiNote,
      color: this.calculateColor(this.chosenScaleObj, this.index)
    };

    this.chosenScaleObj = newScaleObj;
    this.scale = newScaleObj.scale;

    this.transitionTarget = {
      midiNote: this.scale[this.index],
      color: this.calculateColor(newScaleObj, this.index)
    };
  }

  updateScaleTransition() {
    this.scaleTransition += deltaTime / config.transitionTime;
    let t = constrain(this.scaleTransition, 0, 1);

    this.color.r = lerp(this.oldTransitionTarget.color.r, this.transitionTarget.color.r, t);
    this.color.g = lerp(this.oldTransitionTarget.color.g, this.transitionTarget.color.g, t);
    this.color.b = lerp(this.oldTransitionTarget.color.b, this.transitionTarget.color.b, t);

    if (t >= 1) {
      this.transitionActive = false;
      this.midiNote = this.transitionTarget.midiNote;
    }
  }

  move() {
    if (touches.length > 0) return;
    this.x += this.speedX;
    this.y += this.speedY;
    this.angle += this.angularVelocity;

    let collidedWithWall = checkWallsAndBounce(this, width, height);
    if (collidedWithWall) {
      this.playSound();
      this.randomizeFace();
      this.speedX*=config.gravity;
      this.speedY*=config.gravity;
    }
    this.angularVelocity *= config.angularFriction;
  }


  checkCollision(other) {
  const distCenters = dist(this.x, this.y, other.x, other.y);
  if (distCenters < this.radius + other.radius) {

    // 衝突後の速度計算 (元の速度はまだ更新しない)
    elasticCollision2D(this, other);

    // 速度を一旦保存する
    const newSpeedThis = { x: this.speedX, y: this.speedY };
    const newSpeedOther = { x: other.speedX, y: other.speedY };
    const newAngularThis = this.angularVelocity;
    const newAngularOther = other.angularVelocity;

    // 重なり解消 (位置の微調整のみ)
    preventOverlap(this, other);

    // 衝突直後の音などの処理
    // this.playSound();
    this.randomizeFace();
    // other.playSound();
    other.randomizeFace();

    // 保存した速度を再設定して、次フレームから動かす
    this.speedX = newSpeedThis.x;
    this.speedY = newSpeedThis.y;
    other.speedX = newSpeedOther.x;
    other.speedY = newSpeedOther.y;

    this.angularVelocity = newAngularThis;
    other.angularVelocity = newAngularOther;
  }
}

  
  

  randomizeFace() {
    this.oldEyeType = this.newEyeType;
    this.oldMouthType = this.newMouthType;
    let face = getRandomFace();
    this.newEyeType = face.eye;
    this.newMouthType = face.mouth;
    this.faceTransition = 0;
  }

  playSound() {
    const freq = midiToFreq(this.midiNote);
    this.oscillator.freq(freq);
    this.env.play(this.oscillator, 0, 0.1);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    fill(this.color.r, this.color.g, this.color.b);
    noStroke();
    ellipse(0, 0, this.radius * 2);

    // 顔描画の設定
    const eyeOffsetX = this.radius * 0.3;
    const eyeOffsetY = this.radius * 0.2;
    const eyeSize = this.radius * 0.2;
    const mouthY = this.radius * 0.3;
    const mouthWidth = this.radius * 0.6;
    const mouthHeight = this.radius * 0.3;

    if (this.faceTransition < 1) {
      this.faceTransition += config.faceTransitionIncrement;
      if (this.faceTransition > 1) this.faceTransition = 1;
    }
    const t = this.faceTransition;
    if (t < 1) {
      push();
      tint(255, (1 - t) * 255);
      drawFace(this.oldEyeType, this.oldMouthType, eyeOffsetX, eyeOffsetY, eyeSize, mouthY, mouthWidth, mouthHeight);
      pop();
      push();
      tint(255, t * 255);
      drawFace(this.newEyeType, this.newMouthType, eyeOffsetX, eyeOffsetY, eyeSize, mouthY, mouthWidth, mouthHeight);
      pop();
    } else {
      drawFace(this.newEyeType, this.newMouthType, eyeOffsetX, eyeOffsetY, eyeSize, mouthY, mouthWidth, mouthHeight);
    }
    pop();
  }
}









 












