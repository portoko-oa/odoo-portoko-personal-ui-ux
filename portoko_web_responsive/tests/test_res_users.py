# Copyright 2026 PORTOKO
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl).

from odoo.exceptions import AccessError
from odoo.tests import HttpCase, TransactionCase, new_test_user, tagged


@tagged("post_install", "-at_install")
class TestPortokoUserSettings(TransactionCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.user = new_test_user(cls.env, login="ptk_internal", groups="base.group_user")
        cls.other = new_test_user(cls.env, login="ptk_other", groups="base.group_user")

    def test_defaults(self):
        self.assertFalse(self.user.ptk_home_on_login)
        self.assertEqual(self.user.ptk_chatter_position, "auto")
        self.assertEqual(
            self.user._ptk_ui_settings(),
            {"home_on_login": False, "chatter_position": "auto"},
        )

    def test_user_can_change_own_settings(self):
        """Plain internal users have no write access on res.users: the fields
        must be self-writeable or the Preferences dialog fails for them."""
        me = self.user.with_user(self.user)
        me.write({"ptk_home_on_login": True, "ptk_chatter_position": "bottom"})
        self.assertTrue(self.user.ptk_home_on_login)
        self.assertEqual(self.user.ptk_chatter_position, "bottom")
        # And can read them back (Preferences form reads them as the user).
        values = me.read(["ptk_home_on_login", "ptk_chatter_position"])[0]
        self.assertEqual(values["ptk_chatter_position"], "bottom")

    def test_user_cannot_change_someone_else(self):
        with self.assertRaises(AccessError):
            self.other.with_user(self.user).write({"ptk_chatter_position": "side"})

    def test_invalid_position_rejected(self):
        with self.assertRaises(ValueError):
            self.user.write({"ptk_chatter_position": "<script>"})

    def test_settings_fallback_on_bad_stored_value(self):
        # Simulate a value written by SQL / an older version.
        self.env.cr.execute(
            "UPDATE res_users SET ptk_chatter_position = 'diagonal' WHERE id = %s",
            [self.user.id],
        )
        self.user.invalidate_recordset(["ptk_chatter_position"])
        self.assertEqual(self.user._ptk_ui_settings()["chatter_position"], "auto")


@tagged("post_install", "-at_install")
class TestPortokoSessionInfo(HttpCase):
    def _new_user(self, login, groups):
        user = new_test_user(self.env, login=login, groups=groups)
        # get_session_info is a read-only route; mail would otherwise try to
        # create the user's settings row inside it (core noise, not ours).
        self.env["res.users.settings"]._find_or_create_for_user(user)
        return user

    def test_session_info_internal_user(self):
        user = self._new_user("ptk_session", "base.group_user")
        user.write({"ptk_home_on_login": True, "ptk_chatter_position": "side"})
        self.authenticate("ptk_session", "ptk_session")
        info = self.make_jsonrpc_request("/web/session/get_session_info")
        self.assertEqual(
            info.get("portoko_ui"),
            {"home_on_login": True, "chatter_position": "side"},
        )

    def test_session_info_portal_user(self):
        self._new_user("ptk_portal", "base.group_portal")
        self.authenticate("ptk_portal", "ptk_portal")
        info = self.make_jsonrpc_request("/web/session/get_session_info")
        self.assertNotIn("portoko_ui", info)
