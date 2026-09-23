import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Bus,
  Route as RouteIcon,
  MessageSquare,
  MapPin,
  Building2,
  Users,
  ShieldAlert,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  role: 'depot' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const { user } = useAuth();

  const depotLinks = [
    { to: '/depot', label: 'Reports Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    { to: '/depot/complaints', label: 'All Reports', icon: <FileText className="w-5 h-5" /> },
    { to: '/depot/escalations', label: 'Escalations Queue', icon: <ShieldAlert className="w-5 h-5" /> },
    { to: '/depot/buses', label: 'Depot Buses', icon: <Bus className="w-5 h-5" /> },
    { to: '/depot/routes', label: 'Depot Routes', icon: <RouteIcon className="w-5 h-5" /> },
    { to: '/depot/crew', label: 'Crew Directory', icon: <Users className="w-5 h-5" /> },
    { to: '/depot/outbox', label: 'SMS Outbox Log', icon: <MessageSquare className="w-5 h-5" /> },
  ];

  const adminLinks = [
    { to: '/admin', label: 'State Map Overview', icon: <MapPin className="w-5 h-5" />, end: true },
    { to: '/admin/depots', label: 'All Depots Index', icon: <Building2 className="w-5 h-5" /> },
    { to: '/admin/complaints', label: 'All Cases', icon: <FileText className="w-5 h-5" /> },
    { to: '/admin/analytics', label: 'Analytics & SLA', icon: <BarChart3 className="w-5 h-5" /> },
    { to: '/admin/routes', label: 'Route Hotspots', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const links = role === 'depot' ? depotLinks : adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-[#EAECF0] shrink-0 hidden lg:block min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-6 px-3 py-3 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0]">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#667085] block">
          {role === 'depot' ? 'DEPOT HEAD PORTAL' : 'ADMIN GOVERNANCE'}
        </span>
        <span className="text-xs font-black text-[#171717] block mt-0.5 truncate">
          {role === 'depot' ? (user?.depotName || 'Depot Headquarters') : 'Kerala State HQ'}
        </span>
      </div>

      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-xs transition-all ${
                isActive
                  ? 'bg-red-50 text-[#D92D20] shadow-xs border border-red-100'
                  : 'text-[#475467] hover:bg-[#F9FAFB] hover:text-[#171717]'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
