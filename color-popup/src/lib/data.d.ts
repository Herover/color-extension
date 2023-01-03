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
  dependsOn?: string;
}

/**
 * Contains data defining how edited tabs should behave
 */
export interface TabState {
  [tabId]: {
    swatchId: string,
    highlightedItems: {[string]: boolean},
  }
}

export interface TabData {
  tabToSwatchId: TabState,
}

/**
 * Contains non-persistent data specific to the extension in a tab
 */
export interface TabConfig {
  activeSwatchId?: string;
}
