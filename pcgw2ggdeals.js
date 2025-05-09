// ==UserScript==
// @name         PCGamingWiki to GGDeals Link Generator
// @namespace    https://www.gg.deals/
// @version      1.0
// @description  Adds GGDeals buttons on PCGamingWiki game pages for direct access and search by title.
// @author       Gerardo93
// @match        https://www.pcgamingwiki.com/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/pcgw2ggdeals.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/pcgw2ggdeals.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Obtener y limpiar el nombre del juego desde el título
    const rawTitle = document.title.replace(/ - PCGamingWiki.*/i, '').trim();
    const cleanTitle = rawTitle.replace(/[^\w\s-]/g, '').toLowerCase();
    const kebabCase = cleanTitle.replace(/\s+/g, '-');
    const searchQuery = cleanTitle.replace(/\s+/g, '+');

    // Generar URLs
    const ggDealsDirectUrl = `https://gg.deals/game/${kebabCase}`;
    const ggDealsSearchUrl = `https://gg.deals/games/?title=${searchQuery}`;

    // Crear botón con clases y estilos
    const createButton = (text, url) => {
        const a = document.createElement('a');
        a.className = 'external text';
        a.textContent = text;
        a.href = url;
        a.target = '_blank';
        a.style.marginLeft = '10px';
        return a;
    };

    const directBtn = createButton('View on GGDeals', ggDealsDirectUrl);
    const searchBtn = createButton('Search on GGDeals', ggDealsSearchUrl);

    // Insertar los botones en la sección "Availability"
    const header = document.getElementById('Availability');
    if (header) {
        header.appendChild(directBtn);
        header.appendChild(searchBtn);
    }
})();