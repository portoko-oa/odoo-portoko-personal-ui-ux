/* Copyright 2026 PORTOKO
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl). */

export const DEFAULT_ICON = "/web/static/img/default_icon_app.png";
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i;
const SAFE_ICON_CLASS = /^[\w\s-]+$/;

function safeColor(value, fallback) {
    const v = String(value || "").trim();
    return SAFE_COLOR.test(v) ? v : fallback;
}

/**
 * Turn an Odoo menu into something an <img> or a font tile can show.
 * Handles: data URLs, raw base64 (png/svg), paths, "fa-x,color,bg" font
 * icons (Odoo 19 helper output too), and missing icons.
 * @returns {{src: string}|{iconClass: string, color: string, bg: string}}
 */
export function getAppIcon(menu) {
    const data = menu && menu.webIconData;
    if (typeof data === "string" && data) {
        if (data.startsWith("data:image") || data.startsWith("/")) {
            return {src: data};
        }
        const mime =
            menu.webIconDataMimetype || (data.startsWith("P") ? "image/svg+xml" : "image/png");
        return {src: `data:${mime};base64,${data.replace(/\s/g, "")}`};
    }
    let font = menu && menu.webIcon;
    if (typeof font === "string") {
        const parts = font.split(",");
        if (parts.length === 3) {
            const [iconClass, color, bg] = parts;
            font = {iconClass, color, backgroundColor: bg};
        } else if (parts.length === 2 && parts[1].includes("/")) {
            // "module,static/description/icon.png"
            const path = parts.join("/");
            return {src: path.startsWith("/") ? path : `/${path}`};
        } else {
            font = null;
        }
    }
    if (font && typeof font === "object" && SAFE_ICON_CLASS.test(font.iconClass || "")) {
        return {
            iconClass: font.iconClass,
            color: safeColor(font.color, "#ffffff"),
            bg: safeColor(font.backgroundColor, "#111111"),
        };
    }
    return {src: DEFAULT_ICON};
}
