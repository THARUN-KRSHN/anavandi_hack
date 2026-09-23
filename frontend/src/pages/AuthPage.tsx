import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEED_DEPOT_HEADS } from '../services/authService';
import { Bus, Shield, User, Building2, Lock, Phone, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { loginUser, signUpUser, loginStaffMember } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialTab = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  const [loginRole, setLoginRole] = useState<'user' | 'depot_head' | 'admin'>('user');

  // Form States
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);

  // Signup State
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');

  // Staff Login State
  const [staffId, setStaffId] = useState('depot_ekm');
  const [staffPassword, setStaffPassword] = useState('depot123');

  const [error, setError] = useState('');

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setOtpSent(true);
  };

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      loginUser(phone, otp);
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error).message || 'Login failed');
    }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpPhone) {
      setError('Please fill in name and phone number');
      return;
    }
    try {
      setError('');
      signUpUser(signUpName, signUpPhone, signUpEmail || `${signUpPhone}@ksrtc.user`);
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed');
    }
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      loginStaffMember(staffId, staffPassword, loginRole as 'depot_head' | 'admin');
      if (loginRole === 'depot_head') {
        navigate('/depot');
      } else {
        navigate('/admin');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E2F1E7] via-[#F4F9F5] to-[#E5F3EB] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#171717] text-white shadow-xl mb-1">
          <Bus className="w-7 h-7 text-emerald-400" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#667085] block">
          ANAVANDI Transit Governance
        </span>
        <h1 className="text-3xl font-black text-[#171717] tracking-tight">
          Welcome to ANAVANDI
        </h1>
        <p className="text-xs text-[#667085] max-w-xs mx-auto">
          Public Transport Grievance & Depot Accountability Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/90 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-[32px] border border-[#EAECF0] space-y-6">
          
          {/* Main Auth Tabs: Login vs Sign Up */}
          <div className="grid grid-cols-2 p-1.5 bg-[#F4F9F5] rounded-full border border-[#EAECF0]">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-full transition-all ${
                activeTab === 'login'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#171717]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-full transition-all ${
                activeTab === 'signup'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#667085] hover:text-[#171717]'
              }`}
            >
              Sign Up (User)
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#D92D20] text-xs font-semibold rounded-2xl animate-shake">
              {error}
            </div>
          )}

          {/* SIGN UP FORM (Users Only) */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#171717]">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Nair"
                    className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#171717]">Mobile Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#171717]">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#171717] hover:bg-black text-white font-bold text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Create Passenger Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <div className="space-y-5">
              {/* Role Sub-tabs: User (default), Depot Head, Admin */}
              <div className="flex items-center justify-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setLoginRole('user'); setError(''); }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                    loginRole === 'user' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#667085]'
                  }`}
                >
                  User (OTP)
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginRole('depot_head'); setError(''); }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                    loginRole === 'depot_head' ? 'bg-white text-[#D92D20] shadow-xs' : 'text-[#667085]'
                  }`}
                >
                  Depot Head
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginRole('admin'); setError(''); }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                    loginRole === 'admin' ? 'bg-white text-[#171717] shadow-xs' : 'text-[#667085]'
                  }`}
                >
                  Admin
                </button>
              </div>

              {/* USER LOGIN (Phone + Mock OTP) */}
              {loginRole === 'user' && (
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#171717]">Mobile Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="w-full py-2.5 bg-[#171717] hover:bg-black text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span>Send OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-[#171717]">Enter OTP Code</label>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            Demo Code: 123456
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="123456"
                          className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl px-4 py-2.5 text-center font-mono font-bold text-base tracking-widest text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verify & Sign In</span>
                      </button>
                    </div>
                  )}

                  {/* Seed Account Quick Filler */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => { setPhone('9876543210'); setOtp('123456'); setOtpSent(true); }}
                      className="text-[11px] font-semibold text-[#667085] hover:text-[#171717] underline"
                    >
                      Quick Fill Default Passenger (Rahul Nair)
                    </button>
                  </div>
                </form>
              )}

              {/* DEPOT HEAD & ADMIN LOGIN (ID + Password) */}
              {(loginRole === 'depot_head' || loginRole === 'admin') && (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#171717]">
                      {loginRole === 'depot_head' ? 'Depot Account ID' : 'Admin ID'}
                    </label>
                    <div className="relative">
                      {loginRole === 'depot_head' ? (
                        <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      ) : (
                        <Shield className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      )}
                      <input
                        type="text"
                        required
                        placeholder={loginRole === 'depot_head' ? 'e.g. depot_ekm' : 'admin_head'}
                        className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#171717]">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#D92D20]"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#D92D20] hover:bg-[#B42318] text-white font-bold text-xs rounded-full shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>Sign In to {loginRole === 'depot_head' ? 'Depot Head Portal' : 'Admin Governance'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {/* Seed Account Quick Pickers */}
                  <div className="pt-2 space-y-1.5 text-center">
                    <span className="text-[10px] uppercase font-bold text-[#667085] block">
                      Seed Testing Credentials:
                    </span>
                    {loginRole === 'depot_head' ? (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {SEED_DEPOT_HEADS.slice(0, 3).map((dh) => (
                          <button
                            key={dh.id}
                            type="button"
                            onClick={() => { setStaffId(dh.id); setStaffPassword('depot123'); }}
                            className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-[#171717] px-2 py-0.5 rounded-lg"
                          >
                            {dh.depotId} ({dh.id})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setStaffId('admin_head'); setStaffPassword('admin123'); }}
                        className="text-[10px] font-semibold bg-gray-100 hover:bg-gray-200 text-[#171717] px-2 py-0.5 rounded-lg"
                      >
                        Fill Admin Credentials (admin_head / admin123)
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
