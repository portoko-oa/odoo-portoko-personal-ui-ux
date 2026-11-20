/** @odoo-module **/
import { Component } from "@odoo/owl";
import { MODULE_COLORS, ORNAMENT_VIEWBOX } from "../js/ornaments";

const MODULES = ["barcode", "pos", "forecast", "bi", "brand"];
const STATES = ["ok", "warn", "stop", "none"];

/** One batik ornament from the sprite. Decorative: always aria-hidden. */
export class PtkOrnament extends Component {
    static template = "portoko_ui.Ornament";
    static props = {
        name: { type: String, validate: (n) => n in ORNAMENT_VIEWBOX },
        ln: { type: String, optional: true },
        fl: { type: String, optional: true },
        dt: { type: String, optional: true },
        bg: { type: String, optional: true },
        px: { type: String, optional: true },
        class: { type: String, optional: true },
        style: { type: String, optional: true },
    };
    get viewBox() {
        return ORNAMENT_VIEWBOX[this.props.name] || undefined;
    }
    get useStyle() {
        return ["ln", "fl", "dt", "bg", "px"]
            .filter((k) => this.props[k])
            .map((k) => `--${k}:${this.props[k]}`)
            .join(";");
    }
}

/** A module's kawung emblem in its own colours. */
export class PtkEmblem extends Component {
    static template = "portoko_ui.Emblem";
    static components = { PtkOrnament };
    static props = {
        module: { type: String, validate: (m) => MODULES.includes(m) },
        size: { type: Number, optional: true },
    };
    static defaultProps = { size: 48 };
    get c() {
        return MODULE_COLORS[this.props.module];
    }
}

/** The one loud place on a work screen: module colour, Silkscreen title, sulur corner, tumpal hem. */
export class PtkModuleHeader extends Component {
    static template = "portoko_ui.ModuleHeader";
    static components = { PtkOrnament };
    static props = {
        module: { type: String, validate: (m) => MODULES.includes(m) },
        title: String,
        subtitle: { type: String, optional: true },
        ornaments: { type: Boolean, optional: true },
        slots: { type: Object, optional: true },
    };
    static defaultProps = { ornaments: true };
    get c() {
        return MODULE_COLORS[this.props.module];
    }
}

/** Universal status: text + icon + colour, never colour alone. */
export class PtkStatusChip extends Component {
    static template = "portoko_ui.StatusChip";
    static props = {
        state: { type: String, validate: (s) => STATES.includes(s) },
        label: String,
    };
}

/** Answers "did that scan count?" */
export class PtkScanFeedback extends Component {
    static template = "portoko_ui.ScanFeedback";
    static components = { PtkOrnament, PtkStatusChip };
    static props = {
        state: { type: String, validate: (s) => ["ok", "warn", "stop"].includes(s) },
        title: String,
        text: { type: String, optional: true },
        qty: { type: String, optional: true },
    };
}

export class PtkKpi extends Component {
    static template = "portoko_ui.Kpi";
    static props = {
        label: String,
        value: String,
        note: { type: String, optional: true },
        tone: { type: String, optional: true, validate: (t) => ["ok", "warn", "muted"].includes(t) },
    };
    static defaultProps = { tone: "muted" };
}

/** Say why it's empty and what to do next. */
export class PtkEmptyState extends Component {
    static template = "portoko_ui.EmptyState";
    static components = { PtkOrnament };
    static props = {
        module: { type: String, optional: true, validate: (m) => MODULES.includes(m) },
        title: String,
        text: { type: String, optional: true },
        slots: { type: Object, optional: true },
    };
    static defaultProps = { module: "brand" };
    get c() {
        return MODULE_COLORS[this.props.module];
    }
}
