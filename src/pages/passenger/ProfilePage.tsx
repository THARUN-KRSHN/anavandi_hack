import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, CheckCircle2, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(name, phone, email);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4 space-y-6 pb-24">
      <div className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-[32px] border border-[#EAECF0] shadow-xl space-y-6">
        
        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#EAECF0]">
          <div className="w-16 h-16 rounded-full bg-[#171717] text-white flex items-center justify-center font-black text-2xl shadow-lg">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#667085] block">
              Passenger Account
            </span>
            <h2 className="text-xl font-bold text-[#171717]">{name || 'Passenger'}</h2>
            <span className="text-xs font-mono text-[#667085]">{phone}</span>
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
    </div>
  );
};
