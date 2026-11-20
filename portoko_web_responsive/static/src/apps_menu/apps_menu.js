/* Copyright 2026 PORTOKO
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).
 *
 * Full-screen home (all apps + menu search) replacing Odoo's apps dropdown.
 * Ideas taken from OCA web_responsive (LasLabs, Tecnativa, ITerra, Onestein,
 * Taras Shabaranskyi); code written from scratch for Odoo 18 and 19.
 */

import {Component, onWillUnmount, useEffect, useExternalListener, useRef, useState} from "@odoo/owl";
import {_t} from "@web/core/l10n/translation";
import {browser} from "@web/core/browser/browser";
import {useActiveElement} from "@web/core/ui/ui_service";
import {useBus, useService} from "@web/core/utils/hooks";
import {useHotkey} from "@web/core/hotkeys/hotkey_hook";
import {NavBar} from "@web/webclient/navbar/navbar";
import {clearUncommittedChanges} from "@web/webclient/actions/action_service";
import {buildIndex, searchMenus, MAX_QUERY_LENGTH} from "./search";
import {getAppIcon} from "./icons";

const LOADING_LOCK_MS = 15000;

export function menuHref(menu) {
    return `/odoo/${menu.actionPath || "action-" + menu.actionID}`;
}

/** Primary pointer is a finger (phone, tablet, scanner); touch laptops are not. */
export function isTouchFirst() {
    return Boolean(browser.matchMedia?.("(pointer: coarse)").matches);
}

function isModifiedClick(ev) {
    return ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey || ev.button === 1;
}

export class PortokoHomeScreen extends Component {
    static template = "portoko_web_responsive.HomeScreen";
    static props = {};

    setup() {
        this.home = useService("portoko_home");
        this.menuService = useService("menu");
        this.homeState = useState(this.home.state);
        this.state = useState({query: "", activeIndex: 0, loadingId: null, top: this._navbarBottom()});
        this.rootRef = useRef("root");
        this.searchRef = useRef("search");
        this.maxQueryLength = MAX_QUERY_LENGTH;
        this._index = null;
        this.loadingSince = 0;
        this.iconCache = new Map();

        useActiveElement("root");
        // Sit right under the navbar whatever its height (touch devices,
        // debug banners, custom themes) so the user menu stays reachable.
        useExternalListener(window, "resize", () => {
            this.state.top = this._navbarBottom();
        });
        // The navbar button is outside the active element, so the shortcut
        // has to be registered here too.
        useHotkey("alt+h", () => this.home.close(), {bypassEditableProtection: true});
        useBus(this.env.bus, "MENUS:APP-CHANGED", () => {
            this._index = null;
            this.iconCache.clear();
            this.render();
        });
        useEffect(
            () => {
                const input = this.searchRef.el;
                if (!input) {
                    return;
                }
                // Phones/scanners: never pop the on-screen keyboard just
                // because the home screen opened (useActiveElement focuses
                // the first tabbable element, which may be the input).
                if (isTouchFirst()) {
                    if (document.activeElement === input) {
                        input.blur();
                    }
                } else {
                    input.focus();
                }
            },
            () => []
        );
        useEffect(
            (activeIndex) => {
                const el = this.rootRef.el?.querySelector(`[data-result-index="${activeIndex}"]`);
                el?.scrollIntoView?.({block: "nearest"});
            },
            () => [this.state.activeIndex]
        );
        onWillUnmount(() => {
            this._index = null;
        });
    }

    _navbarBottom() {
        const nav = document.querySelector(".o_main_navbar");
        const bottom = nav ? Math.round(nav.getBoundingClientRect().bottom) : 0;
        return Math.max(0, Math.min(bottom, 120));
    }

    // ------------------------------------------------------------ data

    get apps() {
        return this.menuService.getApps().filter((app) => app);
    }

    get currentAppId() {
        return this.menuService.getCurrentApp()?.id;
    }

    get index() {
        if (!this._index) {
            this._index = buildIndex((id) => this.menuService.getMenu(id), this.apps);
        }
        return this._index;
    }

    get hasQuery() {
        return this.state.query.trim().length > 0;
    }

    get results() {
        return this.hasQuery ? searchMenus(this.index, this.state.query) : [];
    }

    get canClose() {
        return this.home.canClose;
    }

    icon(menu) {
        const app = menu.appID && menu.appID !== menu.id ? this.menuService.getMenu(menu.appID) : menu;
        const key = app ? app.id : menu.id;
        if (!this.iconCache.has(key)) {
            this.iconCache.set(key, getAppIcon(app || menu));
        }
        return this.iconCache.get(key);
    }

    href(menu) {
        return menuHref(menu);
    }

    get emptyTitle() {
        return _t("No menu matches “%s”", this.state.query.trim());
    }

    // ------------------------------------------------------------ actions

