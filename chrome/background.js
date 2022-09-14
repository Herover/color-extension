let color = '#3aa757';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

let rules = [];

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(sender.tab ?
                "from a content script:" + sender.tab.url :
                "from the extension");
    console.log(request);
    if (request.action === "rules") {
      sendResponse({ res: "ok" });
      rules = request.rules;
    } else if (request.action === "getRules") {
      console.log("getRules", rules)
      sendResponse({ res: "ok", rules });
    }
  }
);
