import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Route as RouteIcon, MapPin, Bus, Clock } from 'lucide-react';

export const DepotRoutes: React.FC = () => {
  const { user } = useAuth();
  const depotName = user?.depotName || 'Ernakulam Central Depot';

  const mockRoutes = [
    {
      id: 'R-102',
      code: '102-EXP',
      origin: 'Ernakulam Kaloor',
      destination: 'Thrissur Central',
      distance: '76 km',
      dailyTrips: 18,
      assignedBusesCount: 8,
      status: 'Active',
    },
    {
      id: 'R-205',
      code: '205-SFP',
      origin: 'Aluva Bus Stand',
      destination: 'Muvattupuzha',
      distance: '34 km',
      dailyTrips: 24,
      assignedBusesCount: 6,
      status: 'Active',
    },
    {
      id: 'R-308',
      code: '308-AAC',
      origin: 'Ernakulam Vytila Hub',
      destination: 'Trivandrum Central',
      distance: '208 km',
      dailyTrips: 12,
      assignedBusesCount: 10,
      status: 'Active',
    },
    {
      id: 'R-412',
      code: '412-ORD',
      origin: 'Ernakulam Jetting',
      destination: 'Kottayam Medical College',
      distance: '62 km',
      dailyTrips: 16,
      assignedBusesCount: 5,
      status: 'Active',
    },
  ];

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
        {mockRoutes.map((route) => (
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
                  <span className="text-[11px] font-bold text-[#667085]">{route.distance}</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-green-50 text-[#16A34A] border border-green-200">
                {route.status}
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
                <span className="font-bold text-[#171717]">{route.dailyTrips} trips / day</span>
              </div>

              <div className="flex items-center justify-between text-[#667085]">
                <span className="flex items-center gap-1 font-semibold">
                  <Bus className="w-3.5 h-3.5 text-purple-600" /> Active Fleet:
                </span>
                <span className="font-bold text-[#171717]">{route.assignedBusesCount} buses assigned</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
