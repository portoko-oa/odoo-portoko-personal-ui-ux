# Copyright 2026 PORTOKO
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).
{
    "name": "PORTOKO Web Responsive",
    "summary": "Responsive backend with the PORTOKO look: full-screen home, "
    "menu search, touch-sized controls, chatter position",
    "version": "18.0.1.1.0",
    "category": "Hidden/Tools",
    "website": "https://portoko.com",
    "author": "PORTOKO",
    "license": "LGPL-3",
    "depends": ["web", "mail", "portoko_ui"],
    "excludes": ["web_enterprise", "web_responsive"],
    "data": [
        "views/res_users_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            # Tokens and fonts come from portoko_ui. Only the backend gets
            # the Odoo overrides below (not reports, not website/portal).
            (
                "before",
                "web/static/src/scss/primary_variables.scss",
                "portoko_web_responsive/static/src/scss/primary_variables.scss",
            ),
            "portoko_web_responsive/static/src/scss/theme.scss",
            "portoko_web_responsive/static/src/scss/responsive.scss",
            "portoko_web_responsive/static/src/apps_menu/*",
            "portoko_web_responsive/static/src/webclient/*",
            "portoko_web_responsive/static/src/form/*",
        ],
        "web.assets_tests": [
            "portoko_web_responsive/static/tests/tours/*.js",
        ],
    },
    "images": ["static/description/icon.png"],
    "installable": True,
}
