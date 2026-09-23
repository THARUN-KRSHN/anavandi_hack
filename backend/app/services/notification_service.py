"""Notification service — BUS സഹായി complete notification flow.

Architecture:
  Business Event → NotificationService → [SMS Provider] + [Email Service]
                                        → DB record (notifications table)

SMS Providers (priority order):
  1. Fast2SMS  (FAST2SMS_API_KEY set)
  2. Twilio    (SMS_PROVIDER=twilio + credentials set)
  3. MockSMS   (console-only, always available)

DEMO_MODE:
  SMS  → DEMO_SMS_NUMBER (+919778585423)
  Email → tharunkrishnachoolikattil@gmail.com  (handled in email_service.py)

4 Notification Types:
  USER_TO_DEPOT       — complaint submitted → depot head alert + user confirmation
  DEPOT_TO_USER       — status changed → user status email
  DEPOT_TO_CONDUCTOR  — conductor assigned → duty notification
  ESCALATION_TO_ADMIN — SLA breached → admin + depot head alert
"""

import base64
import json
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import current_app
from app.extensions import db
from app.models import Notification, User, Depot

# Demo delivery addresses (logical recipient info is recorded separately)
DEMO_SMS_NUMBER = "+919778585423"


# ---------------------------------------------------------------------------
# Phone normaliser
# ---------------------------------------------------------------------------

def normalize_phone(phone):
    """Convert common Indian local numbers to E.164 for SMS providers."""
    value = "".join(c for c in str(phone or "") if c.isdigit() or c == "+")
    if value.startswith("0") and len(value) == 11:
        return "+91" + value[1:]
    if value.isdigit() and len(value) == 10:
        return "+91" + value
    if value.startswith("91") and len(value) == 12:
        return "+" + value
    return value


# ---------------------------------------------------------------------------
# SMS Provider Adapters
# ---------------------------------------------------------------------------

class MockSMSProvider:
    """Console-only SMS provider for local dev / fallback."""

    def send(self, phone, message):
        print("=" * 60)
        print(f"[MOCK SMS] To: {phone}")
        print(f"[MOCK SMS] Message:\n{message}")
        print("=" * 60)
        return True, "Mock SMS sent."


