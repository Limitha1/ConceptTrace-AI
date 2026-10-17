import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BookOpen, 
  ArrowRight, 
  ChevronRight, 
  Filter 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { calculateWeakTopics } from '../../lib/storage';
import type { WeakTopicAnalysis, TopicProficiencyCategory } from '../../types';

export const WeakTopicsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, educationProfile } = useAuth();

  const [topics, setTopics] = useState<WeakTopicAnalysis[]>(calculateWeakTopics(user?.id));

  React.useEffect(() => {
    setTopics(calculateWeakTopics(user?.id));
  }, [user?.id]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [activeTopicDetail, setActiveTopicDetail] = useState<WeakTopicAnalysis | null>(null);

  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const matchCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchSubj = selectedSubject === 'All' || t.subject === selectedSubject;
      return matchCat && matchSubj;
    });
  }, [topics, selectedCategory, selectedSubject]);

  const categoryBadge = (cat: TopicProficiencyCategory) => {
    switch (cat) {
      case 'Needs Practice':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">Needs Practice</span>;
      case 'Improving':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">Improving</span>;
      case 'Doing Well':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Doing Well</span>;
      case 'Needs More Evidence':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">Needs More Evidence</span>;
    }
  };

  const trendIcon = (trend: WeakTopicAnalysis['trend']) => {
    if (trend === 'improving') return <span className="flex items-center text-emerald-600 text-xs font-bold gap-1"><TrendingUp className="w-3.5 h-3.5" /> Trending Up</span>;
    if (trend === 'declining') return <span className="flex items-center text-rose-600 text-xs font-bold gap-1"><TrendingDown className="w-3.5 h-3.5" /> Needs Attention</span>;
    if (trend === 'unknown') return <span className="flex items-center text-slate-400 text-xs font-medium gap-1"><Minus className="w-3.5 h-3.5" /> Small Sample</span>;
    return <span className="flex items-center text-slate-500 text-xs font-medium gap-1"><Minus className="w-3.5 h-3.5" /> Stable</span>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Target className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Evidence-Based Gap Analysis
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Weak Topics & Concept Gaps
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            We don't classify a topic as weak from a single error. Categories are determined by statistically meaningful practice attempts, mistake patterns, and prerequisite concept mapping.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/practice')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4" />
          <span>Launch Practice Session</span>
        </button>
      </div>

      {/* Category Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setSelectedCategory('Needs Practice')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition ${
            selectedCategory === 'Needs Practice' ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-rose-700 uppercase">Needs Practice</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {topics.filter(t => t.category === 'Needs Practice').length}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Accuracy below 60%</p>
        </div>

        <div 
          onClick={() => setSelectedCategory('Improving')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition ${
            selectedCategory === 'Improving' ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-amber-700 uppercase">Improving</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {topics.filter(t => t.category === 'Improving').length}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Accuracy 60% - 79%</p>
        </div>

        <div 
          onClick={() => setSelectedCategory('Doing Well')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition ${
            selectedCategory === 'Doing Well' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Doing Well</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {topics.filter(t => t.category === 'Doing Well').length}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Accuracy 80% & above</p>
        </div>

        <div 
          onClick={() => setSelectedCategory('Needs More Evidence')}
          className={`p-4 rounded-2xl bg-white border cursor-pointer transition ${
            selectedCategory === 'Needs More Evidence' ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-600 uppercase">Needs More Evidence</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {topics.filter(t => t.category === 'Needs More Evidence').length}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">&lt; 3 attempts recorded</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filter Category:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="All">All Categories</option>
            <option value="Needs Practice">Needs Practice</option>
            <option value="Improving">Improving</option>
            <option value="Doing Well">Doing Well</option>
            <option value="Needs More Evidence">Needs More Evidence</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Subject:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="All">All Subjects</option>
            {(educationProfile?.subjects && educationProfile.subjects.length > 0 
              ? educationProfile.subjects 
              : ['Physics', 'Chemistry', 'Mathematics']).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTopics.map((topic) => (
          <div
            key={topic.topic}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between hover:shadow-card transition space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {topic.subject} • {topic.chapter}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                    {topic.topic}
                  </h3>
                </div>
                {categoryBadge(topic.category)}
              </div>

              {/* Accuracy & Attempt Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">Calculated Accuracy</span>
                  <span className={topic.accuracy < 60 ? 'text-rose-600' : topic.accuracy < 80 ? 'text-amber-600' : 'text-emerald-600'}>
                    {topic.accuracy}% ({topic.correctCount}/{topic.eligibleAttempts} correct)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      topic.category === 'Needs Practice'
                        ? 'bg-rose-500'
                        : topic.category === 'Improving'
                        ? 'bg-amber-500'
                        : topic.category === 'Doing Well'
                        ? 'bg-emerald-500'
                        : 'bg-indigo-300'
                    }`}
                    style={{ width: `${Math.max(topic.accuracy, 8)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    {topic.eligibleAttempts} verified attempt{topic.eligibleAttempts !== 1 ? 's' : ''}
                  </span>
                  {trendIcon(topic.trend)}
                </div>
              </div>

              {/* Identified Misconceptions */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Key Mistake Pattern:
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {topic.mistakePatterns[0]}
                </p>
              </div>

              {/* Prerequisite Tags */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Prerequisite Foundations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {topic.prerequisiteConcepts.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-indigo-50/60 text-indigo-700 text-[11px] font-semibold"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveTopicDetail(topic)}
                className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
              >
                <span>Full Concept Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => navigate(`/practice?topic=${encodeURIComponent(topic.topic)}`)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
              >
                <span>Targeted Practice</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Topic Detail Modal */}
      {activeTopicDetail && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {activeTopicDetail.subject} • {activeTopicDetail.chapter}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  {activeTopicDetail.topic}
                </h2>
              </div>
              {categoryBadge(activeTopicDetail.category)}
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
              <span className="text-xs font-bold text-indigo-900">Recommended Learning Action</span>
              <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                {activeTopicDetail.recommendedAction}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Common Misconceptions & Mistake Patterns
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {activeTopicDetail.mistakePatterns.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Suggested Revision Strategy
              </span>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {activeTopicDetail.suggestedRevision}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTopicDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const topic = activeTopicDetail.topic;
                  setActiveTopicDetail(null);
                  navigate(`/practice?topic=${encodeURIComponent(topic)}`);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
              >
                <span>Start Practice Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
