// ==UserScript==
// @name         Xbox EN-US to ES-MX Redirect
// @namespace    https://xbox.com/
// @version      1.1
// @description  Redirige automáticamente URLs de Xbox en-US a es-MX en la tienda de juegos.
// @author       Gerardo93
// @match        https://www.xbox.com/en-us/games/store/*
// @match        https://www.xbox.com/en-US/games/store/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/xboxredirect.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/xboxredirect.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const currentUrl = window.location.href;
    if (/\/en-us\//i.test(currentUrl)) {
        const newUrl = currentUrl.replace(/\/en-us\//i, '/es-mx/');
        if (window.location.href !== newUrl) {
            window.location.replace(newUrl);
        }
    }
})();