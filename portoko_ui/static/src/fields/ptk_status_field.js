/** @odoo-module **/
import { _t } from "@web/core/l10n/translation";
import { registry } from "@web/core/registry";
import { standardFieldProps } from "@web/views/fields/standard_field_props";
import { Component } from "@odoo/owl";

const formatters = registry.category("formatters");

/**
 * <field name="state" widget="ptk_status"
 *        options="{'ok': ['done'], 'warn': ['waiting', 'confirmed'], 'stop': ['cancel']}"/>
 * Values not listed show as neutral. Always renders text + icon + colour.
 */
export class PtkStatusField extends Component {
    static template = "portoko_ui.PtkStatusField";
    static props = {
        ...standardFieldProps,
        ok: { type: Array, optional: true },
        warn: { type: Array, optional: true },
        stop: { type: Array, optional: true },
    };
    static defaultProps = { ok: [], warn: [], stop: [] };

    get rawValue() {
        const value = this.props.record.data[this.props.name];
        return Array.isArray(value) ? value[0] : value;
    }
    get state() {
        const v = this.rawValue;
        if (v === false || v === undefined || v === null) {
            return "none";
        }
        for (const s of ["stop", "warn", "ok"]) {
            if (this.props[s].includes(v)) {
                return s;
            }
        }
        return "none";
    }
    get label() {
        const field = this.props.record.fields[this.props.name];
        const formatter = formatters.get(field.type, null);
        const value = this.props.record.data[this.props.name];
        return formatter ? formatter(value, { selection: field.selection }) : String(value || "");
    }
}

export const ptkStatusField = {
    component: PtkStatusField,
    displayName: _t("PORTOKO status"),
    supportedTypes: ["selection", "char", "many2one"],
    supportedOptions: [
        { label: _t("OK values"), name: "ok", type: "string" },
        { label: _t("Warning values"), name: "warn", type: "string" },
        { label: _t("Stop values"), name: "stop", type: "string" },
    ],
    extractProps: ({ options }) => ({
        ok: options.ok || [],
        warn: options.warn || [],
        stop: options.stop || [],
    }),
};

registry.category("fields").add("ptk_status", ptkStatusField);
