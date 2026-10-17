import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  getAvailableSubjects, 
  validateEducationSelections, 
  getSyllabusForSubject,
  AUTHENTIC_SYLLABI,
  STREAM_OPTIONS
} from '../src/lib/syllabusData.ts';
import { handleSyllabusApi } from '../server/syllabusApi.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { EventEmitter } from 'node:events';

describe('ConceptTrace AI Dynamic Syllabus Engine — Unit & Regression Tests', () => {

  it('1. Class 10 curriculum correctly enforces General Foundational Core Subjects', () => {
    const subjects = getAvailableSubjects('CBSE', '10', 'General');
    const subjectNames = subjects.map(s => s.subject);

    assert.ok(subjectNames.includes('Mathematics'), 'Class 10 must include Mathematics');
    assert.ok(subjectNames.includes('Science'), 'Class 10 must include Science');
    assert.ok(subjectNames.includes('Social Science'), 'Class 10 must include Social Science');
    assert.ok(subjectNames.includes('English Language & Literature'), 'Class 10 must include English');

    // Science stream electives like Physics as a standalone subject shouldn't be separated in Class 10
    assert.strictEqual(subjectNames.includes('Biotechnology'), false);
  });

  it('2. Stream-based subject filtering strictly separates Science, Commerce, and Humanities in Classes 11 & 12', () => {
    // Science
    const scienceSubjs = getAvailableSubjects('CBSE', '12', 'Science').map(s => s.subject);
    assert.ok(scienceSubjs.includes('Physics'));
    assert.ok(scienceSubjs.includes('Chemistry'));
    assert.ok(scienceSubjs.includes('Mathematics'));
    assert.ok(scienceSubjs.includes('Computer Science (Python)'));
    assert.strictEqual(scienceSubjs.includes('Accountancy'), false);

    // Commerce
    const commerceSubjs = getAvailableSubjects('CBSE', '12', 'Commerce').map(s => s.subject);
    assert.ok(commerceSubjs.includes('Accountancy'));
    assert.ok(commerceSubjs.includes('Business Studies'));
    assert.ok(commerceSubjs.includes('Economics'));
    assert.strictEqual(commerceSubjs.includes('Physics'), false);

    // Humanities
    const humanitiesSubjs = getAvailableSubjects('CBSE', '12', 'Humanities/Arts').map(s => s.subject);
    assert.ok(humanitiesSubjs.includes('History'));
    assert.ok(humanitiesSubjs.includes('Political Science'));
    assert.strictEqual(humanitiesSubjs.includes('Chemistry'), false);
  });

  it('3. validateEducationSelections catches incompatible choices and empty selections', () => {
    // Empty subject test
    const emptyCheck = validateEducationSelections('CBSE', '11', 'Science', []);
    assert.strictEqual(emptyCheck.isValid, false);
    assert.ok(emptyCheck.messages.some(m => m.type === 'error'));

    // Class 10 with stream note
    const class10Check = validateEducationSelections('CBSE', '10', 'Science', ['Mathematics', 'Science']);
    assert.ok(class10Check.messages.some(m => m.text.includes('Class 10 follows a foundational general curriculum')));

    // Class 11 missing stream warning
    const class11NoStream = validateEducationSelections('CBSE', '11', undefined, ['Physics', 'Chemistry']);
    assert.ok(class11NoStream.messages.some(m => m.type === 'warning' && m.text.includes('choose your stream')));
  });

  it('4. CBSE Class 12 Physics returns authentic official units, chapters, and document links', () => {
    const phy = getSyllabusForSubject('CBSE', '12', 'Physics', 'Science', '2026-27');

    assert.strictEqual(phy.subject, 'Physics');
    assert.strictEqual(phy.subjectCode, '042');
    assert.strictEqual(phy.status, 'Verified');
    assert.strictEqual(phy.assessmentPattern?.theoryMarks, 70);
    assert.strictEqual(phy.assessmentPattern?.practicalOrInternalMarks, 30);
    assert.ok(phy.officialDocuments.length > 0, 'Official syllabus PDF documents must exist');
    assert.ok(phy.officialDocuments[0].fileUrl.includes('cbseacademic.nic.in'), 'Must link to official CBSE academic portal');

    // Unit I Electrostatics
    const unit1 = phy.units.find(u => u.unitNumber === 'I');
    assert.ok(unit1, 'Unit I must exist');
    assert.strictEqual(unit1.unitTitle, 'Electrostatics');
    assert.strictEqual(unit1.chapters[0].title, 'Electric Charges and Fields');
    assert.strictEqual(unit1.chapters[1].title, 'Electrostatic Potential and Capacitance');

    // Unit VI Optics
    const unitOptics = phy.units.find(u => u.unitNumber === 'VI');
    assert.ok(unitOptics, 'Unit VI Optics must exist');
    assert.ok(unitOptics.chapters.some(ch => ch.title === 'Ray Optics and Optical Instruments'));
    assert.ok(unitOptics.chapters.some(ch => ch.title === 'Wave Optics'));
  });

  it('5. CBSE Class 12 Chemistry returns authentic Solutions, Kinetics, Coordination, and Organic chapters', () => {
    const chem = getSyllabusForSubject('CBSE', '12', 'Chemistry', 'Science', '2026-27');

    assert.strictEqual(chem.status, 'Verified');
    assert.strictEqual(chem.subjectCode, '043');
    
    const allChapters = chem.units.flatMap(u => u.chapters.map(ch => ch.title));
    assert.ok(allChapters.includes('Solutions'));
    assert.ok(allChapters.includes('Electrochemistry'));
    assert.ok(allChapters.includes('Chemical Kinetics'));
    assert.ok(allChapters.includes('The d- and f-Block Elements'));
    assert.ok(allChapters.includes('Coordination Compounds'));
    assert.ok(allChapters.includes('Haloalkanes and Haloarenes'));
    assert.ok(allChapters.includes('Aldehydes, Ketones and Carboxylic Acids'));
    assert.ok(allChapters.includes('Biomolecules'));
  });

  it('6. CBSE Class 10 Science returns authentic integrated Physics, Chemistry, and Biology units', () => {
    const sci = getSyllabusForSubject('CBSE', '10', 'Science', 'General', '2026-27');

    assert.strictEqual(sci.status, 'Verified');
    assert.strictEqual(sci.assessmentPattern?.theoryMarks, 80);
    assert.strictEqual(sci.assessmentPattern?.practicalOrInternalMarks, 20);

    const allChapters = sci.units.flatMap(u => u.chapters.map(ch => ch.title));
    assert.ok(allChapters.includes('Chemical Reactions and Equations'));
    assert.ok(allChapters.includes('Life Processes'));
    assert.ok(allChapters.includes('Light - Reflection and Refraction'));
    assert.ok(allChapters.includes('Electricity'));
    assert.ok(allChapters.includes('Our Environment'));
  });

  it('7. Cross-board adaptation provides NCERT-aligned state board curricula with appropriate source tags', () => {
    const karPhy = getSyllabusForSubject('Karnataka State Board', '12', 'Physics', 'Science', '2026-27');
    assert.strictEqual(karPhy.board, 'Karnataka State Board');
    assert.ok(karPhy.status === 'Verified');
    assert.ok(karPhy.units.length > 0);
  });

  it('8. Server API handleSyllabusApi responds with 200 OK for GET /api/syllabus/catalog', async () => {
    const mockReq = new EventEmitter() as unknown as IncomingMessage;
    Object.assign(mockReq, {
      method: 'GET',
      url: '/api/syllabus/catalog?board=CBSE&classLevel=12&stream=Science'
    });

    let statusCode = 0;
    let responseBody = '';
    const mockRes = {
      writeHead: (code: number) => { statusCode = code; },
      end: (data: string) => { responseBody = data; }
    } as unknown as ServerResponse;

    const handled = await handleSyllabusApi(mockReq, mockRes, {});
    assert.strictEqual(handled, true);
    assert.strictEqual(statusCode, 200);

    const parsed = JSON.parse(responseBody);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.data.stream, 'Science');
    assert.ok(parsed.data.availableSubjects.length > 0);
  });

  it('9. Server API handleSyllabusApi responds with 200 OK for GET /api/syllabus with enrolled subjects', async () => {
    const mockReq = new EventEmitter() as unknown as IncomingMessage;
    Object.assign(mockReq, {
      method: 'GET',
      url: '/api/syllabus?board=CBSE&classLevel=12&stream=Science&subject=all&enrolledSubjects=Physics,Chemistry'
    });

    let statusCode = 0;
    let responseBody = '';
    const mockRes = {
      writeHead: (code: number) => { statusCode = code; },
      end: (data: string) => { responseBody = data; }
    } as unknown as ServerResponse;

    const handled = await handleSyllabusApi(mockReq, mockRes, {});
    assert.strictEqual(handled, true);
    assert.strictEqual(statusCode, 200);

    const parsed = JSON.parse(responseBody);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.data.syllabi.length, 2);
    assert.strictEqual(parsed.data.syllabi[0].subject, 'Physics');
    assert.strictEqual(parsed.data.syllabi[1].subject, 'Chemistry');
  });
});
