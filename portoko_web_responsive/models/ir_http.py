# Copyright 2026 PORTOKO
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).

from odoo import models


class IrHttp(models.AbstractModel):
    _inherit = "ir.http"

    def session_info(self):
        result = super().session_info()
        user = self.env.user
        if user and user._is_internal():
            result["portoko_ui"] = user._ptk_ui_settings()
        return result
