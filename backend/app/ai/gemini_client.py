"""Native Google Gemini API Client — BUS സഹായി Grievance System.

Provides high-performance text and multimodal vision inference using Google Gemini models:
- gemini-3.5-flash-lite (high-speed structured parsing & vision)
- gemini-3.8-flash (multimodal reasoning & fallback)
"""

import json
import time
import urllib.request
import urllib.error
from flask import current_app


def call_gemini(
    system_prompt: str,
    user_prompt: str,
    image_b64: str | None = None,
    mime_type: str = "image/jpeg",
    model: str | None = None,
    timeout: int | None = None,
) -> tuple[dict | None, str | None, str | None, int]:
    """Call Google Gemini generateContent REST API.

    Supports structured JSON generation and multimodal vision (image_b64).
    Returns: (parsed_json_dict, error_code, raw_response_text, elapsed_ms)
    """
    start_time = time.time()

    cfg = current_app.config if current_app else {}
    api_key = cfg.get("GEMINI_API_KEY", "")
    target_model = model or cfg.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
    fallback_model = cfg.get("GEMINI_FALLBACK_MODEL", "gemini-3.8-flash")
    req_timeout = timeout or cfg.get("AI_TIMEOUT_SECONDS", 10)

    if not api_key:
        elapsed = int((time.time() - start_time) * 1000)
        return None, "MISSING_GEMINI_API_KEY", None, elapsed

    # Clean Base64 image payload if data URL prefix exists
    clean_image_b64 = None
    detected_mime = mime_type
    if image_b64:
        clean_image_b64 = image_b64.strip()
        if "data:" in clean_image_b64 and ";base64," in clean_image_b64:
            prefix, clean_image_b64 = clean_image_b64.split(";base64,", 1)
            detected_mime = prefix.replace("data:", "").strip()

    # Build parts list
    parts: list[dict] = [{"text": user_prompt}]
    if clean_image_b64:
        parts.append({
            "inline_data": {
                "mime_type": detected_mime or "image/jpeg",
                "data": clean_image_b64,
            }
        })

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1,
        },
    }

    if system_prompt:
        payload["system_instruction"] = {
            "parts": [{"text": system_prompt}]
        }

    data_bytes = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    # Attempt primary model then fallback model
    candidate_models = [target_model]
    if fallback_model and fallback_model != target_model:
        candidate_models.append(fallback_model)

    last_error = None
    last_raw_text = None

    for current_model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={api_key}"
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=req_timeout) as resp:
                status_code = resp.getcode()
                body_bytes = resp.read()
                raw_text = body_bytes.decode("utf-8")
                elapsed = int((time.time() - start_time) * 1000)

                if status_code != 200:
                    last_error = f"HTTP_{status_code}"
                    last_raw_text = raw_text
                    continue

                parsed_resp = json.loads(raw_text)
                candidates = parsed_resp.get("candidates", [])
                if not candidates:
                    last_error = "EMPTY_CANDIDATES"
                    last_raw_text = raw_text
                    continue

                first_candidate = candidates[0]
                content_parts = first_candidate.get("content", {}).get("parts", [])
                if not content_parts:
                    last_error = "EMPTY_PARTS"
                    last_raw_text = raw_text
                    continue

                text_content = content_parts[0].get("text", "")
                if not text_content:
                    last_error = "EMPTY_TEXT"
                    last_raw_text = raw_text
                    continue

                clean_text = text_content.strip()
                if clean_text.startswith("```"):
                    lines = clean_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    clean_text = "\n".join(lines).strip()

                result_dict = json.loads(clean_text)
                return result_dict, None, clean_text, elapsed

        except urllib.error.HTTPError as exc:
            elapsed = int((time.time() - start_time) * 1000)
            err_body = exc.read().decode("utf-8") if exc.fp else str(exc)
            last_error = f"HTTP_{exc.code}"
            last_raw_text = err_body
            # Retry next model on 503 or 404
            if exc.code in (503, 500, 404):
                time.sleep(0.5)
                continue
            return None, last_error, last_raw_text, elapsed

        except urllib.error.URLError as exc:
            elapsed = int((time.time() - start_time) * 1000)
            if "timed out" in str(exc.reason).lower():
                last_error = "GEMINI_TIMEOUT"
            else:
                last_error = f"NETWORK_ERROR_{exc.reason}"
            continue

        except json.JSONDecodeError as exc:
            elapsed = int((time.time() - start_time) * 1000)
            last_error = "MALFORMED_JSON"
            last_raw_text = raw_text if "raw_text" in locals() else None
            return None, last_error, last_raw_text, elapsed

        except Exception as exc:
            elapsed = int((time.time() - start_time) * 1000)
            last_error = f"UNEXPECTED_{type(exc).__name__}"
            last_raw_text = str(exc)
            continue

    elapsed = int((time.time() - start_time) * 1000)
    return None, last_error or "ALL_MODELS_FAILED", last_raw_text, elapsed
