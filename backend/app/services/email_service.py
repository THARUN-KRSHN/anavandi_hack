"""Email notification service — BUS സഹായി KSRTC Grievance System.

DEMO MODE: All emails are dispatched to DEMO_RECIPIENT regardless of
the logical recipient.  Logical recipient info is included in the email
body for transparency.

Covers all 4 notification types:
  1. USER_TO_DEPOT   — complaint submitted → depot head + user confirmation
  2. DEPOT_TO_USER   — status changed → user notified
  3. DEPOT_TO_CONDUCTOR — conductor assigned → conductor notified
  4. ESCALATION_TO_ADMIN — SLA breach → admin notified
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

DEMO_RECIPIENT = "tharunkrishnachoolikattil@gmail.com"

# Shared brand colours
_BRAND_BLUE = "#1e3a8a"
_BRAND_ACCENT = "#3b82f6"
_BRAND_GREEN = "#059669"
_BRAND_AMBER = "#d97706"
_BRAND_RED = "#dc2626"


def _route_str(complaint):
    """Safe helper — returns 'Source → Destination' from the complaint's route relationship."""
    if complaint.route:
        src = complaint.route.source or "N/A"
        dst = complaint.route.destination or "N/A"
        return f"{src} → {dst}"
    # Fallback: try deprecated/alternate attributes gracefully
    src = getattr(complaint, "from_location", None) or getattr(complaint, "route_from", None) or "N/A"
    dst = getattr(complaint, "to_location", None) or getattr(complaint, "route_to", None) or "N/A"
    return f"{src} → {dst}"

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _base_styles():
    return """
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9;
               color: #1e293b; margin: 0; padding: 24px; }
        .wrapper { max-width: 620px; margin: 0 auto; }
        .card { background: #ffffff; border-radius: 14px; overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        .header { padding: 28px 32px; text-align: center; }
        .header .brand { font-size: 13px; opacity: 0.85; margin: 6px 0 0; letter-spacing: 0.5px; }
        .header h1 { margin: 8px 0 0; font-size: 20px; font-weight: 700; }
        .content { padding: 28px 32px; line-height: 1.7; }
        .details-table { width: 100%; border-collapse: collapse; margin: 18px 0; }
        .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .details-table .lbl { font-weight: 600; color: #64748b; width: 38%; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px;
                 font-weight: 700; font-size: 12px; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-purple { background: #ede9fe; color: #5b21b6; }
        .btn { display: inline-block; padding: 13px 26px; border-radius: 8px;
               font-weight: 700; font-size: 15px; text-decoration: none;
               color: #ffffff !important; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .divider { border: none; border-top: 1px solid #f1f5f9; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 16px 32px; text-align: center;
                  font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .demo-note { background: #fef9c3; border: 1px solid #fde047; border-radius: 6px;
                     padding: 8px 12px; font-size: 11px; color: #713f12; margin-top: 16px; }
    """


def _header(bg_gradient, emoji, title, subtitle="BUS സഹായി · KSRTC Grievance System"):
    return f"""
    <div class="header" style="background: linear-gradient(135deg, {bg_gradient});">
        <div style="font-size:36px;">{emoji}</div>
        <p class="brand" style="color:rgba(255,255,255,0.85);">{subtitle}</p>
        <h1 style="color:#ffffff;">{title}</h1>
    </div>"""


def _footer(logical_recipient_label=""):
    demo_note = ""
    if logical_recipient_label:
        demo_note = f'<p class="demo-note">🔒 <strong>DEMO MODE</strong>: Logical recipient — {logical_recipient_label}. All emails routed to demo address.</p>'
    return f"""
    <div class="footer">
        {demo_note}
        <p>BUS സഹായി &bull; KSRTC Official Grievance Portal &bull; Kerala, India</p>
        <p style="margin:4px 0 0;">This is an automated notification. Do not reply to this email.</p>
    </div>"""


