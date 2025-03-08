function getRandomFace() {
  const eyeTypes = ["circle", "square", "wink", "line"];
  const mouthTypes = ["smile", "sad", "straight", "open"];

  return {
    eye: random(eyeTypes),
    mouth: random(mouthTypes)
  };
}

function drawFace(eyeType, mouthType, eyeOffsetX, eyeOffsetY, eyeSize, mouthY, mouthWidth, mouthHeight) {
  fill(0);
  stroke(0);
  strokeWeight(2);

  // 目
  switch (eyeType) {
    case "circle":
      ellipse(-eyeOffsetX, -eyeOffsetY, eyeSize, eyeSize);
      ellipse( eyeOffsetX, -eyeOffsetY, eyeSize, eyeSize);
      break;
    case "square":
      rect(-eyeOffsetX - eyeSize/2, -eyeOffsetY - eyeSize/2, eyeSize, eyeSize);
      rect( eyeOffsetX - eyeSize/2, -eyeOffsetY - eyeSize/2, eyeSize, eyeSize);
      break;
    case "wink":
      // 左目: 下向き半円, 右目: 丸
      arc(-eyeOffsetX, -eyeOffsetY, eyeSize, eyeSize, 0, PI, CHORD);
      ellipse(eyeOffsetX, -eyeOffsetY, eyeSize, eyeSize);
      break;
    case "line":
      line(-eyeOffsetX - eyeSize/2, -eyeOffsetY, -eyeOffsetX + eyeSize/2, -eyeOffsetY);
      line( eyeOffsetX - eyeSize/2, -eyeOffsetY,  eyeOffsetX + eyeSize/2, -eyeOffsetY);
      break;
  }

  // 口
  noFill();
  stroke(0);
  strokeWeight(2);
  switch (mouthType) {
    case "smile":
      arc(0, mouthY, mouthWidth, mouthHeight, 0, PI);
      break;
    case "sad":
      arc(0, mouthY, mouthWidth, mouthHeight, PI, TWO_PI);
      break;
    case "straight":
      line(-mouthWidth/2, mouthY, mouthWidth/2, mouthY);
      break;
    case "open":
      ellipse(0, mouthY, mouthWidth/2, mouthHeight);
      break;
  }
}