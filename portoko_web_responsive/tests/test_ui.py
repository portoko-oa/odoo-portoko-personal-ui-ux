# Copyright 2026 PORTOKO
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).

import re

from odoo.tests import HttpCase, tagged


@tagged("post_install", "-at_install")
class TestPortokoUi(HttpCase):
    def test_home_screen_tour(self):
        self.start_tour("/odoo", "portoko_web_responsive_home", login="admin")

    def _bundle_css(self, name):
        bundle = self.env["ir.qweb"]._get_asset_bundle(name, css=True, js=False)
        return b"".join(att.raw or b"" for att in bundle.css()).decode()

    def test_backend_assets_only(self):
        """The Odoo overrides (fonts, paper ground, pill buttons) reach the
        backend bundle only: PDF reports and the website/portal keep their
        own look. portoko_ui may still ship its opt-in tokens to the
        frontend; those change nothing on their own."""
        body_font = re.compile(
            r'font-family:\s*"Atkinson Hyperlegible Next",\s*-apple-system'
        )
        paper_bg = re.compile(r"(?<![-\w])background(-color)?:\s*#eeede8", re.I)
        backend_css = self._bundle_css("web.assets_backend")
        self.assertIn("ptk-home", backend_css)
        self.assertRegex(backend_css, body_font)
        self.assertRegex(backend_css, paper_bg)
        for name in ("web.report_assets_common", "web.assets_frontend"):
            css = self._bundle_css(name)
            self.assertNotIn("ptk-home", css, name)
            self.assertNotRegex(css, body_font, name)
            self.assertNotRegex(css, paper_bg, name)

    def test_tokens_from_portoko_ui(self):
        """Tokens and fonts have one source: portoko_ui. This module ships
        no fonts and no copy of the tokens."""
        backend_css = self._bundle_css("web.assets_backend")
        self.assertIn("Atkinson Hyperlegible Next", backend_css)
        self.assertIn("/portoko_ui/static/fonts/", backend_css)
        self.assertNotIn("Geist", backend_css)
        self.assertNotIn("/portoko_web_responsive/static/src/fonts/", backend_css)
        module = self.env["ir.module.module"].search(
            [("name", "=", "portoko_web_responsive")]
        )
        self.assertIn("portoko_ui", module.dependencies_id.mapped("name"))
