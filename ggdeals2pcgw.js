// ==UserScript==
// @name         GGDeals to PCGamingWiki link
// @namespace    https://www.pcgamingwiki.com/
// @version      1.3
// @description  Adds a link to PCGamingWiki in GG.deals game, pack, or DLC pages.
// @author       Gerardo93
// @match        https://gg.deals/game/*
// @match        https://gg.deals/pack/*
// @match        https://gg.deals/dlc/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/ggdeals2pcgw.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/ggdeals2pcgw.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Obtener y limpiar el nombre del juego desde el <title>
    const rawTitle = document.title;

    const replaceTargets = [
        'Buy Cheap ',
        'Buy cheap ',
        ' Steam Key 🏷️ Best Price',
        ' CD Key 🏷️ Best Price',
        ' | GG.deals',
        ' Xbox & PC key - lowest price'
    ];

    const cleanedTitle = replaceTargets.reduce((name, target) => {
        return name.replace(target, '');
    }, rawTitle).replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');

    console.log('Título original:', rawTitle);
    console.log('Título limpio:', cleanedTitle);

    // Verificar si "PC" está en los breadcrumbs
    let isPCPlatform = false;
    const breadcrumbSpans = document.querySelectorAll('.breadcrumbs-list [itemprop="name"]');
    breadcrumbSpans.forEach(span => {
        if (span.textContent.trim() === 'PC') {
            isPCPlatform = true;
        }
    });

    // Verificar si el badge ACTIVO contiene "PC"
    if(!isPCPlatform) {
        const activeBadge = document.querySelector('.badge-wrapper.menu-item.active');
        if (activeBadge) {
            const span = activeBadge.querySelector('span.font-exo');
            if (span && span.textContent.toLowerCase().includes('pc')) {
                isPCPlatform = true;
            }
        }
    }

    //Verificar si el badge de Os Content contiene "PC"
    if(!isPCPlatform) {
        const osContentSpans = document.querySelectorAll('.os-content .menu-item.active .font-exo');
        osContentSpans.forEach(span => {
            if (span.textContent.toLowerCase().includes('pc')) {
                isPCPlatform = true;
            }
        });
    }

    // Crear enlace a PCGamingWiki si es PC
    if(isPCPlatform) {
        const pcgwLink = document.createElement('a');
        pcgwLink.className = 'action-desktop-btn d-flex flex-align-center flex-justify-center action-btn cta-label-desktop with-arrows action-ext';
        pcgwLink.rel = 'nofollow noopener external';
        pcgwLink.href = `https://pcgamingwiki.com/w/index.php?search=${encodeURIComponent(cleanedTitle)}`;
        pcgwLink.target = '_blank';
        pcgwLink.textContent = 'View on PCGamingWiki';

        // Insertar enlace en la página
        const header = document.querySelector('.game-info-actions');
        if (header) {
            header.appendChild(document.createElement('br'));
            header.appendChild(pcgwLink);
        }
    }

})();