
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.id) {
    case "tabs":
      listTabs(sendResponse); break;
    case "gotoTab":
      gotoTab(request.tab); break;
  }
  return true;
});

function listTabs(dispatcher) {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    dispatcher({ tabs: tabs });
  });
}

function gotoTab(tab) {
  chrome.tabs.update(tab.id, {active: true});
}