
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.id) {
    case "tabs":
      listTabs(sendResponse); break;
  }
  return true;
});

function listTabs(dispatcher) {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    dispatcher({ tabs: tabs });
  });
}