import type { SiteData, TabConfig, TabData } from './data.d';

enum StoreType {
  session,    // Only for this browsing session
  persistent, // Persist between sessions
}


const getStorage = (type: StoreType): chrome.storage.StorageArea => {
  if (type == StoreType.session && chrome?.storage?.session) {
    return chrome?.storage?.session;
  } else if (type == StoreType.persistent && chrome?.storage?.local) {
    return chrome?.storage?.local;
  } else {
    throw new Error("Storage not available")
  }
};

export const SWATCH = "SWATCH";
export const RULES = "RULES";
export const ORDINAL = "ORDINAL";

const TAB_DATA = "tab-data";
const TAB_OPTIONS = "tab-options";

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
  await setValue(key, siteData, StoreType.persistent);
};

export const getTabData = async (): Promise<TabData> => {
  const data = await getValues([TAB_DATA], StoreType.persistent);
  if (!data[TAB_DATA]) {
    const cleanData: TabData = {
      tabToSwatchId: {},
    };
    await setTabData(cleanData);
    return cleanData;
  }
  return data[TAB_DATA] as TabData;
};

export const setTabData = async (tabData: TabData): Promise<void> => {
  return await setValue(TAB_DATA, tabData, StoreType.persistent);
};

export const getValues = async (keys: string[], store: StoreType) => {
  const storeArea = getStorage(store);
  const data = await storeArea.get(keys);
  return keys.reduce((acc, key) => {
    if (data[key]) {
      acc[key] = JSON.parse(data[key]);
    }
    return acc;
  }, {});
};

export const setValue = async (key: string, value: any, store: StoreType): Promise<void> => {
  const storeArea = getStorage(store);
  // JSON.stringify is more space performant than whatever .set uses
  return storeArea.set({ [key]: JSON.stringify(value) });
};

export const clear = async (key: string, store?: StoreType) => {
  const storeArea = store ? getStorage(store) : getStorage(StoreType.persistent);
  // TODO: remove
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return storeArea.remove(key);
};
