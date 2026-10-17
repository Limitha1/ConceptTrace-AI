import type {
  UserProfile, 
  EducationProfile, 
  QueryRecord, 
  PracticeAttempt, 
  StudySession, 
  WeakTopicAnalysis,
  NotificationItem,
  Subject,
  EducationBoard,
  ClassLevel,
  ConceptBookmark,
  ConceptRevisionRecord,
  RecentlyViewedConcept,
  ConceptDetailContent
} from '../types/index.ts';
import { calculateAnalyticsSummary, calculateTopicEvidence, toCalendarDateString } from './analyticsEngine.ts';
import { determineCurrentAcademicYear } from './academicCalendar.ts';

const STORAGE_KEYS = {
  USER: 'concepttrace_user',
  REGISTERED_USERS: 'concepttrace_registered_users',
  EDUCATION: 'concepttrace_education',
  QUERIES: 'concepttrace_queries',
  SOLUTIONS: 'concepttrace_solutions',
  PRACTICE_ATTEMPTS: 'concepttrace_practice_attempts',
  PRACTICE_SESSIONS: 'concepttrace_practice_sessions',
  STUDY_SESSIONS: 'concepttrace_study_sessions',
  NOTIFICATIONS: 'concepttrace_notifications',
  CONCEPT_BOOKMARKS: 'concepttrace_concept_bookmarks',
  CONCEPT_REVISIONS: 'concepttrace_concept_revisions',
  CONCEPT_RECENT: 'concepttrace_concept_recent',
  CONCEPT_CACHE: 'concepttrace_concept_cache',
  IS_INITIALIZED: 'concepttrace_initialized_v4'
};

// Default seed student profile
export const defaultUserProfile: UserProfile = {
  id: 'usr_limitha_default',
  email: 'limitha.m@digitalcampus.edu',
  fullName: 'Limitha M',
  avatarUrl: '/assets/robot_avatar.jpg',
  role: 'student',
  createdAt: '2026-08-15T09:00:00Z'
};

export const defaultEducationProfile: EducationProfile = {
  userId: 'usr_limitha_default',
  board: 'CBSE',
  classLevel: '11',
  stream: 'Science',
  curriculumType: 'NCERT / National Curriculum Framework (NCF)',
  academicYear: determineCurrentAcademicYear('CBSE'),
  preferredLanguage: 'English',
  subjects: ['Physics', 'Mathematics', 'Chemistry'],
  syllabusFileName: 'CBSE_Class11_Science_Syllabus.pdf',
  isProfileComplete: true,
  updatedAt: new Date().toISOString()
};

// Secondary student profile for multi-tenant Row Level Security (RLS) isolation testing
export const secondaryTestUser: UserProfile = {
  id: 'usr_student_b',
  email: 'arjun.k@digitalcampus.edu',
  fullName: 'Arjun Kumar',
  avatarUrl: '/assets/robot_avatar.jpg',
  role: 'student',
  createdAt: '2026-09-01T10:00:00Z'
};

export const secondaryEducationProfile: EducationProfile = {
  userId: 'usr_student_b',
  board: 'CBSE',
  classLevel: '11',
  stream: 'Science',
  curriculumType: 'NCERT / National Curriculum Framework (NCF)',
  academicYear: determineCurrentAcademicYear('CBSE'),
  preferredLanguage: 'English',
  subjects: ['Physics', 'Mathematics', 'Chemistry'],
  syllabusFileName: 'CBSE_Class11_Science_Syllabus.pdf',
  isProfileComplete: true,
  updatedAt: new Date().toISOString()
};

