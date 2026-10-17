import type { 
  EducationBoard, 
  ClassLevel, 
  StudentStream, 
  EducationProfile, 
  SubjectSyllabus 
} from '../types';
import { 
  getSyllabusForSubject, 
  getAvailableSubjects,
  validateEducationSelections 
} from './syllabusData';

const SYLLABUS_CACHE_KEY_PREFIX = 'concepttrace_syllabus_cache_';

/**
 * Fetches all syllabi for a student's enrolled subjects from the backend API.
 * Gracefully falls back to local authentic syllabus data repository if API is unavailable.
 */
export async function fetchEnrolledSyllabi(
  profile: EducationProfile
): Promise<SubjectSyllabus[]> {
  const { board, classLevel, stream, academicYear, subjects } = profile;
  const subjectsToFetch = subjects && subjects.length > 0 ? subjects : ['Physics', 'Chemistry', 'Mathematics'];

  // Check client cache first
  const cacheKey = `${SYLLABUS_CACHE_KEY_PREFIX}${board}_${classLevel}_${stream || 'General'}_${academicYear}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: SubjectSyllabus[] = JSON.parse(cached);
      // Ensure all enrolled subjects exist in parsed
      const hasAll = subjectsToFetch.every(subj => 
        parsed.some(s => s.subject.toLowerCase() === subj.toLowerCase())
      );
      if (hasAll) {
        // Asynchronously revalidate in background without blocking
        backgroundRefreshCache(profile, cacheKey).catch(() => {});
        return parsed.filter(s => 
          subjectsToFetch.some(subj => subj.toLowerCase() === s.subject.toLowerCase())
        );
      }
    }
  } catch {
    // Ignore cache error
  }

  // Attempt backend API fetch
  try {
    const params = new URLSearchParams({
      board,
      classLevel,
      academicYear,
      subject: 'all',
      enrolledSubjects: subjectsToFetch.join(',')
    });
    if (stream) {
      params.append('stream', stream);
    }

    const response = await fetch(`/api/syllabus?${params.toString()}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data?.syllabi)) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result.data.syllabi));
        } catch {
          // LocalStorage quota safety
        }
        return result.data.syllabi;
      }
    }
  } catch (err) {
    console.warn('[Syllabus Service] Network request failed, using authentic local curriculum repository fallback:', err);
  }

  // Resilient fallback from authentic local repository
  const localSyllabi = subjectsToFetch.map(subj => 
    getSyllabusForSubject(board, classLevel, subj, stream, academicYear)
  );

  try {
    localStorage.setItem(cacheKey, JSON.stringify(localSyllabi));
  } catch {
    // LocalStorage quota safety
  }

  return localSyllabi;
}

/**
 * Background cache refresher
 */
async function backgroundRefreshCache(profile: EducationProfile, cacheKey: string) {
  try {
    const { board, classLevel, stream, academicYear, subjects } = profile;
    const params = new URLSearchParams({
      board,
      classLevel,
      academicYear,
      subject: 'all',
      enrolledSubjects: (subjects || []).join(',')
    });
    if (stream) params.append('stream', stream);

    const response = await fetch(`/api/syllabus?${params.toString()}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && Array.isArray(result.data?.syllabi)) {
        localStorage.setItem(cacheKey, JSON.stringify(result.data.syllabi));
      }
    }
  } catch {
    // Silent fail in background
  }
}

/**
 * Fetches a single subject syllabus
 */
export async function fetchSubjectSyllabus(
  board: EducationBoard,
  classLevel: ClassLevel,
  subject: string,
  stream?: StudentStream,
  academicYear: string = '2026-27'
): Promise<SubjectSyllabus> {
  try {
    const params = new URLSearchParams({
      board,
      classLevel,
      academicYear,
      subject
    });
    if (stream) params.append('stream', stream);

    const response = await fetch(`/api/syllabus?${params.toString()}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
    }
  } catch (err) {
    console.warn('[Syllabus Service] Single fetch failed, using fallback:', err);
  }

  return getSyllabusForSubject(board, classLevel, subject, stream, academicYear);
}

/**
 * Extracts syllabus structure from student-uploaded text via server-side Gemini AI
 */
export async function extractCustomSyllabus(
  syllabusText: string,
  subject: string,
  board: EducationBoard,
  classLevel: ClassLevel,
  stream?: StudentStream,
  academicYear: string = '2026-27'
): Promise<SubjectSyllabus> {
  const response = await fetch('/api/syllabus/extract-custom', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      syllabusText,
      subject,
      board,
      classLevel,
      stream,
      academicYear
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to extract custom syllabus');
  }

  const result = await response.json();
  return result.data;
}

export { 
  getAvailableSubjects, 
  validateEducationSelections 
};
