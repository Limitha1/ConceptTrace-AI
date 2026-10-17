/**
 * Centralized, authoritative directory of Indian National, State, Union Territory,
 * and International School Education Boards.
 * 
 * Complies with the ConceptTrace AI curriculum mapping standards:
 * - Every state and UT is covered with officially applicable boards and acronyms.
 * - Legacy profile keys (CBSE, CISCE, Karnataka State Board, etc.) are seamlessly mapped.
 * - Non-existent state boards are not fabricated (UTs use their recognized applicable boards).
 */

export type BoardCategory = 
  | 'National Boards' 
  | 'State Boards' 
  | 'Union Territory / Applicable Boards' 
  | 'International Boards' 
  | 'Other';

export interface BoardOption {
  id: string;
  name: string;
  acronym: string;
  stateOrRegion: string;
  category: BoardCategory;
  description: string;
  isCurriculumDirectlyMapped: boolean; // true if ConceptTrace AI has official full syllabus records preloaded
  curriculumTypeDescription: string;
  aliases: string[];
}

export const EDUCATION_BOARDS: BoardOption[] = [
  // ==========================================
  // 1. NATIONAL BOARDS
  // ==========================================
  {
    id: 'cbse',
    name: 'Central Board of Secondary Education',
    acronym: 'CBSE',
    stateOrRegion: 'National',
    category: 'National Boards',
    description: 'Premier national board following NCERT / National Curriculum Framework (NCF).',
    isCurriculumDirectlyMapped: true,
    curriculumTypeDescription: 'Official NCERT / NCF Curriculum (Verified Direct Syllabus)',
    aliases: ['cbse', 'central board', 'ncert', 'all india', 'delhi cbse']
  },
  {
    id: 'cisce',
    name: 'Council for the Indian School Certificate Examinations',
    acronym: 'CISCE',
    stateOrRegion: 'National',
    category: 'National Boards',
    description: 'Conducts ICSE (Class 10) and ISC (Class 12) national examinations.',
    isCurriculumDirectlyMapped: true,
    curriculumTypeDescription: 'CISCE Official Prescribed Curriculum (Verified Direct Syllabus)',
    aliases: ['cisce', 'icse', 'isc', 'council', 'cambridge indian']
  },
  {
    id: 'nios',
    name: 'National Institute of Open Schooling',
    acronym: 'NIOS',
    stateOrRegion: 'National',
    category: 'National Boards',
    description: 'National open schooling board offering secondary and senior secondary certifications.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'NCERT-Aligned National Open Schooling Framework',
    aliases: ['nios', 'open school', 'national open school']
  },

  // ==========================================
  // 2. STATE BOARDS (ALL 28 INDIAN STATES)
  // ==========================================
  {
    id: 'bseap',
    name: 'Board of Secondary Education, Andhra Pradesh',
    acronym: 'BSEAP / BIEAP',
    stateOrRegion: 'Andhra Pradesh',
    category: 'State Boards',
    description: 'BSEAP (SSC Class 10) & BIEAP (Intermediate Class 11-12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'NCERT / SCERT Andhra Pradesh State Aligned Curriculum',
    aliases: ['bseap', 'bieap', 'andhra pradesh', 'ap board', 'ap ssc', 'ap intermediate']
  },
  {
    id: 'arunachal',
    name: 'State Board of School Education, Arunachal Pradesh',
    acronym: 'Arunachal DSE',
    stateOrRegion: 'Arunachal Pradesh',
    category: 'State Boards',
    description: 'Directorate of School Education, Arunachal Pradesh (CBSE-affiliated secondary schools).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'NCERT Aligned State Curriculum',
    aliases: ['arunachal pradesh', 'arunachal board', 'dse arunachal']
  },
  {
    id: 'asseb',
    name: 'Assam State School Education Board',
    acronym: 'ASSEB (formerly SEBA / AHSEC)',
    stateOrRegion: 'Assam',
    category: 'State Boards',
    description: 'Official unified state board (formerly SEBA for Class 10 & AHSEC for Class 12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'ASSEB / NCERT Aligned State Curriculum',
    aliases: ['asseb', 'seba', 'ahsec', 'assam board', 'assam']
  },
  {
    id: 'bseb',
    name: 'Bihar School Examination Board',
    acronym: 'BSEB',
    stateOrRegion: 'Bihar',
    category: 'State Boards',
    description: 'BSEB conducts Matric (Class 10) and Intermediate (Class 12) examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'BSEB State Board / NCERT Aligned Curriculum',
    aliases: ['bseb', 'bihar board', 'bihar', 'patna board', 'bihar intermediate']
  },
  {
    id: 'cgbse',
    name: 'Chhattisgarh Board of Secondary Education',
    acronym: 'CGBSE',
    stateOrRegion: 'Chhattisgarh',
    category: 'State Boards',
    description: 'CGBSE conducts High School and Higher Secondary Certificate examinations in Raipur.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'CGBSE / SCERT Chhattisgarh Aligned Curriculum',
    aliases: ['cgbse', 'chhattisgarh board', 'chhattisgarh', 'raipur board']
  },
  {
    id: 'gbshse',
    name: 'Goa Board of Secondary and Higher Secondary Education',
    acronym: 'GBSHSE',
    stateOrRegion: 'Goa',
    category: 'State Boards',
    description: 'Goa state authority for SSC (Class 10) and HSSC (Class 12) certifications.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'GBSHSE / NCERT Aligned State Curriculum',
    aliases: ['gbshse', 'goa board', 'goa', 'hssc goa']
  },
  {
    id: 'gseb',
    name: 'Gujarat Secondary and Higher Secondary Education Board',
    acronym: 'GSEB',
    stateOrRegion: 'Gujarat',
    category: 'State Boards',
    description: 'GSEB conducts Gujarat SSC (Class 10) and HSC (Class 12) science & general streams.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'GSEB State Aligned Curriculum (NCERT text books adopted)',
    aliases: ['gseb', 'gujarat board', 'gujarat', 'gshseb']
  },
  {
    id: 'bseh',
    name: 'Board of School Education Haryana',
    acronym: 'BSEH / HBSE',
    stateOrRegion: 'Haryana',
    category: 'State Boards',
    description: 'BSEH Bhiwani conducts Secondary and Senior Secondary annual examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'BSEH Bhiwani / NCERT Aligned State Curriculum',
    aliases: ['bseh', 'hbse', 'haryana board', 'bhiwani board', 'haryana']
  },
  {
    id: 'hpbose',
    name: 'Himachal Pradesh Board of School Education',
    acronym: 'HPBOSE',
    stateOrRegion: 'Himachal Pradesh',
    category: 'State Boards',
    description: 'HPBOSE Dharamshala conducts Matric and Plus Two state examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'HPBOSE / NCERT Aligned State Curriculum',
    aliases: ['hpbose', 'himachal pradesh', 'himachal board', 'dharamshala board']
  },
  {
    id: 'jac',
    name: 'Jharkhand Academic Council',
    acronym: 'JAC',
    stateOrRegion: 'Jharkhand',
    category: 'State Boards',
    description: 'JAC Ranchi conducts Secondary and Intermediate annual board examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'JAC Ranchi / NCERT Aligned State Curriculum',
    aliases: ['jac', 'jharkhand academic council', 'jharkhand board', 'ranchi board']
  },
  {
    id: 'kseab',
    name: 'Karnataka School Examination and Assessment Board',
    acronym: 'KSEAB (formerly KSEEB / PUE)',
    stateOrRegion: 'Karnataka',
    category: 'State Boards',
    description: 'Unified Karnataka state board for SSLC (Class 10) and 2nd PUC (Class 12).',
    isCurriculumDirectlyMapped: true,
    curriculumTypeDescription: 'Karnataka PUE / KSEAB Curriculum (Verified Direct Syllabus)',
    aliases: ['kseab', 'kseeb', 'pue', 'karnataka state board', 'karnataka puc', 'karnataka sslc', 'karnataka']
  },
  {
    id: 'kbpe',
    name: 'Kerala Board of Public Examinations',
    acronym: 'KBPE / DHSE Kerala',
    stateOrRegion: 'Kerala',
    category: 'State Boards',
    description: 'Conducts SSLC (Class 10) and Higher Secondary (DHSE Class 11-12) examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'SCERT Kerala / DHSE Aligned State Curriculum',
    aliases: ['kbpe', 'dhse kerala', 'kerala board', 'kerala sslc', 'kerala plus two', 'kerala']
  },
  {
    id: 'mpbse',
    name: 'Madhya Pradesh Board of Secondary Education',
    acronym: 'MPBSE',
    stateOrRegion: 'Madhya Pradesh',
    category: 'State Boards',
    description: 'MPBSE Bhopal conducts High School (Class 10) and Higher Secondary (Class 12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'MPBSE Bhopal / NCERT Aligned Curriculum',
    aliases: ['mpbse', 'madhya pradesh board', 'mp board', 'bhopal board']
  },
  {
    id: 'msbshse',
    name: 'Maharashtra State Board of Secondary and Higher Secondary Education',
    acronym: 'MSBSHSE',
    stateOrRegion: 'Maharashtra',
    category: 'State Boards',
    description: 'Conducts SSC (Class 10) and HSC (Class 12) examinations across 9 divisional boards.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'Maharashtra State Board (Balbharati / NCERT Aligned)',
    aliases: ['msbshse', 'maharashtra state board', 'maharashtra board', 'ssc maharashtra', 'hsc maharashtra', 'pune board', 'mumbai board']
  },
  {
    id: 'bsem',
    name: 'Board of Secondary Education, Manipur',
    acronym: 'BSEM / COHSEM',
    stateOrRegion: 'Manipur',
    category: 'State Boards',
    description: 'BSEM (HSLC Class 10) & COHSEM (Higher Secondary Class 11-12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'BSEM / COHSEM Aligned State Curriculum',
    aliases: ['bsem', 'cohsem', 'manipur board', 'manipur']
  },
  {
    id: 'mbose',
    name: 'Meghalaya Board of School Education',
    acronym: 'MBOSE',
    stateOrRegion: 'Meghalaya',
    category: 'State Boards',
    description: 'MBOSE Tura conducts SSLC and HSSLC examinations in Meghalaya.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'MBOSE / NCERT Aligned State Curriculum',
    aliases: ['mbose', 'meghalaya board', 'meghalaya', 'tura board']
  },
  {
    id: 'mbse',
    name: 'Mizoram Board of School Education',
    acronym: 'MBSE',
    stateOrRegion: 'Mizoram',
    category: 'State Boards',
    description: 'MBSE Aizawl conducts High School and Higher Secondary examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'MBSE / NCERT Aligned State Curriculum',
    aliases: ['mbse', 'mizoram board', 'mizoram', 'aizawl board']
  },
  {
    id: 'nbse',
    name: 'Nagaland Board of School Education',
    acronym: 'NBSE',
    stateOrRegion: 'Nagaland',
    category: 'State Boards',
    description: 'NBSE Kohima conducts HSLC (Class 10) and HSSLC (Class 12) examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'NBSE Kohima / NCERT Aligned State Curriculum',
    aliases: ['nbse', 'nagaland board', 'nagaland', 'kohima board']
  },
  {
    id: 'bseodisha',
    name: 'Board of Secondary Education, Odisha',
    acronym: 'BSE Odisha / CHSE',
    stateOrRegion: 'Odisha',
    category: 'State Boards',
    description: 'BSE Odisha (HSC Class 10) & CHSE Odisha (+2 Higher Secondary).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'BSE Odisha / CHSE / NCERT Aligned State Curriculum',
    aliases: ['bse odisha', 'chse odisha', 'odisha board', 'orissa board']
  },
  {
    id: 'pseb',
    name: 'Punjab School Education Board',
    acronym: 'PSEB',
    stateOrRegion: 'Punjab',
    category: 'State Boards',
    description: 'PSEB Mohali conducts Matriculation (Class 10) and Senior Secondary (Class 12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'PSEB Mohali / NCERT Aligned State Curriculum',
    aliases: ['pseb', 'punjab school education board', 'punjab board', 'mohali board']
  },
  {
    id: 'rbse',
    name: 'Board of Secondary Education, Rajasthan',
    acronym: 'RBSE / BSER',
    stateOrRegion: 'Rajasthan',
    category: 'State Boards',
    description: 'RBSE Ajmer conducts Secondary (Class 10) and Senior Secondary (Class 12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'RBSE Ajmer / NCERT Textbooks Aligned Curriculum',
    aliases: ['rbse', 'bser', 'rajasthan board', 'ajmer board', 'rajasthan']
  },
  {
    id: 'sikkim',
    name: 'State Board of School Education, Sikkim',
    acronym: 'SBSE Sikkim',
    stateOrRegion: 'Sikkim',
    category: 'State Boards',
    description: 'State Directorate of Education, Sikkim (utilizes CBSE-affiliated curriculum framework).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'NCERT / CBSE Aligned State Framework',
    aliases: ['sikkim board', 'sikkim education', 'sikkim']
  },
  {
    id: 'tndge',
    name: 'Tamil Nadu Directorate of Government Examinations',
    acronym: 'TNDGE / TN State Board',
    stateOrRegion: 'Tamil Nadu',
    category: 'State Boards',
    description: 'Conducts SSLC (Class 10) and Higher Secondary (+1 & +2 Class 11-12) examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'Tamil Nadu State Board / Samacheer Kalvi Curriculum',
    aliases: ['tamil nadu state board', 'tndge', 'tn board', 'samacheer kalvi', 'tamil nadu']
  },
  {
    id: 'bsetelangana',
    name: 'Telangana Board of Secondary Education',
    acronym: 'BSE Telangana / TSBIE',
    stateOrRegion: 'Telangana',
    category: 'State Boards',
    description: 'BSE Telangana (SSC Class 10) & TSBIE (Intermediate Class 11-12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'TSBIE / SCERT Telangana Aligned State Curriculum',
    aliases: ['bse telangana', 'tsbie', 'telangana board', 'telangana intermediate', 'hyderabad board']
  },
  {
    id: 'tbse',
    name: 'Tripura Board of Secondary Education',
    acronym: 'TBSE',
    stateOrRegion: 'Tripura',
    category: 'State Boards',
    description: 'TBSE Agartala conducts Madhyamik (Class 10) and Higher Secondary (Class 12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'TBSE Agartala / NCERT Aligned Curriculum',
    aliases: ['tbse', 'tripura board', 'agartala board', 'tripura']
  },
  {
    id: 'upmsp',
    name: 'Board of High School and Intermediate Education, Uttar Pradesh',
    acronym: 'UPMSP',
    stateOrRegion: 'Uttar Pradesh',
    category: 'State Boards',
    description: 'UPMSP Prayagraj conducts High School (Class 10) and Intermediate (Class 12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'UPMSP Prayagraj / NCERT Curriculum Aligned',
    aliases: ['upmsp', 'up board', 'uttar pradesh board', 'prayagraj board', 'allahabad board', 'up']
  },
  {
    id: 'ubse',
    name: 'Uttarakhand Board of School Education',
    acronym: 'UBSE',
    stateOrRegion: 'Uttarakhand',
    category: 'State Boards',
    description: 'UBSE Ramnagar conducts High School and Intermediate examinations.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'UBSE Ramnagar / NCERT Aligned State Curriculum',
    aliases: ['ubse', 'uttarakhand board', 'uttaranchal board', 'ramnagar board', 'uttarakhand']
  },
  {
    id: 'wbbse',
    name: 'West Bengal Board of Secondary Education',
    acronym: 'WBBSE / WBCHSE',
    stateOrRegion: 'West Bengal',
    category: 'State Boards',
    description: 'WBBSE conducts Madhyamik (Class 10) & WBCHSE conducts Uccha Madhyamik (Class 12).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'WBBSE / WBCHSE State Aligned Curriculum',
    aliases: ['wbbse', 'wbchse', 'west bengal board', 'kolkata board', 'madhyamik', 'bengal']
  },

  // ==========================================
  // 3. UNION TERRITORIES / APPLICABLE BOARDS
  // ==========================================
  {
    id: 'dbse_delhi',
    name: 'Delhi Board of School Education',
    acronym: 'DBSE / Delhi UT',
    stateOrRegion: 'Delhi (NCT)',
    category: 'Union Territory / Applicable Boards',
    description: 'Delhi Board of School Education (DBSE) along with CBSE/CISCE recognized schools.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'DBSE / NCERT Curriculum Framework',
    aliases: ['dbse', 'delhi board', 'delhi ut', 'delhi state board', 'nct delhi']
  },
  {
    id: 'jkbose',
    name: 'Jammu and Kashmir Board of School Education',
    acronym: 'JKBOSE',
    stateOrRegion: 'Jammu and Kashmir',
    category: 'Union Territory / Applicable Boards',
    description: 'JKBOSE conducts Class 10 and Class 12 exams across Jammu and Kashmir UT.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'JKBOSE / NCERT Aligned UT Curriculum',
    aliases: ['jkbose', 'jammu and kashmir', 'j&k board', 'kashmir board', 'jammu board']
  },
  {
    id: 'ladakh_board',
    name: 'Ladakh School Education (JKBOSE / CBSE Aligned)',
    acronym: 'Ladakh UT Board',
    stateOrRegion: 'Ladakh',
    category: 'Union Territory / Applicable Boards',
    description: 'Schools in Ladakh affiliated through JKBOSE and CBSE educational frameworks.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'JKBOSE / CBSE Aligned UT Curriculum',
    aliases: ['ladakh', 'leh board', 'kargil board', 'ladakh ut']
  },
  {
    id: 'andaman_board',
    name: 'Andaman & Nicobar Islands Directorate of Education',
    acronym: 'A&N Education (CBSE Aligned)',
    stateOrRegion: 'Andaman and Nicobar Islands',
    category: 'Union Territory / Applicable Boards',
    description: 'Secondary and Senior Secondary schools administered under CBSE/NCERT framework.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'CBSE / NCERT Aligned UT Framework',
    aliases: ['andaman', 'nicobar', 'port blair', 'andaman and nicobar']
  },
  {
    id: 'chandigarh_board',
    name: 'Chandigarh Education Department',
    acronym: 'Chandigarh UT (CBSE Aligned)',
    stateOrRegion: 'Chandigarh',
    category: 'Union Territory / Applicable Boards',
    description: 'Schools administered under Chandigarh UT Education following CBSE standards.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'CBSE / NCERT Aligned UT Framework',
    aliases: ['chandigarh', 'chandigarh board', 'chandigarh ut']
  },
  {
    id: 'dnhdd_board',
    name: 'Dadra and Nagar Haveli and Daman and Diu Education',
    acronym: 'DNH & DD (GSEB / CBSE Aligned)',
    stateOrRegion: 'Dadra & Nagar Haveli and Daman & Diu',
    category: 'Union Territory / Applicable Boards',
    description: 'Schools affiliated with Gujarat State Board (GSEB), Maharashtra State Board, and CBSE.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'State / CBSE Aligned UT Framework',
    aliases: ['dnh', 'daman and diu', 'dadra and nagar haveli', 'silvassa', 'daman']
  },
  {
    id: 'lakshadweep_board',
    name: 'Lakshadweep Education Department',
    acronym: 'Lakshadweep (KBPE / CBSE Aligned)',
    stateOrRegion: 'Lakshadweep',
    category: 'Union Territory / Applicable Boards',
    description: 'Schools administered following Kerala State Board (KBPE) and CBSE curricula.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'KBPE / CBSE Aligned UT Framework',
    aliases: ['lakshadweep', 'kavaratti', 'lakshadweep ut']
  },
  {
    id: 'puducherry_board',
    name: 'Puducherry Directorate of School Education',
    acronym: 'Puducherry (TNDGE / CBSE Aligned)',
    stateOrRegion: 'Puducherry',
    category: 'Union Territory / Applicable Boards',
    description: 'Schools affiliated with Tamil Nadu State Board (TNDGE), Kerala Board (Mahe), and Andhra (Yanam).',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'TNDGE / State Aligned UT Framework',
    aliases: ['puducherry', 'pondicherry', 'pondicherry board']
  },

  // ==========================================
  // 4. INTERNATIONAL BOARDS
  // ==========================================
  {
    id: 'ib',
    name: 'International Baccalaureate',
    acronym: 'IB (MYP / DP)',
    stateOrRegion: 'International',
    category: 'International Boards',
    description: 'International curriculum offering the IB Middle Years Programme and Diploma Programme.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'International Baccalaureate Curriculum Framework',
    aliases: ['ib', 'international baccalaureate', 'ibdp', 'myp']
  },
  {
    id: 'cambridge',
    name: 'Cambridge Assessment International Education',
    acronym: 'Cambridge (IGCSE / A-Levels)',
    stateOrRegion: 'International',
    category: 'International Boards',
    description: 'Cambridge International examinations offering IGCSE and International AS/A Levels.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'Cambridge International Assessment Curriculum',
    aliases: ['cambridge', 'cie', 'igcse', 'a levels', 'o levels', 'caie']
  },
  {
    id: 'other_international',
    name: 'Other Recognized International Board',
    acronym: 'International Board',
    stateOrRegion: 'International',
    category: 'International Boards',
    description: 'American High School Diploma (AP), European Baccalaureate, or other foreign curriculum.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'Recognized International High School Curriculum',
    aliases: ['international', 'american diploma', 'advanced placement', 'edexcel', 'foreign board']
  },

  // ==========================================
  // 5. OTHER / NOT LISTED
  // ==========================================
  {
    id: 'other_custom',
    name: 'Other / Not Listed Board',
    acronym: 'Other',
    stateOrRegion: 'Other / Autonomous',
    category: 'Other',
    description: 'Autonomous school board, specialized state council, or board not listed above.',
    isCurriculumDirectlyMapped: false,
    curriculumTypeDescription: 'Custom / Standard Secondary Curriculum Framework',
    aliases: ['other', 'not listed', 'custom', 'autonomous']
  }
];

