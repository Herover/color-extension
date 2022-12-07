import chroma from "chroma-js";

export const clamp = (min: number, max: number, v: number): number => {
  return Math.min(max, Math.max(min, v));
}

export const getHSLAString = (hue: number, saturation: number, value: number, alpha: number): string => {
  const [nHue, nSaturation, nLightness] = chroma.hsv(hue, saturation, value).hsl();
  const hslString = `${Math.floor(clamp(0, 360, nHue)*100)/100}, ${Math.floor(clamp(0, 1, nSaturation)*10000)/100}%, ${Math.floor(clamp(0, 1, nLightness)*10000)/100}%`;
  if (alpha !== 1) {
    return `hsla(${hslString},${clamp(0, 1, alpha)})`;
  } else {
    return `hsl(${hslString})`;
  }
};
