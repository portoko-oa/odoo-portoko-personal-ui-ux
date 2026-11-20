/* Copyright 2026 PORTOKO
 * License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl). */

import {registry} from "@web/core/registry";

registry.category("web_tour.tours").add("portoko_web_responsive_home", {
    steps: () => [
        {
            content: "Open the home screen",
            trigger: ".o_main_navbar .ptk-home-toggle",
            run: "click",
        },
        {
            content: "Home screen lists the apps",
            trigger: ".ptk-home .ptk-tile[data-menu-xmlid='mail.menu_root_discuss']",
        },
        {
            content: "Search a menu",
            trigger: ".ptk-home .ptk-search__input",
            run: "edit disc",
        },
        {
            content: "Highlighted result is Discuss",
            trigger: ".ptk-home .ptk-result.is-active:contains(Discuss) mark",
        },
        {
            content: "Escape clears the search first",
            trigger: ".ptk-home .ptk-search__input",
            run: "press Escape",
        },
        {
            content: "Grid is back",
            trigger: ".ptk-home .ptk-apps .ptk-tile",
        },
        {
            content: "Open Discuss from its tile",
            trigger: ".ptk-home .ptk-tile[data-menu-xmlid='mail.menu_root_discuss']",
            run: "click",
        },
        {
            content: "Discuss is shown and the home screen closed",
            trigger: "body:not(.ptk-home-open) .o-mail-Discuss",
        },
        {
            content: "Home toggle is no longer active",
            trigger: ".o_main_navbar .ptk-home-toggle:not(.is-open)",
        },
    ],
});