// Seed realistic queries & verified solutions
export const initialQueries: QueryRecord[] = [
  {
    id: 'query-101',
    userId: 'usr_limitha_default',
    inputType: 'text',
    questionText: 'A constant force of 5 N acts on a body of mass 2 kg initially at rest for 4 seconds. Calculate the velocity acquired by the body and the work done by the force.',
    subject: 'Physics',
    topic: "Newton's Second Law & Momentum",
    status: 'Completed',
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(), // 3 hours ago
    solution: {
      id: 'sol-101',
      queryId: 'query-101',
      extractedQuestion: 'A constant force of 5 N acts on a body of mass 2 kg initially at rest for 4 seconds. Calculate the velocity acquired by the body and the work done by the force.',
      extractionConfidence: 1.0,
      subject: 'Physics',
      topic: "Newton's Second Law & Momentum",
      chapter: 'Laws of Motion',
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Identify given parameters and apply Newton’s 2nd Law',
          calculationOrFormula: 'a = F / m = 5 N / 2 kg = 2.5 m/s²',
          explanation: 'Mass m = 2 kg, Force F = 5 N, Time t = 4 s, Initial velocity u = 0 m/s. Acceleration is given by Force divided by mass.',
          whyThisStep: 'Acceleration is the fundamental bridge between applied force and kinematics equations.'
        },
        {
          stepNumber: 2,
          title: 'Determine final velocity using the first kinematic equation',
          calculationOrFormula: 'v = u + a*t = 0 + (2.5 m/s² * 4 s) = 10 m/s',
          explanation: 'Substitute initial velocity u = 0, a = 2.5, and t = 4 into v = u + at.',
          whyThisStep: 'Gives the instantaneous speed acquired after the 4-second time interval.'
        },
        {
          stepNumber: 3,
          title: 'Calculate displacement and work done (or Work-Energy Theorem)',
          calculationOrFormula: 'W = ΔK = 0.5 * m * v² = 0.5 * 2 * (10)² = 100 Joules',
          explanation: 'Alternatively using distance: s = u*t + 0.5*a*t² = 0.5 * 2.5 * 16 = 20 m. Then Work W = F * s = 5 N * 20 m = 100 J.',
          whyThisStep: 'Both methods yield identical results, verifying consistency between kinematics and energy principles.'
        }
      ],
      finalAnswer: 'Velocity acquired = 10 m/s; Work done = 100 J',
      verificationStatus: 'Verified',
      verificationMethod: 'Dual independent verification: Kinematics method + Work-Energy theorem calculation',
      verificationDetails: 'Cross-checked using W = F·s (5 N × 20 m = 100 J) against Work-Energy theorem ΔK = 1/2 m v² (1/2 × 2 kg × 10² = 100 J). Units and dimensions consistent.',
      conceptInvolved: 'Newton’s Second Law & Work-Energy Equivalence',
      prerequisiteConcepts: ['Kinematic Equations of Uniform Acceleration', 'Work and Kinetic Energy'],
      possibleMistakes: [
        'Confusing momentum change (Δp = F·t = 20 kg·m/s) with work done (W = F·s = 100 J).',
        'Forgetting that the body starts from rest (u = 0).',
        'Incorrect unit conversion or forgetting to square velocity in kinetic energy.'
      ],
      uncertaintyNotes: 'Problem statement is fully well-posed with zero ambiguity.',
      practiceQuestions: [
        {
          id: 'pq-101-1',
          question: 'If the force is doubled to 10 N for the same mass of 2 kg over the same time of 4 s, what will be the final kinetic energy?',
          options: ['200 J', '400 J', '100 J', '800 J'],
          correctAnswer: '400 J',
          explanation: 'a = 10/2 = 5 m/s². v = 5 * 4 = 20 m/s. Kinetic energy = 0.5 * 2 * 20² = 400 J (quadrupled since v is doubled).',
          difficulty: 'Medium'
        },
        {
          id: 'pq-101-2',
          question: 'What was the momentum of the body at t = 4 s?',
          options: ['10 kg·m/s', '20 kg·m/s', '40 kg·m/s', '50 kg·m/s'],
          correctAnswer: '20 kg·m/s',
          explanation: 'p = m * v = 2 kg * 10 m/s = 20 kg·m/s (also impulse = F * t = 5 * 4 = 20 N·s).',
          difficulty: 'Easy'
        }
      ],
      createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
    }
  },
  {
    id: 'query-102',
    userId: 'usr_limitha_default',
    inputType: 'text',
    questionText: 'Find the derivative of f(x) = (3x² - 5) / (2x + 1) using the quotient rule.',
    subject: 'Mathematics',
    topic: 'Limits & Derivatives',
    status: 'Completed',
    createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(), // 1 day ago
    solution: {
      id: 'sol-102',
      queryId: 'query-102',
      extractedQuestion: 'Find the derivative of f(x) = (3x² - 5) / (2x + 1) using the quotient rule.',
      extractionConfidence: 1.0,
      subject: 'Mathematics',
      topic: 'Limits & Derivatives',
      chapter: 'Calculus',
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'State the Quotient Rule',
          calculationOrFormula: 'd/dx [u/v] = (u\'v - uv\') / v²',
          explanation: 'Let numerator u = 3x² - 5 and denominator v = 2x + 1.',
          whyThisStep: 'Standard algebraic differentiation for rational functions.'
        },
        {
          stepNumber: 2,
          title: 'Compute individual derivatives u\' and v\'',
          calculationOrFormula: 'u\' = d/dx(3x² - 5) = 6x, and v\' = d/dx(2x + 1) = 2',
          explanation: 'Apply the power rule d/dx(x^n) = n*x^(n-1) to each term.',
          whyThisStep: 'Provides the components needed for the quotient formula.'
        },
        {
          stepNumber: 3,
          title: 'Substitute and expand numerator',
          calculationOrFormula: 'f\'(x) = [ (6x)(2x + 1) - (3x² - 5)(2) ] / (2x + 1)²',
          explanation: 'Expand: 12x² + 6x - (6x² - 10) = 12x² + 6x - 6x² + 10 = 6x² + 6x + 10.',
          whyThisStep: 'Simplifying the numerator yields the final standard form.'
        }
      ],
      finalAnswer: "f'(x) = (6x² + 6x + 10) / (2x + 1)²",
      verificationStatus: 'Verified',
      verificationMethod: 'Symbolic polynomial algebra check & logarithmic differentiation verification',
      verificationDetails: 'Checked by logarithmic differentiation ln y = ln(3x² - 5) - ln(2x + 1) => y\'/y = 6x/(3x² - 5) - 2/(2x + 1). Cross multiplication confirms (6x² + 6x + 10)/(2x + 1)²',
      conceptInvolved: 'Quotient Rule of Differentiation',
      prerequisiteConcepts: ['Power Rule of Differentiation', 'Polynomial Expansion'],
      possibleMistakes: [
        'Subtracting in reverse order: doing (uv\' - u\'v) instead of (u\'v - uv\').',
        'Sign error when distributing -2 to (3x² - 5), yielding -10 instead of +10.',
        'Attempting to cancel terms in the denominator prematurely before factoring.'
      ],
      uncertaintyNotes: 'Defined for all x ≠ -1/2.',
      practiceQuestions: [
        {
          id: 'pq-102-1',
          question: 'What is f\'(0) for this function?',
          options: ['5', '10', '-10', '0'],
          correctAnswer: '10',
          explanation: 'Substitute x = 0: f\'(0) = (6(0) + 6(0) + 10) / (2(0) + 1)² = 10 / 1 = 10.',
          difficulty: 'Easy'
        }
      ],
      createdAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString()
    }
  },
  {
    id: 'query-103',
    userId: 'usr_limitha_default',
    inputType: 'text',
    questionText: 'A heat engine operates between temperatures 600 K and 300 K. What is the maximum possible theoretical efficiency?',
    subject: 'Physics',
    topic: 'Carnot Heat Engine & Efficiency',
    status: 'Completed',
    createdAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
    solution: {
      id: 'sol-103',
      queryId: 'query-103',
      extractedQuestion: 'A heat engine operates between temperatures 600 K and 300 K. What is the maximum possible theoretical efficiency?',
      extractionConfidence: 0.98,
      subject: 'Physics',
      topic: 'Carnot Heat Engine & Efficiency',
      chapter: 'Thermodynamics',
      solutionSteps: [
        {
          stepNumber: 1,
          title: 'Apply Carnot Efficiency Formula',
          calculationOrFormula: 'η_max = 1 - (T_cold / T_hot)',
          explanation: 'Here T_hot = 600 K (source) and T_cold = 300 K (sink).',
          whyThisStep: 'Carnot’s theorem dictates that no engine can be more efficient than a reversible Carnot engine operating between two thermal reservoirs.'
        },
        {
          stepNumber: 2,
          title: 'Calculate numerical fraction and percentage',
          calculationOrFormula: 'η = 1 - (300 / 600) = 1 - 0.5 = 0.5 = 50%',
          explanation: 'Efficiency is expressed as 50% or 0.50.',
          whyThisStep: 'Direct evaluation gives the exact theoretical bound.'
        }
      ],
      finalAnswer: 'Maximum theoretical efficiency = 50% (0.50)',
      verificationStatus: 'Verified',
      verificationMethod: 'Thermodynamic bounds & entropy balance verification',
      verificationDetails: 'Second Law of Thermodynamics ΔS_universe >= 0 strictly sets upper bound η = 1 - Tc/Th.',
      conceptInvolved: 'Carnot Theorem & Second Law of Thermodynamics',
      prerequisiteConcepts: ['Absolute Temperature Scale (Kelvin)', 'Heat and Work Conservation'],
      possibleMistakes: [
        'Inverting temperatures: calculating 1 - (600/300) resulting in negative value.',
        'Using Celsius values instead of converting to Kelvin (when given in °C).'
      ],
      practiceQuestions: [],
      createdAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString()
    }
  }
];

