// ==UserScript==
// @name         Twitch Drops Highlighter + Links + Editable Keywords (Full + i18n)
// @namespace    http://tampermonkey.net/
// @version      1.3.9.12.2
// @description  Clasifica drops activos y caducados con keywords persistentes y editables. Muestra mensajes localizados e interfaz multiidioma.
// @match        https://www.twitch.tv/drops/*
// @author       Gerardo93
// @downloadURL  https://github.com/Gerardo93/scriptsjs/raw/main/twdhlekfl.js
// @updateURL    https://github.com/Gerardo93/scriptsjs/raw/main/twdhlekfl.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
    "use strict";
    // Este IIFE se ejecuta cuando carga la página y gestiona:
    // - Keywords persistentes (GM_getValue/GM_setValue)
    // - UI para editar/resetear/recargar
    // - Búsqueda, resaltado y enlaces a drops activos/caducados
    // - Limpieza de inventario (ocultar items expirados/activos)
    console.log("Apple sucks!");

    window.addEventListener("load", () => {
        // --- localización ---
        const userLang = document.documentElement.getAttribute("lang") || "en";
        const lang = userLang.split("-")[0];
        const i18n = {
            es: {
                collapse: "🔼 Colapsar",
                expand: "🔽 Expandir",
                addKeyword: "➕ Añadir Keyword",
                deleteKeywordTooltip: "Haga click para eliminar keyword",
                deleteKeywordQuestion: "¿Eliminar la keyword ",
                editKeywords: "✏️ Editar Keywords",
                resetKeywords: "🔄 Restaurar Predeterminadas",
                confirmReset: "¿Restaurar las keywords por defecto?",
                keywordsRestored: "🔁 Keywords restauradas. Recargando...",
                keywordsUpdated: "✅ Keywords actualizadas. Recargando...",
                keywordsModified: "⚠️ Las keywords han sido modificadas, estas son las actuales: ",
                reloading: "🔄 Recargando...",
                currentKeywords: "🔍 Keywords actuales (haga clic en una para eliminar):",
                noResults: "❌ No se encontraron drops relacionados con tus keywords.",
                dropsActive: "⏳🟢 Drops Abiertos",
                dropsExpired: "⌛🔴 Drops Cerrados",
                dropsNone: "❌ 0 Drops encontrados",
                editPrompt: "📝 Palabras clave separadas por coma:",
                waitMessage:
                    "Si no ves resultados, edita las keywords o espera a que cargue Twitch Drops. Si estas en el inventario, dirígete a campañas.",
                changeMessage: "🔄 Cambia a campañas para ver los drops abiertos.",
                searching: "🔍 Buscando",
                reload: "🔃 Recargar drops",
                hideExpired: "⏳🔴 Ocultar cerrados/completados del inventario, reclamación de drops automática",
                hideActive: "⏳🟢 Ocultar abiertos del inventario",
                removeInventory: "❌ Haz clic para eliminar del inventario, para volver a mostrar pulsa el boton de recargar drops",
                changes_detected: "🔔 Cambios detectados",
                viewed: "👁️ Mostrar",
                accept: "Aceptar",
                cancel: "Cancelar",
                yes: "Sí",
                no: "No",
                // icon/text symbols centralizados
                addButton: "+",
                viewIcon: "👁️",
                changedIcon: "🔔",
                removeIcon: "❌",
                iconLink: "🔗",
                iconCross: "❌",
            },
            en: {
                collapse: "🔼 Collapse",
                expand: "🔽 Expand",
                addKeyword: "➕ Add Keyword",
                deleteKeywordTooltip: "Click to delete keyword",
                deleteKeywordQuestion: "Delete keyword ",
                editKeywords: "✏️ Edit Keywords",
                resetKeywords: "🔄 Reset to Default",
                confirmReset: "Reset keywords to default?",
                keywordsRestored: "🔁 Keywords restored. Reloading...",
                keywordsUpdated: "✅ Keywords updated. Reloading...",
                keywordsModified: "⚠️ Keywords modified. These are the current keywords: ",
                reloading: "🔄 Reloading...",
                currentKeywords: "🔍 Current keywords (click on one to delete):",
                noResults: "❌ No drops matched your keywords.",
                dropsActive: "⏳🟢 Active Drops",
                dropsExpired: "⌛🔴 Expired Drops",
                dropsNone: "❌ 0 Drops found",
                editPrompt: "📝 Comma-separated keywords:",
                waitMessage:
                    "If no results show up, edit the keywords or wait for Twitch Drops to load. If you are in the inventory, go to campaigns.",
                changeMessage: "🔄 Switch to campaigns to see active drops.",
                searching: "🔍 Searching",
                reload: "🔃 Reload drops",
                hideExpired: "⏳🔴 Hide expired/completed from inventory, automatic drops claiming",
                hideActive: "⏳🟢 Hide active from inventory",
                removeInventory: "❌ Click to remove from inventory, to show again press the reload drops button",
                changes_detected: "🔔 Changes detected",
                viewed: "👁️ Shown",
                accept: "Accept",
                cancel: "Cancel",
                yes: "Yes",
                no: "No",
                // icon/text symbols centralized
                addButton: "+",
                viewIcon: "👁️",
                changedIcon: "🔔",
                removeIcon: "❌",
                iconLink: "🔗",
                iconCross: "❌",
            },
        };
        const t = i18n[lang] || i18n["en"];

        // --- configuración y almacenamiento ---
        const DEFAULT_KEYWORDS = [
            "halo",
            "doom",
            "quake",
            "wolfenstein",
            "rage",
            "fortnite",
            "rocket league",
            "among us",
            "minecraft",
            "roblox",
            "star wars",
            "marvel",
        ];
        const STORAGE_KEY = "twitch_drop_keywords";
        const SHOW_HIDE_INVENTORY_EXPIRED = "twitch_show_hide_inventory_expired";
        const SHOW_HIDE_INVENTORY_ACTIVE = "twitch_show_hide_inventory_active";
        const COLLAPSE_KEY = "twitch_drops_collapse_preview";
        const INVENTORY_DELETED_KEYS = "twitch_inventory_deleted_drops";
        // almacen de notificaciones (drops nuevos / cambiados)
        const STORAGE_NOTIFS = "twitch_drop_notifications";
        // título original del documento (para restaurar) y control de sonido
        const ORIGINAL_TITLE = document.title || (document.querySelector('title') ? document.querySelector('title').textContent : '');
        let _notificationSoundInterval = null;
        const NOTIFICATION_BEEP_INTERVAL_MS = 5000; // cada cuánto sonar si hay pendientes
        const NOTIFICATION_VOLUME = 0.09; // volumen por defecto (0.0 - 1.0)

        function getStoredKeywords() {
            // Devuelve arreglo de keywords (si no hay, devuelve DEFAULT_KEYWORDS)
            const stored = GM_getValue(STORAGE_KEY, null);
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.warn("❌ Error leyendo keywords:", e);
                }
            }
            return [...DEFAULT_KEYWORDS];
        }
        function setStoredKeywords(keywords) {
            GM_setValue(STORAGE_KEY, JSON.stringify(keywords));
        }
        function getInventoryDeletedKeys() {
            return GM_getValue(INVENTORY_DELETED_KEYS, []);
        }
        function setInventoryDeletedKeys(keys) {
            GM_setValue(INVENTORY_DELETED_KEYS, keys);
        }
        function resetKeywords() {
            GM_deleteValue(STORAGE_KEY);
        }
        function resetInventoryDeletedKeys() {
            GM_deleteValue(INVENTORY_DELETED_KEYS);
        }
        function getNotifications() {
            const stored = GM_getValue(STORAGE_NOTIFS, null);
            if (!stored) return []; 
            try {
                const arr = JSON.parse(stored);
                // migrate: ensure each notification has a unique key = title|id
                let migrated = false;
                for (const n of arr) {
                    if (!n.key) {
                        n.key = (n.title || '') + '|' + (n.id || '');
                        migrated = true;
                    }
                }
                if (migrated) {
                    try { GM_setValue(STORAGE_NOTIFS, JSON.stringify(arr)); } catch (e) { /* noop */ }
                }
                return arr;
            } catch (e) {
                console.warn("Error leyendo notificaciones:", e);
                return [];
            }
        }
        function saveNotifications(arr) {
            try {
                // ensure keys exist before saving
                for (const n of arr) {
                    if (!n.key) n.key = (n.title || '') + '|' + (n.id || '');
                }
                GM_setValue(STORAGE_NOTIFS, JSON.stringify(arr));
            } catch (e) {
                console.warn("Error guardando notificaciones:", e);
            }
        }
        function resetNotifications() {
            GM_deleteValue(STORAGE_NOTIFS);
        }
        // --- control de versión del script (guardar en GM) ---
        const SCRIPT_VERSION_KEY = "twitch_script_version";
        const SCRIPT_VERSION = "1.3.9.12.2"; // debe coincidir con @version en el header

        // Si la versión almacenada es distinta o nula, resetea todas las notificaciones
        function checkAndHandleScriptVersion() {
            try {
                const stored = GM_getValue(SCRIPT_VERSION_KEY, null);
                if (stored === null || stored !== SCRIPT_VERSION) {
                    // limpiar notificaciones al cambiar la versión
                    resetNotifications();
                    // actualizar la versión almacenada
                    try {
                        GM_setValue(SCRIPT_VERSION_KEY, SCRIPT_VERSION);
                    } catch (e) {
                        console.warn('No se pudo guardar la versión del script:', e);
                    }
                }
            } catch (e) {
                console.warn('Error comprobando versión del script:', e);
            }
        }

        // reproducir un beep corto usando WebAudio (no requiere archivos externos)
        function playBeep(duration = 150, frequency = 800, volume = NOTIFICATION_VOLUME) {
            try {
                const audio = new Audio('data:audio/wav;base64,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3RPrMZfk5nDh/zhdOlw/LAMEyzlgNW9E4o3MC6ilutSmtbmBVZSv/////jkf/PFs///5eJQv5eIcHuzp4AkAstsCAJiDYsrTeCDIw3MGDGqhwBpqwTOQwCWChjUMGOWMgzVjIP8I//uSZEyM03xVyotZokBZaplyaoeECsFTNEy0VMGmKiQBrbT4AgOhzvgZeCGFfOK6o54sWUKRqNcsU9Tsypp80gNzqq6//lv///////////KeUCQsgeCSUsHAwcLNoHkJb4ipZEAYEAeM/iz5mHQ5R/g5dbAAFgSnYS0C5n92liCJwOR2Wp26N/9aOiG47tWPbo6Lu1KtojazFV//////qf/83//44+DBAQ7lEo8vsaacJ1zMmTQlDNJjF006MoODayuYQbJkExMTPHVCsRUZKxw84AKwDxGaFbW2Vd3/5gICbssmbganDkwZBvjrHQRgdY6SKRBhfIxGIw6YjcdPy2VoqT7vt//////////////AVhHqDCgFDDnmDHAVUm6VigBYbAGwgh1TkREwOncIA2qmGFB42s5cGBwwyn4RxyUDxmt1orsrdupFV3UGq0uoWb7nyf75VmabV0/////1Cf/V///wHwMd/h0CYACIJxCIjI0QUZMMMK8QmnNibEJ1q4gAneANWVIIwwNUtKf1AgVrf///xDsh6ZpeUl65epbkUv/7kmRHDPKeVEwLMBRUUeqJUGgN5gx1UyoNZgkBSZElAammSOfdp/u3Pp6ahpKb7v0tJ////////jMFk/whRH2MmY1ApsIERYBmbJmYFnAaiWAmaFgBYJ0g1ILjhqCnZ9LKeU+OglZVLcx/FyAjQ6MdpePz53njv584XD506gsNQoIWFJP6P/7dlJVs/Zf///+p9yi3/olv//+f4s0hh2NFgqAi5p0wRULAIFTwQzBJM4YI3ag7joyyorBjKALsxYAgqFw53VCn/gwa3fBnE0A73BFA4dLpz0g+m5yFznfov3u6FP96T/+m6bBzfJHlpqANwAAAB4AhtRY6Wx2hCxdwgBMQBMcx7C+oOrS8U5ZyAoHKLIrSACMHeomha/n8fgF8CfC+Xjp+fqN636KVBnrOFATabqWo4OStqU1bo6LT+1KN///////xv//8YN40AXjIQwsQZKodKmacAQU2DhDiLCShy1YKJeKiTZmmTv4Ogx8oyVqkGIRcniVA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xF0yw9M0pdNMPatKXTTNWsSl0sTVrEpVq0oeAKFTYdQeADHjgqIlKiUtKoNWqSmSkhyWlQrKiqCAUHiMkNu3Lv//Yyu6nDYyVSSuH8VlSxZeE6iiKjRYupOlSIQjQ0XUXpMsVGhougbduXVX////6oi2MIiQRCgoJiAOGlMdqAUAWhLhXyWHGoFOfBsmyiFeYfSpYZOlEbA6tZPzVgoIE6H7BQQJwy7oBkKiweiwuI3fWKNxYV/ircWF2frFOLCusUbiotiwuz+KcWFVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSRPyOw0JVP4NgbzKcSqgxbYioSOlKyCSAvoEzC9tE9I1QVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVRBR3d3dy52b2ljeS5uZXR3b3JrAAAAAAAAAAAAAAAAAHd3dy52b2ljeS5uZXR3b3JrAAAAAAAAAAAAAAAAAHd3dy52b2ljeS5uZXR3b3JrAAAAAAAAAAAAAAAAADIwMjIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/');
                try { audio.volume = volume; } catch (e) { console.warn('Could not set volume:', e); }
                audio.play().catch(() => { });
            } catch (ee) { /* noop */ }
        }

        function startNotificationSound() {
            if (_notificationSoundInterval) return;
            // sonar inmediatamente y luego cada intervalo
            playBeep();
            _notificationSoundInterval = setInterval(() => playBeep(), NOTIFICATION_BEEP_INTERVAL_MS);
        }

        function stopNotificationSound() {
            if (_notificationSoundInterval) {
                clearInterval(_notificationSoundInterval);
                _notificationSoundInterval = null;
            }
        }

        function updateNotificationTitleAndSound() {
            try {
                const notifs = getNotifications();
                const pending = notifs.filter(n => !n.seen && n.changed).length;
                if (pending > 0) {
                    startNotificationSound();
                    setTimeout(() => {
                        document.title = `(${pending}) ${ORIGINAL_TITLE}`;
                        const header = document.getElementById('drops-notification-header');
                        if (header) header.textContent = `(${pending}) ${t.changes_detected}`;
                    }, 100);
                } else {
                    // restaurar título y detener sonido
                    stopNotificationSound();
                    setTimeout(() => {
                        if (document.title.startsWith('(')) document.title = ORIGINAL_TITLE;
                    }, 1000);
                }
            } catch (e) {
                console.warn('Error actualizando título/sonido:', e);
            }
        }

        function markNotificationSeen(identifier) {
            // identifier can be a key (title|id) or a plain title
            const notifs = getNotifications();
            let changed = false;
            if (typeof identifier === 'string' && identifier.includes('|')) {
                // treat as key (strictly mark only the matching title-id)
                for (const n of notifs) {
                    if (n.key === identifier && !n.seen) {
                        n.seen = true;
                        n.updatedAt = Date.now();
                        changed = true;
                    }
                }
            } else {
                // fallback: identifier is a plain title. Only mark if there is exactly one notification with that title.
                const title = identifier;
                const matches = notifs.filter(n => n.title === title);
                if (matches.length === 1) {
                    const n = matches[0];
                    if (!n.seen) {
                        n.seen = true;
                        n.updatedAt = Date.now();
                        changed = true;
                    }
                } else if (matches.length > 1) {
                    console.warn("Hay varias notificaciones con el mismo título; usa la key 'title|id' para marcar una concreta:", title);
                }
            }
            if (changed) saveNotifications(notifs);
            // actualizar el título y detener sonido si no quedan pendientes
            updateNotificationTitleAndSound();
        }

        function deleteNotificationsByKeyword(keyword) {
            const notifs = getNotifications();
            const filtered = [];
            for (const n of notifs) {
                if (!n.title.toLowerCase().includes(keyword)) {
                    filtered.push(n);
                }
            }
            saveNotifications(filtered);
            // actualizar el título y detener sonido si no quedan pendientes
            updateNotificationTitleAndSound();
        }

        function removeNotificationsNotInKeywords(keywords) {
            const notifs = getNotifications();
            const filtered = [];
            for (const n of notifs) {
                let found = false;
                for (const kw of keywords) {
                    if (n.title.toLowerCase().includes(kw)) {
                        found = true;
                        break;
                    }
                }
                if (found) {
                    filtered.push(n);
                }
            }
            saveNotifications(filtered);
            // actualizar el título y detener sonido si no quedan pendientes
            updateNotificationTitleAndSound();
        }

        function setInventoryExpiredFlag(value) {
            GM_setValue(SHOW_HIDE_INVENTORY_EXPIRED, value);
        }
        function setInventoryActiveFlag(value) {
            GM_setValue(SHOW_HIDE_INVENTORY_ACTIVE, value);
        }

        function getCollapseFlag() {
            const stored = GM_getValue(COLLAPSE_KEY, false);
            if (stored === undefined) return false;
            return stored;
        }

        function setCollapseFlag(value) {
            GM_setValue(COLLAPSE_KEY, value);
        }

        // Inicializar flags si no existen
        if (GM_getValue(SHOW_HIDE_INVENTORY_EXPIRED) === undefined) setInventoryExpiredFlag(false);
        if (GM_getValue(SHOW_HIDE_INVENTORY_ACTIVE) === undefined) setInventoryActiveFlag(false);
        if (GM_getValue(COLLAPSE_KEY) === undefined) setCollapseFlag(false);

        // Estado local
        let keywords = getStoredKeywords();
        let deletedInventoryDrops = getInventoryDeletedKeys();
        let cleanExpiredInventoryFlag = GM_getValue(SHOW_HIDE_INVENTORY_EXPIRED, false);
        let cleanActiveInventoryFlag = GM_getValue(SHOW_HIDE_INVENTORY_ACTIVE, false);

        // Comprobar versión del script y resetear notificaciones si ha cambiado
        try {
            if (typeof checkAndHandleScriptVersion === 'function') checkAndHandleScriptVersion();
        } catch (e) {
            console.warn('Error ejecutando checkAndHandleScriptVersion:', e);
        }

        // --- estilos y colores ---
        //const isDarkMode = document.documentElement.classList.contains("tw-root--theme-dark");
        const colors = {
            purple: "var(--color-text-brand)",
            green: "var(--color-text-success)",
            red: "var(--color-text-error)",
            gray: "var(--color-text-info)",
            orange: "var(--color-text-warn)",
            bg: "var(--color-background-body)",
            text: "var(--color-text-base)",
        };

        // --- utilidades comunes para crear botones y checkboxes (reduce repetición) ---
        function createButton(label, color, onClick, inline = false) {
            const btn = document.createElement("button");
            btn.textContent = label;
            Object.assign(btn.style, {
                padding: "6px 10px",
                backgroundColor: colors.bg,
                color: color,
                border: `1px solid ${color}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                marginTop: inline ? "10px" : "0",
            });
            btn.onclick = onClick;
            return btn;
        }

        // --- Modales reutilizables (reemplazan prompt/confirm/alert) ---
        // helper: marcar el resto del body como inert/aria-hidden mientras el modal está abierto
        function setInertOnBodyChildrenExcept(overlay, inert) {
            if (inert) {
                const saved = [];
                Array.from(document.body.children).forEach((el) => {
                    if (el === overlay) return;
                    saved.push({ el, ariaHidden: el.getAttribute('aria-hidden'), tabIndex: el.hasAttribute('tabindex') ? el.tabIndex : null });
                    try {
                        el.setAttribute('aria-hidden', 'true');
                        // best-effort inert
                        el.inert = true;
                    } catch (e) { /* noop */ }
                });
                overlay._savedInert = saved;
            } else {
                const saved = overlay._savedInert || [];
                saved.forEach((s) => {
                    try {
                        if (s.ariaHidden === null) s.el.removeAttribute('aria-hidden');
                        else s.el.setAttribute('aria-hidden', s.ariaHidden);
                    } catch (e) { /* noop */ }
                    try {
                        if (s.tabIndex === null) s.el.removeAttribute('tabindex');
                        else s.el.tabIndex = s.tabIndex;
                        s.el.inert = false;
                    } catch (e) { /* noop */ }
                });
                overlay._savedInert = null;
            }
        }

        // helper: cerrar overlay con animación y restaurar foco/inert
        function closeOverlayAnimated(overlay) {
            return new Promise((resolve) => {
                try {
                    overlay.style.opacity = '0';
                    const box = overlay.firstChild;
                    if (box) {
                        box.style.transform = 'translateY(-8px) scale(0.98)';
                        box.style.opacity = '0';
                    }
                } catch (e) { /* noop */ }
                setTimeout(() => {
                    try {
                        if (overlay.parentElement) overlay.parentElement.removeChild(overlay);
                    } catch (e) { /* noop */ }
                    try { setInertOnBodyChildrenExcept(overlay, false); } catch (e) { /* noop */ }
                    resolve();
                }, 220);
            });
        }
        function createModalContainer() {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.left = '0';
            overlay.style.top = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.4)';
            overlay.style.zIndex = '99999';
            overlay.style.transition = 'opacity 180ms ease';
            overlay.style.opacity = '0';

            const box = document.createElement('div');
            Object.assign(box.style, {
                background: colors.bg,
                color: colors.text,
                padding: '16px',
                borderRadius: '8px',
                minWidth: '320px',
                maxWidth: '90%',
                boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
                fontSize: '14px',
                transition: 'transform 180ms ease, opacity 180ms ease',
                transform: 'translateY(-8px) scale(0.98)',
                opacity: '0',
                boxSizing: 'border-box',
                borderRadius: '4px',
                border: `1px solid ${colors.purple}`,
            });

            overlay.appendChild(box);
            return { overlay, box };
        }

        function showInputModal(message, defaultValue = '') {
            return new Promise((resolve) => {
                const { overlay, box } = createModalContainer();

                const msg = document.createElement('div');
                msg.textContent = message;
                msg.style.marginBottom = '8px';
                box.appendChild(msg);

                const input = document.createElement('input');
                input.type = 'text';
                input.value = defaultValue || '';
                Object.assign(input.style, {
                    width: '100%',
                    padding: '8px',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    borderRadius: '4px',
                    border: `1px solid ${colors.purple}`,
                    background: 'transparent',
                    color: 'inherit',
                });
                box.appendChild(input);

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.justifyContent = 'center';
                actions.style.gap = '8px';

                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = t.cancel || 'Cancelar';
                Object.assign(cancelBtn.style, { 
                    padding: '6px 10px',
                    backgroundColor: colors.bg,
                    color: colors.red,
                    border: `1px solid ${colors.red}`,
                    borderRadius: '6px'
                });
                cancelBtn.onclick = () => {
                    closeOverlayAnimated(overlay).then(() => resolve(null));
                };

                const okBtn = document.createElement('button');
                okBtn.textContent = t.accept || 'Aceptar';
                Object.assign(okBtn.style, { 
                    padding: '6px 10px',
                    backgroundColor: colors.bg,
                    color: colors.green,
                    border: `1px solid ${colors.green}`,
                    borderRadius: '6px'
                });
                okBtn.onclick = () => {
                    const v = input.value;
                    closeOverlayAnimated(overlay).then(() => resolve(v));
                };

                actions.appendChild(cancelBtn);
                actions.appendChild(okBtn);
                box.appendChild(actions);

                // focus trap basics
                const focusable = [input, cancelBtn, okBtn];
                let fi = 0;
                focusable.forEach((el, idx) => el.tabIndex = idx + 1);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); okBtn.click(); }
                    if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); }
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        if (e.shiftKey) fi = (fi - 1 + focusable.length) % focusable.length;
                        else fi = (fi + 1) % focusable.length;
                        focusable[fi].focus();
                    }
                });
                // allow Tab cycling on buttons as well
                [cancelBtn, okBtn].forEach((el) => el.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        if (e.shiftKey) fi = (fi - 1 + focusable.length) % focusable.length;
                        else fi = (fi + 1) % focusable.length;
                        focusable[fi].focus();
                    }
                    if (e.key === 'Escape') { e.preventDefault(); cancelBtn.click(); }
                }));

                document.body.appendChild(overlay);
                try { setInertOnBodyChildrenExcept(overlay, true); } catch (e) { /* noop */ }
                // animate in
                setTimeout(() => {
                    overlay.style.opacity = '1';
                    try { box.style.transform = 'translateY(0) scale(1)'; box.style.opacity = '1'; } catch (e) { }
                }, 10);
                // focus after append
                setTimeout(() => input.focus(), 120);
            });
        }

        function showConfirmModal(message) {
            return new Promise((resolve) => {
                const { overlay, box } = createModalContainer();
                const msg = document.createElement('div');
                msg.textContent = message;
                msg.style.marginBottom = '12px';
                box.appendChild(msg);

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.justifyContent = 'center';
                actions.style.gap = '8px';

                const noBtn = document.createElement('button');
                Object.assign(noBtn.style, {
                    padding: '6px 10px',
                    backgroundColor: colors.bg,
                    color: colors.red,
                    border: `1px solid ${colors.red}`,
                    borderRadius: '6px'
                });
                noBtn.textContent = t.no || 'No';
                noBtn.onclick = () => {
                    closeOverlayAnimated(overlay).then(() => resolve(false));
                };

                const yesBtn = document.createElement('button');
                Object.assign(yesBtn.style, {
                    padding: '6px 10px',
                    backgroundColor: colors.bg,
                    color: colors.green,
                    border: `1px solid ${colors.green}`,
                    borderRadius: '6px'
                });
                yesBtn.textContent = t.yes || 'Sí';
                yesBtn.onclick = () => {
                    closeOverlayAnimated(overlay).then(() => resolve(true));
                };

                actions.appendChild(noBtn);
                actions.appendChild(yesBtn);
                box.appendChild(actions);

                // focus trap simple
                const focusable = [noBtn, yesBtn];
                let fi = 0;
                focusable.forEach((el, idx) => el.tabIndex = idx + 1);
                focusable.forEach((el) => el.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        if (e.shiftKey) fi = (fi - 1 + focusable.length) % focusable.length;
                        else fi = (fi + 1) % focusable.length;
                        focusable[fi].focus();
                    }
                    if (e.key === 'Escape') { e.preventDefault(); noBtn.click(); }
                }));

                document.body.appendChild(overlay);
                try { setInertOnBodyChildrenExcept(overlay, true); } catch (e) { /* noop */ }
                // animate in
                setTimeout(() => {
                    overlay.style.opacity = '1';
                    try { box.style.transform = 'translateY(0) scale(1)'; box.style.opacity = '1'; } catch (e) { }
                }, 10);
                setTimeout(() => yesBtn.focus(), 120);
            });
        }

        function showAlertModal(message) {
            return new Promise((resolve) => {
                const { overlay, box } = createModalContainer();
                const msg = document.createElement('div');
                msg.textContent = message;
                msg.style.marginBottom = '12px';
                box.appendChild(msg);

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.justifyContent = 'center';
                actions.style.gap = '8px';

                const okBtn = document.createElement('button');
                Object.assign(okBtn.style, {
                    padding: '6px 10px',
                    backgroundColor: colors.bg,
                    color: colors.purple,
                    border: `1px solid ${colors.purple}`,
                    borderRadius: '6px'
                });
                okBtn.textContent = t.accept || 'Aceptar';
                okBtn.onclick = () => {
                    closeOverlayAnimated(overlay).then(() => resolve());
                };

                okBtn.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') { e.preventDefault(); okBtn.click(); }
                });

                actions.appendChild(okBtn);
                box.appendChild(actions);

                // focus and simple trap
                okBtn.tabIndex = 1;
                document.body.appendChild(overlay);
                try { setInertOnBodyChildrenExcept(overlay, true); } catch (e) { /* noop */ }
                setTimeout(() => {
                    overlay.style.opacity = '1';
                    try { box.style.transform = 'translateY(0) scale(1)'; box.style.opacity = '1'; } catch (e) { }
                }, 10);
                setTimeout(() => okBtn.focus(), 120);
            });
        }

        // --- botones principales reutilizando createButton ---
        function createEditKeywordsButton(inline = false) {
            return createButton(t.editKeywords, colors.green, () => {
                (async () => {
                    const current = getStoredKeywords().join(", ");
                    const input = await showInputModal(t.editPrompt, current);
                    if (input !== null) {
                        const newKeywords = input
                            .split(",")
                            .map((k) => k.trim().toLowerCase())
                            .filter((k) => k.length > 0);
                        setStoredKeywords(newKeywords);
                        removeNotificationsNotInKeywords(newKeywords);
                        console.warn(t.keywordsUpdated);
                        showAlertModal(t.keywordsModified + newKeywords.join(", ") + "\n" + t.reloading);
                        setCollapseFlag(false);
                        setTimeout(() => location.reload(), 1500);
                    }
                })();
            }, inline);
        }
        function createResetKeywordsButton(inline = false) {
            return createButton(t.resetKeywords, colors.red, () => {
                (async () => {
                    const ok = await showConfirmModal(t.confirmReset);
                    if (ok) {
                        resetKeywords();
                        resetInventoryDeletedKeys();
                        resetNotifications();
                        console.warn(t.keywordsReset);
                        showAlertModal(t.keywordsRestored);
                        setCollapseFlag(false);
                        setTimeout(() => location.reload(), 1500);
                    }
                })();
            }, inline);
        }
        function createReloadButton(inline = false) {
            return createButton(t.reload, colors.purple, () => {
                setCollapseFlag(false);
                resetInventoryDeletedKeys();
                resetNotifications();
                console.warn(t.reloadingPage);
                if (!location.pathname.includes("/campaigns")) {
                    location.href = "https://www.twitch.tv/drops/campaigns";
                } else {
                    location.reload();
                }
            }, inline);
        }

        // Crear botón + para añadir keyword
        function getAddKeyword() {
            const addBtn = document.createElement("button");
            addBtn.textContent = t.addButton || "+";
            Object.assign(addBtn.style, {
                marginLeft: "8px",
                color: colors.purple,
                cursor: "pointer",
                border: "1px solid " + colors.purple,
                backgroundColor: colors.bg,
                borderRadius: "4px",
                padding: "2px 6px",
                fontWeight: "bold",
            });
            addBtn.title = t.addKeyword;
            addBtn.onclick = () => {
                (async () => {
                    console.log(t.addKeyword + "...");
                    const newKeyword = await showInputModal(t.addKeyword);
                    if (newKeyword) {
                        const k = newKeyword.trim().toLowerCase();
                        if (!keywords.includes(k)) {
                            keywords.push(k);
                            setStoredKeywords(keywords);
                            setCollapseFlag(false);
                            location.reload();
                        }
                    }
                })();
            };
            return addBtn;
        }

        // Checkbox creator
        function createInventoryCheckboxes(inline = false) {
            const container = document.createElement('div');
            Object.assign(container.style, {
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginTop: inline ? '10px' : '0',
            });

            const makeCheckbox = (id, labelText, initial, onChange) => {
                const wrapper = document.createElement('label');
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '6px';
                wrapper.style.cursor = 'pointer';

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = id;
                cb.checked = !!initial;
                cb.style.width = '14px';
                cb.style.height = '14px';

                const txt = document.createElement('span');
                txt.textContent = labelText;
                txt.style.fontSize = '12px';
                txt.style.color = colors.text;

                cb.onchange = () => onChange(cb.checked);

                wrapper.appendChild(cb);
                wrapper.appendChild(txt);
                return wrapper;
            };

            const expiredCb = makeCheckbox('cb-hide-expired', t.hideExpired, cleanExpiredInventoryFlag, (checked) => {
                setInventoryExpiredFlag(checked);
                cleanExpiredInventoryFlag = checked;
                if (location.pathname.includes('/inventory')) {
                    if (checked) {
                        cleanInventory("expired");
                    } else {
                        setCollapseFlag(false);
                        location.reload();
                    }
                }
            });

            const activeCb = makeCheckbox('cb-hide-active', t.hideActive, cleanActiveInventoryFlag, (checked) => {
                setInventoryActiveFlag(checked);
                cleanActiveInventoryFlag = checked;
                if (location.pathname.includes('/inventory')) {
                    if (checked) {
                        cleanInventory("active");
                    } else {
                        setCollapseFlag(false);
                        location.reload();
                    }
                }
            });

            container.appendChild(document.createElement("br"));
            container.appendChild(document.createElement("br"));
            container.appendChild(expiredCb);
            //container.appendChild(activeCb);
            return container;
        }

        // Muestra las keywords en un div (click para borrar)
        function setKeywordsInDiv(div, keywordsArr) {
            keywordsArr.sort((a, b) => a.localeCompare(b)).forEach((k, i) => {
                const span = document.createElement("span");
                span.textContent = k;
                span.className = "ScCoreLink-sc-16kq0mq-0 gcA-DkW tw-link";
                span.style.marginRight = "8px";
                span.style.cursor = "pointer";
                span.title = t.deleteKeywordTooltip;

                span.onclick = () => {
                    (async () => {
                        console.log(t.deleteKeywordQuestion + ` "${k}"?`);
                        const ok = await showConfirmModal(`${t.deleteKeywordQuestion} "${k}"?`);
                        if (ok) {
                            keywordsArr.splice(i, 1);
                            setStoredKeywords(keywordsArr);
                            setCollapseFlag(false);
                            deleteNotificationsByKeyword(k);
                            location.reload();
                        }
                    })();
                };

                div.appendChild(span);
            });
        }

        // --- UI de preview de keywords (pequeña caja informativa) ---
        function showKeywordPreview() {
            const existing = document.getElementById("drops-nav-links");
            if (existing) existing.remove();
            const titleBar = document.querySelector(".title-bar");
            if (!titleBar || document.getElementById("keywords-preview"))
                return false;

            const preview = document.createElement("div");
            preview.id = "keywords-preview";
            Object.assign(preview.style, {
                padding: "10px",
                marginTop: "10px",
                border: `2px dashed ${colors.green}`,
                borderRadius: "8px",
                color: colors.text,
                backgroundColor: colors.bg,
                fontSize: "14px",
                lineHeight: "1.5",
            });

            // colapsar/expandir
            const collapseElement = document.createElement("div");
            collapseElement.textContent = t.collapse;
            preview.appendChild(collapseElement);
            const expandElement = document.createElement("div");
            expandElement.textContent = t.expand;
            preview.appendChild(expandElement);
            preview.appendChild(document.createElement("br"));

            // keywords list
            const divKeywords = document.createElement("div");
            divKeywords.style.minWidth = "800px";
            divKeywords.style.maxWidth = "1024px";
            const strongElement = document.createElement("strong");
            strongElement.textContent = t.currentKeywords;
            divKeywords.appendChild(strongElement);
            divKeywords.appendChild(document.createElement("br"));

            setKeywordsInDiv(divKeywords, keywords);

            // añadir keyword + botones y mensaje
            const addBtn = getAddKeyword();
            divKeywords.appendChild(addBtn);
            preview.appendChild(divKeywords);

            const columns = document.createElement("div");
            Object.assign(columns.style, {
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                justifyContent: "space-between",
            });
            columns.innerHTML += `<em>${t.waitMessage}</em>`;
            preview.appendChild(columns);

            const controls = document.createElement("div");
            controls.style.flex = "1 1 100%";
            controls.style.display = "flex";
            controls.style.gap = "10px";
            controls.style.marginTop = "12px";
            controls.appendChild(createEditKeywordsButton(true));
            controls.appendChild(createResetKeywordsButton(true));
            controls.appendChild(createReloadButton(true));
            controls.appendChild(createInventoryCheckboxes(true));
            preview.appendChild(controls);

            const after = titleBar.querySelector("h2");
            if (after) after.insertAdjacentElement("afterend", preview);
            else titleBar.appendChild(preview);

            // colapsar/expandir comportamiento
            collapseElement.onclick = () => {
                setCollapseFlag(true);
                divKeywords.style.maxHeight = "0px";
                divKeywords.style.overflow = "hidden";
                controls.style.maxHeight = "0px";
                controls.style.overflow = "hidden";
                columns.style.maxHeight = "0px";
                columns.style.overflow = "hidden";
                collapseElement.hidden = true;
                expandElement.hidden = false;
            };
            expandElement.onclick = () => {
                setCollapseFlag(false);
                divKeywords.style.maxHeight = "none";
                divKeywords.style.overflow = "visible";
                controls.style.maxHeight = "none";
                controls.style.overflow = "visible";
                columns.style.maxHeight = "none";
                columns.style.overflow = "visible";
                collapseElement.hidden = false;
                expandElement.hidden = true;
            };
            expandElement.hidden = true;

            let collapsePreviewFlag = getCollapseFlag();
            if (collapsePreviewFlag) {
                collapseElement.click();
            }

            return true;
        }

        // --- popup de notificaciones simple ---
        function createNotificationPopup() {
            // eliminar popup anterior
            const existing = document.getElementById('drops-notification-popup');
            if (existing) existing.remove();

            const notifs = getNotifications();
            // mostrar solo notificaciones no vistas y marcadas como changed (o nuevas sin seen)
            const pending = notifs.filter(n => !n.seen && n.changed);
            // si no hay pendientes, asegurarnos de detener sonido / restaurar título
            if (!pending.length) {
                updateNotificationTitleAndSound();
                return;
            }

            const container = document.createElement('div');
            container.id = 'drops-notification-popup';
            Object.assign(container.style, {
                position: 'fixed',
                right: '16px',
                bottom: '16px',
                width: '320px',
                maxHeight: '60vh',
                overflowY: 'auto',
                backgroundColor: colors.bg,
                border: `2px solid ${colors.purple}`,
                color: colors.text,
                padding: '12px',
                borderRadius: '10px',
                zIndex: 999999,
                fontSize: '13px',
            });

            const header = document.createElement('div');
            header.id = 'drops-notification-header';
            header.textContent = `(${pending.length}) ${t.changes_detected}`;
            header.style.fontWeight = '700';
            header.style.marginBottom = '8px';
            container.appendChild(header);

            pending.sort((a, b) => a.title.localeCompare(b.title)).forEach(n => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.gap = '8px';
                row.style.marginBottom = '8px';

                const title = document.createElement('div');
                title.textContent = n.title;
                title.style.flex = '1 1 auto';
                title.style.marginRight = '8px';
                row.appendChild(title);

                const btn = document.createElement('button');
                btn.textContent = t.viewIcon || '👁️'; // --- IGNORE ---
                btn.title = t.viewed;
                Object.assign(btn.style, {
                    backgroundColor: colors.bg,
                    border: '1px solid ' + colors.purple,
                    color: colors.text,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                });
                btn.onclick = () => {
                    // remover visualmente
                    row.remove();
                    markNotificationSeen(n.key || n.title);
                    // quitar campana en todos los enlaces que coincidan con title y/o id
                    const notifTitle = n.title;
                    const notifId = (n.key && n.key.includes('|')) ? n.key.split('|')[1] : (n.id || '');
                    // selector por title e id (si existe)
                    const selParts = [];
                    if (notifTitle) selParts.push(`a[data-title="${notifTitle}"]`);
                    if (notifId) selParts.push(`a[data-id="${notifId}"]`);
                    const combinedSel = selParts.join(',');
                    const matches = combinedSel ? Array.from(document.querySelectorAll(combinedSel)) : [];
                    if (matches.length) {
                        matches.forEach(linkEl => {
                            const bellIcon = linkEl.querySelector('span');
                            if (bellIcon) bellIcon.remove();
                        });
                        // preferir abrir link con el mismo id, si no, uno activo, si no, el primero
                        let preferred = null;
                        if (notifId) preferred = matches.find(l => (l.dataset.id || '') === notifId);
                        if (!preferred) preferred = matches.find(l => (l.dataset.id || '').includes('active')) || matches[0];
                        try {
                            preferred.scrollIntoView({ behavior: "smooth", block: "start" });
                            preferred.click();
                        } catch (e) { /* noop */ }
                    }
                    // si no hay más, quitar popup
                    if (!container.querySelectorAll('div').length || container.querySelectorAll('div').length <= 1) {
                        container.remove();
                    }
                };
                row.appendChild(btn);

                container.appendChild(row);
            });

            document.body.appendChild(container);

            // actualizar título y activar sonido si hay pendientes
            updateNotificationTitleAndSound();
        }

        // --- textos que indican secciones cerradas / campañas cerradas (i18n multi) ---
        const CLOSED_HEADER_TEXTS = [
            "Campañas con drops cerradas",
            "Campañas de drops cerradas",
            "Closed Drop Campaigns",
            "Lukkede rovkampagner",
            "Beendete Drop-Kampagnen",
            "Campagnes de drops fermées",
            "Campagne Drop chiuse",
            "Lezárt dropkampányok",
            "Gesloten dropcampagnes",
            "Lukkede droppkampanjer",
            "Zamknięte kampanie z dropami",
            "Campanhas de drops encerradas",
            "Campanii de dropuri închise",
            "Zatvorené kampane s dropmi",
            "Suljetut droppikampanjat",
            "Stängda dropkampanjer",
            "Các chiến dịch quà tặng đã đóng",
            "Kapalı drop kampanyaları",
            "Zavřené kampaně s Drops",
            "Κλειστές καμπάνιες Drop",
            "Затворени кампании за Drop",
            "Закрытые кампании Drop",
            "แคมเปญ Drops ที่ปิดแล้ว",
            "حملات Drop المغلقة",
            "已关闭的掉宝活动",
            "已結束的掉寶活動",
            "Dropsキャンペーンを閉じる",
            "종료된 드롭 캠페인",
        ];
        const CLOSED_DROP_TEXTS = [
            "Esta campaña está cerrada.",
            "Esta campaña se ha cerrado.",
            "This campaign has closed.",
            "Denne kampagne er lukket.",
            "Diese Kampagne wurde beendet.",
            "Cette campagne est fermée.",
            "La campagna è chiusa.",
            "A kampány lezárult.",
            "Deze campagne is gesloten.",
            "Denne kampanjen er avsluttet.",
            "Ta kampania została zamknięta.",
            "Esta campanha está encerrada.",
            "Esta campanha foi encerrada.",
            "Această campanie s-a terminat.",
            "Táto kampaň je uzavretá.",
            "Tämä kampanja on suljettu.",
            "Den här kampanjen har stängts.",
            "Chiến dịch này đã đóng.",
            "Bu kampanya kapanmış.",
            "Tato kampaň je uzavřená.",
            "Η καμπάνια έχει κλείσει.",
            "Тази кампания приключи.",
            "Эта кампания закрыта.",
            "แคมเปญนี้ปิดลงแล้ว",
            "تم إغلاق هذه الحملة.",
            "此活动已关闭。",
            "活動已結束。",
            "このキャンペーンは終了しています。",
            "종료된 캠페인입니다.",
        ];

        // estilos inline para resaltar elementos
        const ACTIVE_STYLE = `border: 4px solid #0a5738 !important; box-shadow: 0 0 30px #00c274 !important; border-radius: 16px !important; scroll-margin-top: 100px;`;
        const EXPIRED_STYLE = `border: 4px solid #971311 !important; box-shadow: 0 0 30px #ff8280 !important; border-radius: 16px !important; scroll-margin-top: 100px;`;

        // estado para navegación / resultados
        let active = [],
            expired = [],
            seenTitles = new Set(),
            idx = 0,
            reseted = false,
            divIdClickAfterClick = null;

        // --- crear links de navegación resultantes (sidebar en el DOM) ---
        function createNavigationLinks() {
            const titleBar = document.querySelector(".title-bar");
            if (!titleBar) return;

            // remover preview si existe (mantenemos una sola caja)
            const nav = document.createElement("div");
            nav.id = "drops-nav-links";
            Object.assign(nav.style, {
                marginTop: "8px",
                padding: "10px",
                border: `2px dashed ${colors.green}`,
                borderRadius: "10px",
                color: colors.text,
                fontSize: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                backgroundColor: colors.bg,
            });

            // controles colapsar/expandir
            const collapseElement = document.createElement("div");
            collapseElement.textContent = t.collapse;
            nav.appendChild(collapseElement);
            const expandElement = document.createElement("div");
            expandElement.textContent = t.expand;
            nav.appendChild(expandElement);

            // keywords
            const divKeywords = document.createElement("div");
            divKeywords.style.minWidth = "800px";
            divKeywords.style.maxWidth = "1024px";
            const strongElement = document.createElement("strong");
            strongElement.textContent = t.currentKeywords;
            divKeywords.appendChild(strongElement);
            divKeywords.appendChild(document.createElement("br"));

            setKeywordsInDiv(divKeywords, keywords);

            const addBtn = getAddKeyword();
            divKeywords.appendChild(addBtn);
            nav.appendChild(divKeywords);

            // columnas de resultados (activo / caducado)
            const columns = document.createElement("div");
            Object.assign(columns.style, {
                display: "flex",
                gap: "20px",
                flexWrap: "wrap",
                justifyContent: "space-between",
            });

            const createColumn = (title, items, color, icon, status) => {
                const col = document.createElement("div");
                col.style.flex = "1 1 45%";
                col.style.minWidth = "400px";
                col.style.maxWidth = "512px";

                const header = document.createElement("div");
                header.textContent = `(${items.length}) ${title}`;
                Object.assign(header.style, {
                    fontWeight: "bold",
                    marginBottom: "8px",
                    color: color,
                });
                col.appendChild(header);

                const list = document.createElement("div");
                const needsScroll = items.length > 5;
                Object.assign(list.style, {
                    maxHeight: needsScroll ? "100px" : "auto",
                    overflowY: needsScroll ? "auto" : "visible",
                    border: `1px dashed ${color}`,
                    paddingRight: "4px",
                });

                // crear enlaces (document fragment para menos reflow)
                const frag = document.createDocumentFragment();
                items.sort((a, b) => a.title.localeCompare(b.title)).forEach((d) => {
                    const a = document.createElement("a");
                    a.dataset.title = d.title;
                    a.dataset.color = color;
                    a.dataset.icon = icon;
                    a.dataset.id = d.id;
                    a.dataset.key = d.key;
                    a.dataset.idx = d.idx;
                    a.dataset.status = d.status;
                    a.textContent = `${icon} ${d.title}`;
                    // si el item fue marcado como cambiado, añadir indicador visual
                    if (d.changed) {
                        const mark = document.createElement('span');
                        mark.dataset.title = d.title;
                        mark.dataset.id = d.id;
                        mark.textContent = ' ' + (t.changedIcon || '🔔');
                        mark.style.color = colors.orange;
                        mark.style.marginLeft = '6px';
                        a.appendChild(mark);
                    }
                    Object.assign(a.style, {
                        display: "block",
                        margin: "4px 0",
                        color: color,
                        fontWeight: "600",
                        textDecoration: "none",
                    });
                    a.onmouseover = () => (a.style.textDecoration = "underline");
                    a.onmouseout = () => (a.style.textDecoration = "none");
                    a.onclick = (e) => {
                        if (actualPath !== "/drops/campaigns") {
                            const campaignsLink = document.querySelector('a[href="/drops/campaigns"]');
                            if (campaignsLink) {
                                divIdClickAfterClick = d;
                                console.log(`Navigating to campaigns page to view drop with ID ${d.id} and title ${d.title}...`);
                                campaignsLink.click();
                            }
                        } else {
                            const target = document.getElementById(d.id);
                            if (target) {
                                a.scrollIntoView({ behavior: "smooth", block: "start" });
                                target.scrollIntoView({ behavior: "smooth", block: "start" });
                            } else {
                                console.warn(`Element with ID ${d.id} and title ${d.title} not found.`);
                            }
                        }
                    };
                    frag.appendChild(a);
                });
                list.appendChild(frag);

                col.appendChild(list);
                return col;
            };

            if (active.length) columns.appendChild(createColumn(t.dropsActive, active, colors.green, t.iconLink || "🔗", 'active'));
            if (expired.length) columns.appendChild(createColumn(t.dropsExpired, expired, colors.red, t.iconCross || "❌", 'expired'));
            if (!active.length && !expired.length) columns.appendChild(createColumn(t.dropsNone, [], colors.gray, t.iconCross || "❌", 'none'));

            nav.appendChild(columns);

            // controles finales
            const controls = document.createElement("div");
            controls.style.display = "flex";
            controls.style.gap = "10px";
            controls.style.marginTop = "12px";
            controls.appendChild(createEditKeywordsButton());
            controls.appendChild(createResetKeywordsButton());
            controls.appendChild(createReloadButton());
            controls.appendChild(createInventoryCheckboxes());
            nav.appendChild(controls);

            const after = titleBar.querySelector("h2");
            if (after) after.insertAdjacentElement("afterend", nav);
            else titleBar.appendChild(nav);

            // comportamientos colapsar/expandir (mismo patrón que preview)
            collapseElement.onclick = () => {
                setCollapseFlag(true);
                divKeywords.style.maxHeight = "0px";
                divKeywords.style.overflow = "hidden";
                controls.style.maxHeight = "0px";
                controls.style.overflow = "hidden";
                columns.style.maxHeight = "0px";
                columns.style.overflow = "hidden";
                collapseElement.hidden = true;
                expandElement.hidden = false;
            };
            expandElement.onclick = () => {
                setCollapseFlag(false);
                divKeywords.style.maxHeight = "none";
                divKeywords.style.overflow = "visible";
                controls.style.maxHeight = "none";
                controls.style.overflow = "visible";
                columns.style.maxHeight = "none";
                columns.style.overflow = "visible";
                collapseElement.hidden = false;
                expandElement.hidden = true;
            };
            expandElement.hidden = true;

            let collapsePreviewFlag = getCollapseFlag();
            if (collapsePreviewFlag) {
                collapseElement.click();
            }
        }

        // --- limpieza de inventario (refactorizada): "expired" filtra por existencia de <p>, "active" filtra por ausencia ---
        function cleanInventory(type = "expired") {
            // type: "expired" | "active"
            let attempts = 0;
            const maxAttempts = 10;
            const interval = 500;
            const aToRemoveAdded = [];
            const checker = setInterval(() => {
                attempts++;
                const imgs = document.querySelectorAll("img.inventory-opacity-2");
                if (imgs.length > 0) {
                    const toRemove = [];
                    imgs.forEach(function (img) {
                        // buscar contenedor relevante subiendo por el DOM
                        const firstParentDiv = img.closest("div");
                        if (!firstParentDiv) return;
                        const secondParentDiv = firstParentDiv.parentElement;
                        if (!secondParentDiv) return;
                        const hasP = secondParentDiv.querySelector("p") !== null;

                        // elegir según tipo (expired = tiene <p>, active = no tiene)
                        if ((type === "expired" && hasP) || (type === "active" && !hasP)) {
                            // subir hasta encontrar contenedor principal (hasta 9 niveles)
                            let container = img;
                            for (let i = 0; i < 9; i++) {
                                if (container.parentElement) container = container.parentElement;
                                else {
                                    container = null;
                                    break;
                                }
                            }
                            if (container) toRemove.push(container);
                        }
                        else {
                            let container = img;
                            for (let i = 0; i < 9; i++) {
                                if (container.parentElement) container = container.parentElement;
                                else {
                                    container = null;
                                    break;
                                }
                            }
                            if (container) {
                                // buscar elemento <a> con tw-link y dropID, crear nuevo <a> con console.log
                                const linkElement = container.querySelector('a.tw-link[href*="dropID="]');
                                if (linkElement) {
                                    const href = linkElement.getAttribute('href');
                                    const dropIDMatch = href.match(/dropID=([^&]+)/);
                                    if (dropIDMatch) {
                                        const dropID = dropIDMatch[1];
                                        if (!aToRemoveAdded.includes(dropID)) {
                                            aToRemoveAdded.push(dropID);
                                            if (deletedInventoryDrops.includes(dropID)) {
                                                container.parentElement.removeChild(container);
                                                console.log(`❌ Drop with ID ${dropID} previously removed from inventory.`);
                                            }
                                            else {
                                                const newLink = document.createElement('a');
                                                newLink.textContent = t.removeIcon || '❌';
                                                newLink.href = '#';
                                                newLink.style.marginLeft = '10px';
                                                newLink.style.color = colors.purple;
                                                newLink.title = t.removeInventory;
                                                newLink.onclick = (e) => {
                                                    e.preventDefault();
                                                    container.parentElement.removeChild(container);
                                                    deletedInventoryDrops.push(dropID);
                                                    setInventoryDeletedKeys(deletedInventoryDrops);
                                                    console.log(`❌ Drop with ID ${dropID} removed from inventory.`);
                                                };
                                                if (!linkElement.dataset.buttonAdded) {
                                                    linkElement.dataset.buttonAdded = "true";
                                                    linkElement.parentNode.insertBefore(newLink, linkElement.nextSibling);
                                                }
                                            }
                                        }
                                    }
                                }
                                const images = container.querySelectorAll("img.inventory-drop-image");
                                images.forEach((im) => {
                                    // subir hasta encontrar contenedor principal (hasta 6 niveles)
                                    if (im.classList.contains('inventory-opacity-2')) return;
                                    let imgToRemove = im;
                                    for (let i = 0; i < 6; i++) {
                                        if (imgToRemove.parentElement) imgToRemove = imgToRemove.parentElement;
                                        else {
                                            imgToRemove = null;
                                            break;
                                        }
                                    }
                                    if (imgToRemove && type === "expired") {
                                        toRemove.push(imgToRemove);
                                    }
                                });
                                const buttons = Array.from(container.querySelectorAll("button.ScCoreButton-sc-ocjdkq-0.kJMgAB"));
                                if (buttons.length && type === "expired") {
                                    buttons.forEach((btn, i) => {
                                        if (!btn.dataset.buttonClicked) {
                                            btn.dataset.buttonClicked = "true";
                                            setTimeout(() => btn.click(), i * 150);
                                        }
                                    });
                                }
                            }
                        }
                    });

                    // eliminar nodos fuera del bucle para evitar problemas con el live DOM
                    toRemove.forEach(function (el) {
                        if (el.parentElement) el.parentElement.removeChild(el);
                    });
                }

                if (attempts >= maxAttempts) clearInterval(checker);
            }, interval);
        }

        // --- resaltar y generar enlaces a drops (campañas) ---
        function highlightAndLinkDrops() {
            const keywords_preview = document.getElementById("keywords-preview");
            if (keywords_preview) keywords_preview.remove();
            const existing = document.getElementById("drops-nav-links");
            if (existing) existing.remove();

            active = [];
            expired = [];
            seenTitles = new Set();
            reseted = false;
            idx = 0;

            // Buscar header que indique secciones "cerradas"
            const closedHeader = Array.from(document.querySelectorAll('h4[class^="CoreText-sc"]'))
                .find(h => CLOSED_HEADER_TEXTS.some(text => h.textContent.trim().toLowerCase() === text.toLowerCase()));
            if (!closedHeader) return;

            // Recolectar nodos candidatos a ser campañas (optimizado al mínimo necesario)
            const allNodes = Array.from(document.querySelectorAll('h4[class^="CoreText-sc"], div.accordion-header'));
            const closedIndex = allNodes.indexOf(closedHeader);

            allNodes.forEach((node, index) => {
                if (!(node instanceof HTMLElement)) return;

                // Filtrado robusto: buscamos contenedores tipo Layout-sc* (sólo si el node es tal)
                if (!node.matches('div[class^="Layout-sc"]')) return;

                // Evitar matches ya procesados
                if (node.id?.startsWith('drop-match-')) return;
                if (node.querySelector('p[data-a-target="side-nav-title"]')) return;

                const ps = node.querySelectorAll('p[class^="CoreText-sc"]');
                if (ps.length !== 2) return;
                let titleP = ps[0];
                let style = window.getComputedStyle(titleP);
                if (style.fontWeight !== '600') return;

                let titleText = titleP.textContent.trim();
                let titleLc = titleText.toLowerCase();

                if (!keywords.some(k => titleLc.includes(k))) {
                    titleP = ps[1];
                    style = window.getComputedStyle(titleP);

                    titleText = titleP.textContent.trim() + " - " + titleText;
                    titleLc = titleText.toLowerCase();

                    if (!keywords.some(k => titleLc.includes(k))) return;
                }

                const isExpired = index > closedIndex;
                if (isExpired && !reseted) {
                    seenTitles = new Set();
                    reseted = true;
                }

                if (seenTitles.has(index)) return;
                seenTitles.add(index);

                const id = `drop-match-${idx++}-${isExpired ? 'expired' : 'active'}`;

                // Generar snapshot simple del nodo para detectar cambios (texto relevante limitado)
                const snapshot = ((node.innerText || node.textContent) + '').trim().slice(0, 800);

                node.id = id;
                // Aplicar estilo al padre para resaltar (conservando comportamiento original)
                if (node.parentElement) node.parentElement.setAttribute('style', isExpired ? EXPIRED_STYLE : ACTIVE_STYLE);

                // Actualizar/crear notificación persistente
                let changedFlag = false;
                const computedKey = titleText + '|' + id;
                if (!isExpired) {
                    const notifs = getNotifications();
                    let existing = notifs.find((n) => n.key === computedKey);
                    if (existing) {
                        if (existing.lastSnapshot !== snapshot) {
                            // hubo cambio: marcar y volver a mostrar hasta que el usuario pulse 'visto'
                            existing.id = id; // actualizar id por si cambió
                            // actualizar key en caso de que venga sin ella o con id antiguo
                            existing.key = computedKey;
                            existing.changed = true;
                            existing.seen = false;
                            existing.lastSnapshot = snapshot;
                            existing.updatedAt = Date.now();
                            changedFlag = true;
                            notifs[notifs.indexOf(existing)] = existing;
                            saveNotifications(notifs);
                        } else {
                            changedFlag = !existing.seen && existing.changed;
                        }
                    } else {
                        // nuevo drop encontrado -> guardar notificación (no marcado como cambiado aún)
                        const newN = {
                            id: id,
                            title: titleText,
                            key: computedKey,
                            lastSnapshot: snapshot,
                            seen: false,
                            changed: true, // marcar como cambiado para notificar al usuario
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        };
                        notifs.push(newN);
                        saveNotifications(notifs);
                        changedFlag = true;
                    }
                }

                const item = { 
                    title: titleText, 
                    id, 
                    changed: changedFlag,
                    key: computedKey,
                    status: isExpired ? 'expired' : 'active',
                    idx: index
                };
                (isExpired ? expired : active).push(item);
            });

            createNavigationLinks();
            // Mostrar popup de notificaciones (nuevas/cambiadas) si las hay
            createNotificationPopup();

            // Si había intención de click tras cambiar de página (inventory->campaigns), reintentar
            if (divIdClickAfterClick) {
                let attempts = 0;
                const clickInterval = setInterval(() => {
                    attempts++;
                    const clickA = document.querySelector(`a[data-key="${divIdClickAfterClick.key}"]`);
                    if (clickA) {
                        clickA.scrollIntoView({ behavior: "smooth", block: "start" });
                        clickA.click();
                        divIdClickAfterClick = null;
                        clearInterval(clickInterval);
                    } else {
                        const clickB = document.querySelector(`a[id="${divIdClickAfterClick.id}"]`);
                        if (clickB) {
                            clickB.scrollIntoView({ behavior: "smooth", block: "start" });
                            clickB.click();
                        } else if (attempts >= 10) {
                            console.warn(`No se encontró el enlace para "${divIdClickAfterClick.id}" después de 10 intentos.`);
                            divIdClickAfterClick = null;
                            clearInterval(clickInterval);
                        }
                    }
                }, 500);
            }
        }

        // --- espera y polling hasta que Twitch renderice los drops (manejo de rutas) ---
        function waitForDropsFunction() {
            const path = location.pathname;
            const isCampaigns = path.includes("/campaigns");
            const isInventory = path.includes("/inventory");
            actualPath = isCampaigns ? "/drops/campaigns" : isInventory ? "/drops/inventory" : path;
            let attempts = 0;
            let previewShown = false;
            const maxAttempts = isCampaigns ? 10 : 1; // más paciencia en campaigns
            let waitForDrops = setInterval(() => {
                let found = 0;
                const seenTitlesLocal = new Set();

                document.querySelectorAll("div.accordion-header").forEach((header) => {
                    if (!previewShown) {
                        previewShown = showKeywordPreview();
                    }

                    // selector menos frágil para título
                    const titleP = header.querySelector("p.CoreText-sc-1txzju1-0.dzXkjr");
                    if (!titleP) return;

                    const text = titleP.textContent.trim().toLowerCase();
                    if (!keywords.some((k) => text.includes(k))) return;
                    if (seenTitlesLocal.has(text)) return;

                    seenTitlesLocal.add(text);
                    found++;
                });

                if (found >= 1) {
                    clearInterval(waitForDrops);
                    highlightAndLinkDrops();
                } else {
                    attempts++;
                    let searchingElem = document.getElementById("searching-status");
                    const preview = document.getElementById("keywords-preview");
                    if (!searchingElem && preview) {
                        searchingElem = document.createElement("div");
                        searchingElem.id = "searching-status";
                        Object.assign(searchingElem.style, {
                            color: colors.orange,
                            fontWeight: "bold",
                            marginTop: "10px",
                        });
                        preview.appendChild(searchingElem);
                    }

                    if (searchingElem) {
                        searchingElem.textContent = `${t.searching}${".".repeat(attempts)}`;
                    }
                    if (attempts >= maxAttempts) {
                        clearInterval(waitForDrops);
                        if (!previewShown) showKeywordPreview();
                        if (searchingElem) searchingElem.remove();
                        if (!isInventory) {
                            const preview = document.getElementById("keywords-preview");
                            if (preview) {
                                const warn = document.createElement("div");
                                warn.id = "no-results-warning";
                                warn.style.textAlign = "center";
                                warn.textContent = t.noResults;
                                Object.assign(warn.style, {
                                    color: colors.red,
                                    fontWeight: "bold",
                                    marginTop: "10px",
                                });
                                preview.appendChild(warn);
                            }
                        }
                        if (isInventory) {
                            if (cleanExpiredInventoryFlag) cleanInventory("expired");
                            //if (cleanActiveInventoryFlag) cleanInventory("active");
                            cleanInventory('')
                        }
                    }
                }
            }, 500);
        }

        // --- observador de historial / URL (soporta pushState/replaceState/popstate) ---
        let actualPath = "";
        function onUrlChange(callback) {
            const pushState = history.pushState;
            const replaceState = history.replaceState;

            history.pushState = function () {
                pushState.apply(history, arguments);
                callback();
            };
            history.replaceState = function () {
                replaceState.apply(history, arguments);
                callback();
            };

            window.addEventListener("popstate", callback);
        }

        onUrlChange(() => {
            const newPath = location.pathname;
            if (newPath !== actualPath) {
                actualPath = newPath;
                if (newPath.startsWith("/drops/campaigns")) {
                    waitForDropsFunction();
                } else {
                    // si estamos en inventory aplicar limpieza si corresponde
                    if (cleanExpiredInventoryFlag) cleanInventory("expired");
                    //if (cleanActiveInventoryFlag) cleanInventory("active");
                    cleanInventory('')
                }
            }
        });

        // Detectar cambio de tema (tw-root--theme-dark / tw-root--theme-light) y recargar
        /*
        let prevTheme = document.documentElement.classList.contains("tw-root--theme-dark")
            ? "dark"
            : document.documentElement.classList.contains("tw-root--theme-light")
            ? "light"
            : null;

        const themeObserver = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === "attributes" && m.attributeName === "class") {
                    const el = document.documentElement;
                    const currentTheme = el.classList.contains("tw-root--theme-dark")
                        ? "dark"
                        : el.classList.contains("tw-root--theme-light")
                        ? "light"
                        : null;
                    if (currentTheme && currentTheme !== prevTheme) {
                        console.info(`Theme changed: ${prevTheme} -> ${currentTheme}. Reloading page.`);
                        prevTheme = currentTheme;
                        // pequeña demora para evitar recargas múltiples en transiciones rápidas
                        setCollapseFlag(false);
                        setTimeout(() => location.reload(), 150);
                        break;
                    }
                }
            }
        });

        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        */

        // inicio
        waitForDropsFunction();

        // Auto-refresh: click campaigns then inventory every 15 minutos
        setInterval(() => {
            location.reload();
        }, 15 * 60 * 1000); // 15 minutos
    });
})();