export const BOARD_CATEGORIES: BoardCategory[] = [
  'National Boards',
  'State Boards',
  'Union Territory / Applicable Boards',
  'International Boards',
  'Other'
];

/**
 * Normalizes any legacy or free-text board value to a matching BoardOption.
 * Handles legacy profile strings such as 'CBSE', 'CISCE (ICSE/ISC)', 'Karnataka State Board', 'NIOS', etc.
 */
export function normalizeBoardToOption(boardValue?: string): BoardOption {
  if (!boardValue || !boardValue.trim()) {
    return EDUCATION_BOARDS[0]; // Default CBSE
  }

  const clean = boardValue.trim().toLowerCase();

  // 1. Direct ID match
  const byId = EDUCATION_BOARDS.find(b => b.id === clean);
  if (byId) return byId;

  // 2. Direct acronym match
  const byAcronym = EDUCATION_BOARDS.find(b => b.acronym.toLowerCase() === clean);
  if (byAcronym) return byAcronym;

  // 3. Exact name match
  const byName = EDUCATION_BOARDS.find(b => b.name.toLowerCase() === clean);
  if (byName) return byName;

  // 4. Aliases match
  const byAlias = EDUCATION_BOARDS.find(b => b.aliases.some(a => a === clean || clean.includes(a) || a.includes(clean)));
  if (byAlias) return byAlias;

  // 5. Special legacy mapping
  if (clean.includes('karnataka')) {
    return EDUCATION_BOARDS.find(b => b.id === 'kseab') || EDUCATION_BOARDS[0];
  }
  if (clean.includes('cisce') || clean.includes('icse') || clean.includes('isc')) {
    return EDUCATION_BOARDS.find(b => b.id === 'cisce') || EDUCATION_BOARDS[0];
  }
  if (clean.includes('cbse')) {
    return EDUCATION_BOARDS.find(b => b.id === 'cbse') || EDUCATION_BOARDS[0];
  }
  if (clean.includes('nios')) {
    return EDUCATION_BOARDS.find(b => b.id === 'nios') || EDUCATION_BOARDS[0];
  }

  // Fallback to "Other / Not Listed"
  return EDUCATION_BOARDS.find(b => b.id === 'other_custom') || EDUCATION_BOARDS[EDUCATION_BOARDS.length - 1];
}

