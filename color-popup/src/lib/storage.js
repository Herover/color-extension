export const SWATCH = "SWATCH";
export const RULES = "RULES";
export const ORDINAL = "ORDINAL";

export const getValues = async (keys) => {
  if (chrome?.storage?.session) {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const data = await chrome.storage.session.get(keys.map(key => `${tab.id} - ${key}`));
    return keys.reduce((acc, key) => {
      const dataKey = `${tab.id} - ${key}`;
      if (data[dataKey]) {
        acc[key] = JSON.parse(data[dataKey]);
      }
      return acc;
    }, {});
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve) => resolve());
};

export const setValue = async (key, value) => {
  if (chrome?.storage?.session) {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // JSON.stringify is more space performant than whatever .set uses
    return chrome.storage.session.set({ [`${tab.id} - ${key}`]: JSON.stringify(value) });
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve) => resolve());
};

export const clear = async (key) => {
  // TODO: remove
  await chrome.storage.session.clear();
  if (chrome?.storage?.session) {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.storage.session.remove(`${tab.id} - ${key}`);
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve) => resolve());
};
