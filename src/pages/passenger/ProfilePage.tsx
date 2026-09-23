import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchComplaints } from '../../services/complaintsService';
import type { Complaint } from '../../types/complaint';
import { User, Phone, Mail, CheckCircle2, LogOut, FileText, ArrowRight, Bus, Clock, ShieldAlert } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);
  const [userComplaints, setUserComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchComplaints().then((data) => {
      if (isMounted) {
        setUserComplaints(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(name, phone, email);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'action_taken':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resolved / Action Taken
          </span>
        );
      case 'investigating':
      case 'under_review':
      case 'assigned':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Under Investigation
          </span>
        );
      case 'escalated':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            Escalated to Directorate
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Submitted & Logged
          </span>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-8 pb-24">
      {/* Profile Card */}
      <div className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-[32px] border border-[#EAECF0] shadow-xl space-y-6">
        
        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#EAECF0]">
          <div className="w-16 h-16 rounded-full bg-[#171717] text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] block">
              Passenger Account
            </span>
            <h2 className="text-xl font-bold text-[#171717] truncate">{name || 'Passenger'}</h2>
            <span className="text-xs font-mono text-[#667085] block">{phone}</span>
          </div>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#171717]">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#171717]">Mobile Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#171717]">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3 bg-[#171717] hover:bg-black text-white font-bold text-xs rounded-full shadow-lg transition-all"
            >
              Save Profile Changes
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 bg-red-50 text-[#D92D20] border border-red-200 hover:bg-red-100 font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>

      {/* FILED COMPLAINTS SO FAR SECTION */}
      <div className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-[32px] border border-[#EAECF0] shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#EAECF0]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-[#D92D20]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#171717]">Filed Complaints So Far</h3>
              <p className="text-xs text-[#667085]">History of grievances submitted from your account</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-[#171717] font-extrabold text-xs rounded-full border border-gray-200">
            {userComplaints.length} Total
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-gray-500 font-medium animate-pulse">
            Loading your grievance history...
          </div>
        ) : userComplaints.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-3 bg-[#F9FAFB] rounded-2xl border border-dashed border-gray-200">
            <ShieldAlert className="w-10 h-10 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#171717]">No Complaints Filed Yet</h4>
              <p className="text-xs text-[#667085] max-w-sm mx-auto">
                Have you experienced an issue on a KSRTC bus service? Report it directly to hold depots accountable.
              </p>
            </div>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D92D20] text-white text-xs font-bold rounded-full shadow-sm hover:bg-[#B42318] transition-all"
            >
              <span>File New Complaint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userComplaints.map((cmp) => (
              <div
                key={cmp.id}
                className="p-4 bg-[#F9FAFB] hover:bg-white rounded-2xl border border-[#EAECF0] hover:border-emerald-300 transition-all shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#171717] bg-white px-2.5 py-1 rounded-lg border border-[#EAECF0] shadow-xs">
                      {cmp.reference}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 bg-gray-200/70 px-2 py-0.5 rounded-md">
                      {cmp.categoryLabel}
                    </span>
                  </div>
                  {getStatusBadge(cmp.status)}
                </div>

                <p className="text-xs text-[#475467] font-medium line-clamp-2 leading-relaxed">
                  {cmp.description}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-[#667085] pt-2 border-t border-gray-200/60 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5 text-red-500" />
                      <strong>{cmp.busNumber || 'Route Bus'}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(cmp.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <Link
                    to={`/track/${cmp.reference}`}
                    className="text-xs font-bold text-[#D92D20] hover:text-[#B42318] flex items-center gap-1 hover:underline"
                  >
                    <span>View Timeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
