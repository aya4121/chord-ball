function convertHSBtoRGB(hue, sat, bright) {
    colorMode(HSB, 360, 100, 100);
    let c = color(hue, sat, bright);
    let rgb = { r: red(c), g: green(c), b: blue(c) };
    colorMode(RGB, 255);
    return rgb;
}
