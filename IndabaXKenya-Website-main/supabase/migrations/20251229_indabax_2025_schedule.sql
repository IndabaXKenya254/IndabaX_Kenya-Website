-- ═══════════════════════════════════════════════════════════════════════
-- INDABAX KENYA 2025 SCHEDULE DATA
-- ═══════════════════════════════════════════════════════════════════════
-- Source: IndabaX Kenya 2025 Provisional Programme (18th-20th June)
-- Maseno University AI Summit
-- ═══════════════════════════════════════════════════════════════════════

-- Clear existing schedule for this event (if any)
DELETE FROM schedule_items WHERE event_id = 'e4128a7f-2f65-4c78-90aa-7e497a913a81';

-- ═══════════════════════════════════════════════════════════════════════
-- DAY 1: Wednesday 18 June 2025
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO schedule_items (event_id, day_number, day_name, schedule_date, start_time, end_time, title, description, session_type, location) VALUES
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '07:00', '08:00', 'Breakfast', NULL, 'break', 'Siriba Campus Dining Room'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '08:00', '10:00', 'Registration Desks Open', NULL, 'registration', 'Prof. George Magoha Tuition Block Entrance'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '08:45', '09:30', 'Opening Remarks', 'Dean, School of Computing; IndabaX Organisers - Grace; DVC PRI, DVC ASA', 'special', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '09:30', '10:00', 'Maseno University Vice Chancellor''s Address', 'Remarks from Representative from the PS office, Ministry of ICT and Digital Economy', 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '10:00', '10:30', 'Keynote: AI for Justice', 'AI for Justice: Enhancing Access, Efficiency and Fairness in Kenya''s Judicial Systems', 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '10:30', '11:00', 'Coffee Break', NULL, 'break', NULL),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '11:00', '12:00', 'African Research Showcase', 'Parallel sessions: 1) Tailoring AI Agents to Specific Use Cases; 2) AI That Listens: Building AI Agents that Reflect African Voices and Values; 3) Reducing Inequality Through AI-Driven Education; 4) AI in Education Panel; 5) AI application in Civic Tech; 6) Haki Africa: AI Legal Research Assistant', 'track', 'Amphitheater (Multiple Wings)'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '12:00', '13:00', 'Workshops', 'AI in Health (Amphitheatre West Wing) | AI Governance (Amphitheatre South Wing)', 'workshop', 'Amphitheatre (Multiple Wings)'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '13:00', '14:00', 'Lunch', NULL, 'break', 'Siriba Campus Dining Room'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '14:00', '14:30', 'Keynote: AI and Cybersecurity', 'AI and Cybersecurity: Harnessing and Securing AI', 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '14:30', '15:30', 'Keynote: AI Policy and Data Licensing', NULL, 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '15:30', '16:00', 'Coffee Break', NULL, 'break', NULL),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '16:00', '17:00', 'African Research Showcase', 'State of Civic Tech in Kenya (South Wing) | Geospatial Foundation Models (West Wing)', 'track', 'Amphitheatre (Multiple Wings)'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '17:00', '18:00', 'Practical Labs and Poster Sessions', 'AI/NLP: Beginner to Advanced, Applications | ML/Computer Vision: Building Visual Models | The Development of a Translation Model by Fine-Tuning NLLB: The Dholuo-Swahili Case | Demo: AI4KSL', 'workshop', 'Amphitheater (Multiple Wings)'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 1, 'Day 1', 'Wednesday, June 18', '18:00', '19:00', 'Dinner/Networking Session', NULL, 'social', 'Siriba Campus Dining Room');

-- ═══════════════════════════════════════════════════════════════════════
-- DAY 2: Thursday 19 June 2025
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO schedule_items (event_id, day_number, day_name, schedule_date, start_time, end_time, title, description, session_type, location) VALUES
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '07:00', '07:45', 'Breakfast', NULL, 'break', 'Siriba Campus Dining Room'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '07:45', '07:55', 'Announcements', NULL, 'special', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '08:00', '08:30', 'Keynote: Bootstrapping Intelligence', 'Bootstrapping Intelligence: Building African AI From the Ground Up', 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '08:30', '08:45', 'Keynote: Director ICT Address', NULL, 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '08:45', '09:30', 'Keynote: Responsible AI for Climate Actions', NULL, 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '09:30', '10:30', 'African Research Showcase', 'AI for Precision Based Agriculture | Sustainable Agriculture using AI | Benchmarking LLMs: From Standard NLP Tasks to Real-World Multilingual Challenges | Applications of Machine Learning techniques in Big Data | Building RAG Systems with Mozilla Common Voice', 'track', 'Amphitheater (Multiple Wings)'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '10:30', '11:00', 'Coffee Break', NULL, 'break', NULL),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '11:00', '12:00', 'Keynote: Democratizing Intelligence', NULL, 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '12:00', '13:00', 'Keynote: GenAI for Maternal Health', 'GenAI for Maternal Health across Sub Saharan Africa', 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '13:00', '13:15', 'Group Photo Session', NULL, 'special', 'Prof. George Magoha Tuition Block Entrance'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '13:15', '14:00', 'Lunch', NULL, 'break', 'Siriba Campus Dining Room'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '14:00', '15:30', 'Workshops', 'Building for Justice and Democracy (West Wing) | Futuristic AI: Innovation for Safety and Development (South Wing) | EduTab Africa Program for Pre-university students (East Wing)', 'workshop', 'Amphitheater (Multiple Wings)'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '15:30', '16:00', 'Coffee Break', NULL, 'break', NULL),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '16:00', '16:30', 'Keynote: Safety and Privacy', NULL, 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '16:30', '17:00', 'Hackathon and Poster Sessions', 'Hackathons Launch', 'hackathon', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '17:00', '18:00', 'Ideathon', NULL, 'hackathon', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 2, 'Day 2', 'Thursday, June 19', '18:00', '19:00', 'Dinner/Networking Session', NULL, 'social', 'Siriba Campus Dining Room');

-- ═══════════════════════════════════════════════════════════════════════
-- DAY 3: Friday 20 June 2025 (Virtual Sessions Only)
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO schedule_items (event_id, day_number, day_name, schedule_date, start_time, end_time, title, description, session_type, location) VALUES
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 3, 'Day 3', 'Friday, June 20', '07:00', '07:45', 'Breakfast', NULL, 'break', 'Siriba Campus Dining Room'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 3, 'Day 3', 'Friday, June 20', '07:45', '07:55', 'Announcements', NULL, 'special', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 3, 'Day 3', 'Friday, June 20', '08:00', '08:30', 'Keynote: Meaningful Participation in AI', 'Meaningful Participation in the Development and Utilisation of Artificial Intelligence for African Communities (Virtual)', 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 3, 'Day 3', 'Friday, June 20', '08:30', '09:30', 'Keynote: Ethics and ICTs', 'Virtual Session', 'keynote', 'Amphitheatre South Wing'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 3, 'Day 3', 'Friday, June 20', '09:30', '10:30', 'African Research Showcase', 'Deep Learning for Social Good: Transforming Healthcare, Education, and Agriculture in Africa (South Wing) | AI for Climate (West Wing) - Virtual Sessions', 'track', 'Amphitheater (Multiple Wings)'),
('e4128a7f-2f65-4c78-90aa-7e497a913a81', 3, 'Day 3', 'Friday, June 20', '10:30', '11:30', 'Award Ceremony and Closing Remarks', 'Virtual', 'closing', 'Virtual');
