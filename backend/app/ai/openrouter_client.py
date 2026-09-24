"""OpenRouter API client — pure isolation layer.

Knows NOTHING about domain entities (complaints, depots, users).
Only handles OpenRouter REST API communication, timeouts, error codes, and JSON parsing.
"""

import json
import time
import urllib.request
import urllib.error
from flask import current_app


def call_openrouter(system_prompt: str, user_prompt: str, model: str = None, timeout: int = None) -> tuple[dict | None, str | None, str | None, int]:
    """Call OpenRouter Chat Completions API.

    Returns:
        (parsed_json_dict, error_code, raw_response_text, elapsed_ms)
    """
    start_time = time.time()

    cfg = current_app.config if current_app else {}
    api_key = cfg.get("OPENROUTER_API_KEY", "")
    target_model = model or cfg.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-lite-001")
    req_timeout = timeout or cfg.get("AI_TIMEOUT_SECONDS", 8)

    if not api_key:
        elapsed = int((time.time() - start_time) * 1000)
        print("[AI CLIENT WARN] Missing OpenRouter API Key.")
        return None, "MISSING_API_KEY", None, elapsed

    url = "https://openrouter.ai/api/v1/chat/completions"

    payload = {
        "model": target_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.1,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://bussahayi.gov.in",
        "X-Title": "BUS Sahayi Grievance System",
        "Content-Type": "application/json",
    }

    try:
        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

        with urllib.request.urlopen(req, timeout=req_timeout) as resp:
            status_code = resp.getcode()
            body_bytes = resp.read()
            raw_text = body_bytes.decode("utf-8")
            elapsed = int((time.time() - start_time) * 1000)

            if status_code != 200:
                return None, f"HTTP_{status_code}", raw_text, elapsed

            parsed_resp = json.loads(raw_text)
            choices = parsed_resp.get("choices", [])
            if not choices:
                return None, "EMPTY_RESPONSE", raw_text, elapsed

            content = choices[0].get("message", {}).get("content", "")
            if not content:
                return None, "EMPTY_CONTENT", raw_text, elapsed

            # Clean JSON formatting wrappers if model returns markdown fencing ```json ... ```
            clean_content = content.strip()
            if clean_content.startswith("```"):
                lines = clean_content.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                clean_content = "\n".join(lines).strip()

            result_dict = json.loads(clean_content)
            return result_dict, None, clean_content, elapsed

    except urllib.error.HTTPError as exc:
        elapsed = int((time.time() - start_time) * 1000)
        error_body = exc.read().decode("utf-8") if exc.fp else str(exc)
        print(f"[AI CLIENT ERROR] OpenRouter HTTP {exc.code}: {error_body}")
        return None, f"HTTP_{exc.code}", error_body, elapsed

    except urllib.error.URLError as exc:
        elapsed = int((time.time() - start_time) * 1000)
        if "timed out" in str(exc.reason).lower():
            print("[AI CLIENT ERROR] OpenRouter timeout.")
            return None, "OPENROUTER_TIMEOUT", None, elapsed
        print(f"[AI CLIENT ERROR] Network error: {exc.reason}")
        return None, "NETWORK_ERROR", str(exc.reason), elapsed

    except json.JSONDecodeError as exc:
        elapsed = int((time.time() - start_time) * 1000)
        print(f"[AI CLIENT ERROR] Malformed JSON: {exc}")
        return None, "MALFORMED_JSON", raw_text if 'raw_text' in locals() else None, elapsed

    except Exception as exc:
        elapsed = int((time.time() - start_time) * 1000)
        print(f"[AI CLIENT ERROR] Unexpected exception: {exc}")
        return None, "UNEXPECTED_ERROR", str(exc), elapsed
