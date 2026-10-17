export type EducationBoard = 
  | 'CBSE' 
  | 'CISCE (ICSE/ISC)' 
  | 'CISCE'
  | 'Karnataka State Board' 
  | 'KSEAB'
  | 'Other State/UT Board' 
  | 'NIOS' 
  | 'Other'
  | string;

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

export type SyllabusStatus = 
  | 'Verified' 
  | 'Verification Pending' 
  | 'Latest Not Confirmed' 
  | 'Partially Available' 
  | 'Unavailable';

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

export interface ConceptFormulaItem {
  name: string;
  formula: string;
  variables: { symbol: string; meaning: string; siUnit?: string }[];
  notes?: string;
}

export interface ConceptWorkedExample {
  id: string;
  question: string;
  given: string[];
  methodOrFormula: string;
  steps: { stepNumber: number; title: string; derivationOrCalc: string; explanation: string }[];
  finalAnswer: string;
  reasoningNotes?: string;
}

export interface ConceptCommonMistake {
  id: string;
  misconception: string;
  whyIncorrect: string;
  correctUnderstanding: string;
}

export interface ConceptPracticeQuestion {
  id: string;
  question: string;
  questionType: 'multiple-choice' | 'numerical' | 'conceptual';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
}

export interface ConceptExplanationSection {
  heading: string;
  content: string;
  keyTakeaway?: string;
  formulaOrRule?: string;
  diagramOrVisualPrompt?: string;
}

export interface ConceptShortNotes {
  essentialDefinitions: { term: string; definition: string }[];
  keyFormulas: ConceptFormulaItem[];
  coreLawsAndPrinciples: { name: string; statement: string; application?: string }[];
  comparisonTables?: { title: string; headers: string[]; rows: string[][] }[];
  frequentlyConfusedPoints: { pointA: string; pointB: string; clarification: string }[];
  vitalTakeaways: string[];
}

export interface ConceptDetailContent {
  id: string;
  topicId: string;
  topicTitle: string;
  subject: string;
  chapter: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  stream?: StudentStream;
  academicYear: string;
  
  // A. Concept Overview
  overview: {
    simpleIntro: string;
    learningObjectives: string[];
    prerequisites: string[];
    estimatedReadingTimeMinutes: number;
    difficultyLevel: 'Foundational' | 'Intermediate' | 'Advanced';
  };

  // B. Detailed Explanation
  sections: ConceptExplanationSection[];

  // C. Short Notes
  shortNotes: ConceptShortNotes;

  // D. Worked Examples
  workedExamples: ConceptWorkedExample[];

  // E. Common Mistakes
  commonMistakes: ConceptCommonMistake[];

  // F. Quick Revision Summary
  quickRevision: {
    essentialTakeaways: string[];
    mustKnowFormulas: string[];
    selfCheckQuestions: string[];
    relatedConcepts: { name: string; linkTopicId?: string; subject?: string }[];
  };

  // Practice Questions
  practiceQuestions: ConceptPracticeQuestion[];

  // Verification & Metadata
  isAiGenerated: boolean;
  isVerifiedContent: boolean;
  sourceReferences: string[];
  lastUpdated: string;
}

export interface ConceptBookmark {
  id: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  subject: string;
  chapter: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  bookmarkedAt: string;
  noteSnippet?: string;
}

export interface ConceptRevisionRecord {
  id: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  subject: string;
  chapter: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  lastRevisedAt: string;
  revisionCount: number;
  notes?: string;
}

export interface RecentlyViewedConcept {
  id: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  subject: string;
  chapter: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  viewedAt: string;
}


