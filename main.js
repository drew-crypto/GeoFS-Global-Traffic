 // ==UserScript==
// @name         GLOBAL TRAFFIC
// @namespace    http://tampermonkey.net/
// @version      2026-07-06
// @description  try to take over the world!
// @author       You
// @match        https://www.geo-fs.com/geofs.php?v=3.9
// @match        https://beta.geo-fs.com/geofs.php?a=22
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geo-fs.com
// @grant        none
// ==/UserScript==
fetch('https://raw.githubusercontent.com/drew-crypto/GeoFS-Global-Traffic/refs/heads/main/Source%20code')
  .then(response => response.text())
  .then(code => {
    let script = document.createElement('script');
    script.textContent = code;
    document.head.appendChild(script);
    console.log('Global Traffic Mod loaded!');
  })
  .catch(error => console.error('Failed to load the mod:', error));
