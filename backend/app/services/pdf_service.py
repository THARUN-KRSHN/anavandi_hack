"""PDF service — generates complaint PDF using ReportLab."""

import io
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable


def generate_complaint_pdf(complaint):
    """Generate a PDF document for a complaint.

    Returns a BytesIO buffer containing the PDF.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontSize=18,
        spaceAfter=6,
        textColor=colors.HexColor("#1a237e"),
    )
    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=12,
        spaceAfter=4,
        textColor=colors.HexColor("#283593"),
    )
    normal_style = styles["Normal"]
    label_style = ParagraphStyle(
        "Label",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.grey,
    )
    value_style = ParagraphStyle(
        "Value",
        parent=styles["Normal"],
        fontSize=11,
        spaceBefore=2,
        spaceAfter=8,
    )

    elements = []

    # Header
    elements.append(Paragraph("PUBLIC TRANSPORT GRIEVANCE", title_style))
    elements.append(Paragraph("Complaint Report", styles["Heading3"]))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a237e")))
    elements.append(Spacer(1, 12))

    # Reference
    elements.append(Paragraph("Reference Number", label_style))
    elements.append(Paragraph(complaint.reference_number, value_style))

    # Category
    elements.append(Paragraph("Category", label_style))
    elements.append(Paragraph(complaint.category.replace("_", " ").title(), value_style))

    # Description
    elements.append(Paragraph("Description", label_style))
    elements.append(Paragraph(complaint.description, value_style))

    # Bus
    if complaint.bus:
        elements.append(Paragraph("Bus", label_style))
        elements.append(Paragraph(
            f"{complaint.bus.bus_number} ({complaint.bus.registration_number or 'N/A'})",
            value_style,
        ))

    # Route
    if complaint.route:
        elements.append(Paragraph("Route", label_style))
        elements.append(Paragraph(
            f"{complaint.route.source} → {complaint.route.destination}",
            value_style,
        ))

    # Date & Time
    elements.append(Paragraph("Reported Date & Time", label_style))
    date_str = complaint.reported_date.isoformat() if complaint.reported_date else "N/A"
    time_str = complaint.reported_time.strftime("%H:%M") if complaint.reported_time else "N/A"
    elements.append(Paragraph(f"{date_str} at {time_str}", value_style))

    # Status
    elements.append(Paragraph("Current Status", label_style))
    status_text = complaint.status.replace("_", " ").title()
    elements.append(Paragraph(f"<b>{status_text}</b>", value_style))

    # Depot
    if complaint.depot:
        elements.append(Paragraph("Assigned Depot", label_style))
        elements.append(Paragraph(complaint.depot.name, value_style))

    # Priority
    elements.append(Paragraph("Priority", label_style))
    elements.append(Paragraph(complaint.priority, value_style))

    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    elements.append(Spacer(1, 8))

    # Timeline
    if complaint.history:
        elements.append(Paragraph("Complaint Timeline", heading_style))

        timeline_data = [["Date/Time", "Status", "Comment"]]
        for h in complaint.history:
            dt = h.created_at.strftime("%Y-%m-%d %H:%M") if h.created_at else "—"
            status = h.new_status.replace("_", " ").title()
            comment = h.comment or "—"
            timeline_data.append([dt, status, Paragraph(comment, normal_style)])

        timeline_table = Table(timeline_data, colWidths=[4 * cm, 3 * cm, 9 * cm])
        timeline_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8eaf6")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1a237e")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        elements.append(timeline_table)

    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "This is a system-generated document from the Public Transport Grievance Portal.",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.grey),
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
