// ==UserScript==
// @name         Microsoft Store EN-US to ES-MX Redirect
// @namespace    https://apps.microsoft.com/
// @version      1.2
// @description  Redirige automáticamente Microsoft Store de en-US a es-MX.
// @author       Gerardo93
// @match        https://apps.microsoft.com/detail/*
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/mssredirect.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/mssredirect.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // =============================================
    // CONSTANTES
    // =============================================

    // Idioma de origen que dispara la redirección
    const SOURCE_LANG = 'en-us';
    // Parámetros de destino para México (español)
    const TARGET_HL = 'es-MX';
    const TARGET_GL = 'MX';

    // =============================================
    // FUNCIONES
    // =============================================

    /**
     * Comprueba si la URL actual tiene el parámetro 'hl' en inglés (en-US)
     * y, de ser así, redirige a la versión es-MX reemplazando
     * los parámetros 'hl' y 'gl' en la query string.
     * Usa location.replace() para no dejar entrada en el historial.
     */
    function redirectIfNeeded() {
        const url = new URL(window.location.href);
        const hl = (url.searchParams.get('hl') || '').toLowerCase();

        if (hl === SOURCE_LANG) {
            url.searchParams.set('hl', TARGET_HL);
            url.searchParams.set('gl', TARGET_GL);
            window.location.replace(url.toString());
        }
    }

    // =============================================
    // INICIALIZACIÓN
    // =============================================
    try {
        redirectIfNeeded();
    } catch (e) {
        console.error('(mssredirect): Error al redirigir Microsoft Store:', e);
    }
})();
