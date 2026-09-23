import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../app/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export const Signup: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await signUp(form.name, form.email, form.password, form.phone); navigate('/', { replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to create account.'); }
    finally { setLoading(false); }
  };

  return <div className="max-w-md mx-auto py-12 px-4"><Card className="p-7 sm:p-9">
    <div className="mb-7"><h1 className="text-2xl font-black">Create passenger account</h1><p className="text-sm text-[#667085] mt-1">Depot and admin accounts are provisioned by the system.</p></div>
    {error && <p className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</p>}
    <form onSubmit={submit} className="space-y-4">
      <Input label="Full name" value={form.name} onChange={update('name')} required />
      <Input label="Email" type="email" value={form.email} onChange={update('email')} required />
      <Input label="Phone" value={form.phone} onChange={update('phone')} />
      <Input label="Password" type="password" value={form.password} onChange={update('password')} minLength={6} required />
      <Button type="submit" variant="primary" className="w-full" isLoading={loading} icon={<ArrowRight className="w-4 h-4" />}>Create account</Button>
    </form>
    <p className="text-sm text-center text-[#667085] mt-6">Already registered? <Link className="font-bold text-[#D92D20]" to="/login">Sign in</Link></p>
  </Card></div>;
};