class Fast2SMSProvider:
    """Fast2SMS DLT/Quick-SMS adapter for Indian numbers.
    
    API reference: https://docs.fast2sms.com/
    """

    BASE_URL = "https://www.fast2sms.com/dev/bulkV2"

    def __init__(self, api_key):
        self.api_key = api_key

    def send(self, phone, message):
        phone = normalize_phone(phone)
        # Fast2SMS needs the 10-digit number without +91
        if phone.startswith("+91"):
            phone = phone[3:]
        elif phone.startswith("91") and len(phone) == 12:
            phone = phone[2:]

        try:
            import urllib.request
            import urllib.parse

            payload = json.dumps({
                "route": "q",   # Quick SMS (no DLT required for demo)
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": phone,
            }).encode()

            req = urllib.request.Request(
                self.BASE_URL,
                data=payload,
                headers={
                    "authorization": self.api_key,
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                result = json.loads(response.read().decode())
            if result.get("return") is True:
                return True, f"Fast2SMS sent (request_id={result.get('request_id', 'ok')})"
            return False, f"Fast2SMS error: {result}"
        except Exception as exc:
            print(f"[ERROR] Fast2SMS send failed: {exc}")
            return False, str(exc)


class TwilioSMSProvider:
    """Twilio REST adapter using Python stdlib."""

    def __init__(self, account_sid, auth_token, from_number):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number

    def send(self, phone, message):
        phone = normalize_phone(phone)
        if not phone:
            return False, "Recipient phone number is missing."
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        body = urlencode({"To": phone, "From": self.from_number, "Body": message}).encode()
        auth = base64.b64encode(f"{self.account_sid}:{self.auth_token}".encode()).decode()
        req = Request(url, data=body, headers={"Authorization": f"Basic {auth}"}, method="POST")
        try:
            with urlopen(req, timeout=15) as response:
                payload = json.loads(response.read().decode())
            return True, f"Twilio SMS sent ({payload.get('sid', 'accepted')})."
        except Exception as exc:
            print(f"[ERROR] Twilio send failed: {exc}")
            return False, str(exc)


def _get_sms_provider():
    """Factory: return the highest-priority available SMS provider."""
    cfg = current_app.config

    # 1. Fast2SMS (preferred for Indian numbers)
    fast2sms_key = cfg.get("FAST2SMS_API_KEY", "")
    if fast2sms_key:
        return Fast2SMSProvider(fast2sms_key)

    # 2. Twilio
    if cfg.get("SMS_PROVIDER", "") == "twilio":
        sid = cfg.get("SMS_ACCOUNT_SID", "")
        token = cfg.get("SMS_AUTH_TOKEN", "")
        from_num = cfg.get("SMS_FROM_NUMBER", "")
        if sid and token and from_num:
            return TwilioSMSProvider(sid, token, from_num)

    # 3. Mock fallback
    print("[WARN] No SMS provider credentials found — using MockSMSProvider.")
    return MockSMSProvider()


# ---------------------------------------------------------------------------
# Core SMS send
# ---------------------------------------------------------------------------

def send_sms(phone, message, demo_mode=True):
    """SMS is disabled — email-only notification mode.

    This function is intentionally a no-op.  All SMS calls silently succeed
    (return False) so that callers don't raise exceptions, but no SMS is
    actually dispatched.  Email notifications via email_service.py remain
    fully functional.
    """
    print(f"[SMS DISABLED] Would have sent to: {phone} — SMS suppressed (email-only mode).")
    return False, "SMS disabled (email-only mode)"


# ---------------------------------------------------------------------------
# Notification DB record helper
# ---------------------------------------------------------------------------

def _record_notification(
    recipient_type, recipient_id, complaint_id,
    channel, title, message, success
):
    """Persist a notification record to the DB."""
    try:
        n = Notification(
            recipient_type=recipient_type,
            recipient_id=recipient_id,
            complaint_id=complaint_id,
            channel=channel,
            title=title,
            message=message,
            status="SENT" if success else "FAILED",
            sent_at=datetime.now(timezone.utc) if success else None,
        )
        db.session.add(n)
        db.session.commit()
    except Exception as exc:
        print(f"[WARN] Failed to record notification: {exc}")


# ---------------------------------------------------------------------------
# 1. USER_TO_DEPOT  — complaint submitted
# ---------------------------------------------------------------------------

def notify_on_complaint_submitted(complaint, user):
    """
    Triggers on: complaint submission
    Recipients:
      a) Depot Head  → email (depot report) + SMS
      b) User/Passenger → email (confirmation)
    """
    # ---- a) Depot head ----
    depot = Depot.query.get(complaint.depot_id) if complaint.depot_id else None
    depot_head = (
        User.query.filter_by(depot_id=complaint.depot_id, role="DEPOT_HEAD").first()
        if complaint.depot_id else None
    )

    if depot and depot_head:
        title = f"New Complaint: {complaint.reference_number}"
        body = (
            f"New complaint ({complaint.category}) assigned to {depot.name} depot.\n"
            f"Reference: {complaint.reference_number}\n"
            f"Priority: {complaint.priority}\n"
            f"Bus: {complaint.bus.bus_number if complaint.bus else 'N/A'}"
        )

        # Email
        try:
            from app.services.email_service import send_depot_report_email
            send_depot_report_email(depot.name, complaint)
        except Exception as exc:
            print(f"[WARN] Depot email failed: {exc}")

        # SMS
        sms_success = False
        try:
            sms_success, _ = send_sms(depot.head_phone or DEMO_SMS_NUMBER, body)
        except Exception as exc:
            print(f"[WARN] Depot SMS failed: {exc}")

        _record_notification(
            "DEPOT_HEAD", depot_head.id, complaint.id,
            "EMAIL", title, body, True
        )
        _record_notification(
            "DEPOT_HEAD", depot_head.id, complaint.id,
            "SMS", title, body, sms_success
        )

    # ---- b) User confirmation ----
    if user:
        try:
            from app.services.email_service import send_user_submission_confirmation
            send_user_submission_confirmation(user.name, complaint)
        except Exception as exc:
            print(f"[WARN] User confirmation email failed: {exc}")

        user_title = f"Complaint Received: {complaint.reference_number}"
        user_body = (
            f"Your complaint has been successfully submitted.\n"
            f"Reference: {complaint.reference_number}\n"
            f"Category: {complaint.category}\n"
            f"We will keep you updated."
        )

        # SMS to user
        sms_ok = False
        try:
            sms_ok, _ = send_sms(user.phone or DEMO_SMS_NUMBER, user_body)
        except Exception as exc:
            print(f"[WARN] User confirmation SMS failed: {exc}")

        _record_notification(
            "USER", user.id, complaint.id,
            "EMAIL", user_title, user_body, True
        )
        _record_notification(
            "USER", user.id, complaint.id,
            "SMS", user_title, user_body, sms_ok
        )


# ---------------------------------------------------------------------------
# 2. DEPOT_TO_USER  — status update
# ---------------------------------------------------------------------------

def notify_on_status_change(complaint, new_status):
    """
    Triggers on: depot head changes complaint status
    Recipient: User/Passenger
    """
    user = complaint.user
    if not user:
        return

    try:
        from app.services.email_service import send_user_status_update_email
        send_user_status_update_email(user.name, complaint)
    except Exception as exc:
        print(f"[WARN] Status-change email to user failed: {exc}")

    status_label = new_status.replace("_", " ").title()
    sms_body = (
        f"BUS സഹായി Update\n"
        f"Complaint {complaint.reference_number}: {status_label}\n"
        f"Category: {complaint.category}\n"
        f"Track at: http://localhost:5173/track"
    )

    sms_ok = False
    try:
        sms_ok, _ = send_sms(user.phone or DEMO_SMS_NUMBER, sms_body)
    except Exception as exc:
        print(f"[WARN] Status-change SMS to user failed: {exc}")

    title = f"Complaint {complaint.reference_number} — {status_label}"
    _record_notification("USER", user.id, complaint.id, "EMAIL", title, sms_body, True)
    _record_notification("USER", user.id, complaint.id, "SMS", title, sms_body, sms_ok)


# ---------------------------------------------------------------------------
# 3. DEPOT_TO_CONDUCTOR — conductor assigned
# ---------------------------------------------------------------------------

def send_conductor_notification(conductor, complaint, action_url):
    """
    Triggers on: depot head sends SMS to conductor
    Recipient: Conductor
    """
    sms_body = (
        f"BUS സഹായി - Duty Assignment\n\n"
        f"Ref: {complaint.reference_number}\n"
        f"Issue: {complaint.category.replace('_', ' ')}\n"
        f"Bus: {complaint.bus.bus_number if complaint.bus else 'N/A'}\n\n"
        f"Tap to respond:\n{action_url}"
    )

    sms_ok, info = send_sms(conductor.phone or DEMO_SMS_NUMBER, sms_body)

    title = f"Action Required: {complaint.reference_number}"
    _record_notification(
        "CONDUCTOR", None, complaint.id,
        "SMS", title, sms_body, sms_ok
    )

    return sms_ok, info


# ---------------------------------------------------------------------------
# 4a. ESCALATION_TO_ADMIN — admin notified on SLA breach
# ---------------------------------------------------------------------------

def notify_escalation_to_admin(complaint):
    """
    Triggers on: SLA breach auto-escalation
    Recipient: Admin
    """
    admin = User.query.filter_by(role="ADMIN").first()

    try:
        from app.services.email_service import send_escalation_to_admin_email
        send_escalation_to_admin_email(complaint)
    except Exception as exc:
        print(f"[WARN] Admin escalation email failed: {exc}")

    sms_body = (
        f"[ESCALATION] BUS സഹായി\n"
        f"SLA breached: {complaint.reference_number}\n"
        f"Category: {complaint.category}\n"
        f"Depot: {complaint.depot.name if complaint.depot else 'N/A'}\n"
        f"Priority: {complaint.priority}\n"
        f"Action required immediately."
    )

    sms_ok = False
    try:
        admin_phone = admin.phone if admin else None
        sms_ok, _ = send_sms(admin_phone or DEMO_SMS_NUMBER, sms_body)
    except Exception as exc:
        print(f"[WARN] Admin escalation SMS failed: {exc}")

    title = f"⚠️ ESCALATED: {complaint.reference_number}"
    admin_id = admin.id if admin else None
    _record_notification("ADMIN", admin_id, complaint.id, "EMAIL", title, sms_body, True)
    _record_notification("ADMIN", admin_id, complaint.id, "SMS", title, sms_body, sms_ok)


# ---------------------------------------------------------------------------
# 4b. ESCALATION — depot head notified on SLA breach
# ---------------------------------------------------------------------------

def notify_escalation(depot_id, complaint):
    """
    Triggers on: SLA breach auto-escalation
    Recipient: Depot Head
    """
    depot = Depot.query.get(depot_id)
    if not depot:
        return

    depot_head = User.query.filter_by(depot_id=depot_id, role="DEPOT_HEAD").first()

    # Email depot head
    try:
        from app.services.email_service import send_escalation_depot_email
        send_escalation_depot_email(depot.name, complaint)
    except Exception as exc:
        print(f"[WARN] Escalation depot email failed: {exc}")

    # Also notify admin
    try:
        notify_escalation_to_admin(complaint)
    except Exception as exc:
        print(f"[WARN] Escalation admin notify failed: {exc}")

    sms_body = (
        f"[ESCALATED] BUS സഹായി\n"
        f"Complaint {complaint.reference_number} has been escalated.\n"
        f"SLA deadline exceeded. Please take immediate action."
    )

    sms_ok = False
    try:
        sms_ok, _ = send_sms(depot.head_phone or DEMO_SMS_NUMBER, sms_body)
    except Exception as exc:
        print(f"[WARN] Escalation depot SMS failed: {exc}")

    title = f"⚠️ ESCALATED: {complaint.reference_number}"
    recipient_id = depot_head.id if depot_head else None
    _record_notification("DEPOT_HEAD", recipient_id, complaint.id, "EMAIL", title, sms_body, True)
    _record_notification("DEPOT_HEAD", recipient_id, complaint.id, "SMS", title, sms_body, sms_ok)


# ---------------------------------------------------------------------------
# Legacy compatibility wrappers (keep old call-sites working)
# ---------------------------------------------------------------------------

def notify_depot_head(depot_id, complaint):
    """Legacy: called from complaint_service.create_complaint."""
    depot = Depot.query.get(depot_id) if depot_id else None
    depot_head = User.query.filter_by(depot_id=depot_id, role="DEPOT_HEAD").first() if depot_id else None

    if not depot or not depot_head:
        return

    # Email + SMS to depot head
    try:
        from app.services.email_service import send_depot_report_email
        send_depot_report_email(depot.name, complaint)
    except Exception as exc:
        print(f"[WARN] Depot report email failed: {exc}")

    title = f"New Complaint: {complaint.reference_number}"
    body = (
        f"New complaint ({complaint.category}) assigned to {depot.name}.\n"
        f"Ref: {complaint.reference_number} | Priority: {complaint.priority}"
    )

    sms_ok = False
    try:
        sms_ok, _ = send_sms(depot.head_phone or DEMO_SMS_NUMBER, body)
    except Exception as exc:
        print(f"[WARN] Depot head SMS failed: {exc}")

    _record_notification("DEPOT_HEAD", depot_head.id, complaint.id, "EMAIL", title, body, True)
    _record_notification("DEPOT_HEAD", depot_head.id, complaint.id, "SMS", title, body, sms_ok)


# ---------------------------------------------------------------------------
# In-app notification retrieval
# ---------------------------------------------------------------------------

def get_user_notifications(user_id, page=1, per_page=20):
    """Get all notifications for a user, paginated."""
    pagination = (
        Notification.query
        .filter_by(recipient_id=user_id)
        .order_by(Notification.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    return {
        "notifications": [n.to_dict() for n in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
    }
