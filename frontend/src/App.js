import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
  ClipboardList,
  LogOut,
  Lock,
  User,
} from 'lucide-react';

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const API_BASE = 'http://localhost:3000/api';

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
    } else {
      logout();
      // Notify user
      alert('Your session has expired. Please log in again.');
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    logout();
    alert('Failed to verify session. Please log in again.');
  } finally {
    setLoading(false);
  }
};

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
  try {
    const { username, password, email, role, schoolId, examinerId } = userData; // Proper destructuring

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Registration failed' };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred' };
  }
};

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'examiner'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async () => {
  setLoading(true);
  setError('');

  if (!formData.username.trim()) {
    setError('Username is required');
    setLoading(false);
    return;
  }

  if (!isLogin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    setError('Invalid email format');
    setLoading(false);
    return;
  }

  if (formData.password.length < 6) {
    setError('Password must be at least 6 characters long');
    setLoading(false);
    return;
  } 

    try {
    if (isLogin) {
      const result = await login(formData.username, formData.password);
      if (!result.success) {
        setError(result.error);
      }
    } else {
      const result = await register(formData);
      if (result.success) {
        setIsLogin(true);
        setFormData({ username: '', password: '', email: '', role: 'examiner' });
        setError('Registration successful! Please login.');
      } else {
        setError(result.error);
      }
    }
  } catch (error) {
    setError('An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CBSE Management</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="examiner">Examiner</option>
                <option value="admin">Admin</option>
                <option value="coordinator">Coordinator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ username: '', password: '', email: '', role: 'examiner' });
            }}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium">Demo Credentials:</p>
            <p>Username: admin</p>
            <p>Password: admin123</p>
          </div>
        )}
      </div>
    </div>
  );
};