export const resolveBoardOption = normalizeBoardToOption;

/**
 * Searches and returns boards grouped by category based on a query.
 */
export function searchEducationBoards(query: string = ''): Record<BoardCategory, BoardOption[]> {
  const q = query.trim().toLowerCase();

  const grouped: Record<BoardCategory, BoardOption[]> = {
    'National Boards': [],
    'State Boards': [],
    'Union Territory / Applicable Boards': [],
    'International Boards': [],
    'Other': []
  };

  for (const board of EDUCATION_BOARDS) {
    if (!q) {
      grouped[board.category].push(board);
      continue;
    }

    const matches = 
      board.name.toLowerCase().includes(q) ||
      board.acronym.toLowerCase().includes(q) ||
      board.stateOrRegion.toLowerCase().includes(q) ||
      board.category.toLowerCase().includes(q) ||
      board.aliases.some(alias => alias.toLowerCase().includes(q));

    if (matches) {
      grouped[board.category].push(board);
    }
  }

  return grouped;
}

/**
 * Formats a board for display in option lists and chips:
 * e.g., "Central Board of Secondary Education (CBSE) — National"
 */
export function formatBoardOptionLabel(board: BoardOption): string {
  if (board.id === 'other_custom') return 'Other / Not Listed (Enter Custom Board)';
  return `${board.name} (${board.acronym}) — ${board.stateOrRegion}`;
}

export {
  determineCurrentAcademicYear,
  formatAcademicYearDisplay,
  getAcademicCalendarRule,
  ACADEMIC_CALENDAR_RULES,
  DEFAULT_ACADEMIC_CALENDAR_RULE
} from './academicCalendar.ts';
export type { AcademicCalendarRule } from './academicCalendar.ts';
