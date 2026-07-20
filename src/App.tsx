import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Settings as SettingsIcon, 
  Shield, 
  Home as HomeIcon, 
  Globe, 
  Clock, 
  Calendar, 
  MapPin, 
  X, 
  Lock, 
  Check, 
  Volume2
} from 'lucide-react';
import { ResponseEntry, Settings, ViewType, LanguageType, Teacher, TeacherResponse, StudentProfile, VisibilitySettings, CustomField } from './types';
import { translations } from './lib/translations';
import { StatsGrid } from './components/StatsGrid';
import { VoteForm } from './components/VoteForm';
import { RecentResponses } from './components/RecentResponses';
import { AdminPanel } from './components/AdminPanel';
import { TeacherAttendance } from './components/TeacherAttendance';
import { StudentAttendance } from './components/StudentAttendance';

// --- CONSTANTS ---
const STORAGE_KEY = 'attendance_data_v1';
const CAT_KEY = 'attendance_cats_v1';
const SET_KEY = 'attendance_settings_v1';
const LANG_KEY = 'attendance_lang_v1';
const HIDDEN_CAT_KEY = 'attendance_hidden_cats_v1';
const TEACHERS_KEY = 'attendance_teachers_v1';
const TEACHER_RESPONSES_KEY = 'attendance_teacher_responses_v1';
const STUDENTS_KEY = 'attendance_students_v1';
const VISIBILITY_KEY = 'attendance_visibility_v1';
const STUDENT_FIELDS_STORAGE_KEY = 'attendance_student_fields_v1';
const TEACHER_FIELDS_STORAGE_KEY = 'attendance_teacher_fields_v1';

const DEFAULT_STUDENT_FIELDS: CustomField[] = [
  { id: 'studentId', name: 'Student ID', nameUr: 'طالب علم آئی ڈی', type: 'text', placeholder: 'Enter Student ID...', placeholderUr: 'طالب علم آئی ڈی درج کریں...', required: false, enabled: false, isSystem: true },
  { id: 'rollNumber', name: 'Roll Number', nameUr: 'رول نمبر', type: 'text', placeholder: 'Enter Roll Number...', placeholderUr: 'رول نمبر درج کریں...', required: false, enabled: false, isSystem: true },
  { id: 'name', name: 'Student Name', nameUr: 'طالب علم کا نام', type: 'text', placeholder: 'Full Name...', placeholderUr: 'مکمل نام...', required: true, enabled: true, isSystem: true },
  { id: 'category', name: 'Category / Class', nameUr: 'کیٹیگری / کلاس', type: 'select', placeholder: '-- Select --', placeholderUr: '-- منتخب کریں --', required: true, enabled: true, isSystem: true },
  { id: 'classType', name: 'Class Attend Type', nameUr: 'کلاس حاضری کی قسم', type: 'select', placeholder: 'Select type...', placeholderUr: 'منتخب کریں...', required: true, enabled: true, isSystem: true },
  { id: 'session', name: 'Session', nameUr: 'سیشن', type: 'text', placeholder: 'e.g. 2024-2026', placeholderUr: 'مثال کے طور پر 2024-2026', required: false, enabled: true, isSystem: true }
];

const DEFAULT_TEACHER_FIELDS: CustomField[] = [
  { id: 'staffId', name: 'Staff ID', nameUr: 'اسٹاف آئی ڈی', type: 'text', placeholder: 'Enter Staff ID...', placeholderUr: 'اسٹاف آئی ڈی درج کریں...', required: false, enabled: false, isSystem: true },
  { id: 'name', name: 'Teacher Name', nameUr: 'استاد کا نام', type: 'text', placeholder: 'Teacher Full Name...', placeholderUr: 'استاد کا مکمل نام...', required: true, enabled: true, isSystem: true },
  { id: 'classSchedule', name: 'Teaching Class Schedule', nameUr: 'پڑھانے کا شیڈول', type: 'select', placeholder: 'Select schedule...', placeholderUr: 'شیڈول منتخب کریں...', required: true, enabled: true, isSystem: true },
  { id: 'subject', name: 'Subject', nameUr: 'مضمون', type: 'select', placeholder: 'Select subject...', placeholderUr: 'مضمون منتخب کریں...', required: true, enabled: true, isSystem: true }
];

