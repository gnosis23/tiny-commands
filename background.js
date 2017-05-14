
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.id) {
    case "tabs":
      listTabs(sendResponse); break;
    case "gotoTab":
      gotoTab(sender.tab); break;
    case "newWindow":
      createWindow(); break;
    case "closeWindow":
      closeWindow(sender.tab); break;
    case "fullScreen":
      fullScreen(sender.tab); break;
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

function createWindow() {
  chrome.windows.create();
}

function closeWindow(tab) {
  chrome.windows.remove(tab.windowId);
}

function fullScreen(tab) {
  chrome.windows.update(tab.windowId, {state: "fullscreen"});
}