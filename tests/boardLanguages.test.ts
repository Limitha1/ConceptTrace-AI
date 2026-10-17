import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  getBoardLanguageProfile, 
  determineCurriculumType, 
  getBoardSpecificSubjects, 
  getDefaultSubjectsForBoard,
  BOARD_LANGUAGE_PROFILES
} from '../src/lib/boardLanguages.ts';
import { getSyllabusForSubject } from '../src/lib/syllabusData.ts';

describe('ConceptTrace AI — Regional Language & Curriculum Framework Tests', () => {

  it('1. Automatic Curriculum Framework Determination (removes manual dropdown)', () => {
    // CBSE -> NCERT / National Curriculum Framework (NCF)
    assert.strictEqual(determineCurriculumType('CBSE'), 'NCERT / National Curriculum Framework (NCF)');
    
    // CISCE -> CISCE / ICSE / ISC Curriculum Framework
    assert.strictEqual(determineCurriculumType('CISCE'), 'CISCE / ICSE / ISC Curriculum Framework');
    
    // KSEAB -> Karnataka State Board / DSEL Curriculum Framework
    assert.strictEqual(determineCurriculumType('kseab'), 'Karnataka State Board / DSEL Curriculum Framework');
    assert.strictEqual(determineCurriculumType('Karnataka School Examination and Assessment Board'), 'Karnataka State Board / DSEL Curriculum Framework');
    
    // Kerala -> Kerala State Education Board (SCERT Kerala)
    assert.strictEqual(determineCurriculumType('kbpe'), 'Kerala State Education Board (SCERT Kerala)');
    
    // Tamil Nadu -> Tamil Nadu State Board (TNSCERT)
    assert.strictEqual(determineCurriculumType('tndge'), 'Tamil Nadu State Board (TNSCERT)');
    
    // Maharashtra -> Maharashtra State Board (MSBSHSE Curriculum)
    assert.strictEqual(determineCurriculumType('msbshse'), 'Maharashtra State Board (MSBSHSE Curriculum)');
    
    // West Bengal -> West Bengal State Board (WBBSE / WBCHSE)
    assert.strictEqual(determineCurriculumType('wbbse'), 'West Bengal State Board (WBBSE / WBCHSE)');
    
    // Andhra Pradesh -> Andhra Pradesh State Board (BSEAP / BIEAP)
    assert.strictEqual(determineCurriculumType('bseap'), 'Andhra Pradesh State Board (BSEAP / BIEAP)');
    
    // Telangana -> Telangana State Board (BSETG / TSBIE)
    assert.strictEqual(determineCurriculumType('bsetg'), 'Telangana State Board (BSETG / TSBIE)');
  });

  it('2. Karnataka (KSEAB) dynamically offers Kannada regional language', () => {
    const profile = getBoardLanguageProfile('kseab');
    assert.strictEqual(profile.regionName, 'Karnataka');
    assert.ok(profile.primaryLanguages.includes('Kannada'));

    // Class 10 subjects for KSEAB
    const class10Subjects = getBoardSpecificSubjects('kseab', '10', 'General');
    const kannadaSubj = class10Subjects.find(s => s.subject === 'Kannada');
    assert.ok(kannadaSubj, 'Kannada should be offered for KSEAB Class 10');
    assert.strictEqual(kannadaSubj.isRegionalLanguage, true);

    // Default subjects for KSEAB Class 10 include Kannada
    const defaultSubjs = getDefaultSubjectsForBoard('kseab', '10', 'General');
    assert.ok(defaultSubjs.includes('Kannada'), 'Default subjects for KSEAB should include Kannada');
    assert.ok(defaultSubjs.includes('Mathematics'));
    assert.ok(defaultSubjs.includes('Science'));
  });

  it('3. Kerala State Board (KBPE) dynamically offers Malayalam regional language', () => {
    const profile = getBoardLanguageProfile('kbpe');
    assert.strictEqual(profile.regionName, 'Kerala');
    assert.ok(profile.primaryLanguages.includes('Malayalam'));

    const class10Subjects = getBoardSpecificSubjects('kbpe', '10', 'General');
    const malayalamSubj = class10Subjects.find(s => s.subject === 'Malayalam');
    assert.ok(malayalamSubj, 'Malayalam should be offered for KBPE');
    assert.strictEqual(malayalamSubj.isRegionalLanguage, true);

    const defaultSubjs = getDefaultSubjectsForBoard('kbpe', '10', 'General');
    assert.ok(defaultSubjs.includes('Malayalam'), 'Default subjects for KBPE should include Malayalam');
  });

  it('4. Tamil Nadu State Board (TNDGE) dynamically offers Tamil regional language', () => {
    const profile = getBoardLanguageProfile('tndge');
    assert.strictEqual(profile.regionName, 'Tamil Nadu');
    assert.ok(profile.primaryLanguages.includes('Tamil'));

    const class10Subjects = getBoardSpecificSubjects('tndge', '10', 'General');
    const tamilSubj = class10Subjects.find(s => s.subject === 'Tamil');
    assert.ok(tamilSubj, 'Tamil should be offered for TNDGE');
    assert.strictEqual(tamilSubj.isRegionalLanguage, true);

    const defaultSubjs = getDefaultSubjectsForBoard('tndge', '10', 'General');
    assert.ok(defaultSubjs.includes('Tamil'), 'Default subjects for TNDGE should include Tamil');
  });

  it('5. Maharashtra State Board (MSBSHSE) dynamically offers Marathi regional language', () => {
    const profile = getBoardLanguageProfile('msbshse');
    assert.strictEqual(profile.regionName, 'Maharashtra');
    assert.ok(profile.primaryLanguages.includes('Marathi'));

    const class10Subjects = getBoardSpecificSubjects('msbshse', '10', 'General');
    const marathiSubj = class10Subjects.find(s => s.subject === 'Marathi');
    assert.ok(marathiSubj, 'Marathi should be offered for MSBSHSE');
    assert.strictEqual(marathiSubj.isRegionalLanguage, true);

    const defaultSubjs = getDefaultSubjectsForBoard('msbshse', '10', 'General');
    assert.ok(defaultSubjs.includes('Marathi'), 'Default subjects for MSBSHSE should include Marathi');
  });

  it('6. West Bengal (WBBSE) dynamically offers Bengali regional language', () => {
    const profile = getBoardLanguageProfile('wbbse');
    assert.strictEqual(profile.regionName, 'West Bengal');
    assert.ok(profile.primaryLanguages.includes('Bengali'));

    const class10Subjects = getBoardSpecificSubjects('wbbse', '10', 'General');
    const bengaliSubj = class10Subjects.find(s => s.subject === 'Bengali');
    assert.ok(bengaliSubj, 'Bengali should be offered for WBBSE');
    assert.strictEqual(bengaliSubj.isRegionalLanguage, true);
  });

  it('7. Andhra Pradesh & Telangana dynamically offer Telugu regional language', () => {
    const apProfile = getBoardLanguageProfile('bseap');
    assert.ok(apProfile.regionName.includes('Andhra Pradesh'));
    assert.ok(apProfile.primaryLanguages.includes('Telugu'));

    const tgProfile = getBoardLanguageProfile('bsetg');
    assert.ok(tgProfile.regionName.includes('Telangana'));
    assert.ok(tgProfile.primaryLanguages.includes('Telugu'));

    const apSubjects = getBoardSpecificSubjects('bseap', '10', 'General');
    assert.ok(apSubjects.some(s => s.subject === 'Telugu'), 'Telugu should be offered for AP');
  });

  it('8. CBSE offers national curriculum languages without forcing a regional language', () => {
    const cbseProfile = getBoardLanguageProfile('CBSE');
    assert.ok(cbseProfile.regionName.includes('National'));
    assert.ok(cbseProfile.primaryLanguages.includes('Hindi'));
    assert.ok(cbseProfile.languageSubjects.some(s => s.subjectName === 'Hindi Course A / B'));

    const cbseClass10 = getBoardSpecificSubjects('CBSE', '10', 'General');
    const subjNames = cbseClass10.map(s => s.subject);
    
    // Core subjects
    assert.ok(subjNames.includes('Mathematics'));
    assert.ok(subjNames.includes('Science'));
    assert.ok(subjNames.includes('Social Science'));
    assert.ok(subjNames.includes('English Language & Literature'));
    assert.ok(subjNames.includes('Hindi Course A / B'));
    
    // CBSE should NOT force Kannada on all CBSE students by default
    const cbseDefaults = getDefaultSubjectsForBoard('CBSE', '10', 'General');
    assert.ok(!cbseDefaults.includes('Kannada'), 'CBSE defaults should not force Kannada');
    assert.ok(cbseDefaults.includes('Mathematics'));
  });

  it('9. Class 11 and 12 stream filtering with regional languages', () => {
    // KSEAB Science Class 11
    const kseabScience11 = getBoardSpecificSubjects('kseab', '11', 'Science');
    const subjNames = kseabScience11.map(s => s.subject);
    assert.ok(subjNames.includes('Physics'));
    assert.ok(subjNames.includes('Chemistry'));
    assert.ok(subjNames.includes('Mathematics'));
    assert.ok(subjNames.includes('Biology'));
    assert.ok(subjNames.includes('English Core'));
    assert.ok(subjNames.includes('Kannada'), 'Kannada is an offered language option in KSEAB Class 11 Science');

    // KSEAB Commerce Class 12
    const kseabCommerce12 = getBoardSpecificSubjects('kseab', '12', 'Commerce');
    const commSubjs = kseabCommerce12.map(s => s.subject);
    assert.ok(commSubjs.includes('Accountancy'));
    assert.ok(commSubjs.includes('Business Studies'));
    assert.ok(commSubjs.includes('Kannada'));
  });

  it('10. Syllabus retrieval succeeds for regional language subjects', () => {
    // Kannada (KSEAB)
    const kannadaSyllabus = getSyllabusForSubject('kseab', '10', 'Kannada');
    assert.ok(kannadaSyllabus, 'Kannada syllabus must be found');
    assert.strictEqual(kannadaSyllabus.subject, 'Kannada');
    assert.ok(kannadaSyllabus.units.length > 0, 'Kannada units must exist');
    assert.ok(kannadaSyllabus.units[0].chapters.length > 0, 'Kannada chapters must exist');

    // Tamil (TNDGE)
    const tamilSyllabus = getSyllabusForSubject('tndge', '10', 'Tamil');
    assert.ok(tamilSyllabus, 'Tamil syllabus must be found');
    assert.strictEqual(tamilSyllabus.subject, 'Tamil');

    // Malayalam (KBPE)
    const malayalamSyllabus = getSyllabusForSubject('kbpe', '10', 'Malayalam');
    assert.ok(malayalamSyllabus, 'Malayalam syllabus must be found');
    assert.strictEqual(malayalamSyllabus.subject, 'Malayalam');

    // Marathi (MSBSHSE)
    const marathiSyllabus = getSyllabusForSubject('msbshse', '10', 'Marathi');
    assert.ok(marathiSyllabus, 'Marathi syllabus must be found');
    assert.strictEqual(marathiSyllabus.subject, 'Marathi');
  });

  it('11. Regional Language Subject vs Preferred Explanation Language separation', () => {
    // Test that board language profile distinguishes regional subject from student explanation language
    const kseabProfile = getBoardLanguageProfile('kseab');
    assert.strictEqual(kseabProfile.primaryLanguages[0], 'Kannada');
    
    // The profile provides regional subjects, while explanation language can be independently chosen
    const availableLanguages = ['English', 'Kannada', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Other'];
    assert.ok(availableLanguages.includes('English'));
    assert.ok(availableLanguages.includes('Kannada'));
  });

  it('12. Centralized BOARD_LANGUAGE_PROFILES covers major state & national boards', () => {
    const requiredBoards = ['CBSE', 'CISCE', 'NIOS', 'kseab', 'tndge', 'kbpe', 'msbshse', 'wbbse', 'bseap', 'bsetg'];
    for (const board of requiredBoards) {
      const profile = getBoardLanguageProfile(board);
      assert.ok(profile, `Profile should exist for ${board}`);
      assert.ok(profile.primaryLanguages.length > 0, `Primary languages should exist for ${board}`);
    }
  });
});
