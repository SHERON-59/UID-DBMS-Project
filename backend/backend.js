// CBSE Board Exams Database Application

const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const JWT_SECRET = process.env.JWT_SECRET || 'cbse-jwt-secret-key';

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cbse_board_exams',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'cbse-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

// Helper function to validate date format (YYYY-MM-DD)
const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date.toISOString().startsWith(dateString);
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

const validateRequest = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }
        next();
    };
};

// Database connection test
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL database');
        client.release();
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

// Database operations class
class CBSEDatabase {
    static async createAllTables() {
        try {
            await this.createUsersTable();
            await this.createSchoolsTable();
            await this.createSubjectsTable();
            await this.createExaminersTable();
            await this.createStudentsTable();
            await this.createAnswerSheetsTable();
            await this.createInvigilationAssignmentsTable();
            await this.createViews();
        } catch (error) {
            console.error('Error creating tables:', error.message, error.stack);
            throw error;
        }
    }

    static async createUsersTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            user_id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'examiner' CHECK (role IN ('admin', 'coordinator', 'examiner')),
            examiner_id INTEGER REFERENCES examiners(examiner_id),
            school_id INTEGER REFERENCES schools(school_id),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        );
    `;
    await pool.query(query);
    console.log('Users table created/verified');
}

static async createSchoolsTable() {
    try {
        const query = `
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
        `;
        await pool.query(query);
        console.log('Schools table created/verified');
    } catch (error) {
        console.error('Error creating schools table:', error.message, error.stack);
        throw error;
    }
}

static async createSubjectsTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS subjects (
            subject_id SERIAL PRIMARY KEY,
            subject_name VARCHAR(100) NOT NULL,
            subject_code VARCHAR(20) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
    console.log('Subjects table created/verified');
}

static async createExaminersTable() {
    const query = `
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
    `;
    await pool.query(query);
    console.log('Examiners table created/verified');
}

static async createStudentsTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS students (
            student_id SERIAL PRIMARY KEY,
            student_roll_number VARCHAR(50) UNIQUE NOT NULL,
            student_name VARCHAR(255) NOT NULL,
            school_id INTEGER REFERENCES schools(school_id),
            class_standard INTEGER DEFAULT 10,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
    console.log('Students table created/verified');
}

static async createAnswerSheetsTable() {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS answer_sheets (
                sheet_id SERIAL PRIMARY KEY,
                answer_book_id VARCHAR(50) UNIQUE NOT NULL,
                student_roll_number VARCHAR(50) REFERENCES students(student_roll_number),
                subject_id INTEGER REFERENCES subjects(subject_id),
                examiner_id INTEGER REFERENCES examiners(examiner_id),
                marks_assigned INTEGER CHECK (marks_assigned >= 0 AND marks_assigned <= 50),
                evaluation_date DATE,
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(query);
        console.log('Answer sheets table created/verified');
    } catch (error) {
        console.error('Error creating answer_sheets table:', error.message, error.stack);
        throw error;
    }
}

static async createInvigilationAssignmentsTable() {
    const query = `
        CREATE TABLE IF NOT EXISTS invigilation_assignments (
            assignment_id SERIAL PRIMARY KEY,
            examiner_id INTEGER REFERENCES examiners(examiner_id),
            school_id INTEGER REFERENCES schools(school_id),
            exam_date DATE NOT NULL,
            exam_session VARCHAR(20) NOT NULL,
            subject_id INTEGER REFERENCES subjects(subject_id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await pool.query(query);
    console.log('Invigilation assignments table created/verified');
}

    static async createViews() {
    const maxRetries = 3;
    let attempt = 1;
    while (attempt <= maxRetries) {
        try {
            console.log(`Attempt ${attempt} to create views...`);
            await pool.query('DROP VIEW IF EXISTS invigilation_schedule CASCADE');
            await pool.query('DROP VIEW IF EXISTS evaluation_summary CASCADE');
            await pool.query('DROP VIEW IF EXISTS examiner_details CASCADE');

            const examinerDetailsView = `
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
            `;
            await pool.query(examinerDetailsView);
            console.log('Examiner details view created/verified');

            const evaluationSummaryView = `
                CREATE VIEW evaluation_summary AS
                SELECT 
                    ans.sheet_id,
                    ans.answer_book_id,
                    ans.student_roll_number,
                    st.student_name,
                    sub.subject_name,
                    e.examiner_name,
                    ans.marks_assigned,
                    ans.evaluation_date,
                    ans.remarks,
                    ans.examiner_id,
                    ans.subject_id
                FROM answer_sheets ans
                JOIN students st ON ans.student_roll_number = st.student_roll_number
                JOIN subjects sub ON ans.subject_id = sub.subject_id
                JOIN examiners e ON ans.examiner_id = e.examiner_id;
            `;
            await pool.query(evaluationSummaryView);
            console.log('Evaluation summary view created/verified');

            const invigilationScheduleView = `
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
            `;
            await pool.query(invigilationScheduleView);
            console.log('Invigilation schedule view created/verified');

            console.log('All database views created/verified');
            break;
        } catch (error) {
            console.error(`Attempt ${attempt} failed to create views:`, error.message, error.stack);
            if (attempt === maxRetries) {
                throw error;
            }
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 1000)); 
        }
    }
}

    static async insertSampleData() {
    try {
        // Insert sample schools
        const schoolsExist = await pool.query('SELECT COUNT(*) FROM schools');
        if (parseInt(schoolsExist.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO schools (school_name, location) VALUES
                ('Delhi Public School', 'New Delhi'),
                ('Kendriya Vidyalaya', 'Mumbai'),
                ('St. Xavier School', 'Kolkata')
                ON CONFLICT (school_name) DO NOTHING
            `);
            console.log('Sample schools inserted');
        }

        // Insert sample subjects
        const subjectsExist = await pool.query('SELECT COUNT(*) FROM subjects');
        if (parseInt(subjectsExist.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO subjects (subject_name, subject_code) VALUES
                ('Mathematics', 'MATH001'),
                ('Physics', 'PHY001'),
                ('Chemistry', 'CHEM001'),
                ('Biology', 'BIO001'),
                ('English', 'ENG001')
                ON CONFLICT (subject_code) DO NOTHING
            `);
            console.log('Sample subjects inserted');
        }

        // Insert sample examiners
        const examinersExist = await pool.query('SELECT COUNT(*) FROM examiners');
        if (parseInt(examinersExist.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO examiners (examiner_name, school_id, qualification, subject_id, contact_number, email, experience_years) VALUES
                ('Dr. Rajesh Kumar', 1, 'M.Sc Mathematics, Ph.D', 1, '9876543210', 'rajesh.kumar@email.com', 15),
                ('Mrs. Priya Sharma', 2, 'M.Sc Physics', 2, '9876543211', 'priya.sharma@email.com', 12),
                ('Dr. Amit Singh', 3, 'M.Sc Chemistry, Ph.D', 3, '9876543212', 'amit.singh@email.com', 18)
                ON CONFLICT DO NOTHING
            `);
            console.log('Sample examiners inserted');
        }

        // Insert sample students
        const studentsExist = await pool.query('SELECT COUNT(*) FROM students');
        if (parseInt(studentsExist.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO students (student_roll_number, student_name, school_id, class_standard) VALUES
                ('2024001001', 'Amit Patel', 1, 10),
                ('2024001002', 'Sneha', 2, 10)
                ON CONFLICT (student_roll_number) DO NOTHING
            `);
            console.log('Sample students inserted');
        }

        // Insert sample answer sheets
        const answerSheetsExist = await pool.query('SELECT COUNT(*) FROM answer_sheets');
        if (parseInt(answerSheetsExist.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO answer_sheets (answer_book_id, student_roll_number, subject_id, examiner_id, marks_assigned, evaluation_date, remarks) VALUES
                ('AB2024001', '2024001001', 1, 1, 45, '2024-05-20', 'Good performance'),
                ('AB2024002', '2024001002', 2, 2, 48, '2024-05-30', 'Excellent')
                ON CONFLICT (answer_book_id) DO NOTHING
            `);
            console.log('Sample answer sheets inserted');
        }
    } catch (error) {
        console.error('Error inserting sample data:', error.message, error.stack);
    }
}
    static async getAllSchools() {
    try {
        const result = await pool.query('SELECT * FROM schools ORDER BY school_name');
        return result.rows;
    } catch (error) {
        console.error('Error fetching schools:', error.message, error.stack);
        throw error;
    }
}

    static async addSchool(schoolName, location) {
        const result = await pool.query(
            'INSERT INTO schools (school_name, location) VALUES ($1, $2) RETURNING *',
            [schoolName, location]
        );
        return result.rows[0];
    }

    // Subjects operations
   static async getAllSubjects() {
    try {
        const result = await pool.query('SELECT * FROM subjects ORDER BY subject_name');
        return result.rows;
    } catch (error) {
        console.error('Error fetching subjects:', error.message, error.stack);
        throw error;
    }
}

    static async addSubject(subjectName, subjectCode) {
        const result = await pool.query(
            'INSERT INTO subjects (subject_name, subject_code) VALUES ($1, $2) RETURNING *',
            [subjectName, subjectCode]
        );
        return result.rows[0];
    }

    // Examiners operations
    static async getAllExaminers() {
        const result = await pool.query('SELECT * FROM examiner_details ORDER BY examiner_name');
        return result.rows;
    } catch (error) {
        console.error('Error fetching Examiners:', error.message, error.stack);
        throw error;
    }

    static async addExaminer(examinerData) {
        const { examinerName, schoolId, qualification, subjectId, contactNumber, email, experienceYears } = examinerData;
        const result = await pool.query(
            `INSERT INTO examiners (examiner_name, school_id, qualification, subject_id, contact_number, email, experience_years) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [examinerName, schoolId, qualification, subjectId, contactNumber, email, experienceYears]
        );
        return result.rows[0];
    }

    static async getExaminersBySubject(subjectId) {
        const result = await pool.query(
            'SELECT * FROM examiner_details WHERE subject_id = $1',
            [subjectId]
        );
        return result.rows;
    }

    static async getExaminersBySchool(schoolId) {
        const result = await pool.query(
            'SELECT * FROM examiner_details WHERE school_id = $1',
            [schoolId]
        );
        return result.rows;
    }

    // Students operations
    static async getAllStudents() {
        const result = await pool.query(`
            SELECT s.*, sc.school_name, sc.location 
            FROM students s
            JOIN schools sc ON s.school_id = sc.school_id
            ORDER BY s.student_roll_number
        `);
        return result.rows;
    }

    static async addStudent(studentData) {
        const { studentRollNumber, studentName, schoolId, classStandard } = studentData;
        const result = await pool.query(
            'INSERT INTO students (student_roll_number, student_name, school_id, class_standard) VALUES ($1, $2, $3, $4) RETURNING *',
            [studentRollNumber, studentName, schoolId, classStandard || 10]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error fetching students:', error.message, error.stack);
        throw error;
    }

    // Answer sheets operations
    static async getAllAnswerSheets() {
        const result = await pool.query('SELECT * FROM evaluation_summary ORDER BY evaluation_date DESC');
        return result.rows;
    } catch (error) {
        console.error('Error fetching answer sheets:', error.message, error.stack);
        throw error;
    }

    static async addAnswerSheet(answerSheetData) {
    const { answerBookId, studentRollNumber, subjectId, examinerId, marksAssigned, evaluationDate, remarks } = answerSheetData;
    const result = await pool.query(
        `INSERT INTO answer_sheets (answer_book_id, student_roll_number, subject_id, examiner_id, marks_assigned, evaluation_date, remarks) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [answerBookId, studentRollNumber, subjectId, examinerId, marksAssigned, evaluationDate, remarks]
    );
    return result.rows[0];
}

static async getAnswerSheetsByExaminer(examinerId) {
    const result = await pool.query(
        'SELECT * FROM evaluation_summary WHERE examiner_id = $1',
        [examinerId]
    );
    return result.rows;
}

static async getAnswerSheetsByStudent(studentRollNumber) {
    const result = await pool.query(
        'SELECT * FROM evaluation_summary WHERE student_roll_number = $1',
        [studentRollNumber]
    );
    return result.rows;
}

static async updateAnswerSheetMarks(answerBookId, marksAssigned, remarks) {
    const result = await pool.query(
        'UPDATE answer_sheets SET marks_assigned = $1, remarks = $2, updated_at = CURRENT_TIMESTAMP WHERE answer_book_id = $3 RETURNING *',
        [marksAssigned, remarks, answerBookId]
    );
    return result.rows[0];
}

    // Invigilation operations
    static async getAllInvigilationAssignments() {
        const result = await pool.query('SELECT * FROM invigilation_schedule ORDER BY exam_date, exam_session');
        return result.rows;
    } catch (error) {
        console.error('Error fetching invigilation assignments:', error.message, error.stack);
        throw error;
    }

    static async addInvigilationAssignment(assignmentData) {
        const { examinerId, schoolId, examDate, examSession, subjectId } = assignmentData;
        const result = await pool.query(
            'INSERT INTO invigilation_assignments (examiner_id, school_id, exam_date, exam_session, subject_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [examinerId, schoolId, examDate, examSession, subjectId]
        );
        return result.rows[0];
    }

    static async getInvigilationByExaminer(examinerId) {
        const result = await pool.query(
            'SELECT * FROM invigilation_schedule WHERE examiner_id = $1',
            [examinerId]
        );
        return result.rows;
    }

    static async getInvigilationBySchool(schoolId) {
        const result = await pool.query(
            'SELECT * FROM invigilation_schedule WHERE school_id = $1',
            [schoolId]
        );
        return result.rows;
    }

    // Statistics and reports
    static async getEvaluationStatistics() {
        const result = await pool.query(`
            SELECT 
                e.examiner_name,
                COUNT(a.answer_book_id) as total_sheets_evaluated,
                AVG(a.marks_assigned) as average_marks_given,
                MIN(a.marks_assigned) as min_marks,
                MAX(a.marks_assigned) as max_marks
            FROM examiners e
            LEFT JOIN answer_sheets a ON e.examiner_id = a.examiner_id
            GROUP BY e.examiner_id, e.examiner_name
            ORDER BY total_sheets_evaluated DESC
        `);
        return result.rows;
    }

    static async getSubjectWiseStatistics() {
        const result = await pool.query(`
            SELECT 
                s.subject_name,
                COUNT(a.answer_book_id) as total_answer_sheets,
                AVG(a.marks_assigned) as average_marks,
                COUNT(DISTINCT a.examiner_id) as total_examiners
            FROM subjects s
            LEFT JOIN answer_sheets a ON s.subject_id = a.subject_id
            GROUP BY s.subject_id, s.subject_name
            ORDER BY total_answer_sheets DESC
        `);
        return result.rows;
    }

    static async getSchoolWiseStatistics() {
        const result = await pool.query(`
            SELECT 
                sc.school_name,
                sc.location,
                COUNT(DISTINCT e.examiner_id) as total_examiners,
                COUNT(DISTINCT st.student_id) as total_students,
                COUNT(DISTINCT ia.assignment_id) as total_invigilation_assignments
            FROM schools sc
            LEFT JOIN examiners e ON sc.school_id = e.school_id
            LEFT JOIN students st ON sc.school_id = st.school_id
            LEFT JOIN invigilation_assignments ia ON sc.school_id = ia.school_id
            GROUP BY sc.school_id, sc.school_name, sc.location
            ORDER BY total_examiners DESC
        `);
        return result.rows;
    }
    
    // User management operations
    static async createUser(userData) {
        const { username, email, password, role, examinerId, schoolId } = userData;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role, examiner_id, school_id) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, username, email, role`,
            [username, email, hashedPassword, role, examinerId, schoolId]
        );
        return result.rows[0];
    }

    static async getUserByUsername(username) {
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 AND is_active = true',
            [username]
        );
        return result.rows[0];
    }

    static async getUserByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        return result.rows[0];
    }

    static async updateLastLogin(userId) {
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
            [userId]
        );
    }

    static async getUserProfile(userId) {
        const result = await pool.query(`
            SELECT u.user_id, u.username, u.email, u.role, u.created_at, u.last_login,
                   e.examiner_name, e.qualification, e.experience_years,
                   s.school_name, s.location
            FROM users u
            LEFT JOIN examiners e ON u.examiner_id = e.examiner_id
            LEFT JOIN schools s ON u.school_id = s.school_id
            WHERE u.user_id = $1
        `, [userId]);
        return result.rows[0];
    }
}

