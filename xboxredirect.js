// ==UserScript==
// @name         Xbox EN-US to ES-MX Redirect
// @namespace    https://xbox.com/
// @version      1.0
// @description  Redirige automáticamente URLs de Xbox en-US a es-MX en la tienda de juegos.
// @author       Gerardo93
// @match        https://www.xbox.com/en-us/games/store/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/xboxredirect.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/xboxredirect.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const newUrl = window.location.href.replace('/en-us/', '/es-mx/');
    if (window.location.href !== newUrl) {
        window.location.replace(newUrl);
    }
})();
