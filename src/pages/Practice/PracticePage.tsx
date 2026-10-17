import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  Award, 
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStudyTime } from '../../context/StudyTimeContext';
import { savePracticeAttempt, getStoredQueries } from '../../lib/storage';
import type { PracticeAttempt } from '../../types';

interface PracticeQuestionItem {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
}

const QUESTION_BANK: PracticeQuestionItem[] = [
  // VSEPR Theory (Weak Topic)
  {
    id: 'pq-bank-vsepr-1',
    subject: 'Chemistry',
    topic: 'VSEPR Theory & Molecular Geometry',
    question: 'According to VSEPR theory, why do lone pairs occupy equatorial positions rather than axial positions in a trigonal bipyramidal geometry (such as in SF4 or ClF3)?',
    options: [
      'Equatorial positions minimize 90° lone pair-bond pair repulsions',
      'Axial positions have higher electronegativity',
      'Equatorial positions have shorter bond lengths',
      'Axial positions cannot accommodate non-bonding orbitals'
    ],
    correctAnswer: 'Equatorial positions minimize 90° lone pair-bond pair repulsions',
    hint: 'Compare the number of 90° repulsions from an axial vs equatorial position.',
    explanation: 'In a trigonal bipyramid, an equatorial position has only two 90° interactions with axial bonds, whereas an axial position has three 90° interactions with equatorial bonds. Minimizing 90° repulsions provides maximum stability.',
    difficulty: 'Medium'
  },
  {
    id: 'pq-bank-vsepr-2',
    subject: 'Chemistry',
    topic: 'VSEPR Theory & Molecular Geometry',
    question: 'What is the molecular geometry of the Xenon tetrafluoride (XeF4) molecule?',
    options: [
      'Tetrahedral',
      'Square Planar',
      'See-saw',
      'Octahedral'
    ],
    correctAnswer: 'Square Planar',
    hint: 'Xe has 8 valence electrons. 4 are shared with F and 4 remain as 2 lone pairs.',
    explanation: 'XeF4 has 6 electron pairs (4 bonding, 2 lone pairs), giving an octahedral electron geometry. The two lone pairs position trans (180°) to each other, resulting in a square planar molecular shape.',
    difficulty: 'Challenging'
  },
  // Newton's Second Law
  {
    id: 'pq-bank-newton-1',
    subject: 'Physics',
    topic: "Newton's Second Law & Momentum",
    question: 'A mass of 3 kg undergoes an acceleration of 4 m/s² under the action of a constant net force. If the same force acts on a mass of 6 kg, what will be the acceleration?',
    options: [
      '2 m/s²',
      '8 m/s²',
      '1 m/s²',
      '4 m/s²'
    ],
    correctAnswer: '2 m/s²',
    hint: 'F = m · a. If m is doubled, what happens to a?',
    explanation: 'The force is F = 3 kg × 4 m/s² = 12 N. When applied to 6 kg: a = F / m = 12 N / 6 kg = 2 m/s².',
    difficulty: 'Easy'
  },
  {
    id: 'pq-bank-newton-2',
    subject: 'Physics',
    topic: "Newton's Second Law & Momentum",
    question: 'A ball of mass 0.5 kg moving at 20 m/s is caught and brought to rest in 0.1 seconds. What average force was exerted by the hands on the ball?',
    options: [
      '100 N',
      '50 N',
      '200 N',
      '10 N'
    ],
    correctAnswer: '100 N',
    hint: 'Impulse J = Δp = F_avg · Δt.',
    explanation: 'Initial momentum p_i = 0.5 × 20 = 10 kg·m/s. Final momentum p_f = 0. Impulse Δp = -10 N·s. Average Force = |Δp / Δt| = 10 / 0.1 = 100 N.',
    difficulty: 'Medium'
  },
  // Limits & Derivatives
  {
    id: 'pq-bank-calc-1',
    subject: 'Mathematics',
    topic: 'Limits & Derivatives',
    question: 'What is the limit of (tan x) / x as x approaches 0?',
    options: [
      '1',
      '0',
      'Undefined',
      'Infinity'
    ],
    correctAnswer: '1',
    hint: 'Express tan x as (sin x) / (cos x) and use standard limits.',
    explanation: 'lim (tan x)/x = lim (sin x / x) · (1 / cos x) = 1 · 1 = 1.',
    difficulty: 'Easy'
  },
  {
    id: 'pq-bank-calc-2',
    subject: 'Mathematics',
    topic: 'Limits & Derivatives',
    question: 'If y = x² · sin(x), what is dy/dx by the product rule?',
    options: [
      '2x·sin(x) + x²·cos(x)',
      '2x·cos(x)',
      'x²·cos(x) - 2x·sin(x)',
      '2x·sin(x) - x²·cos(x)'
    ],
    correctAnswer: '2x·sin(x) + x²·cos(x)',
    hint: 'd/dx [u · v] = u\' · v + u · v\'.',
    explanation: 'Let u = x² => u\' = 2x, and v = sin x => v\' = cos x. Then dy/dx = (2x)(sin x) + (x²)(cos x).',
    difficulty: 'Medium'
  }
];

