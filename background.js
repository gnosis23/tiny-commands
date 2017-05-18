
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.id) {
    case "tabs":
      listTabs(sendResponse); break;
    case "bookmarks":
      listBookmarks(sendResponse); break;
    case "histories":
      listHistories(sendResponse); break;
    case "openBookmark":
      openBookmark(request.url);
    case "gotoTab":
      gotoTab(request.tab); break;
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

function listBookmarks(dispatcher) {
  chrome.bookmarks.getTree(function (treeNodes) {
    dispatcher({ bookmarks: treeToList(treeNodes[0]) });
  })
}

function listHistories(dispatcher) {
  chrome.history.search({text: ""}, function (items) {
    dispatcher({ histories: items });
  })
}

function treeToList(tree) {
  let result = [];
  if (tree.url) {
    result.push({title: tree.title, url: tree.url});
  } else if (tree.children) {
    tree.children.forEach(function(node) {
      result = result.concat(treeToList(node));
    })
  }
  return result;
}

function openBookmark(url) {
  chrome.tabs.create({url: url, active: true})
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