// Initialize database function
const initializeDatabase = async () => {
    try {
        await CBSEDatabase.createAllTables();
        console.log('All database tables created/verified');
        
        await CBSEDatabase.insertSampleData();
        
        const adminExists = await CBSEDatabase.getUserByUsername('admin');
        if (!adminExists) {
            await CBSEDatabase.createUser({
                username: 'admin',
                email: 'admin@cbse.edu.in',
                password: 'admin123',
                role: 'admin',
                examinerId: null, 
                schoolId: null    
            });
            console.log('Default admin user created: admin/admin123');
        }
    } catch (error) {
        console.error('Database initialization error:', error.message, error.stack);
        throw error;
    }
};

// API Routes
// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, role, examinerId, schoolId } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const existingUser = await CBSEDatabase.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const existingEmail = await CBSEDatabase.getUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        let finalExaminerId = examinerId;
        if (role === 'examiner' && !examinerId) {
            // Create a new examiner entry
            const examinerData = {
                examinerName: username, // Use username as examiner name for now
                schoolId: schoolId || 1, // Default to school_id 1 if not provided
                qualification: 'Not specified',
                subjectId: 1, // Default to Mathematics
                contactNumber: null,
                email: email,
                experienceYears: 0
            };
            const newExaminer = await CBSEDatabase.addExaminer(examinerData);
            finalExaminerId = newExaminer.examiner_id;
        }

        const user = await CBSEDatabase.createUser({
            username,
            email,
            password,
            role: role || 'examiner',
            examinerId: finalExaminerId,
            schoolId
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error.message, error.stack);
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Get user from database
        const user = await CBSEDatabase.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await CBSEDatabase.updateLastLogin(user.user_id);

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                username: user.username,
                role: user.role,
                examinerId: user.examiner_id,
                schoolId: user.school_id
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set session
        req.session.userId = user.user_id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role,
                examinerId: user.examiner_id,
                schoolId: user.school_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
        const profile = await CBSEDatabase.getUserProfile(req.user.userId);
        res.json(profile);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: {
            id: req.user.userId,
            username: req.user.username,
            role: req.user.role
        }
    });
});