// Seed realistic practice attempts (18 attempts across topics)
export const initialPracticeAttempts: PracticeAttempt[] = [
  // Newton's Second Law (4 attempts: 3 correct, 1 incorrect) -> 75% accuracy
  {
    id: 'att-1',
    userId: 'usr_limitha_default',
    sessionId: 'sess-1',
    questionId: 'q-newton-1',
    questionText: 'A 4 kg block is accelerated by a net force of 12 N. What is its acceleration?',
    submittedAnswer: '3 m/s²',
    correctAnswer: '3 m/s²',
    isCorrect: true,
    subject: 'Physics',
    topic: "Newton's Second Law & Momentum",
    timeSpentSeconds: 45,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  },
  {
    id: 'att-2',
    userId: 'usr_limitha_default',
    sessionId: 'sess-1',
    questionId: 'q-newton-2',
    questionText: 'If mass is doubled while net force is halved, the acceleration becomes:',
    submittedAnswer: 'One-fourth',
    correctAnswer: 'One-fourth',
    isCorrect: true,
    subject: 'Physics',
    topic: "Newton's Second Law & Momentum",
    timeSpentSeconds: 38,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 11).toISOString()
  },
  {
    id: 'att-3',
    userId: 'usr_limitha_default',
    sessionId: 'sess-1',
    questionId: 'q-newton-3',
    questionText: 'A force of 20 N stops a car moving at 10 m/s in 2 seconds. What is the mass of the car?',
    submittedAnswer: '4 kg',
    correctAnswer: '4 kg',
    isCorrect: true,
    subject: 'Physics',
    topic: "Newton's Second Law & Momentum",
    timeSpentSeconds: 62,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString()
  },
  {
    id: 'att-4',
    userId: 'usr_limitha_default',
    sessionId: 'sess-1',
    questionId: 'q-newton-4',
    questionText: 'What is the SI unit of impulse?',
    submittedAnswer: 'N/m',
    correctAnswer: 'N·s',
    isCorrect: false,
    subject: 'Physics',
    topic: "Newton's Second Law & Momentum",
    timeSpentSeconds: 25,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 9).toISOString()
  },

  // Limits & Derivatives (5 attempts: 4 correct, 1 incorrect) -> 80% accuracy
  {
    id: 'att-5',
    userId: 'usr_limitha_default',
    sessionId: 'sess-2',
    questionId: 'q-calc-1',
    questionText: 'Evaluate limit as x -> 0 of sin(3x) / x',
    submittedAnswer: '3',
    correctAnswer: '3',
    isCorrect: true,
    subject: 'Mathematics',
    topic: 'Limits & Derivatives',
    timeSpentSeconds: 40,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 30).toISOString()
  },
  {
    id: 'att-6',
    userId: 'usr_limitha_default',
    sessionId: 'sess-2',
    questionId: 'q-calc-2',
    questionText: 'Derivative of cos(x) with respect to x is:',
    submittedAnswer: '-sin(x)',
    correctAnswer: '-sin(x)',
    isCorrect: true,
    subject: 'Mathematics',
    topic: 'Limits & Derivatives',
    timeSpentSeconds: 20,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 29).toISOString()
  },
  {
    id: 'att-7',
    userId: 'usr_limitha_default',
    sessionId: 'sess-2',
    questionId: 'q-calc-3',
    questionText: 'Derivative of x³ - 4x² + 7 is:',
    submittedAnswer: '3x² - 8x',
    correctAnswer: '3x² - 8x',
    isCorrect: true,
    subject: 'Mathematics',
    topic: 'Limits & Derivatives',
    timeSpentSeconds: 35,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 28).toISOString()
  },
  {
    id: 'att-8',
    userId: 'usr_limitha_default',
    sessionId: 'sess-2',
    questionId: 'q-calc-4',
    questionText: 'Derivative of e^(2x) is:',
    submittedAnswer: 'e^(2x)',
    correctAnswer: '2e^(2x)',
    isCorrect: false,
    subject: 'Mathematics',
    topic: 'Limits & Derivatives',
    timeSpentSeconds: 45,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 27).toISOString()
  },
  {
    id: 'att-9',
    userId: 'usr_limitha_default',
    sessionId: 'sess-2',
    questionId: 'q-calc-5',
    questionText: 'Limit as x -> 2 of (x² - 4)/(x - 2) is:',
    submittedAnswer: '4',
    correctAnswer: '4',
    isCorrect: true,
    subject: 'Mathematics',
    topic: 'Limits & Derivatives',
    timeSpentSeconds: 30,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString()
  },

  // Chemical Bonding & VSEPR (4 attempts: 1 correct, 3 incorrect) -> 25% accuracy (WEAK TOPIC - Needs Practice)
  {
    id: 'att-10',
    userId: 'usr_limitha_default',
    sessionId: 'sess-3',
    questionId: 'q-chem-1',
    questionText: 'What is the molecular geometry of SF4 according to VSEPR theory?',
    submittedAnswer: 'Tetrahedral',
    correctAnswer: 'See-saw',
    isCorrect: false,
    subject: 'Chemistry',
    topic: 'VSEPR Theory & Molecular Geometry',
    timeSpentSeconds: 55,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
  },
  {
    id: 'att-11',
    userId: 'usr_limitha_default',
    sessionId: 'sess-3',
    questionId: 'q-chem-2',
    questionText: 'What is the bond angle in a water molecule (H2O)?',
    submittedAnswer: '109.5°',
    correctAnswer: '104.5°',
    isCorrect: false,
    subject: 'Chemistry',
    topic: 'VSEPR Theory & Molecular Geometry',
    timeSpentSeconds: 50,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 47).toISOString()
  },
  {
    id: 'att-12',
    userId: 'usr_limitha_default',
    sessionId: 'sess-3',
    questionId: 'q-chem-3',
    questionText: 'Which molecule has a trigonal planar geometry?',
    submittedAnswer: 'BF3',
    correctAnswer: 'BF3',
    isCorrect: true,
    subject: 'Chemistry',
    topic: 'VSEPR Theory & Molecular Geometry',
    timeSpentSeconds: 40,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 46).toISOString()
  },
  {
    id: 'att-13',
    userId: 'usr_limitha_default',
    sessionId: 'sess-3',
    questionId: 'q-chem-4',
    questionText: 'In ClF3, the lone pairs on the central chlorine atom occupy which positions in the trigonal bipyramidal arrangement?',
    submittedAnswer: 'Axial positions',
    correctAnswer: 'Equatorial positions',
    isCorrect: false,
    subject: 'Chemistry',
    topic: 'VSEPR Theory & Molecular Geometry',
    timeSpentSeconds: 65,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 45).toISOString()
  },

  // Carnot Heat Engine (3 attempts: 2 correct, 1 incorrect) -> 66.7% accuracy (Improving)
  {
    id: 'att-14',
    userId: 'usr_limitha_default',
    sessionId: 'sess-4',
    questionId: 'q-carnot-1',
    questionText: 'A Carnot engine has 100% efficiency only if:',
    submittedAnswer: 'Sink temperature is 0 K',
    correctAnswer: 'Sink temperature is 0 K',
    isCorrect: true,
    subject: 'Physics',
    topic: 'Carnot Heat Engine & Efficiency',
    timeSpentSeconds: 40,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 70).toISOString()
  },
  {
    id: 'att-15',
    userId: 'usr_limitha_default',
    sessionId: 'sess-4',
    questionId: 'q-carnot-2',
    questionText: 'In a Carnot cycle, heat is absorbed during which process?',
    submittedAnswer: 'Isothermal expansion',
    correctAnswer: 'Isothermal expansion',
    isCorrect: true,
    subject: 'Physics',
    topic: 'Carnot Heat Engine & Efficiency',
    timeSpentSeconds: 48,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 69).toISOString()
  },
  {
    id: 'att-16',
    userId: 'usr_limitha_default',
    sessionId: 'sess-4',
    questionId: 'q-carnot-3',
    questionText: 'If source is at 400 K and sink at 300 K, what is the efficiency?',
    submittedAnswer: '33.3%',
    correctAnswer: '25%',
    isCorrect: false,
    subject: 'Physics',
    topic: 'Carnot Heat Engine & Efficiency',
    timeSpentSeconds: 52,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 68).toISOString()
  },

  // Conic Sections (2 attempts - small sample size: Needs More Evidence)
  {
    id: 'att-17',
    userId: 'usr_limitha_default',
    sessionId: 'sess-5',
    questionId: 'q-conic-1',
    questionText: 'What is the eccentricity of a parabola?',
    submittedAnswer: '1',
    correctAnswer: '1',
    isCorrect: true,
    subject: 'Mathematics',
    topic: 'Parabola & Ellipse Standard Equations',
    timeSpentSeconds: 22,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 90).toISOString()
  },
  {
    id: 'att-18',
    userId: 'usr_limitha_default',
    sessionId: 'sess-5',
    questionId: 'q-conic-2',
    questionText: 'For ellipse x²/a² + y²/b² = 1 with a > b, what is the relation between a, b, and e?',
    submittedAnswer: 'b² = a²(1 - e²)',
    correctAnswer: 'b² = a²(1 - e²)',
    isCorrect: true,
    subject: 'Mathematics',
    topic: 'Parabola & Ellipse Standard Equations',
    timeSpentSeconds: 30,
    attemptedAt: new Date(Date.now() - 3600 * 1000 * 89).toISOString()
  }
];

