// ==UserScript==
// @name         PCGamingWiki to GGDeals Link Generator
// @namespace    https://www.gg.deals/
// @version      1.1
// @description  Adds GGDeals buttons on PCGamingWiki game pages for direct access and search by title.
// @author       Gerardo93
// @match        https://www.pcgamingwiki.com/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/pcgw2ggdeals.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/pcgw2ggdeals.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =============================================
    // CONSTANTES
    // =============================================
    const PCGW_TITLE_SUFFIX = / - PCGamingWiki.*/i;
    const SPECIAL_CHARS_REGEX = /[^\w\s-]/g;
    const GGDEALS_GAME_URL = 'https://gg.deals/game/';
    const GGDEALS_SEARCH_URL = 'https://gg.deals/games/?title=';
    const AVAILABILITY_HEADER_ID = 'Availability';

    // =============================================
    // FUNCIONES
    // =============================================

    /**
     * Extrae el nombre del juego desde el título de la página,
     * eliminando el sufijo " - PCGamingWiki..." y caracteres especiales.
     * Genera dos formatos: kebab-case para URL directa y palabras separadas
     * por '+' para búsqueda.
     * @returns {{ kebab: string, search: string }} URLs formateadas para GGDeals.
     */
    function extractGameTitle() {
        const rawTitle = document.title.replace(PCGW_TITLE_SUFFIX, '').trim();
        const cleanTitle = rawTitle.replace(SPECIAL_CHARS_REGEX, '').toLowerCase();
        return {
            kebab: cleanTitle.replace(/\s+/g, '-'),
            search: cleanTitle.replace(/\s+/g, '+')
        };
    }

    /**
     * Crea un enlace con estilo de botón externo para PCGamingWiki.
     * @param {string} text - Texto visible del botón.
     * @param {string} url - URL de destino.
     * @returns {HTMLAnchorElement} El enlace/botón creado.
     */
    function createLinkButton(text, url) {
        const a = document.createElement('a');
        a.className = 'external text';
        a.textContent = text;
        a.href = url;
        a.target = '_blank';
        a.style.marginLeft = '10px';
        return a;
    }

    /**
     * Punto de entrada: genera los botones de GGDeals (directo + búsqueda)
     * y los inserta junto al encabezado "Availability" de la wiki.
     */
    function init() {
        const { kebab, search } = extractGameTitle();

        const directBtn = createLinkButton('View on GGDeals', `${GGDEALS_GAME_URL}${kebab}`);
        const searchBtn = createLinkButton('Search on GGDeals', `${GGDEALS_SEARCH_URL}${search}`);

        const header = document.getElementById(AVAILABILITY_HEADER_ID);
        if (header) {
            header.appendChild(directBtn);
            header.appendChild(searchBtn);
        }
    }

    // =============================================
    // INICIALIZACIÓN
    // =============================================
    try {
        init();
    } catch (e) {
        console.error('(pcgw2ggdeals): Error al crear los botones GGDeals:', e);
    }
})();
