import type { 
  PracticeAttempt, 
  StudySession, 
  WeakTopicAnalysis,
  Subject
} from '../types';

export type DateFilterRange = '7d' | '30d' | '90d' | 'all' | 'custom';

export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface SubjectAccuracyMetric {
  subject: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number | null; // null if 0 attempts (honest empty state)
  color: string;
}

export interface AnalyticsSummaryMetrics {
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  overallAccuracy: number | null; // null if 0 attempts
  activeDaysCount: number;
  totalStudySeconds: number;
  studyTimeHours: number;
  studyTimeMinutes: number;
  currentStreakDays: number;
  activeQueriesCount: number;
}

export interface LearningTrajectoryPoint {
  label: string;
  periodStart: string;
  periodEnd: string;
  Overall: number | null;
  Physics: number | null;
  Mathematics: number | null;
  Chemistry: number | null;
  attemptsCount: number;
}

export interface HeatmapDayRecord {
  date: string;         // YYYY-MM-DD
  displayDate: string;  // e.g. "Oct 12"
  activeMinutes: number;
  attemptsCount: number;
  isQualifying: boolean;
  level: 0 | 1 | 2 | 3;
}

// Fixed standard subject palette
export const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#6366f1',     // Indigo
  Mathematics: '#a855f7', // Purple
  Chemistry: '#06b6d4',   // Cyan
  Biology: '#10b981'      // Emerald
};

/**
 * Normalizes any timestamp or Date into 'YYYY-MM-DD' calendar string in local timezone.
 */
export function toCalendarDateString(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes calendar date cutoff for a given date range filter.
 */
export function getStartDateForFilter(range: DateFilterRange, custom?: CustomDateRange): Date | null {
  const now = new Date();
  if (range === 'all') return null;
  if (range === 'custom' && custom?.startDate) {
    const customStart = new Date(custom.startDate);
    customStart.setHours(0, 0, 0, 0);
    return customStart;
  }
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  if (range === '7d') cutoff.setDate(cutoff.getDate() - 6); // past 7 days inclusive of today
  else if (range === '30d') cutoff.setDate(cutoff.getDate() - 29);
  else if (range === '90d') cutoff.setDate(cutoff.getDate() - 89);
  return cutoff;
}

/**
 * Deduplicates study sessions and filters out idle/corrupted sessions.
 * Excludes sessions where trackedSeconds < 60 (at least 1 minute of active study required).
 */
export function deduplicateAndFilterStudySessions(sessions: StudySession[]): StudySession[] {
  const seenIds = new Set<string>();
  const validSessions: StudySession[] = [];

  for (const session of sessions) {
    if (!session.id || seenIds.has(session.id)) continue;
    seenIds.add(session.id);

    // Validate timestamps
    const startTime = new Date(session.startedAt).getTime();
    if (isNaN(startTime)) continue;

    // Filter idle sessions: Must have logged at least 60 seconds of verified activity
    if (typeof session.trackedSeconds !== 'number' || session.trackedSeconds < 60) {
      continue;
    }

    validSessions.push(session);
  }

  return validSessions;
}

/**
 * Filters attempts by selected date range.
 */
export function filterAttemptsByDateRange(
  attempts: PracticeAttempt[],
  range: DateFilterRange,
  custom?: CustomDateRange
): PracticeAttempt[] {
  const startDate = getStartDateForFilter(range, custom);
  let endDate: Date | null = null;
  if (range === 'custom' && custom?.endDate) {
    endDate = new Date(custom.endDate);
    endDate.setHours(23, 59, 59, 999);
  }

  return attempts.filter(att => {
    const d = new Date(att.attemptedAt);
    if (isNaN(d.getTime())) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });
}

/**
 * Calculates genuine subject accuracy metrics with sample counts.
 * Returns honest null accuracy for subjects with 0 attempts.
 */
export function calculateSubjectAccuracy(
  attempts: PracticeAttempt[],
  subjectList: string[] = ['Physics', 'Mathematics', 'Chemistry']
): SubjectAccuracyMetric[] {
  return subjectList.map(subj => {
    const subjectAttempts = attempts.filter(a => a.subject.toLowerCase() === subj.toLowerCase());
    const total = subjectAttempts.length;
    const correct = subjectAttempts.filter(a => a.isCorrect).length;
    const incorrect = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 1000) / 10 : null;

    return {
      subject: subj,
      totalAttempts: total,
      correctAttempts: correct,
      incorrectAttempts: incorrect,
      accuracy,
      color: SUBJECT_COLORS[subj] || '#6366f1'
    };
  });
}

