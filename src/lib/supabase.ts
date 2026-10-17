import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { 
  UserProfile, 
  EducationProfile, 
  QueryRecord, 
  SolutionAnalysis, 
  PracticeAttempt, 
  StudySession 
} from '../types';

// Safely access public environment variables only
// NOTE: VITE_SUPABASE_ANON_KEY is the public client key protected by Postgres Row Level Security (RLS).
// NEVER expose the supabase service_role key in frontend code!
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseUrl.startsWith('http') && 
    !supabaseUrl.includes('your-supabase-project') &&
    supabaseAnonKey && 
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
  );
};

// Initialize client if valid credentials are provided
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// =========================================================================
// SUPABASE AUTHENTICATION SERVICES
// =========================================================================

export async function supabaseSignUp(fullName: string, email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        avatar_url: '/assets/robot_avatar.jpg'
      }
    }
  });
  if (error) throw error;
  return data;
}

export async function supabaseSignIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function supabaseSignOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function supabaseSignInWithGoogle() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function supabaseResetPassword(email: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) throw error;
}

// =========================================================================
// SUPABASE DATABASE OPERATIONS (STRICTLY GOVERNED BY RLS)
// =========================================================================

export async function supabaseFetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email || '',
    fullName: data.full_name,
    avatarUrl: data.avatar_url && !data.avatar_url.includes('student_avatar') ? data.avatar_url : '/assets/robot_avatar.jpg',
    role: data.role || 'student',
    createdAt: data.created_at
  };
}

export async function supabaseUpdateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  if (!supabase) return;
  const payload: any = { updated_at: new Date().toISOString() };
  if (updates.fullName) payload.full_name = updates.fullName;
  if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
}

export async function supabaseFetchEducationProfile(userId: string): Promise<EducationProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('education_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    board: data.board,
    classLevel: data.class_level,
    academicYear: data.academic_year,
    preferredLanguage: data.preferred_language,
    subjects: data.subjects || [],
    syllabusFileName: data.syllabus_file_name,
    isProfileComplete: data.is_profile_complete,
    updatedAt: data.updated_at
  };
}

