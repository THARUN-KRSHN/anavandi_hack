import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  AlertOctagon,
  Users,
  Bus,
  BarChart3,
  Building2,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';

interface SidebarProps {
  role: 'depot' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const depotLinks = [
    { to: '/depot', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    { to: '/depot/complaints', label: 'Case Queue', icon: <Inbox className="w-5 h-5" /> },
    { to: '/depot/escalations', label: 'Overdue & Escalated', icon: <AlertOctagon className="w-5 h-5" /> },
    { to: '/depot/crew', label: 'Authorized Crew (PEN)', icon: <Users className="w-5 h-5" /> },
    { to: '/depot/buses', label: 'Depot Fleet Master', icon: <Bus className="w-5 h-5" /> },
  ];

  const adminLinks = [
    { to: '/admin', label: 'System Overview', icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    { to: '/admin/analytics', label: 'Analytics & SLA Trends', icon: <BarChart3 className="w-5 h-5" /> },
    { to: '/admin/complaints', label: 'Grievance Audit Log', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { to: '/admin/depots', label: 'Depots Performance', icon: <Building2 className="w-5 h-5" /> },
    { to: '/admin/routes', label: 'Route Hotspots', icon: <MapPin className="w-5 h-5" /> },
  ];

  const links = role === 'depot' ? depotLinks : adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-[#EAECF0] shrink-0 hidden lg:block min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-6 px-3 py-2 bg-[#F9FAFB] rounded-xl border border-[#EAECF0]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] block">
          {role === 'depot' ? 'Depot Operations Desk' : 'Admin Governance'}
        </span>
        <span className="text-xs font-semibold text-[#171717]">
          {role === 'depot' ? 'Trivandrum Central (TVM)' : 'Kerala State Transport Head Office'}
        </span>
      </div>

      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-red-50 text-[#D92D20] font-bold shadow-xs border border-red-100'
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
