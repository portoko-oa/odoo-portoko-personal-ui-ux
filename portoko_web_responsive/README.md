# PORTOKO Web Responsive

PORTOKO's own responsive backend for **Odoo 18 and Odoo 19 Community**, built on the PORTOKO design system v0.4. It replaces OCA `web_responsive` (the two cannot be installed together).

## What it does

**Home screen** (button on the left of the navbar, or `Alt+H`)
- Full-screen grid of every app, sitting under the navbar so the user menu stays reachable.
- Menu search over apps *and* sub-menus ("quot" finds *Sales / Orders / Quotations*). Ignores case and accents, ranks word starts first, highlights the match.
- Keyboard: arrows move through results or the grid (up/down follow the columns), `Enter` opens, `Esc` clears the search then closes, start typing anywhere to search, `Tab` stays inside.
- Touch: 48px targets, no on-screen keyboard popping up when the home screen opens, the tapped app shows a pressed state on slow networks, and double taps are ignored.
- `Ctrl`/`Cmd`/middle click opens an app in a new tab.
- Leaving an unsaved form: a valid form is saved as usual; a form that cannot be saved (missing required field) closes the home screen so the user sees the red fields and Odoo's message.

**Per-user preferences** (My Preferences > Display, and Settings > Users)
- *Open Home Screen After Login*: show the home screen instead of the first app. Links to a specific record or menu still open directly.
- *Chatter Position*: Automatic (Odoo default: side panel from 1534px on 18, 1400px on 19), Side (side panel from 1200px, for 1366px laptops) or Bottom (always below the form).
- Both fields are self-writeable, so plain users can change them.

**PORTOKO look (backend only)**
- Paper ground, white surfaces, ink primary buttons, deep-green links, pill buttons, Atkinson Hyperlegible / Silkscreen (bundled in `portoko_ui`, works offline).
- Numbers in Atkinson Hyperlegible Mono (list numbers, totals, numeric fields, pager).
- Ink navbar with a gold *tumpal* line, *kawung* bands on the home screen edges. Ornaments are static SVG and never sit behind data.
- PDF reports, website and portal are not touched.

**Touch and small screens**
- Inputs at 16px on touch devices (stops the iOS zoom-in), 44px buttons in the control panel, status bar, dialogs, chatter and pager, bigger list checkboxes, long words wrap instead of pushing the page sideways.

## Install

Copy `portoko_web_responsive` for your Odoo version (`18.0/` or `19.0/`) into your addons path, update the apps list, install *PORTOKO Web Responsive*. Uninstall OCA `web_responsive` first if it is installed.

Depends on `web`, `mail` and `portoko_ui`. Odoo installs `portoko_ui` automatically; on its own it changes nothing on screen.

`portoko_ui` is the single source of the PORTOKO tokens, fonts and ornament tiles. This module only maps them onto Odoo's variables and styles the frame. To change a colour or font, change it in `portoko_ui`.

## Tests

```
odoo-bin -d <db> --test-tags=/portoko_web_responsive
```

10 tests: preferences (defaults, self-write, cannot write another user, invalid values, bad stored value), session info for internal and portal users, assets isolation (backend only), tokens and fonts coming from `portoko_ui` only, and a browser tour of the home screen.

## Known limits

- Ornaments and the wordmark are placeholders until the final PORTOKO logo files and the ornament redraw exist.
- No dark (Malam) theme: Odoo Community has no dark mode switch.
- Fonts are the Latin subset; app names in non-Latin scripts fall back to system fonts.

## Credits

Ideas and behaviour taken from OCA `web_responsive` (LasLabs, Tecnativa, ITerra, Onestein, Taras Shabaranskyi), LGPL-3. Code written from scratch by PORTOKO. Fonts: Atkinson Hyperlegible Next and Mono (Braille Institute), Silkscreen (Jason Kottke), SIL Open Font License 1.1.
