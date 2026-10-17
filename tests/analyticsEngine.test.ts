import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  toCalendarDateString, 
  getStartDateForFilter,
  deduplicateAndFilterStudySessions,
  filterAttemptsByDateRange,
  calculateSubjectAccuracy,
  calculateAnalyticsSummary,
  calculateTopicEvidence,
  buildLearningTrajectory,
  buildActivityHeatmap
} from '../src/lib/analyticsEngine.ts';
import type { PracticeAttempt, StudySession, Subject } from '../src/types/index.ts';

const SAMPLE_TOPIC_META: Record<string, {
  subject: Subject;
  chapter: string;
  mistakePatterns: string[];
  prerequisites: string[];
  suggestedRevision: string;
}> = {
  'VSEPR Theory & Molecular Geometry': {
    subject: 'Chemistry',
    chapter: 'Chemical Bonding',
    mistakePatterns: ['Confusing electron geometry with molecular shape'],
    prerequisites: ['Lewis Electron Dot Structures'],
    suggestedRevision: 'Count bonding vs non-bonding electron pairs.'
  },
  'Carnot Heat Engine & Efficiency': {
    subject: 'Physics',
    chapter: 'Thermodynamics',
    mistakePatterns: ['Calculating efficiency using Celsius rather than Kelvin'],
    prerequisites: ['First Law of Thermodynamics'],
    suggestedRevision: 'Convert all temperatures to Kelvin.'
  },
  "Newton's Second Law & Momentum": {
    subject: 'Physics',
    chapter: 'Laws of Motion',
    mistakePatterns: ['Confusing impulse with work'],
    prerequisites: ['Kinematics Equations in 1D'],
    suggestedRevision: 'Sketch a clean Free Body Diagram.'
  }
};

