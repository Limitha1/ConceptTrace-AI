/**
 * Board-Specific Regional Language & Curriculum Configuration for ConceptTrace AI.
 * 
 * Provides centralized, maintainable mappings for:
 * 1. Regional languages and language subjects applicable to each Education Board.
 * 2. Dynamic subject offerings for Class 10, 11, and 12 across boards.
 * 3. Automatic curriculum framework resolution (eliminating manual selection).
 */

import type { EducationBoard, ClassLevel, StudentStream } from '../types/index.ts';

export interface RegionalLanguageDetail {
  language: string;
  subjectName: string;
  category: 'Regional Language' | 'Language' | 'Language Elective';
  isPrimary: boolean;
  isVerified: boolean;
  code?: string;
  description: string;
}

export interface BoardLanguageProfile {
  regionName: string;
  primaryLanguages: string[];
  secondaryLanguages: string[];
  languageSubjects: RegionalLanguageDetail[];
}

/**
 * Authoritative board-to-regional-language mappings across Indian States, Union Territories,
 * National Boards (CBSE, CISCE, NIOS), and International Boards.
 */
export const BOARD_LANGUAGE_PROFILES: Record<string, BoardLanguageProfile> = {
  // Karnataka (KSEAB / PUE)
  karnataka: {
    regionName: 'Karnataka',
    primaryLanguages: ['Kannada'],
    secondaryLanguages: ['English', 'Hindi', 'Sanskrit', 'Urdu'],
    languageSubjects: [
      {
        language: 'Kannada',
        subjectName: 'Kannada',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'KAN-01',
        description: 'First / Second Language Kannada under Karnataka KSEAB & PUE curriculum'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        code: 'HIN-03',
        description: 'Third / Second Language Hindi under Karnataka State curriculum'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        code: 'SAN-04',
        description: 'Classical Language Sanskrit Elective'
      },
      {
        language: 'Urdu',
        subjectName: 'Urdu',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        code: 'URD-05',
        description: 'Urdu First / Second Language'
      }
    ]
  },

  // Kerala (KBPE / DHSE)
  kerala: {
    regionName: 'Kerala',
    primaryLanguages: ['Malayalam'],
    secondaryLanguages: ['English', 'Hindi', 'Arabic', 'Sanskrit'],
    languageSubjects: [
      {
        language: 'Malayalam',
        subjectName: 'Malayalam',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'MAL-01',
        description: 'First / Second Language Malayalam under Kerala SCERT & DHSE'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'Hindi Language under Kerala SCERT'
      },
      {
        language: 'Arabic',
        subjectName: 'Arabic',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Arabic Second Language Elective'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Sanskrit Language Elective'
      }
    ]
  },

  // Tamil Nadu (TNDGE)
  tamil_nadu: {
    regionName: 'Tamil Nadu',
    primaryLanguages: ['Tamil'],
    secondaryLanguages: ['English', 'Hindi', 'French', 'Sanskrit'],
    languageSubjects: [
      {
        language: 'Tamil',
        subjectName: 'Tamil',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'TAM-01',
        description: 'Part I Tamil under Tamil Nadu State Board (Samacheer Kalvi)'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'Hindi Optional Language'
      },
      {
        language: 'French',
        subjectName: 'French',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'French Part I Language Elective'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Sanskrit Part I Language Elective'
      }
    ]
  },

  // Maharashtra (MSBSHSE)
  maharashtra: {
    regionName: 'Maharashtra',
    primaryLanguages: ['Marathi'],
    secondaryLanguages: ['English', 'Hindi', 'Sanskrit', 'Gujarati', 'Urdu'],
    languageSubjects: [
      {
        language: 'Marathi',
        subjectName: 'Marathi',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'MAR-01',
        description: 'Compulsory Regional Language Marathi under MSBSHSE Balbharati'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'Second / Composite Language Hindi'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Composite Sanskrit Language Elective'
      },
      {
        language: 'Gujarati',
        subjectName: 'Gujarati',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Gujarati Language Elective'
      }
    ]
  },

  // West Bengal (WBBSE / WBCHSE)
  west_bengal: {
    regionName: 'West Bengal',
    primaryLanguages: ['Bengali'],
    secondaryLanguages: ['English', 'Hindi', 'Nepali', 'Urdu'],
    languageSubjects: [
      {
        language: 'Bengali',
        subjectName: 'Bengali',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'BEN-01',
        description: 'First Language Bengali under WBBSE & WBCHSE curriculum'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'First / Second Language Hindi'
      },
      {
        language: 'Nepali',
        subjectName: 'Nepali',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Nepali Language (Hill Region Curriculum)'
      },
      {
        language: 'Urdu',
        subjectName: 'Urdu',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Urdu First / Second Language'
      }
    ]
  },

  // Andhra Pradesh (BSEAP / BIEAP) & Telangana (BSET / TSBIE)
  telugu_states: {
    regionName: 'Andhra Pradesh & Telangana',
    primaryLanguages: ['Telugu'],
    secondaryLanguages: ['English', 'Hindi', 'Urdu', 'Sanskrit'],
    languageSubjects: [
      {
        language: 'Telugu',
        subjectName: 'Telugu',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'TEL-01',
        description: 'First / Second Language Telugu under BSEAP, BIEAP, BSET, and TSBIE'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'Second Language Hindi'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Sanskrit Language Elective'
      },
      {
        language: 'Urdu',
        subjectName: 'Urdu',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Urdu First / Second Language'
      }
    ]
  },

  // Gujarat (GSEB)
  gujarat: {
    regionName: 'Gujarat',
    primaryLanguages: ['Gujarati'],
    secondaryLanguages: ['English', 'Hindi', 'Sanskrit'],
    languageSubjects: [
      {
        language: 'Gujarati',
        subjectName: 'Gujarati',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'GUJ-01',
        description: 'First / Second Language Gujarati under GSEB'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'Second Language Hindi'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Sanskrit Elective'
      }
    ]
  },

  // Odisha (BSE Odisha / CHSE)
  odisha: {
    regionName: 'Odisha',
    primaryLanguages: ['Odia'],
    secondaryLanguages: ['English', 'Hindi', 'Sanskrit'],
    languageSubjects: [
      {
        language: 'Odia',
        subjectName: 'Odia',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'ODI-01',
        description: 'First Language Odia under BSE Odisha & CHSE'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'Second Language Hindi'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Sanskrit Language Elective'
      }
    ]
  },

  // Punjab (PSEB)
  punjab: {
    regionName: 'Punjab',
    primaryLanguages: ['Punjabi'],
    secondaryLanguages: ['English', 'Hindi'],
    languageSubjects: [
      {
        language: 'Punjabi',
        subjectName: 'Punjabi',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'PUN-01',
        description: 'Compulsory First Language Punjabi under PSEB'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'Second Language Hindi'
      }
    ]
  },

  // Assam (ASSEB / SEBA / AHSEC)
  assam: {
    regionName: 'Assam',
    primaryLanguages: ['Assamese'],
    secondaryLanguages: ['Bengali', 'Bodo', 'English', 'Hindi'],
    languageSubjects: [
      {
        language: 'Assamese',
        subjectName: 'Assamese',
        category: 'Regional Language',
        isPrimary: true,
        isVerified: true,
        code: 'ASM-01',
        description: 'Modern Indian Language Assamese under ASSEB'
      },
      {
        language: 'Bengali',
        subjectName: 'Bengali',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        description: 'MIL Bengali under ASSEB'
      },
      {
        language: 'Bodo',
        subjectName: 'Bodo',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        description: 'MIL Bodo under ASSEB'
      },
      {
        language: 'Hindi',
        subjectName: 'Hindi',
        category: 'Language',
        isPrimary: false,
        isVerified: true,
        description: 'MIL Hindi'
      }
    ]
  },

  // Hindi Heart-land States (UP, Bihar, MP, Rajasthan, Haryana, etc.)
  hindi_belt: {
    regionName: 'Central & Northern States',
    primaryLanguages: ['Hindi'],
    secondaryLanguages: ['English', 'Sanskrit', 'Urdu'],
    languageSubjects: [
      {
        language: 'Hindi',
        subjectName: 'Hindi (General / Special)',
        category: 'Language',
        isPrimary: true,
        isVerified: true,
        code: 'HIN-STATE',
        description: 'Compulsory First Language Hindi under State Board curriculum'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Third Language / Classical Sanskrit'
      },
      {
        language: 'Urdu',
        subjectName: 'Urdu',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Urdu Language Elective'
      }
    ]
  },

  // CBSE (National)
  cbse: {
    regionName: 'National (CBSE)',
    primaryLanguages: ['Hindi', 'English'],
    secondaryLanguages: ['Sanskrit', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Bengali', 'French', 'German'],
    languageSubjects: [
      {
        language: 'Hindi',
        subjectName: 'Hindi Course A / B',
        category: 'Language',
        isPrimary: true,
        isVerified: true,
        code: '002 / 085',
        description: 'Official CBSE Hindi Course A (002) / Course B (085)'
      },
      {
        language: 'Sanskrit',
        subjectName: 'Sanskrit',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        code: '122',
        description: 'Official CBSE Sanskrit (Code 122)'
      },
      {
        language: 'Kannada',
        subjectName: 'Kannada (CBSE Elective)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        code: '015',
        description: 'Official CBSE Regional Language Kannada (Code 015)'
      },
      {
        language: 'Tamil',
        subjectName: 'Tamil (CBSE Elective)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        code: '006',
        description: 'Official CBSE Regional Language Tamil (Code 006)'
      },
      {
        language: 'Telugu',
        subjectName: 'Telugu (CBSE Elective)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        code: '007',
        description: 'Official CBSE Regional Language Telugu (Code 007)'
      },
      {
        language: 'Malayalam',
        subjectName: 'Malayalam (CBSE Elective)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        code: '012',
        description: 'Official CBSE Regional Language Malayalam (Code 012)'
      },
      {
        language: 'Marathi',
        subjectName: 'Marathi (CBSE Elective)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        code: '009',
        description: 'Official CBSE Regional Language Marathi (Code 009)'
      },
      {
        language: 'Bengali',
        subjectName: 'Bengali (CBSE Elective)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        code: '005',
        description: 'Official CBSE Regional Language Bengali (Code 005)'
      },
      {
        language: 'French',
        subjectName: 'French',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        code: '018',
        description: 'Foreign Language Elective French (Code 018)'
      }
    ]
  },

  // CISCE (ICSE / ISC)
  cisce: {
    regionName: 'National (CISCE / ICSE)',
    primaryLanguages: ['English', 'Hindi'],
    secondaryLanguages: ['Bengali', 'Kannada', 'Tamil', 'Telugu', 'Malayalam', 'Marathi', 'Gujarati', 'French'],
    languageSubjects: [
      {
        language: 'Hindi',
        subjectName: 'Hindi (ICSE Second Language)',
        category: 'Language',
        isPrimary: true,
        isVerified: true,
        description: 'Prescribed ICSE Second Language Hindi'
      },
      {
        language: 'Bengali',
        subjectName: 'Bengali (ICSE)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        description: 'Prescribed ICSE Regional Language Bengali'
      },
      {
        language: 'Kannada',
        subjectName: 'Kannada (ICSE)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        description: 'Prescribed ICSE Regional Language Kannada'
      },
      {
        language: 'Tamil',
        subjectName: 'Tamil (ICSE)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        description: 'Prescribed ICSE Regional Language Tamil'
      },
      {
        language: 'Malayalam',
        subjectName: 'Malayalam (ICSE)',
        category: 'Regional Language',
        isPrimary: false,
        isVerified: true,
        description: 'Prescribed ICSE Regional Language Malayalam'
      },
      {
        language: 'French',
        subjectName: 'French (Modern Foreign Language)',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Modern Foreign Language French'
      }
    ]
  },

  // International Boards (IB / Cambridge)
  international: {
    regionName: 'International (IB / Cambridge)',
    primaryLanguages: ['English'],
    secondaryLanguages: ['Hindi', 'French', 'Spanish', 'German', 'Mandarin'],
    languageSubjects: [
      {
        language: 'Hindi',
        subjectName: 'Hindi B / Second Language',
        category: 'Language',
        isPrimary: true,
        isVerified: true,
        description: 'Language B Hindi'
      },
      {
        language: 'French',
        subjectName: 'French B / Foreign Language',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Language B French'
      },
      {
        language: 'Spanish',
        subjectName: 'Spanish B / Foreign Language',
        category: 'Language Elective',
        isPrimary: false,
        isVerified: true,
        description: 'Language B Spanish'
      }
    ]
  }
};

/**
 * Resolves the relevant board language profile based on board ID, acronym, or name.
 */
export function getBoardLanguageProfile(boardIdentifier?: string | null): BoardLanguageProfile {
  if (!boardIdentifier) return BOARD_LANGUAGE_PROFILES.cbse;

  const clean = boardIdentifier.trim().toLowerCase();

  // Karnataka
  if (clean.includes('karnataka') || clean.includes('kseab') || clean.includes('kseeb') || clean.includes('pue')) {
    return BOARD_LANGUAGE_PROFILES.karnataka;
  }

  // Kerala
  if (clean.includes('kerala') || clean.includes('kbpe') || clean.includes('dhse kerala')) {
    return BOARD_LANGUAGE_PROFILES.kerala;
  }

  // Tamil Nadu
  if (clean.includes('tamil') || clean.includes('tndge') || clean.includes('samacheer')) {
    return BOARD_LANGUAGE_PROFILES.tamil_nadu;
  }

  // Maharashtra
  if (clean.includes('maharashtra') || clean.includes('msbshse')) {
    return BOARD_LANGUAGE_PROFILES.maharashtra;
  }

  // West Bengal
  if (clean.includes('bengal') || clean.includes('wbbse') || clean.includes('wbchse')) {
    return BOARD_LANGUAGE_PROFILES.west_bengal;
  }

  // Andhra Pradesh & Telangana
  if (
    clean.includes('andhra') || 
    clean.includes('telangana') || 
    clean.includes('bseap') || 
    clean.includes('bieap') || 
    clean.includes('bset') || 
    clean.includes('tsbie')
  ) {
    return BOARD_LANGUAGE_PROFILES.telugu_states;
  }

  // Gujarat
  if (clean.includes('gujarat') || clean.includes('gseb')) {
    return BOARD_LANGUAGE_PROFILES.gujarat;
  }

  // Odisha
  if (clean.includes('odisha') || clean.includes('orissa') || clean.includes('bse odisha') || clean.includes('chse')) {
    return BOARD_LANGUAGE_PROFILES.odisha;
  }

  // Punjab
  if (clean.includes('punjab') || clean.includes('pseb')) {
    return BOARD_LANGUAGE_PROFILES.punjab;
  }

  // Assam
  if (clean.includes('assam') || clean.includes('asseb') || clean.includes('seba') || clean.includes('ahsec')) {
    return BOARD_LANGUAGE_PROFILES.assam;
  }

  // International Boards
  if (
    clean.includes('international') || 
    clean === 'ib' || 
    clean.includes('cambridge') || 
    clean === 'caie' || 
    clean.includes('igcse')
  ) {
    return BOARD_LANGUAGE_PROFILES.international;
  }

  // CISCE
  if (clean.includes('cisce') || clean.includes('icse') || clean.includes('isc')) {
    return BOARD_LANGUAGE_PROFILES.cisce;
  }

  // Northern & Central Hindi Belt States
  const hindiBelt = [
    'uttar pradesh', 'upmsp', 'bihar', 'bseb', 'rajasthan', 'rbse', 
    'madhya pradesh', 'mpbse', 'haryana', 'bseh', 'himachal', 'hpbose', 
    'uttarakhand', 'ubse', 'jharkhand', 'jac', 'chhattisgarh', 'cgbse', 'delhi', 'dbse'
  ];
  if (hindiBelt.some(pattern => clean.includes(pattern))) {
    return BOARD_LANGUAGE_PROFILES.hindi_belt;
  }

  // Default to CBSE / National
  return BOARD_LANGUAGE_PROFILES.cbse;
}

/**
 * Returns permissible subjects for a given Board, Class, and Stream,
 * dynamically incorporating board-specific regional languages, core subjects, and electives.
 */
export function getBoardSpecificSubjects(
  board: EducationBoard,
  classLevel: ClassLevel,
  stream?: StudentStream
): { subject: string; category: string; isCore?: boolean; isRegionalLanguage?: boolean; isVerified?: boolean }[] {
  const profile = getBoardLanguageProfile(board);
  const subjects: { subject: string; category: string; isCore?: boolean; isRegionalLanguage?: boolean; isVerified?: boolean }[] = [];

  if (classLevel === '10') {
    // 1. Universal foundational academic core
    subjects.push(
      { subject: 'Mathematics', category: 'Core Academic', isCore: true, isVerified: true },
      { subject: 'Science', category: 'Core Academic', isCore: true, isVerified: true },
      { subject: 'Social Science', category: 'Core Academic', isCore: true, isVerified: true },
      { subject: 'English Language & Literature', category: 'Language', isCore: true, isVerified: true }
    );

    // 2. Add board-specific regional and state language offerings
    for (const lang of profile.languageSubjects) {
      subjects.push({
        subject: lang.subjectName,
        category: lang.category,
        isCore: lang.isPrimary,
        isRegionalLanguage: lang.isPrimary || lang.category === 'Regional Language',
        isVerified: lang.isVerified
      });
    }

    // 3. Add skill and vocational subjects
    const boardClean = (board || '').toLowerCase();
    if (boardClean.includes('cbse')) {
      subjects.push(
        { subject: 'Information Technology (IT 402)', category: 'Skill Subject', isVerified: true },
        { subject: 'Computer Applications', category: 'Skill Subject', isVerified: true }
      );
    } else {
      subjects.push(
        { subject: 'Computer Applications', category: 'Skill Subject', isVerified: true },
        { subject: 'Information Technology', category: 'Skill Subject', isVerified: true }
      );
    }

    return subjects;
  }

  // ==========================================
  // Class 11 and 12 - Stream Specific
  // ==========================================
  const activeStream = stream || 'Science';

  if (activeStream === 'Science') {
    subjects.push(
      { subject: 'Physics', category: 'Science Core', isCore: true, isVerified: true },
      { subject: 'Chemistry', category: 'Science Core', isCore: true, isVerified: true },
      { subject: 'Mathematics', category: 'Science / Math Core', isCore: true, isVerified: true },
      { subject: 'Biology', category: 'Life Sciences', isVerified: true },
      { subject: 'Computer Science (Python)', category: 'Elective', isVerified: true },
      { subject: 'English Core', category: 'Language', isCore: true, isVerified: true }
    );

    // Add board language options for Class 11/12
    for (const lang of profile.languageSubjects) {
      // In Senior Secondary, regional languages are studied as Part I or elective languages
      subjects.push({
        subject: lang.subjectName,
        category: lang.category,
        isCore: false,
        isRegionalLanguage: lang.isPrimary || lang.category === 'Regional Language',
        isVerified: lang.isVerified
      });
    }

    subjects.push(
      { subject: 'Informatics Practices', category: 'Elective', isVerified: true },
      { subject: 'Biotechnology', category: 'Elective', isVerified: true },
      { subject: 'Physical Education', category: 'Elective', isVerified: true }
    );

    return subjects;
  }

  if (activeStream === 'Commerce') {
    subjects.push(
      { subject: 'Accountancy', category: 'Commerce Core', isCore: true, isVerified: true },
      { subject: 'Business Studies', category: 'Commerce Core', isCore: true, isVerified: true },
      { subject: 'Economics', category: 'Commerce Core', isCore: true, isVerified: true },
      { subject: 'Applied Mathematics', category: 'Mathematics Elective', isVerified: true },
      { subject: 'Mathematics', category: 'Mathematics Elective', isVerified: true },
      { subject: 'English Core', category: 'Language', isCore: true, isVerified: true }
    );

    for (const lang of profile.languageSubjects) {
      subjects.push({
        subject: lang.subjectName,
        category: lang.category,
        isCore: false,
        isRegionalLanguage: lang.isPrimary || lang.category === 'Regional Language',
        isVerified: lang.isVerified
      });
    }

    subjects.push(
      { subject: 'Informatics Practices', category: 'Elective', isVerified: true },
      { subject: 'Entrepreneurship', category: 'Elective', isVerified: true }
    );

    return subjects;
  }

  // Humanities / Arts
  subjects.push(
    { subject: 'History', category: 'Humanities Core', isCore: true, isVerified: true },
    { subject: 'Political Science', category: 'Humanities Core', isCore: true, isVerified: true },
    { subject: 'Geography', category: 'Humanities Core', isVerified: true },
    { subject: 'Economics', category: 'Social Science Elective', isVerified: true },
    { subject: 'Psychology', category: 'Humanities Elective', isVerified: true },
    { subject: 'Sociology', category: 'Humanities Elective', isVerified: true },
    { subject: 'English Core', category: 'Language', isCore: true, isVerified: true }
  );

  for (const lang of profile.languageSubjects) {
    subjects.push({
      subject: lang.subjectName,
      category: lang.category,
      isCore: false,
      isRegionalLanguage: lang.isPrimary || lang.category === 'Regional Language',
      isVerified: lang.isVerified
    });
  }

  return subjects;
}

/**
 * Returns default enrolled subjects for a given board, class level, and stream.
 * Includes foundational core subjects plus the primary regional language for state boards.
 */
export function getDefaultSubjectsForBoard(
  board: EducationBoard,
  classLevel: ClassLevel,
  stream?: StudentStream
): string[] {
  const profile = getBoardLanguageProfile(board);
  const primaryLang = profile.primaryLanguages[0];

  if (classLevel === '10') {
    const defaults = ['Mathematics', 'Science', 'Social Science', 'English Language & Literature'];
    // For state boards with a dedicated regional language, include it
    if (primaryLang && !defaults.includes(primaryLang) && !primaryLang.includes('Hindi Course')) {
      return [...defaults, primaryLang];
    }
    return defaults;
  }

  // Classes 11 & 12
  if (stream === 'Commerce') {
    return ['Accountancy', 'Business Studies', 'Economics', 'English Core', ...(primaryLang && !primaryLang.includes('Hindi Course') ? [primaryLang] : [])];
  }
  if (stream === 'Humanities/Arts') {
    return ['History', 'Political Science', 'Economics', 'English Core', ...(primaryLang && !primaryLang.includes('Hindi Course') ? [primaryLang] : [])];
  }
  // Default: Science
  return ['Physics', 'Chemistry', 'Mathematics', 'Biology', ...(primaryLang && !primaryLang.includes('Hindi Course') ? [primaryLang] : [])];
}

/**
 * Automatically determines the authentic curriculum framework description
 * based on the selected board, without requiring manual dropdown selection.
 */
export function determineCurriculumType(boardIdentifier?: string | null): string {
  if (!boardIdentifier) return 'NCERT / National Curriculum Framework (NCF)';

  const clean = boardIdentifier.trim().toLowerCase();

  if (clean.includes('karnataka') || clean.includes('kseab') || clean.includes('kseeb') || clean.includes('pue')) {
    return 'Karnataka State Board / DSEL Curriculum Framework';
  }

  if (clean.includes('cisce') || clean.includes('icse') || clean.includes('isc')) {
    return 'CISCE / ICSE / ISC Curriculum Framework';
  }

  if (clean.includes('kerala') || clean.includes('kbpe') || clean.includes('dhse kerala')) {
    return 'Kerala State Education Board (SCERT Kerala)';
  }

  if (clean.includes('tamil') || clean.includes('tndge')) {
    return 'Tamil Nadu State Board (TNSCERT)';
  }

  if (clean.includes('maharashtra') || clean.includes('msbshse')) {
    return 'Maharashtra State Board (MSBSHSE Curriculum)';
  }

  if (clean.includes('bengal') || clean.includes('wbbse') || clean.includes('wbchse')) {
    return 'West Bengal State Board (WBBSE / WBCHSE)';
  }

  if (clean.includes('andhra') || clean.includes('bseap') || clean.includes('bieap')) {
    return 'Andhra Pradesh State Board (BSEAP / BIEAP)';
  }

  if (clean.includes('telangana') || clean.includes('bset') || clean.includes('tsbie')) {
    return 'Telangana State Board (BSETG / TSBIE)';
  }

  if (clean.includes('nios')) {
    return 'National Institute of Open Schooling (NIOS Curriculum)';
  }

  if (clean.includes('international') || clean === 'ib' || clean.includes('cambridge') || clean === 'caie') {
    return 'International Baccalaureate / Cambridge Assessment';
  }

  // Standard NCERT / NCF for CBSE and NCERT-aligned state boards
  return 'NCERT / National Curriculum Framework (NCF)';
}
