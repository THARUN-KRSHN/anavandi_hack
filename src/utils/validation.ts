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
  category: z.enum(COMPLAINT_CATEGORIES),
  routeFrom: z.string().min(2, 'Please enter a valid starting location'),
  routeTo: z.string().min(2, 'Please enter a valid destination location'),
  busNumber: z
    .string()
    .min(5, 'Please enter a valid bus registration plate')
    .refine((val) => busPlateRegex.test(val), {
      message: 'Bus number format should be like KL-07-AB-1234',
    }),
  incidentTime: z.string().min(1, 'Please select approximate incident time'),
  description: z.string().min(5, 'Please provide a short description (at least 5 characters)'),
  complainantLat: z.number().optional(),
  complainantLng: z.number().optional(),
  evidenceFiles: z.array(z.string()).max(3, 'Maximum 3 images allowed').optional(),
});

export type ComplaintFormData = z.infer<typeof complaintSchema>;
