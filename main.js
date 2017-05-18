(async function () {
  'use strict';
  // ========================================
  // Type declarations
  // ========================================
  class Command {
    constructor(name, value, type, handler) {
      this.name = name;
      this.value = value;
      this.type = type;
      this.id = 0;
      this.handler = handler;
    }
  };
  class CommandList {
    constructor() {
      this.counter = 0;
      this.commands = [];
      this.ptr = 0;
    }
    type(name) {
      return this.commands.filter(x => x.type === name);
    }
    add(command) {
      command.id = this.counter++;
      this.commands.push(command);
    }
    selectNext() {
      if (this.ptr + 1 < this.counter) this.ptr = this.ptr + 1;
    }
    selectPrev() {
      if (this.ptr > 0) this.ptr = this.ptr - 1;
    }
    selected() {
      return this.commands.length === 0 ? null : this.commands[this.ptr];
    }
  }

  // ========================================
  // Global variables
  // ========================================
  const KEY_LIST = [
    { name: 'Open a new window', id: 'newWindow', key: 'Ctrl + n' },
    { name: 'Close the current window', id: 'closeWindow', key: 'Alt + F4' },
    { name: 'Turn full-screen mode on or off', id: 'fullScreen', key: 'F11' }
  ];
  let tabs = [];
  let bookmarks = [];
  let histories = [];
  const rootElement = await getRoot();
  let commandList = null;

  // ========================================
  // setup
  // ========================================
  document.body.appendChild(rootElement);
  getTabs();
  getBookmarks();
  getHistories();
  bindKeysAndRender();

  // ========================================
  // helper functions
  // ========================================
  async function getRoot() {
    var fetchOptions = {
      method: 'GET',
      cache: 'default'
    };
    const response = await window.fetch(findPath('/view.html'), fetchOptions);
    const template = await response.text();
    return htmlToElement(template);
  }

  function htmlToElement(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstChild;
  }

  function findPath(url) {
    return (chrome && chrome.extension) ? chrome.extension.getURL(url) : url;
  }

  function strContains(word, keywords) {
    return word.toLowerCase().indexOf(keywords.toLowerCase()) > -1;
  }

  function bookmarkContains(bookmark, keywords) {
    return strContains(bookmark.title, keywords) || strContains(decodeURI(bookmark.url), keywords);
  }

  function hideCommander() {
    rootElement.classList.toggle('__tcmd_hide');
  }

  function createTextNode(text) {
    const elem = document.createElement("p");
    elem.innerText = text;
    return elem;
  }

  function createCommandNode(text, value, selected) {
    /** 
     * <a class="__tcmd-cmd __tcmd-tab ${tab.id === ptr ? '__tcmd_selected' : '' }">
     *   <span class="__tcmd-cmd-name">${tab.name}</span>        
     * </a>
     */
    const parent = document.createElement("a");
    parent.classList.add("__tcmd-cmd");
    if (selected) parent.classList.add("__tcmd_selected");
    const name = document.createElement("span");
    name.classList.add("__tcmd-cmd-name");
    name.innerText = text;
    parent.appendChild(name);
    const value0 = document.createElement("span");
    value0.classList.add("__tcmd-cmd-value");
    value0.innerText = value;
    parent.appendChild(value0);
    return parent;
  }

  // ========================================
  // implementations
  // ========================================
  function setupCommandList(currentTabs, keywords) {
    if (keywords) {
      currentTabs = currentTabs.filter((tab) => strContains(tab.title, keywords));      
    }

    const list = new CommandList();
      
    [].forEach.call(currentTabs, function (tab) {
      const handler = () => {
        chrome.runtime.sendMessage({ id: "gotoTab", tab: tab });
      }
      list.add(new Command(tab.title, "", "tab", handler))
    });

    KEY_LIST.filter(x => strContains(x.name, keywords)).forEach((key) => {
      const handler = () => {
        chrome.runtime.sendMessage({ id: key.id });
      }
      list.add(new Command(key.name, key.key, "key", handler));
    });
    
    bookmarks.filter(x => bookmarkContains(x, keywords)).slice(0, 10).forEach((bookmark) => {
      const handler = () => {
        chrome.runtime.sendMessage({ id: "openBookmark", url: bookmark.url });
      }
      list.add(new Command(bookmark.title, bookmark.url, "bookmark", handler));
    });

    // search
    list.add(new Command(`Search in Google: ${keywords}`, `https://www.google.com/search?q=${keywords}`, "Google", 
      () => {
      chrome.runtime.sendMessage({ id: "openBookmark", url: `https://www.google.com/search?q=${keywords}` });
    }));

    return list;
  }

  function bindKeysAndRender() {    
    const input = document.getElementById('__tcmd-input');

    document.addEventListener("keydown", (event) => {
      if (event.key === "F2") {
        getTabs();
        input.value = "";
        rootElement.classList.toggle('__tcmd_hide');
        if (!rootElement.classList.contains('__tcmd_hide')) {     
          commandList = setupCommandList(tabs, "");     
          render(commandList, tabs, "");          
          input.focus();          
          scrollToTop();
        }        
      }
    });

    input.addEventListener('keyup', (event) => {      
      switch (event.key) {
        case "F2":
          return;
        case "Enter":
          const cmd = commandList.selected();
          cmd.handler();
          hideCommander();
          break;
        case "ArrowUp":
          commandList.selectPrev(); break;
        case "ArrowDown":
          commandList.selectNext(); break;
        default:
          commandList = setupCommandList(tabs, input.value);
          break;
      }
      render(commandList, tabs, input.value);
      scrollIfNeed();
    });
  }

  function getTabs() {
    chrome.runtime.sendMessage({ id: "tabs" }, function (response) {      
      tabs = (response.tabs);
    });
  }

  function getBookmarks() {
    chrome.runtime.sendMessage({ id: "bookmarks" }, function (response) {      
      bookmarks = (response.bookmarks);
    });
  }

  function getHistories() {
    chrome.runtime.sendMessage({ id: "histories" }, function (response) {      
      histories = (response.histories);
    });
  }

  function scrollToTop() {
    document.getElementById('__tcmd-list').scrollTop = 0;
  }

  function scrollIfNeed() {
    const parentElement = document.getElementById('__tcmd-list');
    const selectedElement = document.querySelector(".__tcmd_selected");
    if (!selectedElement) return;

    if (selectedElement.offsetTop < parentElement.scrollTop) {
      selectedElement.scrollIntoView(true);
    }
    if (selectedElement.offsetTop - 236 > parentElement.scrollTop) {
      selectedElement.scrollIntoView(false);
    }
  }

  function render(commandList, currentTabs, keywords) {
    let list = "";
    const doRender = [
      commonRender(commandList.type("tab"), commandList.ptr, "Current Tab"),
      commonRender(commandList.type("key"), commandList.ptr, "Key Bindings"),
      commonRender(commandList.type("bookmark"), commandList.ptr, "Bookmarks"),
      commonRender(commandList.type("Google"), commandList.ptr, "Search")
    ].filter(x => x !== null);

    const cmdList = document.getElementById('__tcmd-list');
    cmdList.innerHTML = '';
    doRender.forEach((result) => {
      result.forEach((node) => { cmdList.appendChild(node) });
    });
  }

  function commonRender(commandList, currentPtr, title) {
    if (commandList.length === 0) return null;

    let list = [];
    list.push(createTextNode(title));
    
    commandList.forEach(function (cmd) {
      const node = createCommandNode(cmd.name, cmd.value, cmd.id === currentPtr);
      node.addEventListener('click', cmd.handler);
      list.push(node);
    });    

    return list;    
  }
})();