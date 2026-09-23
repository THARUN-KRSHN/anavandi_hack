import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, Phone, Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { loginUser, signUpUser, loginStaffMember } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState<'user' | 'depot_head' | 'admin'>('user');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillCredentials = (p: string, pass: string, r: 'user' | 'depot_head' | 'admin') => {
    setMode('login');
    setRole(r);
    setPhone(p);
    setPassword(pass);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUpUser(name, phone, email || `${phone}@passenger.demo`, password);
        navigate('/');
      } else if (role === 'user') {
        await loginUser(phone, password);
        navigate('/');
      } else {
        await loginStaffMember(phone, password, role);
        navigate(role === 'admin' ? '/admin' : '/depot');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E2F1E7] via-[#F4F9F5] to-[#E5F3EB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 shadow-2xl rounded-[32px] p-7 sm:p-9 border border-[#EAECF0]">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#171717] text-emerald-400">
            <Bus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black mt-3 text-[#171717]">BUS സഹായി</h1>
          <p className="text-xs text-[#667085]">Transport grievance and depot accountability</p>
        </div>

        <div className="grid grid-cols-2 p-1 bg-[#F4F9F5] rounded-full mb-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-bold rounded-full transition-all ${mode === 'login' ? 'bg-[#171717] text-white shadow-sm' : 'text-[#667085]'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`py-2 text-xs font-bold rounded-full transition-all ${mode === 'signup' ? 'bg-[#171717] text-white shadow-sm' : 'text-[#667085]'}`}
          >
            Create account
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        {mode === 'login' && (
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5">
            {(['user', 'depot_head', 'admin'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${role === item ? 'bg-white shadow-xs text-[#171717]' : 'text-[#667085]'}`}
              >
                {item === 'depot_head' ? 'Depot Head' : item === 'admin' ? 'Admin' : 'Passenger'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <label className="block text-xs font-bold text-[#171717]">
              Full name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-[#EAECF0] p-3 font-normal text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                placeholder="Your full name"
              />
            </label>
          )}

          <label className="block text-xs font-bold text-[#171717]">
            Phone number
            <div className="relative mt-1">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-[#EAECF0] p-3 pl-10 font-normal text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                placeholder="e.g. 9778585423"
              />
            </div>
          </label>

          {mode === 'signup' && (
            <label className="block text-xs font-bold text-[#171717]">
              Email (optional)
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[#EAECF0] p-3 pl-10 font-normal text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                  placeholder="passenger@example.com"
                />
              </div>
            </label>
          )}

          <label className="block text-xs font-bold text-[#171717]">
            Password
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#EAECF0] p-3 pl-10 font-normal text-xs text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]"
                placeholder="Enter password"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#171717] hover:bg-black py-3 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>
              {loading
                ? 'Connecting...'
                : mode === 'signup'
                ? 'Create passenger account'
                : `Sign in to ${role === 'user' ? 'Passenger' : role === 'depot_head' ? 'Depot' : 'Admin'} Portal`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick-Fill Credentials */}
        <div className="mt-6 pt-5 border-t border-[#EAECF0] space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
            <KeyRound className="w-3 h-3 text-emerald-600" />
            <span>Database Seed Accounts (Click to Fill)</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillCredentials('9778585423', 'depot123', 'depot_head')}
              className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-[11px] font-bold text-[#171717] border border-[#EAECF0] text-center transition-colors"
            >
              <span className="block text-[10px] text-[#667085] font-normal">Depot Head</span>
              9778585423
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('+919000000001', 'admin123', 'admin')}
              className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-[11px] font-bold text-[#171717] border border-[#EAECF0] text-center transition-colors"
            >
              <span className="block text-[10px] text-[#667085] font-normal">HQ Admin</span>
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('+919000000002', 'user123', 'user')}
              className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-[11px] font-bold text-[#171717] border border-[#EAECF0] text-center transition-colors"
            >
              <span className="block text-[10px] text-[#667085] font-normal">Passenger</span>
              Passenger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
