// 加速度センサーの入力を受け取り、音量エンベロープの最大値に反映する（p5.js のライフサイクル関数）
function deviceMoved() {
  const magnitude = Math.sqrt(
    accelerationX * accelerationX +
    accelerationY * accelerationY +
    accelerationZ * accelerationZ
  );
  // 0〜3 の加速度を 0〜1 に正規化し、さらに 0.1〜0.5 の範囲に収める
  config.envelopeRange.max = constrain(map(magnitude, 0, 3, 0, 1), 0.1, 0.5);
}

// 円の初期化。config.availableScales からランダムにスケールを選び、各 Circle を生成します。
function initCircles(sizes) {
  chosenScaleObj = random(config.availableScales);
  circles = [];

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
    this.radius = this.calculateRadius(sizes);
    this.x = random(this.radius, width - this.radius);
    this.y = random(this.radius, height - this.radius);
    this.updateScale();

    this.speedX = 0;
    this.speedY = 0;
    this.angle = 0;
    this.angularVelocity = 0;

    // p5.Oscillator / p5.Envelope の設定（衝突時の発音に使用）
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

    // 顔の表情。新旧の表情をクロスフェードさせるための状態も持つ
    this.eyeType = "circle";
    this.mouthType = "smile";
    this.newEyeType = this.eyeType;
    this.newMouthType = this.mouthType;
    this.faceTransition = 1;

    // スケール切り替え時の色・音のクロスフェード用
    this.transitionActive = false;
    this.scaleTransition = 1;

    // Sleep 機能: 一定時間ほとんど動いていなければ静止状態とみなし、物理更新を止める。
    // windowStart* は「静止判定を行う時間ウィンドウ」の開始時刻・開始位置。
    this.sleeping = false;
    this.windowStartTime = undefined;
    this.windowStartX = undefined;
    this.windowStartY = undefined;
    this.movementThreshold = config.movementThreshold * sizes; // ウィンドウ内の総移動量がこれ未満なら静止とみなす
    this.sleepTimeThreshold = 100; // 静止判定を行うウィンドウの長さ（ミリ秒）
  }

  updateScale() {
    this.midiNote = this.scale[this.index];
    this.color = this.calculateColor(this.chosenScaleObj, this.index);
  }

  // config.hueMapping を利用して色を計算
  calculateColor(scaleObj, noteIndex) {
    const hueBase = config.hueMapping[scaleObj.key];
    const brightVal = (scaleObj.mode === 'major') ? 90 : 70;
    const hueOffset = 50;
    const satVal = map(noteIndex, 0, scaleObj.scale.length - 1, 0, 65);
    const hueVal = map(noteIndex, 0, scaleObj.scale.length - 1, hueBase - hueOffset, hueBase + hueOffset);
    return convertHSBtoRGB(hueVal, satVal, brightVal);
  }

  calculateRadius(sizes) {
    return map(this.index, 0, this.scale.length - 1, sizes / config.circleRadiusMaxDivisor, sizes / config.circleRadiusMinDivisor);
  }

  update(circles, sizes) {
    const currentTime = millis();
    this.updateMovementWindow(currentTime);
    this.checkWakeUpFromRotation(currentTime);

    if (!this.sleeping) {
      this.applyRotationInput(sizes);
      this.radius = this.calculateRadius(sizes);
      this.move();
      this.resolveCollisions(circles);
    }

    if (this.transitionActive) {
      this.updateScaleTransition();
    }

    this.advanceScaleIfDue();
  }

  // 静止判定用のウィンドウを進める。ウィンドウ内で十分に動いていればウィンドウをリセットして起きたままにし、
  // 動いていなければ sleep 状態に入る。
  updateMovementWindow(currentTime) {
    if (this.windowStartTime === undefined) {
      this.resetMovementWindow(currentTime);
    }

    const elapsed = currentTime - this.windowStartTime;
    const totalMovement = dist(this.x, this.y, this.windowStartX, this.windowStartY);
    const hasMoved = totalMovement >= this.movementThreshold;

    if (elapsed >= this.sleepTimeThreshold && !hasMoved) {
      this.enterSleep();
    } else if (hasMoved) {
      this.resetMovementWindow(currentTime);
      this.sleeping = false;
    }
  }

  resetMovementWindow(currentTime) {
    this.windowStartTime = currentTime;
    this.windowStartX = this.x;
    this.windowStartY = this.y;
  }

  enterSleep() {
    if (!this.sleeping) {
      // sleep に入った瞬間の回転を基準として保存し、そこからの変化で wake up を判定する
      this.sleepRotationX = rotationX;
      this.sleepRotationY = rotationY;
    }
    this.sleeping = true;
    this.speedX = 0;
    this.speedY = 0;
    this.angularVelocity = 0;
  }

  // sleep 中に端末が大きく回転されたら wake up する
  checkWakeUpFromRotation(currentTime) {
    if (!this.sleeping) return;

    const rotationDiffX = abs(rotationX - this.sleepRotationX);
    const rotationDiffY = abs(rotationY - this.sleepRotationY);
    const rotatedEnough = rotationDiffX >= config.rotationWakeThreshold || rotationDiffY >= config.rotationWakeThreshold;

    if (rotatedEnough) {
      this.sleeping = false;
      this.resetMovementWindow(currentTime);
    }
  }

  // 端末の傾き（rotationX/Y）を加速度として速度に加算する
  applyRotationInput(sizes) {
    this.speedX += rotationY * (config.rotationFactor * sizes);
    this.speedY += rotationX * (config.rotationFactor * sizes);

    const maxSpeed = config.maxSpeed * sizes;
    this.speedX = constrain(this.speedX, -maxSpeed, maxSpeed);
    this.speedY = constrain(this.speedY, -maxSpeed, maxSpeed);
  }

  resolveCollisions(circles) {
    for (const other of circles) {
      if (this !== other) {
        this.checkCollision(other);
      }
    }
  }

  advanceScaleIfDue() {
    if (millis() - lastChangeTime > config.scaleChangeInterval) {
      lastChangeTime = millis();
      updateCirclesScale();
    }
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
    const t = constrain(this.scaleTransition, 0, 1);

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

    const collidedWithWall = checkWallsAndBounce(this, width, height);
    if (collidedWithWall) {
      this.playSound();
      this.randomizeFace();
      this.speedX *= config.gravity;
      this.speedY *= config.gravity;
    }
    this.angularVelocity *= config.angularFriction;
  }

  checkCollision(other) {
    const distCenters = dist(this.x, this.y, other.x, other.y);
    if (distCenters >= this.radius + other.radius) return;

    // 衝突後の速度を計算してから重なりを解消する。preventOverlap は位置のみを
    // 補正するものなので、その前後で速度が変わらないよう一旦退避しておく。
    elasticCollision2D(this, other);
    const speedThis = { x: this.speedX, y: this.speedY, angular: this.angularVelocity };
    const speedOther = { x: other.speedX, y: other.speedY, angular: other.angularVelocity };

    preventOverlap(this, other);

    this.randomizeFace();
    other.randomizeFace();

    this.speedX = speedThis.x;
    this.speedY = speedThis.y;
    this.angularVelocity = speedThis.angular;

    other.speedX = speedOther.x;
    other.speedY = speedOther.y;
    other.angularVelocity = speedOther.angular;
  }

  randomizeFace() {
    this.oldEyeType = this.newEyeType;
    this.oldMouthType = this.newMouthType;
    const face = getRandomFace();
    this.newEyeType = face.eye;
    this.newMouthType = face.mouth;
    this.faceTransition = 0;
  }

  playSound() {
    const freq = midiToFreq(this.midiNote);
    this.oscillator.freq(freq);
    this.env.setRange(config.envelopeRange.max, config.envelopeRange.min);
    this.env.play(this.oscillator, 0, 0.1);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    fill(this.color.r, this.color.g, this.color.b);
    noStroke();
    ellipse(0, 0, this.radius * 2);

    const eyeOffsetX = this.radius * 0.3;
    const eyeOffsetY = this.radius * 0.2;
    const eyeSize = this.radius * 0.2;
    const mouthY = this.radius * 0.3;
    const mouthWidth = this.radius * 0.6;
    const mouthHeight = this.radius * 0.3;

    if (this.faceTransition < 1) {
      this.faceTransition = Math.min(this.faceTransition + config.faceTransitionIncrement, 1);
    }

    if (this.faceTransition < 1) {
      const t = this.faceTransition;
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
