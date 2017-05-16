(async function () {
  'use strict';
  // ========================================
  // Type declarations
  // ========================================
  class Command {
    constructor(name, value, type) {
      this.name = name;
      this.value = value;
      this.type = type;
      this.id = 0;
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
  const rootElement = await getRoot();
  let commandList = null;

  // ========================================
  // setup
  // ========================================
  document.body.appendChild(rootElement);
  getTabs();
  bindKeysAndRender();

  // ========================================
  // implementations
  // ========================================
  function setupCommandList(currentTabs, keywords) {
    if (keywords) {
      currentTabs = currentTabs.filter((tab) => strContains(tab.title, keywords));      
    }

    const list = new CommandList();
      
    [].forEach.call(currentTabs, function (tab) {
      list.add(new Command(tab.title, "", "tab"))
    });

    KEY_LIST.filter(x => strContains(x.name, keywords)).forEach((key) => {
      list.add(new Command(key.name, key.key, "key"));
    });
    
    return list;
  }

  async function getRoot() {
    var fetchOptions = {
      method: 'GET',
      cache: 'default'
    };
    const response = await window.fetch(findPath('/view.html'), fetchOptions);
    const template = await response.text();
    return htmlToElement(template);
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
      if (event.key === "F2") return;
      else if (event.key === "ArrowUp") {
        commandList.selectPrev();        
      }
      else if (event.key === "ArrowDown") {
        commandList.selectNext();        
      }
      else {
        commandList = setupCommandList(tabs, input.value);        
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
      tabRender(commandList.type("tab"), commandList.ptr, tabs),
      keyRender(commandList.type("key"), commandList.ptr)
    ].filter(x => x !== null);

    doRender.forEach((result) => {
      list += result.template;
    });
    const cmdList = document.getElementById('__tcmd-list');
    cmdList.innerHTML = list;

    doRender.forEach((result) => {
      document.querySelectorAll(result.selector).forEach((elem, index) => {
        result.listener(elem, index);
      })
    })
  }

  function tabRender(commandList, ptr, currentTabs) {
    if (commandList.length === 0) {
      return null;
    }

    let list = "";
    list += `<p>标签</p>`;

    [].forEach.call(commandList, function (tab) {
      list +=
        `<a class="__tcmd-cmd __tcmd-tab ${tab.id === ptr ? '__tcmd_selected' : '' }">
          <span class="__tcmd-cmd-name">${tab.name}</span>        
        </a>`
    });

    function clickListener(elem, index) {
      elem.addEventListener('click', () => {
        chrome.runtime.sendMessage({ id: "gotoTab", tab: currentTabs[index] });
      });
    }

    return {
      template: list,
      selector: ".__tcmd-tab",
      listener: clickListener
    }
  }

  function keyRender(commandList, ptr) {
    if (commandList.length === 0) {
      return null;
    }

    let list = "";
    const selector = '__tcmd-command';
    list += '<p>命令</p>';

    commandList.forEach((cmd, index) => {
      list +=
        `<a class="__tcmd-cmd ${selector} ${cmd.id === ptr ? '__tcmd_selected' : '' }">
          <span class="__tcmd-cmd-name">${commandList[index].name}</span>
          <span class="__tcmd-cmd-value">${commandList[index].value}</span>      
        </a>`;
    });

    function clickListener(elem, index) {
      elem.addEventListener('click', () => {
        chrome.runtime.sendMessage({ id: commandList[index].id });
      });
    }

    return {
      template: list,
      selector: `.${selector}`,
      listener: clickListener
    }
  }
})();