// Main CBSE Management System Component
const CBSEManagementSystem = () => {
  const { user, logout, getAuthHeaders } = useAuth();
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
  const [tabLoading, setTabLoading] = useState({
  schools: false,
  examiners: false,
  students: false,
  answerSheets: false,  
  invigilation: false,
  subjects: false
}); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({
  assignment_id: null,
  examinerId: null,
  schoolId: null,
  examDate: '',
  examSession: '',
  subjectId: null,
  schoolName: '',
  location: ''
});

  const API_BASE = 'http://localhost:3000/api';

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Fetch data functions with authentication
  const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}`);
    }
    const result = await response.json();
    return Array.isArray(result) ? result : []; // Ensure array return
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return []; // Fallback to empty array
  }
};

  const loadData = async () => {
  setLoading(true);
  setTabLoading({
    schools: true,
    examiners: true,
    students: true,
    answerSheets: true,
    invigilation: true,
    subjects: true,
  });
  try {
    const [schools, subjects, examiners, students, answerSheets, invigilation, evalStats, subjectStats, schoolStats] = await Promise.all([
      fetchData('schools').then(data => { setTabLoading(prev => ({ ...prev, schools: false })); return data || []; }),
      fetchData('subjects').then(data => { setTabLoading(prev => ({ ...prev, subjects: false })); return data || []; }),
      fetchData('examiners').then(data => { setTabLoading(prev => ({ ...prev, examiners: false })); return data || []; }),
      fetchData('students').then(data => { setTabLoading(prev => ({ ...prev, students: false })); return data || []; }),
      fetchData('answer-sheets').then(data => { setTabLoading(prev => ({ ...prev, answerSheets: false })); return data || []; }),
      fetchData('invigilation').then(data => { setTabLoading(prev => ({ ...prev, invigilation: false })); return data || []; }),
      fetchData('statistics/evaluation').then(data => data || []),
      fetchData('statistics/subjects').then(data => data || []),
      fetchData('statistics/schools').then(data => data || []),
    ]);

    setData(prevData => ({
      schools: schools || prevData.schools,
      subjects: subjects || prevData.subjects,
      examiners: examiners || prevData.examiners,
      students: students || prevData.students,
      answerSheets: answerSheets || prevData.answerSheets,
      invigilation: invigilation || prevData.invigilation,
      statistics: {
        evaluation: evalStats || prevData.statistics.evaluation,
        subjects: subjectStats || prevData.statistics.subjects,
        schools: schoolStats || prevData.statistics.schools,
      },
    }));
  } catch (error) {
    console.error('Error loading data:', error);
    setError('Failed to load data. Please try again.');
    setTabLoading({
      schools: false,
      examiners: false,
      students: false,
      answerSheets: false,
      invigilation: false,
      subjects: false,
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const [error, setError] = useState('');
const handleSubmit = async (endpoint, data, method = 'POST') => {
  try {
    const payload = {
      ...data,
      examinerId: data.examinerId ? parseInt(data.examinerId) : null,
      schoolId: data.schoolId ? parseInt(data.schoolId) : null,
      subjectId: data.subjectId ? parseInt(data.subjectId) : null,
      assignment_id: data.assignment_id ? parseInt(data.assignment_id) : null
    };
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.error || 'Failed to submit data');
      return;
    }
    await loadData();
    setShowModal(false);
    setFormData({
      assignment_id: null,
      examinerId: null,
      schoolId: null,
      examDate: '',
      examSession: '',
      subjectId: null
    });
    setError('');
  } catch (error) {
    console.error('Error submitting data:', error);
    setError('An unexpected error occurred');
  }
};

  const openModal = (type, data = {}) => {
  setModalType(type);
  setFormData({
    assignment_id: data.assignment_id || null,
    examinerId: data.examiner_id || null,
    schoolId: data.school_id || null,
    examDate: data.exam_date || '',
    examSession: data.exam_session || '',
    subjectId: data.subject_id || null
  });
  setShowModal(true);
};

const renderModal = () => {
    if (!showModal) return null;
    
    if (modalType === 'school') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Add School</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit('schools', { school_name: formData.schoolName, location: formData.location }, 'POST')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modalType === 'invigilation') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {formData.readOnly ? 'View Invigilation Assignment' :
                  formData.assignment_id ? 'Edit Invigilation Assignment' : 'Add Invigilation Assignment'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Examiner</label>
                <select
                  name="examinerId"
                  value={formData.examinerId || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={formData.readOnly}
                >
                  <option value="">Select Examiner</option>
                  {data.examiners.map((examiner) => (
                    <option key={examiner.examiner_id} value={examiner.examiner_id}>
                      {examiner.examiner_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {formData.readOnly ? 'Close' : 'Cancel'}
                </button>
                {!formData.readOnly && (
                  <button
                    onClick={() => {
                      const endpoint = formData.assignment_id 
                        ? `invigilation/${formData.assignment_id}`
                        : 'invigilation';
                      const method = formData.assignment_id ? 'PUT' : 'POST';
                      handleSubmit(endpoint, formData, method);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {formData.assignment_id ? 'Update' : 'Add'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Dashboard Component 
  const Dashboard = () => {
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

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Welcome, {user?.username}!</h3>
          <p className="text-gray-600">Role: {user?.role}</p>
          {user?.role === 'examiner' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">You have examiner privileges. You can view and evaluate answer sheets assigned to you.</p>
            </div>
          )}
          {user?.role === 'admin' && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800">You have full administrative access to the system.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Simplified components for space
  const Schools = () => {
  const { user } = useAuth();
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Schools Management</h2>
        {(user.role === 'admin' || user.role === 'coordinator') && (
          <button
            onClick={() => openModal('school')} // Assumes you'll add a 'school' modal
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add School</span>
          </button>
        )}
      </div>
      {tabLoading.schools ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data.schools.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Name</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.schools.map((school) => (
                <tr key={school.school_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{school.school_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{school.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{school.contact_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{school.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{school.principal_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No schools available.</p>
      )}
    </div>
  );
};

  const Examiners = () => {
  const { user } = useAuth();
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Examiners Management</h2>
        {(user.role === 'admin' || user.role === 'coordinator') && (
          <button
            onClick={() => openModal('examiner')} // Assumes you'll add an 'examiner' modal
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Examiner</span>
          </button>
        )}
      </div>
      {tabLoading.examiners ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data.examiners.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qualification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience (Years)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.examiners.map((examiner) => (
                <tr key={examiner.examiner_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{examiner.examiner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examiner.school_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examiner.subject_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examiner.qualification || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examiner.contact_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examiner.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{examiner.experience_years || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No examiners available.</p>
      )}
    </div>
  );
};

  const Students = () => {
  const { user } = useAuth();
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Students Management</h2>
        {(user.role === 'admin' || user.role === 'coordinator') && (
          <button
            onClick={() => openModal('student')} // Assumes you'll add a 'student' modal
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Student</span>
          </button>
        )}
      </div>
      {tabLoading.students ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data.students.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.students.map((student) => (
                <tr key={student.student_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.student_roll_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.school_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.class_standard}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No students available.</p>
      )}
    </div>
  );
};

const AnswerSheets = ({ data, tabLoading, openModal }) => {
  const { user } = useAuth();

  // Guard against undefined data or data.answerSheets
  if (!data || !data.answerSheets) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Answer Sheet Management</h2>
          {(user?.role === 'admin' || user?.role === 'coordinator') && (
            <button
              onClick={() => openModal('answerSheet')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Answer Sheet</span>
            </button>
          )}
        </div>
        <p className="text-gray-600">Loading answer sheets...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Answer Sheet Management</h2>
        {(user?.role === 'admin' || user?.role === 'coordinator') && (
          <button
            onClick={() => openModal('answerSheet')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Add Answer Sheet</span>
          </button>
        )}
      </div>
      {tabLoading.answerSheets ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data.answerSheets.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Examiner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluation Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {data.answerSheets.map((sheet) => (
                <tr key={sheet.sheet_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{sheet.answer_book_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sheet.student_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sheet.subject_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sheet.examiner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sheet.marks_assigned || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sheet.evaluation_date || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No answer sheets available.</p>
      )}
    </div>
  );
};

const Invigilation = ({ searchTerm, setSearchTerm }) => {
  const filteredInvigilation = data.invigilation.filter((assignment) =>
    assignment.examiner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Invigilation Management</h2>
        {(user.role === 'admin' || user.role === 'coordinator') && (
          <button
            onClick={() => openModal('invigilation')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>Add Assignment</span>
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by examiner, school, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {tabLoading.invigilation ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredInvigilation.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Examiner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                {(user.role === 'admin' || user.role === 'coordinator') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvigilation.map((assignment) => (
                <tr key={assignment.assignment_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.examiner_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.school_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.exam_date || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.exam_session || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{assignment.subject_name || 'N/A'}</td>
                  {(user.role === 'admin' || user.role === 'coordinator') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal('invigilation', assignment)}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => openModal('invigilation', { ...assignment, readOnly: true })}
                          className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No invigilation assignments available.</p>
      )}
    </div>
  );
};

const Subjects = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Subjects Management</h2>
      {data.subjects.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject Code</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.subjects.map((subject) => (
                <tr key={subject.subject_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subject.subject_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.subject_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No subjects available.</p>
      )}
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
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {user?.role}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
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

          {renderModal()}

          {!loading && (
            <>
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'schools' && <Schools />}
              {activeTab === 'examiners' && <Examiners />}
              {activeTab === 'students' && <Students />}
              {activeTab === 'answerSheets' && <AnswerSheets data={data} tabLoading={tabLoading} openModal={openModal} />}
              {activeTab === 'invigilation' && <Invigilation searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>}
              {activeTab === 'subjects' && <Subjects />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return user ? <CBSEManagementSystem /> : <LoginPage />;
};

export default App;