// Dashboard
app.get('/api/dashboard', async (req, res) => {
    try {
        const [
            totalSchools,
            totalSubjects,
            totalExaminers,
            totalStudents,
            totalAnswerSheets,
            totalInvigilationAssignments,
            evaluationStats,
            subjectStats,
            schoolStats
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM schools'),
            pool.query('SELECT COUNT(*) FROM subjects'),
            pool.query('SELECT COUNT(*) FROM examiners'),
            pool.query('SELECT COUNT(*) FROM students'),
            pool.query('SELECT COUNT(*) FROM answer_sheets'),
            pool.query('SELECT COUNT(*) FROM invigilation_assignments'),
            CBSEDatabase.getEvaluationStatistics(),
            CBSEDatabase.getSubjectWiseStatistics(),
            CBSEDatabase.getSchoolWiseStatistics()
        ]);

        res.json({
            counts: {
                schools: parseInt(totalSchools.rows[0].count),
                subjects: parseInt(totalSubjects.rows[0].count),
                examiners: parseInt(totalExaminers.rows[0].count),
                students: parseInt(totalStudents.rows[0].count),
                answerSheets: parseInt(totalAnswerSheets.rows[0].count),
                invigilationAssignments: parseInt(totalInvigilationAssignments.rows[0].count)
            },
            evaluationStats,
            subjectStats,
            schoolStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Schools routes
app.get('/api/schools', authenticateToken, async (req, res) => {
    try {
        const schools = await CBSEDatabase.getAllSchools();
        res.json(schools);
    } catch (err) {
        console.error('Error fetching schools:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/schools', authenticateToken, authorizeRole(['admin', 'coordinator']), validateRequest(['school_name', 'location']), async (req, res) => {
    try {
        const { school_name, location, contact_number, email, principal_name } = req.body;
        
        const result = await pool.query(
            `INSERT INTO schools (school_name, location, contact_number, email, principal_name) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [school_name, location, contact_number, email, principal_name]
        );
        
        res.status(201).json({
            success: true,
            message: 'School added successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error adding school:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add school',
            details: err.message 
        });
    }
});

//Update school
app.put('/api/schools/:id', authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { school_name, location, contact_number, email, principal_name } = req.body;
        
        const result = await pool.query(
            `UPDATE schools SET 
                school_name = $1, location = $2, contact_number = $3, 
                email = $4, principal_name = $5
             WHERE school_id = $6 RETURNING *`,
            [school_name, location, contact_number, email, principal_name, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'School not found' });
        }
        
        res.json({
            success: true,
            message: 'School updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete school
app.delete('/api/schools/:id', authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM schools WHERE school_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'School not found' });
        }
        
        res.json({
            success: true,
            message: 'School deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Subjects routes
app.get('/api/subjects', authenticateToken, async (req, res) => {
    try {
        const subjects = await CBSEDatabase.getAllSubjects();
        res.json(subjects);
    } catch (err) {
        console.error('Error fetching subjects:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

// 3. Enhanced Subjects routes
app.post('/api/subjects', authenticateToken, authorizeRole(['admin', 'coordinator']), validateRequest(['subject_name', 'subject_code']), async (req, res) => {
    try {
        const { subject_name, subject_code, max_marks } = req.body;
        
        const result = await pool.query(
            'INSERT INTO subjects (subject_name, subject_code, max_marks) VALUES ($1, $2, $3) RETURNING *',
            [subject_name, subject_code, max_marks || 100]
        );
        
        res.status(201).json({
            success: true,
            message: 'Subject added successfully',
            data: result.rows[0]
        });
    } catch (err) {
        if (err.code === '23505') { 
            res.status(400).json({ 
                success: false, 
                error: 'Subject code already exists' 
            });
        } else {
            res.status(500).json({ success: false, error: err.message });
        }
    }
});

// Update subject
app.put('/api/subjects/:id', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { subject_name, subject_code, max_marks } = req.body;
        
        const result = await pool.query(
            `UPDATE subjects SET 
                subject_name = $1, subject_code = $2, max_marks = $3
             WHERE subject_id = $4 RETURNING *`,
            [subject_name, subject_code, max_marks, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Subject not found' });
        }
        
        res.json({
            success: true,
            message: 'Subject updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete subject
app.delete('/api/subjects/:id', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM subjects WHERE subject_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Subject not found' });
        }
        
        res.json({
            success: true,
            message: 'Subject deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Examiners routes
app.get('/api/examiners', authenticateToken, async (req, res) => {
    try {
        const examiners = await CBSEDatabase.getAllExaminers();
        res.json(examiners);
    } catch (err) {
        console.error('Error fetching examiners:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

// 4. Enhanced Examiners routes
app.post('/api/examiners', authenticateToken, authorizeRole(['admin', 'coordinator']), validateRequest(['examinerName', 'schoolId', 'subjectId']), async (req, res) => {
    try {
        const examinerData = {
            examinerName: req.body.examinerName,
            schoolId: req.body.schoolId,
            qualification: req.body.qualification,
            subjectId: req.body.subjectId,
            contactNumber: req.body.contactNumber,
            email: req.body.email,
            experienceYears: req.body.experienceYears
        };
        
        const examiner = await CBSEDatabase.addExaminer(examinerData);
        
        res.status(201).json({
            success: true,
            message: 'Examiner added successfully',
            data: examiner
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update examiner
app.put('/api/examiners/:id', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { id } = req.params;
        const { examinerName, schoolId, qualification, subjectId, contactNumber, email, experienceYears } = req.body;
        
        const result = await pool.query(
            `UPDATE examiners SET 
                examiner_name = $1, school_id = $2, qualification = $3, 
                subject_id = $4, contact_number = $5, email = $6, experience_years = $7
             WHERE examiner_id = $8 RETURNING *`,
            [examinerName, schoolId, qualification, subjectId, contactNumber, email, experienceYears, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Examiner not found' });
        }
        
        res.json({
            success: true,
            message: 'Examiner updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete examiner
app.delete('/api/examiners/:id', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM examiners WHERE examiner_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Examiner not found' });
        }
        
        res.json({
            success: true,
            message: 'Examiner deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/examiners/subject/:subjectId', async (req, res) => {
    try {
        const examiners = await CBSEDatabase.getExaminersBySubject(req.params.subjectId);
        res.json(examiners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Students routes
app.get('/api/students', authenticateToken, async (req, res) => {
    try {
        const students = await CBSEDatabase.getAllStudents();
        res.json(students);
    } catch (err) {
        console.error('Error fetching students:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

// Enhanced Students routes
app.post('/api/students', authenticateToken, authorizeRole(['admin', 'coordinator']), validateRequest(['studentRollNumber', 'studentName', 'schoolId']), async (req, res) => {
    try {
        const studentData = {
            studentRollNumber: req.body.studentRollNumber,
            studentName: req.body.studentName,
            schoolId: req.body.schoolId,
            classStandard: req.body.classStandard || 10
        };
        
        const student = await CBSEDatabase.addStudent(studentData);
        
        res.status(201).json({
            success: true,
            message: 'Student added successfully',
            data: student
        });
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ 
                success: false, 
                error: 'Student roll number already exists' 
            });
        } else {
            res.status(500).json({ success: false, error: err.message });
        }
    }
});

// Update student
app.put('/api/students/:rollNumber', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const { studentName, schoolId, classStandard } = req.body;
        
        const result = await pool.query(
            `UPDATE students SET 
                student_name = $1, school_id = $2, class_standard = $3
             WHERE student_roll_number = $4 RETURNING *`,
            [studentName, schoolId, classStandard, rollNumber]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }
        
        res.json({
            success: true,
            message: 'Student updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.delete('/api/students/:rollNumber', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const result = await pool.query('DELETE FROM students WHERE student_roll_number = $1 RETURNING *', [rollNumber]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }
        
        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Answer sheets routes
app.get('/api/answer-sheets', authenticateToken, async (req, res) => {
    try {
        let answerSheets;
        if (req.user.role === 'examiner') {
            if (!req.user.examinerId) {
                return res.status(400).json({ error: 'Examiner ID not associated with this user' });
            }
            answerSheets = await CBSEDatabase.getAnswerSheetsByExaminer(req.user.examinerId);
        } else {
            answerSheets = await CBSEDatabase.getAllAnswerSheets();
        }
        res.json(answerSheets);
    } catch (err) {
        console.error('Error fetching answer sheets:', err.message, err.stack);
        res.status(500).json({ error: 'Failed to fetch answer sheets', details: err.message });
    }
});

// Enhanced Answer Sheets routes
app.post('/api/answer-sheets', authenticateToken, authorizeRole(['admin', 'coordinator']), validateRequest(['answerBookId', 'studentRollNumber', 'subjectId', 'examinerId']), async (req, res) => {
    try {
        const answerSheetData = {
            answerBookId: req.body.answerBookId,
            studentRollNumber: req.body.studentRollNumber,
            subjectId: req.body.subjectId,
            examinerId: req.body.examinerId,
            marksAssigned: req.body.marksAssigned,
            evaluationDate: req.body.evaluationDate || new Date().toISOString().split('T')[0],
            remarks: req.body.remarks
        };
        
        const answerSheet = await CBSEDatabase.addAnswerSheet(answerSheetData);
        
        res.status(201).json({
            success: true,
            message: 'Answer sheet added successfully',
            data: answerSheet
        });
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ 
                success: false, 
                error: 'Answer book ID already exists' 
            });
        } else {
            res.status(500).json({ success: false, error: err.message });
        }
    }
});

app.delete('/api/answer-sheets/:answerBookId', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { answerBookId } = req.params;
        const result = await pool.query('DELETE FROM answer_sheets WHERE answer_book_id = $1 RETURNING *', [answerBookId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Answer sheet not found' });
        }
        
        res.json({
            success: true,
            message: 'Answer sheet deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/answer-sheets/examiner/:examinerId', async (req, res) => {
    try {
        const answerSheets = await CBSEDatabase.getAnswerSheetsByExaminer(req.params.examinerId);
        res.json(answerSheets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/answer-sheets/:answerBookId', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { marks_assigned, remarks } = req.body;
        const answerSheet = await CBSEDatabase.updateAnswerSheetMarks(req.params.answerBookId, marks_assigned, remarks);
        res.json(answerSheet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Invigilation routes
app.get('/api/invigilation', authenticateToken, async (req, res) => {
    try {
        const assignments = await CBSEDatabase.getAllInvigilationAssignments();
        res.json(assignments);
    } catch (err) {
        console.error('Error fetching invigilation:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

// Enhanced Invigilation routes
app.post('/api/invigilation', authenticateToken, authorizeRole(['admin', 'coordinator']), validateRequest(['examinerId', 'schoolId', 'examDate', 'examSession']), async (req, res) => {
    try {
        const assignmentData = {
            examinerId: req.body.examinerId,
            schoolId: req.body.schoolId,
            examDate: req.body.examDate,
            examSession: req.body.examSession,
            subjectId: req.body.subjectId
        };
        
        const assignment = await CBSEDatabase.addInvigilationAssignment(assignmentData);
        
        res.status(201).json({
            success: true,
            message: 'Invigilation assignment added successfully',
            data: assignment
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update invigilation assignment
// Update invigilation assignment
app.put('/api/invigilation/:id', authenticateToken, authorizeRole(['admin', 'coordinator']), validateRequest(['examinerId', 'schoolId', 'examDate', 'examSession', 'subjectId']), async (req, res) => {
    try {
        const { id } = req.params;
        const { examinerId, schoolId, examDate, examSession, subjectId } = req.body;

        // Additional validation for examDate format
        if (!isValidDate(examDate)) {
            return res.status(400).json({ success: false, error: 'Invalid exam date format. Use YYYY-MM-DD.' });
        }

        const examinerCheck = await pool.query('SELECT 1 FROM examiners WHERE examiner_id = $1', [examinerId]);
        if (examinerCheck.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid examiner ID' });
        }

        const schoolCheck = await pool.query('SELECT 1 FROM schools WHERE school_id = $1', [schoolId]);
        if (schoolCheck.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid school ID' });
        }

        const subjectCheck = await pool.query('SELECT 1 FROM subjects WHERE subject_id = $1', [subjectId]);
        if (subjectCheck.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Invalid subject ID' });
        }

        const result = await pool.query(
            `UPDATE invigilation_assignments SET 
                examiner_id = $1, school_id = $2, exam_date = $3, 
                exam_session = $4, subject_id = $5
             WHERE assignment_id = $6 RETURNING *`,
            [examinerId, schoolId, examDate, examSession, subjectId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Assignment not found' });
        }

        res.json({
            success: true,
            message: 'Invigilation assignment updated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating invigilation assignment:', err.message, err.stack);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Delete invigilation assignment
app.delete('/api/invigilation/:id', authenticateToken, authorizeRole(['admin', 'coordinator']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM invigilation_assignments WHERE assignment_id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Assignment not found' });
        }
        
        res.json({
            success: true,
            message: 'Invigilation assignment deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Statistics routes
app.get('/api/statistics/evaluation', authenticateToken, async (req, res) => {
    try {
        const stats = await CBSEDatabase.getEvaluationStatistics();
        res.json(stats);
    } catch (err) {
        console.error('Error fetching evaluation statistics:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/statistics/subjects', authenticateToken, async (req, res) => {
    try {
        const stats = await CBSEDatabase.getSubjectWiseStatistics();
        res.json(stats);
    } catch (err) {
        console.error('Error fetching evaluation statistics:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/statistics/schools', authenticateToken, async (req, res) => {
    try {
        const stats = await CBSEDatabase.getSchoolWiseStatistics();
        res.json(stats);
    } catch (err) {
        console.error('Error fetching school statistics:', err.message, err.stack);
        res.status(500).json({ error: err.message });
    }
});
// Search and filter endpoints
app.get('/api/search/examiners', async (req, res) => {
    try {
        const { school, subject, experience } = req.query;
        let query = 'SELECT * FROM examiner_details WHERE 1=1';
        let params = [];
        let paramCount = 0;

        if (school) {
            paramCount++;
            query += ` AND school_id = $${paramCount}`;
            params.push(school);
        }

        if (subject) {
            paramCount++;
            query += ` AND subject_id = $${paramCount}`;
            params.push(subject);
        }

        if (experience) {
            paramCount++;
            query += ` AND experience_years >= $${paramCount}`;
            params.push(experience);
        }

        query += ' ORDER BY examiner_name';

        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Search students
app.get('/api/search/students', async (req, res) => {
    try {
        const { school, class: classStandard, rollNumber } = req.query;
        let query = `
            SELECT s.*, sc.school_name, sc.location 
            FROM students s
            JOIN schools sc ON s.school_id = sc.school_id
            WHERE 1=1
        `;
        let params = [];
        let paramCount = 0;

        if (school) {
            paramCount++;
            query += ` AND s.school_id = $${paramCount}`;
            params.push(school);
        }

        if (classStandard) {
            paramCount++;
            query += ` AND s.class_standard = $${paramCount}`;
            params.push(classStandard);
        }

        if (rollNumber) {
            paramCount++;
            query += ` AND s.student_roll_number ILIKE $${paramCount}`;
            params.push(`%${rollNumber}%`);
        }

        query += ' ORDER BY s.student_roll_number';

        const result = await pool.query(query, params);
        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Bulk operations
app.post('/api/bulk/students', async (req, res) => {
    try {
        const { students } = req.body; // Array of student objects
        const results = [];
        
        for (const studentData of students) {
            try {
                const student = await CBSEDatabase.addStudent(studentData);
                results.push({ success: true, data: student });
            } catch (err) {
                results.push({ 
                    success: false, 
                    error: err.message, 
                    rollNumber: studentData.studentRollNumber 
                });
            }
        }
        
        res.json({
            success: true,
            message: 'Bulk operation completed',
            results
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Data export endpoints
app.get('/api/export/schools', async (req, res) => {
    try {
        const schools = await CBSEDatabase.getAllSchools();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="schools.json"');
        res.json(schools);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/export/examiners', async (req, res) => {
    try {
        const examiners = await CBSEDatabase.getAllExaminers();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="examiners.json"');
        res.json(examiners);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get single record endpoints
app.get('/api/schools/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM schools WHERE school_id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'School not found' });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/examiners/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM examiner_details WHERE examiner_id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Examiner not found' });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/students/:rollNumber', async (req, res) => {
    try {
        const { rollNumber } = req.params;
        const result = await pool.query(`
            SELECT s.*, sc.school_name, sc.location 
            FROM students s
            JOIN schools sc ON s.school_id = sc.school_id
            WHERE s.student_roll_number = $1
        `, [rollNumber]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Student not found' });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Additional middleware for CORS and error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl
    });
});

console.log('Enhanced API endpoints loaded successfully');

// Example usage functions
class CBSEOperations {
    static async demonstrateOperations() {
        console.log('=== CBSE Database Operations Demo ===\n');

        try {
            // Get all schools
            console.log('1. All Schools:');
            const schools = await CBSEDatabase.getAllSchools();
            console.table(schools);

            // Get all examiners with details
            console.log('\n2. All Examiners with Details:');
            const examiners = await CBSEDatabase.getAllExaminers();
            console.table(examiners);

            // Get evaluation statistics
            console.log('\n3. Evaluation Statistics:');
            const evalStats = await CBSEDatabase.getEvaluationStatistics();
            console.table(evalStats);

            // Get subject-wise statistics
            console.log('\n4. Subject-wise Statistics:');
            const subjectStats = await CBSEDatabase.getSubjectWiseStatistics();
            console.table(subjectStats);

            // Get invigilation schedule
            console.log('\n5. Invigilation Schedule:');
            const invigilationSchedule = await CBSEDatabase.getAllInvigilationAssignments();
            console.table(invigilationSchedule);

        } catch (error) {
            console.error('Error in demonstration:', error);
        }
    }

    // Add a new examiner
    static async addNewExaminer(examinerData) {
        try {
            const newExaminer = await CBSEDatabase.addExaminer(examinerData);
            console.log('New examiner added:', newExaminer);
            return newExaminer;
        } catch (error) {
            console.error('Error adding examiner:', error);
            throw error;
        }
    }

    // Assign marks to answer sheet
    static async evaluateAnswerSheet(answerSheetData) {
        try {
            const evaluation = await CBSEDatabase.addAnswerSheet(answerSheetData);
            console.log('Answer sheet evaluated:', evaluation);
            return evaluation;
        } catch (error) {
            console.error('Error evaluating answer sheet:', error);
            throw error;
        }
    }

    // Schedule invigilation
    static async scheduleInvigilation(assignmentData) {
        try {
            const assignment = await CBSEDatabase.addInvigilationAssignment(assignmentData);
            console.log('Invigilation scheduled:', assignment);
            return assignment;
        } catch (error) {
            console.error('Error scheduling invigilation:', error);
            throw error;
        }
    }
}

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`CBSE Database Server running on port ${PORT}`);
    await testConnection();
    await initializeDatabase();

});

// Export for use in other modules
module.exports = {
    pool,
    CBSEDatabase,
    CBSEOperations,
    app,
    authenticateToken,
    authorizeRole
};

