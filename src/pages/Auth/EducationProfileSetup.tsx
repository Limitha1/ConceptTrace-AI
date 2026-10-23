import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Languages, 
  Upload, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  AlertCircle,
  Compass,
  Info,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { 
  EducationBoard, 
  ClassLevel, 
  PreferredLanguage, 
  StudentStream 
} from '../../types';
import { 
  STREAM_OPTIONS, 
  getAvailableSubjects, 
  validateEducationSelections 
} from '../../lib/syllabusData';
import { EducationBoardSelector } from '../../components/common/EducationBoardSelector';
import { 
  determineCurrentAcademicYear, 
  formatAcademicYearDisplay, 
  getAcademicCalendarRule 
} from '../../lib/academicCalendar';
import { 
  determineCurriculumType, 
  getBoardLanguageProfile, 
  getDefaultSubjectsForBoard 
} from '../../lib/boardLanguages';

export const EducationProfileSetup: React.FC = () => {
  const { educationProfile, updateEducationProfile } = useAuth();
  const navigate = useNavigate();

  const [board, setBoard] = useState<EducationBoard>(educationProfile?.board || 'CBSE');
  const [classLevel, setClassLevel] = useState<ClassLevel>(educationProfile?.classLevel || '11');
  const [stream, setStream] = useState<StudentStream>(
    educationProfile?.classLevel === '10' 
      ? 'General' 
      : (educationProfile?.stream || 'Science')
  );

  // Automatically determine curriculum framework based on the selected education board
  const curriculumType = useMemo(() => {
    return determineCurriculumType(board);
  }, [board]);

  // Automatically determine the academic year based on system date and board academic calendar
  const academicYear = useMemo(() => {
    return determineCurrentAcademicYear(board);
  }, [board]);
  const calendarRule = useMemo(() => {
    return getAcademicCalendarRule(board);
  }, [board]);

  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(educationProfile?.preferredLanguage || 'English');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    educationProfile?.subjects && educationProfile.subjects.length > 0
      ? educationProfile.subjects
      : getDefaultSubjectsForBoard(educationProfile?.board || 'CBSE', educationProfile?.classLevel || '11', educationProfile?.stream || 'Science')
  );
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Elective subject inline addition state
  const [showAddElective, setShowAddElective] = useState(false);
  const [electiveInput, setElectiveInput] = useState('');

  // Notification when user changes board to review subjects
  const [boardReviewNotice, setBoardReviewNotice] = useState<string | null>(null);

  const availableClasses: ClassLevel[] = ['10', '11', '12'];

  const availableLanguages: PreferredLanguage[] = [
    'English',
    'Kannada',
    'Hindi',
    'Tamil',
    'Telugu',
    'Malayalam',
    'Other'
  ];

  // Dynamic available subjects based on current board, class, and stream
  const availableSubjectOptions = useMemo(() => {
    return getAvailableSubjects(board, classLevel, stream);
  }, [board, classLevel, stream]);

  // When board changes, check for subject compatibility and notify student without silent deletion
  const handleBoardChange = (newBoard: EducationBoard) => {
    setBoard(newBoard);
    const newAvailable = getAvailableSubjects(newBoard, classLevel, stream);
    const newSubjectNames = newAvailable.map(s => s.subject.toLowerCase());
    const incompatible = selectedSubjects.filter(
      s => !newSubjectNames.some(avail => avail.includes(s.toLowerCase()) || s.toLowerCase().includes(avail))
    );

    const newLangProf = getBoardLanguageProfile(newBoard);
    const primaryLang = newLangProf.primaryLanguages[0];

    if (incompatible.length > 0) {
      setBoardReviewNotice(
        `You previously selected: ${incompatible.join(', ')}. Please review your enrolled subjects for ${newBoard}${primaryLang ? ` (e.g., consider selecting ${primaryLang})` : ''}.`
      );
    } else {
      setBoardReviewNotice(null);
    }
  };

  // When class changes, adjust stream and default subjects
  const handleClassChange = (newClass: ClassLevel) => {
    setClassLevel(newClass);
    if (newClass === '10') {
      setStream('General');
      setSelectedSubjects(getDefaultSubjectsForBoard(board, '10', 'General'));
    } else {
      const newStream = stream === 'General' ? 'Science' : stream;
      setStream(newStream);
      setSelectedSubjects(getDefaultSubjectsForBoard(board, newClass, newStream));
    }
    setBoardReviewNotice(null);
  };

  // When stream changes for Class 11/12
  const handleStreamChange = (newStream: StudentStream) => {
    setStream(newStream);
    setSelectedSubjects(getDefaultSubjectsForBoard(board, classLevel, newStream));
    setBoardReviewNotice(null);
  };

  // Add custom elective subject
  const handleAddElective = () => {
    const trimmed = electiveInput.trim();
    if (!trimmed) return;
    if (selectedSubjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already selected.`);
      return;
    }
    setSelectedSubjects(prev => [...prev, trimmed]);
    setElectiveInput('');
    setShowAddElective(false);
    setError(null);
  };

  // Remove custom elective subject
  const handleRemoveCustomSubject = (subj: string) => {
    if (selectedSubjects.length === 1) {
      setError('Please keep at least one subject selected.');
      return;
    }
    setSelectedSubjects(prev => prev.filter(s => s !== subj));
    setError(null);
  };

  // Validate current selections
  const validationResult = validateEducationSelections(board, classLevel, stream, selectedSubjects);

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      if (selectedSubjects.length === 1) {
        setError('Please keep at least one subject selected.');
        return;
      }
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
      setError(null);
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
      setError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setError('Please upload a PDF file for your syllabus.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError('Syllabus PDF file size must be under 15MB.');
        return;
      }
      setError(null);
      setSyllabusFile(file);
    }
  };

  const handleSaveAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubjects.length === 0) {
      setError('Please select at least one subject.');
      return;
    }
    setIsSubmitting(true);

    updateEducationProfile({
      board,
      classLevel,
      stream,
      curriculumType,
      academicYear,
      preferredLanguage,
      subjects: selectedSubjects,
      syllabusFileName: syllabusFile ? syllabusFile.name : (educationProfile?.syllabusFileName || 'Standard_Curriculum_Syllabus.pdf'),
      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    });

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/syllabus');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-sky-50/60 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-200/80 p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3.5">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Complete Your Academic Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            ConceptTrace AI dynamically matches your board syllabus, chapters, and mistake analysis to your exact curriculum.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dynamic Validation Notices */}
        {validationResult.messages.length > 0 && (
          <div className="mb-6 space-y-2">
            {validationResult.messages.map((msg, i) => (
              <div 
                key={i}
                className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 border ${
                  msg.type === 'error'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : msg.type === 'warning'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-indigo-50/70 text-indigo-800 border-indigo-100'
                }`}
              >
                <Info className="w-4 h-4 shrink-0" />
                <span>{msg.text}</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSaveAndContinue} className="space-y-6">
          
          {/* 1. Education Board (Searchable Dropdown for All 28 States, 8 UTs & National Boards) */}
          <EducationBoardSelector
            value={board}
            onChange={(selectedBoardValue) => {
              handleBoardChange(selectedBoardValue as EducationBoard);
            }}
          />

          {/* 2. Class Level & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                2. Class Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableClasses.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => handleClassChange(cls)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-center transition ${
                      classLevel === cls
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Academic Year
                </label>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                  Auto-Assigned
                </span>
              </div>
              <div className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>{formatAcademicYearDisplay(academicYear, board)}</span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {calendarRule.description}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Stream Selection (Classes 11 & 12 only) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Academic Stream
              </label>
              {classLevel === '10' && (
                <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                  General Core Curriculum
                </span>
              )}
            </div>

            {classLevel === '10' ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  In Class 10, all students follow a foundational common curriculum. Stream specialization (Science, Commerce, Humanities) opens in Class 11.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {STREAM_OPTIONS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStreamChange(st.id)}
                    className={`p-3 rounded-2xl text-left border transition ${
                      stream === st.id
                        ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{st.name}</span>
                      {stream === st.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {st.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Enrolled Subjects (Board-Specific Regional Languages & Core Curriculum) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Enrolled Subjects
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedSubjects.length} selected • Filtered for Class {classLevel} {classLevel !== '10' ? `(${stream})` : ''}
              </span>
            </div>

            {/* Board change compatibility review notice */}
            {boardReviewNotice && (
              <div className="mb-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold">Review Subjects for {board}:</span>
                  <p className="mt-0.5 text-amber-700 leading-relaxed">
                    {boardReviewNotice}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBoardReviewNotice(null)}
                  className="text-amber-500 hover:text-amber-700 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {availableSubjectOptions.map((subjObj) => {
                const isSelected = selectedSubjects.includes(subjObj.subject);
                return (
                  <button
                    key={subjObj.subject}
                    type="button"
                    onClick={() => toggleSubject(subjObj.subject)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-purple-50 border-purple-300 text-purple-900 ring-1 ring-purple-400/30 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span>{subjObj.subject}</span>
                    {subjObj.isRegionalLanguage && (
                      <span className="text-[9px] uppercase font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200/60 px-1.5 py-0.5 rounded-md">
                        Regional Language
                      </span>
                    )}
                    {subjObj.isCore && !subjObj.isRegionalLanguage && !isSelected && (
                      <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-200/60 px-1 py-0.2 rounded">
                        Core
                      </span>
                    )}
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                  </button>
                );
              })}

              {/* Any additional user-added custom/elective subjects */}
              {selectedSubjects
                .filter(s => !availableSubjectOptions.some(avail => avail.subject === s))
                .map((customSubj) => (
                  <div
                    key={customSubj}
                    className="py-2 px-3.5 rounded-xl text-xs font-semibold border bg-purple-50 border-purple-300 text-purple-900 ring-1 ring-purple-400/30 flex items-center gap-2 shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>{customSubj}</span>
                    <span className="text-[9px] uppercase font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                      Elective
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomSubject(customSubj)}
                      className="text-purple-400 hover:text-rose-600 font-bold ml-0.5"
                      title="Remove subject"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>

            {/* Add Elective / Other Supported Subject */}
            <div className="mt-3">
              {showAddElective ? (
                <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={electiveInput}
                    onChange={(e) => setElectiveInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddElective();
                      }
                    }}
                    placeholder="Enter subject or language (e.g. Sanskrit, French, Psychology)..."
                    className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddElective}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Add Subject
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddElective(false); setElectiveInput(''); }}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddElective(true)}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold border border-dashed border-slate-300 text-slate-600 hover:border-purple-400 hover:text-purple-700 hover:bg-purple-50/50 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Elective / Other Subject</span>
                </button>
              )}
            </div>
          </div>

          {/* 5. Preferred Explanation Language */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              6. Preferred Explanation Language
            </label>
            <div className="relative">
              <Languages className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as PreferredLanguage)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              AI step-by-step doubt explanations and syllabus summaries will be presented in this language.
            </p>
          </div>

          {/* 6. Optional Syllabus PDF Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              7. Optional Syllabus Document / PDF Upload
            </label>
            <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-indigo-50/30">
              <Upload className="w-6 h-6 text-indigo-500 mb-2" />
              <span className="text-xs font-bold text-slate-700">
                {syllabusFile ? syllabusFile.name : 'Upload customized or school-specific syllabus PDF'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {syllabusFile ? `${(syllabusFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to link` : 'PDF up to 15MB. Official board syllabi are already built-in and verified!'}
              </span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {syllabusFile && (
              <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
                <span className="flex items-center gap-1.5 text-indigo-900 font-medium">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  {syllabusFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSyllabusFile(null)}
                  className="text-slate-400 hover:text-rose-600 font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !validationResult.isValid}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Profile & Fetching Syllabus...' : 'Save Profile & View My Syllabus'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
