/* Copyright 2026 PORTOKO
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl). */

/**
 * Menu search for the PORTOKO home screen. Pure functions, no Odoo imports,
 * so they can be unit tested anywhere.
 *
 * Matching rules, best first:
 *   4  token is the start of the whole text  ("sal" -> "Sales")
 *   3  token is the start of a word          ("ord" -> "Sales / Orders")
 *   2  token appears inside a word           ("der" -> "Orders")
 *   1  token letters appear in order, starting at a word ("stck" -> "Stock"), tokens of 3+ chars only
 * Every token must match. Accents and case are ignored ("penjualan" == "Penjualan", "cafe" == "Café").
 */

export const MAX_QUERY_LENGTH = 80;
export const MAX_TOKENS = 6;
const COMBINING = /[̀-ͯ]/g;
const WORD_START = /[\s/\-_().,:&+[\]]/;

/**
 * Normalise a string and keep, for every normalised char, the index of the
 * original char it came from (so highlights land on the original text).
 * @param {string} text
 * @returns {{norm: string, map: number[], mapEnd: number[]}}
 */
export function normalizeWithMap(text) {
    const src = String(text ?? "");
    let norm = "";
    const map = [];
    const mapEnd = [];
    let i = 0;
    for (const ch of src) {
        const out = ch.normalize("NFD").replace(COMBINING, "").toLowerCase();
        for (let k = 0; k < out.length; k++) {
            map.push(i);
            mapEnd.push(i + ch.length);
        }
        norm += out;
        i += ch.length;
    }
    return {norm, map, mapEnd};
}

export function normalize(text) {
    return normalizeWithMap(text).norm;
}

/**
 * @param {string} query
 * @returns {string[]}
 */
export function tokenize(query) {
    return normalize(String(query ?? "").slice(0, MAX_QUERY_LENGTH))
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, MAX_TOKENS);
}

function isWordStart(norm, idx) {
    return idx === 0 || WORD_START.test(norm[idx - 1]);
}

/**
 * Match one token against normalised text.
 * @returns {{score: number, ranges: number[][]}|null} ranges in normalised indexes, end exclusive
 */
function matchToken(norm, token) {
    let idx = norm.indexOf(token);
    let firstInside = -1;
    while (idx !== -1) {
        if (isWordStart(norm, idx)) {
            return {score: idx === 0 ? 4 : 3, ranges: [[idx, idx + token.length]]};
        }
        if (firstInside === -1) {
            firstInside = idx;
        }
        idx = norm.indexOf(token, idx + 1);
    }
    if (firstInside !== -1) {
        return {score: 2, ranges: [[firstInside, firstInside + token.length]]};
    }
    if (token.length < 3) {
        return null;
    }
    // Subsequence: letters in order, and the first one must start a word
    // ("stck" -> "Stock", but "ord" must not light up "Dashbo-a-rds").
    const ranges = [];
    let pos = 0;
    let first = norm.indexOf(token[0]);
    while (first !== -1 && !isWordStart(norm, first)) {
        first = norm.indexOf(token[0], first + 1);
    }
    if (first === -1) {
        return null;
    }
    ranges.push([first, first + 1]);
    pos = first + 1;
    for (const ch of token.slice(1)) {
        const found = norm.indexOf(ch, pos);
        if (found === -1) {
            return null;
        }
        const last = ranges[ranges.length - 1];
        if (last && last[1] === found) {
            last[1] = found + 1;
        } else {
            ranges.push([found, found + 1]);
        }
        pos = found + 1;
    }
    // Too scattered = noise ("aaa" matching every long label).
    if (ranges.length > Math.ceil(token.length / 2) + 1) {
        return null;
    }
    return {score: 1, ranges};
}

/**
 * @param {string} text original text
 * @param {string[]} tokens normalised tokens
 * @returns {{score: number, ranges: number[][]}|null} ranges in ORIGINAL indexes
 */
export function matchText(text, tokens) {
    if (!tokens.length) {
        return null;
    }
    const {norm, map, mapEnd} = normalizeWithMap(text);
    let score = 0;
    const normRanges = [];
    for (const token of tokens) {
        const m = matchToken(norm, token);
        if (!m) {
            return null;
        }
        score += m.score;
        normRanges.push(...m.ranges);
    }
    const ranges = normRanges
        .map(([s, e]) => [map[s], mapEnd[e - 1]])
        .sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const r of ranges) {
        const last = merged[merged.length - 1];
        if (last && r[0] <= last[1]) {
            last[1] = Math.max(last[1], r[1]);
        } else {
            merged.push([...r]);
        }
    }
    return {score, ranges: merged};
}

/**
 * Split text into [{text, hit}] segments for safe rendering (t-esc only).
 * Works on UTF-16 indexes as produced by matchText.
 */
export function highlight(text, ranges) {
    const src = String(text ?? "");
    const parts = [];
    let pos = 0;
    for (const [s, e] of ranges || []) {
        if (s > pos) {
            parts.push({text: src.slice(pos, s), hit: false});
        }
        parts.push({text: src.slice(s, e), hit: true});
        pos = e;
    }
    if (pos < src.length) {
        parts.push({text: src.slice(pos), hit: false});
    }
    return parts;
}

/**
 * Flatten a menu tree into searchable entries.
 * @param {Function} getMenu id -> menu (Odoo menu service getMenu)
 * @param {Object[]} apps root apps
 * @returns {Object[]} entries {id, appId, label, path, menu, isApp}
 */
export function buildIndex(getMenu, apps) {
    const entries = [];
    const seen = new Set();
    const walk = (menu, app, trail, depth) => {
        if (!menu || seen.has(menu.id) || depth > 12) {
            return;
        }
        seen.add(menu.id);
        const name = String(menu.name ?? "").trim();
        const path = trail.length ? `${trail.join(" / ")} / ${name}` : name;
        if (menu.actionID) {
            entries.push({
                id: menu.id,
                appId: app.id,
                label: name,
                path,
                menu,
                isApp: menu.id === app.id,
            });
        }
        for (const childId of menu.children || []) {
            walk(getMenu(childId), app, [...trail, name], depth + 1);
        }
    };
    for (const app of apps) {
        walk(app, app, [], 0);
    }
    return entries;
}

/**
 * @param {Object[]} entries from buildIndex
 * @param {string} query
 * @param {number} limit
 * @returns {Object[]} entries with {score, parts}
 */
export function searchMenus(entries, query, limit = 40) {
    const tokens = tokenize(query);
    if (!tokens.length) {
        return [];
    }
    const results = [];
    for (const entry of entries) {
        const m = matchText(entry.path, tokens);
        if (m) {
            // Matching the item's own name beats matching only its parents.
            const own = matchText(entry.label, tokens);
            const score = m.score * 10 + (own ? own.score * 5 : 0) + (entry.isApp ? 3 : 0);
            results.push({...entry, score, parts: highlight(entry.path, m.ranges)});
        }
    }
    results.sort(
        (a, b) => b.score - a.score || a.path.length - b.path.length || a.path.localeCompare(b.path)
    );
    return results.slice(0, limit);
}
