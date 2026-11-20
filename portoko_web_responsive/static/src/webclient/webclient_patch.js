/* Copyright 2026 PORTOKO
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl). */

import {patch} from "@web/core/utils/patch";
import {session} from "@web/session";
import {WebClient} from "@web/webclient/webclient";

patch(WebClient.prototype, {
    /**
     * Only called when the URL points to no action (plain /odoo after login),
     * so deep links to a record or menu are never hijacked.
     */
    _loadDefaultApp() {
        if (session.portoko_ui?.home_on_login) {
            this.env.services.portoko_home.open();
            return;
        }
        return super._loadDefaultApp(...arguments);
    },
});
