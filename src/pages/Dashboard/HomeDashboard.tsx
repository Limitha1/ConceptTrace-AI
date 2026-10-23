import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Flame, 
  CheckCircle2, 
  TrendingUp, 
  HelpCircle, 
  BookOpen, 
  User, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronRight,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { 
  calculateDashboardMetrics, 
  calculateWeakTopics, 
  getStoredQueries,
  getStoredPracticeAttempts
} from '../../lib/storage';
import { buildLearningTrajectory, calculateSubjectAccuracy } from '../../lib/analyticsEngine';
import { formatAcademicYearDisplay } from '../../lib/academicCalendar';
import { getSyllabusForSubject } from '../../lib/syllabusData';
import { evaluateSyllabusVerification } from '../../lib/syllabusVerification';

export const HomeDashboard: React.FC = () => {
  const { user, educationProfile, isLoading } = useAuth();
  const navigate = useNavigate();

  const [chartTimeframe, setChartTimeframe] = useState<'weekly' | 'monthly' | 'custom'>('monthly');

  // Compute live real metrics from saved user data
  const metrics = useMemo(() => calculateDashboardMetrics(user?.id), [user?.id]);
  const weakTopics = useMemo(() => calculateWeakTopics(user?.id), [user?.id]);
  const recentQueries = useMemo(() => getStoredQueries(user?.id).slice(0, 4), [user?.id]);
  const allAttempts = useMemo(() => getStoredPracticeAttempts(user?.id), [user?.id]);

  // Dynamic greeting based on current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Performance over time chart data computed from real practice records
  const performanceTrendData = useMemo(() => {
    const range = chartTimeframe === 'weekly' ? '7d' : chartTimeframe === 'monthly' ? '30d' : 'all';
    return buildLearningTrajectory(allAttempts, range);
  }, [chartTimeframe, allAttempts]);

  // Subject-wise accuracy calculation from actual database records
  const subjectAccuracyData = useMemo(() => {
    return calculateSubjectAccuracy(allAttempts).map(s => ({
      name: s.subject,
      accuracy: s.accuracy !== null ? s.accuracy : 0,
      realAccuracy: s.accuracy,
      totalAttempts: s.totalAttempts,
      correctAttempts: s.correctAttempts,
      color: s.color
    }));
  }, [allAttempts]);

  // Primary top weak topic needing attention
  const topWeakTopic = weakTopics.find(t => t.category === 'Needs Practice') || weakTopics[0];

  // Dynamic syllabus verification status based on student's active board, class, and academic session
  const primarySubject = educationProfile?.subjects?.[0] || 'Physics';
  const syllabusVerification = useMemo(() => {
    if (!educationProfile) return null;
    const syllabus = getSyllabusForSubject(
      educationProfile.board,
      educationProfile.classLevel,
      primarySubject,
      educationProfile.stream,
      educationProfile.academicYear
    );
    return evaluateSyllabusVerification(syllabus, educationProfile.academicYear);
  }, [educationProfile, primarySubject]);

  if (isLoading || (!educationProfile && user)) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-10 animate-in fade-in duration-150">
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-extrabold text-slate-800">
            Loading your academic dashboard...
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Retrieving enrolled subjects, learning progress, and curriculum records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* 1. Welcome Banner with Educational Illustration */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl shadow-indigo-950/10">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="/assets/banner_illustration.jpg" 
            alt="Concept background" 
            className="w-full h-full object-cover mix-blend-overlay"
          />
        </div>
        
        <div className="relative z-10 p-6 sm:p-8 lg:p-9 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Concept-Driven Mastery</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {greeting}, {user?.fullName || 'Student'}! 👋
            </h1>

            <p className="text-indigo-100/90 text-xs sm:text-sm font-medium leading-relaxed">
              “Keep going! Every question you solve brings you closer to your goals.”
            </p>

            {/* Profile Context Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-[11px] font-bold border border-white/20">
                Class {educationProfile?.classLevel || '12'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-[11px] font-bold border border-white/20">
                {educationProfile?.board || 'CBSE'}
              </span>
              {educationProfile?.classLevel !== '10' && educationProfile?.stream && (
                <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-[11px] font-bold border border-white/20">
                  {educationProfile.stream} Stream
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur-md text-[11px] font-bold border border-white/20">
                AY {formatAcademicYearDisplay(educationProfile?.academicYear, educationProfile?.board)}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/30 text-indigo-200 text-[11px] font-medium border border-indigo-400/30">
                {educationProfile?.subjects?.join(' • ') || 'Physics • Chemistry • Mathematics'}
              </span>
              {syllabusVerification && (
                <Link
                  to="/syllabus"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border backdrop-blur-md transition ${
                    syllabusVerification.badgeType === 'verified'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30'
                      : syllabusVerification.badgeType === 'pending'
                      ? 'bg-amber-500/25 text-amber-200 border-amber-400/40 hover:bg-amber-500/35'
                      : 'bg-white/15 text-slate-200 border-white/25 hover:bg-white/25'
                  }`}
                  title={syllabusVerification.statusNote}
                >
                  {syllabusVerification.badgeType === 'verified' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  )}
                  <span>{syllabusVerification.badgeLabel}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Banner Action Badge */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={user?.avatarUrl && !user.avatarUrl.includes('student_avatar') ? user.avatarUrl : '/assets/robot_avatar.jpg'}
                alt={user?.fullName || 'Student'}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-white/30 shadow-2xl group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                <Flame className="w-3 h-3 fill-white" />
                {metrics.currentStreakDays}d streak
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doubt')}
              className="mt-1 px-4 py-2 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs shadow-lg transition flex items-center gap-2 group"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>Ask a Doubt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Motivational Quote Strip */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-sky-50 border border-indigo-100/70 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 italic">
              “Small steps every day lead to big progress.”
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Daily Learning Principle • ConceptTrace AI</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[11px] font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg border border-indigo-100">
          Day {metrics.currentStreakDays} of Consistent Practice
        </span>
      </div>

      {/* 2. Four Summary Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Core Learning Metrics</span>
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline">Updated from verified attempts</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Days */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Days
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{metrics.activeDaysThisMonth}</span>
              <span className="text-xs text-slate-500 font-medium">days this month</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold">
              {metrics.activeDaysThisMonth > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">+{metrics.previousPeriodActiveDaysDiff} days vs previous month</span>
                </>
              ) : (
                <span className="text-slate-400">No activity logged this month</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Study Time */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Study Time
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{metrics.studyTimeHours}h {metrics.studyTimeMinutes}m</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Time tracked on ConceptTrace AI</span>
            </div>
          </div>
        </div>

        {/* Card 3: Current Streak */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Streak
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{metrics.currentStreakDays}</span>
              <span className="text-xs text-slate-500 font-medium">consecutive days</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md inline-block">
              {metrics.currentStreakDays > 0 ? 'Keep it up! Log a question today 🔥' : 'Start your study streak today!'}
            </div>
          </div>
        </div>

        {/* Card 4: Overall Accuracy */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-card transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Overall Accuracy
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {metrics.overallAccuracy !== null ? `${metrics.overallAccuracy}%` : 'N/A'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {metrics.totalAttempts > 0 
                  ? `(${metrics.correctAttempts}/${metrics.totalAttempts} correct)` 
                  : '(0 attempts logged)'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold">
              {metrics.totalAttempts > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">+{metrics.previousPeriodAccuracyDiff}% from verified practice</span>
                </>
              ) : (
                <span className="text-slate-400">Complete practice to establish baseline</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* 3. Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Learning Improvement Graph */}
        <div className="lg:col-span-2 p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Learning Improvement Over Time
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated from verified student practice attempts and step evaluations
              </p>
            </div>

            {/* Timeframe switch */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setChartTimeframe('weekly')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartTimeframe === 'weekly' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe('monthly')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartTimeframe === 'monthly' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setChartTimeframe('custom')}
                className={`px-3 py-1 rounded-lg transition ${
                  chartTimeframe === 'custom' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Recharts LineChart or Honest Empty State */}
          {performanceTrendData.length === 0 ? (
            <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <TrendingUp className="w-8 h-8 text-slate-300" />
              <h4 className="text-xs font-bold text-slate-700">No Practice Attempts in Selected Period</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Attempt questions in Practice mode to see your verified learning curve and subject trajectories.
              </p>
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="mt-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition"
              >
                Start Practice Session
              </button>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="Overall" 
                    stroke="#4f46e5" 
                    strokeWidth={3} 
                    connectNulls
                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Physics" 
                    stroke="#6366f1" 
                    strokeWidth={2} 
                    connectNulls
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Mathematics" 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    connectNulls
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Chemistry" 
                    stroke="#06b6d4" 
                    strokeWidth={2} 
                    connectNulls
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right 1 Col: Subject-wise Accuracy Donut */}
        <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900">Subject Accuracy</h2>
              <Link 
                to="/progress?tab=accuracy" 
                className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>Report</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectAccuracyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="accuracy"
                  >
                    {subjectAccuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any) => [`${val}%`, 'Accuracy']}
                    contentStyle={{ borderRadius: '10px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">
                  {metrics.totalAttempts > 0 ? `${metrics.overallAccuracy}%` : 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Average</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
            {subjectAccuracyData.map((subj) => (
              <div key={subj.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subj.color }} />
                  <span className="font-semibold text-slate-700">{subj.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">{subj.totalAttempts} attempts</span>
                  <span className="font-bold text-slate-900">
                    {subj.realAccuracy !== null ? `${subj.realAccuracy}%` : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. AI Learning Guidance & Weak-Topic Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Learning Guidance Card (2 Cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-sky-50/60 rounded-3xl border border-indigo-100/90 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-indigo-950">
                AI Learning Guidance & Recommended Next Actions
              </h2>
              <p className="text-xs text-indigo-700/80 font-medium">
                Targeted recommendations driven by your recent verified question attempts
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {allAttempts.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white border border-indigo-100 flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900">
                    Welcome to ConceptTrace AI!
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Once you ask questions or take practice quizzes, ConceptTrace AI will analyze your specific conceptual patterns and generate targeted recommendations here.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/doubt')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Ask Your First Doubt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/practice')}
                      className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      <span>Try Practice Questions</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Dynamic Topic Gap Card */}
                {weakTopics.find(t => t.category === 'Needs Practice') ? (
                  (() => {
                    const priorityGap = weakTopics.find(t => t.category === 'Needs Practice')!;
                    return (
                      <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 flex items-start gap-3 shadow-xs">
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">
                              Review Prerequisite: {priorityGap.prerequisiteConcepts?.[0] || 'Core Concepts'}
                            </p>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                              Priority Gap
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Your recent attempts in <span className="font-semibold text-slate-800">{priorityGap.topic}</span> ({priorityGap.accuracy}% accuracy) showed conceptual gaps. Reviewing prerequisites will solidify your foundation.
                          </p>
                          <div className="mt-2.5 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/practice?topic=${encodeURIComponent(priorityGap.topic)}`)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                              <span>Practice {priorityGap.topic}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : null}

                {/* Positive Reinforcement Card */}
                {weakTopics.find(t => t.category === 'Doing Well' || t.category === 'Improving') ? (
                  (() => {
                    const strongTopic = weakTopics.find(t => t.category === 'Doing Well' || t.category === 'Improving')!;
                    return (
                      <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 flex items-start gap-3 shadow-xs">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">
                              {strongTopic.topic} is Strong ({strongTopic.accuracy}% Accuracy)
                            </p>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {strongTopic.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            You solved {strongTopic.correctCount} out of {strongTopic.eligibleAttempts} questions correctly! Continue consistent practice to maintain mastery.
                          </p>
                        </div>
                      </div>
                    );
                  })()
                ) : null}

                {/* Collecting evidence notice */}
                {!weakTopics.some(t => t.category === 'Needs Practice' || t.category === 'Doing Well' || t.category === 'Improving') && (
                  <div className="p-3.5 rounded-2xl bg-white border border-indigo-100 flex items-start gap-3 shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900">
                        Collecting Evidence Across Topics
                      </p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        ConceptTrace AI requires at least 3 attempts per topic to determine reliable mastery trends without premature classification.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Weak Topic Highlights (1 Col) */}
        <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-500" />
                <h2 className="text-base font-extrabold text-slate-900">Weak Topics Focus</h2>
              </div>
              <Link to="/weak-topics" className="text-xs text-indigo-600 font-bold hover:underline">
                View All
              </Link>
            </div>

            {topWeakTopic && topWeakTopic.eligibleAttempts > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                    {topWeakTopic.subject}
                  </span>
                  <span className="text-xs font-black text-rose-600">
                    {topWeakTopic.accuracy}% Acc
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">
                  {topWeakTopic.topic}
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {topWeakTopic.suggestedRevision}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>{topWeakTopic.eligibleAttempts} attempts recorded</span>
                  <span className="text-rose-600 font-bold">{topWeakTopic.category}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-500 font-medium">No practice attempts recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Complete practice questions to uncover focus areas.</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate(`/practice?topic=${encodeURIComponent(topWeakTopic?.topic || '')}`)}
            className="w-full mt-4 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <span>Start Targeted Practice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. Recent Activity / Previous Queries & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity (2 Cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Recent Doubts & Analyzed Questions</h2>
              <p className="text-xs text-slate-500">Latest step-by-step verified solutions</p>
            </div>
            <Link 
              to="/history" 
              className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentQueries.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <HelpCircle className="w-8 h-8 text-slate-300" />
              <h4 className="text-xs font-bold text-slate-700">No Doubts or Questions Analyzed Yet</h4>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Have a question from your homework, textbook, or worksheet? Ask your first doubt to receive step-by-step verification.
              </p>
              <button
                type="button"
                onClick={() => navigate('/doubt')}
                className="mt-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition"
              >
                Ask a Doubt
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentQueries.map((query) => (
                <div 
                  key={query.id} 
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2.5 transition"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {query.subject}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(query.createdAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        {query.solution?.verificationStatus || 'Verified'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {query.questionText}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Topic: {query.topic || 'General Principle'}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate('/history')}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Open Solution</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel (1 Col) */}
        <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-500 mb-4">Jump directly into your learning flow</p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate('/doubt')}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-700">
                      Ask a Doubt
                    </span>
                    <span className="text-[11px] text-slate-500">Upload text, image or doc</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/practice')}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-100/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-purple-700">
                      Practice Questions
                    </span>
                    <span className="text-[11px] text-slate-500">Test concepts & get feedback</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/syllabus')}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-100/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-700">
                      Curriculum & Syllabus
                    </span>
                    <span className="text-[11px] text-slate-500">Board circulars, units & chapters</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/progress')}
                className="w-full p-3 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 border border-sky-100/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-sky-700">
                      View Progress Report
                    </span>
                    <span className="text-[11px] text-slate-500">Analytics, graphs & PDF</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600">
                      My Profile
                    </span>
                    <span className="text-[11px] text-slate-500">Board, syllabus & avatar</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>ConceptTrace AI v2.0</span>
            <span className="text-indigo-600 font-semibold">Active Session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