export const PracticePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, educationProfile } = useAuth();
  const { recordLearningActivity } = useStudyTime();

  const queryTopic = searchParams.get('topic');

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>(queryTopic || 'All');

  // Load dynamic questions from student's queries
  const storedQueries = getStoredQueries(user?.id);
  const dynamicQuestions: PracticeQuestionItem[] = [];
  storedQueries.forEach(q => {
    if (q.solution?.practiceQuestions && Array.isArray(q.solution.practiceQuestions)) {
      q.solution.practiceQuestions.forEach((pq, idx) => {
        if (pq.question && pq.correctAnswer) {
          const opts = (pq.options && pq.options.length >= 2) 
            ? pq.options 
            : [pq.correctAnswer, 'Alternative formulation A', 'Alternative formulation B', 'None of the above'];
          dynamicQuestions.push({
            id: `dyn-${q.id}-${idx}`,
            subject: q.subject || 'General Science',
            topic: q.topic || 'General Concepts',
            question: pq.question,
            options: opts,
            correctAnswer: pq.correctAnswer,
            hint: 'Review key principles from your doubt analysis.',
            explanation: pq.explanation || 'Verified from concept trace solution.',
            difficulty: pq.difficulty || 'Medium'
          });
        }
      });
    }
  });

  const fullQuestionBank = [...QUESTION_BANK, ...dynamicQuestions];

  // Filter questions
  const activeQuestions = fullQuestionBank.filter(q => {
    const matchSubj = selectedSubject === 'All' || q.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchTop = selectedTopic === 'All' || q.topic.toLowerCase().includes(selectedTopic.toLowerCase()) || selectedTopic.toLowerCase().includes(q.topic.toLowerCase());
    return matchSubj && matchTop;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionStartTime] = useState(Date.now());

  const currentQ = activeQuestions[currentIndex] || fullQuestionBank[0];

  useEffect(() => {
    if (queryTopic) {
      setSelectedTopic(queryTopic);
    }
  }, [queryTopic]);

  const handleSelectOption = (opt: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(opt);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isAnswerSubmitted || !currentQ) return;
    setIsAnswerSubmitted(true);
    recordLearningActivity('Practice Question Answered');

    const isCorrect = selectedOption === currentQ.correctAnswer;
    if (isCorrect) {
      setSessionScore(prev => prev + 1);
    }

    // Save attempt to database/storage with real timestamp
    const attempt: PracticeAttempt = {
      id: `att-live-${Date.now()}-${currentQ.id}`,
      userId: user?.id || 'usr_anonymous',
      sessionId: `sess-${sessionStartTime}`,
      questionId: currentQ.id,
      questionText: currentQ.question,
      submittedAnswer: selectedOption,
      correctAnswer: currentQ.correctAnswer,
      isCorrect,
      subject: currentQ.subject,
      topic: currentQ.topic,
      timeSpentSeconds: 30,
      attemptedAt: new Date().toISOString()
    };
    savePracticeAttempt(attempt);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setShowHint(false);
    } else {
      // Completed session
      setSessionCompleted(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const handleRetrySession = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setShowHint(false);
    setSessionCompleted(false);
    setSessionScore(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Targeted Practice Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Personalized Concept Practice
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Answer questions, read instant step-by-step explanations, and eliminate concept gaps.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/weak-topics')}
          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Check Weak Topics</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Selector */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                handleRetrySession();
              }}
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Topic:</span>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                handleRetrySession();
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl max-w-xs truncate"
            >
              <option value="All">All Topics ({QUESTION_BANK.length} Questions)</option>
              <option value="VSEPR Theory & Molecular Geometry">VSEPR Theory (Chemistry)</option>
              <option value="Newton's Second Law & Momentum">Newton's 2nd Law (Physics)</option>
              <option value="Limits & Derivatives">Limits & Derivatives (Mathematics)</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="font-bold text-indigo-600">{activeQuestions.length}</span> verified question{activeQuestions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {sessionCompleted ? (
        /* Completion Celebration Card */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Practice Session Complete! 🎉</h2>
            <p className="text-xs text-slate-500">
              Your attempts have been registered and your weak topic analytics have been updated.
            </p>
          </div>

          <div className="py-4 px-6 rounded-2xl bg-indigo-50/60 max-w-md mx-auto flex items-center justify-around border border-indigo-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
              <div className="text-2xl font-black text-indigo-900">
                {sessionScore} / {activeQuestions.length}
              </div>
            </div>
            <div className="h-8 w-px bg-indigo-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Accuracy</span>
              <div className="text-2xl font-black text-emerald-600">
                {activeQuestions.length > 0 ? Math.round((sessionScore / activeQuestions.length) * 100) : 0}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={handleRetrySession}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Session</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/progress')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
            >
              <span>View Updated Progress</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : activeQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No practice questions for this filter</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try selecting "All Subjects" or "All Topics", or ask an AI doubt to automatically generate tailored questions for your syllabus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedSubject('All'); setSelectedTopic('All'); }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Active Question Card */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          
          {/* Question Header & Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                {currentQ.subject} • {currentQ.topic}
              </span>
              <span className="font-semibold text-slate-400">
                Question {currentIndex + 1} of {activeQuestions.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Statement */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Question Statement
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                {currentQ.difficulty}
              </span>
            </div>
            <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-relaxed">
              {currentQ.question}
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrectAnswer = isAnswerSubmitted && opt === currentQ.correctAnswer;
              const isWrongSelection = isAnswerSubmitted && isSelected && !isCorrectAnswer;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswerSubmitted}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full p-4 rounded-2xl text-left text-xs sm:text-sm font-semibold border transition flex items-center justify-between ${
                    isCorrectAnswer
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300'
                      : isWrongSelection
                      ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-300'
                      : isSelected
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-2 ring-indigo-300'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isCorrectAnswer && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {isWrongSelection && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Hint Drawer */}
          {showHint && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Helpful Hint: </span>
                {currentQ.hint}
              </div>
            </div>
          )}

          {/* Feedback & Explanation after submission */}
          {isAnswerSubmitted && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
              selectedOption === currentQ.correctAnswer
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {selectedOption === currentQ.correctAnswer ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Correct! Concept verified.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Incorrect. Review why this mistake occurs:</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed text-slate-700">
                <span className="font-bold">Step Explanation: </span>
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            {!isAnswerSubmitted ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowHint(h => !h)}
                  className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedOption}
                  onClick={handleSubmitAnswer}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition disabled:opacity-40"
                >
                  Submit Answer
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Attempt recorded to personal analytics
                </span>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
                >
                  <span>{currentIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Session Results'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