describe('ConceptTrace AI Analytics Engine — Rigorous Unit Tests', () => {

  // 1. Calendar Date Normalization
  test('toCalendarDateString: accurately converts dates and timestamps', () => {
    const d = new Date(2026, 9, 17, 14, 30, 0); // Oct 17, 2026
    assert.equal(toCalendarDateString(d), '2026-10-17');
    assert.equal(toCalendarDateString('2026-05-04T12:00:00Z').length, 10);
    assert.equal(toCalendarDateString('invalid-date'), '');
  });

  // 2. Date Filtering Boundaries
  test('getStartDateForFilter: calculates correct boundary cutoffs', () => {
    const now = new Date();
    const start7d = getStartDateForFilter('7d');
    assert.ok(start7d !== null);
    
    // Difference between now and start7d should be approx 6 days (7 days inclusive)
    const diffDays7d = Math.round((now.getTime() - start7d.getTime()) / (1000 * 3600 * 24));
    assert.ok(diffDays7d >= 6 && diffDays7d <= 7);

    assert.equal(getStartDateForFilter('all'), null);

    const custom = getStartDateForFilter('custom', { startDate: '2026-01-01', endDate: '2026-01-31' });
    assert.ok(custom !== null);
    assert.equal(custom.getFullYear(), 2026);
    assert.equal(custom.getMonth(), 0);
    assert.equal(custom.getDate(), 1);
  });

  // 3. Study Session Deduplication & Idle Interval Exclusion
  test('deduplicateAndFilterStudySessions: excludes idle sessions and eliminates duplicate IDs', () => {
    const rawSessions: StudySession[] = [
      {
        id: 'sess-1',
        userId: 'student-1',
        startedAt: '2026-10-16T10:00:00Z',
        lastActiveAt: '2026-10-16T10:45:00Z',
        trackedSeconds: 2700, // 45 minutes active (valid)
        sessionStatus: 'completed'
      },
      {
        id: 'sess-1', // DUPLICATE ID
        userId: 'student-1',
        startedAt: '2026-10-16T10:00:00Z',
        lastActiveAt: '2026-10-16T10:45:00Z',
        trackedSeconds: 2700,
        sessionStatus: 'completed'
      },
      {
        id: 'sess-idle',
        userId: 'student-1',
        startedAt: '2026-10-16T11:00:00Z',
        lastActiveAt: '2026-10-16T11:00:40Z',
        trackedSeconds: 40, // IDLE INTERVAL (< 60s inactivity threshold)
        sessionStatus: 'completed'
      },
      {
        id: 'sess-corrupt',
        userId: 'student-1',
        startedAt: 'invalid-timestamp',
        lastActiveAt: 'invalid-timestamp',
        trackedSeconds: 300,
        sessionStatus: 'completed'
      },
      {
        id: 'sess-2',
        userId: 'student-1',
        startedAt: '2026-10-16T12:00:00Z',
        lastActiveAt: '2026-10-16T12:02:00Z',
        trackedSeconds: 120, // 2 minutes active (valid)
        sessionStatus: 'completed'
      }
    ];

    const clean = deduplicateAndFilterStudySessions(rawSessions);

    // Only sess-1 and sess-2 should survive
    assert.equal(clean.length, 2);
    assert.equal(clean[0].id, 'sess-1');
    assert.equal(clean[1].id, 'sess-2');
  });

  // 4. Subject Accuracy with Sample Counts & Honest Empty States
  test('calculateSubjectAccuracy: outputs accurate percentage with sample counts, returns null when 0 attempts', () => {
    const attempts: PracticeAttempt[] = [
      {
        id: 'a1',
        userId: 's1',
        sessionId: 'sess-1',
        questionId: 'q1',
        questionText: 'Q1',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: "Newton's Second Law & Momentum",
        timeSpentSeconds: 45,
        attemptedAt: '2026-10-16T10:00:00Z'
      },
      {
        id: 'a2',
        userId: 's1',
        sessionId: 'sess-1',
        questionId: 'q2',
        questionText: 'Q2',
        submittedAnswer: 'B',
        correctAnswer: 'A',
        isCorrect: false,
        subject: 'Physics',
        topic: "Newton's Second Law & Momentum",
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-16T10:02:00Z'
      },
      {
        id: 'a3',
        userId: 's1',
        sessionId: 'sess-1',
        questionId: 'q3',
        questionText: 'Q3',
        submittedAnswer: 'C',
        correctAnswer: 'C',
        isCorrect: true,
        subject: 'Physics',
        topic: "Newton's Second Law & Momentum",
        timeSpentSeconds: 50,
        attemptedAt: '2026-10-16T10:05:00Z'
      },
      {
        id: 'a4',
        userId: 's1',
        sessionId: 'sess-1',
        questionId: 'q4',
        questionText: 'Q4',
        submittedAnswer: 'D',
        correctAnswer: 'D',
        isCorrect: true,
        subject: 'Physics',
        topic: "Newton's Second Law & Momentum",
        timeSpentSeconds: 40,
        attemptedAt: '2026-10-16T10:08:00Z'
      }
    ];

    const results = calculateSubjectAccuracy(attempts, ['Physics', 'Mathematics', 'Chemistry']);
    
    // Physics: 3 correct out of 4 attempts = 75.0%
    const physics = results.find(r => r.subject === 'Physics')!;
    assert.equal(physics.totalAttempts, 4);
    assert.equal(physics.correctAttempts, 3);
    assert.equal(physics.incorrectAttempts, 1);
    assert.equal(physics.accuracy, 75.0);

    // Mathematics: 0 attempts -> Honest empty state (null accuracy, not 0% or fake default)
    const maths = results.find(r => r.subject === 'Mathematics')!;
    assert.equal(maths.totalAttempts, 0);
    assert.equal(maths.correctAttempts, 0);
    assert.equal(maths.incorrectAttempts, 0);
    assert.equal(maths.accuracy, null);

    // Chemistry: 0 attempts -> Honest empty state
    const chem = results.find(r => r.subject === 'Chemistry')!;
    assert.equal(chem.totalAttempts, 0);
    assert.equal(chem.accuracy, null);
  });

  // 5. Topic-Level Evidence Thresholds (Master Prompt Section 8)
  test('calculateTopicEvidence: strictly enforces Section 8 evidence thresholds', () => {
    const attempts: PracticeAttempt[] = [
      // Topic 1: VSEPR Theory (2 attempts only -> MUST be "Needs More Evidence", never "Needs Practice")
      {
        id: 'v1',
        userId: 's1',
        sessionId: 's',
        questionId: 'qv1',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'B',
        isCorrect: false, // 1st mistake
        subject: 'Chemistry',
        topic: 'VSEPR Theory & Molecular Geometry',
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-15T09:00:00Z'
      },
      {
        id: 'v2',
        userId: 's1',
        sessionId: 's',
        questionId: 'qv2',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'B',
        isCorrect: false, // 2nd mistake
        subject: 'Chemistry',
        topic: 'VSEPR Theory & Molecular Geometry',
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-15T09:05:00Z'
      },

      // Topic 2: Carnot Heat Engine (4 attempts: 1 correct, 3 wrong -> 25% -> "Needs Practice")
      {
        id: 'c1',
        userId: 's1',
        sessionId: 's',
        questionId: 'qc1',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'B',
        isCorrect: false,
        subject: 'Physics',
        topic: 'Carnot Heat Engine & Efficiency',
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-14T09:00:00Z'
      },
      {
        id: 'c2',
        userId: 's1',
        sessionId: 's',
        questionId: 'qc2',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'B',
        isCorrect: false,
        subject: 'Physics',
        topic: 'Carnot Heat Engine & Efficiency',
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-14T09:05:00Z'
      },
      {
        id: 'c3',
        userId: 's1',
        sessionId: 's',
        questionId: 'qc3',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'B',
        isCorrect: false,
        subject: 'Physics',
        topic: 'Carnot Heat Engine & Efficiency',
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-15T09:00:00Z'
      },
      {
        id: 'c4',
        userId: 's1',
        sessionId: 's',
        questionId: 'qc4',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: 'Carnot Heat Engine & Efficiency',
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-15T09:05:00Z'
      },

      // Topic 3: Newton's Second Law (4 attempts: all correct -> 100% -> "Doing Well")
      {
        id: 'n1',
        userId: 's1',
        sessionId: 's',
        questionId: 'qn1',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: "Newton's Second Law & Momentum",
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-16T09:00:00Z'
      },
      {
        id: 'n2',
        userId: 's1',
        sessionId: 's',
        questionId: 'qn2',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: "Newton's Second Law & Momentum",
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-16T09:05:00Z'
      },
      {
        id: 'n3',
        userId: 's1',
        sessionId: 's',
        questionId: 'qn3',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: "Newton's Second Law & Momentum",
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-16T09:10:00Z'
      },
      {
        id: 'n4',
        userId: 's1',
        sessionId: 's',
        questionId: 'qn4',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: "Newton's Second Law & Momentum",
        timeSpentSeconds: 30,
        attemptedAt: '2026-10-16T09:15:00Z'
      }
    ];

    const topics = calculateTopicEvidence(attempts, SAMPLE_TOPIC_META);

    // VSEPR Theory: despite 0% accuracy, only 2 attempts -> MUST be "Needs More Evidence"
    const vsepr = topics.find(t => t.topic === 'VSEPR Theory & Molecular Geometry')!;
    assert.equal(vsepr.eligibleAttempts, 2);
    assert.equal(vsepr.category, 'Needs More Evidence');

    // Carnot Engine: 4 attempts, 25% -> "Needs Practice"
    const carnot = topics.find(t => t.topic === 'Carnot Heat Engine & Efficiency')!;
    assert.equal(carnot.eligibleAttempts, 4);
    assert.equal(carnot.accuracy, 25);
    assert.equal(carnot.category, 'Needs Practice');

    // Newton's Second Law: 4 attempts, 100% -> "Doing Well"
    const newton = topics.find(t => t.topic === "Newton's Second Law & Momentum")!;
    assert.equal(newton.eligibleAttempts, 4);
    assert.equal(newton.accuracy, 100);
    assert.equal(newton.category, 'Doing Well');
  });

  // 6. Active Days, Idle Time Exclusion, & Consecutive Streaks
  test('calculateAnalyticsSummary: handles active days, idle time exclusion, streaks, and empty states', () => {
    const now = new Date();
    const d0 = toCalendarDateString(now); // today
    const d1Date = new Date(now);
    d1Date.setDate(d1Date.getDate() - 1);
    const d1 = toCalendarDateString(d1Date); // yesterday
    const d2Date = new Date(now);
    d2Date.setDate(d2Date.getDate() - 2);
    const d2 = toCalendarDateString(d2Date); // 2 days ago

    const sessions: StudySession[] = [
      {
        id: 's-today',
        userId: 's1',
        startedAt: `${d0}T10:00:00Z`,
        lastActiveAt: `${d0}T10:30:00Z`,
        trackedSeconds: 1800, // 30m
        sessionStatus: 'completed'
      },
      {
        id: 's-today-idle', // should be excluded (< 60s)
        userId: 's1',
        startedAt: `${d0}T11:00:00Z`,
        lastActiveAt: `${d0}T11:00:20Z`,
        trackedSeconds: 20,
        sessionStatus: 'completed'
      },
      {
        id: 's-yesterday',
        userId: 's1',
        startedAt: `${d1}T10:00:00Z`,
        lastActiveAt: `${d1}T10:45:00Z`,
        trackedSeconds: 2700, // 45m
        sessionStatus: 'completed'
      },
      {
        id: 's-2daysago',
        userId: 's1',
        startedAt: `${d2}T10:00:00Z`,
        lastActiveAt: `${d2}T10:50:00Z`,
        trackedSeconds: 3000, // 50m
        sessionStatus: 'completed'
      }
    ];

    const attempts: PracticeAttempt[] = [
      {
        id: 'att-1',
        userId: 's1',
        sessionId: 's-today',
        questionId: 'q1',
        questionText: 'Q1',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: 'Newton',
        timeSpentSeconds: 30,
        attemptedAt: `${d0}T10:15:00Z`
      }
    ];

    const summary = calculateAnalyticsSummary(attempts, sessions, 3, 'all');

    // 1. Total study seconds: 1800 + 2700 + 3000 = 7500s (2h 5m)
    // Idle 20s must be completely excluded!
    assert.equal(summary.totalStudySeconds, 7500);
    assert.equal(summary.studyTimeHours, 2);
    assert.equal(summary.studyTimeMinutes, 5);

    // 2. Active days: 3 distinct qualifying days (d0, d1, d2)
    assert.equal(summary.activeDaysCount, 3);

    // 3. Consecutive streak: active today, yesterday, and 2 days ago -> 3 days
    assert.equal(summary.currentStreakDays, 3);

    // 4. Overall accuracy: 1 attempt, 1 correct -> 100.0%
    assert.equal(summary.overallAccuracy, 100.0);
    assert.equal(summary.totalAttempts, 1);
    assert.equal(summary.correctAttempts, 1);

    // 5. Test empty student (0 attempts, 0 sessions)
    const emptySummary = calculateAnalyticsSummary([], [], 0, 'all');
    assert.equal(emptySummary.totalAttempts, 0);
    assert.equal(emptySummary.overallAccuracy, null); // Honest empty state!
    assert.equal(emptySummary.activeDaysCount, 0);
    assert.equal(emptySummary.totalStudySeconds, 0);
    assert.equal(emptySummary.currentStreakDays, 0);
  });

  // 7. Streak Grace Period (Active yesterday, protected today)
  test('calculateAnalyticsSummary: protects current streak if student was active yesterday and has not yet logged in today', () => {
    const now = new Date();
    const d1Date = new Date(now);
    d1Date.setDate(d1Date.getDate() - 1);
    const d1 = toCalendarDateString(d1Date); // yesterday
    const d2Date = new Date(now);
    d2Date.setDate(d2Date.getDate() - 2);
    const d2 = toCalendarDateString(d2Date); // 2 days ago

    // No sessions today (d0)
    const sessions: StudySession[] = [
      {
        id: 's-yesterday',
        userId: 's1',
        startedAt: `${d1}T10:00:00Z`,
        lastActiveAt: `${d1}T10:45:00Z`,
        trackedSeconds: 2700,
        sessionStatus: 'completed'
      },
      {
        id: 's-2daysago',
        userId: 's1',
        startedAt: `${d2}T10:00:00Z`,
        lastActiveAt: `${d2}T10:50:00Z`,
        trackedSeconds: 3000,
        sessionStatus: 'completed'
      }
    ];

    const summary = calculateAnalyticsSummary([], sessions, 0, 'all');
    // Active yesterday and 2 days ago -> streak should be 2 (protected ongoing streak)
    assert.equal(summary.currentStreakDays, 2);
  });

  // 8. 30-Day Activity Heatmap
  test('buildActivityHeatmap: builds exactly 30 calendar days with accurate level classifications', () => {
    const todayStr = toCalendarDateString(new Date());
    const sessions: StudySession[] = [
      {
        id: 's-heavy',
        userId: 's1',
        startedAt: `${todayStr}T10:00:00Z`,
        lastActiveAt: `${todayStr}T11:00:00Z`,
        trackedSeconds: 3600, // 60 minutes -> level 3
        sessionStatus: 'completed'
      }
    ];

    const heatmap = buildActivityHeatmap(sessions, []);

    assert.equal(heatmap.length, 30);
    const todayCell = heatmap[heatmap.length - 1];
    assert.equal(todayCell.date, todayStr);
    assert.equal(todayCell.activeMinutes, 60);
    assert.equal(todayCell.level, 3);
    assert.equal(todayCell.isQualifying, true);

    // Days without activity should be level 0
    const emptyCell = heatmap[0];
    assert.equal(emptyCell.activeMinutes, 0);
    assert.equal(emptyCell.level, 0);
    assert.equal(emptyCell.isQualifying, false);
  });

  // 9. Chronological Learning Trajectory
  test('buildLearningTrajectory: returns empty array when no attempts, builds chronological points with null handling', () => {
    assert.deepEqual(buildLearningTrajectory([]), []);

    const now = new Date();
    const todayStr = toCalendarDateString(now);
    const attempts: PracticeAttempt[] = [
      {
        id: 'a1',
        userId: 's1',
        sessionId: 's',
        questionId: 'q',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: 'Newton',
        timeSpentSeconds: 20,
        attemptedAt: `${todayStr}T12:00:00Z`
      }
    ];

    const points7d = buildLearningTrajectory(attempts, '7d');
    assert.equal(points7d.length, 7);

    // Today's point
    const todayPoint = points7d[points7d.length - 1];
    assert.equal(todayPoint.periodStart, todayStr);
    assert.equal(todayPoint.Overall, 100);
    assert.equal(todayPoint.Physics, 100);
    assert.equal(todayPoint.Mathematics, null); // Honest null for Recharts connectNulls
    assert.equal(todayPoint.attemptsCount, 1);

    // An earlier day with 0 attempts
    const earlierPoint = points7d[0];
    assert.equal(earlierPoint.Overall, null);
    assert.equal(earlierPoint.attemptsCount, 0);
  });

  // 10. Date Range Filtering
  test('filterAttemptsByDateRange: correctly isolates custom and preset date intervals', () => {
    const attempts: PracticeAttempt[] = [
      {
        id: 'old',
        userId: 's1',
        sessionId: 's',
        questionId: 'q',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: 'Newton',
        timeSpentSeconds: 20,
        attemptedAt: '2026-01-01T12:00:00Z'
      },
      {
        id: 'recent',
        userId: 's1',
        sessionId: 's',
        questionId: 'q',
        questionText: 'Q',
        submittedAnswer: 'A',
        correctAnswer: 'A',
        isCorrect: true,
        subject: 'Physics',
        topic: 'Newton',
        timeSpentSeconds: 20,
        attemptedAt: new Date().toISOString()
      }
    ];

    const filtered7d = filterAttemptsByDateRange(attempts, '7d');
    assert.equal(filtered7d.length, 1);
    assert.equal(filtered7d[0].id, 'recent');

    const filteredAll = filterAttemptsByDateRange(attempts, 'all');
    assert.equal(filteredAll.length, 2);

    const customFiltered = filterAttemptsByDateRange(attempts, 'custom', {
      startDate: '2025-12-31',
      endDate: '2026-01-02'
    });
    assert.equal(customFiltered.length, 1);
    assert.equal(customFiltered[0].id, 'old');
  });

});
