import React, { useEffect, useState } from 'react';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { QRScanModal } from './QRScanModal';
import { Bus, QrCode } from 'lucide-react';
import { fetchBuses, fetchRoutes } from '../../services/busesService';
import type { Bus as BusRecord, Route } from '../../types/bus';

interface BusSelectorProps {
  selectedBusNumber: string;
  onBusSelect: (busNumber: string, routeFrom?: string, routeTo?: string, busId?: number, routeId?: number) => void;
}

export const BusSelector: React.FC<BusSelectorProps> = ({
  selectedBusNumber,
  onBusSelect,
}) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => { Promise.all([fetchBuses(), fetchRoutes()]).then(([loadedBuses, loadedRoutes]) => { setBuses(loadedBuses); setRoutes(loadedRoutes); }).catch(() => undefined); }, []);

  const routeOptions = [
    { value: '', label: '-- Select Bus Route (Optional Fallback) --' },
    ...routes.map((r) => ({
      value: r.id,
      label: `${r.code}: ${r.name}`,
    })),
  ];

  const handleRouteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routeId = e.target.value;
    setSelectedRouteId(routeId);
    const routeObj = routes.find((r) => r.id === routeId);
    if (routeObj) {
      // Find a bus registered on this route
      const busOnRoute = buses.find((b) => b.routeId === routeId) || buses[0];
      if (busOnRoute) onBusSelect(busOnRoute.busNumber, routeObj.origin, routeObj.destination, undefined, Number(routeObj.id));
    }
  };

  return (
    <div className="space-y-4 bg-[#F9FAFB] p-4 rounded-2xl border border-[#EAECF0]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <div className="flex-1">
          <Input
            label="Bus Number / Registration ID"
            placeholder="e.g. KL-15-A-4021"
            value={selectedBusNumber}
            onChange={(e) => onBusSelect(e.target.value)}
            icon={<Bus className="w-4 h-4 text-[#667085]" />}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsQRModalOpen(true)}
          icon={<QrCode className="w-4 h-4 text-[#D92D20]" />}
          className="shrink-0"
        >
          Scan Bus QR
        </Button>
      </div>

      <div>
        <Select
          label="Or Select Route Fallback"
          options={routeOptions}
          value={selectedRouteId}
          onChange={handleRouteSelect}
        />
      </div>

      {selectedBusNumber && (
        <div className="p-3 bg-white rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Matched Vehicle: <strong>{selectedBusNumber}</strong></span>
          </div>
          <span className="text-[#667085]">Verified Depot Route</span>
        </div>
      )}

      <QRScanModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onSelectBus={(busNum) => {
          const matched = buses.find((b) => b.busNumber === busNum);
          if (matched) {
            const r = routes.find((rt) => rt.id === matched.routeId);
            onBusSelect(busNum, r?.origin, r?.destination);
          } else {
            onBusSelect(busNum);
          }
        }}
      />
    </div>
  );
};
