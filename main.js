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
          bindClicks(tabs);
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

    list += `<p>标签</p>`;

    [].forEach.call(currentTabs, function (tab) {
      list +=
        `<a class="__tcmd-cmd __tcmd-tab">
          <span class="__tcmd-cmd-name">${tab.title}</span>        
        </a>`
    })

    const cmdList = document.getElementById('__tcmd-list');
    cmdList.innerHTML = list;
  }

  function bindClicks(currentTabs) {
    document.querySelectorAll('.__tcmd-tab').forEach(function (elem, index) {
      elem.addEventListener('click', () => {
        chrome.runtime.sendMessage({ id: "gotoTab", tab: currentTabs[index] });
      })
    })
  }
})();