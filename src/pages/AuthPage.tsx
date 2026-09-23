import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Building2, Lock, Phone, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { user, isAuthenticated, loginUser, loginUserPass, signUpUser, loginStaffMember } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'depot_head') navigate('/depot', { replace: true });
      else if (user.role === 'admin') navigate('/admin', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Tab: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  // Login Role: 'user' | 'depot_head' | 'admin'
  const [loginRole, setLoginRole] = useState<'user' | 'depot_head' | 'admin'>(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'depot_head' || roleParam === 'admin') return roleParam;
    return 'user';
  });

  // User Auth Mode: 'otp' | 'password'
  const [passengerAuthMode, setPassengerAuthMode] = useState<'otp' | 'password'>('otp');

  // User Login state
  const [phone, setPhone] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Sign Up form state
  const [signUpName, setSignUpName] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');

  // Staff Login state
  const [staffId, setStaffId] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handlers
  const handleSendOTP = () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setOtpSent(true);
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (passengerAuthMode === 'password') {
        if (!userPassword) {
          setError('Please enter your password');
          setLoading(false);
          return;
        }
        await loginUserPass(phone, userPassword);
      } else {
        await loginUser(phone, otp || '123456');
      }
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!signUpName || !signUpPhone || !signUpPassword) {
      setError('Please provide your full name, mobile number, and set a password');
      return;
    }
    setLoading(true);
    try {
      await signUpUser(signUpName, signUpPhone, signUpEmail, signUpPassword);
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error).message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginStaffMember(staffId, staffPassword, loginRole as 'depot_head' | 'admin');
      if (loginRole === 'depot_head') {
        navigate('/depot');
      } else {
        navigate('/admin');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Spacious, high-contrast, beautiful card with integrated header */}
      <div className="w-full max-w-xl sm:max-w-2xl bg-white/95 backdrop-blur-xl shadow-2xl shadow-emerald-950/10 rounded-[36px] border border-white/90 p-8 sm:p-12 space-y-8">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Bus Sahayi Logo"
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-2xl bg-white p-1 border border-[#EAECF0] shadow-md hover:scale-105 transition-transform"
            />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black text-[#171717] tracking-tight leading-tight">
              Welcome to Bus Sahayi
            </h1>

            <p className="text-sm sm:text-base text-[#475467] font-medium max-w-md mx-auto">
              Public Transport Grievance & Depot Accountability Platform
            </p>
          </div>
        </div>

        {/* Main Auth Tabs: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1.5 bg-[#F4F6F8] rounded-full border border-[#EAECF0]">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`py-3 text-sm font-bold rounded-full transition-all ${
              activeTab === 'login'
                ? 'bg-[#171717] text-white shadow-md'
                : 'text-[#667085] hover:text-[#171717]'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('signup'); setError(''); }}
            className={`py-3 text-sm font-bold rounded-full transition-all ${
              activeTab === 'signup'
                ? 'bg-[#171717] text-white shadow-md'
                : 'text-[#667085] hover:text-[#171717]'
            }`}
          >
            Sign Up (Passenger)
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-[#D92D20] text-sm font-semibold rounded-2xl">
            {error}
          </div>
        )}

        {/* SIGN UP FORM (Passenger Only) */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#171717]">Full Name *</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Nair"
                  className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-12 pr-4 py-3 text-sm text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:bg-white transition-all"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#171717]">Mobile Number *</label>
              <div className="relative">
                <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-12 pr-4 py-3 text-sm text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:bg-white transition-all"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#171717]">Password *</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="Set account password"
                  className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-12 pr-4 py-3 text-sm text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:bg-white transition-all"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#171717]">Email Address (Optional)</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-12 pr-4 py-3 text-sm text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:bg-white transition-all"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D92D20] hover:bg-[#B42318] text-white font-bold text-sm rounded-full shadow-lg shadow-red-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Create Passenger Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <div className="space-y-6">
            {/* Role Sub-tabs: User (default), Depot Head, Admin */}
            <div className="flex items-center justify-center gap-2 p-1.5 bg-[#F4F6F8] rounded-2xl border border-[#EAECF0]">
              <button
                type="button"
                onClick={() => { setLoginRole('user'); setError(''); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  loginRole === 'user' ? 'bg-white text-[#171717] shadow-sm' : 'text-[#667085] hover:text-[#171717]'
                }`}
              >
                Passenger
              </button>
              <button
                type="button"
                onClick={() => { setLoginRole('depot_head'); setError(''); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  loginRole === 'depot_head' ? 'bg-white text-[#D92D20] shadow-sm' : 'text-[#667085] hover:text-[#171717]'
                }`}
              >
                Depot Head
              </button>
              <button
                type="button"
                onClick={() => { setLoginRole('admin'); setError(''); }}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  loginRole === 'admin' ? 'bg-white text-[#16A34A] shadow-sm' : 'text-[#667085] hover:text-[#171717]'
                }`}
              >
                State Admin
              </button>
            </div>

            {/* USER LOGIN (OTP vs Password) */}
            {loginRole === 'user' && (
              <form onSubmit={handleUserLogin} className="space-y-5">
                {/* Passenger Login Sub-mode Switcher */}
                <div className="flex justify-end gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setPassengerAuthMode('otp'); setError(''); }}
                    className={passengerAuthMode === 'otp' ? 'text-[#D92D20] font-bold underline' : 'text-gray-500 hover:text-black'}
                  >
                    Login via OTP
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => { setPassengerAuthMode('password'); setError(''); }}
                    className={passengerAuthMode === 'password' ? 'text-[#D92D20] font-bold underline' : 'text-gray-500 hover:text-black'}
                  >
                    Login via Password
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#171717]">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-12 pr-4 py-3 text-sm text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:bg-white transition-all"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {passengerAuthMode === 'password' ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-[#171717]">Password</label>
                      <div className="relative">
                        <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-12 pr-4 py-3 text-sm text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:bg-white transition-all"
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-[#D92D20] hover:bg-[#B42318] text-white font-bold text-sm rounded-full shadow-lg shadow-red-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sign In with Password</span>
                    </button>
                  </div>
                ) : !otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="w-full py-3.5 bg-[#171717] hover:bg-black text-white font-bold text-sm rounded-full shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <span>Send OTP Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-[#171717]">Enter OTP Code</label>
                        <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          Demo OTP: 123456
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl px-4 py-3 text-center font-mono font-bold text-lg tracking-widest text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#16A34A] focus:bg-white transition-all"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white font-bold text-sm rounded-full shadow-lg shadow-green-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Authenticating with Supabase...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Sign In</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* DEPOT HEAD & ADMIN LOGIN (ID + Password) */}
            {(loginRole === 'depot_head' || loginRole === 'admin') && (
              <form onSubmit={handleStaffLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#171717]">
                    {loginRole === 'depot_head' ? 'Depot Account ID' : 'Admin ID'}
                  </label>
                  <div className="relative">
                    {loginRole === 'depot_head' ? (
                      <Building2 className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                    ) : (
                      <Shield className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                    )}
                    <input
                      type="text"
                      required
                      placeholder={loginRole === 'depot_head' ? 'e.g. depot_ekm' : 'admin_head'}
                      className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-12 pr-4 py-3 text-sm text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:bg-white transition-all"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-[#171717]">Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#F9FAFB] border border-[#EAECF0] rounded-2xl pl-12 pr-4 py-3 text-sm text-[#171717] font-medium focus:outline-none focus:ring-2 focus:ring-[#D92D20] focus:bg-white transition-all"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#D92D20] hover:bg-[#B42318] disabled:opacity-50 text-white font-bold text-sm rounded-full shadow-lg shadow-red-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating with Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to {loginRole === 'depot_head' ? 'Depot Head Portal' : 'Admin Governance'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
