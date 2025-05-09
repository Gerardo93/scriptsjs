// ==UserScript==
// @name         Steam to SteamDB Button
// @namespace    https://store.steampowered.com/
// @version      1.0
// @description  Adds a SteamDB button to Steam app, bundle, or sub pages in the appropriate action container.
// @author       Gerardo93
// @match        https://store.steampowered.com/app/*
// @match        https://store.steampowered.com/bundle/*
// @match        https://store.steampowered.com/sub/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/steam2steamdb.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/steam2steamdb.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const path = window.location.pathname;
    const match = path.match(/\/(app|bundle|sub)\/(\d+)/);

    if (!match) return;

    const [ , type, id ] = match;
    const steamDbUrl = `https://steamdb.info/${type}/${id}/`;

    const button = document.createElement('button');
    button.className = 'btnv6_blue_hoverfade btn_medium';
    button.style.marginTop = '16px';
    button.innerHTML = '<span>View on SteamDB</span>';
    button.addEventListener('click', () => window.open(steamDbUrl, '_blank'));

    const containerId = type === 'app' ? 'queueActionsCtn' : 'game_area_purchase_top';
    const container = document.getElementById(containerId);

    if (container) container.appendChild(button);
})();
