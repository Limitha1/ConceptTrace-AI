import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  Languages, 
  Upload, 
  CheckCircle2, 
  ArrowRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { EducationBoard, ClassLevel, PreferredLanguage } from '../../types';

export const EducationProfileSetup: React.FC = () => {
  const { educationProfile, updateEducationProfile } = useAuth();
  const navigate = useNavigate();

  const [board, setBoard] = useState<EducationBoard>(educationProfile?.board || 'CBSE');
  const [classLevel, setClassLevel] = useState<ClassLevel>(educationProfile?.classLevel || '11');
  const [academicYear, setAcademicYear] = useState<string>(educationProfile?.academicYear || '2026-27');
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(educationProfile?.preferredLanguage || 'English');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    educationProfile?.subjects && educationProfile.subjects.length > 0
      ? educationProfile.subjects
      : ['Physics', 'Mathematics', 'Chemistry']
  );
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableBoards: EducationBoard[] = [
    'CBSE',
    'CISCE (ICSE/ISC)',
    'Karnataka State Board',
    'Other State/UT Board',
    'NIOS',
    'Other'
  ];

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

  const allSubjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English Core',
    'General Science'
  ];

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      if (selectedSubjects.length === 1) {
        setError('Please keep at least one subject selected.');
        return;
      }
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
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
      academicYear,
      preferredLanguage,
      subjects: selectedSubjects,
      syllabusFileName: syllabusFile ? syllabusFile.name : (educationProfile?.syllabusFileName || 'Standard_Curriculum_Syllabus.pdf'),
      isProfileComplete: true,
      updatedAt: new Date().toISOString()
    });

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-sky-50/60 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-indigo-500/5 border border-slate-200/80 p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3.5">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Complete Your Education Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            ConceptTrace AI personalizes mistake analysis and curriculum topic matching to your specific board and syllabus.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveAndContinue} className="space-y-6">
          
          {/* 1. Education Board */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              1. Education Board
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {availableBoards.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBoard(b)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-left transition flex items-center justify-between ${
                    board === b
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">{b}</span>
                  {board === b && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

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
                    onClick={() => setClassLevel(cls)}
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
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                3. Academic Year
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="2026-27">2026-27 (Current)</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2024-25">2024-25</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Subjects Multi-select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Enrolled Subjects
              </label>
              <span className="text-[11px] text-slate-400">Select all that you study</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map((subj) => {
                const isSelected = selectedSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => toggleSubject(subj)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-purple-50 border-purple-300 text-purple-900 ring-1 ring-purple-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span>{subj}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Preferred Explanation Language */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              5. Preferred Explanation Language
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
              AI step-by-step doubt explanations will be presented in this language.
            </p>
          </div>

          {/* 6. Optional Syllabus PDF Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
              6. Optional Syllabus PDF Upload
            </label>
            <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-indigo-50/30">
              <Upload className="w-6 h-6 text-indigo-500 mb-2" />
              <span className="text-xs font-bold text-slate-700">
                {syllabusFile ? syllabusFile.name : 'Click to select official syllabus PDF'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {syllabusFile ? `${(syllabusFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to link` : 'PDF up to 15MB (CBSE / ICSE / State Syllabus document)'}
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
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Profile...' : 'Save & Launch ConceptTrace AI Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
