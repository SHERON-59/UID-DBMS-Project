-- Schools table
CREATE TABLE IF NOT EXISTS schools (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    contact_number VARCHAR(15),
    email VARCHAR(255),
    principal_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Examiners table
CREATE TABLE IF NOT EXISTS examiners (
    examiner_id SERIAL PRIMARY KEY,
    examiner_name VARCHAR(255) NOT NULL,
    school_id INTEGER REFERENCES schools(school_id),
    qualification VARCHAR(255),
    subject_id INTEGER REFERENCES subjects(subject_id),
    contact_number VARCHAR(15),
    email VARCHAR(255),
    experience_years INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    student_roll_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    school_id INTEGER REFERENCES schools(school_id),
    class_standard INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Answer sheets table
CREATE TABLE IF NOT EXISTS answer_sheets (
    sheet_id SERIAL PRIMARY KEY,
    answer_book_id VARCHAR(50) UNIQUE NOT NULL,
    student_roll_number VARCHAR(50) REFERENCES students(student_roll_number),
    subject_id INTEGER REFERENCES subjects(subject_id),
    examiner_id INTEGER REFERENCES examiners(examiner_id),
    marks_assigned INTEGER CHECK (marks_assigned >= 0 AND marks_assigned <= 100),
    evaluation_date DATE,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invigilation assignments table
CREATE TABLE IF NOT EXISTS invigilation_assignments (
    assignment_id SERIAL PRIMARY KEY,
    examiner_id INTEGER REFERENCES examiners(examiner_id),
    school_id INTEGER REFERENCES schools(school_id),
    exam_date DATE NOT NULL,
    exam_session VARCHAR(20) NOT NULL,
    subject_id INTEGER REFERENCES subjects(subject_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'examiner',
    examiner_id INTEGER REFERENCES examiners(examiner_id),
    school_id INTEGER REFERENCES schools(school_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Drop views if they exist to avoid conflicts
DROP VIEW IF EXISTS invigilation_schedule CASCADE;
DROP VIEW IF EXISTS evaluation_summary CASCADE;
DROP VIEW IF EXISTS examiner_details CASCADE;

-- Views for easier querying
CREATE VIEW examiner_details AS
SELECT 
    e.examiner_id,
    e.examiner_name,
    s.school_name,
    sub.subject_name,
    e.qualification,
    e.contact_number,
    e.email,
    e.experience_years,
    e.school_id,
    e.subject_id
FROM examiners e
JOIN schools s ON e.school_id = s.school_id
JOIN subjects sub ON e.subject_id = sub.subject_id;

CREATE VIEW evaluation_summary AS
SELECT 
    a.sheet_id,
    a.answer_book_id,
    a.student_roll_number,
    st.student_name,
    sub.subject_name,
    e.examiner_name,
    a.marks_assigned,
    a.evaluation_date,
    a.remarks,
    a.examiner_id,
    a.subject_id
FROM answer_sheets a
JOIN students st ON a.student_roll_number = st.student_roll_number
JOIN subjects sub ON a.subject_id = sub.subject_id
JOIN examiners e ON a.examiner_id = e.examiner_id;

CREATE VIEW invigilation_schedule AS
SELECT 
    ia.assignment_id,
    e.examiner_name,
    s.school_name,
    ia.exam_date,
    ia.exam_session,
    sub.subject_name,
    ia.examiner_id,
    ia.school_id,
    ia.subject_id
FROM invigilation_assignments ia
JOIN examiners e ON ia.examiner_id = ia.examiner_id
JOIN schools s ON ia.school_id = s.school_id
JOIN subjects sub ON ia.subject_id = sub.subject_id;

-- Insert sample data
INSERT INTO schools (school_name, location) VALUES
('Delhi Public School', 'New Delhi'),
('Kendriya Vidyalaya', 'Mumbai'),
('St. Xavier School', 'Kolkata')
ON CONFLICT (school_name) DO NOTHING;

INSERT INTO subjects (subject_name, subject_code) VALUES
('Mathematics', 'MATH001'),
('Physics', 'PHY001'),
('Chemistry', 'CHEM001'),
('Biology', 'BIO001'),
('English', 'ENG001')
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO examiners (examiner_name, school_id, qualification, subject_id, contact_number, email, experience_years) VALUES
('Dr. Rajesh Kumar', 1, 'M.Sc Mathematics, Ph.D', 1, '9876543210', 'rajesh.kumar@email.com', 15),
('Mrs. Priya Sharma', 2, 'M.Sc Physics', 2, '9876543211', 'priya.sharma@email.com', 12),
('Dr. Amit Singh', 3, 'M.Sc Chemistry, Ph.D', 3, '9876543212', 'amit.singh@email.com', 18)
ON CONFLICT DO NOTHING;

-- Optional: Add sample data for students and answer_sheets
INSERT INTO students (student_roll_number, student_name, school_id, class_standard) VALUES
('2024001001', 'Amit Patel', 1, 10),
('2024001002', 'Sneha Gupta', 2, 10)
ON CONFLICT (student_roll_number) DO NOTHING;

INSERT INTO answer_sheets (answer_book_id, student_roll_number, subject_id, examiner_id, marks_assigned, evaluation_date, remarks) VALUES
('AB2024001', '2024001001', 1, 1, 85, '2024-04-20', 'Good performance'),
('AB2024002', '2024001002', 2, 2, 90, '2024-04-21', 'Excellent work')
ON CONFLICT (answer_book_id) DO NOTHING;

INSERT INTO invigilation_assignments (examiner_id, school_id, exam_date, exam_session, subject_id) VALUES
(1, 1, '2025-06-01', 'Morning', 1),  -- Dr. Rajesh Kumar at Delhi Public School for Mathematics
(2, 2, '2025-06-01', 'Afternoon', 2),  -- Mrs. Priya Sharma at Kendriya Vidyalaya for Physics
(3, 3, '2025-06-02', 'Morning', 3)  -- Dr. Amit Singh at St. Xavier School for Chemistry
ON CONFLICT (assignment_id) DO NOTHING;

SELECT * FROM evaluation_summary;
SELECT * FROM examiner_details;
SELECT * FROM invigilation_schedule;


