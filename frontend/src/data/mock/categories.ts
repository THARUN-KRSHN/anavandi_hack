export interface CategoryOption {
  id: string;
  label: string;
  description: string;
}

export const COMPLAINT_CATEGORIES: CategoryOption[] = [
  { id: 'cleanliness', label: 'Cleanliness', description: 'Dirty seats, trash, unhygienic conditions' },
  { id: 'conductor_staff', label: 'Conductor/Staff', description: 'Behavior, rude response, overcharging' },
  { id: 'driver', label: 'Driver', description: 'Reckless driving, overspeeding, skipping stops' },
  { id: 'ticketing', label: 'Ticketing', description: 'ETIM failure, wrong change, UPI issue' },
  { id: 'overcrowding', label: 'Overcrowding', description: 'Overcapacity, footboard standing' },
  { id: 'bus_condition', label: 'Bus condition', description: 'Broken seats, window issues, mechanical fault' },
  { id: 'safety', label: 'Safety', description: 'Harassment, unsafe driving, emergency concern' },
  { id: 'route_timing', label: 'Route/Timing', description: 'Late arrival, skipped route, cancelled trip' },
  { id: 'other', label: 'Other', description: 'Undisclosed type or general query' },
];
