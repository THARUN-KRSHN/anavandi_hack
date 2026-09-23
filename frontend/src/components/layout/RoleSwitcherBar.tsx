import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Building2, Shield, Play } from 'lucide-react';
import { Button } from '../ui/Button';

export const RoleSwitcherBar: React.FC<{ onStartDemoFlow?: () => void }> = ({ onStartDemoFlow }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentRole = () => {
    if (location.pathname.startsWith('/depot')) return 'depot';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'passenger';
  };

  const activeRole = getCurrentRole();

  return (
    <div className="bg-[#171717] text-white py-2 px-4 border-b border-gray-800 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wider text-red-500 uppercase">BUS സഹായി</span>
          <span className="text-gray-400 hidden sm:inline">| Demo Role Switcher:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
              activeRole === 'passenger'
                ? 'bg-[#D92D20] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Passenger</span>
          </button>

          <button
            onClick={() => navigate('/depot')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
              activeRole === 'depot'
                ? 'bg-[#D92D20] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Depot Officer</span>
          </button>

          <button
            onClick={() => navigate('/admin')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors font-medium ${
              activeRole === 'admin'
                ? 'bg-[#D92D20] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {onStartDemoFlow && (
          <Button
            size="sm"
            variant="success"
            icon={<Play className="w-3.5 h-3.5" />}
            onClick={onStartDemoFlow}
            className="text-xs py-1"
          >
            Run Guided Demo Flow
          </Button>
        )}
      </div>
    </div>
  );
};