def _send_email(subject, html_content, recipient=DEMO_RECIPIENT):
    """Dispatch email via SMTP. Falls back to console log if no credentials."""
    cfg = current_app.config
    smtp_server = cfg.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(cfg.get("SMTP_PORT", 587))
    smtp_user = cfg.get("SMTP_USER", "")
    smtp_pass = cfg.get("SMTP_PASSWORD", "")
    sender = cfg.get("SMTP_SENDER", "BUS സഹായി <noreply@bussahayi.gov.in>")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient
    msg.attach(MIMEText(html_content, "html"))

    print("=" * 72)
    print(f"[EMAIL] To: {recipient} | Subject: {subject}")
    print("=" * 72)

    if smtp_user and smtp_pass:
        try:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as srv:
                srv.starttls()
                srv.login(smtp_user, smtp_pass)
                srv.sendmail(sender, [recipient], msg.as_string())
            print(f"[EMAIL SUCCESS] Sent to {recipient}")
            return True
        except Exception as exc:
            print(f"[EMAIL ERROR] SMTP failed: {exc}")
            return False
    else:
        print("[EMAIL SIMULATION] No SMTP credentials configured.")
        return True


# ---------------------------------------------------------------------------
# 1. USER CONFIRMS COMPLAINT SUBMISSION (User ← System)
# ---------------------------------------------------------------------------

def send_user_submission_confirmation(user_name, complaint):
    """Sent to the passenger immediately after complaint submission."""
    subject = f"✅ Complaint Received — {complaint.reference_number} | BUS സഹായി"
    priority_badge = {
        "URGENT": ("badge-red", "🔴 URGENT"),
        "HIGH": ("badge-red", "🟠 HIGH"),
        "MEDIUM": ("badge-amber", "🟡 MEDIUM"),
        "NORMAL": ("badge-blue", "🔵 NORMAL"),
        "LOW": ("badge-green", "🟢 LOW"),
    }.get(complaint.priority, ("badge-blue", complaint.priority or "NORMAL"))

    html = f"""<!DOCTYPE html><html><head><style>{_base_styles()}</style></head><body>
    <div class="wrapper"><div class="card">
        {_header(f"{_BRAND_GREEN}, #10b981", "✅", "Complaint Successfully Received")}
        <div class="content">
            <p>Dear <strong>{user_name or 'Valued Passenger'}</strong>,</p>
            <p>Thank you for reporting your concern. Your complaint has been <strong>successfully registered</strong>
            and assigned to the concerned depot for action.</p>

            <table class="details-table">
                <tr><td class="lbl">Reference No.</td>
                    <td><strong style="font-size:16px;color:{_BRAND_BLUE};">{complaint.reference_number}</strong></td></tr>
                <tr><td class="lbl">Category</td>
                    <td><span class="badge badge-red">{complaint.category.replace('_',' ')}</span></td></tr>
                <tr><td class="lbl">Priority</td>
                    <td><span class="badge {priority_badge[0]}">{priority_badge[1]}</span></td></tr>
                <tr><td class="lbl">Route</td>
                    <td>{_route_str(complaint)}</td></tr>
                <tr><td class="lbl">Bus No.</td>
                    <td>{complaint.bus.bus_number if complaint.bus else '—'}</td></tr>
                <tr><td class="lbl">Status</td>
                    <td><span class="badge badge-blue">SUBMITTED</span></td></tr>
                <tr><td class="lbl">Submitted At</td>
                    <td>{complaint.created_at.strftime('%d %b %Y, %I:%M %p UTC') if complaint.created_at else 'Just now'}</td></tr>
            </table>

            <p>You will receive updates at each stage of the resolution process.
            Please save your reference number for future tracking.</p>

            <hr class="divider">
            <p style="font-size:13px;color:#64748b;">
                📌 <strong>What happens next?</strong><br>
                Our depot team will review your complaint within the stipulated SLA period and assign
                the responsible crew member. You will be notified via email and SMS at each step.
            </p>
        </div>
        {_footer(f"Passenger: {user_name or 'Unknown'}")}
    </div></div></body></html>"""

    return _send_email(subject, html)


# ---------------------------------------------------------------------------
# 2. DEPOT HEAD ALERT — new complaint assigned (Depot ← System)
# ---------------------------------------------------------------------------

