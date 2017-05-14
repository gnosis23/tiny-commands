(async function () {
  'use strict';
  // ========================================
  // Global variables
  // ========================================
  let tabs = [];
  const rootElement = await getRoot();

  // ========================================
  // setup
  // ========================================
  document.body.appendChild(rootElement);
  getTabs();
  bindKeysAndRender();

  // ========================================
  // implementations
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

  function bindKeysAndRender() {
    document.addEventListener("keydown", (event) => {
      if (event.key === "F2") {
        if (rootElement.classList.contains('__tcmd_hide')) {
          const input = document.getElementById('__tcmd-input');
          input.focus();

          render(tabs);
        }

        rootElement.classList.toggle('__tcmd_hide');
      }
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

  function render(currentTabs) {
    let list = "";
    const doRender = [
      tabRender(tabs),
      commandRender(tabs)
    ];

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

  function tabRender(currentTabs) {
    let list = "";
    list += `<p>标签</p>`;

    [].forEach.call(currentTabs, function (tab) {
      list +=
        `<a class="__tcmd-cmd __tcmd-tab">
          <span class="__tcmd-cmd-name">${tab.title}</span>        
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

  function commandRender(currentTabs) {
    let list = "";
    const selector = '__tcmd-command';
    list += '<p>命令</p>';

    const commandList = [
      {name: 'Open a new window', id: 'newWindow', key: 'Ctrl + n'},
      {name: 'Close the current window', id: 'closeWindow', key: 'Alt + F4'},
      {name: 'Turn full-screen mode on or off', id: 'fullScreen', key: 'F11'}
    ];

    commandList.forEach((cmd, index) => {
      list +=
        `<a class="__tcmd-cmd ${selector}">
          <span class="__tcmd-cmd-name">${commandList[index].name}</span>
          <span class="__tcmd-cmd-value">${commandList[index].key}</span>      
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