/**
 * Academic Calendar Management System for ConceptTrace AI.
 *
 * Automatically resolves and assigns the active academic session year
 * based on the system date and board/region-specific academic calendar rules:
 *
 * 1. Indian National Boards (CBSE, CISCE, NIOS) & Central/North/West/East States:
 *    Session: April 1 to March 31.
 * 2. Southern State Boards (Karnataka, Tamil Nadu, Kerala, Andhra Pradesh, Telangana, Puducherry):
 *    Session: June 1 to May 31.
 * 3. International Boards (IB, Cambridge / CAIE):
 *    Session: August 1 to May/June.
 * 4. Fallback / Sensible Default:
 *    Standard Indian National Calendar (April 1 start).
 */

export interface AcademicCalendarRule {
  startMonth: number; // 0-indexed: 3 = April, 5 = June, 7 = August
  startDay: number;   // 1-indexed day of the month: 1
  sessionTitle: string;
  description: string;
}

export const ACADEMIC_CALENDAR_RULES: Record<string, AcademicCalendarRule> = {
  national_standard: {
    startMonth: 3, // April
    startDay: 1,
    sessionTitle: 'April–March Academic Session',
    description: 'April–March Session (National Standard / CBSE / CISCE)'
  },
  southern_states: {
    startMonth: 5, // June
    startDay: 1,
    sessionTitle: 'June–May Academic Session',
    description: 'June–May Session (State Calendar)'
  },
  international: {
    startMonth: 7, // August
    startDay: 1,
    sessionTitle: 'August–May Academic Session',
    description: 'August–May Session (IB / Cambridge)'
  }
};

export const DEFAULT_ACADEMIC_CALENDAR_RULE: AcademicCalendarRule = ACADEMIC_CALENDAR_RULES.national_standard;

/**
 * Returns the applicable academic calendar rule based on the board and its region.
 */
export function getAcademicCalendarRule(boardIdentifier?: string | null): AcademicCalendarRule {
  if (!boardIdentifier) return DEFAULT_ACADEMIC_CALENDAR_RULE;

  try {
    const clean = boardIdentifier.trim().toLowerCase();

    // International boards (August session)
    if (
      clean === 'ib' || 
      clean.includes('international baccalaureate') ||
      clean.includes('cambridge') || 
      clean === 'caie' || 
      clean.includes('igcse') ||
      clean.includes('international')
    ) {
      return ACADEMIC_CALENDAR_RULES.international;
    }

    // Southern state boards (June session)
    const southernPatterns = [
      'karnataka', 'kseab', 'kseeb', 'pue',
      'tamil nadu', 'tndge', 'tamilnadu',
      'kerala', 'kbpe', 'dhse kerala',
      'andhra', 'bseap', 'bieap',
      'telangana', 'bset', 'tsbie',
      'puducherry', 'pondicherry'
    ];

    if (southernPatterns.some(pattern => clean.includes(pattern))) {
      return ACADEMIC_CALENDAR_RULES.southern_states;
    }

    // All other Indian boards (CBSE, CISCE, NIOS, UP, Maharashtra, Bihar, WB, etc.)
    return DEFAULT_ACADEMIC_CALENDAR_RULE;
  } catch {
    return DEFAULT_ACADEMIC_CALENDAR_RULE;
  }
}

/**
 * Automatically calculates and assigns the current academic year string (e.g. "2026-27")
 * based on the system date and the student's board/region calendar.
 *
 * @param boardIdentifier Board ID or name (e.g. 'CBSE', 'kseab', 'ib')
 * @param referenceDate Optional date for deterministic calculation and unit testing (defaults to system date)
 */
export function determineCurrentAcademicYear(
  boardIdentifier?: string | null,
  referenceDate: Date = new Date()
): string {
  const rule = getAcademicCalendarRule(boardIdentifier);
  const fullYear = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0 = Jan, 3 = April, 5 = June, 7 = Aug
  const date = referenceDate.getDate();

  let startYear: number;
  let endYear: number;

  if (month > rule.startMonth || (month === rule.startMonth && date >= rule.startDay)) {
    // Current session started in this calendar year
    startYear = fullYear;
    endYear = fullYear + 1;
  } else {
    // Current session started in previous calendar year
    startYear = fullYear - 1;
    endYear = fullYear;
  }

  const endYearShort = String(endYear).slice(-2);
  return `${startYear}-${endYearShort}`;
}

/**
 * Formats an academic year for display, appending "(Current)" if it represents the active session.
 * e.g., "2026–27 (Current)"
 *
 * @param academicYear Academic year string to format
 * @param boardIdentifier Optional board identifier to verify if this matches the current session
 * @param referenceDate Optional reference date (defaults to system date)
 */
export function formatAcademicYearDisplay(
  academicYear?: string | null,
  boardIdentifier?: string | null,
  referenceDate: Date = new Date()
): string {
  const currentResolved = determineCurrentAcademicYear(boardIdentifier, referenceDate);
  const targetYear = academicYear || currentResolved;

  // Standardize delimiter to en-dash
  const normalizedYear = targetYear.replace('-', '–').trim();

  // If already contains (Current), return cleanly
  if (normalizedYear.includes('(Current)')) {
    return normalizedYear;
  }

  // Check if target matches the active session
  const cleanTarget = targetYear.replace('–', '-').trim();
  const isCurrentSession = cleanTarget === currentResolved;

  if (isCurrentSession) {
    return `${cleanTarget.replace('-', '–')} (Current)`;
  }

  return cleanTarget.replace('-', '–');
}
