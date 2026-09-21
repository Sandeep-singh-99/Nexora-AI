import re
from typing import List, Dict, Any, Tuple

# Regex patterns for sensitive data
SENSITIVE_PATTERNS = {
    "Credit Card": re.compile(
        r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b"
    ),
    "Social Security Number (SSN)": re.compile(
        r"\b\d{3}-\d{2}-\d{4}\b"
    ),
    "API Key / Secret Token": re.compile(
        r"(?i)\b(?:sk-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16}|(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*['\"][a-zA-Z0-9_\-\.]{16,}['\"])"
    ),
    "Private Key": re.compile(
        r"-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----"
    ),
    "Password / Credential": re.compile(
        r"(?i)\b(?:password|passwd|pwd)\s*[:=]\s*['\"][^\s'\"]{6,}['\"]"
    ),
}


def mask_sensitive_value(category: str, raw_match: str) -> str:
    """Masks detected sensitive strings to safely present in UI confirmations."""
    val = raw_match.strip()
    if category == "Credit Card":
        # Keep last 4 digits
        digits = re.sub(r"\D", "", val)
        last4 = digits[-4:] if len(digits) >= 4 else "XXXX"
        return f"****-****-****-{last4}"
    elif category == "Social Security Number (SSN)":
        return "***-**-" + val[-4:]
    elif category == "Private Key":
        return "-----BEGIN PRIVATE KEY [PROTECTED]-----"
    elif category == "API Key / Secret Token":
        prefix = val[:6] if len(val) >= 6 else "SECRET"
        return f"{prefix}****************"
    elif category == "Password / Credential":
        parts = re.split(r"[:=]", val, maxsplit=1)
        key_name = parts[0].strip() if len(parts) > 1 else "password"
        return f"{key_name}: ****************"
    return "****************"


def scan_document_sensitive_data(pages: List[Dict[str, Any]]) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Scans extracted document pages in memory for sensitive data entities.
    Returns:
        (has_sensitive_data: bool, findings: List[Dict[str, Any]])
    Each finding contains:
        category: str
        count: int
        sample: str (masked)
        page_numbers: List[int]
    """
    category_counts: Dict[str, int] = {}
    category_samples: Dict[str, str] = {}
    category_pages: Dict[str, set] = {}

    for page_info in pages:
        text = page_info.get("text", "")
        page_num = page_info.get("page", 1)
        if not text:
            continue

        for category, pattern in SENSITIVE_PATTERNS.items():
            matches = pattern.findall(text)
            if matches:
                category_counts[category] = category_counts.get(category, 0) + len(matches)
                if category not in category_pages:
                    category_pages[category] = set()
                category_pages[category].add(page_num)

                if category not in category_samples:
                    sample_match = matches[0] if isinstance(matches[0], str) else str(matches[0])
                    category_samples[category] = mask_sensitive_value(category, sample_match)

    findings: List[Dict[str, Any]] = []
    for category, count in category_counts.items():
        findings.append({
            "category": category,
            "count": count,
            "sample": category_samples.get(category, "****************"),
            "pages": sorted(list(category_pages.get(category, []))),
        })

    has_sensitive_data = len(findings) > 0
    return has_sensitive_data, findings
