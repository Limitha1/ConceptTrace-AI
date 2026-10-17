import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSyllabusVerification } from '../src/lib/syllabusVerification.ts';
import { getSyllabusForSubject, getDefaultSubjectsForBoard } from '../src/lib/syllabusData.ts';
import type { SubjectSyllabus } from '../src/types/index.ts';

describe('ConceptTrace AI — Syllabus Verification & Session Consistency Tests', () => {

  it('1. 2026-27 academic session on 2024-25 & 2025-26 documents evaluates to Verification Pending', () => {
    const cbsePhy = getSyllabusForSubject('CBSE', '12', 'Physics', 'Science', '2026-27');
    const verification = evaluateSyllabusVerification(cbsePhy, '2026-27');

    assert.strictEqual(verification.status, 'Verification Pending');
    assert.strictEqual(verification.badgeType, 'pending');
    assert.strictEqual(verification.badgeLabel, 'Verification Pending (2026-27 Circular Awaited)');
    assert.strictEqual(verification.isSessionMatched, false);
    assert.ok(verification.applicableSession.includes('2024-25 & 2025-26'));
    assert.ok(verification.statusNote.includes('Official annual circular from the board for session 2026-27 is pending release'));
    assert.strictEqual(verification.officialPublishedDate, '2024-03-22');
    assert.strictEqual(verification.sourceName, 'CBSE Academic Curriculum Portal');
  });

  it('2. Historical 2024-25 and 2025-26 learning records evaluate to Verified against historical documents', () => {
    const cbsePhy24 = getSyllabusForSubject('CBSE', '12', 'Physics', 'Science', '2024-25');
    const ver24 = evaluateSyllabusVerification(cbsePhy24, '2024-25');

    assert.strictEqual(ver24.status, 'Verified');
    assert.strictEqual(ver24.badgeType, 'verified');
    assert.strictEqual(ver24.badgeLabel, 'Verified Official Syllabus');
    assert.strictEqual(ver24.isSessionMatched, true);
    assert.strictEqual(ver24.applicableSession, '2024-25 & 2025-26');

    const cbsePhy25 = getSyllabusForSubject('CBSE', '12', 'Physics', 'Science', '2025-26');
    const ver25 = evaluateSyllabusVerification(cbsePhy25, '2025-26');
    assert.strictEqual(ver25.status, 'Verified');
    assert.strictEqual(ver25.isSessionMatched, true);
  });

  it('3. State board adapted curriculum evaluates with transparent adaptation flag', () => {
    // Subject adapted cross-board without direct state board PDF
    const mockAdapted: SubjectSyllabus = {
      id: 'custom-state-board-12-biology',
      board: 'Bihar School Examination Board (BSEB)',
      classLevel: '12',
      stream: 'Science',
      academicYear: '2026-27',
      curriculumType: 'NCERT / National Curriculum Framework (NCF)',
      subject: 'Biology',
      status: 'Partially Available',
      statusNote: 'Adapted from NCERT/NCF guidelines',
      sourceName: 'BSEB Directorate',
      sourceUrl: 'http://biharboardonline.bihar.gov.in/',
      lastVerifiedDate: 'June 2024',
      officialDocuments: [],
      units: []
    };

    const ver = evaluateSyllabusVerification(mockAdapted, '2026-27');
    assert.strictEqual(ver.status, 'Partially Available');
    assert.strictEqual(ver.badgeType, 'adapted');
    assert.strictEqual(ver.badgeLabel, 'State Adaptation (Verification Pending)');
    assert.ok(ver.statusNote.includes('Standard NCERT curriculum structure adopted'));
  });

  it('4. Uncataloged subjects evaluate to Latest Syllabus Not Confirmed', () => {
    const uncataloged = getSyllabusForSubject('Nagaland Board', '12', 'Applied Astrology', 'Science', '2026-27');
    assert.strictEqual(uncataloged.status, 'Latest Not Confirmed');

    const ver = evaluateSyllabusVerification(uncataloged, '2026-27');
    assert.strictEqual(ver.status, 'Latest Not Confirmed');
    assert.strictEqual(ver.badgeType, 'unconfirmed');
    assert.strictEqual(ver.badgeLabel, 'Latest Syllabus Not Confirmed');
    assert.strictEqual(ver.documentCount, 0);
  });

  it('5. CBSE Class 12 Science default enrolled subjects match PCM core', () => {
    const defaultSubs = getDefaultSubjectsForBoard('CBSE', '12', 'Science');
    assert.deepStrictEqual(defaultSubs, ['Physics', 'Chemistry', 'Mathematics']);
  });

  it('6. Class 10 default enrolled subjects do not forcibly bundle regional languages for unknown students', () => {
    const karnatakaClass10 = getDefaultSubjectsForBoard('Karnataka State Board', '10', 'General');
    // Must be core academic without forcing Kannada when student language choice is unknown
    assert.deepStrictEqual(karnatakaClass10, [
      'Mathematics', 
      'Science', 
      'Social Science', 
      'English Language & Literature'
    ]);

    const cbseClass10 = getDefaultSubjectsForBoard('CBSE', '10', 'General');
    assert.deepStrictEqual(cbseClass10, [
      'Mathematics', 
      'Science', 
      'Social Science', 
      'English Language & Literature'
    ]);
  });

  it('7. Official documents retain publication date, source URL, and academic year without manufactured dates', () => {
    const phy = getSyllabusForSubject('CBSE', '12', 'Physics', 'Science', '2026-27');
    assert.ok(phy.officialDocuments.length > 0);
    const doc = phy.officialDocuments[0];

    assert.strictEqual(doc.publishedDate, '2024-03-22');
    assert.strictEqual(doc.academicYear, '2024-25 & 2025-26');
    assert.strictEqual(doc.sourceUrl, 'https://cbseacademic.nic.in');
    assert.ok(!phy.lastVerifiedDate.includes('March 2025 (Official Session'));
  });

});
