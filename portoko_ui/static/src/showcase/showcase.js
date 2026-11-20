/** @odoo-module **/
import { Component, useRef, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import {
    PtkEmblem,
    PtkEmptyState,
    PtkKpi,
    PtkModuleHeader,
    PtkOrnament,
    PtkScanFeedback,
    PtkStatusChip,
} from "../components/ptk_components";

/** Settings > Technical > PORTOKO UI: every component live, for developers and reviewers. */
export class PtkShowcase extends Component {
    static template = "portoko_ui.Showcase";
    static components = { PtkEmblem, PtkEmptyState, PtkKpi, PtkModuleHeader, PtkOrnament, PtkScanFeedback, PtkStatusChip };
    static props = ["*"];

    setup() {
        this.ptk = useService("portoko_ui");
        this.scanRef = useRef("scan");
        this.modules = [
            { id: "barcode", title: "Terima", sub: "WH/IN/00482 · CV Sumber Kertas" },
            { id: "pos", title: "POS", sub: "Kasir 02 · shift pagi" },
            { id: "forecast", title: "Forecast", sub: "8 minggu ke depan · Bandung" },
            { id: "bi", title: "BI Studio", sub: "Margin per cabang" },
        ];
        this.state = useState({ module: "barcode", qty: 0, scan: "ok" });
    }
    get current() {
        return this.modules.find((m) => m.id === this.state.module);
    }
    pick(id) {
        this.state.module = id;
        this.ptk.feedback("tap", { vibrate: false });
    }
    scan(kind) {
        this.state.scan = kind;
        if (kind === "ok") {
            this.state.qty = Math.min(20, this.state.qty + 1);
        }
        this.ptk.feedback(kind === "ok" && this.state.qty === 20 ? "done" : kind, { el: this.scanRef.el });
    }
    get scanTitle() {
        return { ok: "Scan OK", warn: "Lebih dari PO · cek fisik", stop: "Bukan di PO ini" }[this.state.scan];
    }
}

registry.category("actions").add("portoko_ui.showcase", PtkShowcase);
