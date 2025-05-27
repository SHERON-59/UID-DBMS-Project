// CBSE Board Exams Database Application
// Requires: pg (node-postgres), express, cors, dotenv

const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

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
    // Schools operations
    static async getAllSchools() {
        const result = await pool.query('SELECT * FROM schools ORDER BY school_name');
        return result.rows;
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
        const result = await pool.query('SELECT * FROM subjects ORDER BY subject_name');
        return result.rows;
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
    }

    // Answer sheets operations
    static async getAllAnswerSheets() {
        const result = await pool.query('SELECT * FROM evaluation_summary ORDER BY evaluation_date DESC');
        return result.rows;
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
}

// API Routes

// Schools routes
app.get('/api/schools', async (req, res) => {
    try {
        const schools = await CBSEDatabase.getAllSchools();
        res.json(schools);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/schools', async (req, res) => {
    try {
        const { school_name, location } = req.body;
        const school = await CBSEDatabase.addSchool(school_name, location);
        res.status(201).json(school);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Subjects routes
app.get('/api/subjects', async (req, res) => {
    try {
        const subjects = await CBSEDatabase.getAllSubjects();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/subjects', async (req, res) => {
    try {
        const { subject_name, subject_code } = req.body;
        const subject = await CBSEDatabase.addSubject(subject_name, subject_code);
        res.status(201).json(subject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Examiners routes
app.get('/api/examiners', async (req, res) => {
    try {
        const examiners = await CBSEDatabase.getAllExaminers();
        res.json(examiners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/examiners', async (req, res) => {
    try {
        const examiner = await CBSEDatabase.addExaminer(req.body);
        res.status(201).json(examiner);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
app.get('/api/students', async (req, res) => {
    try {
        const students = await CBSEDatabase.getAllStudents();
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/students', async (req, res) => {
    try {
        const student = await CBSEDatabase.addStudent(req.body);
        res.status(201).json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Answer sheets routes
app.get('/api/answer-sheets', async (req, res) => {
    try {
        const answerSheets = await CBSEDatabase.getAllAnswerSheets();
        res.json(answerSheets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/answer-sheets', async (req, res) => {
    try {
        const answerSheet = await CBSEDatabase.addAnswerSheet(req.body);
        res.status(201).json(answerSheet);
    } catch (err) {
        res.status(500).json({ error: err.message });
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

app.put('/api/answer-sheets/:answerBookId', async (req, res) => {
    try {
        const { marks_assigned, remarks } = req.body;
        const answerSheet = await CBSEDatabase.updateAnswerSheetMarks(req.params.answerBookId, marks_assigned, remarks);
        res.json(answerSheet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Invigilation routes
app.get('/api/invigilation', async (req, res) => {
    try {
        const assignments = await CBSEDatabase.getAllInvigilationAssignments();
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invigilation', async (req, res) => {
    try {
        const assignment = await CBSEDatabase.addInvigilationAssignment(req.body);
        res.status(201).json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Statistics routes
app.get('/api/statistics/evaluation', async (req, res) => {
    try {
        const stats = await CBSEDatabase.getEvaluationStatistics();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/statistics/subjects', async (req, res) => {
    try {
        const stats = await CBSEDatabase.getSubjectWiseStatistics();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/statistics/schools', async (req, res) => {
    try {
        const stats = await CBSEDatabase.getSchoolWiseStatistics();
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add this comprehensive dashboard endpoint to your backend.js file
// Replace the existing dashboard endpoint with this one

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
    
    // Uncomment to run demonstration
    // await CBSEOperations.demonstrateOperations();
});

// Export for use in other modules
module.exports = {
    pool,
    CBSEDatabase,
    CBSEOperations,
    app
};

// Example of how to use the system:
/*
// Adding a new examiner
const newExaminerData = {
    examinerName: 'Dr. Neha Agarwal',
    schoolId: 2,
    qualification: 'M.Sc Chemistry, Ph.D',
    subjectId: 2,
    contactNumber: '9876543220',
    email: 'neha.agarwal@email.com',
    experienceYears: 14
};

// Evaluating an answer sheet
const answerSheetData = {
    answerBookId: 'AB2024004001C',
    studentRollNumber: '2024001001',
    subjectId: 2,
    examinerId: 7, // New examiner's ID
    marksAssigned: 89,
    evaluationDate: '2024-04-20',
    remarks: 'Excellent understanding of chemical concepts'
};

// Scheduling invigilation
const invigilationData = {
    examinerId: 7,
    schoolId: 3,
    examDate: '2024-03-25',
    examSession: 'Morning',
    subjectId: 2
};
*/