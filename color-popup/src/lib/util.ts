import chroma from "chroma-js";

export const clamp = (min: number, max: number, v: number): number => {
  return Math.min(max, Math.max(min, v));
}

export const getHSLAString = (hue: number, saturation: number, value: number, alpha: number): string => {
  const [nHue, nSaturation, nLightness] = chroma.hsv(hue, saturation, value).hsl();
  // Since Chroma-js represents some components as NaN in certain situations (ex. hue when value is
  // 0), we have to convert NaN values to something that doesn't break parsing the color.
  const hslString =
    Math.floor(clamp(0, 360, nHue || 0)*100)/100
    + ", "
    + Math.floor(clamp(0, 1, nSaturation || 0)*10000)/100
    + "%, " 
    + Math.floor(clamp(0, 1, nLightness || 0)*10000)/100
    + "%";
  if (alpha !== 1) {
    return `hsla(${hslString},${clamp(0, 1, alpha)})`;
  } else {
    return `hsl(${hslString})`;
  }
};