def send_depot_report_email(depot_name, complaint):
    """Alert depot head when a new complaint is assigned to their depot."""
    subject = f"🚨 [DEPOT ALERT] New Complaint — {complaint.reference_number} | {depot_name}"

    priority_color = {
        "URGENT": _BRAND_RED,
        "HIGH": "#ea580c",
        "MEDIUM": _BRAND_AMBER,
        "NORMAL": _BRAND_ACCENT,
        "LOW": _BRAND_GREEN,
    }.get(complaint.priority, _BRAND_ACCENT)

    html = f"""<!DOCTYPE html><html><head><style>{_base_styles()}</style></head><body>
    <div class="wrapper"><div class="card">
        {_header(f"{_BRAND_BLUE}, {_BRAND_ACCENT}", "🚍", f"New Complaint — {depot_name} Depot")}
        <div class="content">
            <p>Attention <strong>{depot_name} Depot Officer</strong>,</p>
            <p>A new passenger grievance has been registered and <strong>automatically assigned</strong>
            to your depot based on route data. Immediate attention is required.</p>

            <table class="details-table">
                <tr><td class="lbl">Reference No.</td>
                    <td><strong style="font-size:16px;color:{_BRAND_BLUE};">{complaint.reference_number}</strong></td></tr>
                <tr><td class="lbl">Category</td>
                    <td><span class="badge badge-red">{complaint.category.replace('_',' ')}</span></td></tr>
                <tr><td class="lbl">Priority</td>
                    <td><span style="font-weight:700;color:{priority_color};">⬤ {complaint.priority}</span></td></tr>
                <tr><td class="lbl">Route</td>
                    <td>{_route_str(complaint)}</td></tr>
                <tr><td class="lbl">Bus No.</td>
                    <td>{complaint.bus.bus_number if complaint.bus else '—'}</td></tr>
                <tr><td class="lbl">Reported At</td>
                    <td>{complaint.created_at.strftime('%d %b %Y, %I:%M %p UTC') if complaint.created_at else '—'}</td></tr>
                <tr><td class="lbl">Description</td>
                    <td><em>"{complaint.description}"</em></td></tr>
            </table>

            <p>Please log in to the <strong>BUS സഹായി Depot Portal</strong> to assign responsible crew
            and initiate the resolution process within the SLA window.</p>

            <div style="text-align:center;margin:24px 0;">
                <a href="http://localhost:5173/depot" class="btn" style="background:{_BRAND_BLUE};">
                    Open Depot Dashboard →
                </a>
            </div>
        </div>
        {_footer(f"Depot Head — {depot_name}")}
    </div></div></body></html>"""

    return _send_email(subject, html)


# ---------------------------------------------------------------------------
# 3. USER STATUS UPDATE — work started / status changed (User ← Depot)
# ---------------------------------------------------------------------------

def send_user_status_update_email(passenger_name, complaint):
    """Notify passenger when depot changes complaint status."""
    status = complaint.status
    status_configs = {
        "UNDER_REVIEW": {
            "emoji": "🔍", "label": "Under Review", "color": _BRAND_ACCENT,
            "badge": "badge-blue",
            "msg": "Your complaint is now <strong>under active investigation</strong> by our depot team.",
        },
        "ASSIGNED": {
            "emoji": "👷", "label": "Assigned", "color": _BRAND_AMBER,
            "badge": "badge-amber",
            "msg": "A crew member has been <strong>assigned</strong> to handle your complaint.",
        },
        "ACTION_TAKEN": {
            "emoji": "✅", "label": "Action Taken", "color": _BRAND_GREEN,
            "badge": "badge-green",
            "msg": "The responsible crew member has taken <strong>corrective action</strong> on your complaint.",
        },
        "RESOLVED": {
            "emoji": "🎉", "label": "Resolved", "color": _BRAND_GREEN,
            "badge": "badge-green",
            "msg": "Your complaint has been <strong>successfully resolved</strong>. Thank you for helping improve our service!",
        },
        "UNABLE_TO_RESOLVE": {
            "emoji": "⚠️", "label": "Unable to Resolve", "color": _BRAND_AMBER,
            "badge": "badge-amber",
            "msg": "We were <strong>unable to resolve</strong> your complaint at this time. The matter has been escalated.",
        },
    }
    cfg = status_configs.get(status, {
        "emoji": "📋", "label": status.replace("_", " "), "color": _BRAND_BLUE,
        "badge": "badge-blue",
        "msg": f"Your complaint status has been updated to <strong>{status.replace('_', ' ')}</strong>.",
    })

    subject = f"{cfg['emoji']} Complaint Update — {cfg['label']} | {complaint.reference_number}"

    html = f"""<!DOCTYPE html><html><head><style>{_base_styles()}</style></head><body>
    <div class="wrapper"><div class="card">
        {_header(f"{_BRAND_GREEN}, #10b981", cfg['emoji'], f"Status Update: {cfg['label']}")}
        <div class="content">
            <p>Dear <strong>{passenger_name or 'Valued Passenger'}</strong>,</p>
            <p>{cfg['msg']}</p>

            <table class="details-table">
                <tr><td class="lbl">Reference No.</td>
                    <td><strong style="color:{_BRAND_BLUE};">{complaint.reference_number}</strong></td></tr>
                <tr><td class="lbl">Category</td>
                    <td>{complaint.category.replace('_', ' ')}</td></tr>
                <tr><td class="lbl">New Status</td>
                    <td><span class="badge {cfg['badge']}" style="font-size:13px;">{cfg['emoji']} {cfg['label']}</span></td></tr>
                <tr><td class="lbl">Route</td>
                    <td>{_route_str(complaint)}</td></tr>
                <tr><td class="lbl">Depot</td>
                    <td>{complaint.depot.name if complaint.depot else '—'}</td></tr>
            </table>

            <p>You can track the real-time status of your complaint by logging into the passenger portal.</p>
        </div>
        {_footer(f"Passenger: {passenger_name or 'Unknown'}")}
    </div></div></body></html>"""

    return _send_email(subject, html)


