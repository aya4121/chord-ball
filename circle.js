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

    // 速度も config.circleSpeedDivisor を利用
    this.speedX = random(-sizes / config.circleSpeedDivisor, sizes / config.circleSpeedDivisor);
    this.speedY = random(-sizes / config.circleSpeedDivisor, sizes / config.circleSpeedDivisor);

    // config からオシレーターの種類を指定
    this.oscillator = new p5.Oscillator(config.oscillatorType);
    this.oscillator.amp(0);
    this.oscillator.start();

    this.env = new p5.Envelope();
    // config からエンベロープの ADSR とレンジを設定
    this.env.setADSR(
      config.envelopeADSR.attack,
      config.envelopeADSR.decay,
      config.envelopeADSR.sustain,
      config.envelopeADSR.release
    );
    this.env.setRange(config.envelopeRange.max, config.envelopeRange.min);

    // 顔の設定（変更対象となる部分は後で遷移）
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
  }

  // config.hueMapping を利用して色を計算
  calculateColor(scaleObj, noteIndex) {
    let hueBase = config.hueMapping[scaleObj.key];
    let brightVal = (scaleObj.mode === 'major') ? 90 : 70;
    let hueOffset = 50;
    let satVal = map(noteIndex, 0, scaleObj.scale.length - 1, 0, 65);
    let hueVal = map(noteIndex, 0, scaleObj.scale.length - 1, hueBase - hueOffset, hueBase + hueOffset);
    return convertHSBtoRGB(hueVal, satVal, brightVal);
  }

  updateScale() {
    this.midiNote = this.scale[this.index];
    this.color = this.calculateColor(this.chosenScaleObj, this.index);
  }

  update(circles, sizes) {
    // 円のサイズは常に最新の sizes と config の値で再計算
    this.radius = map(this.index, 0, this.scale.length - 1, sizes / config.circleRadiusMaxDivisor, sizes / config.circleRadiusMinDivisor);

    if (this.transitionActive) {
      this.updateScaleTransition();
    }

    this.move();

    for (let other of circles) {
      if (this !== other) {
        this.checkCollision(other);
      }
    }

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
    }
    this.angularVelocity *= config.angularFriction;
  }

  checkCollision(other) {
    const distCenters = dist(this.x, this.y, other.x, other.y);
    if (distCenters < this.radius + other.radius) {
      elasticCollision2D(this, other);
      this.playSound();
      this.randomizeFace();
      other.playSound();
      other.randomizeFace();
      preventOverlap(this, other);
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







 












