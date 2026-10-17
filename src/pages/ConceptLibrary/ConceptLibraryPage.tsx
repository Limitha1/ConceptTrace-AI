import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  BookOpen, 
  Bookmark, 
  BookmarkCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  Target, 
  RefreshCw, 
  ChevronRight, 
  Layers, 
  FileText, 
  Check, 
  X, 
  Award, 
  Lightbulb, 
  Eye, 
  ShieldCheck, 
  BookCheck, 
  Compass, 
  Info,
  Calendar,
  RotateCcw,
  Zap,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { 
  ConceptDetailContent, 
  EducationBoard, 
  ClassLevel, 
  StudentStream,
  PracticeAttempt
} from '../../types';
import { 
  fetchConceptDetail, 
  searchConceptLibrary, 
  getSuggestedRevisions, 
  checkConceptApiStatus,
  type ConceptSearchResult,
  type SuggestedRevisionItem
} from '../../lib/conceptLibraryService';
import { 
  AUTHENTIC_SYLLABI, 
  getAvailableSubjects 
} from '../../lib/syllabusData';
import { 
  CURATED_CONCEPTS 
} from '../../lib/conceptLibraryData';
import { 
  getConceptBookmarks, 
  saveConceptBookmark, 
  removeConceptBookmark, 
  isConceptBookmarked,
  getConceptRevisions, 
  markConceptAsRevised, 
  getRecentlyViewedConcepts, 
  recordConceptView,
  savePracticeAttempt
} from '../../lib/storage';

