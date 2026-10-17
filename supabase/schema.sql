-- =========================================================================
-- ConceptTrace AI — Complete Supabase PostgreSQL Schema & Security Policies
-- =========================================================================
-- This script configures:
-- 1. Database tables with foreign keys and cascade rules
-- 2. Strict Row Level Security (RLS) on ALL tables (auth.uid() = user_id)
-- 3. Automatic profile generation trigger on user signup
-- 4. High-performance indexes for student reporting
-- 5. Pre-seeded CBSE and State Board curriculum syllabus references
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '/assets/robot_avatar.jpg',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: Students can ONLY view and update their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Trigger: Automatically create public.profiles record when new auth.users record is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '/assets/robot_avatar.jpg'),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 2. EDUCATION PROFILES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.education_profiles (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  board TEXT NOT NULL DEFAULT 'CBSE',
  class_level TEXT NOT NULL DEFAULT '11' CHECK (class_level IN ('10', '11', '12')),
  academic_year TEXT NOT NULL DEFAULT '2026-27',
  preferred_language TEXT NOT NULL DEFAULT 'English',
  subjects TEXT[] NOT NULL DEFAULT ARRAY['Physics', 'Mathematics', 'Chemistry'],
  syllabus_file_name TEXT,
  is_profile_complete BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.education_profiles ENABLE ROW LEVEL SECURITY;

-- Education Profiles RLS: Isolated strictly to the authenticated student
CREATE POLICY "education_profiles_select_own"
  ON public.education_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "education_profiles_insert_own"
  ON public.education_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "education_profiles_update_own"
  ON public.education_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "education_profiles_delete_own"
  ON public.education_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 3. QUERIES (Ask a Doubt Submissions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'image', 'document')),
  question_text TEXT NOT NULL,
  file_reference TEXT,
  file_name TEXT,
  subject TEXT NOT NULL,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Processing', 'Completed', 'Needs Review', 'Failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Queries RLS: Isolated strictly to the authenticated student
CREATE POLICY "queries_select_own"
  ON public.queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "queries_insert_own"
  ON public.queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "queries_update_own"
  ON public.queries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "queries_delete_own"
  ON public.queries FOR DELETE
  USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 4. SOLUTIONS (Verified AI Step-by-Step Solutions & Concept Analysis)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.solutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL REFERENCES public.queries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  extracted_question TEXT NOT NULL,
  extraction_confidence NUMERIC(3,2) DEFAULT 0.95,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  chapter TEXT,
  solution_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  final_answer TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'Verified' CHECK (verification_status IN ('Verified', 'Partially Verified', 'Needs Review')),
  verification_method TEXT NOT NULL,
  verification_details TEXT NOT NULL,
  concept_involved TEXT NOT NULL,
  prerequisite_concepts TEXT[] DEFAULT '{}',
  possible_mistakes TEXT[] DEFAULT '{}',
  practice_questions JSONB DEFAULT '[]'::jsonb,
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.solutions ENABLE ROW LEVEL SECURITY;

-- Solutions RLS: Direct user_id check guarantees zero cross-student data leakage
CREATE POLICY "solutions_select_own"
  ON public.solutions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "solutions_insert_own"
  ON public.solutions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solutions_update_own"
  ON public.solutions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solutions_delete_own"
  ON public.solutions FOR DELETE
  USING (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 5. PRACTICE SESSIONS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practice_sessions_manage_own"
  ON public.practice_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 6. PRACTICE ATTEMPTS (Granular question-level outcomes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.practice_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
  question_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  submitted_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.practice_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practice_attempts_manage_own"
  ON public.practice_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 7. STUDY SESSIONS (Heartbeat learning activity tracker)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ended_at TIMESTAMPTZ,
  tracked_seconds INTEGER NOT NULL DEFAULT 0,
  session_status TEXT NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'idle_paused'))
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_sessions_manage_own"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------------------------
-- 8. SYLLABUS TOPICS (Global curriculum reference table)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.syllabus_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board TEXT NOT NULL,
  class_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT NOT NULL,
  topic TEXT NOT NULL,
  prerequisites TEXT[] DEFAULT '{}'
);

ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read curriculum topics (shared syllabus catalogue)
CREATE POLICY "syllabus_topics_read_all"
  ON public.syllabus_topics FOR SELECT
  TO authenticated
  USING (true);

-- -------------------------------------------------------------------------
-- INDEXES for fast reporting, filtering, and cross-table joins
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_queries_user_created ON public.queries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solutions_query_user ON public.solutions(query_id, user_id);
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_topic ON public.practice_attempts(user_id, topic, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_syllabus_board_class ON public.syllabus_topics(board, class_level, subject);

-- -------------------------------------------------------------------------
-- PRE-SEEDED SYLLABUS DATA (CBSE / State Boards)
-- -------------------------------------------------------------------------
INSERT INTO public.syllabus_topics (board, class_level, subject, chapter, topic, prerequisites)
VALUES
  ('CBSE', '11', 'Physics', 'Laws of Motion', 'Newton''s Second Law & Momentum', ARRAY['Kinematics in One Dimension', 'Vectors']),
  ('CBSE', '11', 'Physics', 'Thermodynamics', 'Carnot Heat Engine & Efficiency', ARRAY['Work & Heat Transfer', 'First Law of Thermodynamics']),
  ('CBSE', '11', 'Mathematics', 'Calculus', 'Limits & Derivatives', ARRAY['Algebraic Factorization', 'Trigonometric Identities']),
  ('CBSE', '11', 'Mathematics', 'Conic Sections', 'Parabola & Ellipse Standard Equations', ARRAY['Coordinate Geometry', 'Quadratic Equations']),
  ('CBSE', '11', 'Chemistry', 'Chemical Bonding', 'VSEPR Theory & Molecular Geometry', ARRAY['Lewis Dot Structures', 'Periodic Trends']),
  ('CBSE', '11', 'Chemistry', 'Equilibrium', 'Le Chatelier''s Principle', ARRAY['Reaction Rates', 'Chemical Stoichiometry']),
  ('CBSE', '12', 'Physics', 'Electrostatics', 'Coulomb''s Law & Gauss''s Theorem', ARRAY['Electric Charges', 'Vector Fields']),
  ('CBSE', '12', 'Physics', 'Current Electricity', 'Kirchhoff''s Laws & Potentiometer', ARRAY['Ohm''s Law', 'Series and Parallel Circuits']),
  ('CBSE', '12', 'Mathematics', 'Integrals', 'Definite Integrals & Area under Curve', ARRAY['Antiderivatives', 'Fundamental Theorem of Calculus']),
  ('CBSE', '10', 'Mathematics', 'Quadratic Equations', 'Nature of Roots & Discriminant', ARRAY['Linear Equations', 'Square Roots']),
  ('CBSE', '10', 'Mathematics', 'Trigonometry', 'Trigonometric Ratios & Identities', ARRAY['Similar Triangles', 'Pythagoras Theorem']),
  ('CBSE', '10', 'Science', 'Light - Reflection and Refraction', 'Lens Formula & Magnification', ARRAY['Ray Optics Basics', 'Cartesian Sign Convention'])
ON CONFLICT DO NOTHING;
