// ==UserScript==
// @name         GGDeals to PCGamingWiki link
// @namespace    https://www.pcgamingwiki.com/
// @version      1.4
// @description  Adds a link to PCGamingWiki in GG.deals game, pack, or DLC pages.
// @author       Gerardo93
// @match        https://gg.deals/game/*
// @match        https://gg.deals/pack/*
// @match        https://gg.deals/dlc/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/ggdeals2pcgw.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/ggdeals2pcgw.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =============================================
    // CONSTANTES
    // =============================================

    // Fragmentos de texto que GGDeals añade al título de la página
    // y que deben eliminarse para obtener el nombre limpio del juego.
    const TITLE_REPLACE_TARGETS = [
        'Buy Cheap ',
        'Buy cheap ',
        ' Steam Key 🏷️ Best Price',
        ' CD Key 🏷️ Best Price',
        ' | GG.deals',
        ' Xbox & PC key - lowest price'
    ];

    // Caracteres especiales a eliminar del título limpio
    const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g;

    const PCGW_SEARCH_URL = 'https://pcgamingwiki.com/w/index.php?search=';
    const ACTIONS_CONTAINER_SELECTOR = '.game-info-actions';

    // Selectores para la detección de plataforma PC en tres niveles
    const BREADCRUMB_SELECTOR = '.breadcrumbs-list [itemprop="name"]';
    const ACTIVE_BADGE_SELECTOR = '.badge-wrapper.menu-item.active';
    const OS_CONTENT_SELECTOR = '.os-content .menu-item.active .font-exo';

    // =============================================
    // FUNCIONES
    // =============================================

    /**
     * Limpia el título de la página eliminando los fragmentos publicitarios
     * y caracteres especiales para obtener el nombre real del juego.
     * @returns {string} El nombre limpio del juego.
     */
    function cleanTitle() {
        const rawTitle = document.title;
        const cleaned = TITLE_REPLACE_TARGETS.reduce((name, target) => {
            return name.replace(target, '');
        }, rawTitle).replace(SPECIAL_CHARS_REGEX, '');

        console.log('Título original:', rawTitle);
        console.log('Título limpio:', cleaned);
        return cleaned;
    }

    /**
     * Detecta si la página actual corresponde a un juego de PC.
     * Utiliza una estrategia de 3 niveles de detección:
     * 1. Breadcrumbs: comprueba si algún span contiene exactamente "PC"
     * 2. Badge activo: comprueba si el badge activo incluye "pc"
     * 3. OS Content: comprueba si los elementos activos de OS incluyen "pc"
     * @returns {boolean} true si la plataforma es PC.
     */
    function isPCPlatform() {
        // Nivel 1: verificar breadcrumbs
        const breadcrumbs = document.querySelectorAll(BREADCRUMB_SELECTOR);
        for (const span of breadcrumbs) {
            if (span.textContent.trim() === 'PC') return true;
        }

        // Nivel 2: verificar badge activo
        const activeBadge = document.querySelector(ACTIVE_BADGE_SELECTOR);
        if (activeBadge) {
            const span = activeBadge.querySelector('span.font-exo');
            if (span && span.textContent.toLowerCase().includes('pc')) return true;
        }

        // Nivel 3: verificar OS Content
        const osSpans = document.querySelectorAll(OS_CONTENT_SELECTOR);
        for (const span of osSpans) {
            if (span.textContent.toLowerCase().includes('pc')) return true;
        }

        return false;
    }

    /**
     * Crea el enlace a PCGamingWiki usando las clases nativas de GGDeals
     * para mantener la coherencia visual con los botones existentes.
     * @param {string} gameTitle - El nombre limpio del juego.
     * @returns {HTMLAnchorElement} El enlace listo para insertar.
     */
    function createPCGWLink(gameTitle) {
        const link = document.createElement('a');
        link.className = 'action-desktop-btn d-flex flex-align-center flex-justify-center action-btn cta-label-desktop with-arrows action-ext';
        link.rel = 'nofollow noopener external';
        link.href = `${PCGW_SEARCH_URL}${encodeURIComponent(gameTitle)}`;
        link.target = '_blank';
        link.textContent = 'View on PCGamingWiki';
        return link;
    }

    /**
     * Punto de entrada: verifica que la plataforma sea PC, limpia el título
     * y crea el enlace a PCGamingWiki en la sección de acciones.
     */
    function init() {
        if (!isPCPlatform()) return;

        const gameTitle = cleanTitle();
        const link = createPCGWLink(gameTitle);

        const container = document.querySelector(ACTIONS_CONTAINER_SELECTOR);
        if (container) {
            container.appendChild(document.createElement('br'));
            container.appendChild(link);
        }
    }

    // =============================================
    // INICIALIZACIÓN
    // =============================================
    try {
        init();
    } catch (e) {
        console.error('(ggdeals2pcgw): Error al crear el enlace PCGamingWiki:', e);
    }
})();
