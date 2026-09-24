import { z } from 'zod';

export const COMPLAINT_CATEGORIES = [
  'Cleanliness',
  'Conductor/Staff',
  'Driver',
  'Ticketing',
  'Overcrowding',
  'Bus condition',
  'Safety',
  'Route/Timing',
  'Other',
] as const;

export type CategoryType = typeof COMPLAINT_CATEGORIES[number];

export const busPlateRegex = /^KL-\d{2}-[A-Z]{1,2}-\d{1,4}$/i;

export const complaintSchema = z.object({
  category: z.string().min(1, 'Please select a problem category'),
  routeFrom: z.string().min(1, 'Please select or enter a starting location'),
  routeTo: z.string().min(1, 'Please select or enter a destination location'),
  busNumber: z.string().optional(),
  incidentTime: z.string().optional(),
  description: z.string().min(1, 'Please provide a short description of the issue'),
  complainantLat: z.number().optional(),
  complainantLng: z.number().optional(),
  evidenceFiles: z.array(z.string()).max(3, 'Maximum 3 images allowed').optional(),
});

export type ComplaintFormData = z.infer<typeof complaintSchema>;
