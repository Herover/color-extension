import type { Rule } from "./rule";
import type { Swatch } from "./swatch";

export interface SiteData {
  swatches: SiteSwatch[];
  rules: Rule[];
}

interface SiteSwatch {
  id: string;
  swatch: Swatch;
}
