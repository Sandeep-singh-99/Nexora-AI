import pytest
from app.ai.guardrails.document_guardrails import (
    scan_document_sensitive_data,
    mask_sensitive_value,
    SENSITIVE_PATTERNS,
)
from app.ai.middleware.guardrails_hitl import get_guardrails_hitl_middleware
from langchain.agents.middleware import HumanInTheLoopMiddleware


def test_clean_document_passes_guardrails():
    pages = [
        {"page": 1, "text": "This is a clean financial report discussing Q3 quarterly revenue growth."},
        {"page": 2, "text": "The company increased ARR by 24% year-over-year with zero safety violations."}
    ]
    has_sensitive, findings = scan_document_sensitive_data(pages)
    assert has_sensitive is False
    assert findings == []


def test_detect_credit_card_and_masking():
    pages = [
        {"page": 1, "text": "Payment received via card 4111111111111234 for processing."}
    ]
    has_sensitive, findings = scan_document_sensitive_data(pages)
    assert has_sensitive is True
    assert len(findings) == 1
    assert findings[0]["category"] == "Credit Card"
    assert findings[0]["count"] == 1
    assert findings[0]["pages"] == [1]
    assert "1234" in findings[0]["sample"]
    assert "4111" not in findings[0]["sample"]


def test_detect_ssn():
    pages = [
        {"page": 3, "text": "Employee identification record SSN: 123-45-6789 confidential."}
    ]
    has_sensitive, findings = scan_document_sensitive_data(pages)
    assert has_sensitive is True
    assert len(findings) == 1
    assert findings[0]["category"] == "Social Security Number (SSN)"
    assert findings[0]["count"] == 1
    assert findings[0]["pages"] == [3]
    assert "***-**-6789" == findings[0]["sample"]


def test_detect_api_key_and_secret():
    pages = [
        {"page": 1, "text": "Deploy token: sk-proj-1234567890abcdef1234567890 for API calls."}
    ]
    has_sensitive, findings = scan_document_sensitive_data(pages)
    assert has_sensitive is True
    assert any(f["category"] == "API Key / Secret Token" for f in findings)


def test_detect_private_key():
    pages = [
        {"page": 1, "text": "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...\n-----END RSA PRIVATE KEY-----"}
    ]
    has_sensitive, findings = scan_document_sensitive_data(pages)
    assert has_sensitive is True
    assert any(f["category"] == "Private Key" for f in findings)


def test_multiple_sensitive_items_across_pages():
    pages = [
        {"page": 1, "text": "Card: 4111111111111234"},
        {"page": 2, "text": "Another card: 5500000000005678 and SSN: 987-65-4321"},
    ]
    has_sensitive, findings = scan_document_sensitive_data(pages)
    assert has_sensitive is True
    categories = {f["category"] for f in findings}
    assert "Credit Card" in categories
    assert "Social Security Number (SSN)" in categories

    cc_finding = next(f for f in findings if f["category"] == "Credit Card")
    assert cc_finding["count"] == 2
    assert cc_finding["pages"] == [1, 2]


def test_human_in_the_loop_middleware_factory():
    hitl = get_guardrails_hitl_middleware(
        interrupt_on={"test_action": {"allowed_decisions": ["approve", "reject"]}}
    )
    assert isinstance(hitl, HumanInTheLoopMiddleware)
    assert "test_action" in hitl.interrupt_on
