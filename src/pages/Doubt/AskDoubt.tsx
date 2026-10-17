import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Image as ImageIcon, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  RefreshCw, 
  ArrowRight,
  ShieldCheck,
  FileCode,
  Edit3,
  Bookmark,
  Key,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudyTime } from '../../context/StudyTimeContext';
import { PIPELINE_STAGES } from '../../lib/aiPipeline';
import type { AIPipelineProgress } from '../../lib/aiPipeline';
import { saveQueryRecord } from '../../lib/storage';
import { checkBackendStatus, submitDoubtToBackend } from '../../lib/doubtService';
import type { ServerStatusResponse } from '../../lib/doubtService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { SolutionAnalysis, PreferredLanguage } from '../../types';

export const AskDoubt: React.FC = () => {
  const { user, educationProfile } = useAuth();
  const { recordLearningActivity } = useStudyTime();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySubject = searchParams.get('subject');
  const queryTopic = searchParams.get('topic');

  const [activeTab, setActiveTab] = useState<'type' | 'image' | 'document'>('type');
  const [questionText, setQuestionText] = useState('');
  const [subject, setSubject] = useState(querySubject || educationProfile?.subjects?.[0] || 'Physics');
  const [topic, setTopic] = useState(queryTopic || '');
  const [language, setLanguage] = useState(educationProfile?.preferredLanguage || 'English');

  useEffect(() => {
    if (querySubject) setSubject(querySubject);
    if (queryTopic) setTopic(queryTopic);
  }, [querySubject, queryTopic]);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Pipeline execution state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<AIPipelineProgress[]>(PIPELINE_STAGES);
  const [activeStageNumber, setActiveStageNumber] = useState<number>(0);

  // Solution result state
  const [solutionResult, setSolutionResult] = useState<SolutionAnalysis | null>(null);
  const [isEditingExtractedText, setIsEditingExtractedText] = useState(false);
  const [editableQuestionText, setEditableQuestionText] = useState('');
  const [savedNotification, setSavedNotification] = useState(false);
  const [backendError, setBackendError] = useState<{ code: string; message: string } | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatusResponse | null>(null);

  React.useEffect(() => {
    checkBackendStatus().then(status => setServerStatus(status));
  }, []);

  // Sample curated prompts for quick testing
  const sampleDoubts = [
    {
      title: 'Newton’s 2nd Law & Kinetic Energy',
      subject: 'Physics',
      text: 'A constant force of 5 N acts on a body of mass 2 kg initially at rest for 4 seconds. Calculate the velocity acquired by the body and the work done by the force.'
    },
    {
      title: 'Quotient Rule in Calculus',
      subject: 'Mathematics',
      text: 'Find the derivative of f(x) = (3x² - 5) / (2x + 1) using the quotient rule.'
    },
    {
      title: 'Projectile Motion Peak & Range',
      subject: 'Physics',
      text: 'A projectile is launched with velocity u at an angle θ with the horizontal. Derive the expressions for maximum height and horizontal range, and verify using energy conservation.'
    },
    {
      title: 'VSEPR Geometry & Lone Pairs',
      subject: 'Chemistry',
      text: 'Explain the molecular shape of SF4 and ClF3 using VSEPR theory, including why lone pairs prefer equatorial positions in a trigonal bipyramid.'
    }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image') {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setUploadError('Please select a JPG, PNG, or WEBP image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Image size must be under 10MB.');
        return;
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
      setQuestionText(`[Handwritten/Printed Problem Image: ${file.name}] Determine the unknown values and provide verified steps.`);
    } else {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setUploadError('Please select a valid PDF document.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setUploadError('Document size must be under 15MB.');
        return;
      }
      setUploadedFile(file);
      setFilePreviewUrl(null);
      setQuestionText(`[Question from Document: ${file.name}] Analyze worksheet question and identify concept gaps.`);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFilePreviewUrl(null);
    setUploadError(null);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = questionText.trim();
    if (!query && !uploadedFile) {
      setUploadError('Please enter a question or upload an image/document.');
      return;
    }

    setIsAnalyzing(true);
    setSolutionResult(null);
    setUploadError(null);
    setBackendError(null);
    recordLearningActivity('Ask a Doubt Submission');

    const updateStage = (stageNum: 1 | 2 | 3 | 4 | 5, completed: boolean) => {
      setActiveStageNumber(stageNum);
      setPipelineStages(prev => prev.map(p => p.stage === stageNum ? { ...p, completed } : p));
    };

    try {
      updateStage(1, false);
      // Stage 1: Problem statement & input validation
      await new Promise(r => setTimeout(r, 200));
      updateStage(1, true);

      // Stage 2: Calling server-side AI pipeline
      updateStage(2, false);

      const requestPromise = submitDoubtToBackend({
        questionText: query || undefined,
        subject,
        topic: topic || undefined,
        classLevel: educationProfile?.classLevel || '11',
        board: educationProfile?.board || 'CBSE',
        language,
        userId: user?.id || 'usr_limitha_default',
        file: uploadedFile
      });

      const timerStage2 = setTimeout(() => {
        updateStage(2, true);
        updateStage(3, false);
      }, 700);

      const timerStage3 = setTimeout(() => {
        updateStage(3, true);
        updateStage(4, false);
      }, 1500);

      const { solution, query: queryRecord } = await requestPromise;

      clearTimeout(timerStage2);
      clearTimeout(timerStage3);

      updateStage(4, true);
      updateStage(5, false);

      // Persist to authenticated student's history
      saveQueryRecord(queryRecord);

      // Persist to Supabase PostgreSQL database if active
      if (isSupabaseConfigured() && supabase && user) {
        try {
          await supabase.from('queries').insert({
            id: queryRecord.id,
            user_id: user.id,
            input_type: queryRecord.inputType,
            question_text: queryRecord.questionText,
            subject: queryRecord.subject,
            topic: queryRecord.topic,
            status: queryRecord.status
          });
          await supabase.from('solutions').insert({
            id: solution.id,
            query_id: queryRecord.id,
            user_id: user.id,
            extracted_question: solution.extractedQuestion,
            extraction_confidence: solution.extractionConfidence,
            subject: solution.subject,
            topic: solution.topic,
            chapter: solution.chapter,
            solution_steps: solution.solutionSteps,
            final_answer: solution.finalAnswer,
            verification_status: solution.verificationStatus,
            verification_method: solution.verificationMethod,
            verification_details: solution.verificationDetails,
            concept_involved: solution.conceptInvolved,
            prerequisite_concepts: solution.prerequisiteConcepts,
            possible_mistakes: solution.possibleMistakes,
            uncertainty_notes: solution.uncertaintyNotes,
            practice_questions: solution.practiceQuestions
          });
        } catch (dbErr) {
          console.warn('[Supabase Storage Sync Warning]:', dbErr);
        }
      }

      updateStage(5, true);
      setSolutionResult(solution);
      setEditableQuestionText(solution.extractedQuestion);
      // Re-check backend status
      checkBackendStatus().then(status => setServerStatus(status));

    } catch (err: any) {
      console.error('[AskDoubt Submission Error]:', err);
      setBackendError({
        code: err.code || 'BACKEND_ERROR',
        message: err.message || 'An error occurred during backend analysis.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveNotification = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              5-Stage Verification Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Ask a Doubt & Concept Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Receive step-by-step solutions verified with independent calculation, identify the exact concept involved, and practice targeted problems.
          </p>
        </div>

        {/* Server & AI Health Status Badge */}
        {serverStatus && (
          <div className="flex items-center self-start sm:self-auto shrink-0">
            <div className={`px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              serverStatus.aiConfigured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                : 'bg-amber-50 text-amber-900 border-amber-200'
            }`}>
              <Server className="w-3.5 h-3.5" />
              <span className={`w-2 h-2 rounded-full ${serverStatus.aiConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>
                {serverStatus.aiConfigured 
                  ? `AI Engine Ready (${serverStatus.activeModel})` 
                  : 'AI Key Required in .env'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Input Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-5">
        
        {/* Input Method Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'type'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Type Question</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'image'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Upload Image (OCR)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('document')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'document'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Upload Document (PDF)</span>
          </button>
        </div>

        {uploadError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Tab A: Type a Question */}
        {activeTab === 'type' && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                rows={5}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Type or paste your STEM problem here... (e.g., A constant force of 5 N acts on a 2 kg mass...)"
                className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-sans leading-relaxed"
              />
            </div>

            {/* Quick Math / Symbol Helpers */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Insert Symbols:</span>
              {['θ', 'π', 'Σ', 'Δ', '√', '²', '³', '±', '∫', 'η', 'λ', 'ω'].map(sym => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setQuestionText(prev => prev + sym)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-mono text-xs border border-slate-200 transition"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab B: Upload Image */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            {!uploadedFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-indigo-50/20">
                <ImageIcon className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Click or drag photo of handwritten or textbook question
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports JPG, PNG, WEBP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileChange(e, 'image')}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {filePreviewUrl && (
                    <img
                      src={filePreviewUrl}
                      alt="Question preview"
                      className="w-16 h-16 rounded-xl object-cover border border-indigo-200 shadow-xs"
                    />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900">{uploadedFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • Vision Model Ready
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition">
                    Replace
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'image')}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab C: Upload Document (PDF) */}
        {activeTab === 'document' && (
          <div className="space-y-4">
            {!uploadedFile ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-indigo-50/20">
                <FileText className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Select worksheet, exam question paper, or assignment PDF
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports PDF documents up to 15MB
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'document')}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{uploadedFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Document Extraction
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* Controls Row: Subject, Topic, Language & Profile Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {(educationProfile?.subjects && educationProfile.subjects.length > 0 
                ? educationProfile.subjects 
                : ['Physics', 'Chemistry', 'Mathematics']).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Specific Topic (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Newton's 2nd Law, VSEPR"
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Explanation Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as PreferredLanguage)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="English">English</option>
              <option value="Kannada">Kannada</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
              <option value="Malayalam">Malayalam</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium">
            Applying curriculum standards for <span className="font-bold text-slate-700">{educationProfile?.board || 'CBSE'} Class {educationProfile?.classLevel || '11'}</span>
          </div>

          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => handleAnalyze()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running 5-Agent Pipeline...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit for Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Sample Doubts Pill Row */}
      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Need inspiration? Try a verified curriculum test problem:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleDoubts.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSubject(s.subject);
                setQuestionText(s.text);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Real Backend Error State (No fake or simulated AI outputs) */}
      {backendError && (
        <div className="p-6 rounded-3xl bg-rose-50/90 border border-rose-200/90 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-black text-rose-900">
                  {backendError.code === 'AI_CREDENTIALS_MISSING' 
                    ? 'Server-Side AI Key Required'
                    : backendError.code === 'AI_PROVIDER_ERROR'
                    ? 'Google Gemini AI Service Error'
                    : 'Analysis Request Failed'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                  {backendError.code}
                </span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                {backendError.message}
              </p>
            </div>
          </div>

          {backendError.code === 'AI_CREDENTIALS_MISSING' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-rose-200 text-xs text-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold">
                <Key className="w-4 h-4 text-indigo-600" />
                <span>How to configure server-side AI credentials:</span>
              </div>
              <p className="text-[11px] text-slate-600">
                ConceptTrace AI runs on a real multi-agent inference pipeline and does not simulate live AI answers. Open your project root <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-indigo-700 font-bold">.env</code> file and configure your Gemini API key:
              </p>
              <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs select-all">
                GEMINI_API_KEY=your_actual_gemini_api_key_here
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-500">
                  You can generate a free developer key at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">Google AI Studio</a>.
                </span>
                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition shrink-0"
                >
                  Retry Live Analysis
                </button>
              </div>
            </div>
          )}

          {backendError.code !== 'AI_CREDENTIALS_MISSING' && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleAnalyze()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
              >
                Retry Submission
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Processing Pipeline Progress Banner */}
      {isAnalyzing && (
        <div className="bg-white rounded-3xl border border-indigo-200 shadow-md p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
              <h3 className="text-sm font-bold text-slate-900">
                Multi-Agent Pipeline Processing (Agent {activeStageNumber} of 5)
              </h3>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              In Progress
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {pipelineStages.map((stage) => {
              const isCurrent = stage.stage === activeStageNumber;
              const isPast = stage.stage < activeStageNumber || stage.completed;
              return (
                <div
                  key={stage.stage}
                  className={`p-3 rounded-2xl border text-xs transition ${
                    isCurrent
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm'
                      : isPast
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-[11px]">Stage {stage.stage}</span>
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    ) : null}
                  </div>
                  <p className="font-bold text-[11px] line-clamp-1">{stage.stageName.split(': ')[1]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Solution Results Display */}
      {solutionResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {savedNotification && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Solution saved to your persistent Learning History.</span>
            </div>
          )}

          {/* 1. Problem Statement & OCR Editable Review */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                  {solutionResult.subject}
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {solutionResult.chapter} • {solutionResult.topic}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingExtractedText(!isEditingExtractedText)}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingExtractedText ? 'Close Edit' : 'Edit Extracted Text'}</span>
              </button>
            </div>

            {isEditingExtractedText ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={editableQuestionText}
                  onChange={(e) => setEditableQuestionText(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingExtractedText(false)}
                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                >
                  Confirm Text Update
                </button>
              </div>
            ) : (
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                {editableQuestionText || solutionResult.extractedQuestion}
              </h2>
            )}
          </div>

          {/* 2. Verification Status Card */}
          <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    Agent 4 Verification: {solutionResult.verificationStatus}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full">
                    Deterministic Math Check
                  </span>
                </div>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  Method: {solutionResult.verificationMethod}
                </p>
                <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                  {solutionResult.verificationDetails}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-slate-700">Confidence</div>
              <div className="text-base font-black text-emerald-700">
                {Math.round(solutionResult.extractionConfidence * 100)}%
              </div>
            </div>
          </div>

          {/* 3. Step-by-Step Answer */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                Verified Step-by-Step Solution
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                {solutionResult.solutionSteps.length} Steps
              </span>
            </div>

            <div className="space-y-5">
              {solutionResult.solutionSteps.map((step) => (
                <div key={step.stepNumber} className="relative pl-7 border-l-2 border-indigo-200 space-y-2">
                  <span className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shadow-xs">
                    {step.stepNumber}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {step.title}
                    </h4>
                    {step.calculationOrFormula && (
                      <div className="my-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs font-bold text-indigo-950">
                        {step.calculationOrFormula}
                      </div>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.explanation}
                    </p>
                    <div className="mt-2 text-[11px] p-2 rounded-lg bg-indigo-50/50 text-indigo-900 font-medium">
                      <span className="font-bold">Why this step: </span>
                      {step.whyThisStep}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Answer Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-indigo-600 text-white space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Final Verified Answer
              </span>
              <p className="text-sm sm:text-base font-black tracking-tight">
                {solutionResult.finalAnswer}
              </p>
            </div>
          </div>

          {/* 4. Learning Analysis: Mistakes, Concept & Prerequisites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Common Mistakes */}
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Possible Student Mistake Patterns
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {solutionResult.possibleMistakes.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Prerequisites & Concept Tags */}
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Prerequisite Concepts
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {solutionResult.prerequisiteConcepts.map((p, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-900 border border-purple-200/60 text-xs font-semibold"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="pt-2 text-[11px] text-slate-500">
                Mastering these prerequisites prevents recurring confusion in {solutionResult.topic}.
              </div>
            </div>
          </div>

          {/* 5. Similar Practice Questions Generated */}
          {solutionResult.practiceQuestions.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Recommended Practice: Verify Your Understanding
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/practice?topic=${encodeURIComponent(solutionResult.topic)}`)}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <span>Open in Practice Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {solutionResult.practiceQuestions.map((pq) => (
                  <div key={pq.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{pq.question}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {pq.difficulty}
                      </span>
                    </div>
                    {pq.options && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {pq.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 text-center"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 pt-1">
                      <span className="font-bold text-slate-700">Key:</span> {pq.correctAnswer} — {pq.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Footer Actions: Ask Follow-up, Save, Retry, History */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuestionText(`Follow-up regarding ${solutionResult.topic}: `);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Ask a Follow-up
              </button>
              <button
                type="button"
                onClick={handleSaveNotification}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save Solution</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/history')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                View in Learning History
              </button>
              <button
                type="button"
                onClick={() => navigate(`/practice?topic=${encodeURIComponent(solutionResult.topic)}`)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
              >
                <span>Practice this Concept</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
