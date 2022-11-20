export const clamp = (min: number, max: number, v: number): number => {
  return Math.min(max, Math.max(min, v));
}

export const getHSLAString = (hue: number, saturation: number, lightness: number, alpha: number): string => {
  const hslString = `${Math.floor(clamp(0, 360, hue)*100)/100}, ${Math.floor(clamp(0, 1, saturation)*10000)/100}%, ${Math.floor(clamp(0, 1, lightness)*10000)/100}%`;
  if (alpha !== 1) {
    return `hsla(${hslString},${clamp(0, 1, alpha)})`;
  } else {
    return `hsl(${hslString})`;
  }
};
