import jsPDF from 'jspdf';
import type { Complaint } from '../types/complaint';
import { formatDate } from './dateUtils';

export function generateComplaintPDF(complaint: Complaint) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(23, 23, 23); // #171717
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Bus Sahayi - Public Transport Grievance Record', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Passenger Case Summary', 14, 25);

  // Reference Code Box
  doc.setFillColor(249, 250, 251); // #F9FAFB
  doc.setDrawColor(234, 236, 240); // #EAECF0
  doc.roundedRect(14, 38, 182, 22, 3, 3, 'FD');

  doc.setTextColor(217, 45, 32); // #D92D20
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Reference ID: ${complaint.reference}`, 20, 52);

  doc.setTextColor(102, 112, 133); // #667085
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${complaint.status.toUpperCase()}`, 140, 52);

  // Case Metadata Table
  let y = 70;
  doc.setTextColor(23, 23, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Incident Details', 14, y);

  y += 6;
  doc.setLineWidth(0.5);
  doc.setDrawColor(217, 45, 32);
  doc.line(14, y, 196, y);

  y += 10;
  doc.setFontSize(10);
  
  const fields = [
    ['Category:', complaint.categoryLabel || complaint.category],
    ['Bus Registration:', complaint.busNumber || 'N/A'],
    ['Route Corridor:', `${complaint.routeFrom || ''} to ${complaint.routeTo || ''}`],
    ['Assigned Depot:', complaint.depotName || 'Depot Accountability Desk'],
    ['Incident Time:', complaint.incidentTime || 'N/A'],
    ['Date Filed:', formatDate(complaint.createdAt)],
  ];

  fields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, y);
    y += 8;
  });

  // Statement Box
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Passenger Statement:', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  const splitDescription = doc.splitTextToSize(complaint.description || 'No description provided.', 175);
  doc.text(splitDescription, 14, y);
  y += splitDescription.length * 6 + 10;

  // Status Milestone Timeline
  doc.setFont('helvetica', 'bold');
  doc.text('Public Timeline History', 14, y);
  y += 6;
  doc.line(14, y, 196, y);
  y += 8;

  const publicEvents = complaint.timeline ? complaint.timeline.filter((e) => e.isPublic) : [];
  if (publicEvents.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.text('No public milestones logged.', 14, y);
  } else {
    publicEvents.forEach((ev) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${ev.status.toUpperCase()}`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(ev.timestamp), 60, y);
      if (ev.notes) {
        y += 5;
        const notes = doc.splitTextToSize(`Note: ${ev.notes}`, 170);
        doc.text(notes, 20, y);
        y += notes.length * 5;
      } else {
        y += 6;
      }
    });
  }

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Bus Sahayi Public Transport Governance Platform - Official Document', 14, 285);

  // Save File
  doc.save(`BusSahayi_${complaint.reference}.pdf`);
}
