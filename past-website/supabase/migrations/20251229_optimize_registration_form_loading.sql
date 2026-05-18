-- ═══════════════════════════════════════════════════════════════════════
-- OPTIMIZE REGISTRATION FORM LOADING
-- ═══════════════════════════════════════════════════════════════════════
-- Creates views and indexes to speed up form loading
-- Before: 4-5 separate API calls
-- After: 1 API call using get_registration_form() function

-- 1. VIEW: Get template with question count (for quick lookups)
CREATE OR REPLACE VIEW v_form_templates_with_stats AS
SELECT
    ft.id,
    ft.name,
    ft.description,
    ft.usage_type,
    ft.is_locked,
    ft.locked_to_event_id,
    ft.settings,
    ft.created_at,
    ft.updated_at,
    COUNT(fq.id) as question_count,
    COUNT(fq.id) FILTER (WHERE fq.is_required = true) as required_count
FROM form_templates ft
LEFT JOIN form_questions fq ON fq.template_id = ft.id
GROUP BY ft.id;

-- 2. VIEW: Event with registration form details (single query)
CREATE OR REPLACE VIEW v_event_registration AS
SELECT
    e.id as event_id,
    e.title as event_title,
    e.slug,
    e.start_date,
    e.end_date,
    e.registration_enabled,
    e.registration_deadline,
    e.initial_template_id,
    e.interest_template_id,
    e.detailed_template_id,
    -- Application form details
    app_ft.id as app_form_id,
    app_ft.name as app_form_name,
    app_ft.description as app_form_description,
    app_ft.settings as app_form_settings,
    -- Interest form details
    int_ft.id as interest_form_id,
    int_ft.name as interest_form_name,
    -- Registration status calculation
    CASE
        WHEN e.registration_enabled = false THEN 'disabled'
        WHEN e.registration_deadline IS NOT NULL AND e.registration_deadline < NOW() THEN 'closed'
        WHEN e.start_date IS NOT NULL AND e.start_date < NOW() THEN 'event_started'
        ELSE 'open'
    END as registration_status
FROM events e
LEFT JOIN form_templates app_ft ON app_ft.id = e.initial_template_id
LEFT JOIN form_templates int_ft ON int_ft.id = e.interest_template_id;

-- 3. VIEW: Form questions ordered (pre-sorted for fast retrieval)
CREATE OR REPLACE VIEW v_form_questions_ordered AS
SELECT
    fq.id,
    fq.template_id,
    fq.type,
    fq.title,
    fq.description,
    fq.is_required,
    fq.order_index,
    fq.config,
    fq.validation_rules,
    fq.conditional_logic
FROM form_questions fq
ORDER BY fq.template_id, fq.order_index;

-- 4. FUNCTION: Get complete registration form data in one call
CREATE OR REPLACE FUNCTION get_registration_form(p_event_slug TEXT, p_user_email TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_event RECORD;
    v_questions JSON;
    v_existing_response JSON := NULL;
    v_resp_id UUID;
    v_resp_status TEXT;
    v_resp_data JSONB;
    v_resp_token TEXT;
BEGIN
    -- Get event with template info
    SELECT * INTO v_event
    FROM v_event_registration
    WHERE slug = p_event_slug;

    IF v_event IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Event not found');
    END IF;

    -- Get questions for the form
    SELECT json_agg(q ORDER BY q.order_index) INTO v_questions
    FROM v_form_questions_ordered q
    WHERE q.template_id = v_event.initial_template_id;

    -- Check for existing response if email provided
    IF p_user_email IS NOT NULL THEN
        SELECT id, status, responses, resume_token
        INTO v_resp_id, v_resp_status, v_resp_data, v_resp_token
        FROM form_responses
        WHERE event_id = v_event.event_id
          AND respondent_email = p_user_email
          AND response_type = 'initial_interest'
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_resp_id IS NOT NULL THEN
            v_existing_response := json_build_object(
                'id', v_resp_id,
                'status', v_resp_status,
                'responses', v_resp_data,
                'resume_token', v_resp_token
            );
        END IF;
    END IF;

    -- Build complete result
    v_result := json_build_object(
        'success', true,
        'data', json_build_object(
            'event', json_build_object(
                'id', v_event.event_id,
                'title', v_event.event_title,
                'slug', v_event.slug,
                'start_date', v_event.start_date,
                'registration_status', v_event.registration_status
            ),
            'template', json_build_object(
                'id', v_event.app_form_id,
                'name', v_event.app_form_name,
                'description', v_event.app_form_description,
                'settings', v_event.app_form_settings
            ),
            'questions', COALESCE(v_questions, '[]'::json),
            'existing_response', v_existing_response
        )
    );

    RETURN v_result;
END;
$$;

-- Grant access
GRANT SELECT ON v_form_templates_with_stats TO anon, authenticated;
GRANT SELECT ON v_event_registration TO anon, authenticated;
GRANT SELECT ON v_form_questions_ordered TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_registration_form(TEXT, TEXT) TO anon, authenticated;

-- 5. Additional composite index for faster question retrieval
CREATE INDEX IF NOT EXISTS idx_form_questions_template_order
ON form_questions(template_id, order_index)
INCLUDE (type, title, is_required, config);

-- 6. Index for checking existing responses quickly
CREATE INDEX IF NOT EXISTS idx_form_responses_registration_lookup
ON form_responses(event_id, respondent_email, response_type, created_at DESC)
WHERE response_type = 'initial_interest';