/**
 * Calculates genuine learning summary metrics.
 * Excludes idle time, deduplicates sessions, and uses honest nulls if 0 attempts.
 */
export function calculateAnalyticsSummary(
  attempts: PracticeAttempt[],
  sessions: StudySession[],
  queriesCount: number = 0,
  range: DateFilterRange = 'all',
  customRange?: CustomDateRange
): AnalyticsSummaryMetrics {
  const filteredAttempts = filterAttemptsByDateRange(attempts, range, customRange);
  const cleanSessions = deduplicateAndFilterStudySessions(sessions);

  // Filter sessions by date range
  const startDate = getStartDateForFilter(range, customRange);
  let endDate: Date | null = null;
  if (range === 'custom' && customRange?.endDate) {
    endDate = new Date(customRange.endDate);
    endDate.setHours(23, 59, 59, 999);
  }

  const filteredSessions = cleanSessions.filter(sess => {
    const d = new Date(sess.startedAt);
    if (isNaN(d.getTime())) return false;
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    return true;
  });

  // 1. Attempts metrics
  const totalAttempts = filteredAttempts.length;
  const correctAttempts = filteredAttempts.filter(a => a.isCorrect).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const overallAccuracy = totalAttempts > 0 
    ? Math.round((correctAttempts / totalAttempts) * 1000) / 10 
    : null;

  // 2. Active study seconds (sum of clean, non-idle sessions)
  let totalStudySeconds = 0;
  filteredSessions.forEach(s => {
    totalStudySeconds += (s.trackedSeconds || 0);
  });

  const studyTimeHours = Math.floor(totalStudySeconds / 3600);
  const studyTimeMinutes = Math.floor((totalStudySeconds % 3600) / 60);

  // 3. Qualifying active days in selected period
  const activeDaysSet = new Set<string>();
  filteredSessions.forEach(s => {
    const cal = toCalendarDateString(s.startedAt);
    if (cal) activeDaysSet.add(cal);
  });
  filteredAttempts.forEach(a => {
    const cal = toCalendarDateString(a.attemptedAt);
    if (cal) activeDaysSet.add(cal);
  });
  const activeDaysCount = activeDaysSet.size;

  // 4. Consecutive streak days (unbroken consecutive days working backwards from today or yesterday)
  const allQualifyingDays = new Set<string>();
  cleanSessions.forEach(s => {
    const cal = toCalendarDateString(s.startedAt);
    if (cal) allQualifyingDays.add(cal);
  });
  attempts.forEach(a => {
    const cal = toCalendarDateString(a.attemptedAt);
    if (cal) allQualifyingDays.add(cal);
  });

  let currentStreak = 0;
  const todayStr = toCalendarDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toCalendarDateString(yesterday);

  // If active today, anchor on today; else if active yesterday, anchor on yesterday (preserves current streak)
  let checkCursor: Date | null = null;
  if (allQualifyingDays.has(todayStr)) {
    checkCursor = new Date();
  } else if (allQualifyingDays.has(yesterdayStr)) {
    checkCursor = yesterday;
  }

  if (checkCursor) {
    while (true) {
      const curStr = toCalendarDateString(checkCursor);
      if (allQualifyingDays.has(curStr)) {
        currentStreak++;
        checkCursor.setDate(checkCursor.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return {
    totalAttempts,
    correctAttempts,
    incorrectAttempts,
    overallAccuracy,
    activeDaysCount,
    totalStudySeconds,
    studyTimeHours,
    studyTimeMinutes,
    currentStreakDays: currentStreak,
    activeQueriesCount: queriesCount
  };
}

/**
 * Computes topic-level evidence strictly according to Section 8:
 * - Accuracy = correct eligible / total eligible * 100
 * - Does NOT classify as weak solely from 1 wrong answer
 * - Less than 3 attempts labeled "Needs More Evidence"
 * - Categories: Needs More Evidence (<3), Needs Practice (<60%), Improving (60-79%), Doing Well (>=80%)
 */
export function calculateTopicEvidence(
  attempts: PracticeAttempt[],
  topicMetaMap: Record<string, { 
    subject: Subject; 
    chapter: string; 
    mistakePatterns: string[]; 
    prerequisites: string[]; 
    suggestedRevision: string; 
  }>
): WeakTopicAnalysis[] {
  const grouped: Record<string, PracticeAttempt[]> = {};
  attempts.forEach(att => {
    if (!grouped[att.topic]) grouped[att.topic] = [];
    grouped[att.topic].push(att);
  });

  const MIN_ATTEMPTS_THRESHOLD = 3;

  const result: WeakTopicAnalysis[] = Object.keys(topicMetaMap).map(topicName => {
    const topicAttempts = grouped[topicName] || [];
    const meta = topicMetaMap[topicName];
    const eligibleCount = topicAttempts.length;
    const correctCount = topicAttempts.filter(a => a.isCorrect).length;
    const incorrectCount = eligibleCount - correctCount;

    let accuracy = 0;
    let category: WeakTopicAnalysis['category'] = 'Needs More Evidence';
    let trend: WeakTopicAnalysis['trend'] = 'stable';

    if (eligibleCount < MIN_ATTEMPTS_THRESHOLD) {
      category = 'Needs More Evidence';
      accuracy = eligibleCount > 0 ? Math.round((correctCount / eligibleCount) * 100) : 0;
      trend = 'unknown';
    } else {
      accuracy = Math.round((correctCount / eligibleCount) * 100);
      if (accuracy < 60) {
        category = 'Needs Practice';
      } else if (accuracy < 80) {
        category = 'Improving';
      } else {
        category = 'Doing Well';
      }

      // Check trend: compare older half of attempts vs newer half
      if (eligibleCount >= 4) {
        const half = Math.floor(eligibleCount / 2);
        const sorted = [...topicAttempts].sort((a, b) => new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime());
        const older = sorted.slice(0, half);
        const newer = sorted.slice(half);
        const olderAcc = older.filter(a => a.isCorrect).length / older.length;
        const newerAcc = newer.filter(a => a.isCorrect).length / newer.length;
        if (newerAcc > olderAcc) trend = 'improving';
        else if (newerAcc < olderAcc) trend = 'declining';
        else trend = 'stable';
      }
    }

    const recommendedAction = category === 'Needs Practice'
      ? 'Complete targeted practice on core formulas and lone-pair/sign conventions.'
      : category === 'Needs More Evidence'
      ? `Attempt at least ${MIN_ATTEMPTS_THRESHOLD - eligibleCount} more questions to establish reliable concept mastery.`
      : category === 'Improving'
      ? 'Great progress! Attempt 2 challenging questions to lock in mastery.'
      : 'Maintain mastery with periodic spaced-repetition practice.';

    return {
      topic: topicName,
      subject: meta.subject,
      chapter: meta.chapter,
      eligibleAttempts: eligibleCount,
      correctCount,
      incorrectCount,
      accuracy,
      category,
      trend,
      mistakePatterns: meta.mistakePatterns,
      suggestedRevision: meta.suggestedRevision,
      prerequisiteConcepts: meta.prerequisites,
      recommendedAction
    };
  });

  const sortOrder: Record<string, number> = {
    'Needs Practice': 1,
    'Improving': 2,
    'Needs More Evidence': 3,
    'Doing Well': 4
  };

  return result.sort((a, b) => sortOrder[a.category] - sortOrder[b.category] || a.accuracy - b.accuracy);
}

/**
 * Builds chronological learning trajectory graph data from actual attempts records.
 * Returns honest nulls for periods with no attempts.
 */
export function buildLearningTrajectory(
  attempts: PracticeAttempt[],
  range: DateFilterRange = '30d'
): LearningTrajectoryPoint[] {
  if (attempts.length === 0) return [];

  const now = new Date();
  const points: LearningTrajectoryPoint[] = [];

  if (range === '7d') {
    // 7 daily points (Day -6 to Day 0)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const calStr = toCalendarDateString(d);
      const dayAttempts = attempts.filter(a => toCalendarDateString(a.attemptedAt) === calStr);
      const count = dayAttempts.length;

      const correct = dayAttempts.filter(a => a.isCorrect).length;
      const overall = count > 0 ? Math.round((correct / count) * 100) : null;

      const calcSubj = (subj: string) => {
        const sa = dayAttempts.filter(a => a.subject === subj);
        return sa.length > 0 ? Math.round((sa.filter(a => a.isCorrect).length / sa.length) * 100) : null;
      };

      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      points.push({
        label: dayLabel,
        periodStart: calStr,
        periodEnd: calStr,
        Overall: overall,
        Physics: calcSubj('Physics'),
        Mathematics: calcSubj('Mathematics'),
        Chemistry: calcSubj('Chemistry'),
        attemptsCount: count
      });
    }
  } else {
    // 30d, 90d, all: Group into chronological intervals
    const bucketDays = range === '90d' ? 18 : 6;
    const bucketCount = 5;

    for (let b = bucketCount - 1; b >= 0; b--) {
      const startD = new Date(now);
      startD.setDate(startD.getDate() - (b + 1) * bucketDays + 1);
      startD.setHours(0, 0, 0, 0);

      const endD = new Date(now);
      endD.setDate(endD.getDate() - b * bucketDays);
      endD.setHours(23, 59, 59, 999);

      const bucketAttempts = attempts.filter(a => {
        const ad = new Date(a.attemptedAt);
        return ad >= startD && ad <= endD;
      });

      const count = bucketAttempts.length;
      const correct = bucketAttempts.filter(a => a.isCorrect).length;
      const overall = count > 0 ? Math.round((correct / count) * 100) : null;

      const calcSubj = (subj: string) => {
        const sa = bucketAttempts.filter(a => a.subject === subj);
        return sa.length > 0 ? Math.round((sa.filter(a => a.isCorrect).length / sa.length) * 100) : null;
      };

      const label = b === 0 
        ? 'Current' 
        : `${startD.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

      points.push({
        label,
        periodStart: toCalendarDateString(startD),
        periodEnd: toCalendarDateString(endD),
        Overall: overall,
        Physics: calcSubj('Physics'),
        Mathematics: calcSubj('Mathematics'),
        Chemistry: calcSubj('Chemistry'),
        attemptsCount: count
      });
    }
  }

  return points;
}

/**
 * Builds real 30-day activity heatmap data from actual database records.
 * Level 0 = 0 activity, Level 1 = 1-20m, Level 2 = 21-45m, Level 3 = 46m+.
 */
export function buildActivityHeatmap(
  sessions: StudySession[],
  attempts: PracticeAttempt[]
): HeatmapDayRecord[] {
  const cleanSessions = deduplicateAndFilterStudySessions(sessions);
  const today = new Date();
  const records: HeatmapDayRecord[] = [];

  for (let i = 29; i >= 0; i--) {
    const curDate = new Date(today);
    curDate.setDate(today.getDate() - i);
    const calStr = toCalendarDateString(curDate);

    // Sum active session seconds on this exact calendar day
    let activeSecs = 0;
    cleanSessions.forEach(s => {
      if (toCalendarDateString(s.startedAt) === calStr) {
        activeSecs += (s.trackedSeconds || 0);
      }
    });

    const activeMinutes = Math.floor(activeSecs / 60);

    // Count practice attempts on this day
    const attemptsCount = attempts.filter(a => toCalendarDateString(a.attemptedAt) === calStr).length;

    const isQualifying = activeMinutes >= 1 || attemptsCount > 0;

    let level: 0 | 1 | 2 | 3 = 0;
    if (activeMinutes >= 45 || attemptsCount >= 6) {
      level = 3;
    } else if (activeMinutes >= 20 || attemptsCount >= 3) {
      level = 2;
    } else if (isQualifying) {
      level = 1;
    }

    records.push({
      date: calStr,
      displayDate: curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      activeMinutes,
      attemptsCount,
      isQualifying,
      level
    });
  }

  return records;
}
