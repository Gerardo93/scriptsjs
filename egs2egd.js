// ==UserScript==
// @name         Epic Games Store to EGData Button
// @namespace    https://www.epicgames.com/store/
// @version      1.0
// @description  Agrega un botón hacia EGData debajo del botón de compra en las páginas de productos de Epic Games Store.
// @author       Gerardo93
// @match        https://store.epicgames.com/*/p/*
// @match        https://store.epicgames.com/*/bundles/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/egs2egd.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/egs2egd.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Buscar el ID del producto en las queries internas de React
    const findSlug = () => {
        return window.__REACT_QUERY_INITIAL_QUERIES__?.queries?.find(q =>
            q.queryHash?.includes('getCatalogOffer') &&
            q.state?.data?.Catalog?.catalogOffer?.id
        )?.state.data.Catalog.catalogOffer.id || null;
    };

    // Insertar botón con enlace a EGData
    const addEGDataButton = (slug) => {
        const egDataLink = `https://egdata.app/offers/${slug}`;
        const purchaseButton = document.querySelector('[data-testid="purchase-cta-button"]');
        const targetContainer = document.querySelector('.css-bco1gb') || document.querySelector('.css-19tn1zf');

        if (!targetContainer) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = purchaseButton?.className || '';
        button.textContent = 'View on EGData';
        button.style.marginTop = '16px';

        button.onclick = () => window.open(egDataLink, '_blank');
        targetContainer.appendChild(button);
    };

    // Esperar a que React cargue las queries y los contenedores del botón
    const waitForData = setInterval(() => {
        if (!window.__REACT_QUERY_INITIAL_QUERIES__) return;

        const slug = findSlug();
        const hasTargetContainer = document.querySelector('.css-bco1gb') || document.querySelector('.css-19tn1zf');

        if (slug && hasTargetContainer) {
            addEGDataButton(slug);
            clearInterval(waitForData);
        }
    }, 500);
})();
