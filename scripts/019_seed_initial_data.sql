-- Insert initial committees
INSERT INTO public.committees (id, name, description, purpose, meeting_schedule, is_active) VALUES
  (gen_random_uuid(), 'Technical Committee', 'Handles technical aspects of tournaments and arbitration', 'Oversee technical standards and regulations', 'Monthly - First Friday', true),
  (gen_random_uuid(), 'Ethics Committee', 'Manages ethical conduct and disciplinary matters', 'Ensure ethical standards and handle violations', 'Quarterly - As needed', true),
  (gen_random_uuid(), 'Training Committee', 'Organizes training programs for arbiters', 'Develop and conduct arbiter training programs', 'Bi-monthly - Second Tuesday', true),
  (gen_random_uuid(), 'Finance Committee', 'Manages financial affairs and budgets', 'Oversee financial planning and expenditure', 'Monthly - Third Monday', true),
  (gen_random_uuid(), 'Development Committee', 'Focuses on chess development initiatives', 'Promote chess development across Nigeria', 'Monthly - Last Thursday', true);

-- Insert initial chat rooms
INSERT INTO public.chat_rooms (id, name, description, room_type, is_private) VALUES
  (gen_random_uuid(), 'General Discussion', 'General chat for all arbiters', 'General', false),
  (gen_random_uuid(), 'Technical Support', 'Get help with technical issues', 'General', false),
  (gen_random_uuid(), 'Tournament Updates', 'Latest tournament announcements', 'General', false),
  (gen_random_uuid(), 'Training & Development', 'Discuss training opportunities', 'General', false),
  (gen_random_uuid(), 'Zone Coordinators', 'Private chat for zone coordinators', 'Zone', true);

-- Insert initial resource categories and sample resources
INSERT INTO public.resources (id, title, description, category, tags, is_featured, is_public) VALUES
  (gen_random_uuid(), 'FIDE Laws of Chess', 'Official FIDE Laws of Chess document', 'Rules & Regulations', ARRAY['FIDE', 'Rules', 'Official'], true, true),
  (gen_random_uuid(), 'Arbiter Manual 2023', 'Comprehensive guide for chess arbiters', 'Training Materials', ARRAY['Manual', 'Training', 'Guide'], true, true),
  (gen_random_uuid(), 'Tournament Report Form', 'Standard form for tournament reporting', 'Forms & Documents', ARRAY['Form', 'Tournament', 'Report'], false, true),
  (gen_random_uuid(), 'Pairing Software Guide', 'How to use Swiss Manager and other pairing software', 'Software', ARRAY['Software', 'Pairing', 'Tutorial'], false, true),
  (gen_random_uuid(), 'Time Control Guidelines', 'Guidelines for different time controls', 'Guidelines', ARRAY['Time Control', 'Guidelines'], false, true);

-- Insert sample events
INSERT INTO public.events (id, title, description, event_type, start_date, end_date, venue, city, state, is_public, requires_registration) VALUES
  (gen_random_uuid(), 'NCAA Annual General Meeting 2024', 'Annual general meeting of all NCAA members', 'Meeting', '2024-12-15 10:00:00+01', '2024-12-15 16:00:00+01', 'National Theatre', 'Lagos', 'Lagos', true, true),
  (gen_random_uuid(), 'Arbiter Training Workshop - North', 'Training workshop for northern zone arbiters', 'Training', '2024-11-20 09:00:00+01', '2024-11-22 17:00:00+01', 'Ahmadu Bello University', 'Zaria', 'Kaduna', true, true),
  (gen_random_uuid(), 'Technical Committee Meeting', 'Monthly technical committee meeting', 'Meeting', '2024-11-01 14:00:00+01', '2024-11-01 16:00:00+01', 'NCAA Secretariat', 'Abuja', 'FCT', false, false);
