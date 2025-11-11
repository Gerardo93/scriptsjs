// ==UserScript==
// @name         Epic Games Store to EGData Button
// @namespace    https://www.epicgames.com/store/
// @version      1.1.1
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
    const createEGDataButton = (slug, urlType, gameTitle) => {
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

        // Crear botón con estructura similar al ejemplo: icono (img) + span de texto anidado
        const button = document.createElement('button');
        button.type = 'button';
        // Mantener clases del botón de compra para que tenga estilos similares
        button.className = purchaseButton.className || '';
        button.style.display = 'inline-flex';
        button.style.alignItems = 'center';
        button.style.gap = '8px';
        button.style.marginTop = '16px';
        button.setAttribute('data-egs2egd', 'true');
        button.setAttribute('data-egs2egd-slug', slug);
        button.onclick = () => window.open(egDataLink, '_blank');

        // Inyectar estilos CSS una vez (alinea el img como el SVG original)
        if (!document.getElementById('egs2egd-styles')) {
            const style = document.createElement('style');
            style.id = 'egs2egd-styles';
            style.textContent = `
                /* Styles for egs2egd button and icon */
                button[data-egs2egd="true"] {
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }
                button[data-egs2egd="true"] .egs2egd-icon {
                    width: 24px;
                    height: 24px;
                    object-fit: contain;
                    display: inline-block;
                    vertical-align: middle;
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }

        // Crear el img y dejar que el CSS lo dimensione y alinee como el SVG
        const img = document.createElement('img');
        img.src = 'https://cdn.egdata.app/logo_simple_white_clean.png';
        img.alt = '';
        img.className = 'egs2egd-icon';

        // Texto: span anidado similar al ejemplo
        const textOuter = document.createElement('span');
        textOuter.className = 'egs2egd-text-outer';
        const textInner = document.createElement('span');
        textInner.className = 'egs2egd-text-inner';
        textInner.textContent = 'EGData';
        textOuter.appendChild(textInner);

        // Añadir img como primer hijo del botón y luego el texto
        button.appendChild(img);
        button.appendChild(textOuter);

        targetContainer.appendChild(button);

        console.log(`(egs2egd): ✅ ${gameTitle} [${urlType}] — button added successfully ➡️ ${egDataLink}`);

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

        console.log(`(egs2egd): 🔎 ${gameTitle} [${urlType}] — preparing to add the button ➡️`);

        waitIntervalId = setInterval(() => {
            if (!window.__REACT_QUERY_INITIAL_QUERIES__) return;

            const slug = findSlug();
            if (!slug) return;

            const purchaseButton = document.querySelector('[data-testid="purchase-cta-button"]');
            if (!purchaseButton) return;

            const btn = createEGDataButton(slug, urlType, gameTitle);
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
