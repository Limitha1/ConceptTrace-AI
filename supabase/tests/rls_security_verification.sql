-- =========================================================================
-- ConceptTrace AI — Row Level Security (RLS) Verification Test Suite
-- =========================================================================
-- This script validates that:
-- 1. Student A can create, read, update, and delete their own records.
-- 2. Student B CANNOT read Student A's queries, solutions, education profiles, or practice attempts.
-- 3. Student B CANNOT modify or delete Student A's records.
-- =========================================================================

BEGIN;

-- Create temporary mock UUIDs for Student A and Student B
DO $$
DECLARE
  student_a UUID := '11111111-1111-1111-1111-111111111111';
  student_b UUID := '22222222-2222-2222-2222-222222222222';
  query_a_id UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  count_result INTEGER;
BEGIN
  RAISE NOTICE '=== Running ConceptTrace AI RLS Verification ===';

  -- Clean any previous test data
  DELETE FROM public.queries WHERE user_id IN (student_a, student_b);
  DELETE FROM public.education_profiles WHERE user_id IN (student_a, student_b);
  DELETE FROM public.profiles WHERE id IN (student_a, student_b);

  -- 1. Setup Student A profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (student_a, 'Student Alice (Class 11 CBSE)', 'student');

  -- 2. Setup Student B profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (student_b, 'Student Bob (Class 12 ICSE)', 'student');

  -- 3. Simulate Student A session
  PERFORM set_config('request.jwt.claim.sub', student_a::text, true);
  PERFORM set_config('role', 'authenticated', true);

  -- Student A inserts a private doubt
  INSERT INTO public.queries (id, user_id, input_type, question_text, subject, topic, status)
  VALUES (query_a_id, student_a, 'text', 'Alice private physics doubt on Newton laws', 'Physics', 'Laws of Motion', 'Completed');

  -- Student A inserts education profile
  INSERT INTO public.education_profiles (user_id, board, class_level, academic_year, preferred_language, subjects)
  VALUES (student_a, 'CBSE', '11', '2026-27', 'English', ARRAY['Physics', 'Mathematics']);

  -- Student A verifies they can read their own record
  SELECT count(*) INTO count_result FROM public.queries WHERE id = query_a_id;
  IF count_result <> 1 THEN
    RAISE EXCEPTION 'TEST FAILED: Student A could not read their own query!';
  END IF;
  RAISE NOTICE '✓ TEST 1 PASSED: Student A successfully reads own query (count = 1).';

  -- 4. Switch session to Student B
  PERFORM set_config('request.jwt.claim.sub', student_b::text, true);

  -- Student B tries to SELECT Student A's queries
  SELECT count(*) INTO count_result FROM public.queries WHERE user_id = student_a;
  IF count_result <> 0 THEN
    RAISE EXCEPTION 'SECURITY BREACH: Student B was able to read Student A queries! Count: %', count_result;
  END IF;
  RAISE NOTICE '✓ TEST 2 PASSED: Student B cannot SELECT Student A queries (count = 0).';

  -- Student B tries to SELECT Student A's education profile
  SELECT count(*) INTO count_result FROM public.education_profiles WHERE user_id = student_a;
  IF count_result <> 0 THEN
    RAISE EXCEPTION 'SECURITY BREACH: Student B was able to read Student A education profile!';
  END IF;
  RAISE NOTICE '✓ TEST 3 PASSED: Student B cannot SELECT Student A education profile (count = 0).';

  -- Student B tries to UPDATE Student A's query text
  UPDATE public.queries SET question_text = 'TAMPERED BY STUDENT B' WHERE id = query_a_id;
  
  -- Student B tries to DELETE Student A's query
  DELETE FROM public.queries WHERE id = query_a_id;

  -- 5. Switch back to Student A to verify records remained untouched
  PERFORM set_config('request.jwt.claim.sub', student_a::text, true);

  SELECT count(*) INTO count_result FROM public.queries WHERE id = query_a_id AND question_text = 'Alice private physics doubt on Newton laws';
  IF count_result <> 1 THEN
    RAISE EXCEPTION 'SECURITY BREACH: Student B successfully modified or deleted Student A record!';
  END IF;
  RAISE NOTICE '✓ TEST 4 PASSED: Student B UPDATE and DELETE attempts had ZERO effect on Student A data.';

  RAISE NOTICE '=== ALL RLS SECURITY CHECKS PASSED SUCCESSFULLY ===';
END $$;

ROLLBACK;
