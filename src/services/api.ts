import { Platform } from 'react-native';

// Default API Base URL: Sharada School Management Portal
export const DEFAULT_PORTAL_URL = 'https://portal.sharada-school.co.in';

let customApiBaseUrl: string | null = null;

// Initialize stored custom server URL if available
if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
  const storedUrl = localStorage.getItem('sharada_server_url');
  if (storedUrl) customApiBaseUrl = storedUrl;
}

export const setCustomApiBaseUrl = (url: string | null) => {
  customApiBaseUrl = url ? url.trim().replace(/\/+$/, '') : null;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (customApiBaseUrl) {
      localStorage.setItem('sharada_server_url', customApiBaseUrl);
    } else {
      localStorage.removeItem('sharada_server_url');
    }
  }
};

export const getApiBaseUrl = (): string => {
  if (customApiBaseUrl) {
    return customApiBaseUrl;
  }
  return DEFAULT_PORTAL_URL;
};

export const testServerConnection = async (urlToTest?: string): Promise<{ success: boolean; message: string }> => {
  const target = (urlToTest || getApiBaseUrl()).trim().replace(/\/+$/, '');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    // Ping public /api/parent/login endpoint with GET or HEAD
    const res = await fetch(`${target}/api/parent/kids`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    // Status 401 is expected and means server is up and responsive!
    if (res.status === 401 || res.status === 200) {
      return { success: true, message: `Connected successfully to ${target}` };
    }
    return { success: true, message: `Server responded with status ${res.status}` };
  } catch (err: any) {
    return { success: false, message: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Cannot reach server') };
  }
};

let authToken: string | null = null;
let parentPhone: string | null = null;

export const setAuthToken = (token: string | null, phone?: string | null) => {
  authToken = token;
  if (phone !== undefined) parentPhone = phone;
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem('sharada_parent_token', token);
      if (phone) localStorage.setItem('sharada_parent_phone', phone);
    } else {
      localStorage.removeItem('sharada_parent_token');
      localStorage.removeItem('sharada_parent_phone');
    }
  }
};

export const getStoredAuth = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('sharada_parent_token');
    const phone = localStorage.getItem('sharada_parent_phone');
    if (token) authToken = token;
    if (phone) parentPhone = phone;
    return { token, phone };
  }
  return { token: authToken, phone: parentPhone };
};

const request = async (path: string, options: RequestInit = {}) => {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  if (parentPhone) {
    headers['x-parent-phone'] = parentPhone;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers
    });
  } catch (netErr: any) {
    throw new Error('Unable to connect to the school server. Please check your internet connection or verify the Server Connection settings below.');
  }

  if (!response.ok) {
    let errorMsg = response.status === 404
      ? 'Record not found. Please check your mobile number or contact Sharada English Medium School office.'
      : `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.error) {
        errorMsg = errorJson.error;
        if (typeof errorMsg === 'string' && (errorMsg.includes('E11000') || errorMsg.includes('duplicate key'))) {
          if (errorMsg.includes('email')) {
            errorMsg = 'This email address is already associated with another account. Please contact the school office.';
          } else if (errorMsg.includes('phone')) {
            errorMsg = 'This mobile number is already registered in the system.';
          } else {
            errorMsg = 'An account with this mobile number already exists. Please verify your details.';
          }
        }
      }
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
};

export interface Student {
  id: string;
  _id?: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  className: string;
  section?: string;
  rollNumber?: number;
  academicYear?: string;
  status?: string;
  parentName?: string;
  parentMobile: string;
  parentEmail?: string;
  grade?: string;
  stats?: {
    attendancePercent: number;
    attendanceRecords: number;
    marksRecorded: number;
    recentStatus?: string;
    recentDate?: string;
  };
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Late';
  sessionStatus?: string;
  attendanceType?: string;
  remarks?: string;
}

export interface AttendanceData {
  student: Student;
  stats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    halfDays: number;
    lateDays: number;
    percentage: number;
  };
  records: AttendanceRecord[];
}

export interface SubjectMark {
  id: string;
  subject: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  oralScore?: number;
  convertedScore?: number;
  teacherName?: string;
  examType?: string;
  part?: string;
  className?: string;
  academicYear?: string;
  studentId?: string;
}

export interface ExamData {
  examType: string;
  totalScore: number;
  totalMaxScore: number;
  percentage: number;
  overallGrade: string;
  subjects: SubjectMark[];
}

export interface AcademicSession {
  className: string;
  academicYear: string;
  isCurrent: boolean;
  label: string;
}

export interface MarksData {
  student: Student;
  selectedClass?: string;
  selectedAcademicYear?: string;
  availableSessions?: AcademicSession[];
  exams: ExamData[];
  allMarks: SubjectMark[];
  totalHistoricalMarks?: number;
}

export interface ParentSummaryItem {
  student: Student;
  attendance: {
    totalDays: number;
    presentDays: number;
    percentage: number;
    recentStatus: string;
    recentDate: string | null;
  };
  academics: {
    hasCurrentMarks?: boolean;
    latestExam: string;
    percentage: number;
    grade: string;
    subjectsCount: number;
  };
}

export interface ParentSummary {
  parent: {
    id: string;
    name: string;
    phone: string;
    role: string;
  };
  kidsCount: number;
  kids: ParentSummaryItem[];
}

export const api = {
  login: async (phone: string, name?: string) => {
    const data = await request('/api/parent/login', {
      method: 'POST',
      body: JSON.stringify({ phone, name })
    });
    setAuthToken(data.token, phone);
    return data;
  },

  getKids: async (): Promise<Student[]> => {
    return request('/api/parent/kids');
  },

  getAttendance: async (studentId: string): Promise<AttendanceData> => {
    return request(`/api/parent/kids/${studentId}/attendance`);
  },

  getMarks: async (studentId: string, year?: string, className?: string): Promise<MarksData> => {
    const params: string[] = [];
    if (year) params.push(`year=${encodeURIComponent(year)}`);
    if (className) params.push(`class=${encodeURIComponent(className)}`);
    const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
    return request(`/api/parent/kids/${studentId}/marks${queryStr}`);
  },

  getSummary: async (): Promise<ParentSummary> => {
    return request('/api/parent/summary');
  },

  getProfile: async () => {
    return request('/api/parent/profile');
  },

  logout: () => {
    setAuthToken(null, null);
  },

  getServerUrl: () => getApiBaseUrl(),
  setServerUrl: (url: string | null) => setCustomApiBaseUrl(url),
  testConnection: (url?: string) => testServerConnection(url)
};
