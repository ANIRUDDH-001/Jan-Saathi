-- A1: Schema completeness
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'
   AND table_name IN ('schemes','scheme_chunks','scheme_documents','user_sessions',
     'applications','application_status_history','users','anonymous_queries','pipeline_queue')
  ) AS tables,           -- 9
  (SELECT COUNT(*) FROM pg_extension WHERE extname IN ('vector','uuid-ossp')) AS extensions, -- 2
  (SELECT COUNT(*) FROM pg_proc
   WHERE pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public')
   AND proname IN ('match_schemes','get_admin_stats','get_or_create_session',
     'generate_reference_number','get_session_applications','update_application_status',
     'get_scheme_by_slug','get_application_detail','seed_demo_data')
  ) AS rpc_functions,    -- 9
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public'
   AND indexname='idx_scheme_chunks_embedding'
  ) AS hnsw_index,       -- 1
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity=true
  ) AS rls_tables;       -- 9
-- EXPECTED: 9 | 2 | 9 | 1 | 9

-- A2: Data integrity (run after Phase 1 pipeline)
SELECT
  (SELECT COUNT(*) FROM schemes WHERE is_verified=true)     AS verified_schemes,   -- 51
  (SELECT COUNT(*) FROM scheme_chunks)                       AS chunks,             -- 102
  (SELECT COUNT(*) FROM scheme_chunks WHERE embedding IS NOT NULL) AS embedded,     -- 102
  (SELECT benefit_annual_inr FROM schemes WHERE acronym='PM-KISAN') AS pm_kisan,   -- 6000
  (SELECT benefit_annual_inr FROM schemes WHERE name_english ILIKE '%Maandhan%')
                                                             AS pm_kmy,             -- 36000
  (SELECT COUNT(*) FROM schemes WHERE name_hindi IS NOT NULL) AS with_hindi;        -- ≥48

-- A3: get_or_create_session — creates new and returns existing
SELECT * FROM get_or_create_session('test-db-a3-001');
-- Expected: row with chat_state='intake', language='hi'
SELECT * FROM get_or_create_session('test-db-a3-001');
-- Expected: same row (not a second one)
SELECT COUNT(*) FROM user_sessions WHERE session_id='test-db-a3-001';
-- Expected: 1
DELETE FROM user_sessions WHERE session_id='test-db-a3-001';

-- A4: generate_reference_number — correct format, unique
SELECT
  generate_reference_number() ~ '^JAN-\d{4}-\d{5}$' AS format_ok,   -- true
  generate_reference_number() <> generate_reference_number() AS unique_ok; -- true

-- A5: update_application_status + history trigger
-- First create a test application
DO $$
DECLARE v_scheme_id UUID; v_ref TEXT;
BEGIN
  SELECT id INTO v_scheme_id FROM schemes WHERE acronym='PM-KISAN' LIMIT 1;
  IF v_scheme_id IS NULL THEN RAISE EXCEPTION 'No schemes — run pipeline first'; END IF;
  INSERT INTO user_sessions(session_id) VALUES ('test-trigger-session') ON CONFLICT DO NOTHING;
  v_ref := generate_reference_number();
  INSERT INTO applications(reference_number,session_id,scheme_id,scheme_name,form_data,status,submitted_at)
  VALUES (v_ref,'test-trigger-session',v_scheme_id,'PM-KISAN','{}','submitted',NOW());
  -- History should have 1 record (INSERT trigger)
  ASSERT (SELECT COUNT(*) FROM application_status_history
          WHERE application_id=(SELECT id FROM applications WHERE reference_number=v_ref)) = 1,
         'INSERT trigger should create 1 history record';
  -- Update status
  PERFORM update_application_status(v_ref,'state_verified','test');
  -- History should now have 2 records
  ASSERT (SELECT COUNT(*) FROM application_status_history
          WHERE application_id=(SELECT id FROM applications WHERE reference_number=v_ref)) = 2,
         'UPDATE trigger should add 1 more history record';
  -- state_verified_at should be set
  ASSERT (SELECT state_verified_at FROM applications WHERE reference_number=v_ref) IS NOT NULL,
         'state_verified_at should be set';
  -- Cleanup
  DELETE FROM applications WHERE reference_number=v_ref;
  DELETE FROM user_sessions WHERE session_id='test-trigger-session';
  RAISE NOTICE 'A5 PASSED';
END $$;

-- A6: match_schemes deduplication check (run after ingest)
-- This test verifies no duplicate scheme_ids in results
WITH results AS (
  SELECT scheme_id, COUNT(*) AS cnt
  FROM match_schemes(
    (SELECT embedding FROM scheme_chunks LIMIT 1),
    0.0,  -- very low threshold to get all results
    20
  )
  GROUP BY scheme_id
  HAVING COUNT(*) > 1
)
SELECT COUNT(*) AS duplicate_count FROM results;
-- Expected: 0 (no duplicates — DISTINCT ON fix is working)

-- A7: get_session_applications returns JSON array
INSERT INTO user_sessions(session_id) VALUES ('test-gsapps-001') ON CONFLICT DO NOTHING;
SELECT jsonb_array_length(get_session_applications('test-gsapps-001')::jsonb) AS count;
-- Expected: 0 (empty array — no applications for new session)
DELETE FROM user_sessions WHERE session_id='test-gsapps-001';