const DEFAULT_CATEGORIES = ['Pharmacy 1st Year', 'Pharmacy 2nd Year', 'Dispenser 1st Year'];
const DEFAULT_STUDENTS: StudentProfile[] = [
  { id: 'stud-1', name: 'Ali Khan', category: 'Pharmacy 1st Year', session: '2024-2026', classType: 'weekly' },
  { id: 'stud-2', name: 'Fatima Bilal', category: 'Pharmacy 2nd Year', session: '2023-2025', classType: 'daily' },
  { id: 'stud-3', name: 'Zainab Ahmed', category: 'Dispenser 1st Year', session: '2024-2026', classType: 'weekly' }
];
const DEFAULT_SETTINGS: Settings = {
  title: 'Sunday College Class',
  startTime: '09:00',
  endTime: '13:00',
  adminPassword: 'admin123',
};

const DEFAULT_VISIBILITY: VisibilitySettings = {
  showStudentAttendanceMenu: true,
  showStudentAttendanceHomeLink: true,
  showHeaderCard: true,
  showStatsGrid: true,
  showMainStats: true,
  showVoteForm: true,
  showRecentResponses: true,
};

const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 'default-1',
    name: 'Sir Noman',
    classSchedule: 'both',
    subjects: ['Pharmaceutics', 'Pharmacology']
  }
];

