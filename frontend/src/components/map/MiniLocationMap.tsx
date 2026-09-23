import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
        font-size: 11px;
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

interface MiniLocationMapProps {
  userLat?: number;
  userLng?: number;
  busLat?: number;
  busLng?: number;
  busNumber?: string;
  busPlate?: string;
  onManualPinChange?: (lat: number, lng: number) => void;
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export const MiniLocationMap: React.FC<MiniLocationMapProps> = ({
  userLat = 9.9816,
  userLng = 76.2999,
  busLat,
  busLng,
  busNumber,
  busPlate,
  onManualPinChange,
}) => {
  const resolvedBusLat = busLat ?? userLat + 0.008;
  const resolvedBusLng = busLng ?? userLng + 0.012;
  const resolvedBusPlate = busPlate || busNumber || 'KL-07-AB-1234';

  return (
    <div className="w-full h-full min-h-[220px] rounded-3xl overflow-hidden border border-[#EAECF0] shadow-inner relative z-0">
      <MapContainer
        center={[userLat, userLng]}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter lat={userLat} lng={userLng} />

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
              Estimated Bus Location<br />
              <span className="font-mono font-normal text-gray-700">{resolvedBusPlate}</span>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-[#EAECF0] text-[11px] text-[#667085] flex items-center justify-between z-[1000] shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] border border-white shadow-xs" />
          <span>Complainant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D92D20] border border-white shadow-xs" />
          <span>Bus Position (Computed)</span>
        </div>
      </div>
    </div>
  );
};
