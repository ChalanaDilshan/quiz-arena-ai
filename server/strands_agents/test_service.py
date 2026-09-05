import os
import sys
import unittest
import json

sys.path.insert(0, os.path.dirname(__file__))

# Provide test environment variables before import
os.environ["AWS_REGION"] = "us-east-1"
os.environ["INTERNAL_SECRET"] = os.environ.get("INTERNAL_SECRET", "test-secret-12345")

from fastapi import HTTPException
from main import (
    verify_internal_token,
    sanitize,
    _QUIZ_FILENAME_RE,
    make_model,
    generate_fallback_response,
    build_commentator_agent,
    build_tutor_agent,
    build_hint_master_agent,
    build_quiz_generator_agent,
    GenerateQuizRequest,
    generate_quiz,
    health
)
import asyncio


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


class TestBedrockAndAgentIntegration(unittest.TestCase):

    def test_make_model_returns_bedrock_model(self):
        model = make_model(temperature=0.7)
        self.assertIsNotNone(model)
        self.assertEqual(getattr(model, "config", {}).get("temperature"), 0.7)
        self.assertEqual(model.client.meta.region_name, "us-east-1")

    def test_agents_build_successfully(self):
        c_agent = build_commentator_agent()
        self.assertIsNotNone(c_agent)
        t_agent = build_tutor_agent()
        self.assertIsNotNone(t_agent)
        h_agent = build_hint_master_agent()
        self.assertIsNotNone(h_agent)
        q_agent = build_quiz_generator_agent()
        self.assertIsNotNone(q_agent)

    def test_fallback_generator_outputs_valid_quizzes(self):
        res = generate_fallback_response("quiz", {"topic": "Cloud Computing", "num_questions": 3})
        questions = json.loads(res)
        self.assertIsInstance(questions, list)
        self.assertEqual(len(questions), 3)
        for q in questions:
            self.assertIn("text", q)
            self.assertEqual(len(q["options"]), 4)
            self.assertIn("correctIndex", q)
            self.assertIn("timeLimit", q)

    def test_generate_quiz_endpoint(self):
        req = GenerateQuizRequest(
            topic="Operating Systems",
            difficulty="Hard",
            num_questions=3,
            syllabus_text="Kernel architecture and virtual memory paging"
        )
        res = asyncio.run(generate_quiz(req))
        self.assertEqual(res["topic"], "Operating Systems")
        self.assertEqual(res["difficulty"], "Hard")
        self.assertEqual(len(res["questions"]), 3)
        for q in res["questions"]:
            self.assertTrue(q["id"].startswith("q_"))
            self.assertEqual(len(q["options"]), 4)

    def test_health_endpoint_reports_bedrock(self):
        res = asyncio.run(health())
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["provider"], "Amazon Bedrock")
        self.assertTrue(res["agentcore_deployment_ready"])
        self.assertIn("quiz_generator", res["agents"])


if __name__ == '__main__':
    unittest.main()

