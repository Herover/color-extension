import { writable } from "svelte/store";
import type { SiteData, SiteSwatch } from "./data";
import type { Rule } from "./rule";


export const siteData = function create() {
  const { subscribe, set, update } = writable<SiteData>({
    swatches: [],
    rules: [],
    ordinal: [],
  });

  return {
    subscribe,

    setData: (data: SiteData) => set(data),

    // Call this if the data has been mutated outside the store (ew!)
    refresh: () => update(d => { return d }),

    addSwatch: (data: SiteSwatch) => update(d => {
      d.swatches.push(data);
      return d;
    }),

    setRules: (data: Rule[]) => update(d => {
      d.rules = data;
      return d;
    }),

    setOridnal: (data: any[]) => update(d => {
      d.ordinal = data;
      return d;
    }),
  };
}();