# ---------------------------------------------------------------------------
# 4. CONDUCTOR DUTY ASSIGNMENT (Conductor ← Depot)
# ---------------------------------------------------------------------------

def send_conductor_duty_email(conductor_name, complaint, action_url, recipient=None):
    """Notify conductor / depot head when assigned to a complaint, with secure action link."""
    # Support both SQLAlchemy model and generic dict/object
    if isinstance(complaint, dict):
        ref_no = complaint.get("reference_number") or complaint.get("reference") or "GRV-TEMP"
        category = complaint.get("categoryLabel") or complaint.get("category") or "General"
        bus_no = complaint.get("busNumber") or complaint.get("bus_number") or "N/A"
        desc = complaint.get("description") or "No description provided."
        route_info = complaint.get("routeCode") or complaint.get("route") or "N/A"
    else:
        ref_no = getattr(complaint, "reference_number", "GRV-TEMP")
        category = getattr(complaint, "category", "General")
        bus_no = complaint.bus.bus_number if getattr(complaint, "bus", None) else getattr(complaint, "bus_number", "N/A")
        desc = getattr(complaint, "description", "No description provided.")
        route_info = _route_str(complaint)

    subject = f"📋 Duty Assignment — Action Required | {ref_no}"

    html = f"""<!DOCTYPE html><html><head><style>{_base_styles()}</style></head><body>
    <div class="wrapper"><div class="card">
        {_header(f"{_BRAND_AMBER}, #f59e0b", "🚌", "Conductor Duty Assignment")}
        <div class="content">
            <p>Hello <strong>{conductor_name}</strong>,</p>
            <p>You have been assigned to respond to a passenger grievance filed for your duty schedule.
            Please review the details and update your action status via the secure link below.</p>

            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:18px;margin:20px 0;">
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:6px 0;font-weight:600;color:#92400e;width:38%;">Reference No.</td>
                        <td style="padding:6px 0;font-weight:700;">{ref_no}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:600;color:#92400e;">Category</td>
                        <td style="padding:6px 0;">{category.replace('_', ' ')}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:600;color:#92400e;">Bus No.</td>
                        <td style="padding:6px 0;">{bus_no}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:600;color:#92400e;">Route</td>
                        <td style="padding:6px 0;">{route_info}</td></tr>
                    <tr><td style="padding:6px 0;font-weight:600;color:#92400e;">Issue</td>
                        <td style="padding:6px 0;font-style:italic;">"{desc}"</td></tr>
                </table>
            </div>

            <p>Tap the button below to submit your response:</p>

            <div style="text-align:center;margin:24px 0;">
                <a href="{action_url}" class="btn" style="background:{_BRAND_AMBER};">
                    📝 Update Duty Action →
                </a>
            </div>

            <p style="font-size:12px;color:#94a3b8;">
                Direct link: <a href="{action_url}" style="color:{_BRAND_ACCENT};">{action_url}</a><br>
                ⏰ This link expires in 24 hours.
            </p>
        </div>
        {_footer(f"Conductor: {conductor_name}")}
    </div></div></body></html>"""

    target_email = recipient or DEMO_RECIPIENT
    return _send_email(subject, html, recipient=target_email)


# ---------------------------------------------------------------------------
# 5. ESCALATION ALERT — SLA breached → Admin notified
# ---------------------------------------------------------------------------

