-- Add a sample registration form template for testing
-- This allows events to have registration forms

INSERT INTO form_templates (
  id,
  name,
  description,
  form_type,
  created_by
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Basic Event Registration',
  'A simple registration form with name, email, and basic questions',
  'initial_interest',
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- Add some basic questions to the template
INSERT INTO form_questions (
  template_id,
  question_text,
  question_type,
  is_required,
  display_order
) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Full Name', 'short_text', true, 0),
  ('a0000000-0000-0000-0000-000000000001', 'Email Address', 'email', true, 1),
  ('a0000000-0000-0000-0000-000000000001', 'Phone Number', 'phone', false, 2),
  ('a0000000-0000-0000-0000-000000000001', 'Organization/Institution', 'short_text', false, 3),
  ('a0000000-0000-0000-0000-000000000001', 'Why do you want to attend this event?', 'long_text', true, 4)
ON CONFLICT DO NOTHING;
