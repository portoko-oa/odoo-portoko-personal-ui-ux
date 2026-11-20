from odoo.tests import HttpCase, tagged


@tagged("post_install", "-at_install")
class TestPortokoUiBrowser(HttpCase):
    """Real browser checks: the showcase renders every component, the status widget renders in a list."""

    def test_showcase_renders(self):
        code = """
            const wait = async (sel, ms = 15000) => {
                const t0 = Date.now();
                while (Date.now() - t0 < ms) {
                    const el = document.querySelector(sel);
                    if (el) return el;
                    await new Promise((r) => setTimeout(r, 100));
                }
                throw new Error("not found: " + sel);
            };
            (async () => {
                try {
                    await wait(".ptk-showcase .ptk-header");
                    if (!document.getElementById("ptk-ornament-sprite")) throw new Error("ornament sprite not mounted");
                    for (const id of ["ptk-sd", "ptk-pg", "ptk-em", "ptk-aw", "ptk-px-kw"]) {
                        if (!document.getElementById(id)) throw new Error("missing symbol " + id);
                    }
                    const counts = {
                        status: document.querySelectorAll(".ptk-showcase .ptk-status").length,
                        emblems: document.querySelectorAll(".ptk-showcase use[href='#ptk-em']").length,
                        scan: document.querySelectorAll(".ptk-showcase .ptk-scan-ok").length,
                    };
                    if (counts.status < 4 || counts.emblems < 8 || counts.scan !== 1) throw new Error("components missing " + JSON.stringify(counts));
                    const header = document.querySelector(".ptk-header");
                    const bg = getComputedStyle(header).backgroundColor;
                    if (bg !== "rgb(217, 255, 92)") throw new Error("barcode header colour wrong: " + bg);
                    const title = getComputedStyle(header.querySelector(".ptk-header-title")).fontFamily;
                    if (!title.includes("Silkscreen")) throw new Error("display font not applied: " + title);
                    const body = getComputedStyle(document.querySelector(".ptk-showcase")).fontFamily;
                    if (!body.includes("Atkinson Hyperlegible Next")) throw new Error("body font not applied: " + body);
                    await document.fonts.ready;
                    if (!document.fonts.check('16px "Atkinson Hyperlegible Next"')) throw new Error("Atkinson font file did not load");
                    if (!document.fonts.check('16px "Atkinson Hyperlegible Mono"')) throw new Error("Atkinson Mono font file did not load");
                    const art = document.querySelector(".ptk-empty-art use");
                    if (!art || !art.getAttribute("style").includes("--px:#d9ff5c")) throw new Error("empty-state ornament not visible on its ground");
                    // switch module, header recolours
                    [...document.querySelectorAll(".ptk-showcase .ptk-pill")].find((b) => b.textContent.includes("Forecast")).click();
                    await new Promise((r) => setTimeout(r, 300));
                    const bg2 = getComputedStyle(document.querySelector(".ptk-header")).backgroundColor;
                    if (bg2 !== "rgb(36, 48, 184)") throw new Error("forecast header colour wrong: " + bg2);
                    // scan warn then ok
                    const btns = [...document.querySelectorAll(".ptk-showcase button.ptk-btn")];
                    btns.find((b) => b.textContent.trim() === "Lebih").click();
                    await wait(".ptk-scan-warn");
                    btns.find((b) => b.textContent.trim() === "Scan OK").click();
                    await wait(".ptk-scan-ok");
                    if (!document.querySelector(".ptk-scan-qty").textContent.includes("1/20")) throw new Error("qty did not count");
                    console.log("test successful");
                } catch (e) {
                    console.error(e.message);
                }
            })();
        """
        self.browser_js("/odoo/action-portoko_ui.action_portoko_ui_showcase", code, login="admin", timeout=90)

    def test_status_widget_in_list(self):
        self.env["res.partner"].create([
            {"name": "PTK contact", "type": "contact"},
            {"name": "PTK delivery", "type": "delivery"},
            {"name": "PTK other", "type": "other"},
        ])
        view = self.env["ir.ui.view"].create({
            "name": "ptk status test list",
            "model": "res.partner",
            "type": "list",
            "priority": 1,
            "arch": """
                <list>
                    <field name="name"/>
                    <field name="type" widget="ptk_status"
                           options="{'ok': ['contact'], 'warn': ['delivery'], 'stop': ['other']}"/>
                </list>
            """,
        })
        action = self.env["ir.actions.act_window"].create({
            "name": "PTK status test",
            "res_model": "res.partner",
            "view_mode": "list",
            "view_id": view.id,
            "domain": [("name", "like", "PTK ")],
        })
        code = """
            (async () => {
                try {
                    const t0 = Date.now();
                    while (Date.now() - t0 < 15000 && !document.querySelector(".o_list_view .ptk-status")) {
                        await new Promise((r) => setTimeout(r, 100));
                    }
                    const states = [...document.querySelectorAll(".o_list_view .ptk-status")].map((s) => s.dataset.ptkState);
                    for (const s of ["ok", "warn", "stop"]) {
                        if (!states.includes(s)) throw new Error("state not rendered: " + s + " in " + states.join(","));
                    }
                    const chip = document.querySelector('.o_list_view .ptk-status[data-ptk-state="stop"]');
                    if (!chip.querySelector("svg")) throw new Error("status chip has no icon");
                    if (!chip.textContent.trim()) throw new Error("status chip has no text");
                    console.log("test successful");
                } catch (e) {
                    console.error(e.message);
                }
            })();
        """
        self.browser_js(f"/odoo/action-{action.id}", code, login="admin", timeout=90)
