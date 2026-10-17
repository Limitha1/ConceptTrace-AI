import React, { useState, useMemo } from 'react';
import { 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  Languages, 
  CheckCircle2, 
  Save, 
  Camera, 
  Shield, 
  Clock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { EducationBoard, ClassLevel, PreferredLanguage, StudentStream } from '../../types';
import { 
  STREAM_OPTIONS, 
  CURRICULUM_TYPES, 
  getAvailableSubjects, 
  validateEducationSelections 
} from '../../lib/syllabusData';
import { EducationBoardSelector } from '../../components/common/EducationBoardSelector';
import { 
  determineCurrentAcademicYear, 
  formatAcademicYearDisplay 
} from '../../lib/academicCalendar';

export const MyProfile: React.FC = () => {
  const { user, educationProfile, updateProfile, updateEducationProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || 'Student');
  const [board, setBoard] = useState<EducationBoard>(educationProfile?.board || 'CBSE');
  const [classLevel, setClassLevel] = useState<ClassLevel>(educationProfile?.classLevel || '11');
  const [stream, setStream] = useState<StudentStream>(
    educationProfile?.classLevel === '10' 
      ? 'General' 
      : (educationProfile?.stream || 'Science')
  );
  const [curriculumType, setCurriculumType] = useState<string>(
    educationProfile?.curriculumType || 'NCERT / National Curriculum Framework (NCF)'
  );
  // Automatically determine the academic year based on system date and board's academic calendar
  const academicYear = useMemo(() => {
    return determineCurrentAcademicYear(board);
  }, [board]);
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>(educationProfile?.preferredLanguage || 'English');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    educationProfile?.subjects || ['Physics', 'Mathematics', 'Chemistry']
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.avatarUrl && !user.avatarUrl.includes('student_avatar') ? user.avatarUrl : '/assets/robot_avatar.jpg'
  );

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const availableSubjectsList = getAvailableSubjects(board, classLevel, stream);

  const handleClassChange = (newClass: ClassLevel) => {
    setClassLevel(newClass);
    if (newClass === '10') {
      setStream('General');
      setSelectedSubjects(['Mathematics', 'Science', 'Social Science', 'English Language & Literature']);
    } else {
      const activeStream = stream === 'General' ? 'Science' : stream;
      setStream(activeStream);
      const defaults = STREAM_OPTIONS.find(s => s.id === activeStream)?.defaultSubjects || ['Physics', 'Chemistry', 'Mathematics'];
      setSelectedSubjects(defaults);
    }
  };

  const handleStreamChange = (newStream: StudentStream) => {
    setStream(newStream);
    const defaults = STREAM_OPTIONS.find(s => s.id === newStream)?.defaultSubjects || ['Physics', 'Chemistry', 'Mathematics'];
    setSelectedSubjects(defaults);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (PNG/JPG/WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSubject = (subj: string) => {
    if (!isEditing) return;
    if (selectedSubjects.includes(subj)) {
      if (selectedSubjects.length === 1) return;
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    const validation = validateEducationSelections(board, classLevel, stream, selectedSubjects);
    if (!validation.isValid) {
      setError(validation.messages[0]?.text || 'Invalid education selections.');
      return;
    }

    updateProfile({
      fullName,
      avatarUrl
    });

    updateEducationProfile({
      board,
      classLevel,
      stream,
      curriculumType,
      academicYear,
      preferredLanguage,
      subjects: selectedSubjects,
      updatedAt: new Date().toISOString()
    });

    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal details, academic curriculum, and learning preferences
          </p>
        </div>
        
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile changes saved successfully to your persistent account.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          {error}
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        
        {/* Avatar & Header Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-100">
          <div className="relative group">
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-24 h-24 rounded-3xl object-cover ring-4 ring-indigo-50 shadow-md"
            />
            {isEditing && (
              <label className="absolute inset-0 bg-black/40 rounded-3xl flex flex-col items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold">Change</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{fullName}</h2>
              <span className="inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 w-fit mx-auto sm:mx-0">
                Verified Student
              </span>
            </div>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                Class {classLevel} • {board}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                AY {formatAcademicYearDisplay(academicYear, board)}
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-400 space-y-1 hidden sm:block">
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="w-3.5 h-3.5" />
              <span>Joined: {new Date(user?.createdAt || '2026-08-15').toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end text-emerald-600 font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>RLS Protected Record</span>
            </div>
          </div>
        </div>

        {/* Form Details */}
        <form onSubmit={handleSaveChanges} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || 'student@example.com'}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-100/70 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <EducationBoardSelector
                disabled={!isEditing}
                label="Education Board"
                value={board}
                onChange={(selectedBoardValue, boardOption) => {
                  setBoard(selectedBoardValue);
                  if (boardOption.curriculumTypeDescription) {
                    setCurriculumType(boardOption.curriculumTypeDescription);
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Class Level
                </label>
                <select
                  disabled={!isEditing}
                  value={classLevel}
                  onChange={(e) => handleClassChange(e.target.value as ClassLevel)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Academic Year
                </label>
                <div className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-100/90 border border-slate-200 rounded-xl text-slate-700 flex items-center justify-between">
                  <span>{formatAcademicYearDisplay(academicYear, board)}</span>
                  <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-200/50 px-1.5 py-0.5 rounded">
                    Auto-Assigned
                  </span>
                </div>
              </div>
            </div>

            {/* Stream Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Academic Stream
              </label>
              {classLevel === '10' ? (
                <div className="py-2 px-3 bg-slate-100 rounded-xl text-slate-600 text-xs font-medium">
                  General Foundation Curriculum (Classes 11–12 have Science, Commerce, Arts)
                </div>
              ) : (
                <select
                  disabled={!isEditing}
                  value={stream}
                  onChange={(e) => handleStreamChange(e.target.value as StudentStream)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="Science">Science (PCM / PCB / PCMB)</option>
                  <option value="Commerce">Commerce & Business</option>
                  <option value="Humanities/Arts">Humanities / Social Sciences</option>
                </select>
              )}
            </div>

            {/* Curriculum Framework */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Curriculum Framework / Syllabus Type
              </label>
              <select
                disabled={!isEditing}
                value={curriculumType}
                onChange={(e) => setCurriculumType(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {CURRICULUM_TYPES.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Preferred Explanation Language
            </label>
            <div className="relative max-w-sm">
              <Languages className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                disabled={!isEditing}
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as PreferredLanguage)}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <option value="English">English</option>
                <option value="Kannada">Kannada</option>
                <option value="Hindi">Hindi</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700">
                Enrolled Subjects
              </label>
              <button
                type="button"
                onClick={() => navigate('/syllabus')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>View Full Syllabus Chapters</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSubjectsList.map((subjObj) => {
                const isSelected = selectedSubjects.includes(subjObj.subject);
                return (
                  <button
                    key={subjObj.subject}
                    type="button"
                    disabled={!isEditing}
                    onClick={() => toggleSubject(subjObj.subject)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                        : isEditing 
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{subjObj.subject}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
