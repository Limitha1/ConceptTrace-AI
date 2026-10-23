import type { 
  ConceptDetailContent, 
  EducationBoard, 
  ClassLevel, 
  StudentStream,
  ConceptRevisionRecord
} from '../types/index.ts';
import { 
  CURATED_CONCEPTS, 
  getCuratedConceptContent, 
  generateStandardConceptContent 
} from './conceptLibraryData.ts';
import { 
  AUTHENTIC_SYLLABI 
} from './syllabusData.ts';
import { 
  getCachedConceptContent, 
  saveCachedConceptContent,
  getConceptBookmarks,
  saveConceptBookmark,
  removeConceptBookmark,
  isConceptBookmarked,
  getConceptRevisions,
  markConceptAsRevised,
  getRecentlyViewedConcepts,
  recordConceptView,
  calculateWeakTopics
} from './storage.ts';

export interface ConceptSearchResult {
  topicId: string;
  topicTitle: string;
  chapter: string;
  subject: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  subtopics?: string[];
  keyConcepts?: string[];
  matchReason: string;
}

export interface SuggestedRevisionItem {
  topicId: string;
  topicTitle: string;
  chapter: string;
  subject: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  reason: 'weak_topic' | 'bookmarked' | 'due_for_revision' | 'repeated_errors';
  reasonLabel: string;
  accuracy?: number | null;
  totalAttempts?: number;
  lastRevisedAt?: string;
  revisionCount?: number;
}

/**
 * Checks server AI availability status
 */
export async function checkConceptApiStatus(): Promise<{ online: boolean; aiConfigured: boolean; model?: string }> {
  try {
    const res = await fetch('/api/concept/status');
    if (!res.ok) return { online: false, aiConfigured: false };
    const data = await res.json();
    return {
      online: true,
      aiConfigured: Boolean(data.aiConfigured),
      model: data.activeModel
    };
  } catch {
    return { online: false, aiConfigured: false };
  }
}

/**
 * Fetches concept detail content using multi-tier strategy:
 * 1. Local persistence cache
 * 2. Pre-compiled verified curriculum database (zero latency)
 * 3. Backend AI generation endpoint (Gemini REST)
 * 4. Offline syllabus-grounded template fallback
 */
export async function fetchConceptDetail(params: {
  topicId: string;
  topicTitle: string;
  chapter: string;
  subject: string;
  board: EducationBoard;
  classLevel: ClassLevel;
  stream?: StudentStream;
  academicYear?: string;
  subtopics?: string[];
  keyConcepts?: string[];
  forceRefresh?: boolean;
}): Promise<{
  content: ConceptDetailContent;
  source: 'curated-official' | 'cached' | 'gemini-ai' | 'curriculum-template';
  message?: string;
}> {
  const { topicId, board, classLevel, forceRefresh } = params;

  // 1. Check persistent client cache if not forced refresh
  if (!forceRefresh) {
    const cached = getCachedConceptContent(topicId, board, classLevel);
    if (cached) {
      return { content: cached, source: 'cached' };
    }
  }

  // 2. Check authentic pre-compiled curated records
  const curated = getCuratedConceptContent(topicId);
  if (curated) {
    saveCachedConceptContent(curated);
    return { content: curated, source: 'curated-official' };
  }

  // 3. Try server API (which invokes Gemini if configured)
  try {
    const res = await fetch('/api/concept/detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        saveCachedConceptContent(json.data);
        return {
          content: json.data,
          source: json.source || 'gemini-ai',
          message: json.message
        };
      }
    }
  } catch (err) {
    console.warn('[conceptLibraryService] Server API unavailable, using offline syllabus generator:', err);
  }

  // 4. Offline fallback grounded in authentic syllabus data
  const fallback = generateStandardConceptContent(params);
  saveCachedConceptContent(fallback);
  return {
    content: fallback,
    source: 'curriculum-template',
    message: 'Displaying authentic curriculum template grounded in board syllabus specifications.'
  };
}

/**
 * Real-time search across subjects, chapters, topics, subtopics, and key concepts
 */
