export type EducationBoard = 
  | 'CBSE' 
  | 'CISCE (ICSE/ISC)' 
  | 'Karnataka State Board' 
  | 'Other State/UT Board' 
  | 'NIOS' 
  | 'Other';

export type Subject = 'Physics' | 'Mathematics' | 'Chemistry' | 'Biology' | string;

export type ClassLevel = '10' | '11' | '12';

export type PreferredLanguage = 
  | 'English' 
  | 'Kannada' 
  | 'Hindi' 
  | 'Tamil' 
  | 'Telugu' 
  | 'Malayalam' 
  | 'Other';

export type VerificationStatus = 'Verified' | 'Partially Verified' | 'Needs Review';

export type QueryStatus = 'Processing' | 'Completed' | 'Needs Review' | 'Failed';

export type TopicProficiencyCategory = 
  | 'Needs More Evidence' 
  | 'Needs Practice' 
  | 'Improving' 
  | 'Doing Well';

export type StudentStream = 'Science' | 'Commerce' | 'Humanities/Arts' | 'General';

export type SyllabusStatus = 'Verified' | 'Partially Available' | 'Unavailable';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: 'student' | 'teacher' | 'admin';
  createdAt: string;
}

export interface EducationProfile {
  userId: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  stream?: StudentStream;
  curriculumType?: string;
  academicYear: string;
  preferredLanguage: PreferredLanguage;
  subjects: string[];
  syllabusFileName?: string;
  isProfileComplete: boolean;
  updatedAt: string;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  calculationOrFormula?: string;
  explanation: string;
  whyThisStep: string;
}

export interface SimilarPracticeQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
}

export interface SolutionAnalysis {
  id: string;
  queryId: string;
  extractedQuestion: string;
  extractionConfidence: number; // 0 to 1
  subject: string;
  topic: string;
  chapter?: string;
  solutionSteps: SolutionStep[];
  finalAnswer: string;
  verificationStatus: VerificationStatus;
  verificationMethod: string;
  verificationDetails: string;
  conceptInvolved: string;
  prerequisiteConcepts: string[];
  possibleMistakes: string[];
  uncertaintyNotes?: string;
  practiceQuestions: SimilarPracticeQuestion[];
  createdAt: string;
}

export interface QueryRecord {
  id: string;
  userId: string;
  inputType: 'text' | 'image' | 'document';
  questionText: string;
  fileReference?: string;
  fileName?: string;
  subject: string;
  topic?: string;
  status: QueryStatus;
  solution?: SolutionAnalysis;
  createdAt: string;
}

export interface PracticeAttempt {
  id: string;
  userId: string;
  sessionId: string;
  questionId: string;
  questionText: string;
  submittedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  subject: string;
  topic: string;
  timeSpentSeconds: number;
  attemptedAt: string;
}

export interface PracticeSession {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  totalQuestions: number;
  correctCount: number;
  startedAt: string;
  completedAt?: string;
}

export interface StudySession {
  id: string;
  userId: string;
  startedAt: string;
  lastActiveAt: string;
  endedAt?: string;
  trackedSeconds: number;
  sessionStatus: 'active' | 'completed' | 'idle_paused';
}

export interface WeakTopicAnalysis {
  topic: string;
  subject: string;
  chapter: string;
  eligibleAttempts: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number; // 0 - 100
  category: TopicProficiencyCategory;
  trend: 'improving' | 'declining' | 'stable' | 'unknown';
  mistakePatterns: string[];
  suggestedRevision: string;
  prerequisiteConcepts: string[];
  recommendedAction: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert' | 'streak';
  read: boolean;
  timestamp: string;
  linkUrl?: string;
}

export interface OfficialSyllabusDocument {
  id: string;
  title: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'web';
  fileSize?: string;
  sourceType: 'Official Board' | 'Secondary Trustworthy';
  sourceName: string;
  sourceUrl: string;
  publishedDate?: string;
  academicYear: string;
}

export interface AssessmentPattern {
  theoryMarks: number;
  practicalOrInternalMarks: number;
  totalMarks: number;
  durationHours: number;
  formatDescription?: string;
}

export interface SyllabusTopicItem {
  id: string;
  title: string;
  description?: string;
  subtopics?: string[];
  keyConcepts?: string[];
  weightageMarks?: number;
  periods?: number;
}

export interface SyllabusChapter {
  id: string;
  chapterNumber: number;
  title: string;
  unitName?: string;
  description?: string;
  topics: SyllabusTopicItem[];
  totalPeriods?: number;
  weightageMarks?: number;
}

export interface SyllabusSubjectUnit {
  id: string;
  unitNumber: number | string;
  unitTitle: string;
  weightageMarks?: number;
  totalPeriods?: number;
  chapters: SyllabusChapter[];
}

export interface SubjectSyllabus {
  id: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  stream?: StudentStream;
  academicYear: string;
  curriculumType: string;
  subject: string;
  subjectCode?: string;
  status: SyllabusStatus;
  statusNote?: string;
  sourceName: string;
  sourceUrl: string;
  lastVerifiedDate: string;
  officialDocuments: OfficialSyllabusDocument[];
  units: SyllabusSubjectUnit[];
  prescribedBooks?: string[];
  assessmentPattern?: AssessmentPattern;
}

export interface SyllabusTopic {
  id: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  subject: string;
  chapter: string;
  topic: string;
  prerequisites: string[];
}

