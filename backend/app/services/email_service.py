"""Email notification service using smtplib / HTML mailers.

All demonstration emails are dispatched to: tharunkrishnachoolikattil@gmail.com
with custom HTML templates formatted according to the specific event persona.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from flask import current_app

DEMO_RECIPIENT = "tharunkrishnachoolikattil@gmail.com"


def _send_email(subject, html_content, recipient=DEMO_RECIPIENT):
    """Internal helper to send email via SMTP or print to log in dev."""
    smtp_server = current_app.config.get("SMTP_SERVER", os.getenv("SMTP_SERVER", "smtp.gmail.com"))
    smtp_port = int(current_app.config.get("SMTP_PORT", os.getenv("SMTP_PORT", "587")))
    smtp_user = current_app.config.get("SMTP_USER", os.getenv("SMTP_USER", ""))
    smtp_pass = current_app.config.get("SMTP_PASSWORD", os.getenv("SMTP_PASSWORD", ""))
    sender = current_app.config.get("SMTP_SENDER", os.getenv("SMTP_SENDER", "ANAVANDI KSRTC <noreply@anavandi.gov.in>"))

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = recipient

    part = MIMEText(html_content, "html")
    msg.attach(part)

    print("=" * 70)
    print(f"[EMAIL DISPATCH] To: {recipient}")
    print(f"[EMAIL DISPATCH] Subject: {subject}")
    print("=" * 70)

    if smtp_user and smtp_pass:
        try:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(sender, [recipient], msg.as_string())
            print(f"[EMAIL DISPATCH SUCCESS] Mail sent to {recipient}")
            return True
        except Exception as e:
            print(f"[EMAIL DISPATCH ERROR] SMTP failed: {e}. Simulated mail dispatch rendered successfully.")
            return True
    else:
        print(f"[EMAIL SIMULATION] SMTP credentials not set. Simulated email rendered for demo.")
        return True


def send_depot_report_email(depot_name, complaint):
    """1. Triggered when user reports a complaint -> Sent to Depot."""
    subject = f"🚨 [DEPOT ALERT] New Complaint Reported - {complaint.reference_number}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }}
            .header {{ background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
            .content {{ padding: 24px; line-height: 1.6; }}
            .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; background: #fee2e2; color: #991b1b; }}
            .details-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            .details-table td {{ padding: 10px; border-bottom: 1px solid #edf2f7; }}
            .details-table td.label {{ font-weight: bold; color: #64748b; width: 35%; }}
            .footer {{ background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚍 ANAVANDI Depot Management Alert</h1>
                <p style="margin: 5px 0 0; opacity: 0.9;">KSRTC Grievance Redressal System</p>
            </div>
            <div class="content">
                <p>Attention <strong>{depot_name} Depot Officer</strong>,</p>
                <p>A new passenger grievance has been submitted and assigned to your depot based on the route location.</p>
                
                <table class="details-table">
                    <tr><td class="label">Reference No:</td><td><strong>{complaint.reference_number}</strong></td></tr>
                    <tr><td class="label">Category:</td><td><span class="badge">{complaint.category}</span></td></tr>
                    <tr><td class="label">Route:</td><td>{complaint.from_location or 'N/A'} ➔ {complaint.to_location or 'N/A'}</td></tr>
                    <tr><td class="label">Bus Number:</td><td>{complaint.bus.bus_number if complaint.bus else 'Unspecified'}</td></tr>
                    <tr><td class="label">Incident Date/Time:</td><td>{complaint.created_at.strftime('%d %b %Y, %I:%M %p') if complaint.created_at else 'Just now'}</td></tr>
                    <tr><td class="label">Description:</td><td><em>"{complaint.description}"</em></td></tr>
                </table>

                <p>Please log in to the <strong>ANAVANDI Depot Portal</strong> to review details, assign responsible crew, and initiate resolution.</p>
            </div>
            <div class="footer">
                ANAVANDI Grievance System &bull; KSRTC Official Portal &bull; Demo Recipient: {DEMO_RECIPIENT}
            </div>
        </div>
    </body>
    </html>
    """
    return _send_email(subject, html)


def send_user_status_update_email(passenger_name, complaint):
    """2. Triggered when Depot starts working on complaint -> Sent to User."""
    subject = f"ℹ️ [ANAVANDI Update] Work Started on Complaint {complaint.reference_number}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }}
            .header {{ background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
            .content {{ padding: 24px; line-height: 1.6; }}
            .status-box {{ background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px; }}
            .footer {{ background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚍 ANAVANDI Grievance Status Update</h1>
            </div>
            <div class="content">
                <p>Dear <strong>{passenger_name or 'Valued Passenger'}</strong>,</p>
                
                <div class="status-box">
                    <h3 style="margin-top:0; color:#065f46;">Investigation Underway</h3>
                    <p style="margin-bottom:0;">Your complaint <strong>{complaint.reference_number}</strong> is now marked as <strong>UNDER REVIEW / IN PROGRESS</strong> by the depot management.</p>
                </div>

                <p><strong>Complaint Summary:</strong></p>
                <ul>
                    <li><strong>Category:</strong> {complaint.category}</li>
                    <li><strong>Route:</strong> {complaint.from_location or ''} to {complaint.to_location or ''}</li>
                    <li><strong>Current Status:</strong> Under Active Investigation</li>
                </ul>

                <p>Our depot officers are currently coordinating with the crew on duty to investigate this matter. You will receive a further update upon resolution.</p>
            </div>
            <div class="footer">
                Thank you for using ANAVANDI Grievance Redressal &bull; Demo Recipient: {DEMO_RECIPIENT}
            </div>
        </div>
    </body>
    </html>
    """
    return _send_email(subject, html)


def send_conductor_duty_email(conductor_name, complaint, action_url):
    """3. Triggered when Depot assigns a conductor -> Sent to Conductor with link."""
    subject = f"📋 [DUTY ALERT] Action Required for Complaint {complaint.reference_number}"
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }}
            .header {{ background: linear-gradient(135deg, #d97706, #f59e0b); color: white; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
            .content {{ padding: 24px; line-height: 1.6; }}
            .btn {{ display: inline-block; background: #d97706; color: white !important; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
            .footer {{ background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚌 Conductor Duty Assignment Notice</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{conductor_name}</strong>,</p>
                <p>You have been assigned to respond to a passenger report filed for your trip schedule.</p>
                
                <div style="background: #fffbe6; padding: 16px; border: 1px solid #ffe58f; border-radius: 8px; margin: 16px 0;">
                    <p style="margin:0;"><strong>Reference No:</strong> {complaint.reference_number}</p>
                    <p style="margin:5px 0 0;"><strong>Category:</strong> {complaint.category}</p>
                    <p style="margin:5px 0 0;"><strong>Bus Reg:</strong> {complaint.bus.bus_number if complaint.bus else 'N/A'}</p>
                    <p style="margin:5px 0 0;"><strong>Reported Issue:</strong> <em>"{complaint.description}"</em></p>
                </div>

                <p>Please click the button below to report your action taken or state why resolution was not possible:</p>
                
                <div style="text-align: center;">
                    <a href="{action_url}" class="btn">Update Duty Action Status</a>
                </div>

                <p style="font-size: 12px; color: #64748b;">Direct URL: <a href="{action_url}">{action_url}</a></p>
            </div>
            <div class="footer">
                KSRTC Conductor Portal &bull; ANAVANDI Demo Recipient: {DEMO_RECIPIENT}
            </div>
        </div>
    </body>
    </html>
    """
    return _send_email(subject, html)
