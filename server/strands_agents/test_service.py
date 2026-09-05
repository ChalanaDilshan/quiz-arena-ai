import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))

# Provide test environment variables before import
os.environ["GEMINI_API_KEY"] = os.environ.get("GEMINI_API_KEY", "ci-test-gemini-key")
os.environ["INTERNAL_SECRET"] = os.environ.get("INTERNAL_SECRET", "test-secret-12345")

from fastapi import HTTPException
from main import verify_internal_token, sanitize, _QUIZ_FILENAME_RE


class TestStrandsSecurity(unittest.TestCase):

    def test_verify_internal_token_success(self):
        # Valid matching token should not raise
        verify_internal_token(x_internal_token=os.environ["INTERNAL_SECRET"])

    def test_verify_internal_token_unauthorized(self):
        # Invalid token raises 401
        with self.assertRaises(HTTPException) as ctx:
            verify_internal_token(x_internal_token="wrong-token-abc")
        self.assertEqual(ctx.exception.status_code, 401)

        # Empty token raises 401
        with self.assertRaises(HTTPException) as ctx_empty:
            verify_internal_token(x_internal_token="")
        self.assertEqual(ctx_empty.exception.status_code, 401)

    def test_sanitize_removes_dangerous_characters(self):
        # Control characters and injection characters should be stripped
        dangerous = "<script>alert('xss')</script>\x00\x1f`test`"
        cleaned = sanitize(dangerous, 100)
        self.assertNotIn("<", cleaned)
        self.assertNotIn(">", cleaned)
        self.assertNotIn("'", cleaned)
        self.assertNotIn("`", cleaned)
        self.assertNotIn("\x00", cleaned)

    def test_quiz_filename_regex_security(self):
        # Valid pattern: quiz_<8 hex chars>_<safe topic>.json
        valid_name = "quiz_a1b2c3d4_biology_midterm.json"
        self.assertIsNotNone(_QUIZ_FILENAME_RE.match(valid_name))

        # Path traversal attempts must be rejected
        self.assertIsNone(_QUIZ_FILENAME_RE.match("../../etc/passwd"))
        self.assertIsNone(_QUIZ_FILENAME_RE.match("quiz_12345678_../../secret.json"))
        self.assertIsNone(_QUIZ_FILENAME_RE.match("..\\windows\\system32.json"))
        self.assertIsNone(_QUIZ_FILENAME_RE.match("invalid_name.txt"))


if __name__ == '__main__':
    unittest.main()
