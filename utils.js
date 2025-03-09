/**
 * 壁に衝突しているかどうか判定し、必要なら速度を反転＆位置調整する
 * @param {Circle} circle - 壁衝突をチェックしたいCircle
 * @param {number} w - canvasの幅
 * @param {number} h - canvasの高さ
 * @returns {boolean} 壁に衝突したかどうか
 */
function checkWallsAndBounce(circle, w, h) {
  let hitWall = false;

  // 左右の壁
  if (circle.x - circle.radius < 0 || circle.x + circle.radius > w) {
    circle.speedX *= -1;
    circle.angularVelocity *= -1;
    // はみ出さないように座標を修正
    circle.x = Math.max(circle.radius, Math.min(circle.x, w - circle.radius));
    hitWall = true;
  }

  // 上下の壁
  if (circle.y - circle.radius < 0 || circle.y + circle.radius > h) {
    circle.speedY *= -1;
    circle.angularVelocity *= -1;
    circle.y = Math.max(circle.radius, Math.min(circle.y, h - circle.radius));
    hitWall = true;
  }

  return hitWall;
}

/**
 * 2つの円の完全弾性衝突を計算し、速度を更新する (1次元弾性衝突を軸方向成分で行う)
 * @param {Circle} c1 
 * @param {Circle} c2 
 */
function elasticCollision2D(c1, c2) {
  // 質量(便宜的に"半径"を質量として扱う)
  const m1 = c1.radius;
  const m2 = c2.radius;

  // 速度ベクトル
  const v1x = c1.speedX;
  const v1y = c1.speedY;
  const v2x = c2.speedX;
  const v2y = c2.speedY;

  // 衝突角度
  const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
  const sinA = Math.sin(angle);
  const cosA = Math.cos(angle);

  // ラジアル成分とタンジェント成分に分解
  const v1r =  v1x * cosA + v1y * sinA;  // c1のラジアル(衝突軸)成分
  const v1t = -v1x * sinA + v1y * cosA;  // c1のタンジェント(軸直交)成分
  const v2r =  v2x * cosA + v2y * sinA;
  const v2t = -v2x * sinA + v2y * cosA;

  // 1次元弾性衝突
  const v1rNew = ((m1 - m2)/(m1 + m2)) * v1r + ((2*m2)/(m1+m2)) * v2r;
  const v2rNew = ((m2 - m1)/(m1 + m2)) * v2r + ((2*m1)/(m1+m2)) * v1r;

  // タンジェント成分は変化しない
  const v1tNew = v1t;
  const v2tNew = v2t;

  // 再合成して速度を更新
  c1.speedX = v1rNew * cosA - v1tNew * sinA;
  c1.speedY = v1rNew * sinA + v1tNew * cosA;

  c2.speedX = v2rNew * cosA - v2tNew * sinA;
  c2.speedY = v2rNew * sinA + v2tNew * cosA;

  // 衝突時のラジアル速度の差に基づくインパルス
  const impulse = (v1r - v2r) * (m1 * m2) / (m1 + m2);

  c1.angularVelocity += impulse / (m1 * 30);
  c2.angularVelocity -= impulse / (m2 * 30);

}

/**
 * 2つの円が重なりすぎていたら位置を補正する(めり込み防止)
 * @param {Circle} c1 
 * @param {Circle} c2 
 */


function preventOverlap(c1, c2) {
  const distCenters = dist(c1.x, c1.y, c2.x, c2.y);
  const minDist = c1.radius + c2.radius;
  const overlap = minDist - distCenters;
  const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const half = overlap / 2;
  c1.x -= half * cosA;
  c1.y -= half * sinA;
  c2.x += half * cosA;
  c2.y += half * sinA;
  
}

