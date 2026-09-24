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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  role: 'depot' | 'admin';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const isDepotUser = role === 'depot' || (user?.role as string) === 'depot_head';

  const depotLinks = [
    { to: '/depot', label: t('nav.depot_dashboard'), icon: <LayoutDashboard className="w-5 h-5" />, end: true },
    { to: '/depot/complaints', label: t('nav.case_queue'), icon: <FileText className="w-5 h-5" /> },
    { to: '/depot/buses', label: t('nav.fleet_master'), icon: <Bus className="w-5 h-5" /> },
    { to: '/depot/routes', label: t('nav.route_hotspots'), icon: <RouteIcon className="w-5 h-5" /> },
    { to: '/depot/outbox', label: t('nav.outbox'), icon: <MessageSquare className="w-5 h-5" /> },
    { to: '/admin', label: t('nav.admin_overview'), icon: <MapPin className="w-5 h-5" /> },
    { to: '/admin/depots', label: t('nav.depot_index'), icon: <Building2 className="w-5 h-5" /> },
  ];

  const adminLinks = [
    { to: '/admin', label: t('nav.admin_overview'), icon: <MapPin className="w-5 h-5" />, end: true },
    { to: '/admin/depots', label: t('nav.depot_index'), icon: <Building2 className="w-5 h-5" /> },
  ];

  const links = isDepotUser ? depotLinks : adminLinks;

  return (
    <aside className="w-64 bg-white border-r border-[#EAECF0] shrink-0 hidden lg:block min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-6 px-3.5 py-3 bg-[#F9FAFB] rounded-2xl border border-[#EAECF0]">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#667085] block">
          {role === 'depot' ? t('header.depot_head_portal') : t('header.admin_governance')}
        </span>
        <span className="text-xs font-black text-[#171717] block mt-0.5 truncate">
          {role === 'depot' ? (user?.depotName || t('header.depot_desk')) : 'Kerala State HQ'}
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
