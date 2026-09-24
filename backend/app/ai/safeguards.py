"""AI Safeguards & Security Filters.

1. Sanitizes user text inputs before constructing LLM prompts.
2. Strips phone numbers / secrets.
3. Guards against prompt injection.
"""

import re


def sanitize_input_text(text: str, max_length: int = 1000) -> str:
    """Sanitize user text input for LLM prompt payload."""
    if not text:
        return ""

    # Truncate
    clean = text[:max_length].strip()

    # Mask phone numbers (Indian 10-digit / +91 formats)
    clean = re.sub(r'(\+91[\s-]?)?[6-9]\d{9}', '[PHONE MASKED]', clean)

    # Mask email addresses
    clean = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[EMAIL MASKED]', clean)

    # Strip obvious prompt injection attempts
    clean = re.sub(r'(?i)(ignore previous instructions|system prompt:|you are now)', '[FILTERED]', clean)

    return clean
