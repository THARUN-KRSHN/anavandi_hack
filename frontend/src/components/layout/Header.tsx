import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Bus, Search, User, LogOut, Shield, Building2 } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-[#E2F1E7]/90 via-[#F4F9F5]/90 to-[#E5F3EB]/90 backdrop-blur-md border-b border-[#EAECF0]/80 py-3 px-4 sm:px-6 lg:px-8 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Greeting */}
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-full bg-[#171717] text-white shadow-md flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
            <Bus className="w-5 h-5 text-emerald-400" />
          </Link>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] block">
              {role === 'depot_head' ? 'DEPOT HEAD PORTAL' : role === 'admin' ? 'ADMIN GOVERNANCE' : 'KERALA TRANSIT'}
            </span>
            <h1 className="text-lg font-black text-[#171717] tracking-tight flex items-center gap-1.5">
              <span>Hi, {user?.name ? user.name.split(' ')[0] : 'Passenger'} 👋</span>
            </h1>
          </div>
        </div>

        {/* Right White Circular Action Buttons */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {role === 'user' && (
                <>
                  <Link
                    to="/track"
                    className="w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#171717] hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    title="Track Complaint"
                  >
                    <Search className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/profile"
                    className="w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#171717] hover:bg-gray-50 hover:scale-105 active:scale-95 transition-all"
                    title="User Profile"
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                  </Link>
                </>
              )}

              {role === 'depot_head' && (
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-full border border-red-200 text-xs font-bold text-[#D92D20]">
                    <Building2 className="w-4 h-4" />
                    <span>{user?.depotName || 'Depot Desk'}</span>
                  </div>
                </div>
              )}

              {role === 'admin' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200 text-xs font-bold text-emerald-800">
                  <Shield className="w-4 h-4" />
                  <span>State Admin</span>
                </div>
              )}

              <button
                onClick={() => { logout(); navigate('/auth'); }}
                className="w-10 h-10 rounded-full bg-white border border-[#EAECF0] shadow-sm flex items-center justify-center text-[#667085] hover:text-[#D92D20] hover:bg-red-50 hover:scale-105 active:scale-95 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 bg-[#171717] text-white text-xs font-bold rounded-full shadow-md hover:bg-black transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
