/**
 * Centralized Syllabus Verification & Academic Session Consistency Engine.
 * 
 * Accurately determines verification status and source evidence based on:
 * 1. Target academic session (e.g. 2026-27).
 * 2. Actual official board documents on record and their published applicable sessions.
 * 3. Board, class, and subject matching.
 * 
 * Strictly adheres to truthfulness:
 * - Never claims "Verified Official Syllabus" if the active session's circular is not yet published.
 * - Accurately designates 2026-27 as "Verification Pending (2026-27 Circular Awaited)" when
 *   relying on latest published 2024-25 / 2025-26 board circulars.
 * - Identifies historical sessions (e.g. 2024-25, 2025-26) as verified against their historical documents.
 * - Clearly flags adapted or unconfirmed state board curricula.
 */

import type { SubjectSyllabus, OfficialSyllabusDocument } from '../types/index.ts';

export type VerificationBadgeType = 'verified' | 'pending' | 'unconfirmed' | 'adapted';

export interface SyllabusVerificationDetails {
  status: 'Verified' | 'Verification Pending' | 'Latest Not Confirmed' | 'Partially Available';
  badgeType: VerificationBadgeType;
  badgeLabel: string;
  isSessionMatched: boolean;
  applicableSession: string;
  requestedSession: string;
  statusNote: string;
  officialPublishedDate: string;
  sourceName: string;
  sourceUrl: string;
  documentCount: number;
  documents: OfficialSyllabusDocument[];
  evidenceSummary: string;
}

/**
 * Checks if an official document's applicable session covers the requested academic year.
 */
function sessionCoversTarget(documentSession: string, targetYear: string): boolean {
  if (!documentSession || !targetYear) return false;
  const cleanDoc = documentSession.replace(/\s+/g, '').toLowerCase();
  const cleanTarget = targetYear.replace(/\s+/g, '').toLowerCase();

  // Exact match
  if (cleanDoc === cleanTarget) return true;

  // Range or combined (e.g., '2024-25 & 2025-26' or '2025-26 / 2026-27')
  if (cleanDoc.includes(cleanTarget)) return true;

  // Normalized hyphen variations (e.g. 2026–27 vs 2026-27)
  const normDoc = cleanDoc.replace(/–/g, '-');
  const normTarget = cleanTarget.replace(/–/g, '-');
  return normDoc.includes(normTarget);
}

/**
 * Dynamically evaluates the verification status of a syllabus against a student's active academic year.
 */
export function evaluateSyllabusVerification(
  syllabus: SubjectSyllabus,
  targetAcademicYear: string = '2026-27'
): SyllabusVerificationDetails {
  const docs = syllabus.officialDocuments || [];
  const requestedSession = targetAcademicYear || '2026-27';
  
  // Find if any official document explicitly covers the target session
  const matchingDoc = docs.find((d: OfficialSyllabusDocument) => sessionCoversTarget(d.academicYear, requestedSession));

  // Determine latest session on record from available documents
  const latestDocSession = docs.length > 0 ? docs[0].academicYear : '2024-25 & 2025-26';
  const publishedDate = docs.length > 0 && docs[0].publishedDate ? docs[0].publishedDate : 'March 2024';

  // Case 1: Target session is explicitly covered by an official document on record
  if (matchingDoc) {
    return {
      status: 'Verified',
      badgeType: 'verified',
      badgeLabel: 'Verified Official Syllabus',
      isSessionMatched: true,
      applicableSession: matchingDoc.academicYear,
      requestedSession,
      statusNote: `Verified against official ${syllabus.sourceName} curriculum documents published for session ${matchingDoc.academicYear}.`,
      officialPublishedDate: publishedDate,
      sourceName: syllabus.sourceName,
      sourceUrl: syllabus.sourceUrl,
      documentCount: docs.length,
      documents: docs,
      evidenceSummary: `Official circular on file for session ${matchingDoc.academicYear} from ${syllabus.sourceName}.`
    };
  }

  // Case 2: Documents exist for prior sessions (e.g., 2024-25 / 2025-26), but student is in 2026-27
  // Boards (CBSE, State Boards) have not yet released the 2026-27 annual notification.
  // Active curriculum is based on the latest published documents, with 2026-27 confirmation pending.
  if (docs.length > 0) {
    return {
      status: 'Verification Pending',
      badgeType: 'pending',
      badgeLabel: `Verification Pending (${requestedSession} Circular Awaited)`,
      isSessionMatched: false,
      applicableSession: `${latestDocSession} (Latest Published by Board)`,
      requestedSession,
      statusNote: `Active curriculum is aligned with the latest published ${syllabus.sourceName} Senior School Curriculum (${latestDocSession}). Official annual circular from the board for session ${requestedSession} is pending release.`,
      officialPublishedDate: publishedDate,
      sourceName: syllabus.sourceName,
      sourceUrl: syllabus.sourceUrl,
      documentCount: docs.length,
      documents: docs,
      evidenceSummary: `Based on official ${latestDocSession} circular from ${syllabus.sourceName}. 2026-27 update circular awaited.`
    };
  }

  // Case 3: State board adapted curriculum (e.g. state board adopting NCERT chapters without direct state PDF)
  const normNote = (syllabus.statusNote || '').toLowerCase();
  const normCurr = (syllabus.curriculumType || '').toLowerCase();
  if (normCurr.includes('adapted') || normNote.includes('adapted') || (normNote.includes('ncert') && normNote.includes('adopt'))) {
    return {
      status: 'Partially Available',
      badgeType: 'adapted',
      badgeLabel: 'State Adaptation (Verification Pending)',
      isSessionMatched: false,
      applicableSession: 'NCERT Base Curriculum',
      requestedSession,
      statusNote: `Standard NCERT curriculum structure adopted by ${syllabus.board}. Direct official state board circular for session ${requestedSession} is pending confirmation.`,
      officialPublishedDate: 'NCERT National Framework',
      sourceName: syllabus.sourceName,
      sourceUrl: syllabus.sourceUrl,
      documentCount: 0,
      documents: [],
      evidenceSummary: `Cross-board NCERT alignment. State board specific circular pending confirmation.`
    };
  }

  // Case 4: Subject outside verified catalog
  return {
    status: 'Latest Not Confirmed',
    badgeType: 'unconfirmed',
    badgeLabel: 'Latest Syllabus Not Confirmed',
    isSessionMatched: false,
    applicableSession: 'Unconfirmed',
    requestedSession,
    statusNote: `Official board syllabus document for ${syllabus.subject} under ${syllabus.board} is not currently confirmed in the repository. Standard core curriculum topics are shown.`,
    officialPublishedDate: 'Not Confirmed',
    sourceName: `${syllabus.board} Academic Directorate`,
    sourceUrl: syllabus.sourceUrl || 'https://cbseacademic.nic.in',
    documentCount: 0,
    documents: [],
    evidenceSummary: `Official board circular not yet confirmed in catalog.`
  };
}
