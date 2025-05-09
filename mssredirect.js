// ==UserScript==
// @name         Microsoft Store EN-US to ES-MX Redirect
// @namespace    https://apps.microsoft.com/
// @version      1.0
// @description  Redirige automáticamente Microsoft Store de en-US a es-MX.
// @author       Gerardo93
// @match        https://apps.microsoft.com/detail/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/mssredirect.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/mssredirect.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    const url = new URL(window.location.href);

    const needsRedirect = url.searchParams.get('hl') === 'en-US' || url.searchParams.get('gl') === 'US';
    if (needsRedirect) {
        url.searchParams.set('hl', 'es-MX');
        url.searchParams.set('gl', 'MX');
        window.location.replace(url.toString());
    }
})();
