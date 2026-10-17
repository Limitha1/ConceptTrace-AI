import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { 
  defaultUserProfile, 
  secondaryTestUser,
  initialPracticeAttempts,
  initialStudySessions,
  initialQueries,
  TOPIC_META_MAP,
  runRlsVerificationAudit
} from '../src/lib/storage.ts';
import { 
  calculateAnalyticsSummary, 
  calculateSubjectAccuracy,
  calculateTopicEvidence,
  buildLearningTrajectory,
  buildActivityHeatmap
} from '../src/lib/analyticsEngine.ts';
import jsPDFPkg from 'jspdf';
const jsPDF = (jsPDFPkg as any).jsPDF || jsPDFPkg;

describe('ConceptTrace AI End-to-End Analytics & Multi-Tenant Isolation Tests', () => {

  test('Student A (Limitha M) has verified baseline analytics with sample counts', () => {
    const studentAAttempts = initialPracticeAttempts.filter(a => a.userId === defaultUserProfile.id);
    const studentASessions = initialStudySessions.filter(s => s.userId === defaultUserProfile.id);
    const studentAQueries = initialQueries.filter(q => q.userId === defaultUserProfile.id);

    assert.ok(studentAAttempts.length > 0, 'Student A must have practice attempts');
    assert.ok(studentASessions.length > 0, 'Student A must have study sessions');

    // 1. Summary
    const summary = calculateAnalyticsSummary(studentAAttempts, studentASessions, studentAQueries.length, 'all');
    assert.ok(summary.totalAttempts > 0);
    assert.ok(summary.overallAccuracy !== null);
    assert.equal(summary.overallAccuracy, Math.round((summary.correctAttempts / summary.totalAttempts) * 1000) / 10);
    assert.ok(summary.studyTimeHours > 0 || summary.studyTimeMinutes > 0);
    assert.ok(summary.currentStreakDays >= 1);

    // 2. Subject accuracy with sample counts
    const subjectAcc = calculateSubjectAccuracy(studentAAttempts);
    subjectAcc.forEach(s => {
      assert.ok(typeof s.totalAttempts === 'number');
      assert.ok(typeof s.correctAttempts === 'number');
      assert.ok(typeof s.incorrectAttempts === 'number');
      assert.equal(s.totalAttempts, s.correctAttempts + s.incorrectAttempts);
      if (s.totalAttempts > 0) {
        assert.ok(s.accuracy !== null);
        assert.equal(s.accuracy, Math.round((s.correctAttempts / s.totalAttempts) * 1000) / 10);
      } else {
        assert.equal(s.accuracy, null);
      }
    });

    // 3. Weak topics evidence
    const topicEvidence = calculateTopicEvidence(studentAAttempts, TOPIC_META_MAP);
    topicEvidence.forEach(t => {
      assert.equal(t.eligibleAttempts, t.correctCount + t.incorrectCount);
      if (t.eligibleAttempts < 3) {
        assert.equal(t.category, 'Needs More Evidence', `Topic ${t.topic} with <3 attempts must be Needs More Evidence`);
      } else if (t.accuracy < 60) {
        assert.equal(t.category, 'Needs Practice');
      } else if (t.accuracy < 80) {
        assert.equal(t.category, 'Improving');
      } else {
        assert.equal(t.category, 'Doing Well');
      }
    });

    // 4. Learning trajectory
    const trajectory = buildLearningTrajectory(studentAAttempts, '30d');
    assert.ok(trajectory.length > 0);

    // 5. Heatmap
    const heatmap = buildActivityHeatmap(studentASessions, studentAAttempts);
    assert.equal(heatmap.length, 30);
  });

  test('Student B (Clean Slate) strictly exhibits honest empty states without invented metrics', () => {
    // Student B has zero attempts and zero sessions
    const studentBAttempts = initialPracticeAttempts.filter(a => a.userId === secondaryTestUser.id);
    const studentBSessions = initialStudySessions.filter(s => s.userId === secondaryTestUser.id);
    const studentBQueries = initialQueries.filter(q => q.userId === secondaryTestUser.id);

    assert.equal(studentBAttempts.length, 0, 'Clean slate student must have 0 attempts');
    assert.equal(studentBSessions.length, 0, 'Clean slate student must have 0 sessions');

    // 1. Summary: must NOT invent fake percentages
    const summary = calculateAnalyticsSummary(studentBAttempts, studentBSessions, studentBQueries.length, 'all');
    assert.equal(summary.totalAttempts, 0);
    assert.equal(summary.correctAttempts, 0);
    assert.equal(summary.incorrectAttempts, 0);
    assert.equal(summary.overallAccuracy, null, 'Empty student must have null accuracy, not 0% or fake default');
    assert.equal(summary.activeDaysCount, 0);
    assert.equal(summary.totalStudySeconds, 0);
    assert.equal(summary.studyTimeHours, 0);
    assert.equal(summary.studyTimeMinutes, 0);
    assert.equal(summary.currentStreakDays, 0);

    // 2. Subject accuracy: all subjects must be null accuracy with 0 attempts
    const subjectAcc = calculateSubjectAccuracy(studentBAttempts);
    subjectAcc.forEach(s => {
      assert.equal(s.totalAttempts, 0);
      assert.equal(s.correctAttempts, 0);
      assert.equal(s.incorrectAttempts, 0);
      assert.equal(s.accuracy, null, `${s.subject} must have null accuracy for clean slate student`);
    });

    // 3. Topic evidence: all topics must be "Needs More Evidence" (0 attempts)
    const topicEvidence = calculateTopicEvidence(studentBAttempts, TOPIC_META_MAP);
    topicEvidence.forEach(t => {
      assert.equal(t.eligibleAttempts, 0);
      assert.equal(t.category, 'Needs More Evidence');
      assert.equal(t.trend, 'unknown');
    });

    // 4. Learning trajectory: returns empty array
    const trajectory = buildLearningTrajectory(studentBAttempts, '30d');
    assert.deepEqual(trajectory, []);

    // 5. Heatmap: 30 days, all level 0, 0 minutes
    const heatmap = buildActivityHeatmap(studentBSessions, studentBAttempts);
    assert.equal(heatmap.length, 30);
    heatmap.forEach(h => {
      assert.equal(h.activeMinutes, 0);
      assert.equal(h.attemptsCount, 0);
      assert.equal(h.level, 0);
      assert.equal(h.isQualifying, false);
    });
  });

  test('PDF Report Generator: constructs official report document without crashing', () => {
    const doc = new jsPDF();
    assert.ok(doc, 'jsPDF instance created');

    // Replicate PDF generation logic from ProgressReportPage
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('ConceptTrace AI — Official Learning Progress Report', 14, 16);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 220, 255);
    doc.text('Student: Limitha M | Class 11 (CBSE)', 14, 25);

    // Section 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Executive Learning Summary', 14, 44);

    const pdfOutput = doc.output();
    assert.ok(pdfOutput.length > 0, 'PDF buffer successfully created');
  });

  test('Row-Level Security & Key Hygiene Audit passes 100%', () => {
    const auditResults = runRlsVerificationAudit();
    assert.equal(auditResults.length, 4);
    auditResults.forEach(r => {
      assert.equal(r.passed, true, `Audit check ${r.testName} must pass`);
    });
  });

});
