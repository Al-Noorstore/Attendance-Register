export interface ResponseEntry {
  id: string;
  name: string;
  category: string;
  status: 'yes' | 'no';
  reason?: string;
  time: string; // e.g. "09:30 AM"
  date: string; // e.g. "19 Jul 2026"
  classType?: string;
  session?: string; // e.g. "2024-2026"
  [key: string]: any;
}

export interface Settings {
  title: string;
  startTime: string;
  endTime: string;
  adminPassword: string;
}

export interface Teacher {
  id: string;
  name: string;
  classSchedule: 'weekly' | 'monthly' | 'both';
  subjects: string[];
  [key: string]: any;
}

export interface StudentProfile {
  id: string;
  name: string;
  category: string;
  session?: string; // e.g. "2024-2026"
  classType?: string;
  [key: string]: any;
}

export interface TeacherResponse {
  id: string;
  name: string;
  classSchedule: 'weekly' | 'monthly' | 'both';
  subject: string;
  status: 'yes' | 'no';
  reason?: string;
  time: string;
  date: string;
  [key: string]: any;
}

export type ViewType = 'home' | 'admin' | 'settings' | 'teacher-attendance' | 'student-attendance';
export type LanguageType = 'ur' | 'en';

export interface VisibilitySettings {
  showStudentAttendanceMenu: boolean;
  showStudentAttendanceHomeLink: boolean;
  showHeaderCard: boolean;
  showStatsGrid: boolean;
  showMainStats: boolean;
  showVoteForm: boolean;
  showRecentResponses: boolean;
}

export interface CustomField {
  id: string;
  name: string;       // English label
  nameUr?: string;     // Urdu label
  type: 'text' | 'select' | 'number';
  placeholder?: string;
  placeholderUr?: string;
  options?: string[];  // custom answer options if type is 'select'
  required: boolean;
  enabled: boolean;
  isSystem?: boolean;
}



