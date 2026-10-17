import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const { login, isSupabaseActive } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your student email address.');
      return;
    }
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-sky-50/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-200/80 p-7 sm:p-9 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-400 items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3.5">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            ConceptTrace <span className="text-indigo-600">AI</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Learn • Improve • Succeed
          </p>
        </div>

        {/* Database Mode Chip */}
        <div className="mb-6 py-2 px-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Auth System:
          </span>
          <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
            isSupabaseActive 
              ? 'bg-emerald-100 text-emerald-800' 
              : 'bg-indigo-100 text-indigo-800'
          }`}>
            {isSupabaseActive ? 'Supabase Auth' : 'Local / Demo Mode'}
          </span>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In to ConceptTrace AI'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>


        <div className="text-center mt-6">
          <p className="text-xs text-slate-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline">
              Create student account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
