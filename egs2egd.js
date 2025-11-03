// ==UserScript==
// @name         Epic Games Store to EGData Button
// @namespace    https://www.epicgames.com/store/
// @version      1.1
// @description  Agrega un botón hacia EGData debajo del botón de compra en las páginas de productos de Epic Games Store. Recarga la página cuando la ruta cambia a product o bundle.
// @author       Gerardo93
// @match        https://store.epicgames.com/*/p/*
// @match        https://store.epicgames.com/*/bundles/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/egs2egd.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/egs2egd.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Estado global mínimo
    let waitIntervalId = null;
    let actualPath = "";

    // Encuentra el slug en las queries internas de React
    const findSlug = () => {
        try {
            const queries = window.__REACT_QUERY_INITIAL_QUERIES__?.queries || [];
            for (const q of queries) {
                if ((q.queryHash && q.queryHash.includes('getCatalogOffer')) || (q.queryKey && JSON.stringify(q.queryKey).includes('getCatalogOffer'))) {
                    const id = q.state?.data?.Catalog?.catalogOffer?.id;
                    if (id) return id;
                }
            }
        } catch (e) {
            // silent
        }
        return null;
    };

    // Crea o devuelve el botón EGData (no duplica gracias a la comprobación interna)
    const createEGDataButton = (slug, urlType, gameTitle, isSpanish) => {
        const egDataLink = `https://egdata.app/offers/${slug}`;
        const purchaseButton = document.querySelector('[data-testid="purchase-cta-button"]');
        if (!purchaseButton) return null;

        let targetContainer = null;
        if (urlType === "product") {
            targetContainer = purchaseButton.parentElement;
        } else if (urlType === "bundle") {
            targetContainer = purchaseButton.parentElement?.parentElement;
        }
        if (!targetContainer) return null;

        // Evitar duplicados
        const existing = targetContainer.querySelector('[data-egs2egd="true"]');
        if (existing) return existing;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = purchaseButton.className || '';
        button.textContent = isSpanish ? 'Ver en EGData' : 'View on EGData';
        button.style.marginTop = '16px';
        button.setAttribute('data-egs2egd', 'true');
        button.setAttribute('data-egs2egd-slug', slug);
        button.onclick = () => window.open(egDataLink, '_blank');
        targetContainer.appendChild(button);

        console.log(
            isSpanish
                ? `(egs2egd): ✅ ${gameTitle} [${urlType}] — botón añadido con éxito ➡️ ${egDataLink}`
                : `(egs2egd): ✅ ${gameTitle} [${urlType}] — button added successfully ➡️ ${egDataLink}`
        );

        return button;
    };

    // Inicia/gestiona el intervalo que espera a que React cargue los datos
    const startWaitForData = () => {
        if (waitIntervalId) {
            clearInterval(waitIntervalId);
            waitIntervalId = null;
        }

        const url = window.location.href;
        const urlType =
            /^https:\/\/store\.epicgames\.com\/[^\/]+\/p\/.+/.test(url) ? "product" :
                /^https:\/\/store\.epicgames\.com\/[^\/]+\/bundles\/.+/.test(url) ? "bundle" :
                    null;

        if (!urlType) return;

        const rawTitle = document.title || '';
        const gameTitle = rawTitle.replace(/\s*-\s*Epic Games Store.*$/i, '').trim().split('|')[0].trim();
        const lang = (document.documentElement.lang || navigator.language || navigator.userLanguage || '').toLowerCase();
        const isSpanish = lang.startsWith('es');

        console.log(
            isSpanish
                ? `(egs2egd): 🔎 ${gameTitle} [${urlType}] — preparándose para añadir el botón ➡️`
                : `(egs2egd): 🔎 ${gameTitle} [${urlType}] — preparing to add the button ➡️`
        );

        waitIntervalId = setInterval(() => {
            if (!window.__REACT_QUERY_INITIAL_QUERIES__) return;

            const slug = findSlug();
            if (!slug) return;

            const purchaseButton = document.querySelector('[data-testid="purchase-cta-button"]');
            if (!purchaseButton) return;

            const btn = createEGDataButton(slug, urlType, gameTitle, isSpanish);
            if (btn) {
                clearInterval(waitIntervalId);
                waitIntervalId = null;
            }
        }, 400);
    };

    // Detecta cambios de URL en SPA y ejecuta callback
    function onUrlChange(callback) {
        const pushState = history.pushState;
        const replaceState = history.replaceState;

        history.pushState = function () {
            pushState.apply(this, arguments);
            callback();
        };
        history.replaceState = function () {
            replaceState.apply(this, arguments);
            callback();
        };

        window.addEventListener("popstate", callback);
    }

    // Maneja navegación: si cambia path, si es product o bundle recarga la página, si no reinicia la búsqueda
    onUrlChange(() => {
        const newPath = location.pathname;
        if (newPath !== actualPath) {
            actualPath = newPath;

            if (waitIntervalId) {
                clearInterval(waitIntervalId);
                waitIntervalId = null;
            }

            // Si la nueva ruta es un producto o un bundle, forzar reload (según petición)
            const isProductOrBundle =
                /^\/[^\/]+\/p\/.+/.test(newPath) || /^\/[^\/]+\/bundles\/.+/.test(newPath);

            if (isProductOrBundle) {
                window.location.reload();
                return;
            }

            // Si no se recarga, volver a intentar añadir el botón tras un pequeño retraso
            setTimeout(() => startWaitForData(), 1000);
        }
    });

    // Inicio inicial
    actualPath = location.pathname;
    startWaitForData();
})();
