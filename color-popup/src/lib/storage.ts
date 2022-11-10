import type { SiteData, TabData } from './data.d';

enum StoreType {
  session,    // Only for this browsing session
  persistent, // Persist between sessions
}

export const SWATCH = "SWATCH";
export const RULES = "RULES";
export const ORDINAL = "ORDINAL";

export const getSiteData = async (site: string): Promise<SiteData | null> => {
  const key = `site-${site}`;
  const siteData = await getValues([key], StoreType.persistent);
  if (siteData[key]) {
    return siteData[key] as SiteData;
  } else {
    return null;
  }
};

export const setSiteData = async (site: string, siteData: SiteData): Promise<void> => {
  const key =  `site-${site}`;
  await setValue(key, siteData);
};

export const getTabData = async (tabId: number): Promise<TabData> => {
  const siteData = await getValues([`tab-${tabId}`], StoreType.session);
  return siteData as TabData;
  return null
};

export const getValues = async (keys: string[], store: StoreType) => {
  if (chrome?.storage?.local) {
    const data = await chrome.storage.local.get(keys);
    return keys.reduce((acc, key) => {
      if (data[key]) {
        acc[key] = JSON.parse(data[key]);
      }
      return acc;
    }, {});
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve, reject) => reject("Storage not available"));
};

export const setValue = async (key: string, value: any) => {
  if (chrome?.storage?.local) {
    // JSON.stringify is more space performant than whatever .set uses
    return chrome.storage.local.set({ [key]: JSON.stringify(value) });
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve, reject) => reject("Storage not available"));
};

export const clear = async (key: string) => {
  // TODO: remove
  await chrome.storage.local.clear();
  if (chrome?.storage?.local) {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.storage.local.remove(key);
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve, reject) => reject("Storage not available"));
};
