import type { DepotMaster } from '../types/depot';
import { apiRequest } from './api';

function mapDepot(raw: any): DepotMaster {
  return {
    id: String(raw.depot_id ?? raw.id),
    name: raw.name,
    code: raw.depot_code || '',
    district: raw.district || raw.name,
    location: raw.location || `${raw.name}, Kerala`,
    lat: Number(raw.latitude) || 9.9816,
    lng: Number(raw.longitude) || 76.2999,
    depotHeadId: raw.depot_head_user?.id ? String(raw.depot_head_user.id) : '',
    depotHeadName: raw.head_name || raw.depot_head_name || (raw.name ? `${raw.name} Officer In-Charge` : 'Depot Officer'),
    depotHeadPhone: raw.head_phone || raw.mobile || '',
    totalBuses: raw.bus_count || 0,
    totalCrew: raw.conductor_count || 0,
    openComplaints: raw.pending ?? 0,
    resolvedComplaints: raw.resolved ?? 0,
    totalComplaints: raw.total ?? 0,
    phone: raw.mobile || raw.head_phone || '',
    email: raw.email || '',
  };
}
export async function fetchDepots(): Promise<DepotMaster[]> { return (await apiRequest<any[]>('/admin/depots/map')).map(mapDepot); }
export async function fetchDepotDetail(id: string): Promise<{ depot: DepotMaster; complaints: any[] }> { const result = await apiRequest<any>(`/admin/depots/${id}`); return { depot: mapDepot({ ...result.depot, ...result }), complaints: result.recent_complaints || [] }; }
