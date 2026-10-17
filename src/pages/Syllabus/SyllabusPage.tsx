import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  ExternalLink, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  HelpCircle, 
  Award, 
  RefreshCw, 
  Upload, 
  Compass, 
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { 
  SubjectSyllabus, 
  SyllabusSubjectUnit, 
  SyllabusChapter, 
  SyllabusTopicItem 
} from '../../types';
import { fetchEnrolledSyllabi, extractCustomSyllabus } from '../../lib/syllabusService';
import { formatAcademicYearDisplay } from '../../lib/academicCalendar';
import { evaluateSyllabusVerification } from '../../lib/syllabusVerification';

export const SyllabusPage: React.FC = () => {
  const { educationProfile, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [syllabi, setSyllabi] = useState<SubjectSyllabus[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [showCustomUploadModal, setShowCustomUploadModal] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Load syllabi when education profile is available
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (isAuthLoading) return;
      if (!educationProfile) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await fetchEnrolledSyllabi(educationProfile);
        if (mounted) {
          setSyllabi(data);
          if (data.length > 0) {
            setActiveSubject(prev => prev && data.some(s => s.subject.toLowerCase() === prev.toLowerCase()) ? prev : data[0].subject);
            // Default first 2 units to expanded
            const initUnits: Record<string, boolean> = {};
            data[0].units.slice(0, 2).forEach(u => {
              initUnits[u.id] = true;
            });
            setExpandedUnits(initUnits);
          }
        }
      } catch (err) {
        console.error('Failed to load syllabi:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [educationProfile, isAuthLoading]);

  // Current active subject syllabus
  const currentSyllabus = syllabi.find(
    s => s.subject.toLowerCase() === activeSubject.toLowerCase()
  ) || syllabi[0];

  // Dynamic verification evaluator based on active academic year and official documents
  const verification = React.useMemo(() => {
    if (!currentSyllabus) return null;
    return evaluateSyllabusVerification(currentSyllabus, educationProfile?.academicYear);
  }, [currentSyllabus, educationProfile?.academicYear]);

  // Refresh from backend
  const handleRefresh = async () => {
    if (!educationProfile) return;
    setIsRefreshing(true);
    try {
      const data = await fetchEnrolledSyllabi(educationProfile);
      setSyllabi(data);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitId]: !prev[unitId]
    }));
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const handleExpandAll = () => {
    if (!currentSyllabus) return;
    const allUnits: Record<string, boolean> = {};
    const allChaps: Record<string, boolean> = {};
    currentSyllabus.units.forEach(u => {
      allUnits[u.id] = true;
      u.chapters.forEach(ch => {
        allChaps[ch.id] = true;
      });
    });
    setExpandedUnits(allUnits);
    setExpandedChapters(allChaps);
  };

  const handleCollapseAll = () => {
    setExpandedUnits({});
    setExpandedChapters({});
  };

  // Filter units and chapters by search query
  const filteredUnits = (currentSyllabus?.units || []).map(unit => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return unit;

    const matchedChapters = unit.chapters.filter(ch => {
      const matchTitle = ch.title.toLowerCase().includes(q);
      const matchDesc = ch.description?.toLowerCase().includes(q);
      const matchTopics = ch.topics.some(t => 
        t.title.toLowerCase().includes(q) ||
        t.subtopics?.some(st => st.toLowerCase().includes(q)) ||
        t.keyConcepts?.some(kc => kc.toLowerCase().includes(q))
      );
      return matchTitle || matchDesc || matchTopics;
    });

    const matchUnitTitle = unit.unitTitle.toLowerCase().includes(q);
    if (matchUnitTitle || matchedChapters.length > 0) {
      return {
        ...unit,
        chapters: matchedChapters.length > 0 ? matchedChapters : unit.chapters
      };
    }
    return null;
  }).filter(Boolean) as SyllabusSubjectUnit[];

  // Custom AI syllabus extraction handler
  const handleCustomExtraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!educationProfile || !customText.trim()) return;
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const extracted = await extractCustomSyllabus(
        customText,
        activeSubject || 'Custom Subject',
        educationProfile.board,
        educationProfile.classLevel,
        educationProfile.stream,
        educationProfile.academicYear
      );

      // Replace or prepend in active syllabi
      setSyllabi(prev => [
        extracted,
        ...prev.filter(s => s.subject.toLowerCase() !== extracted.subject.toLowerCase())
      ]);
      setActiveSubject(extracted.subject);
      setShowCustomUploadModal(false);
      setCustomText('');
    } catch (err: any) {
      setExtractionError(err.message || 'Failed to extract syllabus.');
    } finally {
      setIsExtracting(false);
    }
  };

  const totalChaptersCount = currentSyllabus?.units?.reduce(
    (acc, u) => acc + u.chapters.length, 0
  ) || 0;

  const totalTopicsCount = currentSyllabus?.units?.reduce(
    (acc, u) => acc + u.chapters.reduce((chAcc, ch) => chAcc + ch.topics.length, 0), 0
  ) || 0;

  if (isAuthLoading || (isLoading && syllabi.length === 0)) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-14 animate-in fade-in duration-200">
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-base font-extrabold text-slate-800">
            Synchronizing Your Official Board Syllabus...
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Retrieving verified units, chapters, learning outcomes, and assessment blueprints for Class {educationProfile?.classLevel || '11'}.
          </p>
        </div>
      </div>
    );
  }

  if (!educationProfile) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 my-8 animate-in fade-in duration-200">
        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Academic Profile Setup Required</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please complete your academic profile with your board, class, and enrolled subjects to view your verified curriculum.
        </p>
        <button
          type="button"
          onClick={() => navigate('/setup-profile')}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition"
        >
          Set Up Academic Profile
        </button>
      </div>
    );
  }

  if (!isLoading && syllabi.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4 my-8 animate-in fade-in duration-200">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">No Syllabus Synchronized</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          We could not load curriculum records for your enrolled subjects ({educationProfile?.subjects?.join(', ') || 'None'}).
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Sync</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Edit Profile Subjects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-14 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Official Academic Curriculum
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Curriculum & Syllabus Navigator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Explore verified unit blueprints, chapter breakdowns, concept goals, and official board syllabus documents for Class {educationProfile?.classLevel || '11'}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            title="Re-synchronize with official board curriculum"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Curriculum'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Edit Profile / Stream</span>
          </button>
        </div>
      </div>

      {/* Curriculum Meta Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                {educationProfile?.board || 'CBSE'} Board
              </span>
              <span className="px-2.5 py-1 rounded-full bg-purple-400/20 text-purple-200 text-[11px] font-bold">
                Class {educationProfile?.classLevel || '11'}
              </span>
              {educationProfile?.classLevel !== '10' && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-400/20 text-indigo-200 text-[11px] font-bold">
                  {educationProfile?.stream || 'Science'} Stream
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] font-medium">
                Academic Year {formatAcademicYearDisplay(educationProfile?.academicYear, educationProfile?.board)}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {currentSyllabus?.curriculumType || 'NCERT / National Curriculum Framework (NCF)'}
            </h2>

            <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
              {verification?.statusNote || currentSyllabus?.statusNote || 'Aligned with official board curriculum documents and evaluation standards.'}
            </p>
          </div>

          {/* Verification Badge & Source */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0 pt-2 lg:pt-0 border-t border-white/10 lg:border-t-0">
            {verification?.badgeType === 'verified' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{verification.badgeLabel}</span>
              </div>
            )}

            {verification?.badgeType === 'pending' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs font-bold shadow-xs">
                <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{verification.badgeLabel}</span>
              </div>
            )}

            {verification?.badgeType === 'adapted' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-200 text-xs font-bold shadow-xs">
                <Layers className="w-4 h-4 text-sky-300 shrink-0" />
                <span>{verification.badgeLabel}</span>
              </div>
            )}

            {verification?.badgeType === 'unconfirmed' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/20 border border-slate-400/30 text-slate-300 text-xs font-bold shadow-xs">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{verification.badgeLabel}</span>
              </div>
            )}

            <div className="text-[11px] text-slate-300 flex items-center gap-1.5">
              <span>Source:</span>
              <a
                href={verification?.sourceUrl || currentSyllabus?.sourceUrl || 'https://cbseacademic.nic.in'}
                target="_blank"
                rel="noreferrer"
                className="text-purple-300 hover:text-white font-bold underline flex items-center gap-1"
              >
                <span>{verification?.sourceName || currentSyllabus?.sourceName || 'Board Academic Portal'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-col items-start lg:items-end text-[10px] text-slate-300/80 space-y-0.5">
              {verification?.applicableSession && (
                <span>
                  Curriculum Document: <strong className="text-white">{verification.applicableSession}</strong>
                </span>
              )}
              {verification?.officialPublishedDate && verification.officialPublishedDate !== 'Not Confirmed' && (
                <span>
                  Published / Checked: <strong className="text-white">{verification.officialPublishedDate}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Blueprint Quick Stats */}
        {currentSyllabus?.assessmentPattern && (
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Theory Exam</span>
              <span className="text-base font-black text-white">{currentSyllabus.assessmentPattern.theoryMarks} Marks</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Practical / Internal</span>
              <span className="text-base font-black text-white">{currentSyllabus.assessmentPattern.practicalOrInternalMarks} Marks</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Exam Duration</span>
              <span className="text-base font-black text-white">{currentSyllabus.assessmentPattern.durationHours} Hours</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Scope</span>
              <span className="text-base font-black text-white">{totalChaptersCount} Chapters</span>
            </div>
          </div>
        )}
      </div>

      {/* Subject Tabs Navigation */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-2 sm:p-3">
        <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Your Enrolled Subjects ({syllabi.length})
          </span>
          <button
            type="button"
            onClick={() => setShowCustomUploadModal(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Custom Syllabus</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {syllabi.map((s) => {
            const isActive = s.subject.toLowerCase() === activeSubject.toLowerCase();
            const chapCount = s.units.reduce((acc, u) => acc + u.chapters.length, 0);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setActiveSubject(s.subject);
                  setSearchQuery('');
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2.5 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{s.subject}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {chapCount} Ch
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Action Controls Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${currentSyllabus?.subject || ''} chapters, topics, formulas...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Official Syllabus Documents & Downloads */}
      {currentSyllabus?.officialDocuments && currentSyllabus.officialDocuments.length > 0 && (
        <div className="bg-purple-50/60 border border-purple-100 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-900">
                Official Board Curriculum Documents on Record
              </h3>
            </div>
            <span className="text-[11px] text-purple-600 font-bold">
              {currentSyllabus.officialDocuments.length} Board Document{currentSyllabus.officialDocuments.length > 1 ? 's' : ''} on File
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentSyllabus.officialDocuments.map((doc) => (
              <a
                key={doc.id}
                href={doc.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-white border border-purple-200/70 hover:border-purple-400 shadow-xs hover:shadow-md transition group flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700 transition">
                    {doc.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {doc.sourceName} • {doc.fileSize || 'Official PDF'} • <span className="font-semibold text-purple-700">Applicable Session: {doc.academicYear}</span>
                  </div>
                </div>

                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
                  <Download className="w-4 h-4" />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Syllabus Content Tree: Units -> Chapters -> Topics */}
      <div className="space-y-4">
        {filteredUnits.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">No matching chapters or concepts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any topics matching "{searchQuery}" in {currentSyllabus?.subject}.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
            >
              Clear Search Query
            </button>
          </div>
        ) : (
          filteredUnits.map((unit) => {
            const isUnitExpanded = expandedUnits[unit.id] ?? true;

            return (
              <div 
                key={unit.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Unit Header Accordion Bar */}
                <div 
                  onClick={() => toggleUnit(unit.id)}
                  className="p-5 sm:p-6 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between border-b border-slate-100 select-none transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                      {unit.unitNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Unit {unit.unitNumber}
                        </span>
                        {unit.weightageMarks && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            ~{unit.weightageMarks} Marks
                          </span>
                        )}
                        {unit.totalPeriods && (
                          <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                            {unit.totalPeriods} Periods
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                        {unit.unitTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                      {unit.chapters.length} Chapter{unit.chapters.length > 1 ? 's' : ''}
                    </span>
                    <span className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400">
                      {isUnitExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Unit Chapters Body */}
                {isUnitExpanded && (
                  <div className="p-4 sm:p-6 space-y-4">
                    {unit.chapters.map((ch) => {
                      const isChapExpanded = expandedChapters[ch.id] ?? false;

                      return (
                        <div 
                          key={ch.id}
                          className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-xs"
                        >
                          {/* Chapter Header */}
                          <div 
                            onClick={() => toggleChapter(ch.id)}
                            className="p-4 bg-slate-50/40 hover:bg-slate-100/50 cursor-pointer flex items-start sm:items-center justify-between gap-3 select-none"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                {ch.chapterNumber}
                              </span>
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                                  {ch.title}
                                </h4>
                                {ch.description && (
                                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                    {ch.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                {ch.topics.length} Topic{ch.topics.length > 1 ? 's' : ''}
                              </span>
                              {isChapExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Chapter Topics & Subtopics */}
                          {isChapExpanded && (
                            <div className="p-4 sm:p-5 border-t border-slate-100 space-y-4 bg-white animate-in fade-in duration-150">
                              {ch.topics.map((top) => (
                                <div 
                                  key={top.id}
                                  className="p-4 rounded-2xl bg-slate-50/60 border border-slate-100 space-y-3"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                      <h5 className="text-xs font-black text-slate-900 tracking-tight">
                                        {top.title}
                                      </h5>
                                      {top.description && (
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          {top.description}
                                        </p>
                                      )}
                                    </div>

                                    {/* Action buttons: Ask AI Doubt or Practice this topic */}
                                    <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/doubt?subject=${encodeURIComponent(currentSyllabus.subject)}&topic=${encodeURIComponent(top.title)}`)}
                                        className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] transition flex items-center gap-1"
                                        title="Ask an AI Doubt about this syllabus topic"
                                      >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Ask Doubt</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => navigate(`/practice?topic=${encodeURIComponent(top.title)}`)}
                                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition flex items-center gap-1"
                                        title="Practice verified multiple-choice questions for this topic"
                                      >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        <span>Practice</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Subtopics Bullet List */}
                                  {top.subtopics && top.subtopics.length > 0 && (
                                    <div className="space-y-1 pt-1 border-t border-slate-200/50">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Subtopics & Learning Goals
                                      </span>
                                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs text-slate-600">
                                        {top.subtopics.map((sub, idx) => (
                                          <li key={idx} className="flex items-start gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                                            <span className="leading-relaxed">{sub}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Key Concepts Pills */}
                                  {top.keyConcepts && top.keyConcepts.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      <span className="text-[10px] font-bold text-slate-400 mr-1">
                                        Key Insights:
                                      </span>
                                      {top.keyConcepts.map((kc, kidx) => (
                                        <span 
                                          key={kidx}
                                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs"
                                        >
                                          {kc}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Prescribed Textbooks Banner */}
      {currentSyllabus?.prescribedBooks && currentSyllabus.prescribedBooks.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-100/80 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Official Prescribed Textbooks & Laboratory Manuals
            </h4>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            {currentSyllabus.prescribedBooks.map((book, bidx) => (
              <li key={bidx} className="leading-relaxed font-medium">
                {book}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Custom Syllabus Extraction Modal */}
      {showCustomUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
                  <Upload className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Analyze Custom / School Syllabus
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              If your school or autonomous college follows a customized curriculum, paste the chapter list or syllabus text below. ConceptTrace AI's curriculum parser will extract the units, chapters, and topics into your structured dashboard.
            </p>

            {extractionError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{extractionError}</span>
              </div>
            )}

            <form onSubmit={handleCustomExtraction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Syllabus Text / Chapter Outline
                </label>
                <textarea
                  rows={6}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Paste your syllabus outline, units, and chapters here... e.g. Unit 1: Solid State, Unit 2: Electrochemistry..."
                  className="w-full p-3.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isExtracting || !customText.trim()}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isExtracting ? 'Analyzing with AI...' : 'Parse Syllabus'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
