import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  CURATED_CONCEPTS, 
  getCuratedConceptContent, 
  generateStandardConceptContent 
} from '../src/lib/conceptLibraryData.ts';
import { 
  searchConceptLibrary, 
  getSuggestedRevisions 
} from '../src/lib/conceptLibraryService.ts';
import { 
  getConceptBookmarks, 
  saveConceptBookmark, 
  removeConceptBookmark, 
  isConceptBookmarked,
  getConceptRevisions, 
  markConceptAsRevised, 
  getRecentlyViewedConcepts, 
  recordConceptView,
  getCachedConceptContent,
  saveCachedConceptContent
} from '../src/lib/storage.ts';
import { handleConceptApi } from '../server/conceptApi.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Polyfill minimal localStorage for Node test runner environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => { mockStorage[key] = String(val); },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => {
    for (const k in mockStorage) delete mockStorage[k];
  }
};

describe('ConceptTrace AI Concept Library & Smart Revision Engine — Unit & Integration Tests', () => {

  it('1. Pre-compiled Curated Concepts provide rich, zero-latency revision packs', () => {
    assert.strictEqual(CURATED_CONCEPTS.length >= 3, true);

    const coulombsLaw = getCuratedConceptContent('top-cbse-12-phy-1-2');
    assert.ok(coulombsLaw, 'Coulomb’s law concept pack must exist');
    assert.strictEqual(coulombsLaw.topicTitle, "Coulomb's Law & Superposition Principle");
    assert.strictEqual(coulombsLaw.subject, 'Physics');
    assert.strictEqual(coulombsLaw.classLevel, '12');

    // Verify all 7 required core pedagogical modules are populated
    assert.ok(coulombsLaw.overview.simpleIntro.length > 20, 'Simple intro must be substantive');
    assert.ok(coulombsLaw.overview.learningObjectives.length >= 3, 'Must have at least 3 learning objectives');
    assert.ok(coulombsLaw.sections.length >= 3, 'Must have detailed explanation sections');
    assert.ok(coulombsLaw.shortNotes.essentialDefinitions.length >= 2, 'Must have definitions');
    assert.ok(coulombsLaw.shortNotes.keyFormulas.length >= 2, 'Must have formula cards with variables');
    assert.ok(coulombsLaw.workedExamples.length >= 1, 'Must have worked examples with step-by-step reasoning');
    assert.ok(coulombsLaw.commonMistakes.length >= 2, 'Must have common student misconceptions');
    assert.ok(coulombsLaw.quickRevision.essentialTakeaways.length >= 4, 'Must have quick revision takeaways');
    assert.ok(coulombsLaw.practiceQuestions.length >= 2, 'Must have interactive practice questions');
  });

  it('2. Standard Concept Generator constructs structured curriculum packs dynamically', () => {
    const generated = generateStandardConceptContent({
      topicId: 'top-test-matrices-1',
      topicTitle: 'Inverse of a Matrix & Elementary Row Operations',
      chapter: 'Matrices and Determinants',
      subject: 'Mathematics',
      board: 'CBSE',
      classLevel: '12',
      subtopics: ['Elementary row transformations', 'Invertible matrices theorem'],
      keyConcepts: ['A · A⁻¹ = I', 'Row equivalence']
    });

    assert.ok(generated, 'Generated pack should not be null');
    assert.strictEqual(generated.topicTitle, 'Inverse of a Matrix & Elementary Row Operations');
    assert.strictEqual(generated.subject, 'Mathematics');
    assert.strictEqual(generated.overview.difficultyLevel, 'Intermediate');
    assert.strictEqual(generated.sections.length >= 3, true);
    assert.strictEqual(generated.practiceQuestions.length >= 2, true);
  });

  it('3. Real-time Search finds concepts across topics, chapters, and keywords with filters', () => {
    // Search for Coulomb
    const coulombsHits = searchConceptLibrary('Coulomb');
    assert.strictEqual(coulombsHits.length > 0, true, 'Should find Coulomb hits');
    assert.ok(coulombsHits.some(h => h.topicTitle.includes("Coulomb's Law")));

    // Search with Board & Class Filters
    const class12Hits = searchConceptLibrary('Electric', { board: 'CBSE', classLevel: '12' });
    assert.strictEqual(class12Hits.length > 0, true);
    assert.ok(class12Hits.every(h => h.board === 'CBSE' && h.classLevel === '12'));

    // Search for Chemistry topic
    const chemHits = searchConceptLibrary('Raoult');
    assert.strictEqual(chemHits.length > 0, true);
    assert.ok(chemHits.some(h => h.subject === 'Chemistry'));
  });

  it('4. Multi-Tenant Bookmarks & Revision History strictly persist without cross-talk', () => {
    const studentA = 'usr_alice_101';
    const studentB = 'usr_bob_202';

    // Alice saves a bookmark
    saveConceptBookmark({
      id: 'bm-alice-1',
      userId: studentA,
      topicId: 'top-cbse-12-phy-1-2',
      topicTitle: "Coulomb's Law & Superposition Principle",
      subject: 'Physics',
      chapter: 'Electric Charges and Fields',
      board: 'CBSE',
      classLevel: '12',
      bookmarkedAt: new Date().toISOString()
    });

    assert.strictEqual(isConceptBookmarked('top-cbse-12-phy-1-2', studentA), true);
    assert.strictEqual(isConceptBookmarked('top-cbse-12-phy-1-2', studentB), false, 'Bob should NOT see Alice’s bookmark');

    const aliceBookmarks = getConceptBookmarks(studentA);
    assert.strictEqual(aliceBookmarks.length, 1);
    const bobBookmarks = getConceptBookmarks(studentB);
    assert.strictEqual(bobBookmarks.length, 0);

    // Alice marks as revised
    const revRecord = markConceptAsRevised(
      'top-cbse-12-phy-1-2',
      "Coulomb's Law",
      'Physics',
      'Electric Charges and Fields',
      'CBSE',
      '12',
      studentA
    );
    assert.strictEqual(revRecord.revisionCount, 1);

    // Revising again increments revision count
    const revRecord2 = markConceptAsRevised(
      'top-cbse-12-phy-1-2',
      "Coulomb's Law",
      'Physics',
      'Electric Charges and Fields',
      'CBSE',
      '12',
      studentA
    );
    assert.strictEqual(revRecord2.revisionCount, 2);

    // Alice removes bookmark
    removeConceptBookmark('top-cbse-12-phy-1-2', studentA);
    assert.strictEqual(isConceptBookmarked('top-cbse-12-phy-1-2', studentA), false);
  });

  it('5. Suggested Revisions strictly enforce authentic learning history and honest empty states', () => {
    const freshStudent = 'usr_brand_new_student_clean';
    const suggestions = getSuggestedRevisions(freshStudent);

    // Honest empty state when no attempts exist
    assert.strictEqual(suggestions.length, 0, 'New student with 0 attempts must receive 0 fabricated suggestions');
  });

  it('6. Server Concept API handleConceptApi handles status and detail requests', async () => {
    // Test 1: GET /api/concept/status
    let statusResponseData: any = null;
    let statusStatusCode = 0;
    const mockResStatus: any = {
      writeHead: (code: number) => { statusStatusCode = code; },
      end: (dataStr: string) => { statusResponseData = JSON.parse(dataStr); }
    };
    const mockReqStatus: any = {
      method: 'GET',
      url: '/api/concept/status'
    };

    const handledStatus = await handleConceptApi(mockReqStatus, mockResStatus, {});
    assert.strictEqual(handledStatus, true);
    assert.strictEqual(statusStatusCode, 200);
    assert.strictEqual(statusResponseData.status, 'online');

    // Test 2: GET /api/concept/detail for Curated Topic
    let detailResponseData: any = null;
    let detailStatusCode = 0;
    const mockResDetail: any = {
      writeHead: (code: number) => { detailStatusCode = code; },
      end: (dataStr: string) => { detailResponseData = JSON.parse(dataStr); }
    };
    const mockReqDetail: any = {
      method: 'GET',
      url: '/api/concept/detail?topicId=top-cbse-12-phy-1-2'
    };

    const handledDetail = await handleConceptApi(mockReqDetail, mockResDetail, {});
    assert.strictEqual(handledDetail, true);
    assert.strictEqual(detailStatusCode, 200);
    assert.strictEqual(detailResponseData.success, true);
    assert.strictEqual(detailResponseData.source, 'curated-official');
    assert.strictEqual(detailResponseData.data.topicTitle, "Coulomb's Law & Superposition Principle");
  });

});
