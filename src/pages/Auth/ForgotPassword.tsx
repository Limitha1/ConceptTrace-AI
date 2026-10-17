import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    const res = await resetPassword(email);
    setLoading(false);
    if (res.success) {
      setSubmitted(true);
    } else {
      setError(res.error || 'Could not send reset link.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-sky-50/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-200/80 p-7 sm:p-9 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center text-indigo-600 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Reset Your Password
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            We’ll send you instructions to safely reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Password Reset Email Sent</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an account exists for <span className="font-semibold text-slate-900">{email}</span>, you will receive a secure password recovery link shortly.
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Email Address
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Recovery Link'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
