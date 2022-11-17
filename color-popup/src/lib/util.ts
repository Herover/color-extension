export const getHSLAString = (hue: number, saturation: number, lightness: number, alpha: number): string => {
  const hslString = `${Math.floor(hue*100)/100}, ${Math.floor(saturation*10000)/100}%, ${Math.floor(lightness*10000)/100}%`;
  if (alpha !== 1) {
    return `hsla(${hslString},${alpha})`;
  } else {
    return `hsl(${hslString})`;
  }
};
