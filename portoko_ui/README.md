# PORTOKO UI (`portoko_ui`)

The PORTOKO design system as an Odoo 18 addon. Every PORTOKO module depends on it, so they all share one look: bold colour per module, batik on the edges, screens built for warehouse hands.

Installing it changes nothing on standard Odoo screens. Every rule is opt-in, behind a `.ptk*` class or a `data-ptk-module` attribute. A test enforces that.

Design system reference: https://claude.ai/artifact/6CAQw8gjGDGxVM4ARAm18c

## What's inside

| Part | Where | Use it for |
| --- | --- | --- |
| Tokens (SCSS) | `static/src/scss/primary_variables.scss` | `$ptk-*` variables in your module's SCSS, including `$ptk-orn-tumpal` and `$ptk-orn-kawung` (ornament tiles for CSS backgrounds). Loaded before web's own variables, so you can map them onto Odoo's `!default`s |
| Tokens (CSS) | `static/src/scss/tokens.scss` | `var(--ptk-*)` at runtime; `data-ptk-module` sets `--ptk-module*` |
| Fonts | `static/fonts/` | Atkinson Hyperlegible Next (body), Atkinson Hyperlegible Mono (numbers, SKUs), Silkscreen (display). Bundled, works offline, SIL OFL 1.1 |
| Components (CSS) | `static/src/scss/components.scss` | `.ptk-btn`, `.ptk-pill`, `.ptk-status-*`, `.ptk-scan-*`, `.ptk-header`, `.ptk-kpi`, `.ptk-empty`, `.ptk-stepper`, `.ptk-table` |
| Components (OWL) | `static/src/components/ptk_components.js` | `PtkModuleHeader`, `PtkScanFeedback`, `PtkStatusChip`, `PtkKpi`, `PtkEmptyState`, `PtkEmblem`, `PtkOrnament` |
| Field widget | `widget="ptk_status"` | Status chips in list and form views |
| Service | `useService("portoko_ui")` | `feedback("ok"\|"done"\|"warn"\|"stop"\|"tap", {el})`: sound + vibration + flash |
| Ornaments | `static/src/js/ornaments.js` | SVG sprite: `pg` pinggiran, `sd` sudut, `em` emblem, `dv` pembatas, `aw` awan, pixel `px-kw` `px-cp` `px-aw` `px-tps` |
| Showcase | Settings › Technical › PORTOKO UI | Every component live, for review |

## Use it in a module

```python
# __manifest__.py
"depends": ["stock", "portoko_ui"],
```

```js
import { PtkModuleHeader, PtkScanFeedback } from "@portoko_ui/components/ptk_components";
import { useService } from "@web/core/utils/hooks";

class ReceiveScreen extends Component {
    static template = "my_module.ReceiveScreen";
    static components = { PtkModuleHeader, PtkScanFeedback };
    setup() {
        this.ptk = useService("portoko_ui");
    }
    onScan(ok) {
        this.ptk.feedback(ok ? "ok" : "stop", { el: this.resultRef.el });
    }
}
```

```xml
<div data-ptk-module="barcode">
    <PtkModuleHeader module="'barcode'" title="'Terima'" subtitle="picking.name"/>
    <PtkScanFeedback state="'ok'" title="'Scan OK'" text="line.product" qty="line.done + '/' + line.qty"/>
    <button class="ptk-btn ptk-btn-module ptk-btn-xl ptk-btn-block">SCAN <span class="ptk-key">F2</span></button>
</div>
```

Status widget in any view:

```xml
<field name="state" widget="ptk_status"
       options="{'ok': ['done'], 'warn': ['waiting', 'confirmed'], 'stop': ['cancel']}"/>
```

## Rules (short)

- One colour per module: `barcode`, `pos`, `forecast`, `bi`. Text on a module colour uses its pair (`--ptk-module-ink`); never white on `pos` or `barcode`.
- Status is always text + icon + colour.
- Targets: 48px minimum (`--ptk-target-min`), 64px for the main action.
- Ornaments only on headers, edges, empty states. Never behind numbers, tables or forms.
- Glow means state (scan OK, selected), never decoration.
- Full rules: the design system README and Ornamen section.

## Tests

`odoo-bin -i portoko_ui --test-enable --test-tags /portoko_ui`: bundles compile with the tokens, all SCSS is opt-in, fonts ship, the showcase renders and reacts in a real browser, and the status widget renders ok/warn/stop in a list view.
