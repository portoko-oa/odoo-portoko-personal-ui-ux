/* Copyright 2026 PORTOKO
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).
 *
 * User preference for where the chatter goes:
 *   auto   Odoo default (side panel from XXL: 1534px on 18, 1400px on 19)
 *   side   side panel from 1200px (fits 1366px office laptops)
 *   bottom always under the form
 */

import {patch} from "@web/core/utils/patch";
import {session} from "@web/session";
import {SIZES} from "@web/core/ui/ui_service";
import {FormController} from "@web/views/form/form_controller";
import {FormRenderer} from "@web/views/form/form_renderer";

export function chatterPosition() {
    const pos = session.portoko_ui?.chatter_position;
    return ["side", "bottom"].includes(pos) ? pos : "auto";
}

/** Should the form use the two-column (sheet | chatter) layout? */
export function useSideLayout(size, inDialog) {
    if (inDialog) {
        return false;
    }
    const pos = chatterPosition();
    if (pos === "bottom") {
        return false;
    }
    if (pos === "side") {
        return size >= SIZES.XL;
    }
    return size >= SIZES.XXL;
}

const TO_BOTTOM = {
    SIDE_CHATTER: "BOTTOM_CHATTER",
    EXTERNAL_COMBO_XXL: "EXTERNAL_COMBO",
};
const TO_SIDE = {
    BOTTOM_CHATTER: "SIDE_CHATTER",
    EXTERNAL_COMBO: "EXTERNAL_COMBO_XXL",
};

patch(FormRenderer.prototype, {
    mailLayout() {
        const layout = super.mailLayout(...arguments);
        const pos = chatterPosition();
        if (pos === "auto" || typeof layout !== "string") {
            return layout;
        }
        const side = useSideLayout(this.uiService?.size, this.env.inDialog);
        if (!side && TO_BOTTOM[layout]) {
            return TO_BOTTOM[layout];
        }
        if (side && TO_SIDE[layout]) {
            return TO_SIDE[layout];
        }
        // "COMBO" (attachment preview on the side) only exists at XXL; when
        // the user wants the chatter at the bottom, drop the preview layout.
        if (!side && layout === "COMBO") {
            return "BOTTOM_CHATTER";
        }
        return layout;
    },
});

patch(FormController.prototype, {
    get className() {
        const result = super.className;
        if (chatterPosition() === "auto") {
            return result;
        }
        const side = useSideLayout(this.ui.size, this.env.inDialog);
        for (const key of Object.keys(result)) {
            if (key.startsWith("o_xxl_form_view")) {
                delete result[key];
            }
        }
        if (side) {
            result["o_xxl_form_view h-100 ptk-side-chatter"] = true;
        } else if (chatterPosition() === "bottom") {
            // The renderer still turns into a row at XXL; CSS stacks it back.
            result["ptk-bottom-chatter"] = true;
        }
        return result;
    },
});
