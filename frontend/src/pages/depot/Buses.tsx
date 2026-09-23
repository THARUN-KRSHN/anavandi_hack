import React, { useState, useEffect } from 'react';
import { fetchBusesForDepot } from '../../services/busesService';
import type { BusMaster } from '../../types/bus';
import { useAuth } from '../../context/AuthContext';
import { Bus, UserCheck, Phone, Clock, Search, MapPin } from 'lucide-react';

export const DepotBusesMaster: React.FC = () => {
  const { user } = useAuth();
  const depotId = user?.depotId;
  const depotName = user?.depotName || 'Depot Fleet';

  const [buses, setBuses] = useState<BusMaster[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBuses = async () => {
      setLoading(true);
      try {
        const list = await fetchBusesForDepot(depotId);
        setBuses(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadBuses();
  }, [depotId]);

  const filteredBuses = buses.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.busNumber.toLowerCase().includes(q) ||
      b.routeName.toLowerCase().includes(q) ||
      b.conductorName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#667085] block">
            FLEET & CREW ROSTER
          </span>
          <h1 className="text-2xl font-black text-[#171717] tracking-tight">
            {depotName} Buses
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Active fleet register, assigned routes, and duty conductor shifts.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plate or conductor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#EAECF0] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20]/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-[#667085]">
          Loading depot buses fleet register...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBuses.map((bus) => (
            <div
              key={bus.id}
              className="bg-white p-5 rounded-[24px] border border-[#EAECF0] shadow-xs space-y-4 hover:border-gray-300 transition-all"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#D92D20] flex items-center justify-center font-bold">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#171717]">{bus.busNumber}</h3>
                    <span className="text-[11px] font-bold text-[#667085]">{bus.busType}</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-green-50 text-[#16A34A] border border-green-200">
                  On Route
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#667085]">
                  <span className="flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-[#D92D20]" /> Route:
                  </span>
                  <span className="font-bold text-[#171717]">{bus.routeName}</span>
                </div>

                <div className="flex items-center justify-between text-[#667085]">
                  <span className="flex items-center gap-1 font-semibold">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Duty Conductor:
                  </span>
                  <span className="font-bold text-[#171717]">{bus.conductorName}</span>
                </div>

                <div className="flex items-center justify-between text-[#667085]">
                  <span className="flex items-center gap-1 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-gray-500" /> Phone:
                  </span>
                  <span className="font-semibold text-[#171717]">{bus.conductorPhone}</span>
                </div>

                <div className="flex items-center justify-between text-[#667085]">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-purple-600" /> Shift Schedule:
                  </span>
                  <span className="font-medium text-[#171717]">{bus.shiftSchedule || '06:00 AM - 02:00 PM'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
