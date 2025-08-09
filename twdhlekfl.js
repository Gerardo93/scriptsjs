// ==UserScript==
// @name         Twitch Drops Highlighter + Links + Editable Keywords (Full + i18n)
// @namespace    http://tampermonkey.net/
// @version      1.1.3.8
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
    'use strict';

    window.addEventListener('load', () => {
        const userLang = document.documentElement.getAttribute('lang') || 'en';
        const lang = userLang.split('-')[0];

        const i18n = {
            es: {
                addKeyword: '➕ Añadir Keyword',
                deleteKeywordTooltip: 'Haga click para eliminar keyword',
                deleteKeywordQuestion: '¿Eliminar la keyword ',
                editKeywords: '✏️ Editar Keywords',
                resetKeywords: '🔄 Restaurar Predeterminadas',
                confirmReset: '¿Restaurar las keywords por defecto?',
                keywordsRestored: '🔁 Keywords restauradas. Recargando...',
                keywordsUpdated: '✅ Keywords actualizadas. Recargando...',
                currentKeywords: '🔍 Keywords actuales:',
                noResults: '❌ No se encontraron drops relacionados con tus keywords.',
                dropsActive: '⏳🟢 Drops Activos',
                dropsExpired: '⌛🔴 Drops Caducados',
                dropsNone: '❌ 0 Drops encontrados',
                editPrompt: '📝 Palabras clave separadas por coma:',
                waitMessage: 'Si no ves resultados, edita las keywords o espera a que cargue Twitch Drops. Si estas en el inventario, dirígete a campañas.',
                changeMessage: '🔄 Cambia a campañas para ver los drops activos.',
                searching: '🔍 Buscando',
                reload: '🔃 Recargar drops'
            },
            en: {
                addKeyword: '➕ Add Keyword',
                deleteKeywordTooltip: 'Click to delete keyword',
                deleteKeywordQuestion: 'Delete keyword ',
                editKeywords: '✏️ Edit Keywords',
                resetKeywords: '🔄 Reset to Default',
                confirmReset: 'Reset keywords to default?',
                keywordsRestored: '🔁 Keywords restored. Reloading...',
                keywordsUpdated: '✅ Keywords updated. Reloading...',
                currentKeywords: '🔍 Current keywords:',
                noResults: '❌ No drops matched your keywords.',
                dropsActive: '⏳🟢 Active Drops',
                dropsExpired: '⌛🔴 Expired Drops',
                dropsNone: '❌ 0 Drops found',
                editPrompt: '📝 Comma-separated keywords:',
                waitMessage: 'If no results show up, edit the keywords or wait for Twitch Drops to load. If you are in the inventory, go to campaigns.',
                changeMessage: '🔄 Switch to campaigns to see active drops.',
                searching: '🔍 Searching',
                reload: '🔃 Reload drops'
            }
        };

        const t = i18n[lang] || i18n['en'];

        const DEFAULT_KEYWORDS = ['halo', 'doom', 'quake', 'wolfenstein', 'rage', 'fortnite', 'rocket league', 'among us', 'minecraft', 'roblox', 'star wars', 'marvel'];
        const STORAGE_KEY = 'twitch_drop_keywords';

        function getStoredKeywords() {
            const stored = GM_getValue(STORAGE_KEY, null);
            if (stored) {
                try {
                    return JSON.parse(stored);
                } catch (e) {
                    console.warn('❌ Error leyendo keywords:', e);
                }
            }
            return [...DEFAULT_KEYWORDS];
        }

        function setStoredKeywords(keywords) {
            GM_setValue(STORAGE_KEY, JSON.stringify(keywords));
        }

        function resetKeywords() {
            GM_deleteValue(STORAGE_KEY);
        }

        let keywords = getStoredKeywords();

        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const colors = {
            purple: "#bf94ff",
            green: '#13ae0a',
            red: '#ff4444',
            gray: '#999',
            bg: '',
            text: "var(--color-text-base)"
        };

        function createEditKeywordsButton(inline = false) {
            const btn = document.createElement('button');
            btn.textContent = t.editKeywords;
            Object.assign(btn.style, {
                padding: '6px 10px',
                backgroundColor: colors.bg,
                color: colors.green,
                border: `1px solid ${colors.green}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: inline ? '10px' : '0'
            });
            btn.onclick = () => {
                const current = getStoredKeywords().join(', ');
                const input = prompt(t.editPrompt, current);
                if (input !== null) {
                    const newKeywords = input.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);
                    setStoredKeywords(newKeywords);
                    console.warn(t.keywordsUpdated);
                    location.reload();
                }
            };
            return btn;
        }

        function createResetKeywordsButton(inline = false) {
            const resetBtn = document.createElement('button');
            resetBtn.textContent = t.resetKeywords;
            Object.assign(resetBtn.style, {
                padding: '6px 10px',
                backgroundColor: colors.bg,
                color: colors.red,
                border: `1px solid ${colors.red}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: inline ? '10px' : '0'
            });
            resetBtn.onclick = () => {
                if (confirm(t.confirmReset)) {
                    resetKeywords();
                    alert(t.keywordsRestored);
                    location.reload();
                }
            };
            return resetBtn;
        }

        function createReloadButton(inline = false) {
            const reloadBtn = document.createElement('button');
            reloadBtn.textContent = t.reload;
            Object.assign(reloadBtn.style, {
                padding: '6px 10px',
                backgroundColor: colors.bg,
                color: colors.purple,
                border: `1px solid ${colors.purple}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                marginTop: inline ? '10px' : '0'
            });
            reloadBtn.onclick = () => {
                if (location.pathname.includes('/inventory')) {
                    location.href = 'https://www.twitch.tv/drops/campaigns';
                } else {
                    location.reload();
                }
            };
            return reloadBtn;
        }

        function getAddKeyword() {
            const addBtn = document.createElement('button');
            addBtn.textContent = '+';
            Object.assign(addBtn.style, {
                marginLeft: '8px',
                color: colors.purple,
                cursor: 'pointer',
                border: '1px solid ' + colors.purple,
                backgroundColor: 'transparent',
                borderRadius: '4px',
                padding: '2px 6px',
                fontWeight: 'bold'
            });
            addBtn.title = t.addKeyword;
            addBtn.onclick = () => {
                const newKeyword = prompt(t.addKeyword);
                if (newKeyword) {
                    const k = newKeyword.trim().toLowerCase();
                    if (!keywords.includes(k)) {
                        keywords.push(k);
                        setStoredKeywords(keywords);
                        location.reload();
                    }
                }
            };
            return addBtn;
        }

        function setKeywordsInDiv(div, keywords) {
            keywords.forEach((k, i) => {
                const span = document.createElement('span');
                span.textContent = k;
                span.style.marginRight = '8px';
                span.style.color = colors.green;
                span.style.cursor = 'pointer';
                span.style.borderBottom = '1px dashed';
                span.title = t.deleteKeywordTooltip;

                span.onclick = () => {
                    if (confirm(`${t.deleteKeywordQuestion} "${k}"?`)) {
                        keywords.splice(i, 1);
                        setStoredKeywords(keywords);
                        location.reload();
                    }
                };

                div.appendChild(span);
            });
        }

        function showKeywordPreview() {
            const existing = document.getElementById('drops-nav-links');
            if (existing) existing.remove();
            const titleBar = document.querySelector('.title-bar');
            if (!titleBar || document.getElementById('keywords-preview')) return false;

            const preview = document.createElement('div');
            preview.id = 'keywords-preview';
            Object.assign(preview.style, {
                padding: '10px',
                marginTop: '10px',
                border: `2px dotted ${colors.green}`,
                borderRadius: '8px',
                color: colors.text,
                backgroundColor: colors.bg,
                fontSize: '14px',
                lineHeight: '1.5'
            });

            const divKeywords = document.createElement('div');
            divKeywords.style.minWidth = '800px';
            divKeywords.style.maxWidth = '1024px';
            divKeywords.innerHTML = `<strong>${t.currentKeywords}</strong><br>`;

            setKeywordsInDiv(divKeywords, keywords);

            // Botón para agregar nueva keyword
            const addBtn = getAddKeyword();
            divKeywords.appendChild(addBtn);

            divKeywords.appendChild(document.createElement('br'));
            divKeywords.appendChild(document.createElement('br'));
            divKeywords.innerHTML += `<em>${t.waitMessage}</em>`;

            preview.appendChild(divKeywords);

            const controls = document.createElement('div');
            controls.style.flex = '1 1 100%';
            controls.style.display = 'flex';
            controls.style.gap = '10px';
            controls.style.marginTop = '12px';

            controls.appendChild(createEditKeywordsButton(true));
            controls.appendChild(createResetKeywordsButton(true));
            controls.appendChild(createReloadButton(true));
            preview.appendChild(controls);

            const after = titleBar.querySelector('h2');
            if (after) after.insertAdjacentElement('afterend', preview);
            else titleBar.appendChild(preview);

            return true;
        }

        const CLOSED_HEADER_TEXTS = [
            'Campañas con drops cerradas', 'Campañas de drops cerradas', 'Closed Drop Campaigns',
            'Lukkede rovkampagner', 'Beendete Drop-Kampagnen', 'Campagnes de drops fermées',
            'Campagne Drop chiuse', 'Lezárt dropkampányok', 'Gesloten dropcampagnes',
            'Lukkede droppkampanjer', 'Zamknięte kampanie z dropami', 'Campanhas de drops encerradas',
            'Campanii de dropuri închise', 'Zatvorené kampane s dropmi', 'Suljetut droppikampanjat',
            'Stängda dropkampanjer', 'Các chiến dịch quà tặng đã đóng', 'Kapalı drop kampanyaları',
            'Zavřené kampaně s Drops', 'Κλειστές καμπάνιες Drop', 'Затворени кампании за Drop',
            'Закрытые кампании Drop', 'แคมเปญ Drops ที่ปิดแล้ว', 'حملات Drop المغلقة',
            '已关闭的掉宝活动', '已結束的掉寶活動', 'Dropsキャンペーンを閉じる', '종료된 드롭 캠페인'
        ];

        const ACTIVE_STYLE = `border: 4px solid #13ae0a !important; box-shadow: 0 0 30px #13ae0abb !important; border-radius: 16px !important; scroll-margin-top: 100px;`;
        const EXPIRED_STYLE = `border: 4px solid #ff4444 !important; box-shadow: 0 0 30px #ff4444bb !important; border-radius: 16px !important; scroll-margin-top: 100px;`;

        let active = [], expired = [], seenTitles = new Set(), idx = 0, reseted = false, textContentClickAfterClick = '';

        function highlightAndLinkDrops() {
            const keywords_preview = document.getElementById('keywords-preview');
            if (keywords_preview) keywords_preview.remove();
            const existing = document.getElementById('drops-nav-links');
            if (existing) existing.remove();

            active = [];
            expired = [];
            seenTitles = new Set();
            reseted = false;
            idx = 0;

            const closedHeader = Array.from(document.querySelectorAll('h4[class^="CoreText-sc"]'))
                .find(h => CLOSED_HEADER_TEXTS.some(text => h.textContent.trim().toLowerCase() === text.toLowerCase()));
            if (!closedHeader) return;

            const allNodes = Array.from(document.querySelectorAll('h4[class^="CoreText-sc"], div[class^="Layout-sc"]'));
            const closedIndex = allNodes.indexOf(closedHeader);

            allNodes.forEach((node, index) => {
                if (!(node instanceof HTMLElement)) return;
                if (!node.matches('div[class^="Layout-sc"]')) return;
                if (node.id?.startsWith('drop-match-')) return;
                if (node.querySelector('p[data-a-target="side-nav-title"]')) return;

                const ps = node.querySelectorAll('p[class^="CoreText-sc"]');
                if (ps.length !== 2) return;

                const titleP = ps[0];
                const style = window.getComputedStyle(titleP);
                if (style.fontWeight !== '600') return;

                const titleText = titleP.textContent.trim();
                const titleLc = titleText.toLowerCase();
                if (!keywords.some(k => titleLc.includes(k))) return;

                const isExpired = index > closedIndex;
                if (isExpired && !reseted) {
                    seenTitles = new Set();
                    reseted = true;
                }

                if (seenTitles.has(titleLc)) return;

                seenTitles.add(titleLc);
                const id = `drop-match-${idx++}`;
                node.id = id;
                node.setAttribute('style', isExpired ? EXPIRED_STYLE : ACTIVE_STYLE);
                const item = { title: titleText, id };
                (isExpired ? expired : active).push(item);
            });

            createNavigationLinks();

            if (textContentClickAfterClick !== "") {
                // Solo intenta hacer click después de al menos 10 intentos (unos 5 segundos)
                let attempts = 0;
                const clickInterval = setInterval(() => {
                    attempts++;
                    const clickA = document.querySelector(`a[data-title="${textContentClickAfterClick}"]`);
                    if (clickA) {
                        clickA.click();
                        textContentClickAfterClick = "";
                        clearInterval(clickInterval);
                    } else if (attempts >= 10) {
                        console.warn(`No se encontró el enlace para "${textContentClickAfterClick}" después de 10 intentos.`);
                        textContentClickAfterClick = "";
                        clearInterval(clickInterval);
                    }
                }, 500);
            }
        }

        function createNavigationLinks() {
            const titleBar = document.querySelector('.title-bar');
            if (!titleBar) return;

            const nav = document.createElement('div');
            nav.id = 'drops-nav-links';
            Object.assign(nav.style, {
                marginTop: '8px',
                padding: '10px',
                border: `2px dashed ${colors.green}`,
                borderRadius: '10px',
                color: colors.text,
                fontSize: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                backgroundColor: colors.bg
            });

            const divKeywords = document.createElement('div');
            divKeywords.style.minWidth = '800px';
            divKeywords.style.maxWidth = '1024px';
            divKeywords.innerHTML = `<strong>${t.currentKeywords}</strong><br>`;

            setKeywordsInDiv(divKeywords, keywords);

            // Botón para agregar nueva keyword
            const addBtn = getAddKeyword();
            divKeywords.appendChild(addBtn);

            nav.appendChild(divKeywords);

            const columns = document.createElement('div');
            Object.assign(columns.style, {
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
            });

            const createColumn = (title, items, color, icon) => {
                const col = document.createElement('div');
                col.style.flex = '1 1 45%';
                col.style.minWidth = '400px';
                col.style.maxWidth = '512px';

                const header = document.createElement('div');
                header.textContent = title;
                Object.assign(header.style, {
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: color
                });
                col.appendChild(header);

                const list = document.createElement('div');
                const needsScroll = items.length > 5;
                Object.assign(list.style, {
                    maxHeight: needsScroll ? '150px' : 'auto',
                    overflowY: needsScroll ? 'auto' : 'visible',
                    border: `1px dashed ${color}`,
                    paddingRight: '4px'
                });

                items.forEach(d => {
                    const a = document.createElement('a');
                    a.dataset.title = d.title;
                    a.dataset.color = color;
                    a.dataset.icon = icon;
                    a.textContent = `${icon} ${d.title}`;
                    Object.assign(a.style, {
                        display: 'block',
                        margin: '4px 0',
                        color: color,
                        fontWeight: '600',
                        textDecoration: 'none'
                    });
                    a.onmouseover = () => a.style.textDecoration = 'underline';
                    a.onmouseout = () => a.style.textDecoration = 'none';
                    a.onclick = (e) => {
                        if (actualPath === '/drops/inventory') {
                            const campaignsLink = document.querySelector('a[href="/drops/campaigns"]');
                            if (campaignsLink) {
                                campaignsLink.click();
                                textContentClickAfterClick = d.title;
                            }
                        }
                        else {
                            const target = document.getElementById(d.id);
                            if (target) {
                                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                                console.warn(`Element with ID ${d.id} not found.`);
                            }
                        }
                    }
                    list.appendChild(a);
                });

                col.appendChild(list);
                return col;
            };

            const existing = document.getElementById('keywords-preview');
            if (existing) existing.remove();

            if (active.length) columns.appendChild(createColumn(t.dropsActive, active, colors.green, '🔗'));
            if (expired.length) columns.appendChild(createColumn(t.dropsExpired, expired, colors.red, '❌'));
            if (!active.length && !expired.length)
                columns.appendChild(createColumn(t.dropsNone, [], colors.gray, '❌'));

            nav.appendChild(columns);

            const controls = document.createElement('div');
            controls.style.display = 'flex';
            controls.style.gap = '10px';
            controls.style.marginTop = '12px';

            controls.appendChild(createEditKeywordsButton());
            controls.appendChild(createResetKeywordsButton());
            controls.appendChild(createReloadButton());
            nav.appendChild(controls);

            const after = titleBar.querySelector('h2');
            if (after) after.insertAdjacentElement('afterend', nav);
            else titleBar.appendChild(nav);
        }

        function waitForDropsFunction() {
            const path = location.pathname;
            const isCampaigns = path.includes('/campaigns');
            const isInventory = path.includes('/inventory');
            actualPath = isCampaigns ? '/drops/campaigns' : isInventory ? '/drops/inventory' : '';
            let attempts = 0;
            let previewShown = false;
            const maxAttempts = isCampaigns ? 10 : 1;
            let waitForDrops = setInterval(() => {
                let found = 0;
                const seenTitles = new Set();

                document.querySelectorAll('div[class^="Layout-sc"]').forEach(container => {
                    if (!previewShown) {
                        previewShown = showKeywordPreview();
                    }

                    const ps = container.querySelectorAll('p[class^="CoreText-sc"]');
                    if (ps.length !== 2) return;

                    const titleP = ps[0];
                    const style = window.getComputedStyle(titleP);
                    if (style.fontWeight !== '600') return;

                    const text = titleP.textContent.trim().toLowerCase();
                    if (!keywords.some(k => text.includes(k))) return;
                    if (seenTitles.has(text)) return;

                    seenTitles.add(text);
                    found++;
                });

                if (found >= 1) {
                    clearInterval(waitForDrops);
                    highlightAndLinkDrops();
                } else {
                    attempts++;
                    let searchingElem = document.getElementById('searching-status');
                    const preview = document.getElementById('keywords-preview');
                    if (!searchingElem && preview) {
                        searchingElem = document.createElement('div');
                        searchingElem.id = 'searching-status';
                        Object.assign(searchingElem.style, {
                            color: colors.orange,
                            fontWeight: 'bold',
                            marginTop: '10px'
                        });
                        preview.appendChild(searchingElem);
                    }

                    if (searchingElem) {
                        searchingElem.textContent = `${t.searching}${'.'.repeat(attempts)}`;
                    }
                    if (attempts >= maxAttempts) {
                        clearInterval(waitForDrops);
                        if (!previewShown) showKeywordPreview();
                        if (searchingElem) searchingElem.remove();
                        if (!isInventory) {
                            const preview = document.getElementById('keywords-preview');
                            if (preview) {
                                const warn = document.createElement('div');
                                warn.id = 'no-results-warning';
                                warn.style.textAlign = 'center';
                                warn.textContent = t.noResults;
                                Object.assign(warn.style, {
                                    color: colors.red,
                                    fontWeight: 'bold',
                                    marginTop: '10px'
                                });
                                preview.appendChild(warn);
                            }
                        }
                    }
                }
            }, 500);
        }

        let actualPath = '';
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

            window.addEventListener('popstate', callback);
        }

        onUrlChange(() => {
            const newPath = location.pathname;
            if (newPath !== actualPath) {
                actualPath = newPath;
                if (newPath.startsWith('/drops/campaigns')) {
                    waitForDropsFunction();
                }
            }
        });

        waitForDropsFunction();
    });
})();
