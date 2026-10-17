import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  EDUCATION_BOARDS, 
  BOARD_CATEGORIES, 
  searchEducationBoards, 
  normalizeBoardToOption, 
  formatBoardOptionLabel 
} from '../src/lib/boardsData.ts';

describe('ConceptTrace AI Education Boards Directory — Comprehensive Tests', () => {

  it('1. Contains all required National Boards', () => {
    const national = EDUCATION_BOARDS.filter(b => b.category === 'National Boards');
    assert.strictEqual(national.length >= 3, true);

    const cbse = national.find(b => b.acronym === 'CBSE');
    assert.ok(cbse, 'CBSE must be present');
    assert.strictEqual(cbse.isCurriculumDirectlyMapped, true);

    const cisce = national.find(b => b.acronym === 'CISCE');
    assert.ok(cisce, 'CISCE must be present');
    assert.strictEqual(cisce.isCurriculumDirectlyMapped, true);

    const nios = national.find(b => b.acronym === 'NIOS');
    assert.ok(nios, 'NIOS must be present');
  });

  it('2. Contains official education boards for all 28 Indian States', () => {
    const stateBoards = EDUCATION_BOARDS.filter(b => b.category === 'State Boards');
    assert.strictEqual(stateBoards.length >= 28, true, 'Must cover all 28 Indian states');

    // Key states check
    const karnataka = stateBoards.find(b => b.stateOrRegion === 'Karnataka');
    assert.ok(karnataka, 'Karnataka must be present');
    assert.ok(karnataka.acronym.includes('KSEAB'), 'Karnataka must be KSEAB');

    const maharashtra = stateBoards.find(b => b.stateOrRegion === 'Maharashtra');
    assert.ok(maharashtra, 'Maharashtra must be present');
    assert.strictEqual(maharashtra.acronym, 'MSBSHSE');

    const up = stateBoards.find(b => b.stateOrRegion === 'Uttar Pradesh');
    assert.ok(up, 'Uttar Pradesh must be present');
    assert.strictEqual(up.acronym, 'UPMSP');

    const bihar = stateBoards.find(b => b.stateOrRegion === 'Bihar');
    assert.ok(bihar, 'Bihar must be present');
    assert.strictEqual(bihar.acronym, 'BSEB');

    const assam = stateBoards.find(b => b.stateOrRegion === 'Assam');
    assert.ok(assam, 'Assam must be present');
    assert.ok(assam.acronym.includes('ASSEB'), 'Assam must reflect ASSEB');

    const tamilNadu = stateBoards.find(b => b.stateOrRegion === 'Tamil Nadu');
    assert.ok(tamilNadu, 'Tamil Nadu must be present');

    const rajasthan = stateBoards.find(b => b.stateOrRegion === 'Rajasthan');
    assert.ok(rajasthan, 'Rajasthan must be present');
    assert.ok(rajasthan.acronym.includes('RBSE'));

    const kerala = stateBoards.find(b => b.stateOrRegion === 'Kerala');
    assert.ok(kerala, 'Kerala must be present');
  });

  it('3. Covers all 8 Union Territories with applicable recognized boards', () => {
    const utBoards = EDUCATION_BOARDS.filter(b => b.category === 'Union Territory / Applicable Boards');
    assert.strictEqual(utBoards.length >= 8, true, 'Must cover all 8 Union Territories');

    // Check Jammu & Kashmir
    const jk = utBoards.find(b => b.stateOrRegion === 'Jammu and Kashmir');
    assert.ok(jk, 'JKBOSE must be present for Jammu & Kashmir');
    assert.strictEqual(jk.acronym, 'JKBOSE');

    // Check Delhi (does not invent a fake state board)
    const delhi = utBoards.find(b => b.stateOrRegion.includes('Delhi'));
    assert.ok(delhi, 'Delhi must be present');
    assert.ok(delhi.acronym.includes('DBSE') || delhi.acronym.includes('Delhi'));

    // Check Ladakh
    const ladakh = utBoards.find(b => b.stateOrRegion === 'Ladakh');
    assert.ok(ladakh, 'Ladakh must be present');

    // Check Chandigarh
    const chandigarh = utBoards.find(b => b.stateOrRegion === 'Chandigarh');
    assert.ok(chandigarh, 'Chandigarh must be present');

    // Check Puducherry
    const puducherry = utBoards.find(b => b.stateOrRegion === 'Puducherry');
    assert.ok(puducherry, 'Puducherry must be present');
  });

  it('4. Real-time Search finds boards by acronym, name, and state', () => {
    // Search for CBSE
    const cbseResults = searchEducationBoards('CBSE');
    assert.strictEqual(cbseResults['National Boards'].some(b => b.acronym === 'CBSE'), true);

    // Search for KSEAB
    const kseabResults = searchEducationBoards('KSEAB');
    assert.strictEqual(kseabResults['State Boards'].some(b => b.acronym.includes('KSEAB')), true);

    // Search for Karnataka
    const karnatakaResults = searchEducationBoards('Karnataka');
    assert.strictEqual(karnatakaResults['State Boards'].some(b => b.stateOrRegion === 'Karnataka'), true);

    // Search for Maharashtra
    const mahaResults = searchEducationBoards('Maharashtra');
    assert.strictEqual(mahaResults['State Boards'].some(b => b.stateOrRegion === 'Maharashtra'), true);

    // Search for UPMSP
    const upmspResults = searchEducationBoards('UPMSP');
    assert.strictEqual(upmspResults['State Boards'].some(b => b.acronym === 'UPMSP'), true);

    // Search for JKBOSE
    const jkboseResults = searchEducationBoards('JKBOSE');
    assert.strictEqual(jkboseResults['Union Territory / Applicable Boards'].some(b => b.acronym === 'JKBOSE'), true);

    // Search for NIOS
    const niosResults = searchEducationBoards('NIOS');
    assert.strictEqual(niosResults['National Boards'].some(b => b.acronym === 'NIOS'), true);
  });

  it('5. Legacy values seamlessly normalize to modern board options', () => {
    // Legacy 'CBSE'
    const cbse = normalizeBoardToOption('CBSE');
    assert.strictEqual(cbse.id, 'cbse');

    // Legacy 'CISCE (ICSE/ISC)'
    const cisce = normalizeBoardToOption('CISCE (ICSE/ISC)');
    assert.strictEqual(cisce.id, 'cisce');

    // Legacy 'Karnataka State Board'
    const karnataka = normalizeBoardToOption('Karnataka State Board');
    assert.strictEqual(karnataka.id, 'kseab');

    // Legacy 'NIOS'
    const nios = normalizeBoardToOption('NIOS');
    assert.strictEqual(nios.id, 'nios');

    // Other / Custom
    const custom = normalizeBoardToOption('Other');
    assert.strictEqual(custom.id, 'other_custom');
  });

  it('6. Other / Not Listed option allows custom board specification', () => {
    const otherOption = EDUCATION_BOARDS.find(b => b.id === 'other_custom');
    assert.ok(otherOption, 'Other option must exist');
    assert.strictEqual(otherOption.category, 'Other');

    const formatted = formatBoardOptionLabel(otherOption);
    assert.ok(formatted.includes('Other / Not Listed'));
  });

});
