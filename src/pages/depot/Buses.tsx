import React, { useState, useEffect } from 'react';
import { fetchBuses } from '../../services/busesService';
import type { Bus } from '../../types/bus';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Bus as BusIcon, QrCode, Route as RouteIcon } from 'lucide-react';

export const DepotBusesMaster: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>([]);

  useEffect(() => {
    fetchBuses().then(setBuses);
  }, []);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#EAECF0]">
        <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">
          Depot Fleet Master & QR Codes
        </h1>
        <p className="text-xs text-[#667085] mt-1">
          Registered vehicles, active routes, and QR code identifiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buses.map((bus) => (
          <Card key={bus.busNumber} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-red-50 text-[#D92D20]">
                  <BusIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-mono font-bold text-base text-[#171717]">
                    {bus.busNumber}
                  </h4>
                  <span className="text-xs text-[#667085]">{bus.type}</span>
                </div>
              </div>
              <Badge variant={bus.status === 'active' ? 'success' : 'warning'} size="sm">
                {bus.status}
              </Badge>
            </div>

            <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAECF0] text-xs space-y-1.5 text-[#344054]">
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Assigned Route:</span>
                <span className="font-semibold flex items-center gap-1">
                  <RouteIcon className="w-3.5 h-3.5 text-[#D92D20]" />
                  {bus.routeName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">QR Code Token:</span>
                <span className="font-mono font-bold flex items-center gap-1 text-[#171717]">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  {bus.qrCode}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
