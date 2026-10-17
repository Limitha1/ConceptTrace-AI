import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Languages, 
  Bell, 
  Shield, 
  Download, 
  LogOut, 
  CheckCircle2, 
  Database, 
  RotateCcw,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clearStudentRecords, getStoredQueries, getStoredPracticeAttempts } from '../../lib/storage';
import type { PreferredLanguage } from '../../types';

export const SettingsPage: React.FC = () => {
  const { user, educationProfile, updateEducationProfile, logout, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(
    educationProfile?.preferredLanguage || 'English'
  );
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSavePreferences = () => {
    updateEducationProfile({ preferredLanguage });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleTriggerPasswordReset = async () => {
    if (user?.email) {
      await resetPassword(user.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    }
  };

  const handleExportData = () => {
    const data = {
      user,
      educationProfile,
      queries: getStoredQueries(user?.id),
      attempts: getStoredPracticeAttempts(user?.id),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `concepttrace_student_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleResetData = () => {
    if (user?.id && window.confirm('Are you sure you want to clear your saved questions and practice attempts? This cannot be undone.')) {
      clearStudentRecords(user.id);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Settings className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Account & System Preferences
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your interface language, notification channels, security, and learning data controls.
        </p>
      </div>

      {savedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Preferences updated successfully.</span>
        </div>
      )}

      {/* 1. Language & Learning Settings */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Languages className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Explanation Language</h2>
        </div>

        <div className="max-w-xs space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Preferred Language</label>
          <select
            value={preferredLanguage}
            onChange={(e) => setPreferredLanguage(e.target.value as PreferredLanguage)}
            className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="English">English</option>
            <option value="Kannada">Kannada</option>
            <option value="Hindi">Hindi</option>
            <option value="Tamil">Tamil</option>
            <option value="Telugu">Telugu</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Other">Other</option>
          </select>
          <p className="text-[11px] text-slate-400">
            AI step explanations and solution steps will be rendered in your selected language.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSavePreferences}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
        >
          Save Language Preference
        </button>
      </div>

      {/* Academic Curriculum & Syllabus Setting */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Academic Board & Syllabus</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('/syllabus')}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <span>View Syllabus</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Board & Class</span>
            <span className="text-xs font-extrabold text-slate-800">
              {educationProfile?.board || 'CBSE'} • Class {educationProfile?.classLevel || '11'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Stream</span>
            <span className="text-xs font-extrabold text-slate-800">
              {educationProfile?.classLevel === '10' ? 'General' : (educationProfile?.stream || 'Science')}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled Subjects</span>
            <span className="text-xs font-extrabold text-slate-800">
              {educationProfile?.subjects?.length || 0} Subjects
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-slate-500">
            Need to change your board, stream, or subjects? You can update them in your Student Profile.
          </p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Bell className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Notification Preferences</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Doubt Solution Notifications</span>
              <span className="text-[11px] text-slate-500">Alert me as soon as multi-agent solution verification finishes</span>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Daily Streak & Practice Reminders</span>
              <span className="text-[11px] text-slate-500">Remind me to complete at least 1 practice question to maintain my active streak</span>
            </div>
            <input
              type="checkbox"
              checked={streakReminders}
              onChange={(e) => setStreakReminders(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* 3. Security & Password Reset */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Security & Authentication</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-800">Password Reset</p>
            <p className="text-[11px] text-slate-500">
              Send a secure password reset email to {user?.email}
            </p>
          </div>
          <button
            type="button"
            onClick={handleTriggerPasswordReset}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
          >
            {resetSent ? 'Email Sent ✓' : 'Send Reset Link'}
          </button>
        </div>
      </div>

      {/* 4. Learning Data & Privacy Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <Database className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Learning Data & Privacy Controls</h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Your practice attempts and doubt solutions are stored with Row Level Security (RLS) and accessible only by your authenticated account.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Learning History (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear My Learning Records</span>
          </button>
        </div>
      </div>

      {/* 5. Account Sign Out */}
      <div className="bg-white rounded-3xl border border-rose-100 shadow-xs p-6 space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900">Sign Out of ConceptTrace AI</h2>
        <p className="text-xs text-slate-500">
          Signing out terminates your current active learning session on this device.
        </p>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center gap-2"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Confirm Logout</span>
        </button>
      </div>
    </div>
  );
};
