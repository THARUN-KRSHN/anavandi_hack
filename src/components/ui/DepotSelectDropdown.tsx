import React, { useState, useRef, useEffect } from 'react';
import type { DepotMaster } from '../../types/depot';
import { MapPin, Search, ChevronDown, Check } from 'lucide-react';

interface DepotSelectDropdownProps {
  label: string;
  value: string;
  onChange: (value: string, depot?: DepotMaster) => void;
  placeholder?: string;
  depots: DepotMaster[];
  error?: string;
}

export const DepotSelectDropdown: React.FC<DepotSelectDropdownProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select KSRTC Depot / Location...',
  depots,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDepots = depots.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.district.toLowerCase().includes(q)
    );
  });

  const handleSelect = (depot: DepotMaster) => {
    onChange(depot.name, depot);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-[#171717] flex items-center justify-between">
        <span>{label}</span>
      </label>

      {/* Input Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#F9FAFB] border rounded-2xl px-3.5 py-2.5 text-xs text-[#171717] flex items-center justify-between cursor-pointer transition-all ${
          error ? 'border-red-400 focus:ring-2 focus:ring-red-300' : 'border-[#EAECF0] hover:border-[#D0D5DD]'
        } ${isOpen ? 'ring-2 ring-[#171717] bg-white' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          {value ? (
            <span className="font-semibold truncate">{value}</span>
          ) : (
            <span className="text-gray-400 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {error && <span className="text-[11px] text-red-500 font-medium block">{error}</span>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-xl border border-[#EAECF0] rounded-2xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in duration-150 space-y-1 p-2">
          {/* Internal Search Input */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              placeholder="Search by depot name, district, or code..."
              className="w-full bg-[#F4F6F8] border border-[#EAECF0] rounded-xl pl-9 pr-3 py-2 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Depot Items */}
          <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredDepots.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500 font-medium">
                No matching KSRTC depots found
              </div>
            ) : (
              filteredDepots.map((depot) => {
                const isSelected = value.toLowerCase().includes(depot.name.toLowerCase());
                return (
                  <button
                    key={depot.id}
                    type="button"
                    onClick={() => handleSelect(depot)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                      isSelected ? 'bg-emerald-50 text-emerald-950 font-bold' : 'hover:bg-[#F4F6F8] text-[#171717]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-bold truncate">{depot.name}</span>
                      <span className="text-[10px] text-[#667085] truncate">
                        {depot.district} District • {depot.code}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