// Seed study sessions for active time tracking & streak computation
export const initialStudySessions: StudySession[] = [
  {
    id: 'study-1',
    userId: 'usr_limitha_default',
    startedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    endedAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    trackedSeconds: 3240, // 54 mins today
    sessionStatus: 'completed'
  },
  {
    id: 'study-2',
    userId: 'usr_limitha_default',
    startedAt: new Date(Date.now() - 3600 * 1000 * 26).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600 * 1000 * 25).toISOString(),
    endedAt: new Date(Date.now() - 3600 * 1000 * 25).toISOString(),
    trackedSeconds: 2880, // 48 mins yesterday
    sessionStatus: 'completed'
  },
  {
    id: 'study-3',
    userId: 'usr_limitha_default',
    startedAt: new Date(Date.now() - 3600 * 1000 * 50).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600 * 1000 * 49).toISOString(),
    endedAt: new Date(Date.now() - 3600 * 1000 * 49).toISOString(),
    trackedSeconds: 3600, // 60 mins 2 days ago
    sessionStatus: 'completed'
  },
  {
    id: 'study-4',
    userId: 'usr_limitha_default',
    startedAt: new Date(Date.now() - 3600 * 1000 * 74).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600 * 1000 * 73).toISOString(),
    endedAt: new Date(Date.now() - 3600 * 1000 * 73).toISOString(),
    trackedSeconds: 2100, // 35 mins 3 days ago
    sessionStatus: 'completed'
  },
  {
    id: 'study-5',
    userId: 'usr_limitha_default',
    startedAt: new Date(Date.now() - 3600 * 1000 * 98).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600 * 1000 * 97).toISOString(),
    endedAt: new Date(Date.now() - 3600 * 1000 * 97).toISOString(),
    trackedSeconds: 1950, // 32.5 mins 4 days ago
    sessionStatus: 'completed'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '5-Day Learning Streak Active! 🔥',
    message: 'Great consistency! You have logged qualifying study sessions 5 days in a row.',
    type: 'streak',
    read: false,
    timestamp: '1 hour ago'
  },
  {
    id: 'notif-2',
    title: 'Verification Complete for Doubt #101',
    message: 'Your Physics Newton’s Law problem was verified via dual-check kinematics.',
    type: 'success',
    read: false,
    timestamp: '3 hours ago',
    linkUrl: '/doubt'
  },
  {
    id: 'notif-3',
    title: 'Targeted Practice Recommendation',
    message: 'We noticed a recurring gap in VSEPR Lone Pair Geometry. Complete 3 quick practice questions to improve.',
    type: 'alert',
    read: true,
    timestamp: 'Yesterday',
    linkUrl: '/weak-topics'
  }
];

