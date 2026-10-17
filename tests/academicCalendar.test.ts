import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  determineCurrentAcademicYear, 
  formatAcademicYearDisplay, 
  getAcademicCalendarRule,
  ACADEMIC_CALENDAR_RULES,
  DEFAULT_ACADEMIC_CALENDAR_RULE
} from '../src/lib/academicCalendar.ts';

describe('ConceptTrace AI — Automatic Academic Year Determination System', () => {

  it('1. Correctly determines current academic year for Indian National Boards (April start)', () => {
    // Current date in Oct 2026 -> '2026-27'
    const octDate = new Date(2026, 9, 17); // Month index 9 = October
    assert.strictEqual(determineCurrentAcademicYear('CBSE', octDate), '2026-27');
    assert.strictEqual(determineCurrentAcademicYear('CISCE', octDate), '2026-27');
    assert.strictEqual(determineCurrentAcademicYear('NIOS', octDate), '2026-27');

    // Feb 2027 (Board exam period, session still 2026-27)
    const febDate = new Date(2027, 1, 15); // Month index 1 = February
    assert.strictEqual(determineCurrentAcademicYear('CBSE', febDate), '2026-27');

    // March 31, 2027 (Last day of session)
    const marEnd = new Date(2027, 2, 31); // Month index 2 = March
    assert.strictEqual(determineCurrentAcademicYear('CBSE', marEnd), '2026-27');

    // April 1, 2027 (New session starts)
    const aprStart = new Date(2027, 3, 1); // Month index 3 = April
    assert.strictEqual(determineCurrentAcademicYear('CBSE', aprStart), '2027-28');
  });

  it('2. Correctly determines academic year for Southern State Boards (June start)', () => {
    // Oct 2026 -> '2026-27'
    const octDate = new Date(2026, 9, 17);
    assert.strictEqual(determineCurrentAcademicYear('kseab', octDate), '2026-27');
    assert.strictEqual(determineCurrentAcademicYear('Karnataka State Board', octDate), '2026-27');
    assert.strictEqual(determineCurrentAcademicYear('tndge', octDate), '2026-27');

    // April 2027 -> Southern state schools are on vacation, still in 2026-27 session
    const aprDate = new Date(2027, 3, 15);
    assert.strictEqual(determineCurrentAcademicYear('kseab', aprDate), '2026-27');

    // May 31, 2027 -> Still 2026-27
    const mayEnd = new Date(2027, 4, 31);
    assert.strictEqual(determineCurrentAcademicYear('kseab', mayEnd), '2026-27');

    // June 1, 2027 -> New academic session begins
    const junStart = new Date(2027, 5, 1);
    assert.strictEqual(determineCurrentAcademicYear('kseab', junStart), '2027-28');
  });

  it('3. Correctly determines academic year for International Boards (August start)', () => {
    // Oct 2026 -> '2026-27'
    const octDate = new Date(2026, 9, 17);
    assert.strictEqual(determineCurrentAcademicYear('ib', octDate), '2026-27');
    assert.strictEqual(determineCurrentAcademicYear('cambridge', octDate), '2026-27');

    // July 15, 2027 -> Summer break, session is still 2026-27
    const julDate = new Date(2027, 6, 15);
    assert.strictEqual(determineCurrentAcademicYear('ib', julDate), '2026-27');

    // August 1, 2027 -> International session rolls over
    const augStart = new Date(2027, 7, 1);
    assert.strictEqual(determineCurrentAcademicYear('ib', augStart), '2027-28');
  });

  it('4. Uses sensible default rule when board is unspecified or custom', () => {
    const octDate = new Date(2026, 9, 17);
    assert.strictEqual(determineCurrentAcademicYear(null, octDate), '2026-27');
    assert.strictEqual(determineCurrentAcademicYear(undefined, octDate), '2026-27');
    assert.strictEqual(determineCurrentAcademicYear('Other', octDate), '2026-27');
    assert.strictEqual(determineCurrentAcademicYear('NonExistentBoard', octDate), '2026-27');
  });

  it('5. Correctly formats academic year for read-only UI display', () => {
    const octDate = new Date(2026, 9, 17);

    // Current active session appends "(Current)"
    const currentDisplay = formatAcademicYearDisplay('2026-27', 'CBSE', octDate);
    assert.strictEqual(currentDisplay, '2026–27 (Current)');

    // Null/undefined defaults to active session with (Current)
    const nullDisplay = formatAcademicYearDisplay(null, 'CBSE', octDate);
    assert.strictEqual(nullDisplay, '2026–27 (Current)');

    // Historical academic years are displayed cleanly without "(Current)"
    const pastDisplay = formatAcademicYearDisplay('2024-25', 'CBSE', octDate);
    assert.strictEqual(pastDisplay, '2024–25');

    // Already formatted string with (Current) is preserved cleanly
    const existingFormatted = formatAcademicYearDisplay('2026–27 (Current)', 'CBSE', octDate);
    assert.strictEqual(existingFormatted, '2026–27 (Current)');
  });

  it('6. Calendar rules are well-configured with expected properties', () => {
    const natRule = getAcademicCalendarRule('CBSE');
    assert.strictEqual(natRule.startMonth, 3); // April
    assert.strictEqual(natRule.startDay, 1);

    const southRule = getAcademicCalendarRule('kseab');
    assert.strictEqual(southRule.startMonth, 5); // June

    const intRule = getAcademicCalendarRule('ib');
    assert.strictEqual(intRule.startMonth, 7); // August
  });

});
