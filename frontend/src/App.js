import React, { useState, useEffect } from 'react';
import { 
  Users, 
  School, 
  BookOpen, 
  FileText, 
  Calendar, 
  BarChart3, 
  Plus, 
  Search,
  Edit,
  Eye,
  Filter,
  Download,
  GraduationCap,
  UserCheck,
  ClipboardList
} from 'lucide-react';

const CBSEManagementSystem = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState({
    schools: [],
    subjects: [],
    examiners: [],
    students: [],
    answerSheets: [],
    invigilation: [],
    statistics: {
      evaluation: [],
      subjects: [],
      schools: []
    }
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({});

  // API base URL - update this to match your backend
  const API_BASE = 'http://localhost:3000/api';

  // Fetch data functions
  const fetchData = async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      return [];
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [schools, subjects, examiners, students, answerSheets, invigilation, evalStats, subjectStats, schoolStats] = await Promise.all([
        fetchData('schools'),
        fetchData('subjects'),
        fetchData('examiners'),
        fetchData('students'),
        fetchData('answer-sheets'),
        fetchData('invigilation'),
        fetchData('statistics/evaluation'),
        fetchData('statistics/subjects'),
        fetchData('statistics/schools')
      ]);

      setData({
        schools,
        subjects,
        examiners,
        students,
        answerSheets,
        invigilation,
        statistics: {
          evaluation: evalStats,
          subjects: subjectStats,
          schools: schoolStats
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (endpoint, data, method = 'POST') => {
    try {
      const response = await fetch(`${API_BASE}/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        await loadData();
        setShowModal(false);
        setFormData({});
      }
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };

  const openModal = (type, data = {}) => {
    setModalType(type);
    setFormData(data);
    setShowModal(true);
  };

  // Dashboard Component
const Dashboard = () => {
  const [data, setData] = useState({
    schools: [],
    examiners: [],
    students: [],
    answerSheets: [],
    statistics: {
      subjects: [],
      evaluation: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/dashboard');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const dashboardData = await response.json();
      console.log('Dashboard data:', dashboardData); // Debug log
      setData(dashboardData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
        <button 
          onClick={fetchDashboardData}
          className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Schools</p>
              <p className="text-3xl font-bold">{data.schools?.length || 0}</p>
            </div>
            <School className="h-12 w-12 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Examiners</p>
              <p className="text-3xl font-bold">{data.examiners?.length || 0}</p>
            </div>
            <Users className="h-12 w-12 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Students</p>
              <p className="text-3xl font-bold">{data.students?.length || 0}</p>
            </div>
            <GraduationCap className="h-12 w-12 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Answer Sheets</p>
              <p className="text-3xl font-bold">{data.answerSheets?.length || 0}</p>
            </div>
            <FileText className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2" />
            Subject-wise Statistics
          </h3>
          <div className="space-y-3">
            {data.statistics?.subjects?.length > 0 ? (
              data.statistics.subjects.slice(0, 5).map((subject, index) => (
                <div key={subject.subject_name || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{subject.subject_name}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{subject.total_answer_sheets || 0} sheets</div>
                    <div className="text-sm font-semibold">Avg: {parseFloat(subject.average_marks || 0).toFixed(1)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No subject statistics available</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="mr-2" />
            Top Examiners
          </h3>
          <div className="space-y-3">
            {data.statistics?.evaluation?.length > 0 ? (
              data.statistics.evaluation.slice(0, 5).map((examiner, index) => (
                <div key={examiner.examiner_name || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{examiner.examiner_name}</span>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{examiner.total_sheets_evaluated || 0} sheets</div>
                    <div className="text-sm font-semibold">Avg: {parseFloat(examiner.average_marks_given || 0).toFixed(1)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No examiner statistics available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


  // Schools Component
  const Schools = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Schools Management</h2>
        <button
          onClick={() => openModal('school')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add School
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.schools.map((school) => (
                <tr key={school.school_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{school.school_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{school.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Examiners Component
  const Examiners = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Examiners Management</h2>
        <button
          onClick={() => openModal('examiner')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Examiner
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.examiners.map((examiner) => (
                <tr key={examiner.examiner_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{examiner.examiner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{examiner.school_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{examiner.subject_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{examiner.experience_years} years</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{examiner.contact_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Answer Sheets Component
  const AnswerSheets = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Answer Sheets Evaluation</h2>
        <button
          onClick={() => openModal('answerSheet')}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Evaluation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer Book ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Examiner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.answerSheets.slice(0, 10).map((sheet, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{sheet.answer_book_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sheet.student_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sheet.subject_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{sheet.examiner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {sheet.marks_assigned}/100
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(sheet.evaluation_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-800">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Modal Component
  const Modal = () => {
    if (!showModal) return null;

    const handleInputChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = () => {
      
      switch (modalType) {
        case 'school':
          handleSubmit('schools', formData);
          break;
        case 'examiner':
          handleSubmit('examiners', formData);
          break;
        case 'answerSheet':
          handleSubmit('answer-sheets', formData);
          break;
        default:
          break;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {modalType === 'school' && 'Add New School'}
              {modalType === 'examiner' && 'Add New Examiner'}
              {modalType === 'answerSheet' && 'Add Answer Sheet Evaluation'}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {modalType === 'school' && (
              <>
                <input
                  type="text"
                  name="school_name"
                  placeholder="School Name"
                  value={formData.school_name || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </>
            )}

            {modalType === 'examiner' && (
              <>
                <input
                  type="text"
                  name="examinerName"
                  placeholder="Examiner Name"
                  value={formData.examinerName || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <select
                  name="schoolId"
                  value={formData.schoolId || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select School</option>
                  {data.schools.map(school => (
                    <option key={school.school_id} value={school.school_id}>
                      {school.school_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="qualification"
                  placeholder="Qualification"
                  value={formData.qualification || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'examiners', label: 'Examiners', icon: Users },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'answerSheets', label: 'Answer Sheets', icon: FileText },
    { id: 'invigilation', label: 'Invigilation', icon: UserCheck },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CBSE Board Exams Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-800">
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && (
            <>
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'schools' && <Schools />}
              {activeTab === 'examiners' && <Examiners />}
              {activeTab === 'answerSheets' && <AnswerSheets />}
              {activeTab === 'students' && (
                <div className="text-center py-12">
                  <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">Students management coming soon...</p>
                </div>
              )}
              {activeTab === 'invigilation' && (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">Invigilation management coming soon...</p>
                </div>
              )}
              {activeTab === 'subjects' && (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">Subjects management coming soon...</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <Modal />
    </div>
  );
};

export default CBSEManagementSystem;