    async open(menu) {
        if (!menu || !menu.actionID) {
            return;
        }
        // Ignore impatient double taps while an app loads, but never lock the
        // screen for good if a navigation silently dies.
        if (this.state.loadingId && Date.now() - this.loadingSince < LOADING_LOCK_MS) {
            return;
        }
        this.state.loadingId = menu.id;
        this.loadingSince = Date.now();
        const token = this.loadingSince;
        const done = () => {
            if (this.homeState.open && this.loadingSince === token) {
                this.state.loadingId = null;
            }
        };
        // An unsaved form that cannot be saved (missing required field...)
        // blocks the navigation, and Odoo then never settles the action
        // promise. Ask first: if the form refuses, close the home screen so
        // the user sees the highlighted fields and Odoo's message.
        let canLeave = false;
        try {
            canLeave = await clearUncommittedChanges(this.env);
        } catch {
            canLeave = false;
        }
        if (!canLeave) {
            done();
            this.home.close();
            return;
        }
        try {
            await this.menuService.selectMenu(menu);
        } catch (error) {
            // Odoo 18 keeps a failed /web/action/load (e.g. offline) in its
            // action cache, so the same app would never open again until a
            // page reload. Drop the caches so the next tap retries for real.
            this.env.bus.trigger("CLEAR-CACHES");
            throw error;
        } finally {
            done();
        }
    }

    onItemClick(ev, menu) {
        if (isModifiedClick(ev)) {
            return; // let the browser open a new tab/window
        }
        ev.preventDefault();
        this.open(menu);
    }

    onInput(ev) {
        const value = ev.target.value;
        if (value.length > MAX_QUERY_LENGTH) {
            ev.target.value = value.slice(0, MAX_QUERY_LENGTH);
        }
        this.state.query = ev.target.value;
        this.state.activeIndex = 0;
    }

    onResultHover(index) {
        if (this.state.activeIndex !== index) {
            this.state.activeIndex = index;
        }
    }

    clearQuery() {
        this.state.query = "";
        this.state.activeIndex = 0;
        const input = this.searchRef.el;
        if (input) {
            // Fast typists: the last keystroke may not be rendered yet, so
            // the template alone would not notice the value changed.
            input.value = "";
            input.focus();
        }
    }

    // ------------------------------------------------------------ keyboard

    _tiles() {
        return [...(this.rootRef.el?.querySelectorAll(".ptk-tile") || [])];
    }

    _moveTileFocus(key) {
        const tiles = this._tiles();
        if (!tiles.length) {
            return;
        }
        const current = tiles.indexOf(document.activeElement);
        if (current === -1) {
            tiles[0].focus();
            return;
        }
        let next = current;
        if (key === "ArrowRight") {
            next = (current + 1) % tiles.length;
        } else if (key === "ArrowLeft") {
            next = (current - 1 + tiles.length) % tiles.length;
        } else {
            // Up/Down follow the visual grid: same column, previous/next row.
            const top = tiles[current].offsetTop;
            const left = tiles[current].offsetLeft;
            const rows = [...new Set(tiles.map((t) => t.offsetTop))].sort((a, b) => a - b);
            const rowIdx = rows.indexOf(top) + (key === "ArrowDown" ? 1 : -1);
            if (rowIdx < 0) {
                this.searchRef.el?.focus();
                return;
            }
            if (rowIdx >= rows.length) {
                return;
            }
            const row = tiles.filter((t) => t.offsetTop === rows[rowIdx]);
            next = tiles.indexOf(
                row.reduce((best, t) =>
                    Math.abs(t.offsetLeft - left) < Math.abs(best.offsetLeft - left) ? t : best
                )
            );
        }
        tiles[next].focus();
    }

    onKeydown(ev) {
        const key = ev.key;
        const inSearch = ev.target === this.searchRef.el;
        if (ev.isComposing) {
            return; // IME (e.g. Chinese/Japanese input) still composing
        }
        if (key === "Escape") {
            ev.preventDefault();
            ev.stopPropagation();
            if (this.state.query) {
                this.clearQuery();
            } else {
                this.home.close();
            }
            return;
        }
        if (this.hasQuery) {
            const count = this.results.length;
            if (key === "ArrowDown" || key === "ArrowUp") {
                ev.preventDefault();
                if (count) {
                    const delta = key === "ArrowDown" ? 1 : -1;
                    this.state.activeIndex = (this.state.activeIndex + delta + count) % count;
                }
            } else if (key === "Enter" && inSearch) {
                ev.preventDefault();
                const result = this.results[Math.min(this.state.activeIndex, count - 1)];
                if (result) {
                    this.open(result.menu);
                }
            }
            return;
        }
        if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(key)) {
            if (inSearch && (key === "ArrowLeft" || key === "ArrowRight")) {
                return; // move the caret
            }
            if (inSearch && key === "ArrowUp") {
                return;
            }
            ev.preventDefault();
            if (inSearch) {
                this._tiles()[0]?.focus();
            } else {
                this._moveTileFocus(key);
            }
            return;
        }
        // Start typing anywhere = search.
        if (
            !inSearch &&
            key.length === 1 &&
            !ev.ctrlKey &&
            !ev.metaKey &&
            !ev.altKey &&
            this.searchRef.el
        ) {
            this.searchRef.el.focus();
        }
    }
}

export class PortokoAppsMenu extends Component {
    static template = "portoko_web_responsive.AppsMenu";
    static components = {PortokoHomeScreen};
    static props = {};

    setup() {
        this.home = useService("portoko_home");
        this.homeState = useState(this.home.state);
        this.label = _t("Home");
    }

    onToggle() {
        this.home.toggle();
    }
}

Object.assign(NavBar.components, {PortokoAppsMenu});
