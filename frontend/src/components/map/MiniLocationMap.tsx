import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issues by creating custom SVG divIcons
const createCustomMarkerIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
        white-space: nowrap;
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const userIcon = createCustomMarkerIcon('#16A34A', 'YOU');
const busIcon = createCustomMarkerIcon('#D92D20', 'BUS');
const originIcon = createCustomMarkerIcon('#2563EB', 'FROM');
const destIcon = createCustomMarkerIcon('#9333EA', 'TO');

interface MiniLocationMapProps {
  userLat?: number;
  userLng?: number;
  originLat?: number;
  originLng?: number;
  originName?: string;
  destLat?: number;
  destLng?: number;
  destName?: string;
  busLat?: number;
  busLng?: number;
  busNumber?: string;
  busPlate?: string;
  onManualPinChange?: (lat: number, lng: number) => void;
}

// Auto-resizer & Bounds Fitter Hook
function MapAutoResizer({
  userLat,
  userLng,
  originLat,
  originLng,
  destLat,
  destLng,
}: {
  userLat: number;
  userLng: number;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size to ensure Leaflet renders immediately without blank tiles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Fit map bounds to show complainant, origin, and destination together
    const points: [number, number][] = [[userLat, userLng]];
    if (originLat && originLng) points.push([originLat, originLng]);
    if (destLat && destLng) points.push([destLat, destLng]);

    if (points.length > 1) {
      try {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch (err) {
        console.warn('Leaflet fitBounds notice:', err);
      }
    } else {
      map.setView([userLat, userLng], 12);
    }

    return () => clearTimeout(timer);
  }, [userLat, userLng, originLat, originLng, destLat, destLng, map]);

  return null;
}

export const MiniLocationMap: React.FC<MiniLocationMapProps> = ({
  userLat = 9.9816,
  userLng = 76.2999,
  originLat,
  originLng,
  originName,
  destLat,
  destLng,
  destName,
  busLat,
  busLng,
  busNumber,
  busPlate,
  onManualPinChange,
}) => {
  // Compute fallback route bus location between origin and destination or near user
  let resolvedBusLat = busLat;
  let resolvedBusLng = busLng;

  if (!resolvedBusLat || !resolvedBusLng) {
    if (originLat && originLng && destLat && destLng) {
      // 40% along the route line from origin to destination
      resolvedBusLat = originLat + (destLat - originLat) * 0.4;
      resolvedBusLng = originLng + (destLng - originLng) * 0.4;
    } else {
      resolvedBusLat = userLat + 0.012;
      resolvedBusLng = userLng + 0.015;
    }
  }

  const resolvedBusPlate = busPlate || busNumber || 'Bus Service';

  // Polyline route coordinates
  const routePolylineCoords: [number, number][] = [];
  if (originLat && originLng) routePolylineCoords.push([originLat, originLng]);
  if (resolvedBusLat && resolvedBusLng && routePolylineCoords.length > 0) {
    routePolylineCoords.push([resolvedBusLat, resolvedBusLng]);
  }
  if (destLat && destLng) routePolylineCoords.push([destLat, destLng]);

  return (
    <div className="w-full h-[260px] min-h-[260px] rounded-3xl overflow-hidden border border-[#EAECF0] shadow-inner relative z-0 bg-gray-100">
      <MapContainer
        center={[userLat, userLng]}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapAutoResizer
          userLat={userLat}
          userLng={userLng}
          originLat={originLat}
          originLng={originLng}
          destLat={destLat}
          destLng={destLng}
        />

        {/* Route Line connecting Origin -> Bus -> Destination */}
        {routePolylineCoords.length > 1 && (
          <Polyline
            positions={routePolylineCoords}
            color="#D92D20"
            weight={4}
            dashArray="6, 8"
            opacity={0.8}
          />
        )}

        {/* Origin Depot Marker */}
        {originLat && originLng && (
          <Marker position={[originLat, originLng]} icon={originIcon}>
            <Popup>
              <div className="text-xs font-bold text-[#2563EB]">
                Route Origin (From)<br />
                <span className="font-normal text-gray-700">{originName || 'Starting Depot'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Depot Marker */}
        {destLat && destLng && (
          <Marker position={[destLat, destLng]} icon={destIcon}>
            <Popup>
              <div className="text-xs font-bold text-[#9333EA]">
                Route Destination (To)<br />
                <span className="font-normal text-gray-700">{destName || 'Ending Depot'}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* User / Complainant Marker */}
        <Marker
          position={[userLat, userLng]}
          icon={userIcon}
          draggable={!!onManualPinChange}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              if (onManualPinChange) {
                onManualPinChange(pos.lat, pos.lng);
              }
            },
          }}
        >
          <Popup>
            <div className="text-xs font-semibold">
              Your Location (Complainant)<br />
              {onManualPinChange && <span className="text-[10px] text-gray-500">(Drag pin to adjust location)</span>}
            </div>
          </Popup>
        </Marker>

        {/* Estimated Bus Position Marker */}
        <Marker position={[resolvedBusLat, resolvedBusLng]} icon={busIcon}>
          <Popup>
            <div className="text-xs font-bold text-[#D92D20]">
              Estimated Bus Position<br />
              <span className="font-mono font-normal text-gray-700">{resolvedBusPlate}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Map Legend Banner */}
      <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-[#EAECF0] text-[10px] sm:text-[11px] text-[#667085] flex flex-wrap items-center justify-between z-[1000] shadow-xs gap-1">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] border border-white shadow-xs" />
          <span>Complainant Pin</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] border border-white shadow-xs" />
          <span>Origin</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9333EA] border border-white shadow-xs" />
          <span>Destination</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D92D20] border border-white shadow-xs" />
          <span>Estimated Bus</span>
        </div>
      </div>
    </div>
  );
};
