import type { Rule } from "./rule";
import type { Swatch } from "./swatch";

export interface SiteData {
  swatches: SiteSwatch[];
  rules: Rule[];
  ordinal: any[]; // TODO
}

interface SiteSwatch {
  id: string;
  name: string;
  swatch: Swatch[];
}

export interface TabData {
  activeSwatchId: string;
}
