import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  // Only render on mobile/tablet for authenticated user views
  if (!isAuthenticated || (role !== 'user' && !location.pathname.startsWith('/u/'))) return null;

  const navItems = [
    { to: '/', label: 'Home', icon: <Home className="w-5 h-5" />, end: true },
    { to: '/report', label: 'Report', icon: <FileText className="w-5 h-5" /> },
    { to: '/track', label: 'Track', icon: <Search className="w-5 h-5" /> },
    { to: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-5 left-4 right-4 max-w-md mx-auto z-50 pointer-events-auto">
      <nav className="bg-[#171717]/95 backdrop-blur-md text-white rounded-full p-2 shadow-2xl border border-gray-800 flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 min-h-[44px] ${
                isActive
                  ? 'bg-white text-[#171717] font-bold shadow-md scale-105'
                  : 'text-gray-400 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
