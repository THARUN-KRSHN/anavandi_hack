"""Notification service — adapter pattern for SMS providers.

Supports MockSMSProvider (default) and SMSLocalProvider (for production).
"""

import os
import base64
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from datetime import datetime, timezone

from flask import current_app
from app.extensions import db
from app.models import Notification, User, Depot


# ---------------------------------------------------------------------------
# SMS Provider Adapters
# ---------------------------------------------------------------------------

class MockSMSProvider:
    """Console + DB logging SMS provider for demo/prototype."""

    def send(self, phone, message):
        print("=" * 60)
        print(f"[MOCK SMS] To: {phone}")
        print(f"[MOCK SMS] Message:")
        print(message)
        print("=" * 60)
        return True, "Mock SMS sent successfully."


class SMSLocalProvider:
    """SMSLocal.com adapter for Indian phone numbers.

    Requires SMS_API_KEY and SMS_SENDER_ID in config.
    """

    def __init__(self, api_key, sender_id):
        self.api_key = api_key
        self.sender_id = sender_id

    def send(self, phone, message):
        # Placeholder — actual API integration would go here
        try:
            import requests
            response = requests.post(
                "https://api.smslocal.com/send",
                data={
                    "apikey": self.api_key,
                    "sender": self.sender_id,
                    "number": phone,
                    "message": message,
                },
                timeout=10,
            )
            if response.status_code == 200:
                return True, "SMS sent via SMSLocal."
            return False, f"SMSLocal error: {response.text}"
        except Exception as e:
            print(f"[ERROR] SMSLocal send failed: {e}")
            return False, str(e)


class TwilioSMSProvider:
    """Twilio REST adapter using only the Python standard library."""

    def __init__(self, account_sid, auth_token, from_number):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number

    def send(self, phone, message):
        if not phone:
            return False, "Recipient phone number is missing."
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        body = urlencode({"To": phone, "From": self.from_number, "Body": message}).encode()
        auth = base64.b64encode(f"{self.account_sid}:{self.auth_token}".encode()).decode()
        request = Request(url, data=body, headers={"Authorization": f"Basic {auth}"}, method="POST")
        try:
            with urlopen(request, timeout=15) as response:
                payload = json.loads(response.read().decode())
            return True, f"SMS sent via Twilio ({payload.get('sid', 'accepted')})."
        except Exception as error:
            print(f"[ERROR] Twilio send failed: {error}")
            return False, str(error)


def _get_sms_provider():
    """Factory: return the configured SMS provider."""
    provider_name = current_app.config.get("SMS_PROVIDER", "mock")

    if provider_name == "smslocal":
        api_key = current_app.config.get("SMS_API_KEY", "")
        sender_id = current_app.config.get("SMS_SENDER_ID", "")
        if api_key:
            return SMSLocalProvider(api_key, sender_id)
        # Fallback to mock if no credentials
        print("[WARN] SMSLocal configured but no API key -- falling back to mock.")
        return MockSMSProvider()
    if provider_name == "twilio":
        account_sid = current_app.config.get("SMS_ACCOUNT_SID", "")
        auth_token = current_app.config.get("SMS_AUTH_TOKEN", "")
        from_number = current_app.config.get("SMS_FROM_NUMBER", "")
        if account_sid and auth_token and from_number:
            return TwilioSMSProvider(account_sid, auth_token, from_number)
        print("[WARN] Twilio configured without complete credentials -- falling back to mock.")
        return MockSMSProvider()
    else:
        return MockSMSProvider()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def send_sms(phone, message):
    """Send an SMS using the configured provider.

    This is the one common function — switching providers doesn't
    require changing complaint/depot/conductor logic.
    """
    provider = _get_sms_provider()
    success, msg = provider.send(phone, message)
    return success, msg


def notify_depot_head(depot_id, complaint):
    """Notify the depot head about a new/escalated complaint.

    Creates an IN_APP notification record + optional SMS.
    """
    depot = Depot.query.get(depot_id)
    if not depot:
        return

    # Find depot head user
    depot_head = User.query.filter_by(depot_id=depot_id, role="DEPOT_HEAD").first()
    if not depot_head:
        return

    title = f"New Complaint: {complaint.reference_number}"
    message = (
        f"A new complaint ({complaint.category}) has been assigned to {depot.name} depot.\n"
        f"Reference: {complaint.reference_number}\n"
        f"Status: {complaint.status}\n"
        f"Priority: {complaint.priority}"
    )

    # Create IN_APP notification
    notification = Notification(
        recipient_type="DEPOT_HEAD",
        recipient_id=depot_head.id,
        complaint_id=complaint.id,
        channel="IN_APP",
        title=title,
        message=message,
        status="SENT",
        sent_at=datetime.now(timezone.utc),
    )
    db.session.add(notification)
    db.session.commit()

    # Also send SMS if depot head has phone
    if depot.head_phone and depot.head_phone != "0":
        try:
            sms_success, sms_message = send_sms(depot.head_phone, message)
            # Record SMS notification
            sms_notification = Notification(
                recipient_type="DEPOT_HEAD",
                recipient_id=depot_head.id,
                complaint_id=complaint.id,
                channel="SMS",
                title=title,
                message=message,
                status="SENT" if sms_success else "FAILED",
                sent_at=datetime.now(timezone.utc) if sms_success else None,
            )
            db.session.add(sms_notification)
            db.session.commit()
        except Exception as e:
            print(f"[WARN] SMS to depot head failed: {e}")


def send_conductor_notification(conductor, complaint, action_url):
    """Send SMS to conductor with the action link."""
    message = (
        f"Public Transport Grievance\n\n"
        f"Complaint Reference: {complaint.reference_number}\n\n"
        f"A complaint requires your attention.\n\n"
        f"Update status:\n{action_url}"
    )

    success, msg = send_sms(conductor.phone, message)

    # Record notification
    notification = Notification(
        recipient_type="CONDUCTOR",
        recipient_id=None,  # Conductors don't have User accounts
        complaint_id=complaint.id,
        channel="SMS",
        title=f"Action Required: {complaint.reference_number}",
        message=message,
        status="SENT" if success else "FAILED",
        sent_at=datetime.now(timezone.utc) if success else None,
    )
    db.session.add(notification)
    db.session.commit()

    return success, msg


def get_user_notifications(user_id, page=1, per_page=20):
    """Get notifications for a user."""
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


def notify_escalation(depot_id, complaint):
    """Notify depot head about an escalated complaint."""
    depot = Depot.query.get(depot_id)
    if not depot:
        return

    depot_head = User.query.filter_by(depot_id=depot_id, role="DEPOT_HEAD").first()
    if not depot_head:
        return

    title = f"⚠️ ESCALATED: {complaint.reference_number}"
    message = (
        f"Complaint {complaint.reference_number} has been ESCALATED.\n"
        f"Category: {complaint.category}\n"
        f"The SLA deadline has been exceeded.\n"
        f"Please take immediate action."
    )

    notification = Notification(
        recipient_type="DEPOT_HEAD",
        recipient_id=depot_head.id,
        complaint_id=complaint.id,
        channel="IN_APP",
        title=title,
        message=message,
        status="SENT",
        sent_at=datetime.now(timezone.utc),
    )
    db.session.add(notification)
    db.session.commit()
