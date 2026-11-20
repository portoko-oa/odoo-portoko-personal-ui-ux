{
    "name": "PORTOKO UI",
    "summary": "PORTOKO design system for Odoo: tokens, fonts, batik ornaments, "
               "components, status widget and scan feedback",
    "version": "18.0.1.2.0",
    "category": "Hidden/Tools",
    "author": "PORTOKO",
    "website": "https://portoko.com",
    "license": "LGPL-3",
    "depends": ["web"],
    "data": [
        "views/portoko_ui_menus.xml",
    ],
    "assets": {
        "web._assets_primary_variables": [
            # Before web's own variables, so a module that depends on
            # portoko_ui can use $ptk-* when it overrides Odoo's !defaults.
            (
                "before",
                "web/static/src/scss/primary_variables.scss",
                "portoko_ui/static/src/scss/primary_variables.scss",
            ),
        ],
        "web.assets_backend": [
            "portoko_ui/static/src/scss/fonts.scss",
            "portoko_ui/static/src/scss/tokens.scss",
            "portoko_ui/static/src/scss/components.scss",
            "portoko_ui/static/src/js/**/*",
            "portoko_ui/static/src/components/**/*",
            "portoko_ui/static/src/fields/**/*",
            "portoko_ui/static/src/showcase/**/*",
        ],
        "web.assets_frontend": [
            "portoko_ui/static/src/scss/fonts.scss",
            "portoko_ui/static/src/scss/tokens.scss",
            "portoko_ui/static/src/scss/components.scss",
        ],
    },
    "installable": True,
    "application": False,
}
