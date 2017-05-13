(async function () {
  'use strict';
  // start

  function htmlToElement(html) {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstChild;
  }

  var myInit = {
    method: 'GET',
    cache: 'default'
  };

  const response = await window.fetch(findPath('/view.html'), myInit);
  const template = await response.text();
  const node = htmlToElement(template);

  document.body.appendChild(node);

  function findPath(url) {
    return (chrome && chrome.extension) ? chrome.extension.getURL(url) : url;    
  }
})();