from odoo.tests import TransactionCase, tagged


@tagged("post_install", "-at_install")
class TestPortokoUiAssets(TransactionCase):
    """The bundles compile and carry the design system, without touching Odoo's own styles."""

    def _css(self, bundle_name):
        bundle = self.env["ir.qweb"]._get_asset_bundle(bundle_name, css=True, js=False)
        return bundle.css().raw.decode()

    def test_backend_css_compiles_with_tokens(self):
        css = self._css("web.assets_backend")
        self.assertNotIn("A css error occured", css)
        for needle in ("--ptk-paper", "--ptk-module", ".ptk-status-ok", ".ptk-header", "Silkscreen", "Atkinson Hyperlegible Next", "Atkinson Hyperlegible Mono"):
            self.assertIn(needle, css, f"{needle} missing from web.assets_backend")

    def test_frontend_css_compiles(self):
        css = self._css("web.assets_frontend")
        self.assertNotIn("A css error occured", css)
        self.assertIn("--ptk-paper", css)

    def test_components_are_opt_in(self):
        """Installing portoko_ui must not restyle standard Odoo: our SCSS targets only .ptk* and data-ptk* hooks."""
        import re
        from odoo.tools.misc import file_open
        for path in ("portoko_ui/static/src/scss/components.scss", "portoko_ui/static/src/scss/tokens.scss"):
            with file_open(path) as f:
                src = re.sub(r"//[^\n]*", "", f.read())
                src = re.sub(r"#\{[^}]*\}", "X", src)
            selectors = re.findall(r"(?m)^\s*([^@{}\n][^{}\n]*?)\s*\{", src)
            for sel in selectors:
                sel = sel.strip()
                if sel.startswith(("from", "to", "0%", "100%", "&", ":root", "*", "svg", "th", "td", "tbody", "button", "output", "@")) or sel[0].isdigit():
                    continue
                self.assertTrue(sel.startswith((".ptk", "[data-ptk")), f"{path}: '{sel}' is not behind a ptk hook")

    def test_backend_js_registers_everything(self):
        bundle = self.env["ir.qweb"]._get_asset_bundle("web.assets_backend", css=False, js=True)
        js = bundle.js().raw.decode()
        for needle in ('"portoko_ui"', '"ptk_status"', '"portoko_ui.showcase"', "ptk-ornament-sprite"):
            self.assertIn(needle, js, f"{needle} missing from the backend JS bundle")

    def test_fonts_are_bundled(self):
        for path in (
            "portoko_ui/static/fonts/AtkinsonHyperlegibleNext-Variable.woff2",
            "portoko_ui/static/fonts/AtkinsonHyperlegibleMono-Variable.woff2",
            "portoko_ui/static/fonts/Silkscreen-Bold.woff2",
        ):
            from odoo.tools.misc import file_path
            self.assertTrue(file_path(path))