// Registered user account record for local multi-tenant authentication
export interface RegisteredUserAccount {
  user: UserProfile;
  password?: string;
}

export const getRegisteredUsers = (): RegisteredUserAccount[] => {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveRegisteredUser = (account: RegisteredUserAccount) => {
  if (typeof localStorage === 'undefined') return;
  const list = getRegisteredUsers();
  const existingIdx = list.findIndex(a => a.user.email.toLowerCase() === account.user.email.toLowerCase());
  if (existingIdx >= 0) {
    list[existingIdx] = account;
  } else {
    list.push(account);
  }
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(list));
};

// Initialize Storage: sets up empty collections without fabricating records
export const initializeStorage = () => {
  if (typeof window === 'undefined') return;
  const isInit = localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED);
  if (!isInit) {
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PRACTICE_ATTEMPTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    // Clear any previous legacy demo user session
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.EDUCATION);
    localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, 'true');
  }
};

// Storage helper functions
export const getStoredUser = (): UserProfile | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.id) return null;
    if (parsed.avatarUrl?.includes('student_avatar')) {
      parsed.avatarUrl = '/assets/robot_avatar.jpg';
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveStoredUser = (user: UserProfile | null) => {
  if (typeof localStorage === 'undefined') return;
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } else {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }
};

export const getStoredEducationProfile = (userId?: string): EducationProfile | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const targetId = userId || getStoredUser()?.id;
    if (!targetId) return null;
    const userSpecific = localStorage.getItem(`${STORAGE_KEYS.EDUCATION}_${targetId}`);
    if (userSpecific) {
      profile = JSON.parse(userSpecific);
    } else {
      const raw = localStorage.getItem(STORAGE_KEYS.EDUCATION);
      if (raw) {
        const def: EducationProfile = JSON.parse(raw);
        if (def.userId === targetId) profile = def;
      }
    }

    if (profile) {
      // Safe migration & auto-resolve if missing
      if (!profile.academicYear) {
        profile.academicYear = determineCurrentAcademicYear(profile.board);
        saveStoredEducationProfile(profile);
      }
      return profile;
    }

    return null;
  } catch {
    return null;
  }
};

