class Circle {
  constructor(x, y, chosenScaleObj, index, sizes) {
    this.x = x;
    this.y = y;
    this.index = index; // スケール内でのインデックス
    
    // 現在のスケール情報でプロパティを設定
    this.updateScale(chosenScaleObj, sizes);
    
    this.speedX = random(-(sizes / 200), sizes / 200);
    this.speedY = random(-(sizes / 200), sizes / 200);
    
    this.oscillator = new p5.Oscillator('sine');
    this.oscillator.amp(0);
    this.oscillator.start();
    
    this.env = new p5.Envelope();
    this.env.setADSR(0.01, 1, 0.0, 0.05);
    this.env.setRange(0.5, 0);
    
    // 顔の設定
    this.eyeType = "circle";
    this.mouthType = "smile";
    this.oldEyeType = this.eyeType;
    this.oldMouthType = this.mouthType;
    this.newEyeType = this.eyeType;
    this.newMouthType = this.mouthType;
    this.faceTransition = 1;
    
    this.angle = 0;
    this.angularVelocity = 0;
    
    // トランジション用プロパティ（scaleTransition: 0～1, undefined なら非トランジション状態）
    this.scaleTransition = undefined;
    this.switched = false; // 半分過ぎたタイミングで非色プロパティを更新済みか
  }
  
  /**
   * 現在のスケール情報でプロパティ（midi ノート、サイズ、色）を更新
   */
  updateScale(newScaleObj, sizes) {
      this.chosenScaleObj = newScaleObj;
      this.scale = newScaleObj.scale;
      let note = this.scale[this.index];
      this.midiNote = note;

      let minNote = this.scale[0];
      let maxNote = this.scale[this.scale.length - 1];
      this.radius = map(note, minNote, maxNote, sizes / 8, sizes / 40);

      let hueValbase = hueMapping[newScaleObj.key];
      let brightVal = (newScaleObj.mode === 'major') ? 90 : 70;

      // どの sharp 値でも satVal の範囲は同じなので、一律に設定
      let satVal = map(note, minNote, maxNote, 0, 65);

      // sharp の値に応じて hueVal の変化幅を調整
      let hueOffset;
      switch (newScaleObj.sharp) {
          case 0: hueOffset = 50; break;
          case 1: hueOffset = 50; break;
          case 2: hueOffset = 50; break;
          case 3: hueOffset = 50; break;
          default: hueOffset = 50; // デフォルト値（念のため）
      }

      let hueVal = map(note, minNote, maxNote, hueValbase - hueOffset, hueValbase + hueOffset);

      // 色の設定
      colorMode(HSB, 360, 100, 100);
      let c = color(hueVal, satVal, brightVal);
      this.color = { r: red(c), g: green(c), b: blue(c) };
      colorMode(RGB, 255);
  }

  
  /**
   * 新しいスケールへのトランジションを開始
   */
  startScaleTransition(newScaleObj, sizes) {
    // 計算済みターゲット値を保存
    this.transitionTarget = {};
    let newNote = newScaleObj.scale[this.index];
    this.transitionTarget.midiNote = newNote;
    let minNote = newScaleObj.scale[0];
    let maxNote = newScaleObj.scale[newScaleObj.scale.length - 1];
    this.transitionTarget.radius = map(newNote, minNote, maxNote, sizes / 8, sizes / 40);
    
    let hueValbase = hueMapping[newScaleObj.key];
    let brightVal = (newScaleObj.mode === 'major') ? 90 : 70;
    let satVal = map(newNote, minNote, maxNote, 0, 65);
    let hueVal = map(newNote, minNote, maxNote, hueValbase - 50, hueValbase + 50);
    colorMode(HSB, 360, 100, 100);
    let newColor = color(hueVal, satVal, brightVal);
    colorMode(RGB, 255);
    this.transitionTarget.color = { r: red(newColor), g: green(newColor), b: blue(newColor) };
    
    // 古い値を保存
    this.oldTransition = {
      radius: this.radius,
      midiNote: this.midiNote,
      color: { r: this.color.r, g: this.color.g, b: this.color.b }
    };
    // トランジション開始
    this.scaleTransition = 0;
    this.switched = false;
  }
  
  // 毎フレーム呼ばれる：トランジション更新を含む
  update(circles) {
    // トランジション中なら進行（deltaTime は p5.js のグローバル変数）
    if (this.scaleTransition !== undefined) {
      this.scaleTransition += deltaTime / transitionTime;
      // transitionTime の半分を過ぎたら、非色プロパティを新しい値に切り替え
      if (this.scaleTransition >= 0.5 && !this.switched) {
        this.radius = this.transitionTarget.radius;
        this.midiNote = this.transitionTarget.midiNote;
        this.switched = true;
      }
      let t = constrain(this.scaleTransition, 0, 1);
      // 色は古い色から新しい色へリニア補間
      this.color.r = lerp(this.oldTransition.color.r, this.transitionTarget.color.r, t);
      this.color.g = lerp(this.oldTransition.color.g, this.transitionTarget.color.g, t);
      this.color.b = lerp(this.oldTransition.color.b, this.transitionTarget.color.b, t);
      if (this.scaleTransition >= 1) {
        this.scaleTransition = undefined;
        this.switched = false;
      }
    }
    
    this.move();
    for (let other of circles) {
      if (this !== other) {
        this.checkCollision(other);
      }
    }
    this.display();
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
    this.angularVelocity *= 0.99;
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
    
    const eyeOffsetX = this.radius * 0.3;
    const eyeOffsetY = this.radius * 0.2;
    const eyeSize = this.radius * 0.2;
    const mouthY = this.radius * 0.3;
    const mouthWidth = this.radius * 0.6;
    const mouthHeight = this.radius * 0.3;
    
    if (this.faceTransition < 1) {
      this.faceTransition += 0.05;
      if (this.faceTransition > 1) this.faceTransition = 1;
    }
    const t = this.faceTransition;
    if (t < 1) {
      push();
      tint(255, (1 - t) * 255);
      drawFace(this.oldEyeType, this.oldMouthType,
               eyeOffsetX, eyeOffsetY, eyeSize,
               mouthY, mouthWidth, mouthHeight);
      pop();
      push();
      tint(255, t * 255);
      drawFace(this.newEyeType, this.newMouthType,
               eyeOffsetX, eyeOffsetY, eyeSize,
               mouthY, mouthWidth, mouthHeight);
      pop();
    } else {
      drawFace(this.newEyeType, this.newMouthType,
               eyeOffsetX, eyeOffsetY, eyeSize,
               mouthY, mouthWidth, mouthHeight);
    }
    pop();
  }
}

