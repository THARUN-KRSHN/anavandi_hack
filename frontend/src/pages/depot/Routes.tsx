import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchRoutes } from '../../services/busesService';
import type { Route } from '../../types/bus';
import { Route as RouteIcon, MapPin, Bus, Clock } from 'lucide-react';

export const DepotRoutes: React.FC = () => {
  const { user } = useAuth();
  const depotName = user?.depotName || 'Depot Operational Routes';

  const [routes, setRoutes] = useState<Route[]>([]);
  useEffect(() => { fetchRoutes().then(setRoutes).catch(() => undefined); }, []);

  return (
    <div className="space-y-6 pb-16">
      <div className="pb-4 border-b border-[#EAECF0]">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#667085] block">
          OPERATIONAL NETWORK
        </span>
        <h1 className="text-2xl font-black text-[#171717] tracking-tight">
          Routes Passing Through {depotName}
        </h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Active intercity and ordinary service corridors linked to this depot desk.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.map((route) => (
          <div
            key={route.id}
            className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4 hover:border-gray-300 transition-all"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
                  <RouteIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#171717]">{route.code}</h3>
                  <span className="text-[11px] font-bold text-[#667085]">{route.totalStops} stops</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-green-50 text-[#16A34A] border border-green-200">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#667085]">
                <span className="flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#D92D20]" /> Corridor:
                </span>
                <span className="font-bold text-[#171717]">
                  {route.origin} ➔ {route.destination}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#667085]">
                <span className="flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Daily Frequency:
                </span>
                <span className="font-bold text-[#171717]">Duration from backend dataset</span>
              </div>

              <div className="flex items-center justify-between text-[#667085]">
                <span className="flex items-center gap-1 font-semibold">
                  <Bus className="w-3.5 h-3.5 text-purple-600" /> Active Fleet:
                </span>
                <span className="font-bold text-[#171717]">{route.activeBusesCount} buses assigned</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
