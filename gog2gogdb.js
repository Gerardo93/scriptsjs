// ==UserScript==
// @name         GOG to GOGDB Button
// @namespace    https://gog.com/
// @version      1.1.8
// @description  Agrega un botón hacia GOGDB con el estilo del botón "Add to cart" en las páginas de juegos de GOG.com.
// @author       Gerardo93
// @match        https://www.gog.com/en/game/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/gog2gogdb.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/gog2gogdb.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =============================================
    // CONSTANTES
    // =============================================
    const GOGDB_BASE_URL = 'https://gogdb.org/product/';
    const GOGDB_ICON_URL = 'https://www.gogdb.org/static/img/gogdb_8f221704.svg';
    const PRODUCT_SELECTOR = 'div.layout[card-product]';
    const CONTAINER_SELECTOR = '.product-actions-body';
    const ICON_SIZE = '35px';

    // =============================================
    // FUNCIONES
    // =============================================

    /**
     * Obtiene el slug del producto desde el atributo 'card-product' del layout principal.
     * @returns {string|null} El slug del juego o null si no se encuentra.
     */
    function getGameSlug() {
        return document.querySelector(PRODUCT_SELECTOR)?.getAttribute('card-product') || null;
    }

    /**
     * Crea el botón de GOGDB con icono y texto, usando las clases nativas de GOG
     * para mantener la coherencia visual con el botón "Add to cart".
     * @param {string} slug - El identificador del juego en GOG.
     * @returns {HTMLButtonElement} El botón listo para insertar en el DOM.
     */
    function createGOGDBButton(slug) {
        const button = document.createElement('button');
        button.className = 'button button--big go-to-library-button';
        button.setAttribute('selenium-id', 'GOGDBButton');
        button.style.marginTop = '16px';

        // Contenedor interno del botón (wrapper + icono + texto)
        const wrapper = document.createElement('span');
        wrapper.className = 'cart-button__wrapper';

        // Icono de GOGDB posicionado a la izquierda del texto
        const icon = document.createElement('img');
        icon.src = GOGDB_ICON_URL;
        icon.alt = 'GOGDB';
        icon.style.width = ICON_SIZE;
        icon.style.height = ICON_SIZE;
        icon.style.position = 'absolute';
        icon.style.left = `-${ICON_SIZE}`;
        icon.style.top = '50%';
        icon.style.transform = 'translateY(-50%)';

        // Texto del botón
        const label = document.createElement('span');
        label.className = 'cart-button__state-default';
        label.textContent = 'GOG Database';

        wrapper.appendChild(icon);
        wrapper.appendChild(label);
        button.appendChild(wrapper);

        button.onclick = () => window.open(`${GOGDB_BASE_URL}${slug}`, '_blank');

        return button;
    }

    /**
     * Punto de entrada: busca el slug del juego y el contenedor de acciones,
     * y si ambos existen, inserta el botón de GOGDB.
     */
    function init() {
        const slug = getGameSlug();
        const container = document.querySelector(CONTAINER_SELECTOR);

        if (slug && container) {
            const button = createGOGDBButton(slug);
            container.appendChild(button);
        }
    }

    // =============================================
    // INICIALIZACIÓN
    // =============================================
    try {
        init();
    } catch (e) {
        console.error('(gog2gogdb): Error al crear el botón GOGDB:', e);
    }
})();