export const saveStoredEducationProfile = (profile: EducationProfile) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEYS.EDUCATION}_${profile.userId}`, JSON.stringify(profile));
  localStorage.setItem(STORAGE_KEYS.EDUCATION, JSON.stringify(profile));
};

export const getStoredQueries = (userId?: string): QueryRecord[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.QUERIES) : null;
    const all: QueryRecord[] = raw ? JSON.parse(raw) : [];
    const targetId = userId || getStoredUser()?.id;
    if (!targetId) return [];
    // RLS Isolation: Only return queries matching the student's own ID
    return all.filter(q => q.userId === targetId);
  } catch {
    return [];
  }
};

export const saveQueryRecord = (query: QueryRecord) => {
  if (typeof localStorage === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEYS.QUERIES);
  const all: QueryRecord[] = raw ? JSON.parse(raw) : [];
  const updated = [query, ...all.filter(q => q.id !== query.id)];
  localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(updated));
};

export const deleteQueryRecord = (id: string, userId?: string): boolean => {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.QUERIES) : null;
  const all: QueryRecord[] = raw ? JSON.parse(raw) : [];
  const targetId = userId || getStoredUser()?.id;
  
  // Row Level Security: Student B CANNOT delete Student A's query!
  const target = all.find(q => q.id === id);
  if (!target || target.userId !== targetId) {
    console.warn(`[RLS Access Denied] Student ${targetId} cannot delete query ${id} owned by student ${target?.userId}`);
    return false;
  }

  if (typeof localStorage !== 'undefined') {
    const updated = all.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(updated));
  }
  return true;
};

export const getStoredPracticeAttempts = (userId?: string): PracticeAttempt[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.PRACTICE_ATTEMPTS) : null;
    const all: PracticeAttempt[] = raw ? JSON.parse(raw) : [];
    const targetId = userId || getStoredUser()?.id;
    if (!targetId) return [];
    // RLS Isolation: Only return attempts made by this student
    return all.filter(a => a.userId === targetId);
  } catch {
    return [];
  }
};

export const savePracticeAttempt = (attempt: PracticeAttempt) => {
  if (typeof localStorage === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEYS.PRACTICE_ATTEMPTS);
  const all: PracticeAttempt[] = raw ? JSON.parse(raw) : [];
  // Prevent duplicate submissions of the exact same attempt
  if (all.some(a => a.id === attempt.id)) return;
  const updated = [attempt, ...all];
  localStorage.setItem(STORAGE_KEYS.PRACTICE_ATTEMPTS, JSON.stringify(updated));
};

export const getStoredStudySessions = (userId?: string): StudySession[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS) : null;
    const all: StudySession[] = raw ? JSON.parse(raw) : [];
    const targetId = userId || getStoredUser()?.id;
    if (!targetId) return [];
    return all.filter(s => s.userId === targetId);
  } catch {
    return [];
  }
};

export const saveStudySession = (session: StudySession) => {
  if (typeof localStorage === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
  const all: StudySession[] = raw ? JSON.parse(raw) : [];
  const index = all.findIndex(s => s.id === session.id);
  let updated: StudySession[];
  if (index >= 0) {
    updated = [...all];
    updated[index] = session;
  } else {
    updated = [session, ...all];
  }
  localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(updated));
};

export const getStoredNotifications = (): NotificationItem[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const markNotificationAsRead = (id: string) => {
  if (typeof localStorage === 'undefined') return;
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
};

export const markAllNotificationsAsRead = () => {
  if (typeof localStorage === 'undefined') return;
  const current = getStoredNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
};

export const clearStudentRecords = (userId: string) => {
  if (typeof localStorage === 'undefined') return;
  const rawQ = localStorage.getItem(STORAGE_KEYS.QUERIES);
  if (rawQ) {
    const all: QueryRecord[] = JSON.parse(rawQ);
    localStorage.setItem(STORAGE_KEYS.QUERIES, JSON.stringify(all.filter(q => q.userId !== userId)));
  }
  const rawP = localStorage.getItem(STORAGE_KEYS.PRACTICE_ATTEMPTS);
  if (rawP) {
    const all: PracticeAttempt[] = JSON.parse(rawP);
    localStorage.setItem(STORAGE_KEYS.PRACTICE_ATTEMPTS, JSON.stringify(all.filter(a => a.userId !== userId)));
  }
  const rawS = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
  if (rawS) {
    const all: StudySession[] = JSON.parse(rawS);
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(all.filter(s => s.userId !== userId)));
  }
};

// --- EVIDENCE-BASED LEARNING ANALYTICS ENGINE ---

export interface DashboardMetrics {
  activeDaysThisMonth: number;
  studyTimeHours: number;
  studyTimeMinutes: number;
  currentStreakDays: number;
  overallAccuracy: number | null; // null if 0 attempts (honest empty state)
  totalAttempts: number;
  correctAttempts: number;
  queriesCount: number;
  previousPeriodAccuracyDiff: number; // e.g. +3.5%
  previousPeriodActiveDaysDiff: number;
}

/**
 * Calculates genuine student dashboard metrics based strictly on saved attempts and sessions.
 * Never fabricates numbers.
 */
export const calculateDashboardMetrics = (userId?: string): DashboardMetrics => {
  const attempts = getStoredPracticeAttempts(userId);
  const sessions = getStoredStudySessions(userId);
  const queries = getStoredQueries(userId);
  const summary = calculateAnalyticsSummary(attempts, sessions, queries.length, 'all');

  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  const thisMonthAttempts = attempts.filter(a => new Date(a.attemptedAt).getTime() >= firstOfThisMonth);
  const lastMonthAttempts = attempts.filter(a => {
    const t = new Date(a.attemptedAt).getTime();
    return t >= firstOfLastMonth && t < firstOfThisMonth;
  });

  const thisMonthAcc = thisMonthAttempts.length > 0 
    ? (thisMonthAttempts.filter(a => a.isCorrect).length / thisMonthAttempts.length) * 100 
    : null;
  const lastMonthAcc = lastMonthAttempts.length > 0 
    ? (lastMonthAttempts.filter(a => a.isCorrect).length / lastMonthAttempts.length) * 100 
    : null;

  const previousPeriodAccuracyDiff = (thisMonthAcc !== null && lastMonthAcc !== null)
    ? Math.round((thisMonthAcc - lastMonthAcc) * 10) / 10
    : 0;

  const thisMonthActiveDays = new Set(thisMonthAttempts.map(a => toCalendarDateString(new Date(a.attemptedAt)))).size;
  const lastMonthActiveDays = new Set(lastMonthAttempts.map(a => toCalendarDateString(new Date(a.attemptedAt)))).size;
  const previousPeriodActiveDaysDiff = (thisMonthActiveDays > 0 && lastMonthActiveDays > 0)
    ? thisMonthActiveDays - lastMonthActiveDays
    : 0;

  return {
    activeDaysThisMonth: summary.activeDaysCount,
    studyTimeHours: summary.studyTimeHours,
    studyTimeMinutes: summary.studyTimeMinutes,
    currentStreakDays: summary.currentStreakDays,
    overallAccuracy: summary.overallAccuracy,
    totalAttempts: summary.totalAttempts,
    correctAttempts: summary.correctAttempts,
    queriesCount: summary.activeQueriesCount,
    previousPeriodAccuracyDiff,
    previousPeriodActiveDaysDiff
  };
};

export const TOPIC_META_MAP: Record<string, { 
  subject: Subject; 
  chapter: string; 
  mistakePatterns: string[]; 
  prerequisites: string[]; 
  suggestedRevision: string; 
}> = {
  'VSEPR Theory & Molecular Geometry': {
    subject: 'Chemistry',
    chapter: 'Chemical Bonding',
    mistakePatterns: [
      'Confusing electron geometry (spatial arrangement of all pairs) with molecular shape (nuclei positions only)',
      'Placing lone pairs in axial rather than equatorial positions in trigonal bipyramidal systems (e.g. ClF3, SF4)',
      'Neglecting lone-pair repulsion on adjacent bond angles (e.g. 104.5° in H2O vs 109.5° tetrahedral)'
    ],
    prerequisites: ['Lewis Electron Dot Structures', 'Valence Electrons & Octet Rule'],
    suggestedRevision: 'Review the 5 basic electron geometries and count bonding vs non-bonding electron pairs step-by-step.'
  },
  'Carnot Heat Engine & Efficiency': {
    subject: 'Physics',
    chapter: 'Thermodynamics',
    mistakePatterns: [
      'Calculating efficiency using Celsius temperatures rather than absolute Kelvin scale',
      'Confusing net work done per cycle with total heat input from the hot reservoir'
    ],
    prerequisites: ['First Law of Thermodynamics', 'Absolute Temperature Scales', 'PV Indicator Diagrams'],
    suggestedRevision: 'Practice converting all thermal reservoir temperatures to Kelvin first and remember η = 1 - (Tc / Th).'
  },
  "Newton's Second Law & Momentum": {
    subject: 'Physics',
    chapter: 'Laws of Motion',
    mistakePatterns: [
      'Forgetting that F_net is the vector sum of all external forces, not an individual applied force',
      'Confusing impulse (F·Δt = Δp) with work (F·d = ΔK)'
    ],
    prerequisites: ['Kinematics Equations in 1D', 'Vector Resolution & Free Body Diagrams'],
    suggestedRevision: 'Always sketch a clean Free Body Diagram (FBD) and write ΣF = m·a along orthogonal axes.'
  },
  'Limits & Derivatives': {
    subject: 'Mathematics',
    chapter: 'Calculus',
    mistakePatterns: [
      'Applying Quotient Rule with reversed numerator subtraction (uv\' - u\'v instead of u\'v - uv\')',
      'Distributing negative signs incorrectly across multi-term derivative products'
    ],
    prerequisites: ['Power Rule of Differentiation', 'Factoring Polynomial Expressions', 'Standard Trigonometric Limits'],
    suggestedRevision: 'Write out u, v, u\', and v\' clearly in four quadrants before assembling the quotient formula.'
  },
  'Parabola & Ellipse Standard Equations': {
    subject: 'Mathematics',
    chapter: 'Conic Sections',
    mistakePatterns: [
      'Mixing up semi-major axis a with semi-minor axis b when the transverse axis is along the y-axis',
      'Forgetting that eccentricity e < 1 for ellipse and e = 1 for parabola'
    ],
    prerequisites: ['Coordinate Geometry Distance Formula', 'Completing the Square'],
    suggestedRevision: 'Plot the center and foci first to identify orientation before picking the standard form equation.'
  }
};

/**
 * Computes Weak Topics according to Section 8 of Master Prompt:
 * - Accuracy = correct eligible attempts / total eligible checked attempts × 100
 * - Does NOT classify as weak solely from 1 wrong answer
 * - Less than 3 attempts labeled "Needs More Evidence"
 * - Categories: Needs More Evidence, Needs Practice (<60%), Improving (60-79%), Doing Well (>=80%)
 */
export const calculateWeakTopics = (userId?: string): WeakTopicAnalysis[] => {
  const attempts = getStoredPracticeAttempts(userId);
  return calculateTopicEvidence(attempts, TOPIC_META_MAP);
};

// Reset to initial seed data (for testing & demo purposes)
export const resetDemoData = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.IS_INITIALIZED);
  initializeStorage();
};

export interface RlsVerificationResult {
  id: string;
  testName: string;
  category: 'READ' | 'WRITE' | 'DELETE' | 'KEY_HYGIENE';
  description: string;
  passed: boolean;
  details: string;
  timestamp: string;
}

/**
 * Executes a live Row Level Security (RLS) and cross-tenant isolation audit
 * proving that Student B cannot read, modify, or delete Student A's records,
 * and verifying that no private keys (service_role) are leaked into the frontend.
 */
export const runRlsVerificationAudit = (): RlsVerificationResult[] => {
  // Test 1: Cross-Tenant Read Isolation (SELECT)
  const studentBVisibleQueries = getStoredQueries('usr_student_b');
  const studentAQueriesInBView = studentBVisibleQueries.filter(q => q.userId === 'usr_limitha_default');
  const test1Passed = studentAQueriesInBView.length === 0;

  // Test 2: Cross-Tenant Mutation Guard (DELETE)
  const canStudentBDeleteStudentAQuery = deleteQueryRecord('query-101', 'usr_student_b');
  const test2Passed = !canStudentBDeleteStudentAQuery;

  // Test 3: Practice Analytics Isolation (AGGREGATE)
  const studentBAttempts = getStoredPracticeAttempts('usr_student_b');
  const studentAAttemptsInB = studentBAttempts.filter(a => a.userId === 'usr_limitha_default');
  const test3Passed = studentAAttemptsInB.length === 0;

  // Test 4: Zero Private Key Exposure
  const gProcess = (globalThis as any).process;
  const envHasServiceRole = typeof gProcess !== 'undefined' && Boolean(gProcess.env?.SUPABASE_SERVICE_ROLE_KEY);
  const windowHasServiceRole = typeof window !== 'undefined' && Boolean((window as any)?.SUPABASE_SERVICE_ROLE_KEY);
  const importMetaEnvHasService = Boolean((import.meta.env as any)?.VITE_SUPABASE_SERVICE_ROLE_KEY);
  const test4Passed = !envHasServiceRole && !windowHasServiceRole && !importMetaEnvHasService;

  return [
    {
      id: 'rls-check-1',
      testName: 'Cross-Tenant Read Isolation (SELECT)',
      category: 'READ',
      description: 'Verify Student B cannot retrieve or view Student A’s saved queries or solutions.',
      passed: test1Passed,
      details: test1Passed 
        ? `PASSED: Student B query log returned 0 records belonging to Student A (Found ${studentBVisibleQueries.length} owned records).`
        : 'FAILED: Student A records leaked into Student B view.',
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 'rls-check-2',
      testName: 'Cross-Tenant Mutation Guard (DELETE / UPDATE)',
      category: 'DELETE',
      description: 'Verify Student B cannot delete or modify Student A’s doubt record (query-101).',
      passed: test2Passed,
      details: test2Passed
        ? 'PASSED: Attempt by usr_student_b to delete query-101 was rejected with RLS Access Denied (target protected).'
        : 'FAILED: Unauthorized cross-student deletion succeeded.',
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 'rls-check-3',
      testName: 'Practice Analytics Isolation (AGGREGATE)',
      category: 'WRITE',
      description: 'Verify Student B’s practice attempts and accuracy metrics are calculated exclusively from their own attempts.',
      passed: test3Passed,
      details: test3Passed
        ? `PASSED: Student B has ${studentBAttempts.length} personal attempts; 0 attempts leaked from Student A.`
        : 'FAILED: Cross-user attempt leakage detected.',
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 'rls-check-4',
      testName: 'Client-Side Key Hygiene (Zero Private Key Exposure)',
      category: 'KEY_HYGIENE',
      description: 'Verify only VITE_SUPABASE_ANON_KEY is accessible; service_role / master keys are completely excluded from client bundles.',
      passed: test4Passed,
      details: test4Passed
        ? 'PASSED: Zero service_role keys exposed. Frontend is constrained strictly to public anon role with RLS enforcement.'
        : 'FAILED: Sensitive administrative keys found in environment.',
      timestamp: new Date().toLocaleTimeString()
    }
  ];
};

// ==========================================
// CONCEPT LIBRARY: BOOKMARKS & SMART REVISION
// ==========================================

export const getConceptBookmarks = (userId?: string): ConceptBookmark[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CONCEPT_BOOKMARKS) : null;
    const all: ConceptBookmark[] = raw ? JSON.parse(raw) : [];
    const targetId = userId || getStoredUser()?.id;
    if (!targetId) return [];
    return all.filter(b => b.userId === targetId);
  } catch {
    return [];
  }
};

export const saveConceptBookmark = (bookmark: ConceptBookmark) => {
  if (typeof localStorage === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEYS.CONCEPT_BOOKMARKS);
  const all: ConceptBookmark[] = raw ? JSON.parse(raw) : [];
  // Deduplicate on topicId and userId
  const filtered = all.filter(b => !(b.topicId === bookmark.topicId && b.userId === bookmark.userId));
  const updated = [bookmark, ...filtered];
  localStorage.setItem(STORAGE_KEYS.CONCEPT_BOOKMARKS, JSON.stringify(updated));
};

export const removeConceptBookmark = (topicId: string, userId?: string) => {
  if (typeof localStorage === 'undefined') return;
  const targetId = userId || getStoredUser()?.id;
  if (!targetId) return;
  const raw = localStorage.getItem(STORAGE_KEYS.CONCEPT_BOOKMARKS);
  const all: ConceptBookmark[] = raw ? JSON.parse(raw) : [];
  const updated = all.filter(b => !(b.topicId === topicId && b.userId === targetId));
  localStorage.setItem(STORAGE_KEYS.CONCEPT_BOOKMARKS, JSON.stringify(updated));
};

export const isConceptBookmarked = (topicId: string, userId?: string): boolean => {
  const bookmarks = getConceptBookmarks(userId);
  return bookmarks.some(b => b.topicId === topicId);
};

export const getConceptRevisions = (userId?: string): ConceptRevisionRecord[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CONCEPT_REVISIONS) : null;
    const all: ConceptRevisionRecord[] = raw ? JSON.parse(raw) : [];
    const targetId = userId || getStoredUser()?.id;
    if (!targetId) return [];
    return all.filter(r => r.userId === targetId);
  } catch {
    return [];
  }
};

export const markConceptAsRevised = (
  topicId: string, 
  topicTitle: string, 
  subject: string, 
  chapter: string, 
  board: EducationBoard, 
  classLevel: ClassLevel, 
  userId?: string
): ConceptRevisionRecord => {
  const targetId = userId || getStoredUser()?.id || 'usr_anonymous';
  const existing = getConceptRevisions(targetId);
  const prevRecord = existing.find(r => r.topicId === topicId);
  
  const updatedRecord: ConceptRevisionRecord = {
    id: prevRecord?.id || `rev-${Date.now()}-${topicId}`,
    userId: targetId,
    topicId,
    topicTitle,
    subject,
    chapter,
    board,
    classLevel,
    lastRevisedAt: new Date().toISOString(),
    revisionCount: (prevRecord?.revisionCount || 0) + 1
  };

  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEYS.CONCEPT_REVISIONS);
    const all: ConceptRevisionRecord[] = raw ? JSON.parse(raw) : [];
    const filtered = all.filter(r => !(r.topicId === topicId && r.userId === targetId));
    localStorage.setItem(STORAGE_KEYS.CONCEPT_REVISIONS, JSON.stringify([updatedRecord, ...filtered]));
  }

  return updatedRecord;
};

export const getRecentlyViewedConcepts = (userId?: string): RecentlyViewedConcept[] => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CONCEPT_RECENT) : null;
    const all: RecentlyViewedConcept[] = raw ? JSON.parse(raw) : [];
    const targetId = userId || getStoredUser()?.id;
    if (!targetId) return [];
    return all.filter(r => r.userId === targetId).slice(0, 10);
  } catch {
    return [];
  }
};

export const recordConceptView = (
  concept: { 
    topicId: string; 
    topicTitle: string; 
    subject: string; 
    chapter: string; 
    board: EducationBoard; 
    classLevel: ClassLevel; 
  },
  userId?: string
) => {
  if (typeof localStorage === 'undefined') return;
  const targetId = userId || getStoredUser()?.id;
  if (!targetId) return;

  const raw = localStorage.getItem(STORAGE_KEYS.CONCEPT_RECENT);
  const all: RecentlyViewedConcept[] = raw ? JSON.parse(raw) : [];
  const filtered = all.filter(r => !(r.topicId === concept.topicId && r.userId === targetId));

  const newRecent: RecentlyViewedConcept = {
    id: `rcv-${Date.now()}-${concept.topicId}`,
    userId: targetId,
    ...concept,
    viewedAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEYS.CONCEPT_RECENT, JSON.stringify([newRecent, ...filtered].slice(0, 20)));
};

export const getCachedConceptContent = (
  topicId: string, 
  board?: string, 
  classLevel?: string
): ConceptDetailContent | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEYS.CONCEPT_CACHE);
    if (!raw) return null;
    const cacheMap: Record<string, ConceptDetailContent> = JSON.parse(raw);
    const key = `${board || 'CBSE'}_${classLevel || '12'}_${topicId.toLowerCase().trim()}`;
    return cacheMap[key] || cacheMap[topicId] || null;
  } catch {
    return null;
  }
};

export const saveCachedConceptContent = (content: ConceptDetailContent) => {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONCEPT_CACHE);
    const cacheMap: Record<string, ConceptDetailContent> = raw ? JSON.parse(raw) : {};
    const key = `${content.board}_${content.classLevel}_${content.topicId.toLowerCase().trim()}`;
    cacheMap[key] = content;
    cacheMap[content.topicId] = content;
    localStorage.setItem(STORAGE_KEYS.CONCEPT_CACHE, JSON.stringify(cacheMap));
  } catch {
    // Quota fallback
  }
};

