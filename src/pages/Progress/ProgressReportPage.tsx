import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Target, 
  Clock, 
  Download, 
  Flame, 
  ArrowRight,
  Calendar,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { 
  calculateAnalyticsSummary, 
  calculateSubjectAccuracy, 
  filterAttemptsByDateRange, 
  buildLearningTrajectory, 
  buildActivityHeatmap,
  deduplicateAndFilterStudySessions,
  toCalendarDateString,
  type DateFilterRange,
  type CustomDateRange
} from '../../lib/analyticsEngine';
import { 
  calculateWeakTopics, 
  getStoredPracticeAttempts, 
  getStoredStudySessions, 
  getStoredQueries 
} from '../../lib/storage';

export const ProgressReportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, educationProfile } = useAuth();

  // Active sub-navigation tab
  const currentTab = searchParams.get('tab') || 'overview';
  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Date filter state
  const [dateRange, setDateRange] = useState<DateFilterRange>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Custom date range object
  const customRange: CustomDateRange | undefined = useMemo(() => {
    if (dateRange === 'custom' && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    return undefined;
  }, [dateRange, customStart, customEnd]);

  // Load database records scoped strictly to authenticated user
  const allAttempts = useMemo(() => getStoredPracticeAttempts(user?.id), [user?.id]);
  const allSessions = useMemo(() => getStoredStudySessions(user?.id), [user?.id]);
  const allQueries = useMemo(() => getStoredQueries(user?.id), [user?.id]);

  // Genuine analytics calculations (deduplicated, idle-excluded, date-filtered)
  const summaryMetrics = useMemo(() => {
    return calculateAnalyticsSummary(allAttempts, allSessions, allQueries.length, dateRange, customRange);
  }, [allAttempts, allSessions, allQueries.length, dateRange, customRange]);

  const filteredAttempts = useMemo(() => {
    return filterAttemptsByDateRange(allAttempts, dateRange, customRange);
  }, [allAttempts, dateRange, customRange]);

  const subjectAccuracyList = useMemo(() => {
    return calculateSubjectAccuracy(filteredAttempts);
  }, [filteredAttempts]);

  const learningTrajectory = useMemo(() => {
    return buildLearningTrajectory(filteredAttempts, dateRange);
  }, [filteredAttempts, dateRange]);

  const weakTopics = useMemo(() => {
    return calculateWeakTopics(user?.id);
  }, [user?.id]);

  const heatmapDays = useMemo(() => {
    return buildActivityHeatmap(allSessions, allAttempts);
  }, [allSessions, allAttempts]);

  // Deduplicated and filtered sessions for activity tab
  const cleanSessions = useMemo(() => {
    return deduplicateAndFilterStudySessions(allSessions);
  }, [allSessions]);

  // Real practice volume grouped by topic within the filtered attempts
  const topicVolumeData = useMemo(() => {
    const grouped: Record<string, { topic: string; attempts: number; correct: number }> = {};
    filteredAttempts.forEach(a => {
      const t = a.topic || 'General Practice';
      if (!grouped[t]) grouped[t] = { topic: t, attempts: 0, correct: 0 };
      grouped[t].attempts++;
      if (a.isCorrect) grouped[t].correct++;
    });

    return Object.values(grouped).map(g => ({
      topic: g.topic.length > 18 ? g.topic.slice(0, 16) + '…' : g.topic,
      fullName: g.topic,
      attempts: g.attempts,
      accuracy: Math.round((g.correct / g.attempts) * 100)
    })).sort((a, b) => b.attempts - a.attempts);
  }, [filteredAttempts]);

  // Real daily study minutes for this week (last 7 calendar days)
  const weeklyStudyMinutes = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const calStr = toCalendarDateString(d);

      let daySecs = 0;
      cleanSessions.forEach(s => {
        if (toCalendarDateString(s.startedAt) === calStr) {
          daySecs += (s.trackedSeconds || 0);
        }
      });

      result.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: calStr,
        minutes: Math.round(daySecs / 60)
      });
    }
    return result;
  }, [cleanSessions]);

  // PDF Generation Function
  const generatePdfReport = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const studentName = user?.fullName || 'Student';
      const studentClass = educationProfile?.classLevel || '11';
      const board = educationProfile?.board || 'CBSE';

      // Header Banner
      doc.setFillColor(79, 70, 229); // Brand Indigo
      doc.rect(0, 0, 210, 32, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('ConceptTrace AI — Official Learning Progress Report', 14, 16);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 220, 255);
      doc.text(`Student: ${studentName} | Class ${studentClass} (${board}) | Report Date: ${reportDate}`, 14, 25);

      // Section 1: Executive Learning Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text('1. Executive Learning Summary', 14, 44);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Reporting Period: ${dateRange.toUpperCase()}${customRange ? ` (${customRange.startDate} to ${customRange.endDate})` : ''}`, 14, 52);
      
      const accText = summaryMetrics.overallAccuracy !== null
        ? `${summaryMetrics.overallAccuracy}% (${summaryMetrics.correctAttempts} correct out of ${summaryMetrics.totalAttempts} eligible attempts)`
        : 'No practice attempts logged in this period (0 attempts)';
      doc.text(`Overall Verified Accuracy: ${accText}`, 14, 58);
      doc.text(`Active Study Days: ${summaryMetrics.activeDaysCount} qualifying days`, 14, 64);
      doc.text(`Total Tracked Learning Time: ${summaryMetrics.studyTimeHours}h ${summaryMetrics.studyTimeMinutes}m (Idle excluded)`, 14, 70);
      doc.text(`Consecutive Activity Streak: ${summaryMetrics.currentStreakDays} days`, 14, 76);
      doc.text(`Verified Doubt Solutions: ${summaryMetrics.activeQueriesCount} questions resolved`, 14, 82);

      // Section 2: Subject-wise Performance Breakdown
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text('2. Subject-wise Accuracy Breakdown', 14, 96);

      let yPos = 104;
      subjectAccuracyList.forEach((s) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        const subAcc = s.accuracy !== null ? `${s.accuracy}%` : 'N/A';
        doc.text(`${s.subject}: ${subAcc}`, 14, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Attempts: ${s.totalAttempts} | Correct: ${s.correctAttempts} | Incorrect: ${s.incorrectAttempts}`, 75, yPos);
        yPos += 7;
      });

      // Section 3: Topic-Level Evidence
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text('3. Evidence-Based Topic Analysis (Ranked by Need)', 14, yPos);
      yPos += 8;

      weakTopics.slice(0, 4).forEach((w, idx) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const isNeedsPractice = w.category === 'Needs Practice';
        doc.setTextColor(isNeedsPractice ? 225 : 79, isNeedsPractice ? 29 : 70, isNeedsPractice ? 72 : 229);
        doc.text(`${idx + 1}. ${w.topic} (${w.subject}) — ${w.category} [${w.accuracy}% | ${w.correctCount}/${w.eligibleAttempts} attempts]`, 14, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        if (w.mistakePatterns[0]) {
          doc.text(`   • Primary Misconception: ${w.mistakePatterns[0]}`, 14, yPos);
          yPos += 5;
        }
        doc.text(`   • Recommended Action: ${w.recommendedAction}`, 14, yPos);
        yPos += 7;
      });

      // Section 4: Study Hygiene & Policy
      yPos += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('4. Quality & Audit Safeguards', 14, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('• Tracked study time excludes inactive intervals (60-second inactivity timeout).', 14, yPos);
      yPos += 4.5;
      doc.text('• Sessions are deduplicated and verified per student ID under Row Level Security.', 14, yPos);
      yPos += 4.5;
      doc.text('• Topics with < 3 attempts are strictly categorized as "Needs More Evidence".', 14, yPos);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Certified by ConceptTrace AI Analytics Engine • Calculated strictly from verified student database records.', 14, 282);

      // Save PDF
      doc.save(`ConceptTrace_Progress_Report_${studentName.replace(/\s+/g, '_')}_${toCalendarDateString(new Date())}.pdf`);
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Database-Backed Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Progress & Learning Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track measurable concept improvement, subject accuracy trends, active study time, and evidence-based reports.
          </p>
        </div>

        {/* Download PDF Report Button */}
        <button
          type="button"
          disabled={isGeneratingPdf}
          onClick={generatePdfReport}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
        </button>
      </div>

      {/* Date Filter & Control Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Analytics Timeframe:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {(['7d', '30d', '90d', 'all', 'custom'] as const).map(range => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                dateRange === range 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {range === 'all' ? 'All Time' : range === 'custom' ? 'Custom Range' : `Last ${range.toUpperCase()}`}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
            />
          </div>
        )}
      </div>

      {/* Secondary Horizontal Navigation Sub-Menu */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'graphs', label: 'Learning Graphs', icon: TrendingUp },
          { id: 'accuracy', label: 'Subject Accuracy', icon: PieIcon },
          { id: 'weak-topics', label: 'Weak Topics', icon: Target },
          { id: 'activity', label: 'Study Activity', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB A — OVERVIEW
          ========================================================================= */}
      {currentTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Doubts</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{summaryMetrics.activeQueriesCount}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">step solutions logged</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Practice Attempts</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{summaryMetrics.totalAttempts}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summaryMetrics.totalAttempts > 0 
                  ? `${summaryMetrics.correctAttempts} correct submissions` 
                  : 'No attempts in period'}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Accuracy</span>
              <div className={`text-2xl font-black mt-1 ${summaryMetrics.overallAccuracy !== null ? 'text-emerald-600' : 'text-slate-400'}`}>
                {summaryMetrics.overallAccuracy !== null ? `${summaryMetrics.overallAccuracy}%` : 'N/A'}
              </div>
              <p className="text-[11px] font-semibold mt-0.5 text-slate-500">
                {summaryMetrics.totalAttempts > 0 
                  ? `${summaryMetrics.correctAttempts}/${summaryMetrics.totalAttempts} correct` 
                  : 'Needs practice baseline'}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Study Time</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {summaryMetrics.studyTimeHours}h {summaryMetrics.studyTimeMinutes}m
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summaryMetrics.activeDaysCount} active days • {summaryMetrics.currentStreakDays}d streak
              </p>
            </div>
          </div>

          {/* Subject Accuracy Quick Pills */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Subject Accuracy & Evidence Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {subjectAccuracyList.map((s) => (
                <div key={s.subject} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{s.subject}</span>
                    <span className="text-xs font-black" style={{ color: s.color }}>
                      {s.accuracy !== null ? `${s.accuracy}%` : 'No Attempts'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${s.accuracy || 0}%`, backgroundColor: s.color }} 
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {s.totalAttempts > 0 
                      ? `${s.correctAttempts}/${s.totalAttempts} correct attempts` 
                      : '0 attempts recorded'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Weak Topic Guidance Card */}
          {weakTopics.length > 0 && weakTopics[0] && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-sky-50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    {weakTopics[0].category}
                  </span>
                  <span className="text-xs font-bold text-slate-900">{weakTopics[0].topic}</span>
                  <span className="text-[11px] text-slate-500 font-medium">({weakTopics[0].subject})</span>
                </div>
                <p className="text-xs text-slate-600 max-w-xl">
                  {weakTopics[0].mistakePatterns[0] || weakTopics[0].recommendedAction}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/practice?topic=${encodeURIComponent(weakTopics[0].topic)}`)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition shrink-0 flex items-center gap-1.5"
              >
                <span>Targeted Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Practice Volume by Topic Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Practice Volume & Accuracy per Topic</h3>
              <span className="text-xs text-slate-400 font-medium">{topicVolumeData.length} topics evaluated</span>
            </div>

            {topicVolumeData.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No practice attempts recorded in this timeframe</p>
                <p className="text-[11px] text-slate-400">Complete practice questions to view your topic breakdown.</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="topic" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="attempts" name="Attempts Count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="accuracy" name="Accuracy %" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB B — LEARNING GRAPHS
          ========================================================================= */}
      {currentTab === 'graphs' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Chronological Accuracy Trajectory ({dateRange.toUpperCase()})
                </h3>
                <p className="text-xs text-slate-500">Calculated strictly from submitted practice attempts.</p>
              </div>
            </div>

            {filteredAttempts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">No Learning Data in Selected Period</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Practice attempts submitted during this period will be plotted chronologically to visualize your accuracy trajectory and subject mastery.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/practice')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
                >
                  Start Practice Session
                </button>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={learningTrajectory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="Overall" name="Overall Accuracy" stroke="#4f46e5" strokeWidth={3} connectNulls dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Physics" stroke="#6366f1" strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="Mathematics" stroke="#a855f7" strokeWidth={2} connectNulls />
                    <Line type="monotone" dataKey="Chemistry" stroke="#06b6d4" strokeWidth={2} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB C — SUBJECT ACCURACY
          ========================================================================= */}
      {currentTab === 'accuracy' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subjectAccuracyList.map((s) => (
              <div key={s.subject} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{s.subject}</span>
                  <span className="text-base font-black" style={{ color: s.color }}>
                    {s.accuracy !== null ? `${s.accuracy}%` : 'N/A'}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${s.accuracy || 0}%`, backgroundColor: s.color }} 
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Eligible Attempts</span>
                    <span className="font-bold text-slate-900">{s.totalAttempts}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Correct</span>
                    <span className="font-bold text-emerald-600">{s.correctAttempts}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Incorrect</span>
                    <span className="font-bold text-rose-600">{s.incorrectAttempts}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/practice?topic=All`)}
                  className="w-full py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>Practice {s.subject}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB D — WEAK TOPICS SUB-REPORT
          ========================================================================= */}
      {currentTab === 'weak-topics' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>Evidence-based categorization: Requires minimum 3 attempts before flagging. Categorized by measured accuracy.</span>
            <button
              type="button"
              onClick={() => navigate('/weak-topics')}
              className="font-bold text-indigo-700 hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Full Diagnosis &rarr;</span>
            </button>
          </div>

          <div className="space-y-3">
            {weakTopics.map((w, idx) => (
              <div key={idx} className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {w.subject}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{w.topic}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      w.category === 'Needs Practice' ? 'bg-rose-100 text-rose-800' :
                      w.category === 'Improving' ? 'bg-amber-100 text-amber-800' :
                      w.category === 'Needs More Evidence' ? 'bg-slate-100 text-slate-600' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {w.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{w.mistakePatterns[0]}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {w.eligibleAttempts > 0 ? `${w.accuracy}%` : '0%'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {w.correctCount}/{w.eligibleAttempts} attempts
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/practice?topic=${encodeURIComponent(w.topic)}`)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    Practice
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB E — STUDY ACTIVITY & HEATMAP
          ========================================================================= */}
      {currentTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Activity Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tracked Study Time</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {summaryMetrics.studyTimeHours}h {summaryMetrics.studyTimeMinutes}m
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">excludes idle intervals</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Streak</span>
              <div className="text-2xl font-black text-amber-600 mt-1 flex items-center gap-1">
                <Flame className="w-5 h-5 fill-amber-500" />
                <span>{summaryMetrics.currentStreakDays} days</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Consecutive active days</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Days</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {summaryMetrics.activeDaysCount} days
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">in selected period</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Idle Guard</span>
              <div className="text-2xl font-black text-slate-900 mt-1">Active</div>
              <p className="text-[11px] text-slate-500 mt-0.5">60s inactivity timeout</p>
            </div>
          </div>

          {/* Daily Study Minutes Chart (Last 7 Days) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Active Daily Learning Minutes (Last 7 Days)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStudyMinutes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="m" />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
                  <Bar dataKey="minutes" name="Active Minutes Tracked" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 30-Day Activity Heatmap */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">30-Day Activity Heatmap</h3>
                <p className="text-xs text-slate-500">Qualifying learning sessions logged on ConceptTrace AI</p>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <span>Less</span>
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" title="0m" />
                <span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200" title="1-20m" />
                <span className="w-3 h-3 rounded bg-indigo-400" title="21-45m" />
                <span className="w-3 h-3 rounded bg-indigo-700" title="46m+" />
                <span>More</span>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 pt-2">
              {heatmapDays.map((d, idx) => (
                <div
                  key={idx}
                  title={`${d.displayDate}: ${d.activeMinutes} min active, ${d.attemptsCount} attempts`}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    d.level === 3 ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs' :
                    d.level === 2 ? 'bg-indigo-400 text-white border-indigo-500' :
                    d.level === 1 ? 'bg-indigo-50 border-indigo-200 text-indigo-900' :
                    'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-bold">{d.displayDate.split(' ')[1]}</div>
                  <div className="text-[9px] font-semibold mt-0.5">
                    {d.isQualifying ? `${d.activeMinutes}m` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