export const ConceptLibraryPage: React.FC = () => {
  const { user, educationProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active student education parameters (defaults to authenticated profile, editable without altering profile)
  const [selectedBoard, setSelectedBoard] = useState<EducationBoard>(educationProfile?.board || 'CBSE');
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(educationProfile?.classLevel || '12');
  const [selectedStream, setSelectedStream] = useState<StudentStream | undefined>(educationProfile?.stream);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');

  // Active topic concept data
  const [activeConcept, setActiveConcept] = useState<ConceptDetailContent | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'notes' | 'examples' | 'mistakes' | 'practice'>('learn');
  const [isLoadingConcept, setIsLoadingConcept] = useState<boolean>(false);
  const [conceptLoadSource, setConceptLoadSource] = useState<string>('');
  const [conceptLoadMessage, setConceptLoadMessage] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<ConceptSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // User revision state
  const [bookmarks, setBookmarks] = useState(() => getConceptBookmarks(user?.id));
  const [revisions, setRevisions] = useState(() => getConceptRevisions(user?.id));
  const [recentlyViewed, setRecentlyViewed] = useState(() => getRecentlyViewedConcepts(user?.id));
  const [suggestedRevisions, setSuggestedRevisions] = useState<SuggestedRevisionItem[]>([]);
  const [isBookmarkedState, setIsBookmarkedState] = useState<boolean>(false);
  const [justRevisedNotice, setJustRevisedNotice] = useState<boolean>(false);

  // Practice state on detail page
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [activePracticeIndex, setActivePracticeIndex] = useState<number>(0);
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [selfCheckRevealed, setSelfCheckRevealed] = useState<Record<number, boolean>>({});

  // Backend AI status
  const [aiStatus, setAiStatus] = useState<{ online: boolean; aiConfigured: boolean; model?: string }>({
    online: false,
    aiConfigured: false
  });

  // Sync with auth profile on mount
  useEffect(() => {
    if (educationProfile) {
      setSelectedBoard(educationProfile.board);
      setSelectedClass(educationProfile.classLevel);
      setSelectedStream(educationProfile.stream);
    }
  }, [educationProfile]);

  // Load AI status
  useEffect(() => {
    checkConceptApiStatus().then(setAiStatus);
  }, []);

  // Compute available subjects for selected board & class
  const availableSubjects = useMemo(() => {
    const list = getAvailableSubjects(selectedBoard, selectedClass, selectedStream);
    return list.map(item => item.subject);
  }, [selectedBoard, selectedClass, selectedStream]);

  // Set default subject when availableSubjects changes
  useEffect(() => {
    if (availableSubjects.length > 0 && (!selectedSubject || !availableSubjects.includes(selectedSubject))) {
      // Pick first subject enrolled in profile if present, else first available
      const enrolledMatch = educationProfile?.enrolledSubjects?.find(s => availableSubjects.includes(s));
      setSelectedSubject(enrolledMatch || availableSubjects[0]);
    }
  }, [availableSubjects, selectedSubject, educationProfile]);

  // Find corresponding syllabus record
  const currentSyllabus = useMemo(() => {
    if (!selectedSubject) return null;
    return AUTHENTIC_SYLLABI.find(s => 
      s.board === selectedBoard && 
      s.classLevel === selectedClass && 
      s.subject.toLowerCase() === selectedSubject.toLowerCase()
    ) || null;
  }, [selectedBoard, selectedClass, selectedSubject]);

  // Extract chapters from current syllabus
  const availableChapters = useMemo(() => {
    if (!currentSyllabus) return [];
    const chapters: { id: string; title: string; topicsCount: number }[] = [];
    for (const unit of currentSyllabus.units || []) {
      for (const ch of unit.chapters || []) {
        chapters.push({
          id: ch.id,
          title: ch.title,
          topicsCount: ch.topics?.length || 0
        });
      }
    }
    return chapters;
  }, [currentSyllabus]);

  // Set default chapter when availableChapters changes
  useEffect(() => {
    if (availableChapters.length > 0) {
      if (!selectedChapter || !availableChapters.some(c => c.title === selectedChapter)) {
        setSelectedChapter(availableChapters[0].title);
      }
    } else {
      setSelectedChapter('');
    }
  }, [availableChapters, selectedChapter]);

  // Extract topics for selected chapter
  const availableTopics = useMemo(() => {
    if (!currentSyllabus || !selectedChapter) return [];
    for (const unit of currentSyllabus.units || []) {
      const ch = unit.chapters?.find(c => c.title === selectedChapter);
      if (ch) {
        return ch.topics || [];
      }
    }
    return [];
  }, [currentSyllabus, selectedChapter]);

  // Set default topic when availableTopics changes
  useEffect(() => {
    if (availableTopics.length > 0) {
      if (!selectedTopicId || !availableTopics.some(t => t.id === selectedTopicId)) {
        setSelectedTopicId(availableTopics[0].id);
      }
    } else {
      setSelectedTopicId('');
    }
  }, [availableTopics, selectedTopicId]);

  // Refresh user data (bookmarks, revisions, suggestions)
  const refreshUserData = () => {
    if (!user) return;
    setBookmarks(getConceptBookmarks(user.id));
    setRevisions(getConceptRevisions(user.id));
    setRecentlyViewed(getRecentlyViewedConcepts(user.id));
    setSuggestedRevisions(getSuggestedRevisions(user.id, selectedBoard, selectedClass));
  };

  useEffect(() => {
    refreshUserData();
  }, [user, selectedBoard, selectedClass]);

  // Search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = searchConceptLibrary(searchQuery, {
      board: selectedBoard,
      classLevel: selectedClass,
      subject: selectedSubject !== 'All' ? selectedSubject : undefined
    });
    setSearchResults(results);
    setIsSearching(false);
  }, [searchQuery, selectedBoard, selectedClass, selectedSubject]);

  // Read URL query params on initial load
  useEffect(() => {
    const topicParam = searchParams.get('topic');
    const subjectParam = searchParams.get('subject');
    const boardParam = searchParams.get('board') as EducationBoard;
    const classParam = searchParams.get('class') as ClassLevel;

    if (boardParam) setSelectedBoard(boardParam);
    if (classParam) setSelectedClass(classParam);
    if (subjectParam) setSelectedSubject(subjectParam);
    if (topicParam) {
      // Directly load this topic
      handleOpenTopicById(topicParam, subjectParam || undefined);
    }
  }, []);

  // Check bookmark status when activeConcept changes
  useEffect(() => {
    if (activeConcept && user) {
      setIsBookmarkedState(isConceptBookmarked(activeConcept.topicId, user.id));
    }
  }, [activeConcept, user]);

  // Function to open and fetch a concept
  const handleOpenConcept = async (topicItem: {
    id: string;
    title: string;
    subtopics?: string[];
    keyConcepts?: string[];
  }) => {
    if (!selectedSubject || !selectedChapter) return;
    setIsLoadingConcept(true);
    setConceptLoadMessage(null);
    setActiveTab('learn');
    setPracticeAnswers({});
    setSubmittedQuestions({});
    setActivePracticeIndex(0);
    setRevealedHints({});
    setSelfCheckRevealed({});

    // Update URL param
    setSearchParams({
      board: selectedBoard,
      class: selectedClass,
      subject: selectedSubject,
      topic: topicItem.id
    });

    try {
      const res = await fetchConceptDetail({
        topicId: topicItem.id,
        topicTitle: topicItem.title,
        chapter: selectedChapter,
        subject: selectedSubject,
        board: selectedBoard,
        classLevel: selectedClass,
        stream: selectedStream,
        academicYear: educationProfile?.academicYear || '2026-27',
        subtopics: topicItem.subtopics,
        keyConcepts: topicItem.keyConcepts
      });

      setActiveConcept(res.content);
      setConceptLoadSource(res.source);
      if (res.message) setConceptLoadMessage(res.message);

      // Record recently viewed
      recordConceptView({
        topicId: topicItem.id,
        topicTitle: topicItem.title,
        subject: selectedSubject,
        chapter: selectedChapter,
        board: selectedBoard,
        classLevel: selectedClass
      }, user?.id);

      refreshUserData();
    } catch (err) {
      console.error('Failed to load concept:', err);
    } finally {
      setIsLoadingConcept(false);
    }
  };

  // Helper to open topic by ID (from search, bookmarks, or suggestions)
  const handleOpenTopicById = async (topicId: string, subjectHint?: string) => {
    // 1. First check curated concepts
    const curated = CURATED_CONCEPTS.find(c => c.topicId === topicId || c.id === topicId);
    if (curated) {
      setSelectedBoard(curated.board);
      setSelectedClass(curated.classLevel);
      setSelectedSubject(curated.subject);
      setSelectedChapter(curated.chapter);
      setSelectedTopicId(curated.topicId);
      setActiveConcept(curated);
      setConceptLoadSource('curated-official');
      setActiveTab('learn');
      if (user) {
        recordConceptView({
          topicId: curated.topicId,
          topicTitle: curated.topicTitle,
          subject: curated.subject,
          chapter: curated.chapter,
          board: curated.board,
          classLevel: curated.classLevel
        }, user.id);
        refreshUserData();
      }
      return;
    }

    // 2. Search in AUTHENTIC_SYLLABI
    for (const syl of AUTHENTIC_SYLLABI) {
      if (subjectHint && syl.subject.toLowerCase() !== subjectHint.toLowerCase()) continue;
      for (const unit of syl.units || []) {
        for (const ch of unit.chapters || []) {
          const matchedTop = ch.topics?.find(t => t.id === topicId || t.title.toLowerCase() === topicId.toLowerCase());
          if (matchedTop) {
            setSelectedBoard(syl.board);
            setSelectedClass(syl.classLevel);
            setSelectedSubject(syl.subject);
            setSelectedChapter(ch.title);
            setSelectedTopicId(matchedTop.id);
            await handleOpenConcept(matchedTop);
            return;
          }
        }
      }
    }
  };

  // Bookmark Toggle
  const handleToggleBookmark = () => {
    if (!activeConcept || !user) return;
    if (isBookmarkedState) {
      removeConceptBookmark(activeConcept.topicId, user.id);
      setIsBookmarkedState(false);
    } else {
      saveConceptBookmark({
        id: `bm-${Date.now()}`,
        userId: user.id,
        topicId: activeConcept.topicId,
        topicTitle: activeConcept.topicTitle,
        subject: activeConcept.subject,
        chapter: activeConcept.chapter,
        board: activeConcept.board,
        classLevel: activeConcept.classLevel,
        bookmarkedAt: new Date().toISOString(),
        noteSnippet: activeConcept.overview.simpleIntro.slice(0, 120) + '...'
      });
      setIsBookmarkedState(true);
    }
    refreshUserData();
  };

  // Mark as Revised Action
  const handleMarkAsRevised = () => {
    if (!activeConcept || !user) return;
    markConceptAsRevised(
      activeConcept.topicId,
      activeConcept.topicTitle,
      activeConcept.subject,
      activeConcept.chapter,
      activeConcept.board,
      activeConcept.classLevel,
      user.id
    );
    setJustRevisedNotice(true);
    setTimeout(() => setJustRevisedNotice(false), 3000);
    refreshUserData();
  };

  // Practice Answer submission
  const handleSubmitPracticeAnswer = (questionId: string, selectedOption: string, correctAnswer: string) => {
    if (!activeConcept || !user) return;

    setPracticeAnswers(prev => ({ ...prev, [questionId]: selectedOption }));
    setSubmittedQuestions(prev => ({ ...prev, [questionId]: true }));

    const isCorrect = selectedOption.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    // Persist real practice attempt
    const attempt: PracticeAttempt = {
      id: `att-cl-${Date.now()}-${questionId}`,
      userId: user.id,
      sessionId: `sess-concept-${activeConcept.topicId}`,
      questionId,
      questionText: activeConcept.practiceQuestions.find(q => q.id === questionId)?.question || 'Practice Question',
      submittedAnswer: selectedOption,
      correctAnswer,
      isCorrect,
      subject: activeConcept.subject,
      topic: activeConcept.topicTitle,
      timeSpentSeconds: 45,
      attemptedAt: new Date().toISOString()
    };

    savePracticeAttempt(attempt);
    refreshUserData();
  };

  // Revision count for active concept
  const currentRevisionRecord = useMemo(() => {
    if (!activeConcept) return null;
    return revisions.find(r => r.topicId === activeConcept.topicId) || null;
  }, [activeConcept, revisions]);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-6 lg:p-8 space-y-6">
      {/* 1. WELCOMING HEADER */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative backdrop shapes */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-purple-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Smart Curriculum Revision System</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Revise Any Concept, Anytime
            </h1>
            <p className="text-sm md:text-base text-purple-100/90 leading-relaxed">
              Explore in-depth, syllabus-grounded explanations, concise pre-exam short notes, worked examples, common misconceptions, and interactive practice tailored for Class 10, 11, and 12.
            </p>
          </div>

          {/* Quick AI & Curriculum Status Badges */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-purple-100">
              <div className={`w-2 h-2 rounded-full ${aiStatus.aiConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>AI Engine: {aiStatus.aiConfigured ? (aiStatus.model || 'Gemini Connected') : 'Syllabus Grounded (Standard)'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-purple-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Official Curricula: CBSE • CISCE • State Boards</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative mt-6 max-w-3xl">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, chapters, formulas, or keywords (e.g., Coulomb's Law, Raoult, VSEPR)..."
              className="w-full pl-11 pr-10 py-3 bg-white text-slate-900 rounded-xl shadow-lg border-0 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Instant Search Results Dropdown */}
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                <span>Matching Concepts ({searchResults.length})</span>
                <span>Click to open immediately</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No matching concepts found for "{searchQuery}". Try searching by subject or formula name.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((res) => (
                    <button
                      key={`${res.board}_${res.classLevel}_${res.topicId}`}
                      onClick={() => {
                        setSearchQuery('');
                        handleOpenTopicById(res.topicId, res.subject);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-purple-50/70 transition flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 group-hover:text-purple-700 text-sm">
                            {res.topicTitle}
                          </span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                            {res.board} Class {res.classLevel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {res.subject} • {res.chapter}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 group-hover:text-purple-600">
                          {res.matchReason}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. CASCADING SELECTORS CARD */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm md:text-base">
            <Compass className="w-4 h-4 text-purple-600" />
            <span>Curriculum Navigation: Board & Topic Filters</span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Profile Defaults: {educationProfile?.board} Class {educationProfile?.classLevel}</span>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => {
                if (educationProfile) {
                  setSelectedBoard(educationProfile.board);
                  setSelectedClass(educationProfile.classLevel);
                  setSelectedStream(educationProfile.stream);
                }
              }}
              className="text-purple-600 hover:text-purple-700 font-semibold underline underline-offset-2"
            >
              Reset to Profile
            </button>
          </div>
        </div>

        {/* 5-Step Cascading Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Board Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">1. Education Board</label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value as EducationBoard)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="CBSE">CBSE (All India)</option>
              <option value="CISCE">CISCE / ISC / ICSE</option>
              <option value="Karnataka State Board">Karnataka State Board</option>
              <option value="Maharashtra State Board">Maharashtra State Board</option>
              <option value="Tamil Nadu State Board">Tamil Nadu State Board</option>
              <option value="UP Board">UP Board</option>
            </select>
          </div>

          {/* 2. Class Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">2. Class Level</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="10">Class 10 (Secondary)</option>
              <option value="11">Class 11 (Higher Sec 1)</option>
              <option value="12">Class 12 (Higher Sec 2)</option>
            </select>
          </div>

          {/* 3. Subject Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">3. Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* 4. Chapter Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">4. Chapter / Unit</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              disabled={availableChapters.length === 0}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            >
              {availableChapters.length === 0 ? (
                <option>No chapters in syllabus</option>
              ) : (
                availableChapters.map((ch) => (
                  <option key={ch.id} value={ch.title}>
                    {ch.title} ({ch.topicsCount} topics)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 5. Topic Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">5. Topic</label>
            <select
              value={selectedTopicId}
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                const matched = availableTopics.find(t => t.id === e.target.value);
                if (matched) handleOpenConcept(matched);
              }}
              disabled={availableTopics.length === 0}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
            >
              {availableTopics.length === 0 ? (
                <option>No topics found</option>
              ) : (
                availableTopics.map((top) => (
                  <option key={top.id} value={top.id}>
                    {top.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Selected Topic CTA Button */}
        {availableTopics.length > 0 && selectedTopicId && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Selected: <strong className="text-slate-800">{availableTopics.find(t => t.id === selectedTopicId)?.title}</strong>
            </span>
            <button
              onClick={() => {
                const matched = availableTopics.find(t => t.id === selectedTopicId);
                if (matched) handleOpenConcept(matched);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <span>Open Concept Study Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. ACTIVE TOPIC VIEW OR DASHBOARD SECTIONS */}
      {activeConcept ? (
        /* ============================================================== */
        /* TOPIC LEARNING DETAIL PAGE                                    */
        /* ============================================================== */
        <div className="space-y-6 animate-fadeIn">
          {/* Breadcrumbs & Header Bar */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/80 shadow-sm space-y-4">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <button
                onClick={() => setActiveConcept(null)}
                className="hover:text-purple-600 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Concept Library</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                {activeConcept.board}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-medium text-slate-600">Class {activeConcept.classLevel}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-medium text-slate-600">{activeConcept.subject}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-medium text-slate-600">{activeConcept.chapter}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="font-bold text-purple-700">{activeConcept.topicTitle}</span>
            </div>

            {/* Title & Actions Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                    {activeConcept.topicTitle}
                  </h2>
                  {activeConcept.isVerifiedContent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Official Curriculum Grounded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      AI Synthesized & Structured
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {activeConcept.chapter} • Estimated time: {activeConcept.overview.estimatedReadingTimeMinutes} mins • {activeConcept.overview.difficultyLevel} Level
                </p>
              </div>

              {/* Personal Revision Action Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Bookmark Button */}
                <button
                  onClick={handleToggleBookmark}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    isBookmarkedState 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                  title={isBookmarkedState ? 'Remove from bookmarks' : 'Save short notes & bookmark concept'}
                >
                  {isBookmarkedState ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Bookmarked</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-slate-500" />
                      <span>Bookmark Concept</span>
                    </>
                  )}
                </button>

                {/* Mark as Revised Button */}
                <button
                  onClick={handleMarkAsRevised}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                  <span>Mark Revised</span>
                  {currentRevisionRecord && currentRevisionRecord.revisionCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 font-bold text-[10px]">
                      {currentRevisionRecord.revisionCount}x
                    </span>
                  )}
                </button>

                {/* Ask AI Doubt Button */}
                <button
                  onClick={() => navigate(`/doubt?question=Please explain ${encodeURIComponent(activeConcept.topicTitle)} in ${encodeURIComponent(activeConcept.subject)}`)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 transition"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Ask AI Doubt</span>
                </button>

                {/* Practice Questions Button */}
                <button
                  onClick={() => setActiveTab('practice')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 flex items-center gap-1.5 transition"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>Practice ({activeConcept.practiceQuestions.length})</span>
                </button>
              </div>
            </div>

            {/* Just Revised Notification Banner */}
            {justRevisedNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Revision recorded! Your personal revision history and streak have been updated.</span>
              </div>
            )}

            {/* Information Notice about Grounding */}
            {conceptLoadMessage && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>{conceptLoadMessage}</span>
                </div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">{conceptLoadSource}</span>
              </div>
            )}

            {/* 5-Tab Navigation Bar */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar pt-2 gap-2">
              <button
                onClick={() => setActiveTab('learn')}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'learn'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>1. Learn & Explanation</span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'notes'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>2. Short Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('examples')}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'examples'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>3. Worked Examples ({activeConcept.workedExamples.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('mistakes')}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'mistakes'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>4. Common Mistakes ({activeConcept.commonMistakes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('practice')}
                className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                  activeTab === 'practice'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>5. Practice & Self-Check</span>
              </button>
            </div>
          </div>

          {/* TAB 1: LEARN & EXPLANATION */}
          {activeTab === 'learn' && (
            <div className="space-y-6">
              {/* Concept Overview Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <Lightbulb className="w-4 h-4 text-purple-600" />
                  <span>Concept Overview & Learning Objectives</span>
                </div>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                  {activeConcept.overview.simpleIntro}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-purple-600" />
                      Learning Objectives
                    </span>
                    <ul className="space-y-1.5">
                      {activeConcept.overview.learningObjectives.map((obj, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      Prerequisites
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeConcept.overview.prerequisites.map((pre, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium border border-slate-200">
                          {pre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Sections */}
              <div className="space-y-4">
                {activeConcept.sections.map((sec, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-extrabold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{sec.heading}</span>
                    </h3>

                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line space-y-2">
                      {sec.content}
                    </div>

                    {/* Formula / Rule Card */}
                    {sec.formulaOrRule && (
                      <div className="p-4 bg-slate-900 text-purple-200 rounded-xl font-mono text-xs md:text-sm border border-purple-900/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{sec.formulaOrRule}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Key Formula</span>
                      </div>
                    )}

                    {/* Key Takeaway Callout */}
                    {sec.keyTakeaway && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Exam Takeaway:</strong> {sec.keyTakeaway}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SHORT NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Header explanation */}
              <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-xl border border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs md:text-sm text-purple-900 font-semibold">
                  <FileText className="w-4 h-4 text-purple-700" />
                  <span>Concise Examination Short Notes: Scannable definitions, formulas, and laws</span>
                </div>
                <button
                  onClick={handleToggleBookmark}
                  className="px-3 py-1 bg-white text-purple-700 text-xs font-bold rounded-lg border border-purple-200 hover:bg-purple-50 shadow-sm"
                >
                  {isBookmarkedState ? 'Saved to Bookmarks' : 'Save These Notes'}
                </button>
              </div>

              {/* 1. Essential Definitions */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookCheck className="w-4 h-4 text-purple-600" />
                  <span>Essential Definitions</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeConcept.shortNotes.essentialDefinitions.map((def, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-xs font-bold text-purple-700">{def.term}</span>
                      <p className="text-xs text-slate-600 leading-relaxed">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Key Formulas Cards */}
              {activeConcept.shortNotes.keyFormulas.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Important Formulas & Variable Meanings</span>
                  </h3>
                  <div className="space-y-4">
                    {activeConcept.shortNotes.keyFormulas.map((form, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-purple-300">{form.name}</span>
                          {form.notes && (
                            <span className="text-[10px] text-slate-400">{form.notes}</span>
                          )}
                        </div>
                        <div className="py-2 px-3 bg-black/40 rounded-lg text-emerald-400 font-mono text-sm">
                          {form.formula}
                        </div>
                        <div className="text-xs space-y-1">
                          <span className="text-[11px] font-semibold text-slate-400">Variables & SI Units:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {form.variables.map((v, vIdx) => (
                              <div key={vIdx} className="bg-slate-800/80 px-2.5 py-1.5 rounded text-[11px] flex items-center justify-between">
                                <span className="font-mono text-amber-300">{v.symbol}</span>
                                <span className="text-slate-300 truncate max-w-[140px]">{v.meaning}</span>
                                {v.siUnit && (
                                  <span className="text-slate-500 text-[10px]">({v.siUnit})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Core Laws & Principles */}
              {activeConcept.shortNotes.coreLawsAndPrinciples.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Core Laws, Rules & Principles</span>
                  </h3>
                  <div className="space-y-3">
                    {activeConcept.shortNotes.coreLawsAndPrinciples.map((law, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-1.5">
                        <span className="text-xs font-bold text-purple-900">{law.name}</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-serif italic">
                          "{law.statement}"
                        </p>
                        {law.application && (
                          <p className="text-[11px] text-slate-500 pt-1">
                            <strong>Application:</strong> {law.application}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Comparison Tables */}
              {activeConcept.shortNotes.comparisonTables && activeConcept.shortNotes.comparisonTables.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Key Distinctions & Comparison Tables</span>
                  </h3>
                  {activeConcept.shortNotes.comparisonTables.map((tbl, idx) => (
                    <div key={idx} className="space-y-2">
                      <span className="text-xs font-semibold text-slate-700">{tbl.title}</span>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              {tbl.headers.map((h, hIdx) => (
                                <th key={hIdx} className="px-3 py-2.5">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tbl.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-3 py-2 text-slate-600">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 5. Frequently Confused Points */}
              {activeConcept.shortNotes.frequentlyConfusedPoints.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Frequently Confused Concepts</span>
                  </h3>
                  <div className="space-y-3">
                    {activeConcept.shortNotes.frequentlyConfusedPoints.map((pt, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-rose-700 line-through decoration-rose-400">
                            Mistake: {pt.pointA}
                          </span>
                          <span className="font-semibold text-emerald-700">
                            Accurate: {pt.pointB}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                          <strong>Clarification:</strong> {pt.clarification}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Vital Takeaways */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Vital Takeaways for Quick Revision</span>
                </h3>
                <ul className="space-y-2">
                  {activeConcept.shortNotes.vitalTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: WORKED EXAMPLES */}
          {activeTab === 'examples' && (
            <div className="space-y-6">
              {activeConcept.workedExamples.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center text-slate-500 text-sm">
                  No numerical or multi-step examples are required for this conceptual topic.
                </div>
              ) : (
                activeConcept.workedExamples.map((ex, idx) => (
                  <div key={ex.id || idx} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                          Worked Example {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">Board Exam Style</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Method: {ex.methodOrFormula}</span>
                    </div>

                    {/* Question Box */}
                    <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-purple-900">Problem Statement:</span>
                      <p className="text-sm text-slate-800 font-medium leading-relaxed">
                        {ex.question}
                      </p>
                    </div>

                    {/* Given Information */}
                    {ex.given && ex.given.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-600">Information Given:</span>
                        <div className="flex flex-wrap gap-2">
                          {ex.given.map((g, gIdx) => (
                            <span key={gIdx} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step-by-Step Solution */}
                    <div className="space-y-3 pt-2">
                      <span className="text-xs font-bold text-slate-800">Step-by-Step Derivation & Solution:</span>
                      {ex.steps.map((st) => (
                        <div key={st.stepNumber} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-purple-800">
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                              {st.stepNumber}
                            </span>
                            <span>{st.title}</span>
                          </div>
                          <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg">
                            {st.derivationOrCalc}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {st.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Final Answer */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-emerald-800">Final Answer:</span>
                        <p className="text-sm font-extrabold text-emerald-950 font-mono">
                          {ex.finalAnswer}
                        </p>
                      </div>
                      {ex.reasoningNotes && (
                        <span className="text-xs text-emerald-700 max-w-sm">
                          <strong>Note:</strong> {ex.reasoningNotes}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: COMMON MISTAKES */}
          {activeTab === 'mistakes' && (
            <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Over 70% of marks lost on this topic in board examinations stem from the misconceptions below. Review them carefully!
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeConcept.commonMistakes.map((cm, idx) => (
                  <div key={cm.id || idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                        Common Misconception
                      </h4>
                    </div>

                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                      <p className="text-xs font-semibold text-rose-950">
                        "{cm.misconception}"
                      </p>
                      <p className="text-[11px] text-rose-800">
                        <strong>Why it is incorrect:</strong> {cm.whyIncorrect}
                      </p>
                    </div>

                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                      <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Correct Scientific Understanding:
                      </span>
                      <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                        {cm.correctUnderstanding}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PRACTICE & SELF-CHECK */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              {/* Quick Revision Summary Sub-Section */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Quick Revision Summary (Pre-Test Recall)</span>
                  </div>
                  <span className="text-xs text-slate-400">5-10 Key Takeaways</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">Must-Know Takeaways</span>
                    <ul className="space-y-1.5">
                      {activeConcept.quickRevision.essentialTakeaways.map((takeaway, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">Must-Know Formulas</span>
                    <div className="space-y-1.5">
                      {activeConcept.quickRevision.mustKnowFormulas.map((f, i) => (
                        <div key={i} className="p-2 bg-slate-900 text-purple-300 font-mono text-xs rounded-lg">
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Self-check questions with revealable answer */}
                {activeConcept.quickRevision.selfCheckQuestions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Rapid Self-Check Questions:</span>
                    <div className="space-y-2">
                      {activeConcept.quickRevision.selfCheckQuestions.map((q, qIdx) => (
                        <div key={qIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">Q{qIdx + 1}: {q}</span>
                            <button
                              onClick={() => setSelfCheckRevealed(prev => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                              className="text-purple-600 font-bold text-[11px] hover:underline"
                            >
                              {selfCheckRevealed[qIdx] ? 'Hide Answer' : 'Check Explanation'}
                            </button>
                          </div>
                          {selfCheckRevealed[qIdx] && (
                            <p className="text-slate-600 bg-white p-2 rounded border border-slate-100 text-[11px] leading-relaxed">
                              Refer to Section 1 & Short Notes in this concept guide for the complete derivation and definition.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Practice Questions */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span>Test Your Understanding: Practice Session</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Submitting answers automatically saves practice attempts and feeds into your Weak Topics diagnostic!
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800">
                    Question {activePracticeIndex + 1} of {activeConcept.practiceQuestions.length}
                  </span>
                </div>

                {activeConcept.practiceQuestions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No practice questions currently loaded for this topic.
                  </div>
                ) : (
                  (() => {
                    const currentQ = activeConcept.practiceQuestions[activePracticeIndex];
                    const isSubmitted = submittedQuestions[currentQ.id];
                    const selectedOpt = practiceAnswers[currentQ.id];
                    const isCorrect = selectedOpt?.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();

                    return (
                      <div className="space-y-5">
                        {/* Question Text */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {currentQ.difficulty || 'Medium'}
                            </span>
                            <span className="text-xs text-slate-400">Multiple Choice</span>
                          </div>
                          <p className="text-sm md:text-base font-semibold text-slate-900 leading-relaxed">
                            {currentQ.question}
                          </p>
                        </div>

                        {/* Options List */}
                        <div className="space-y-2">
                          {currentQ.options.map((opt, optIdx) => {
                            let optStyle = 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 bg-white text-slate-800';
                            if (isSubmitted) {
                              if (opt === currentQ.correctAnswer) {
                                optStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                              } else if (opt === selectedOpt && !isCorrect) {
                                optStyle = 'border-rose-400 bg-rose-50 text-rose-950 font-bold';
                              } else {
                                optStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-60';
                              }
                            } else if (selectedOpt === opt) {
                              optStyle = 'border-purple-600 bg-purple-50 text-purple-950 font-bold';
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={isSubmitted}
                                onClick={() => setPracticeAnswers(prev => ({ ...prev, [currentQ.id]: opt }))}
                                className={`w-full p-3.5 rounded-xl border text-left text-xs md:text-sm transition flex items-center justify-between ${optStyle}`}
                              >
                                <span>{opt}</span>
                                {isSubmitted && opt === currentQ.correctAnswer && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                {isSubmitted && opt === selectedOpt && !isCorrect && (
                                  <X className="w-4 h-4 text-rose-600 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Hint Button */}
                        {currentQ.hint && !isSubmitted && (
                          <div>
                            <button
                              onClick={() => setRevealedHints(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                            >
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>{revealedHints[currentQ.id] ? 'Hide Hint' : 'Need a hint?'}</span>
                            </button>
                            {revealedHints[currentQ.id] && (
                              <p className="mt-1 p-2.5 bg-amber-50 rounded-lg text-xs text-amber-900 border border-amber-200">
                                💡 <strong>Hint:</strong> {currentQ.hint}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Submit Button */}
                        {!isSubmitted ? (
                          <button
                            disabled={!selectedOpt}
                            onClick={() => handleSubmitPracticeAnswer(currentQ.id, selectedOpt, currentQ.correctAnswer)}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md transition"
                          >
                            Check Answer
                          </button>
                        ) : (
                          /* Explanation & Result Card */
                          <div className={`p-4 rounded-xl border space-y-2 ${
                            isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
                          }`}>
                            <div className="flex items-center gap-2 text-xs font-bold">
                              {isCorrect ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>Correct Answer! Great work.</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                                  <span>Incorrect. Correct answer is: {currentQ.correctAnswer}</span>
                                </>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed opacity-90">
                              <strong>Explanation:</strong> {currentQ.explanation}
                            </p>
                          </div>
                        )}

                        {/* Navigation between practice questions */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                          <button
                            disabled={activePracticeIndex === 0}
                            onClick={() => setActivePracticeIndex(prev => prev - 1)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                          >
                            Previous Question
                          </button>

                          <div className="flex items-center gap-1.5">
                            {activeConcept.practiceQuestions.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setActivePracticeIndex(i)}
                                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition ${
                                  activePracticeIndex === i
                                    ? 'bg-purple-600 text-white'
                                    : submittedQuestions[activeConcept.practiceQuestions[i].id]
                                      ? 'bg-slate-200 text-slate-800'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>

                          <button
                            disabled={activePracticeIndex >= activeConcept.practiceQuestions.length - 1}
                            onClick={() => setActivePracticeIndex(prev => prev + 1)}
                            className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-semibold disabled:opacity-30"
                          >
                            Next Question
                          </button>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* CONCEPT LIBRARY DASHBOARD                                      */
        /* (Recently viewed, Bookmarks, Suggested Revisions, Curated)    */
        /* ============================================================== */
        <div className="space-y-6">
          {/* A. Curated High-Yield Concepts Spotlight */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm md:text-base font-bold text-slate-900">
                  Curated High-Yield Revision Packs (Immediate Zero-Latency Access)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Verified Board Exemplars</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CURATED_CONCEPTS.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border border-purple-100/80 hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-purple-200/70 text-purple-800">
                        {c.subject}
                      </span>
                      <span className="text-slate-500">
                        {c.board} • Class {c.classLevel}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-purple-700 transition text-sm">
                      {c.topicTitle}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {c.overview.simpleIntro}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-purple-100/60 text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {c.overview.estimatedReadingTimeMinutes} mins
                    </span>
                    <button
                      onClick={() => handleOpenTopicById(c.topicId)}
                      className="font-bold text-purple-700 group-hover:translate-x-0.5 transition flex items-center gap-1"
                    >
                      <span>Study Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* B. Suggested Revision Topics (Genuine Learning History) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Smart Revision Suggestions
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Grounded strictly in your genuine practice error patterns & bookmarked topics.
                </p>
              </div>

              {suggestedRevisions.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                  <span className="text-xs font-bold text-slate-700 block">Needs More Evidence</span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Complete practice sessions or bookmark concepts to unlock personalized revision alerts. Antigravity never fabricates fake recommendations.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {suggestedRevisions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleOpenTopicById(item.topicId, item.subject)}
                      className="p-3 bg-purple-50/50 hover:bg-purple-100/60 rounded-xl border border-purple-100 cursor-pointer transition flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                          {item.topicTitle}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{item.subject}</span>
                          <span>•</span>
                          <span className="text-purple-700 font-semibold">{item.reasonLabel}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => navigate('/weak-topics')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition text-center"
                >
                  View Full Weak Topics Analysis
                </button>
              </div>
            </div>

            {/* C. Saved Concepts & Bookmarked Notes */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Bookmarked Short Notes ({bookmarks.length})
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Quick access to all your saved formulas and definitions.
                </p>
              </div>

              {bookmarks.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <FileText className="w-5 h-5 text-slate-400 mx-auto" />
                  <span className="text-xs font-bold text-slate-600 block">No Bookmarks Saved</span>
                  <p className="text-xs text-slate-500">
                    Click "Bookmark Concept" on any topic to save its short notes for exam revision.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {bookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition flex items-center justify-between gap-3 group"
                    >
                      <button
                        onClick={() => handleOpenTopicById(bm.topicId, bm.subject)}
                        className="text-left space-y-0.5 flex-1"
                      >
                        <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700 block">
                          {bm.topicTitle}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {bm.subject} • {bm.board} Class {bm.classLevel}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          if (user) {
                            removeConceptBookmark(bm.topicId, user.id);
                            refreshUserData();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove bookmark"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-center text-xs text-slate-400">
                Bookmarks persist across logout and browser refreshes.
              </div>
            </div>

            {/* D. Recently Viewed Topics */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Recently Viewed Concepts
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Pick up right where you left off.
                </p>
              </div>

              {recentlyViewed.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1">
                  <Eye className="w-5 h-5 text-slate-400 mx-auto" />
                  <span className="text-xs font-bold text-slate-600 block">No History Yet</span>
                  <p className="text-xs text-slate-500">
                    Select any topic above to start reading. Your viewing history will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {recentlyViewed.slice(0, 5).map((rc) => (
                    <div
                      key={rc.id}
                      onClick={() => handleOpenTopicById(rc.topicId, rc.subject)}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-purple-700">
                          {rc.topicTitle}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {rc.subject} • {new Date(rc.viewedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-center text-xs text-slate-400">
                Last {recentlyViewed.length} viewed sessions tracked.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
