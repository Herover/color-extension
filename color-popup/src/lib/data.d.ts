import type { Rule } from "./rule";
import type { SwatchColor } from "./swatch";

export interface SiteData {
  swatches: SiteSwatch[];
  rules: Rule[];
  ordinal: any[]; // TODO
}

interface SiteSwatch {
  id: string;
  name: string;
  swatch: SwatchColor[];
}

export interface TabData {
  activeSwatchId: string;
}
