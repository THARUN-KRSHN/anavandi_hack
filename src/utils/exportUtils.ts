import * as XLSX from 'xlsx';
import type { Complaint } from '../types/complaint';

export function exportComplaintsToExcel(complaints: Complaint[], filename = 'depot_reports.xlsx') {
  const exportData = complaints.map((c) => ({
    'Reference ID': c.reference,
    Category: c.categoryLabel || c.category,
    'Bus Number': c.busNumber || 'N/A',
    'Route From': c.routeFrom || 'N/A',
    'Route To': c.routeTo || 'N/A',
    'Incident Time': c.incidentTime || 'N/A',
    Depot: c.depotName || c.depotId || 'N/A',
    Status: formatStatusLabel(c.status),
    'Description': c.description,
    'Resolution Note': c.resolutionNote || '',
    'Date Logged': new Date(c.createdAt).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Depot Complaints');
  XLSX.writeFile(workbook, filename);
}

export function exportComplaintsToCsv(complaints: Complaint[], filename = 'depot_reports.csv') {
  const exportData = complaints.map((c) => ({
    'Reference ID': c.reference,
    Category: c.categoryLabel || c.category,
    'Bus Number': c.busNumber || 'N/A',
    'Route From': c.routeFrom || 'N/A',
    'Route To': c.routeTo || 'N/A',
    'Incident Time': c.incidentTime || 'N/A',
    Depot: c.depotName || c.depotId || 'N/A',
    Status: formatStatusLabel(c.status),
    'Description': c.description,
    'Resolution Note': c.resolutionNote || '',
    'Date Logged': new Date(c.createdAt).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'submitted':
      return 'Submitted';
    case 'forwarded_to_conductor':
      return 'Forwarded to Conductor';
    case 'acknowledged':
      return 'Acknowledged';
    case 'resolved':
      return 'Resolved';
    default:
      return status.toUpperCase();
  }
}
