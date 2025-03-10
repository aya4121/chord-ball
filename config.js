// config.js 内で定義した各設定をここで参照します。
const config = {
  scaleChangeInterval: 7000,
  transitionTime: 1000,
  gravity : 0.8,
  rotationWakeThreshold : 0.25,
  movementThreshold : 0.02,
  rotationFactor : 0.005,
  maxSpeed : 0.03,
  availableScales: [
    // Major Scales
    { key: 'C',  mode: 'major', scale: [43, 48, 52, 55, 60, 64, 67, 72], sharp: 0 },
    { key: 'C#', mode: 'major', scale: [44, 49, 53, 56, 61, 65, 68, 73], sharp: 2 },
    { key: 'D',  mode: 'major', scale: [45, 50, 54, 57, 62, 66, 69, 74], sharp: 1 },
    { key: 'D#', mode: 'major', scale: [43, 46, 51, 55, 58, 63, 67, 70], sharp: 2 },
    { key: 'E',  mode: 'major', scale: [44, 47, 52, 56, 59, 64, 68, 71], sharp: 1 },
    { key: 'F',  mode: 'major', scale: [45, 48, 53, 57, 60, 65, 69, 72], sharp: 0 },
    { key: 'F#', mode: 'major', scale: [46, 49, 54, 58, 61, 66, 70, 73], sharp: 3 },
    { key: 'G',  mode: 'major', scale: [43, 47, 50, 55, 59, 62, 67, 71], sharp: 0 },
    { key: 'G#', mode: 'major', scale: [44, 48, 51, 56, 60, 63, 68, 72], sharp: 2 },
    { key: 'A',  mode: 'major', scale: [45, 49, 52, 57, 61, 64, 69, 73], sharp: 1 },
    { key: 'A#', mode: 'major', scale: [46, 50, 53, 58, 62, 65, 70, 74], sharp: 1 },
    { key: 'B',  mode: 'major', scale: [47, 51, 54, 59, 63, 66, 71, 75], sharp: 2 },
    // Minor Scales
    { key: 'Cm',  mode: 'minor', scale: [43, 48, 51, 55, 60, 63, 67, 72], sharp: 1 },
    { key: 'C#m', mode: 'minor', scale: [44, 49, 52, 56, 61, 64, 68, 73], sharp: 2 },
    { key: 'Dm',  mode: 'minor', scale: [45, 50, 53, 57, 62, 65, 69, 74], sharp: 0 },
    { key: 'D#m', mode: 'minor', scale: [46, 51, 54, 58, 63, 66, 70, 75], sharp: 3 },
    { key: 'Em',  mode: 'minor', scale: [43, 47, 52, 55, 59, 64, 67, 71], sharp: 0 },
    { key: 'Fm',  mode: 'minor', scale: [44, 48, 53, 56, 60, 65, 68, 72], sharp: 1 },
    { key: 'F#m', mode: 'minor', scale: [45, 49, 54, 57, 61, 66, 69, 73], sharp: 2 },
    { key: 'Gm',  mode: 'minor', scale: [46, 50, 55, 58, 62, 67, 70, 74], sharp: 1 },
    { key: 'G#m', mode: 'minor', scale: [44, 47, 51, 56, 59, 63, 68, 71], sharp: 2 },
    { key: 'Am',  mode: 'minor', scale: [45, 48, 52, 57, 60, 64, 69, 72], sharp: 0 },
    { key: 'A#m', mode: 'minor', scale: [46, 49, 53, 58, 61, 65, 70, 73], sharp: 2 },
    { key: 'Bm',  mode: 'minor', scale: [47, 50, 54, 59, 62, 66, 71, 74], sharp: 1 }
  ],
  hueMapping: {
    'C': 120, 'C#': 60, 'D': 30, 'D#': 150, 'E': 90, 'F': 0,
    'F#': 330, 'G': 210, 'G#': 240, 'A': 300, 'A#': 270, 'B': 120,
    'Cm': 120, 'C#m': 60, 'Dm': 30, 'D#m': 150, 'Em': 90,
    'Fm': 0, 'F#m': 330, 'Gm': 210, 'G#m': 240, 'Am': 300, 'A#m': 270, 'Bm': 120
  },
  oscillatorType: "sine",
  envelopeADSR: { attack: 0.01, decay: 0.6, sustain: 0.0, release: 0.05 },
  envelopeRange: { max: 0.5, min: 0 },
  // 以下、config で渡す円の各種パラメータ
  circleRadiusMaxDivisor: 8,
  circleRadiusMinDivisor: 40,
  circleSpeedDivisor: 150,
  faceTransitionIncrement: 0.05,
  angularFriction: 0.99
};
