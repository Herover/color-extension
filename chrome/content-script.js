console.log("hi from content script");

const selectHoverColor = "rgba(255, 0, 0, 0.25)"
const oldColorKey = "__color_ext_old_bg";
let isSelecting = false;
let onSelected;

const hexRegex = /^\#([0-9]|[a-f]){6,8}$/;
const rgbRegex = /^rgb(a?)\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(\,\s*\d\.\d+)?\)$/;
const hslRegex = /^hsl(a?)\(\s*\d{1,3}\s*,\s*\d{1,3}\%\s*,\s*\d{1,3}\%\s*(\,\s*\d\.\d+)?\)$/;
const hwbRegex = /^hwb(a?)\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(\,\s*\d\.\d+)?\)$/;
const isColor = str => str.match(hexRegex)
  || str.match(rgbRegex)
  || str.match(hslRegex)
  || str.match(hwbRegex);

function startSelecting() {
  isSelecting = true;
}
function stopSelecting() {
  isSelecting = false;
}

chrome.runtime.onMessage.addListener(
  // Note: the callback should not return a Promise (so no async/await)
  // otherwise sendResponse wont work as expected.
  // Use callbacks and return 1 for async-ish code.
  (request, sender, sendResponse) => {
    console.log(request.action, sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    if (request.action === "getElement") {
      onSelected = (el) => {
        //sendResponse({ element: el });
        onSelected = undefined;
      };
      isSelecting = true;

      sendResponse({ res: "ok" });
    } else if (request.action === "updateRules") {
      const defs = getCSSRules((key, val) => isColor(val.toLowerCase().trim()));
      console.log("defs", defs);
      sendResponse({ res: "ok", rules: defs });
      //chrome.runtime.sendMessage({ action: "rules", rules: defs });
    } else if (request.action === "updateVariables") {
      const defs = getCSSRules((key, val) => key.startsWith('--') && isColor(val.toLowerCase().trim()));
      console.log("defs", defs);
      sendResponse({ res: "ok", rules: defs });
      //chrome.runtime.sendMessage({ action: "rules", rules: defs });
    } else if (request.action === "setCSSRule") {
      console.log("setCSSRule", request)
      setCSSRule(request.selector, request.key, request.value);
      sendResponse({ res: "ok" });
    } else if (request.action === "getMessages") {
      // TODO: clean queue?
      chrome.storage.session.get([ "messageQueue" ], (data) => {
        sendResponse({res: data.messageQueue, "test": "YAY"});
        chrome.storage.session.clear([ "messageQueue" ]);
      });
      return true;
    } else if (request.action === "setColors") {
      window.postMessage(
        {
          COLOR_EXT: {
            action: "setColors",
            name: "test",
            type: "ordinal",
            colors: request.colors,
          },
        },
        window.origin,
      );
    }
  }
);

function resetElement(target) {
  target.style.backgroundColor = target[oldColorKey];
  target[oldColorKey] = undefined;
}
function markElements(elements) {
  elements.forEach(element => {
    element[oldColorKey] = element.style.backgroundColor;
    element.style.backgroundColor = selectHoverColor;
  })
}
function selectElementMouseOver(event) {
  if (!isSelecting) { return; }
  markElements([event.target]);
}
function selectElementMouseOut(event) {
  if (!isSelecting) { return; }
  resetElement(event.target);
}
function selectElementClick(event) {
  if (!isSelecting) { return; }
  event.preventDefault();
  stopSelecting();
  resetElement(event.target);
  console.log(event);
  onSelected({
    tag: event.target.nodeName.toLowerCase(),
    class: event.target.className.split(" "),
    id: event.target.id,
  });
  onSelected = null;
}

window.addEventListener("mouseout", selectElementMouseOut);
window.addEventListener("mouseover", selectElementMouseOver);
window.addEventListener("click", selectElementClick);

function getCSSRules(filterFn) {
  let r=document.querySelector(":root")
  let s=getComputedStyle(r)
  let defs = [];
  for (var i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      for (var j = 0; j < sheet.cssRules.length; j++) {
        const rule = sheet.cssRules[j];
        const group = {
          selector: rule.selectorText,
          source: sheet.href,
          properties: [],
        };
        // console.log(rule)
        try {
          if (rule.style) {
            for (var k = 0; k < rule.style.length; k++) {
              const styleKey = rule.style[k];
              // FIXME: trim only important for colors?
              const value = rule.style.getPropertyValue(styleKey).trim();
              if (filterFn(styleKey, value)) {
                group.properties.push({
                  key: styleKey,
                  value,
                });
              }
            }
          }
          // Consider if looping cssRules (CSSMediaRule) is useful
          /* else if (rule.cssRules) {
            for (var k = 0; k < rule.cssRules.length; k++) {
              for (var l = 0; l < rule.cssRules[k].style.length; l++) {
                const styleKey = rule.cssRules[k].style[l];
                const value = s.getPropertyValue(styleKey);
                if (styleKey.startsWith('--') && isColor(value)) {
                  variables.push({
                    key: styleKey,
                    value,
                  });
                }
              }
            }
          } */
        } catch (error) { /* console.warn("rule", error) */ }

        if (group.properties.length !== 0) {
          defs.push(group);
        }
      }
    } catch (error) { /* console.log("sheet", sheet, error) */ }
  }

  return defs;
}

function setCSSRule(selector, key, value) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => {
    element.style.setProperty(key, value);
  });
}

window.addEventListener("message", async (event) => {
  if (event.source != window) {
    return;
  }

  if (event.data.COLOR_EXT) {
    const data = event.data.COLOR_EXT;
    
    if (data.action == "register") {
      if (data.type == "ordinal") {
        const item = { action: "registerOrdinal", colors: data.colors, name: data.name };
        const key = "messageQueue";
        const storedData = await chrome.storage.session.get([key]);
        const queue = storedData[key] || [];
        queue.push(item);
        const r = await chrome.storage.session.set({[ key ]: queue});
      }
    }
  }
});