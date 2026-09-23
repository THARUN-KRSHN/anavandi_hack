import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DepotMaster } from '../../types/depot';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface AdminDepotMapProps {
  depots: DepotMaster[];
}

// Auto-resizer and Bounds adjuster Hook
function AdminMapController({ depots }: { depots: DepotMaster[] }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size after mount to prevent grey/missing tiles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // If depots are loaded, fit bounds to show all Kerala depots
    if (depots.length > 0) {
      const validPoints = depots
        .filter((d) => d.lat && d.lng && !isNaN(d.lat) && !isNaN(d.lng))
        .map((d) => [d.lat, d.lng] as [number, number]);

      if (validPoints.length > 1) {
        try {
          const bounds = L.latLngBounds(validPoints);
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
        } catch (_) {}
      }
    }

    return () => clearTimeout(timer);
  }, [map, depots]);

  return null;
}

export const AdminDepotMap: React.FC<AdminDepotMapProps> = ({ depots }) => {
  const navigate = useNavigate();
  // Center of Kerala
  const keralaCenter: [number, number] = [10.2, 76.4];

  const getDepotColor = (depot: DepotMaster): { hex: string; name: string; bgClass: string; textClass: string } => {
    const total = Math.max(1, depot.totalComplaints || 1);
    const resolved = Math.max(0, depot.resolvedComplaints || 0);
    const unresolved = Math.max(0, total - resolved);
    const ratio = unresolved / total;

    if (ratio <= 0.3) {
      return { hex: '#16A34A', name: 'Green (<=30% Unresolved)', bgClass: 'bg-green-500', textClass: 'text-[#16A34A]' };
    }
    if (ratio <= 0.6) {
      return { hex: '#D97706', name: 'Yellow (30-60% Unresolved)', bgClass: 'bg-amber-500', textClass: 'text-amber-600' };
    }
    return { hex: '#D92D20', name: 'Red (>60% Unresolved)', bgClass: 'bg-[#D92D20]', textClass: 'text-[#D92D20]' };
  };

  const createNodeIcon = (depot: DepotMaster) => {
    const total = Math.max(0, depot.totalComplaints || 0);
    const resolved = Math.max(0, depot.resolvedComplaints || 0);
    const unresolved = Math.max(0, total - resolved);
    const color = getDepotColor(depot);

    return L.divIcon({
      className: 'custom-depot-node-icon',
      html: `
        <div title="${depot.name} - ${unresolved} pending" style="
          background-color: ${color.hex};
          color: white;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 12px;
          border: 2.5px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          cursor: pointer;
          position: relative;
          transition: transform 0.15s ease;
        ">
          ${unresolved}
          <div style="
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 5px solid ${color.hex};
          "></div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 43],
      popupAnchor: [0, -40],
    });
  };

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-[32px] overflow-hidden border border-[#EAECF0] shadow-sm">
      <MapContainer
        center={keralaCenter}
        zoom={8}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <AdminMapController depots={depots} />

        {depots.map((depot) => {
          const lat = Number(depot.lat);
          const lng = Number(depot.lng);
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

          const total = Math.max(0, depot.totalComplaints || 0);
          const resolved = Math.max(0, depot.resolvedComplaints || 0);
          const unresolved = Math.max(0, total - resolved);

          return (
            <Marker
              key={depot.id}
              position={[lat, lng]}
              icon={createNodeIcon(depot)}
            >
              <Tooltip direction="top" offset={[0, -38]} opacity={0.95}>
                <span className="font-bold text-xs">
                  {depot.name} ({unresolved} pending)
                </span>
              </Tooltip>
              <Popup className="depot-node-popup">
                <div className="p-3 max-w-xs space-y-3 font-sans">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Building2 className="w-4 h-4 text-[#171717]" />
                    <div>
                      <h4 className="text-xs font-black text-[#171717]">{depot.name}</h4>
                      <span className="text-[10px] font-bold text-[#667085]">{depot.district} &bull; {depot.code}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <span className="text-[9px] font-bold text-[#667085] block uppercase">Total</span>
                      <span className="font-black text-[#171717]">{total}</span>
                    </div>
                    <div className="p-2 bg-green-50 rounded-xl">
                      <span className="text-[9px] font-bold text-[#16A34A] block uppercase">Solved</span>
                      <span className="font-black text-[#16A34A]">{resolved}</span>
                    </div>
                    <div className="p-2 bg-red-50 rounded-xl">
                      <span className="text-[9px] font-bold text-[#D92D20] block uppercase">Pending</span>
                      <span className="font-black text-[#D92D20]">{unresolved}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#667085] space-y-0.5">
                    <div><span className="font-bold text-[#171717]">Depot Officer:</span> {depot.depotHeadName}</div>
                    <div><span className="font-bold text-[#171717]">Fleet:</span> {depot.totalBuses} buses &bull; {depot.totalCrew} crew</div>
                  </div>

                  <button
                    onClick={() => navigate(`/admin/depot/${depot.id}`)}
                    className="w-full py-2 bg-[#171717] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    View Depot Dashboard <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Overlay Legend */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#EAECF0] shadow-lg space-y-2 max-w-xs">
        <h4 className="text-xs font-black uppercase text-[#171717] tracking-wider">
          Depot Backlog Status Legend
        </h4>
        <div className="space-y-1.5 text-[11px] font-semibold text-[#171717]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#16A34A] border border-white shrink-0" />
            <span>Green: &le; 30% Unresolved (Low Backlog)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white shrink-0" />
            <span>Yellow: 30% - 60% Unresolved (Moderate)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#D92D20] border border-white shrink-0" />
            <span>Red: &gt; 60% Unresolved (High Backlog)</span>
          </div>
        </div>
        <p className="text-[10px] text-[#667085] pt-1 border-t border-gray-100">
          Click any depot node to view quick stats or jump to full read-only depot view.
        </p>
      </div>
    </div>
  );
};