export default function App() {
  // --- STATES ---
  const [responses, setResponses] = useState<ResponseEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [lang, setLang] = useState<LanguageType>('ur');
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  // Visibility Settings
  const [visibilitySettings, setVisibilitySettings] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);

  // Hidden Categories Toggle State
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  // Teacher / Staff States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherResponses, setTeacherResponses] = useState<TeacherResponse[]>([]);

  // Registered Student Profiles State
  const [students, setStudents] = useState<StudentProfile[]>([]);

  // Customized dynamic form fields
  const [studentFields, setStudentFields] = useState<CustomField[]>([]);
  const [teacherFields, setTeacherFields] = useState<CustomField[]>([]);

  // Auth Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [pendingView, setPendingView] = useState<ViewType>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- INITIAL LOAD ---
  useEffect(() => {
    // 1. Responses
    const storedResponses = localStorage.getItem(STORAGE_KEY);
    if (storedResponses) {
      try {
        setResponses(JSON.parse(storedResponses));
      } catch (e) {
        console.error('Error parsing stored responses', e);
      }
    }

    // 2. Categories
    const storedCategories = localStorage.getItem(CAT_KEY);
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        console.error('Error parsing stored categories', e);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
      localStorage.setItem(CAT_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }

    // 3. Settings
    const storedSettings = localStorage.getItem(SET_KEY);
    if (storedSettings) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) });
      } catch (e) {
        console.error('Error parsing stored settings', e);
      }
    }

    // 4. Language
    const storedLang = localStorage.getItem(LANG_KEY);
    if (storedLang === 'en' || storedLang === 'ur') {
      setLang(storedLang);
    }

    // 5. Hidden Categories
    const storedHiddenCats = localStorage.getItem(HIDDEN_CAT_KEY);
    if (storedHiddenCats) {
      try {
        setHiddenCategories(JSON.parse(storedHiddenCats));
      } catch (e) {
        console.error('Error parsing stored hidden categories', e);
      }
    }

    // 6. Registered Teachers
    const storedTeachers = localStorage.getItem(TEACHERS_KEY);
    if (storedTeachers) {
      try {
        setTeachers(JSON.parse(storedTeachers));
      } catch (e) {
        console.error('Error parsing stored teachers', e);
      }
    } else {
      setTeachers(DEFAULT_TEACHERS);
      localStorage.setItem(TEACHERS_KEY, JSON.stringify(DEFAULT_TEACHERS));
    }

    // 7. Teacher Responses
    const storedTeacherResponses = localStorage.getItem(TEACHER_RESPONSES_KEY);
    if (storedTeacherResponses) {
      try {
        setTeacherResponses(JSON.parse(storedTeacherResponses));
      } catch (e) {
        console.error('Error parsing stored teacher responses', e);
      }
    }

    // 8. Registered Students
    const storedStudents = localStorage.getItem(STUDENTS_KEY);
    if (storedStudents) {
      try {
        setStudents(JSON.parse(storedStudents));
      } catch (e) {
        console.error('Error parsing stored students', e);
      }
    } else {
      setStudents(DEFAULT_STUDENTS);
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
    }

    // 9. Visibility Settings
    const storedVisibility = localStorage.getItem(VISIBILITY_KEY);
    if (storedVisibility) {
      try {
        setVisibilitySettings({ ...DEFAULT_VISIBILITY, ...JSON.parse(storedVisibility) });
      } catch (e) {
        console.error('Error parsing stored visibility settings', e);
      }
    }

    // 10. Student Customized Form Fields
    const storedStudentFields = localStorage.getItem(STUDENT_FIELDS_STORAGE_KEY);
    if (storedStudentFields) {
      try {
        setStudentFields(JSON.parse(storedStudentFields));
      } catch (e) {
        console.error('Error parsing student customized fields', e);
        setStudentFields(DEFAULT_STUDENT_FIELDS);
      }
    } else {
      setStudentFields(DEFAULT_STUDENT_FIELDS);
      localStorage.setItem(STUDENT_FIELDS_STORAGE_KEY, JSON.stringify(DEFAULT_STUDENT_FIELDS));
    }

    // 11. Teacher Customized Form Fields
    const storedTeacherFields = localStorage.getItem(TEACHER_FIELDS_STORAGE_KEY);
    if (storedTeacherFields) {
      try {
        setTeacherFields(JSON.parse(storedTeacherFields));
      } catch (e) {
        console.error('Error parsing teacher customized fields', e);
        setTeacherFields(DEFAULT_TEACHER_FIELDS);
      }
    } else {
      setTeacherFields(DEFAULT_TEACHER_FIELDS);
      localStorage.setItem(TEACHER_FIELDS_STORAGE_KEY, JSON.stringify(DEFAULT_TEACHER_FIELDS));
    }
  }, []);

  // --- DETECT ROUTE ON LOAD & URL NAVIGATION ---
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        path.toLowerCase().includes('teacher') || 
        hash.toLowerCase().includes('teacher') ||
        search.toLowerCase().includes('teacher')
      ) {
        setActiveView('teacher-attendance');
      } else if (
        path.toLowerCase().includes('student-attendance') || 
        path.toLowerCase().includes('student_attendance') || 
        hash.toLowerCase().includes('student-attendance') ||
        hash.toLowerCase().includes('student_attendance') ||
        search.toLowerCase().includes('student-attendance') ||
        search.toLowerCase().includes('student_attendance')
      ) {
        setActiveView('student-attendance');
      }
    };

    checkRoute();

    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // --- LIVE CLOCK TICK ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- HELPER FUNCTIONS ---
  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleLanguageToggle = () => {
    const nextLang = lang === 'ur' ? 'en' : 'ur';
    setLang(nextLang);
    localStorage.setItem(LANG_KEY, nextLang);
    triggerToast(nextLang === 'ur' ? 'زبان تبدیل ہو گئی: اردو' : 'Language switched to English', 'info');
  };

  const handleViewChangeAttempt = (targetView: ViewType) => {
    setMenuOpen(false);
    if (targetView === 'home' || targetView === 'teacher-attendance' || targetView === 'student-attendance') {
      setActiveView(targetView);
      return;
    }

    // Require password for Admin & Settings
    if (isAuthenticated) {
      setActiveView(targetView);
    } else {
      setPendingView(targetView);
      setAuthPassword('');
      setAuthModalOpen(true);
    }
  };

  const handleVerifyAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const t = translations[lang];
    if (authPassword === settings.adminPassword) {
      setIsAuthenticated(true);
      setAuthModalOpen(false);
      setActiveView(pendingView);
      triggerToast('🔒 Access Granted', 'success');
    } else {
      triggerToast(t.incorrectPassword, 'error');
    }
  };

  // --- DATA MUTATIONS ---
  const handleVoteSubmit = (name: string, category: string, status: 'yes' | 'no', reason?: string, classType?: 'daily' | 'weekly', session?: string, extraFields?: Record<string, any>) => {
    const t = translations[lang];
    const now = new Date();
    const newEntry: ResponseEntry = {
      id: Date.now().toString(),
      name,
      category,
      status,
      reason,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      classType: classType || 'weekly',
      session,
      ...(extraFields || {})
    };

    const updated = [newEntry, ...responses];
    setResponses(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    triggerToast(t.responseSaved, 'success');
  };

  const handleDeleteEntry = (id: string) => {
    const t = translations[lang];
    if (window.confirm(t.deleteConfirm)) {
      const updated = responses.filter((r) => r.id !== id);
      setResponses(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      triggerToast('🗑️ Entry deleted', 'info');
    }
  };

  const handleClearAllData = () => {
    const t = translations[lang];
    if (window.confirm(t.clearConfirm)) {
      setResponses([]);
      localStorage.removeItem(STORAGE_KEY);
      triggerToast(t.dataCleared, 'error');
    }
  };

  const handleAddCategory = (newCat: string) => {
    if (categories.includes(newCat)) {
      triggerToast('Category already exists', 'error');
      return;
    }
    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem(CAT_KEY, JSON.stringify(updated));
    triggerToast('🏷️ Category Added', 'success');
  };

  const handleDeleteCategory = (index: number) => {
    const updated = [...categories];
    const catName = updated[index];
    updated.splice(index, 1);
    setCategories(updated);
    localStorage.setItem(CAT_KEY, JSON.stringify(updated));
    
    // Also remove from hidden list if present
    if (hiddenCategories.includes(catName)) {
      const filteredHidden = hiddenCategories.filter((c) => c !== catName);
      setHiddenCategories(filteredHidden);
      localStorage.setItem(HIDDEN_CAT_KEY, JSON.stringify(filteredHidden));
    }
    
    triggerToast('🏷️ Category Removed', 'info');
  };

  const handleSaveSettings = (newSettings: Settings) => {
    const t = translations[lang];
    setSettings(newSettings);
    localStorage.setItem(SET_KEY, JSON.stringify(newSettings));
    triggerToast(t.settingsSaved, 'success');
    setActiveView('home');
  };

  // --- CATEGORY VISIBILITY TOGGLERS ---
  const handleToggleCategoryVisibility = (cat: string) => {
    let updated: string[];
    if (hiddenCategories.includes(cat)) {
      updated = hiddenCategories.filter((c) => c !== cat);
      triggerToast(lang === 'ur' ? 'کیٹیگری ظاہر کر دی گئی' : 'Category made visible', 'success');
    } else {
      updated = [...hiddenCategories, cat];
      triggerToast(lang === 'ur' ? 'کیٹیگری پوشیدہ کر دی گئی' : 'Category hidden', 'info');
    }
    setHiddenCategories(updated);
    localStorage.setItem(HIDDEN_CAT_KEY, JSON.stringify(updated));
  };

  // --- TEACHER MANAGEMENT ACTIONS ---
  const handleAddTeacher = (
    nameOrProfile: string | Partial<Teacher>,
    classSchedule?: 'weekly' | 'monthly' | 'both',
    subjects?: string[],
    extraFields?: Record<string, any>
  ) => {
    const t = translations[lang];
    let finalProfile: Partial<Teacher> = {};
    if (nameOrProfile && typeof nameOrProfile === 'object') {
      finalProfile = nameOrProfile;
    } else if (typeof nameOrProfile === 'string') {
      finalProfile = {
        name: nameOrProfile,
        classSchedule: classSchedule || 'weekly',
        subjects: subjects || [],
        ...extraFields
      };
    }

    if (!finalProfile.name) return;

    if (teachers.some((teach) => teach.name.toLowerCase() === finalProfile.name!.toLowerCase())) {
      triggerToast(t.duplicateTeacherName, 'error');
      return;
    }

    const newTeach: Teacher = {
      ...finalProfile,
      id: Date.now().toString(),
      name: finalProfile.name.trim(),
      classSchedule: finalProfile.classSchedule || 'weekly',
      subjects: finalProfile.subjects || []
    };

    const updated = [...teachers, newTeach];
    setTeachers(updated);
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(updated));
    triggerToast(t.teacherAdded, 'success');
  };

  const handleUpdateTeacher = (updatedTeach: Teacher) => {
    const t = translations[lang];
    const updated = teachers.map((teach) => (teach.id === updatedTeach.id ? updatedTeach : teach));
    setTeachers(updated);
    localStorage.setItem(TEACHERS_KEY, JSON.stringify(updated));
    triggerToast(t.teacherUpdated, 'success');
  };

  const handleDeleteTeacher = (id: string) => {
    if (window.confirm(lang === 'ur' ? 'کیا آپ اس ٹیچر کو حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this teacher?')) {
      const updated = teachers.filter((teach) => teach.id !== id);
      setTeachers(updated);
      localStorage.setItem(TEACHERS_KEY, JSON.stringify(updated));
      triggerToast(translations[lang].teacherDeleted, 'info');
    }
  };

  const handleTeacherAttendanceSubmit = (
    name: string,
    classSchedule: 'weekly' | 'monthly' | 'both',
    subject: string,
    status: 'yes' | 'no',
    reason?: string,
    extraFields?: Record<string, any>
  ) => {
    const now = new Date();
    const newResponse: TeacherResponse = {
      id: Date.now().toString(),
      name,
      classSchedule,
      subject,
      status,
      reason,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      ...(extraFields || {})
    };

    const updated = [newResponse, ...teacherResponses];
    setTeacherResponses(updated);
    localStorage.setItem(TEACHER_RESPONSES_KEY, JSON.stringify(updated));
    triggerToast(translations[lang].responseSaved, 'success');
  };

  const handleDeleteTeacherResponse = (id: string) => {
    if (window.confirm(translations[lang].deleteConfirm)) {
      const updated = teacherResponses.filter((tr) => tr.id !== id);
      setTeacherResponses(updated);
      localStorage.setItem(TEACHER_RESPONSES_KEY, JSON.stringify(updated));
      triggerToast('🗑️ Teacher response deleted', 'info');
    }
  };

  const handleClearTeacherResponses = () => {
    if (window.confirm(translations[lang].clearConfirm)) {
      setTeacherResponses([]);
      localStorage.removeItem(TEACHER_RESPONSES_KEY);
      triggerToast('🗑️ Teacher logs cleared', 'error');
    }
  };

  const handleExportTeacherCSV = () => {
    const t = translations[lang];
    if (teacherResponses.length === 0) {
      triggerToast(t.noDataExport, 'error');
      return;
    }

    triggerToast(t.downloadingCsv, 'info');
    let csv = '\uFEFF'; // Add UTF-8 BOM to ensure proper Excel loading of Urdu/Arabic text

    const enabledCustomFields = teacherFields.filter(f => f.enabled);

    const headers: string[] = [];
    const fieldsToExport: { id: string, name: string }[] = [];

    // Staff ID (if enabled)
    enabledCustomFields.forEach(f => {
      if (f.id === 'staffId') {
        headers.push('Staff ID');
        fieldsToExport.push({ id: 'staffId', name: 'Staff ID' });
      }
    });

    headers.push('Teacher Name');
    fieldsToExport.push({ id: 'name', name: 'Teacher Name' });

    enabledCustomFields.forEach(f => {
      if (f.id === 'classSchedule') {
        headers.push('Schedule');
        fieldsToExport.push({ id: 'classSchedule', name: 'Schedule' });
      } else if (f.id === 'subject') {
        headers.push('Subject');
        fieldsToExport.push({ id: 'subject', name: 'Subject' });
      }
    });

    // Add other non-system custom fields
    enabledCustomFields.forEach(f => {
      if (!f.isSystem) {
        headers.push(f.name);
        fieldsToExport.push({ id: f.id, name: f.name });
      }
    });

    headers.push('Status', 'Reason', 'Time', 'Date');

    csv += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    teacherResponses.forEach((tr) => {
      const rowValues: string[] = [];
      fieldsToExport.forEach(f => {
        const val = tr[f.id] || '';
        rowValues.push(`"${String(val).replace(/"/g, '""')}"`);
      });

      rowValues.push(`"${tr.status}"`);
      rowValues.push(`"${(tr.reason || '').replace(/"/g, '""')}"`);
      rowValues.push(`"${tr.time}"`, `"${tr.date}"`);

      csv += rowValues.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Teacher_Attendance_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- STUDENT PROFILES MANAGEMENT ACTIONS ---
  const handleAddStudent = (
    nameOrProfile: string | Partial<StudentProfile>,
    category?: string,
    session?: string,
    classType?: string,
    extraFields?: Record<string, any>
  ) => {
    let finalProfile: Partial<StudentProfile> = {};
    if (nameOrProfile && typeof nameOrProfile === 'object') {
      finalProfile = nameOrProfile;
    } else if (typeof nameOrProfile === 'string') {
      finalProfile = {
        name: nameOrProfile,
        category: category || '',
        session,
        classType,
        ...extraFields
      };
    }

    if (!finalProfile.name) return;

    if (students.some((stud) => stud.name.toLowerCase() === finalProfile.name!.toLowerCase())) {
      triggerToast(lang === 'ur' ? 'اس نام کا طالب علم پہلے سے موجود ہے' : 'A student with this name already exists', 'error');
      return;
    }

    const newStud: StudentProfile = {
      ...finalProfile,
      id: Date.now().toString(),
      name: finalProfile.name.trim(),
      category: finalProfile.category || ''
    };

    const updated = [...students, newStud];
    setStudents(updated);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updated));
    triggerToast(lang === 'ur' ? 'طالب علم کامیابی سے شامل کر دیا گیا' : 'Student added successfully', 'success');
  };

  const handleUpdateStudent = (updatedStud: StudentProfile) => {
    const updated = students.map((stud) => (stud.id === updatedStud.id ? updatedStud : stud));
    setStudents(updated);
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(updated));
    triggerToast(lang === 'ur' ? 'طالب علم کی معلومات اپ ڈیٹ کر دی گئیں' : 'Student updated successfully', 'success');
  };

  const handleDeleteStudent = (id: string) => {
    if (window.confirm(lang === 'ur' ? 'کیا آپ اس طالب علم کو حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this student?')) {
      const updated = students.filter((stud) => stud.id !== id);
      setStudents(updated);
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(updated));
      triggerToast(lang === 'ur' ? 'طالب علم حذف کر دیا گیا' : 'Student deleted', 'info');
    }
  };

  const handleUpdateStudentFields = (newFields: CustomField[]) => {
    setStudentFields(newFields);
    localStorage.setItem(STUDENT_FIELDS_STORAGE_KEY, JSON.stringify(newFields));
  };

  const handleUpdateTeacherFields = (newFields: CustomField[]) => {
    setTeacherFields(newFields);
    localStorage.setItem(TEACHER_FIELDS_STORAGE_KEY, JSON.stringify(newFields));
  };

  const handleUpdateVisibilitySettings = (newVisibility: VisibilitySettings) => {
    setVisibilitySettings(newVisibility);
    localStorage.setItem(VISIBILITY_KEY, JSON.stringify(newVisibility));
    triggerToast(lang === 'ur' ? 'تبدیلیاں محفوظ کر دی گئیں' : 'Visibility settings saved successfully', 'success');
  };

  const handleExportCSV = () => {
    const t = translations[lang];
    if (responses.length === 0) {
      triggerToast(t.noDataExport, 'error');
      return;
    }

    triggerToast(t.downloadingCsv, 'info');
    let csv = '\uFEFF'; // Add UTF-8 BOM to ensure proper Excel loading of Urdu/Arabic text

    // Find all custom fields that are enabled
    const enabledCustomFields = studentFields.filter(f => f.enabled);
    
    // Construct headers
    const headers: string[] = [];
    const fieldsToExport: { id: string, name: string }[] = [];

    enabledCustomFields.forEach(f => {
      if (f.id === 'studentId') {
        headers.push('Student ID');
        fieldsToExport.push({ id: 'studentId', name: 'Student ID' });
      } else if (f.id === 'rollNumber') {
        headers.push('Roll Number');
        fieldsToExport.push({ id: 'rollNumber', name: 'Roll Number' });
      }
    });

    headers.push('Name', 'Category');
    fieldsToExport.push({ id: 'name', name: 'Name' }, { id: 'category', name: 'Category' });

    enabledCustomFields.forEach(f => {
      if (f.id === 'session') {
        headers.push('Session');
        fieldsToExport.push({ id: 'session', name: 'Session' });
      } else if (f.id === 'classType') {
        headers.push('Class Type');
        fieldsToExport.push({ id: 'classType', name: 'Class Type' });
      }
    });

    // Add other non-system custom fields
    enabledCustomFields.forEach(f => {
      if (!f.isSystem) {
        headers.push(f.name);
        fieldsToExport.push({ id: f.id, name: f.name });
      }
    });

    // Append base response fields
    headers.push('Status', 'Reason', 'Time', 'Date');

    csv += headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    responses.forEach((r) => {
      const rowValues: string[] = [];
      fieldsToExport.forEach(f => {
        let val = r[f.id] || '';
        if (f.id === 'classType' && val) {
          val = val === 'daily' ? 'Daily' : val === 'weekly' ? 'Weekly' : val;
        }
        rowValues.push(`"${String(val).replace(/"/g, '""')}"`);
      });

      // Status
      rowValues.push(`"${r.status}"`);
      // Reason
      rowValues.push(`"${(r.reason || '').replace(/"/g, '""')}"`);
      // Time, Date
      rowValues.push(`"${r.time}"`, `"${r.date}"`);

      csv += rowValues.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Student_Attendance_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- TRANSFORMATION HELPERS ---
  const formattedDate = currentTime.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedClock = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Filter categories passed to home screen stats grid to hide toggled categories
  const visibleCategories = categories.filter((cat) => !hiddenCategories.includes(cat));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* TOPBAR HEADER */}
      <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-100 text-white font-extrabold text-xl">
              📚
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 tracking-tight text-sm md:text-base">
                {translations[lang].appTitle}
              </h1>
              <p className="text-[10px] text-emerald-600 font-bold tracking-wider uppercase">
                {lang === 'ur' ? 'حاضری رجسٹر' : 'Attendance Register'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Toggle Button */}
            <button
              onClick={handleLanguageToggle}
              className="p-2 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl flex items-center gap-1 cursor-pointer transition-all border border-slate-100"
              title="Switch Language / زبان تبدیل کریں"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold font-sans">
                {lang === 'ur' ? 'EN' : 'اردو'}
              </span>
            </button>

            {/* Menu Trigger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex flex-col gap-1 items-center justify-center w-10 h-10 cursor-pointer transition-all border border-slate-200"
              aria-label="Toggle navigation menu"
            >
              <span className={`w-5 h-0.5 bg-slate-800 rounded-full transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-slate-800 rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-slate-800 rounded-full transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </button>
          </div>
        </div>

        {/* NAVIGATION DROPDOWN MENU */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Overlay */}
              <div 
                className="fixed inset-0 bg-black/5 z-40" 
                onClick={() => setMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[61px] left-4 right-4 md:left-auto md:right-auto md:w-64 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-w-md mx-auto"
              >
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleViewChangeAttempt('home')}
                    className={`w-full p-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all cursor-pointer ${
                      activeView === 'home'
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <HomeIcon className="w-4 h-4 text-emerald-600" />
                    <span>{translations[lang].home}</span>
                  </button>

                  <button
                    onClick={() => handleViewChangeAttempt('teacher-attendance')}
                    className={`w-full p-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all cursor-pointer ${
                      activeView === 'teacher-attendance'
                        ? 'bg-indigo-50 text-indigo-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm">🎓</span>
                    <span>{translations[lang].staffAttendance}</span>
                  </button>

                  {visibilitySettings.showStudentAttendanceMenu && (
                    <button
                      onClick={() => handleViewChangeAttempt('student-attendance')}
                      className={`w-full p-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all cursor-pointer ${
                        activeView === 'student-attendance'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">👨‍🎓</span>
                      <span>{lang === 'ur' ? 'طالب علم حاضری' : 'Student Attendance'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleViewChangeAttempt('admin')}
                    className={`w-full p-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all cursor-pointer ${
                      activeView === 'admin'
                        ? 'bg-indigo-50 text-indigo-800'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>{translations[lang].adminPanel}</span>
                  </button>



                  {/* Lock session trigger */}
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        setActiveView('home');
                        setMenuOpen(false);
                        triggerToast('🔒 Session Locked', 'info');
                      }}
                      className="w-full p-3 rounded-xl font-bold text-sm flex items-center gap-3 text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{lang === 'ur' ? 'ایڈمن لاک آؤٹ' : 'Lock Admin Session'}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* CORE CONTAINER */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* VIEW: HOME (SUBMISSIONS) */}
          {activeView === 'home' && (
            <motion.div
              key="view-home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* DYNAMIC HEADER CLASS CARD */}
              {visibilitySettings.showHeaderCard && (
                <div className="bg-gradient-to-tr from-emerald-800 via-emerald-700 to-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
                  
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] md:text-xs font-bold tracking-wide uppercase mb-3">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                    {lang === 'ur' ? 'لائیو سیشن' : 'Live Session'}
                  </span>

                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight mb-2 leading-tight">
                    {settings.title}
                  </h2>

                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-emerald-100">
                    <span className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-900/30 rounded-xl backdrop-blur-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {settings.startTime} - {settings.endTime}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-900/30 rounded-xl backdrop-blur-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      {lang === 'ur' ? 'کیمپس' : 'Campus'}
                    </span>
                  </div>

                  <div className="mt-5 pt-4 border-t border-emerald-500/30 flex items-center justify-between text-xs font-bold text-emerald-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                    <span className="font-mono text-emerald-200 tracking-wider">
                      {formattedClock}
                    </span>
                  </div>
                </div>
              )}

              {/* STUDENT ATTENDANCE QUICK LINK BANNER */}
              {visibilitySettings.showStudentAttendanceHomeLink && (
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleViewChangeAttempt('student-attendance')}
                  className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-3xl p-4 md:p-5 text-white shadow-md flex items-center justify-between cursor-pointer border border-emerald-400/20"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                      👨‍🎓
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                        <span>{lang === 'ur' ? 'طالب علم حاضری رجسٹر کارڈ' : 'Student Attendance Card'}</span>
                      </h3>
                      <p className="text-[10px] md:text-xs text-emerald-100 font-semibold opacity-90">
                        {lang === 'ur' ? 'حاضری ریکارڈ درج کرنے کے لیے یہاں کلک کریں' : 'Click here to submit student attendance'}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center font-bold transition-all">
                    {lang === 'ur' ? '←' : '→'}
                  </div>
                </motion.div>
              )}

              {/* STATISTICAL COUNTERS (filtered categories so hidden ones disappear) */}
              {(visibilitySettings.showStatsGrid || visibilitySettings.showMainStats) && (
                <StatsGrid 
                  responses={responses} 
                  lang={lang} 
                  categories={visibleCategories} 
                  showMainStats={visibilitySettings.showMainStats}
                  showClassStats={visibilitySettings.showStatsGrid}
                />
              )}

              {/* SUBMISSION VOTE CARD */}
              {visibilitySettings.showVoteForm && (
                <VoteForm categories={categories} lang={lang} onSubmit={handleVoteSubmit} students={students} studentFields={studentFields} />
              )}

              {/* HISTORY VIEW CARD */}
              {visibilitySettings.showRecentResponses && (
                <RecentResponses responses={responses} lang={lang} />
              )}
            </motion.div>
          )}

          {/* VIEW: STUDENT ATTENDANCE */}
          {activeView === 'student-attendance' && (
            <motion.div
              key="view-student-attendance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <StudentAttendance
                categories={categories}
                lang={lang}
                onSubmit={handleVoteSubmit}
                students={students}
                studentFields={studentFields}
              />

              {/* Back to Home Button */}
              <button
                onClick={() => setActiveView('home')}
                className="w-full mt-2 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-100 text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                ← {lang === 'ur' ? 'ہوم پیج پر واپس جائیں' : 'Back to Home'}
              </button>
            </motion.div>
          )}

          {/* VIEW: TEACHER ATTENDANCE */}
          {activeView === 'teacher-attendance' && (
            <motion.div
              key="view-teacher-attendance"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <TeacherAttendance
                teachers={teachers}
                lang={lang}
                onSubmit={handleTeacherAttendanceSubmit}
                onUpdateTeacher={handleUpdateTeacher}
                teacherFields={teacherFields}
              />

              {/* Back to Home Button */}
              <button
                onClick={() => setActiveView('home')}
                className="w-full mt-2 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-100 text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                ← {lang === 'ur' ? 'ہوم پیج پر واپس جائیں' : 'Back to Home'}
              </button>
            </motion.div>
          )}

          {/* VIEW: ADMIN PANEL */}
          {(activeView === 'admin' || activeView === 'settings') && (
            <motion.div
              key="view-admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <AdminPanel
                responses={responses}
                categories={categories}
                settings={settings}
                onDeleteEntry={handleDeleteEntry}
                onClearAll={handleClearAllData}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onSaveSettings={handleSaveSettings}
                onExportCSV={handleExportCSV}
                lang={lang}
                activeView={activeView === 'settings' ? 'settings' : 'admin'}
                hiddenCategories={hiddenCategories}
                onToggleCategoryVisibility={handleToggleCategoryVisibility}
                teachers={teachers}
                teacherResponses={teacherResponses}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onDeleteTeacherResponse={handleDeleteTeacherResponse}
                onClearTeacherResponses={handleClearTeacherResponses}
                onExportTeacherCSV={handleExportTeacherCSV}
                students={students}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                visibilitySettings={visibilitySettings}
                onUpdateVisibilitySettings={handleUpdateVisibilitySettings}
                studentFields={studentFields}
                teacherFields={teacherFields}
                onUpdateStudentFields={handleUpdateStudentFields}
                onUpdateTeacherFields={handleUpdateTeacherFields}
              />

              {/* Back button */}
              <button
                onClick={() => setActiveView('home')}
                className="w-full mt-4 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-100 text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                ← {lang === 'ur' ? 'ہوم پیج پر واپس جائیں' : 'Back to Home'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER METADATA */}
      <footer className="w-full py-6 text-center text-xs text-slate-400 font-medium">
        <p>© {new Date().getFullYear()} {settings.title}</p>
      </footer>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-6 left-1/2 z-[9999] px-5 py-3 rounded-full text-white font-semibold text-xs md:text-sm flex items-center gap-2.5 shadow-xl min-w-[240px] justify-center bg-slate-900 border border-slate-800"
            id="toast"
          >
            {toastType === 'success' && <span className="text-emerald-400">✅</span>}
            {toastType === 'error' && <span className="text-rose-400">❌</span>}
            {toastType === 'info' && <span className="text-emerald-400">✨</span>}
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADMIN AUTHENTICATION MODAL */}
      <AnimatePresence>
        {authModalOpen && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthModalOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-5 w-full max-w-sm relative z-50 border border-slate-100 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setAuthModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2 pb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base md:text-lg font-extrabold text-slate-800">
                  {translations[lang].restrictedAccess}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {translations[lang].enterPassword}
                </p>
              </div>

              <form onSubmit={handleVerifyAuth} className="space-y-3.5">
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder={translations[lang].passwordInputPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-center text-slate-800"
                  autoFocus
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm cursor-pointer transition-all"
                  >
                    {translations[lang].cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-indigo-100 cursor-pointer transition-all"
                  >
                    {translations[lang].login}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
