/* Copyright 2026 PORTOKO
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl). */

import {reactive} from "@odoo/owl";
import {registry} from "@web/core/registry";

export const OPEN_CLASS = "ptk-home-open";

// Action service entry points that start a navigation.
const NAVIGATION_METHODS = ["doAction", "doActionButton", "switchView", "restore", "loadState"];

/**
 * Shared open/closed state of the PORTOKO home screen.
 * A service (not a bus event) so the web client can open the home screen
 * before or after the navbar mounts without losing the request.
 */
export const portokoHomeService = {
    dependencies: ["action"],
    start(env, {action}) {
        const state = reactive({open: false});
        // Every navigation gets a number. The home screen only closes for a
        // navigation that *started after it was opened*: a slow first app
        // finishing in the background must not slam the home shut under the
        // user's finger.
        let navigationSeq = 0;
        let openedAtSeq = 0;

        for (const name of NAVIGATION_METHODS) {
            const original = action[name];
            if (typeof original === "function") {
                action[name] = function () {
                    navigationSeq++;
                    return original.apply(this, arguments);
                };
            }
        }

        function setOpen(open) {
            open = Boolean(open);
            if (state.open === open) {
                return;
            }
            if (open) {
                openedAtSeq = navigationSeq;
            }
            state.open = open;
            document.body.classList.toggle(OPEN_CLASS, open);
            env.bus.trigger("PTK_HOME:CHANGED", open);
        }

        env.bus.addEventListener("ACTION_MANAGER:UI-UPDATED", () => {
            if (state.open && navigationSeq > openedAtSeq) {
                setOpen(false);
            }
        });

        return {
            state,
            /** True when closing would show an actual screen, not a blank page. */
            get canClose() {
                return Boolean(action.currentController);
            },
            open() {
                setOpen(true);
            },
            close() {
                if (this.canClose) {
                    setOpen(false);
                }
            },
            toggle() {
                if (state.open) {
                    this.close();
                } else {
                    this.open();
                }
            },
        };
    },
};

registry.category("services").add("portoko_home", portokoHomeService);
