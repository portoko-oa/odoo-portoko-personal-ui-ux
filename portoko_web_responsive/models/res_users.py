# Copyright 2026 PORTOKO
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).

from odoo import fields, models

PTK_USER_FIELDS = ["ptk_home_on_login", "ptk_chatter_position"]


class ResUsers(models.Model):
    _inherit = "res.users"

    ptk_home_on_login = fields.Boolean(
        string="Open Home Screen After Login",
        help="Show the PORTOKO home screen (all apps) after signing in, "
        "instead of opening the first app. Links that point to a "
        "specific record or menu still open directly.",
    )
    ptk_chatter_position = fields.Selection(
        [
            ("auto", "Automatic"),
            ("side", "Side (wide screens)"),
            ("bottom", "Bottom"),
        ],
        string="Chatter Position",
        default="auto",
        required=True,
        help="Automatic: Odoo default (side panel only on very wide screens).\n"
        "Side: side panel from 1200px wide, useful on 1366px laptops.\n"
        "Bottom: always below the form.",
    )

    @property
    def SELF_READABLE_FIELDS(self):
        return super().SELF_READABLE_FIELDS + PTK_USER_FIELDS

    @property
    def SELF_WRITEABLE_FIELDS(self):
        return super().SELF_WRITEABLE_FIELDS + PTK_USER_FIELDS

    def _ptk_ui_settings(self):
        """Settings the web client needs, read with sudo so that a user
        without access to res.users (portal-like internal users) never
        breaks the web client."""
        self.ensure_one()
        user = self.sudo()
        position = user.ptk_chatter_position
        if position not in ("auto", "side", "bottom"):
            position = "auto"
        return {
            "home_on_login": bool(user.ptk_home_on_login),
            "chatter_position": position,
        }
