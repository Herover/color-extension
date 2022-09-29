export const SWATCH = "SWATCH";
export const RULES = "RULES";

export const getValues = async (keys) => {
  if (chrome?.storage?.session) {
    const data = await chrome.storage.session.get(keys);
    return Object.keys(data).reduce((acc, key) => {
      acc[key] = JSON.parse(data[key]);
      return acc;
    }, {});
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve) => resolve());
};

export const setValue = async (key, value) => {
  if (chrome?.storage?.session) {
    // JSON.stringify is more space performant than whatever .set uses
    return chrome.storage.session.set({ [key]: JSON.stringify(value) });
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve) => resolve());
};

export const clear = async (key) => {
  if (chrome?.storage?.session) {
    return chrome.storage.session.remove(key);
  } else {
    console.warn("Storage not available");
  }
  return new Promise((resolve) => resolve());
};