export function searchConceptLibrary(
  query: string,
  filters?: {
    board?: EducationBoard;
    classLevel?: ClassLevel;
    subject?: string;
  }
): ConceptSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: ConceptSearchResult[] = [];
  const seenKeys = new Set<string>();

  // 1. Search in Curated Concepts first
  for (const c of CURATED_CONCEPTS) {
    if (filters?.board && c.board !== filters.board) continue;
    if (filters?.classLevel && c.classLevel !== filters.classLevel) continue;
    if (filters?.subject && filters.subject !== 'All' && c.subject.toLowerCase() !== filters.subject.toLowerCase()) continue;

    let matchReason = '';
    if (c.topicTitle.toLowerCase().includes(q)) matchReason = 'Topic Title Match';
    else if (c.chapter.toLowerCase().includes(q)) matchReason = 'Chapter Match';
    else if (c.subject.toLowerCase().includes(q)) matchReason = 'Subject Match';
    else if (c.overview.simpleIntro.toLowerCase().includes(q)) matchReason = 'Overview Content Match';
    else if (c.shortNotes.vitalTakeaways.some(t => t.toLowerCase().includes(q))) matchReason = 'Key Revision Note Match';

    if (matchReason) {
      const key = `${c.board}_${c.classLevel}_${c.topicId}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          topicId: c.topicId,
          topicTitle: c.topicTitle,
          chapter: c.chapter,
          subject: c.subject,
          board: c.board,
          classLevel: c.classLevel,
          matchReason
        });
      }
    }
  }

  // 2. Search through Authentic Syllabus tree
  for (const syl of AUTHENTIC_SYLLABI) {
    if (filters?.board && syl.board !== filters.board) continue;
    if (filters?.classLevel && syl.classLevel !== filters.classLevel) continue;
    if (filters?.subject && filters.subject !== 'All' && syl.subject.toLowerCase() !== filters.subject.toLowerCase()) continue;

    for (const unit of syl.units || []) {
      for (const ch of unit.chapters || []) {
        for (const top of ch.topics || []) {
          const key = `${syl.board}_${syl.classLevel}_${top.id}`;
          if (seenKeys.has(key)) continue;

          let matchReason = '';
          if (top.title.toLowerCase().includes(q)) matchReason = 'Topic Title Match';
          else if (ch.title.toLowerCase().includes(q)) matchReason = 'Chapter Match';
          else if (syl.subject.toLowerCase().includes(q)) matchReason = 'Subject Match';
          else if (top.keyConcepts?.some(kc => kc.toLowerCase().includes(q))) matchReason = 'Key Concept Match';
          else if (top.subtopics?.some(st => st.toLowerCase().includes(q))) matchReason = 'Subtopic Match';

          if (matchReason) {
            seenKeys.add(key);
            results.push({
              topicId: top.id,
              topicTitle: top.title,
              chapter: ch.title,
              subject: syl.subject,
              board: syl.board,
              classLevel: syl.classLevel,
              subtopics: top.subtopics,
              keyConcepts: top.keyConcepts,
              matchReason
            });
          }
        }
      }
    }
  }

  return results.slice(0, 25);
}

/**
 * Returns suggested revision topics based strictly on authentic student learning history.
 * Never fabricates recommendations when there are no attempts.
 */
export function getSuggestedRevisions(
  userId: string,
  userBoard?: EducationBoard,
  userClassLevel?: ClassLevel
): SuggestedRevisionItem[] {
  const suggestions: SuggestedRevisionItem[] = [];
  const seenTopics = new Set<string>();

  // 1. Weak Topics from genuine practice attempts
  const weakTopics = calculateWeakTopics(userId);
  for (const wt of weakTopics) {
    // Only prioritize topics where student actually struggled or has repeated errors
    if (wt.category === 'Needs Practice' || (wt.eligibleAttempts > 0 && wt.category === 'Needs More Evidence' && wt.accuracy !== null && wt.accuracy < 50)) {
      const topicKey = wt.topic.toLowerCase().trim();
      if (!seenTopics.has(topicKey)) {
        seenTopics.add(topicKey);

        // Find syllabus match if possible
        const syl = AUTHENTIC_SYLLABI.find(s => 
          s.subject.toLowerCase() === wt.subject.toLowerCase() &&
          (!userBoard || s.board === userBoard) &&
          (!userClassLevel || s.classLevel === userClassLevel)
        );

        let topicId = `top-${topicKey.replace(/[^a-z0-9]/g, '-')}`;
        let chapter = wt.chapter;

        if (syl) {
          for (const u of syl.units || []) {
            for (const ch of u.chapters || []) {
              const matchedTop = ch.topics.find(t => t.title.toLowerCase().includes(topicKey) || topicKey.includes(t.title.toLowerCase()));
              if (matchedTop) {
                topicId = matchedTop.id;
                chapter = ch.title;
                break;
              }
            }
          }
        }

        suggestions.push({
          topicId,
          topicTitle: wt.topic,
          chapter,
          subject: wt.subject,
          board: userBoard || 'CBSE',
          classLevel: userClassLevel || '12',
          reason: wt.eligibleAttempts >= 3 ? 'repeated_errors' : 'weak_topic',
          reasonLabel: wt.accuracy !== null ? `Low Accuracy (${wt.accuracy}%) in Practice` : 'Identified in Diagnostic Attempts',
          accuracy: wt.accuracy,
          totalAttempts: wt.eligibleAttempts
        });
      }
    }
  }

  // 2. Bookmarked topics that have not been revised in over 3 days
  const bookmarks = getConceptBookmarks(userId);
  const revisions = getConceptRevisions(userId);
  const revisionMap = new Map<string, ConceptRevisionRecord>();
  for (const r of revisions) {
    revisionMap.set(r.topicId, r);
  }

  const nowMs = Date.now();
  for (const bm of bookmarks) {
    const topicKey = bm.topicTitle.toLowerCase().trim();
    if (seenTopics.has(topicKey)) continue;

    const revRecord = revisionMap.get(bm.topicId);
    let isDue = false;
    let label = 'Saved to Bookmarks';

    if (!revRecord) {
      isDue = true;
      label = 'Bookmarked (Not yet revised)';
    } else {
      const daysSinceRev = (nowMs - new Date(revRecord.lastRevisedAt).getTime()) / (1000 * 3600 * 24);
      if (daysSinceRev > 3) {
        isDue = true;
        label = `Bookmarked (${Math.floor(daysSinceRev)} days since last revision)`;
      }
    }

    if (isDue) {
      seenTopics.add(topicKey);
      suggestions.push({
        topicId: bm.topicId,
        topicTitle: bm.topicTitle,
        chapter: bm.chapter,
        subject: bm.subject,
        board: bm.board,
        classLevel: bm.classLevel,
        reason: 'due_for_revision',
        reasonLabel: label,
        lastRevisedAt: revRecord?.lastRevisedAt,
        revisionCount: revRecord?.revisionCount || 0
      });
    }
  }

  return suggestions.slice(0, 6);
}

// Re-export storage helpers for convenience
export {
  getConceptBookmarks,
  saveConceptBookmark,
  removeConceptBookmark,
  isConceptBookmarked,
  getConceptRevisions,
  markConceptAsRevised,
  getRecentlyViewedConcepts,
  recordConceptView
};