export async function supabaseUpsertEducationProfile(profile: EducationProfile): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('education_profiles')
    .upsert({
      user_id: profile.userId,
      board: profile.board,
      class_level: profile.classLevel,
      academic_year: profile.academicYear,
      preferred_language: profile.preferredLanguage,
      subjects: profile.subjects,
      syllabus_file_name: profile.syllabusFileName,
      is_profile_complete: profile.isProfileComplete,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

export async function supabaseFetchQueries(userId: string): Promise<QueryRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('queries')
    .select(`
      id,
      user_id,
      input_type,
      question_text,
      file_reference,
      file_name,
      subject,
      topic,
      status,
      created_at,
      solutions (
        id,
        query_id,
        extracted_question,
        extraction_confidence,
        subject,
        topic,
        chapter,
        solution_steps,
        final_answer,
        verification_status,
        verification_method,
        verification_details,
        concept_involved,
        prerequisite_concepts,
        possible_mistakes,
        practice_questions,
        uncertainty_notes,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('Error fetching queries from Supabase:', error);
    return [];
  }

  return data.map((q: any) => {
    const sol = Array.isArray(q.solutions) && q.solutions.length > 0 ? q.solutions[0] : undefined;
    let formattedSolution: SolutionAnalysis | undefined = undefined;

    if (sol) {
      formattedSolution = {
        id: sol.id,
        queryId: sol.query_id,
        extractedQuestion: sol.extracted_question,
        extractionConfidence: sol.extraction_confidence,
        subject: sol.subject,
        topic: sol.topic,
        chapter: sol.chapter,
        solutionSteps: sol.solution_steps,
        finalAnswer: sol.final_answer,
        verificationStatus: sol.verification_status,
        verificationMethod: sol.verification_method,
        verificationDetails: sol.verification_details,
        conceptInvolved: sol.concept_involved,
        prerequisiteConcepts: sol.prerequisite_concepts || [],
        possibleMistakes: sol.possible_mistakes || [],
        practiceQuestions: sol.practice_questions || [],
        uncertaintyNotes: sol.uncertainty_notes,
        createdAt: sol.created_at
      };
    }

    return {
      id: q.id,
      userId: q.user_id,
      inputType: q.input_type,
      questionText: q.question_text,
      fileReference: q.file_reference,
      fileName: q.file_name,
      subject: q.subject,
      topic: q.topic,
      status: q.status,
      solution: formattedSolution,
      createdAt: q.created_at
    };
  });
}

export async function supabaseSaveQueryAndSolution(
  query: QueryRecord,
  solution?: SolutionAnalysis
): Promise<void> {
  if (!supabase) return;

  const { error: queryErr } = await supabase
    .from('queries')
    .insert({
      id: query.id,
      user_id: query.userId,
      input_type: query.inputType,
      question_text: query.questionText,
      file_reference: query.fileReference,
      file_name: query.fileName,
      subject: query.subject,
      topic: query.topic,
      status: query.status,
      created_at: query.createdAt
    });

  if (queryErr) throw queryErr;

  if (solution) {
    const { error: solErr } = await supabase
      .from('solutions')
      .insert({
        id: solution.id,
        query_id: query.id,
        user_id: query.userId,
        extracted_question: solution.extractedQuestion,
        extraction_confidence: solution.extractionConfidence,
        subject: solution.subject,
        topic: solution.topic,
        chapter: solution.chapter,
        solution_steps: solution.solutionSteps,
        final_answer: solution.finalAnswer,
        verification_status: solution.verificationStatus,
        verification_method: solution.verificationMethod,
        verification_details: solution.verificationDetails,
        concept_involved: solution.conceptInvolved,
        prerequisite_concepts: solution.prerequisiteConcepts,
        possible_mistakes: solution.possibleMistakes,
        practice_questions: solution.practiceQuestions,
        uncertainty_notes: solution.uncertaintyNotes,
        created_at: solution.createdAt
      });

    if (solErr) throw solErr;
  }
}

export async function supabaseDeleteQuery(queryId: string, userId: string): Promise<void> {
  if (!supabase) return;
  // RLS strictly prevents deletion if auth.uid() != user_id
  const { error } = await supabase
    .from('queries')
    .delete()
    .eq('id', queryId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function supabaseFetchPracticeAttempts(userId: string): Promise<PracticeAttempt[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('practice_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false });

  if (error || !data) return [];

  return data.map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    sessionId: a.session_id,
    questionId: a.question_id,
    questionText: a.question_text,
    submittedAnswer: a.submitted_answer,
    correctAnswer: a.correct_answer,
    isCorrect: a.is_correct,
    subject: a.subject,
    topic: a.topic,
    timeSpentSeconds: a.time_spent_seconds,
    attemptedAt: a.attempted_at
  }));
}

export async function supabaseSavePracticeAttempt(attempt: PracticeAttempt): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('practice_attempts')
    .insert({
      id: attempt.id,
      user_id: attempt.userId,
      session_id: attempt.sessionId,
      question_id: attempt.questionId,
      question_text: attempt.questionText,
      submitted_answer: attempt.submittedAnswer,
      correct_answer: attempt.correctAnswer,
      is_correct: attempt.isCorrect,
      subject: attempt.subject,
      topic: attempt.topic,
      time_spent_seconds: attempt.timeSpentSeconds,
      attempted_at: attempt.attemptedAt
    });

  if (error) throw error;
}

export async function supabaseFetchStudySessions(userId: string): Promise<StudySession[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error || !data) return [];

  return data.map((s: any) => ({
    id: s.id,
    userId: s.user_id,
    startedAt: s.started_at,
    lastActiveAt: s.last_active_at,
    endedAt: s.ended_at,
    trackedSeconds: s.tracked_seconds,
    sessionStatus: s.session_status
  }));
}

export async function supabaseUpsertStudySession(session: StudySession): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('study_sessions')
    .upsert({
      id: session.id,
      user_id: session.userId,
      started_at: session.startedAt,
      last_active_at: session.lastActiveAt,
      ended_at: session.endedAt,
      tracked_seconds: session.trackedSeconds,
      session_status: session.sessionStatus
    });

  if (error) throw error;
}
