// ==UserScript==
// @name         GOG to GOGDB Button
// @namespace    https://gog.com/
// @version      1.0
// @description  Agrega un botón hacia GOGDB con el estilo del botón "Add to cart" en las páginas de juegos de GOG.com.
// @author       Gerardo93
// @match        https://www.gog.com/en/game/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/gog2gogdb.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/gog2gogdb.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const gameSlug = document.querySelector('div.layout[card-product]')?.getAttribute('card-product');
    const container = document.querySelector('.product-actions-body');

    if (gameSlug && container) {
        const button = document.createElement('button');
        button.className = 'button button--big cart-button';
        button.setAttribute('selenium-id', 'GOGDBButton');
        button.style.marginTop = '16px';

        // Crear la estructura interna del botón
        const wrapper = document.createElement('span');
        wrapper.className = 'cart-button__wrapper';

        const label = document.createElement('span');
        label.className = 'cart-button__state-default';
        label.textContent = 'View on GOGDB';

        wrapper.appendChild(label);
        button.appendChild(wrapper);

        button.onclick = () => window.open(`https://gogdb.org/product/${gameSlug}`, '_blank');

        container.appendChild(button);
    }
})();