def send_escalation_to_admin_email(complaint):
    """Notify admin when a complaint is escalated due to SLA breach."""
    subject = f"⚠️ [ESCALATION ALERT] SLA Breached — {complaint.reference_number}"

    elapsed = ""
    if complaint.created_at:
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        created = complaint.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        hours = (now - created).total_seconds() / 3600
        elapsed = f"{hours:.1f} hours"

    html = f"""<!DOCTYPE html><html><head><style>{_base_styles()}</style></head><body>
    <div class="wrapper"><div class="card">
        {_header(f"{_BRAND_RED}, #ef4444", "⚠️", "Escalation Alert — SLA Breached", "BUS സഹായി · Admin Notification")}
        <div class="content">
            <p>Dear <strong>Admin</strong>,</p>
            <p>A passenger complaint has been <strong>automatically escalated</strong> because the
            Service Level Agreement (SLA) deadline has been exceeded without resolution.</p>

            <div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:10px;padding:18px;margin:20px 0;">
                <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#991b1b;">
                    🔴 ESCALATED COMPLAINT
                </p>
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:5px 0;font-weight:600;color:#7f1d1d;width:38%;">Reference No.</td>
                        <td style="padding:5px 0;font-weight:700;">{complaint.reference_number}</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#7f1d1d;">Category</td>
                        <td style="padding:5px 0;">{complaint.category.replace('_', ' ')}</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#7f1d1d;">Priority</td>
                        <td style="padding:5px 0;">{complaint.priority}</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#7f1d1d;">Depot</td>
                        <td style="padding:5px 0;">{complaint.depot.name if complaint.depot else 'Unassigned'}</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#7f1d1d;">Age</td>
                        <td style="padding:5px 0;color:#dc2626;font-weight:700;">{elapsed} elapsed</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#7f1d1d;">Status</td>
                        <td style="padding:5px 0;"><span class="badge badge-red">ESCALATED</span></td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#7f1d1d;">Route</td>
                        <td style="padding:5px 0;">{_route_str(complaint)}</td></tr>
                    <tr><td style="padding:5px 0;font-weight:600;color:#7f1d1d;">Description</td>
                        <td style="padding:5px 0;font-style:italic;">"{complaint.description}"</td></tr>
                </table>
            </div>

            <p>Please take <strong>immediate administrative action</strong> to resolve this complaint.</p>

            <div style="text-align:center;margin:24px 0;">
                <a href="http://localhost:5173/admin" class="btn" style="background:{_BRAND_RED};">
                    🔐 Open Admin Dashboard →
                </a>
            </div>
        </div>
        {_footer("Admin — KSRTC System Administrator")}
    </div></div></body></html>"""

    return _send_email(subject, html)


# ---------------------------------------------------------------------------
# 6. ESCALATION DEPOT ALERT — depot head reminded on escalation
# ---------------------------------------------------------------------------

def send_escalation_depot_email(depot_name, complaint):
    """Notify depot head when their complaint is escalated."""
    subject = f"🔴 [ESCALATED] Immediate Action Required — {complaint.reference_number}"

    html = f"""<!DOCTYPE html><html><head><style>{_base_styles()}</style></head><body>
    <div class="wrapper"><div class="card">
        {_header(f"{_BRAND_RED}, #ef4444", "🔴", "Complaint Escalated — Immediate Action")}
        <div class="content">
            <p>Attention <strong>{depot_name} Depot Officer</strong>,</p>
            <p>The following complaint has been <strong>automatically escalated</strong> to the
            administration due to SLA breach. Your immediate attention is required.</p>

            <table class="details-table">
                <tr><td class="lbl">Reference No.</td>
                    <td><strong style="color:{_BRAND_RED};">{complaint.reference_number}</strong></td></tr>
                <tr><td class="lbl">Category</td>
                    <td>{complaint.category.replace('_', ' ')}</td></tr>
                <tr><td class="lbl">Status</td>
                    <td><span class="badge badge-red">🔴 ESCALATED</span></td></tr>
                <tr><td class="lbl">Description</td>
                    <td><em>"{complaint.description}"</em></td></tr>
            </table>

            <p>This complaint has been flagged to the administration.
            Please update the status and provide a resolution note immediately.</p>

            <div style="text-align:center;margin:24px 0;">
                <a href="http://localhost:5173/depot" class="btn" style="background:{_BRAND_RED};">
                    Open Depot Dashboard →
                </a>
            </div>
        </div>
        {_footer(f"Depot Head — {depot_name}")}
    </div></div></body></html>"""

    return _send_email(subject, html)
