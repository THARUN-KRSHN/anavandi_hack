import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Bus, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

function homeForRole(role: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'DEPOT_HEAD') return '/depot';
  return '/';
}

export const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await signIn(phone, password);
      navigate((location.state as { from?: string } | null)?.from || homeForRole(user.role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="max-w-md mx-auto py-12 px-4">
    <Card className="p-7 sm:p-9">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-11 h-11 rounded-xl bg-[#D92D20] text-white flex items-center justify-center"><Bus className="w-5 h-5" /></div>
        <div><h1 className="text-2xl font-black">Sign in to ANAVANDI</h1><p className="text-xs text-[#667085]">Your role determines the workspace you can access.</p></div>
      </div>
      {error && <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <Input label="Phone number" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required icon={<Mail className="w-4 h-4 text-[#667085]" />} />
        <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required icon={<LockKeyhole className="w-4 h-4 text-[#667085]" />} />
        <Button type="submit" variant="primary" className="w-full" isLoading={loading} icon={<ArrowRight className="w-4 h-4" />}>Sign in</Button>
      </form>
      <p className="text-sm text-center text-[#667085] mt-6">New passenger? <Link className="font-bold text-[#D92D20]" to="/signup">Create an account</Link></p>
    </Card>
  </div>;
};
