/** @odoo-module **/
import { registry } from "@web/core/registry";
import { mountOrnaments, MODULE_COLORS } from "./ornaments";
import { feedback, flash } from "./feedback";

/**
 * The "portoko_ui" service: mounts the ornament sprite once and exposes feedback helpers.
 *   const ptk = useService("portoko_ui");
 *   ptk.feedback("ok", { el });
 */
export const portokoUiService = {
    start() {
        mountOrnaments();
        return {
            feedback,
            flash,
            modules: MODULE_COLORS,
            mountOrnaments,
        };
    },
};

registry.category("services").add("portoko_ui", portokoUiService);
