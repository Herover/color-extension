const selectHoverColor = "rgba(255, 0, 0, 0.25)"
const oldColorKey = "__color_ext_old_bg";
const messageQueueStorageKey = "__color_ext_message_queue"
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
    switch (request.action) {
      case "getElement":
        // Set the page up to allow the user to select a HTML element
        startSelecting();
        sendResponse({ res: "ok", origin: window.location.origin });
        break;

      case "updateRules":
        // Popup is requesting a list of CSS rules
        const ruleDefs = getCSSRules((key, val) => isColor(val.toLowerCase().trim()));
        // console.log("defs", ruleDefs);
        sendResponse({ res: "ok", rules: ruleDefs, origin: window.location.origin });
        break;

      case "updateVariables":
        // Popup is requesting a list of CSS rule variables only
        const variableDefs = getCSSRules((key, val) => key.startsWith('--') && isColor(val.toLowerCase().trim()));
        // console.log("defs", variableDefs);
        sendResponse({ res: "ok", rules: variableDefs, origin: window.location.origin });
        break;

      case "setCSSRule":
        // Set a CSS rule on the current page
        setCSSRule(request.selector, request.key, request.value);
        sendResponse({ res: "ok", origin: window.location.origin });
        break;

      case "getMessages":
        // Send and clear the message queue
        chrome.storage.session.get([ messageQueueStorageKey ], (data) => {
          sendResponse({ res: data[ messageQueueStorageKey ], origin: window.location.origin });
          chrome.storage.session.clear([ messageQueueStorageKey ]);
        });

        // Return true to indicate that we will sendResponse in a callback
        return true;
        break;
  
      case "setColors":
        // Notify webpage of changes to a a color subscription
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
        break;
  
      case "getURL":
        // Popup requested the current url
        sendResponse({ res: window.location.href, origin: window.location.origin });
        break;
      
      default:
        console.warn(`Unrecognized color extension action "${request.action}"`);
        break;
    }
  }
);

function startSelecting() {
  onSelected = (el) => {
    //sendResponse({ element: el });
    onSelected = undefined;
  };
  isSelecting = true;
}

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
        const key = messageQueueStorageKey;
        const storedData = await chrome.storage.session.get([key]);
        const queue = storedData[key] || [];
        queue.push(item);
        const r = await chrome.storage.session.set({[ key ]: queue});
      }
    }
  }
});