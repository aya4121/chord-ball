class Circle {
  constructor(x, y, radius, speedX, speedY, r, g, b, midiNote = 60) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speedX = speedX;
    this.speedY = speedY;
    this.color = { r, g, b };
    this.midiNote = midiNote;

    this.angle = 0;
    this.angularVelocity = 0;

    // p5.Oscillator + Envelope
    this.oscillator = new p5.Oscillator('sine');
    this.oscillator.amp(0);
    this.oscillator.start();

    this.env = new p5.Envelope();
    this.env.setADSR(0.01,1, 0.0, 0.05);
    this.env.setRange(0.5, 0);

    // 顔: 新旧パーツ & フェード状態
    this.eyeType = "circle";
    this.mouthType = "smile";
    this.oldEyeType = this.eyeType;
    this.oldMouthType = this.mouthType;
    this.newEyeType = this.eyeType;
    this.newMouthType = this.mouthType;
    this.faceTransition = 1; 
  }

  move() {
    // ユーザが画面に触れている場合は移動を停止する
    if (touches.length > 0) {
      return;
    }
    
    // 位置と角度の更新
    this.x += this.speedX;
    this.y += this.speedY;
    this.angle += this.angularVelocity;
  
    // 壁チェック
    let collidedWithWall = checkWallsAndBounce(this, width, height);
    if (collidedWithWall) {
      this.playSound(); // 壁衝突時の音再生
      this.randomizeFace();
    }
    
    // ============================
    // ここからボタンとの衝突チェック
    // ============================
    // ボタンの画面上の位置情報を取得
    let buttonRect = startStopButton.elt.getBoundingClientRect();
    // canvas の位置情報を取得（canvasはsetup()でグローバルに定義しておく）
    let canvasRect = canvas.elt.getBoundingClientRect();
    // 円の中心の画面上の座標に変換
    let circleScreenX = canvasRect.left + this.x;
    let circleScreenY = canvasRect.top + this.y;
    
    // 円とボタンの矩形が重なっているかシンプルな衝突判定
    if (circleScreenX + this.radius > buttonRect.left &&
        circleScreenX - this.radius < buttonRect.right &&
        circleScreenY + this.radius > buttonRect.top &&
        circleScreenY - this.radius < buttonRect.bottom) {
      this.playSound();
      this.randomizeFace();
    }
    
    // 回転の減衰
    this.angularVelocity *= 0.99;
  }
  


  checkCollision(other) {
    // 2つの円が重なっているかどうか
    const distCenters = dist(this.x, this.y, other.x, other.y);
    if (distCenters < this.radius + other.radius) {
      // 弾性衝突計算
      elasticCollision2D(this, other);
      // 衝突したので音と顔を変える
      this.playSound();
      this.randomizeFace();
      other.playSound();
      other.randomizeFace();

      // めり込み防止
      preventOverlap(this, other);
    }
  }

  /**
   * 顔をランダムに決定し、フェードを開始
   */
  randomizeFace() {
    // 古い顔を保存
    this.oldEyeType = this.newEyeType;
    this.oldMouthType = this.newMouthType;

    // 新しい顔を取得(外部関数でランダム生成)
    let face = getRandomFace();
    this.newEyeType = face.eye;
    this.newMouthType = face.mouth;

    // フェード開始
    this.faceTransition = 0;
  }

  /**
   * このCircle固有のMIDIノートを再生
   */
  playSound() {
    const freq = midiToFreq(this.midiNote);
    this.oscillator.freq(freq);
    this.env.play(this.oscillator, 0, 0.1);
  }

  /**
   * 毎フレーム処理
   */
  update(circles) {
    // 移動＆壁反射
    this.move();
    // 他のCircleとの衝突判定
    for (let other of circles) {
      if (this !== other) {
        this.checkCollision(other);
      }
    }
    // 描画
    this.display();
  }

  /**
   * 描画 (顔のフェード込み)
   */
  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    // 身体
    fill(this.color.r, this.color.g, this.color.b);
    noStroke();
    ellipse(0, 0, this.radius * 2);

    // 顔パーツの位置サイズ
    const eyeOffsetX = this.radius * 0.3;
    const eyeOffsetY = this.radius * 0.2;
    const eyeSize = this.radius * 0.2;
    const mouthY = this.radius * 0.3;
    const mouthWidth = this.radius * 0.6;
    const mouthHeight = this.radius * 0.3;

    // フェードを進行させる(0→1)
    if (this.faceTransition < 1) {
      this.faceTransition += 0.05;
      if (this.faceTransition > 1) this.faceTransition = 1;
    }

    const t = this.faceTransition;
    if (t < 1) {
      // 古い顔 (1-t のアルファ) + 新しい顔 (t のアルファ) を重ね描き
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
      // フェード完了後は新しい顔だけ
      drawFace(this.newEyeType, this.newMouthType,
               eyeOffsetX, eyeOffsetY, eyeSize,
               mouthY, mouthWidth, mouthHeight);
    }

    pop();
  }
}

