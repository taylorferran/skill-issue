-- Example Skills for Skill Issue Platform
-- This demonstrates that the platform works for ANY type of skill
-- Hardcoded skill entries for testing and demonstration purposes - but we will allow users to add their own hopefully.

-- Language Learning Skills
INSERT INTO skills (name, description, active) VALUES
('Spanish Vocabulary', 'Spanish to English vocabulary translation and comprehension', true),
('French Grammar', 'French grammar rules, verb conjugations, and sentence structure', true),
('Japanese Kanji', 'Recognition and meaning of Japanese Kanji characters', true); -- This might be scuffed, need to test

-- Programming Skills
INSERT INTO skills (name, description, active) VALUES
('JavaScript Basics', 'JavaScript fundamentals: variables, functions, control flow, and data types', true),
('Python Data Structures', 'Python lists, dictionaries, sets, and their operations', true),
('SQL Queries', 'Writing and optimizing SQL SELECT, JOIN, and aggregate queries', true);

-- Maths Skills
INSERT INTO skills (name, description, active) VALUES
('Algebra I', 'Basic algebraic expressions, equations, and linear functions', true),
('Calculus Derivatives', 'Computing derivatives using power rule, chain rule, and product rule', true),
('Statistics', 'Probability, distributions, hypothesis testing, and statistical inference', true);

-- Science Skills
INSERT INTO skills (name, description, active) VALUES
('Chemistry Basics', 'Chemical elements, periodic table, bonding, and reactions', true),
('Biology Cell Structure', 'Cell organelles, their functions, and cellular processes', true),
('Physics Mechanics', 'Newton''s laws, kinematics, energy, and momentum', true);

-- History Skills
INSERT INTO skills (name, description, active) VALUES
('World War II', 'Major events, battles, leaders, and outcomes of World War II', true),
('Ancient Rome', 'Roman Republic, Empire, culture, and historical significance', true),
('US Constitution', 'US Constitutional amendments, articles, and fundamental principles', true);

-- Music Skills
INSERT INTO skills (name, description, active) VALUES
('Music Theory', 'Scales, chords, intervals, and harmonic progressions', true),
('Classical Composers', 'Major classical composers, their works, and musical periods', true),
('Guitar Chords', 'Common guitar chord shapes, progressions, and transitions', true);

-- Geography Skills
INSERT INTO skills (name, description, active) VALUES
('World Capitals', 'Capital cities of countries around the world', true),
('US State Geography', 'US states, capitals, borders, and geographical features', true),
('World Rivers & Mountains', 'Major rivers, mountain ranges, and geographical landmarks', true);

-- General Knowledge Skills
INSERT INTO skills (name, description, active) VALUES
('Literature', 'Major literary works, authors, and literary movements', true),
('Art History', 'Famous artists, art movements, and significant artworks', true),
('Sports Trivia', 'Major sports leagues, championships, records, and athletes', true);
