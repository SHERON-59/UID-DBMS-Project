CREATE TABLE schools (
    school_id SERIAL PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Examiners table
CREATE TABLE examiners (
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
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_roll_number VARCHAR(50) UNIQUE NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    school_id INTEGER REFERENCES schools(school_id),
    class_standard INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Answer sheets table
CREATE TABLE answer_sheets (
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
CREATE TABLE invigilation_assignments (
    assignment_id SERIAL PRIMARY KEY,
    examiner_id INTEGER REFERENCES examiners(examiner_id),
    school_id INTEGER REFERENCES schools(school_id),
    exam_date DATE NOT NULL,
    exam_session VARCHAR(20) NOT NULL, -- 'Morning', 'Afternoon'
    subject_id INTEGER REFERENCES subjects(subject_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
JOIN examiners e ON ia.examiner_id = e.examiner_id
JOIN schools s ON ia.school_id = s.school_id
JOIN subjects sub ON ia.subject_id = sub.subject_id;

-- Insert sample data
INSERT INTO schools (school_name, location) VALUES
('Delhi Public School', 'New Delhi'),
('Kendriya Vidyalaya', 'Mumbai'),
('St. Xavier School', 'Kolkata');

INSERT INTO subjects (subject_name, subject_code) VALUES
('Mathematics', 'MATH001'),
('Physics', 'PHY001'),
('Chemistry', 'CHEM001'),
('Biology', 'BIO001'),
('English', 'ENG001');

INSERT INTO examiners (examiner_name, school_id, qualification, subject_id, contact_number, email, experience_years) VALUES
('Dr. Rajesh Kumar', 1, 'M.Sc Mathematics, Ph.D', 1, '9876543210', 'rajesh.kumar@email.com', 15),
('Mrs. Priya Sharma', 2, 'M.Sc Physics', 2, '9876543211', 'priya.sharma@email.com', 12),
('Dr. Amit Singh', 3, 'M.Sc Chemistry, Ph.D', 3, '9876543212', 'amit.singh@email.com', 18);