function convertHSBtoRGB(hue, sat, bright) {
  colorMode(HSB, 360, 100, 100);
  const c = color(hue, sat, bright);
  const rgb = { r: red(c), g: green(c), b: blue(c) };
  colorMode(RGB, 255);
  return rgb;
}
