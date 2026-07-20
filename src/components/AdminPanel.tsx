import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Trash2, 
  Plus, 
  X, 
  Settings as SettingsIcon, 
  Users, 
  Sliders, 
  Shield, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  Check, 
  Edit,
  Grid
} from 'lucide-react';
import { ResponseEntry, Settings, LanguageType, Teacher, TeacherResponse, StudentProfile, VisibilitySettings, CustomField } from '../types';
import { translations } from '../lib/translations';
import { AttendancePerformance } from './AttendancePerformance';

interface AdminPanelProps {
  responses: ResponseEntry[];
  categories: string[];
  settings: Settings;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onAddCategory: (cat: string) => void;
  onDeleteCategory: (index: number) => void;
  onSaveSettings: (newSettings: Settings) => void;
  onExportCSV: () => void;
  lang: LanguageType;
  activeView: 'admin' | 'settings';
  
  // Category visibility
  hiddenCategories: string[];
  onToggleCategoryVisibility: (cat: string) => void;

  // Teacher states and actions
  teachers: Teacher[];
  teacherResponses: TeacherResponse[];
  onAddTeacher: (nameOrProfile: string | Partial<Teacher>, classSchedule?: 'weekly' | 'monthly' | 'both', subjects?: string[], extraFields?: Record<string, any>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onDeleteTeacherResponse: (id: string) => void;
  onClearTeacherResponses: () => void;
  onExportTeacherCSV: () => void;

  // Student profiles
  students: StudentProfile[];
  onAddStudent: (nameOrProfile: string | Partial<StudentProfile>, category?: string, session?: string, classType?: string, extraFields?: Record<string, any>) => void;
  onUpdateStudent: (student: StudentProfile) => void;
  onDeleteStudent: (id: string) => void;

  // Visibility Settings
  visibilitySettings: VisibilitySettings;
  onUpdateVisibilitySettings: (newVisibility: VisibilitySettings) => void;

  // Custom fields
  studentFields: CustomField[];
  teacherFields: CustomField[];
  onUpdateStudentFields: (fields: CustomField[]) => void;
  onUpdateTeacherFields: (fields: CustomField[]) => void;
}

const ALL_SUBJECTS = ['Biochem', 'Anatomy', 'Physiology', 'Microbiology', 'Pharmaceutics', 'Pharmacology'];
const YEARS_LIST = Array.from({ length: 21 }, (_, i) => (2020 + i).toString());

export const AdminPanel: React.FC<AdminPanelProps> = ({
  responses,
  categories,
  settings,
  onDeleteEntry,
  onClearAll,
  onAddCategory,
  onDeleteCategory,
  onSaveSettings,
  onExportCSV,
  lang,
  activeView: initialView,
  hiddenCategories,
  onToggleCategoryVisibility,
  teachers,
  teacherResponses,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onDeleteTeacherResponse,
  onClearTeacherResponses,
  onExportTeacherCSV,
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  visibilitySettings,
  onUpdateVisibilitySettings,
  studentFields,
  teacherFields,
  onUpdateStudentFields,
  onUpdateTeacherFields
}) => {
  const t = translations[lang];
  const [subTab, setSubTab] = useState<'attendance' | 'performance' | 'categories' | 'dashboard' | 'teachers' | 'students' | 'settings' | 'hide' | 'edit-forms'>(
    initialView === 'settings' ? 'settings' : 'attendance'
  );

  // Category Input
  const [newCat, setNewCat] = useState('');

  // Settings Fields
  const [title, setTitle] = useState(settings.title);
  const [startTime, setStartTime] = useState(settings.startTime);
  const [endTime, setEndTime] = useState(settings.endTime);
  const [password, setPassword] = useState('');

  // Teacher Form States
  const [teacherName, setTeacherName] = useState('');
  const [teacherSchedule, setTeacherSchedule] = useState<'weekly' | 'monthly' | 'both'>('weekly');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);

  // Form Editor / Customization States
  const [activeEditForm, setActiveEditForm] = useState<'student' | 'teacher' | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldName, setEditingFieldName] = useState('');
  const [editingFieldNameUr, setEditingFieldNameUr] = useState('');
  const [editingFieldPlaceholder, setEditingFieldPlaceholder] = useState('');
  const [editingFieldPlaceholderUr, setEditingFieldPlaceholderUr] = useState('');
  const [editingFieldOptionsStr, setEditingFieldOptionsStr] = useState('');
  const [editingFieldRequired, setEditingFieldRequired] = useState(false);

  // New Custom Field States
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldNameUr, setNewFieldNameUr] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select'>('text');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldPlaceholderUr, setNewFieldPlaceholderUr] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptionsStr, setNewFieldOptionsStr] = useState('');

  // Student Form States
  const [studentName, setStudentName] = useState('');
  const [studentCategory, setStudentCategory] = useState(categories[0] || 'Pharmacy 1st Year');
  const [studentClassType, setStudentClassType] = useState<string>('weekly');
  const [studentStartYear, setStudentStartYear] = useState('2024');
  const [studentEndYear, setStudentEndYear] = useState('2026');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  const [dynamicStudentValues, setDynamicStudentValues] = useState<Record<string, any>>({});
  const [dynamicTeacherValues, setDynamicTeacherValues] = useState<Record<string, any>>({});

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = dynamicStudentValues['name'] || studentName;
    if (!finalName || !finalName.trim()) return;

    const finalCategory = dynamicStudentValues['category'] || studentCategory;
    const finalClassType = dynamicStudentValues['classType'] || studentClassType;
    const finalSession = dynamicStudentValues['session'] || `${studentStartYear}-${studentEndYear}`;

    const profileData = {
      ...dynamicStudentValues,
      name: finalName.trim(),
      category: finalCategory,
      classType: finalClassType,
      session: finalSession
    };

    if (editingStudentId) {
      onUpdateStudent({
        ...profileData,
        id: editingStudentId,
      } as StudentProfile);
      setEditingStudentId(null);
    } else {
      onAddStudent(profileData as Partial<StudentProfile>);
    }

    setStudentName('');
    setDynamicStudentValues({});
    setStudentCategory(categories[0] || 'Pharmacy 1st Year');
    setStudentClassType('weekly');
    setStudentStartYear('2024');
    setStudentEndYear('2026');
  };

  const handleEditStudentClick = (stud: StudentProfile) => {
    setEditingStudentId(stud.id);
    setStudentName(stud.name);
    setStudentCategory(stud.category);
    setStudentClassType(stud.classType || 'weekly');
    if (stud.session && stud.session.includes('-')) {
      const parts = stud.session.split('-');
      setStudentStartYear(parts[0] || '2024');
      setStudentEndYear(parts[1] || '2026');
    } else {
      setStudentStartYear('2024');
      setStudentEndYear('2026');
    }
    setDynamicStudentValues(stud);
  };

  const handleCancelStudentEdit = () => {
    setEditingStudentId(null);
    setStudentName('');
    setStudentCategory(categories[0] || 'Pharmacy 1st Year');
    setStudentClassType('weekly');
    setStudentStartYear('2024');
    setStudentEndYear('2026');
    setDynamicStudentValues({});
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCat.trim()) {
      onAddCategory(newCat.trim());
      setNewCat('');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      title: title.trim(),
      startTime,
      endTime,
      adminPassword: password.trim() !== '' ? password.trim() : settings.adminPassword,
    });
    setPassword('');
  };

  // Toggle Subject Selection
  const handleToggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  // Teacher Submit (Add or Update)
  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = dynamicTeacherValues['name'] || teacherName;
    if (!finalName || !finalName.trim()) return;

    const finalSchedule = dynamicTeacherValues['classSchedule'] || teacherSchedule;
    const finalSubjects = dynamicTeacherValues['subjects'] || selectedSubjects;

    const profileData = {
      ...dynamicTeacherValues,
      name: finalName.trim(),
      classSchedule: finalSchedule,
      subjects: finalSubjects
    };

    if (editingTeacherId) {
      // Update
      onUpdateTeacher({
        ...profileData,
        id: editingTeacherId,
      } as Teacher);
      setEditingTeacherId(null);
    } else {
      // Add
      onAddTeacher(profileData as Partial<Teacher>);
    }

    // Reset Form
    setTeacherName('');
    setTeacherSchedule('weekly');
    setSelectedSubjects([]);
    setDynamicTeacherValues({});
  };

  // Trigger Edit Mode for Teacher
  const handleEditTeacherClick = (teach: Teacher) => {
    setEditingTeacherId(teach.id);
    setTeacherName(teach.name);
    setTeacherSchedule(teach.classSchedule);
    setSelectedSubjects(teach.subjects);
    setDynamicTeacherValues(teach);
  };

  const handleCancelEdit = () => {
    setEditingTeacherId(null);
    setTeacherName('');
    setTeacherSchedule('weekly');
    setSelectedSubjects([]);
    setDynamicTeacherValues({});
  };

  const handleToggleVisibility = (key: keyof VisibilitySettings) => {
    onUpdateVisibilitySettings({
      ...visibilitySettings,
      [key]: !visibilitySettings[key]
    });
  };

  const handleToggleFieldEnabled = (fieldId: string) => {
    if (activeEditForm === 'student') {
      const updated = studentFields.map(f => f.id === fieldId ? { ...f, enabled: !f.enabled } : f);
      onUpdateStudentFields(updated);
    } else if (activeEditForm === 'teacher') {
      const updated = teacherFields.map(f => f.id === fieldId ? { ...f, enabled: !f.enabled } : f);
      onUpdateTeacherFields(updated);
    }
  };

  const handleToggleFieldRequired = (fieldId: string) => {
    if (activeEditForm === 'student') {
      const updated = studentFields.map(f => f.id === fieldId ? { ...f, required: !f.required } : f);
      onUpdateStudentFields(updated);
    } else if (activeEditForm === 'teacher') {
      const updated = teacherFields.map(f => f.id === fieldId ? { ...f, required: !f.required } : f);
      onUpdateTeacherFields(updated);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    if (activeEditForm === 'student') {
      const updated = studentFields.filter(f => f.id !== fieldId);
      onUpdateStudentFields(updated);
    } else if (activeEditForm === 'teacher') {
      const updated = teacherFields.filter(f => f.id !== fieldId);
      onUpdateTeacherFields(updated);
    }
  };

  const handleAddNewCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    // Generate a simple valid identifier
    const generatedId = 'custom_' + newFieldName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if ID already exists
    const fields = activeEditForm === 'student' ? studentFields : teacherFields;
    if (fields.some(f => f.id === generatedId)) {
      alert(lang === 'ur' ? 'یہ فیلڈ پہلے ہی موجود ہے!' : 'A field with this name already exists!');
      return;
    }

    const optionsList = newFieldOptionsStr.trim() 
      ? newFieldOptionsStr.split(',').map(o => o.trim()).filter(Boolean) 
      : undefined;

    const newField: CustomField = {
      id: generatedId,
      name: newFieldName.trim(),
      nameUr: newFieldNameUr.trim() || undefined,
      type: newFieldType,
      placeholder: newFieldPlaceholder.trim() || undefined,
      placeholderUr: newFieldPlaceholderUr.trim() || undefined,
      required: newFieldRequired,
      enabled: true,
      options: optionsList,
      isSystem: false
    };

    if (activeEditForm === 'student') {
      onUpdateStudentFields([...studentFields, newField]);
    } else if (activeEditForm === 'teacher') {
      onUpdateTeacherFields([...teacherFields, newField]);
    }

    // Reset states
    setNewFieldName('');
    setNewFieldNameUr('');
    setNewFieldType('text');
    setNewFieldPlaceholder('');
    setNewFieldPlaceholderUr('');
    setNewFieldRequired(false);
    setNewFieldOptionsStr('');
  };

  const handleStartEditField = (field: CustomField) => {
    setEditingFieldId(field.id);
    setEditingFieldName(field.name);
    setEditingFieldNameUr(field.nameUr || '');
    setEditingFieldPlaceholder(field.placeholder || '');
    setEditingFieldPlaceholderUr(field.placeholderUr || '');
    setEditingFieldOptionsStr(field.options ? field.options.join(', ') : '');
    setEditingFieldRequired(field.required);
  };

  const handleSaveEditedField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFieldId) return;

    const optionsList = editingFieldOptionsStr.trim()
      ? editingFieldOptionsStr.split(',').map(o => o.trim()).filter(Boolean)
      : undefined;

    const fieldsList = activeEditForm === 'student' ? studentFields : teacherFields;
    const updated = fieldsList.map((f) => {
      if (f.id === editingFieldId) {
        return {
          ...f,
          name: editingFieldName.trim(),
          nameUr: editingFieldNameUr.trim() || undefined,
          placeholder: editingFieldPlaceholder.trim() || undefined,
          placeholderUr: editingFieldPlaceholderUr.trim() || undefined,
          required: editingFieldRequired,
          options: optionsList
        };
      }
      return f;
    });

    if (activeEditForm === 'student') {
      onUpdateStudentFields(updated);
    } else if (activeEditForm === 'teacher') {
      onUpdateTeacherFields(updated);
    }

    // Reset
    setEditingFieldId(null);
  };

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 border border-slate-100 shadow-md">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5 mb-5">
        <Shield className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg md:text-xl font-extrabold text-slate-800">
          {t.adminPanel}
        </h2>
      </div>

      {/* Navigation Sub-tabs for Admin functions (Responsive layout for 9 tabs) */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1 bg-slate-100 p-1 rounded-2xl mb-6">
        <button
          onClick={() => setSubTab('attendance')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'attendance'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          <span>{lang === 'ur' ? 'طالب علم' : 'Student Rec'}</span>
        </button>

        <button
          onClick={() => setSubTab('performance')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'performance'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          <span>{t.attendancePerformance}</span>
        </button>

        <button
          onClick={() => setSubTab('categories')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'categories'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-500" />
          <span>{lang === 'ur' ? 'کیٹیگریز' : 'Categories'}</span>
        </button>

        <button
          onClick={() => setSubTab('dashboard')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'dashboard'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Grid className="w-3.5 h-3.5 text-indigo-500" />
          <span>{lang === 'ur' ? 'ڈیش بورڈ' : 'Dashboard'}</span>
        </button>

        <button
          onClick={() => setSubTab('teachers')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'teachers'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <span className="text-xs">🎓</span>
          <span>{lang === 'ur' ? 'ٹیچرز' : 'Teachers'}</span>
        </button>

        <button
          onClick={() => setSubTab('students')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'students'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <span className="text-xs">👨‍🎓</span>
          <span>{lang === 'ur' ? 'ایڈ اسٹوڈنٹ' : 'Add Student'}</span>
        </button>

        <button
          onClick={() => setSubTab('settings')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'settings'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>{t.settings}</span>
        </button>

        <button
          onClick={() => setSubTab('hide')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'hide'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <EyeOff className="w-3.5 h-3.5 text-rose-500" />
          <span>{lang === 'ur' ? 'چھپائیں' : 'Hide Tab'}</span>
        </button>

        <button
          onClick={() => setSubTab('edit-forms')}
          className={`py-2 px-1 rounded-xl text-[10px] md:text-xs font-bold flex flex-col md:flex-row items-center justify-center gap-1 transition-all-custom cursor-pointer ${
            subTab === 'edit-forms'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <span className="text-xs">📝</span>
          <span>{lang === 'ur' ? 'فارم تبدیل کریں' : 'Edit Forms'}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB: Attendance Performance */}
        {subTab === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <AttendancePerformance
              responses={responses}
              categories={categories}
              lang={lang}
            />
          </motion.div>
        )}

        {/* TAB 1: Attendance Management */}
        {subTab === 'attendance' && (
          <motion.div
            key="attendance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onExportCSV}
                className="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all-custom text-center"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{t.exportCsv}</span>
              </button>

              <button
                onClick={onClearAll}
                className="py-3 px-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all-custom text-center"
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>{t.clearData}</span>
              </button>
            </div>

            {/* List of responses to modify */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span>👤</span> {t.manageResponses} ({responses.length})
              </h3>

              <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-inner max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {lang === 'ur' ? 'نام / کلاس' : 'Name / Class'}
                      </th>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                        {lang === 'ur' ? 'جواب' : 'Status'}
                      </th>
                      <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        {lang === 'ur' ? 'ایکشن' : 'Action'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {responses.length > 0 ? (
                      responses.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-slate-800 text-sm font-sans">{r.name}</div>
                            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                              <span>{r.category}</span>
                              {r.session && (
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-[10px] font-extrabold text-indigo-600 rounded">
                                  {lang === 'ur' ? `سیشن: ${r.session}` : `Session: ${r.session}`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'yes'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {r.status === 'yes' ? '✅ Yes' : '❌ No'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onDeleteEntry(r.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-xs font-medium text-slate-400">
                          {t.noResponses}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: Class Categories Management */}
        {subTab === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>🏷️</span> {t.manageCategories}
            </h3>

            {/* List of categories */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {categories.map((cat, index) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50"
                >
                  <span className="text-sm font-bold text-slate-700">{cat}</span>
                  <button
                    onClick={() => onDeleteCategory(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                    title="Delete category"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder={t.newCategory}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800"
              />
              <button
                type="submit"
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-indigo-100 transition-all cursor-pointer text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t.add}</span>
              </button>
            </form>
          </motion.div>
        )}

        {/* TAB 3: Dashboard Show/Hide Toggle */}
        {subTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-600" />
                <span>{t.showHideCategories}</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-1">
                {lang === 'ur'
                  ? 'ان کیٹیگریز کو منتخب کریں جنہیں آپ ہوم پیج پر دکھانا یا چھپانا چاہتے ہیں۔'
                  : 'Toggle which category attendance boxes appear on the homepage.'}
              </p>
            </div>

            {/* List of categories with visibility switches */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isHidden = hiddenCategories.includes(cat);
                return (
                  <div
                    key={cat}
                    onClick={() => onToggleCategoryVisibility(cat)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isHidden 
                        ? 'border-slate-200 bg-slate-50/50 opacity-60' 
                        : 'border-indigo-100 bg-indigo-50/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full ${isHidden ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                      <span className="text-sm font-bold text-slate-800">{cat}</span>
                    </div>

                    <button
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-all border ${
                        isHidden
                          ? 'border-slate-300 text-slate-500 bg-white'
                          : 'border-emerald-500 text-emerald-700 bg-emerald-50'
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>{lang === 'ur' ? 'پوشیدہ' : 'Hidden'}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'ur' ? 'ظاہر' : 'Visible'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-400 font-semibold italic">
                  {lang === 'ur' ? 'کوئی کیٹیگری دستیاب نہیں ہے۔' : 'No categories available.'}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: Teachers Management & Log */}
        {subTab === 'teachers' && (
          <motion.div
            key="teachers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Subsection 1: Add/Edit Teacher */}
            <div className="p-4 border border-slate-100 bg-slate-50/30 rounded-2xl space-y-3.5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>{editingTeacherId ? (lang === 'ur' ? 'استاد کی معلومات اپ ڈیٹ کریں' : 'Edit Teacher Profile') : t.addTeacher}</span>
                {editingTeacherId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-[10px] text-rose-500 hover:underline font-bold"
                  >
                    {t.cancel}
                  </button>
                )}
              </h3>

              <form onSubmit={handleTeacherSubmit} className="space-y-3">
                {teacherFields.filter(f => f.enabled).map((field) => {
                  const label = lang === 'ur' && field.nameUr ? field.nameUr : field.name;
                  const placeholder = lang === 'ur' && field.placeholderUr ? field.placeholderUr : (field.placeholder || '');
                  
                  if (field.id === 'name') {
                    return (
                      <div key={field.id}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          {label}:
                        </label>
                        <input
                          type="text"
                          value={dynamicTeacherValues['name'] !== undefined ? dynamicTeacherValues['name'] : teacherName}
                          onChange={(e) => {
                            setTeacherName(e.target.value);
                            setDynamicTeacherValues({ ...dynamicTeacherValues, name: e.target.value });
                          }}
                          placeholder={placeholder || (lang === 'ur' ? 'استاد کا نام لکھیں...' : "Teacher Name (e.g. Sir Noman)")}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          required={field.required}
                        />
                      </div>
                    );
                  }

                  if (field.id === 'classSchedule') {
                    const currentSchedule = dynamicTeacherValues['classSchedule'] !== undefined ? dynamicTeacherValues['classSchedule'] : teacherSchedule;
                    return (
                      <div key={field.id}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          {label}:
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['weekly', 'monthly', 'both'] as const).map((sc) => {
                            const isSelected = currentSchedule === sc;
                            return (
                              <button
                                key={sc}
                                type="button"
                                onClick={() => {
                                  setTeacherSchedule(sc);
                                  setDynamicTeacherValues({ ...dynamicTeacherValues, classSchedule: sc });
                                }}
                                className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {sc === 'weekly' && t.weeklyTeacher}
                                {sc === 'monthly' && t.monthlyTeacher}
                                {sc === 'both' && t.bothTeacher}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (field.id === 'subjects') {
                    const currentSubjects = dynamicTeacherValues['subjects'] !== undefined ? dynamicTeacherValues['subjects'] : selectedSubjects;
                    return (
                      <div key={field.id}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                          {label}:
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {ALL_SUBJECTS.map((sub) => {
                            const isSelected = currentSubjects.includes(sub);
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => {
                                  const updated = isSelected 
                                    ? currentSubjects.filter((s: string) => s !== sub)
                                    : [...currentSubjects, sub];
                                  setSelectedSubjects(updated);
                                  setDynamicTeacherValues({ ...dynamicTeacherValues, subjects: updated });
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                {isSelected && <span className="mr-0.5 font-sans font-bold">✓ </span>}
                                <span>{sub}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Non-system / Custom input fields
                  return (
                    <div key={field.id}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        {label}:
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={dynamicTeacherValues[field.id] || ''}
                          onChange={(e) => setDynamicTeacherValues({ ...dynamicTeacherValues, [field.id]: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          required={field.required}
                        >
                          <option value="">{placeholder || (lang === 'ur' ? 'منتخب کریں...' : 'Select...')}</option>
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={dynamicTeacherValues[field.id] || ''}
                          onChange={(e) => setDynamicTeacherValues({ ...dynamicTeacherValues, [field.id]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          required={field.required}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-indigo-100 transition-all cursor-pointer text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{editingTeacherId ? (lang === 'ur' ? 'تبدیلی محفوظ کریں' : 'Update Profile') : t.addTeacher}</span>
                </button>
              </form>
            </div>

            {/* Subsection 2: Registered Teachers List */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <span>📋</span> {t.teacherList} ({teachers.length})
              </h3>

              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[180px] overflow-y-auto shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-2.5">{lang === 'ur' ? 'استاد کا نام' : 'Name'}</th>
                      <th className="p-2.5 text-center">{lang === 'ur' ? 'مضامین' : 'Subjects'}</th>
                      <th className="p-2.5 text-right">{lang === 'ur' ? 'ایکشن' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teachers.length > 0 ? (
                      teachers.map((teach) => (
                        <tr key={teach.id} className="hover:bg-slate-50/50 text-xs">
                          <td className="p-2.5">
                            <div className="font-extrabold text-slate-800 font-sans">{teach.name}</div>
                            <div className="text-[9px] text-indigo-500 uppercase font-bold">{teach.classSchedule}</div>
                          </td>
                          <td className="p-2.5 text-center">
                            <div className="flex flex-wrap gap-0.5 justify-center">
                              {teach.subjects.map((sub) => (
                                <span key={sub} className="px-1 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-600 rounded">
                                  {sub}
                                </span>
                              ))}
                              {teach.subjects.length === 0 && (
                                <span className="text-[9px] text-slate-400 italic">No Subjects</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditTeacherClick(teach)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Edit teacher details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteTeacher(teach.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                                title="Delete teacher profile"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-5 text-[11px] font-medium text-slate-400 italic">
                          {t.noTeachers}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subsection 3: Teacher Attendance Responses */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  🎓 {t.teacherAttendanceTab} ({teacherResponses.length})
                </h3>
                
                <div className="flex gap-1.5">
                  <button
                    onClick={onExportTeacherCSV}
                    className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={onClearTeacherResponses}
                    className="py-1 px-2.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[10px] flex items-center gap-1 border border-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[200px] overflow-y-auto shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-2.5">{lang === 'ur' ? 'تفصیل' : 'Teacher Details'}</th>
                      <th className="p-2.5 text-center">{lang === 'ur' ? 'جواب' : 'Status'}</th>
                      <th className="p-2.5 text-right">{lang === 'ur' ? 'ایکشن' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teacherResponses.length > 0 ? (
                      teacherResponses.map((tr) => (
                        <tr key={tr.id} className="hover:bg-slate-50/50 text-xs">
                          <td className="p-2.5">
                            <div className="font-extrabold text-slate-800 font-sans">{tr.name}</div>
                            <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                              {tr.subject} • <span className="uppercase text-[9px] bg-indigo-50 px-1 rounded">{tr.classSchedule}</span>
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                              📅 {tr.date} {tr.time}
                            </div>
                            {tr.reason && (
                              <div className="text-[10px] text-rose-500 font-semibold bg-rose-50/50 p-1.5 rounded-lg mt-1 border border-rose-100/50">
                                💬 {tr.reason}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                tr.status === 'yes'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {tr.status === 'yes' ? '✅ Yes' : '❌ No'}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => onDeleteTeacherResponse(tr.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Delete attendance log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-xs text-slate-400 italic font-medium">
                          {t.noResponses}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4.5: Students Panel */}
        {subTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Subsection 1: Add / Edit Student Profile */}
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/80">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                {editingStudentId 
                  ? (lang === 'ur' ? 'طالب علم کی معلومات تبدیل کریں' : 'Edit Student Profile') 
                  : (lang === 'ur' ? 'نیا طالب علم شامل کریں' : 'Register New Student')
                }
              </h3>

              <form onSubmit={handleStudentSubmit} className="space-y-3">
                {studentFields.filter(f => f.enabled).map((field) => {
                  const label = lang === 'ur' && field.nameUr ? field.nameUr : field.name;
                  const placeholder = lang === 'ur' && field.placeholderUr ? field.placeholderUr : (field.placeholder || '');
                  
                  if (field.id === 'name') {
                    return (
                      <div key={field.id}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          {label}:
                        </label>
                        <input
                          type="text"
                          value={dynamicStudentValues['name'] !== undefined ? dynamicStudentValues['name'] : studentName}
                          onChange={(e) => {
                            setStudentName(e.target.value);
                            setDynamicStudentValues({ ...dynamicStudentValues, name: e.target.value });
                          }}
                          placeholder={placeholder || (lang === 'ur' ? 'طالب علم کا نام لکھیں...' : "Student Name (e.g. Muhammad Ali)")}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          required={field.required}
                        />
                      </div>
                    );
                  }

                  if (field.id === 'category') {
                    return (
                      <div key={field.id}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          {label}:
                        </label>
                        <select
                          value={dynamicStudentValues['category'] !== undefined ? dynamicStudentValues['category'] : studentCategory}
                          onChange={(e) => {
                            setStudentCategory(e.target.value);
                            setDynamicStudentValues({ ...dynamicStudentValues, category: e.target.value });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.id === 'classType') {
                    return (
                      <div key={field.id}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          {label}:
                        </label>
                        <select
                          value={dynamicStudentValues['classType'] !== undefined ? dynamicStudentValues['classType'] : studentClassType}
                          onChange={(e) => {
                            setStudentClassType(e.target.value);
                            setDynamicStudentValues({ ...dynamicStudentValues, classType: e.target.value });
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                        >
                          <option value="weekly">{lang === 'ur' ? 'ہفتہ وار کلاس (Weekly Class)' : 'Weekly Class'}</option>
                          <option value="daily">{lang === 'ur' ? 'روزانہ (30 دن کی کلاس) (Daily Class)' : 'Daily (30 days class)'}</option>
                          <option value="26days">{lang === 'ur' ? '26 دن کی کلاس (26 Days class)' : '26 Days class'}</option>
                          <option value="24days">{lang === 'ur' ? '24 دن کی کلاس (24 Days class)' : '24 Days class'}</option>
                          <option value="20days">{lang === 'ur' ? '20 دن کی کلاس (20 Days class)' : '20 Days class'}</option>
                          <option value="15days">{lang === 'ur' ? '15 دن کی کلاس (15 Days class)' : '15 Days class'}</option>
                        </select>
                      </div>
                    );
                  }

                  if (field.id === 'session') {
                    return (
                      <div key={field.id} className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            {lang === 'ur' ? 'سیشن شروع (سال):' : 'Session Start Year:'}
                          </label>
                          <select
                            value={studentStartYear}
                            onChange={(e) => {
                              setStudentStartYear(e.target.value);
                              const newSession = `${e.target.value}-${studentEndYear}`;
                              setDynamicStudentValues({ ...dynamicStudentValues, session: newSession });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          >
                            {YEARS_LIST.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                            {lang === 'ur' ? 'سیشن ختم (سال):' : 'Session End Year:'}
                          </label>
                          <select
                            value={studentEndYear}
                            onChange={(e) => {
                              setStudentEndYear(e.target.value);
                              const newSession = `${studentStartYear}-${e.target.value}`;
                              setDynamicStudentValues({ ...dynamicStudentValues, session: newSession });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          >
                            {YEARS_LIST.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  }

                  // Non-system / Custom input fields (e.g. Roll Number, Student ID)
                  return (
                    <div key={field.id}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        {label}:
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={dynamicStudentValues[field.id] || ''}
                          onChange={(e) => setDynamicStudentValues({ ...dynamicStudentValues, [field.id]: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          required={field.required}
                        >
                          <option value="">{placeholder || (lang === 'ur' ? 'منتخب کریں...' : 'Select...')}</option>
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={dynamicStudentValues[field.id] || ''}
                          onChange={(e) => setDynamicStudentValues({ ...dynamicStudentValues, [field.id]: e.target.value })}
                          placeholder={placeholder}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                          required={field.required}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Submit button */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-indigo-100 transition-all cursor-pointer text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {editingStudentId 
                        ? (lang === 'ur' ? 'تبدیلی محفوظ کریں' : 'Update Profile') 
                        : (lang === 'ur' ? 'طالب علم شامل کریں' : 'Add Student')
                      }
                    </span>
                  </button>
                  {editingStudentId && (
                    <button
                      type="button"
                      onClick={handleCancelStudentEdit}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer border border-slate-200 transition-all"
                    >
                      {lang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Subsection 2: Registered Students List */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <span>📋</span> {lang === 'ur' ? 'رجسٹرڈ طالب علموں کی فہرست' : 'Registered Students List'} ({students.length})
              </h3>

              <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto shadow-inner animate-fade-in">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-2.5">{lang === 'ur' ? 'طالب علم کا نام' : 'Student Name'}</th>
                      <th className="p-2.5 text-center">{lang === 'ur' ? 'کیٹیگری' : 'Category'}</th>
                      <th className="p-2.5 text-right">{lang === 'ur' ? 'ایکشن' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.length > 0 ? (
                      students.map((stud) => (
                        <tr key={stud.id} className="hover:bg-slate-50/50 text-xs">
                          <td className="p-2.5">
                            <div className="font-extrabold text-slate-800 font-sans">{stud.name}</div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              {stud.session && (
                                <span className="text-[10px] text-slate-400 font-bold">
                                  {lang === 'ur' ? `سیشن: ${stud.session}` : `Session: ${stud.session}`}
                                </span>
                              )}
                              {stud.classType && (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-[9px] font-extrabold text-emerald-600 rounded uppercase tracking-wider">
                                  {lang === 'ur'
                                    ? (stud.classType === 'weekly' ? 'ہفتہ وار' 
                                       : stud.classType === 'daily' ? 'روزانہ'
                                       : stud.classType === '26days' ? '26 دن'
                                       : stud.classType === '24days' ? '24 دن'
                                       : stud.classType === '20days' ? '20 دن'
                                       : stud.classType === '15days' ? '15 دن'
                                       : stud.classType)
                                    : (stud.classType === 'weekly' ? 'Weekly' 
                                       : stud.classType === 'daily' ? 'Daily'
                                       : stud.classType === '26days' ? '26 Days'
                                       : stud.classType === '24days' ? '24 Days'
                                       : stud.classType === '20days' ? '20 Days'
                                       : stud.classType === '15days' ? '15 Days'
                                       : stud.classType)
                                  }
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-1 bg-indigo-50 text-[10px] font-bold text-indigo-600 rounded-lg">
                              {stud.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditStudentClick(stud)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                title="Edit student details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteStudent(stud.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                                title="Delete student profile"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-5 text-[11px] font-medium text-slate-400 italic">
                          {lang === 'ur' ? 'ابھی تک کوئی طالب علم شامل نہیں کیا گیا' : 'No students registered yet. Use form to add.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: Settings Panel */}
        {subTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Class Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t.classTitle}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm bg-white"
                  required
                />
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {t.startTime}
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {t.endTime}
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm bg-white"
                    required
                  />
                </div>
              </div>

              {/* Admin Password Override */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t.adminPassword}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800 text-sm bg-white"
                />
              </div>

              {/* Submit Save */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer mt-4"
              >
                {t.saveSettings}
              </button>
            </form>
          </motion.div>
        )}

        {/* TAB: Visibility (Hide/Show Toggles) */}
        {subTab === 'hide' && (
          <motion.div
            key="hide-settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6 animate-fade-in"
          >
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
              <Eye className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-black text-slate-800 mb-0.5">
                  {lang === 'ur' ? 'ہوم پیج اور مینو بار کنٹرول پینل' : 'Home Page & Menu Bar Control Panel'}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  {lang === 'ur' 
                    ? 'ایڈمن یہاں سے ہوم پیج یا ہیمبرگر مینو کی کسی بھی فیلڈ کو کسی بھی وقت چھپا یا دکھا سکتا ہے۔' 
                    : 'Toggle the visibility of specific components on the Home page or the hamburger navigation menu anytime.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* SECTION: NAVIGATION / MENU BAR */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  {lang === 'ur' ? 'ہیمبرگر مینو بار' : 'Hamburger Menu Bar'}
                </h4>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4 shadow-sm">
                  {/* Item 1 */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-700">
                        {lang === 'ur' ? 'طالب علم حاضری رجسٹر (ہیمبرگر مینو)' : 'Student Attendance (Hamburger Menu)'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {lang === 'ur' ? 'ہیمبرگر مینو بار میں طالب علم حاضری کا بٹن چھپائیں یا دکھائیں' : 'Show or hide the student attendance page option in the top-right menu.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility('showStudentAttendanceMenu')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        visibilitySettings.showStudentAttendanceMenu ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          visibilitySettings.showStudentAttendanceMenu ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: HOME PAGE ELEMENTS */}
              <div>
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  {lang === 'ur' ? 'ہوم پیج کے اجزاء' : 'Home Page Components'}
                </h4>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 divide-y divide-slate-100 space-y-4 shadow-sm">
                  {/* Item 2 */}
                  <div className="flex items-center justify-between gap-4 pt-0">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-700">
                        {lang === 'ur' ? 'طالب علم حاضری کارڈ (ہوم پیج بینر)' : 'Student Attendance Card (Home Banner)'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {lang === 'ur' ? 'ہوم پیج پر طالب علم حاضری کا شارٹ کٹ کارڈ دکھائیں یا چھپائیں' : 'Show or hide the direct shortcut banner to student attendance on the Home page.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility('showStudentAttendanceHomeLink')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        visibilitySettings.showStudentAttendanceHomeLink ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          visibilitySettings.showStudentAttendanceHomeLink ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-700">
                        {lang === 'ur' ? 'لائیو کلاس کارڈ (ٹائٹل اور ٹائم)' : 'Live Class Header Card'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {lang === 'ur' ? 'ہوم پیج کے سب سے اوپر لائیو سیشن اور کارڈ کو چھپائیں یا دکھائیں' : 'Show or hide Sunday college class information header card on the Home page.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility('showHeaderCard')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        visibilitySettings.showHeaderCard ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          visibilitySettings.showHeaderCard ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-700">
                        {lang === 'ur' ? 'حاضری کاؤنٹرز (اعداد و شمار)' : 'Attendance Statistics Counters'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {lang === 'ur' ? 'کلاس وائز حاضری اور نہ آنے والوں کے کاؤنٹرز چھپائیں یا دکھائیں' : 'Show or hide the grid showing count of Present and Absent students on the Home page.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility('showStatsGrid')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        visibilitySettings.showStatsGrid ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          visibilitySettings.showStatsGrid ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* New Item: Overall Stats summary card boxes */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-700">
                        {lang === 'ur' ? 'ٹوٹل بتانے والے باکسز (حاضر / غیر حاضر / کل)' : 'Total Summary Counters (Present / Absent / Total)'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {lang === 'ur' ? 'ہوم پیج پر حاضر، غیر حاضر، اور کل حاضری کے بنیادی خلاصہ باکسز چھپائیں یا دکھائیں' : 'Show or hide the main summary counters row (Coming, Not Coming, Total) on the Home page.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility('showMainStats')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        visibilitySettings.showMainStats ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          visibilitySettings.showMainStats ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-700">
                        {lang === 'ur' ? 'اسٹوڈنٹ حاضری فارم (RSVP فارم)' : 'Student RSVP Response Form'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {lang === 'ur' ? 'ہوم پیج پر طلباء کی حاضری جمع کرانے کا فارم چھپائیں یا دکھائیں' : 'Show or hide the main Student response submission input card on the Home page.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility('showVoteForm')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        visibilitySettings.showVoteForm ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          visibilitySettings.showVoteForm ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Item 6 */}
                  <div className="flex items-center justify-between gap-4 pt-4">
                    <div className="space-y-0.5">
                      <div className="text-xs font-extrabold text-slate-700">
                        {lang === 'ur' ? 'حاضری لاگز (حالیہ فارم لسٹ)' : 'Recent Submissions Log'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold">
                        {lang === 'ur' ? 'ہوم پیج پر طلباء کے حالیہ جمع شدہ حاضری کے ناموں کی فہرست چھپائیں یا دکھائیں' : 'Show or hide the real-time student response list at the bottom of the Home page.'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleVisibility('showRecentResponses')}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        visibilitySettings.showRecentResponses ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          visibilitySettings.showRecentResponses ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: Edit Attendance Forms */}
        {subTab === 'edit-forms' && activeEditForm === null && (
          <motion.div
            key="edit-forms-menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-3">
              <span className="text-xl">📝</span>
              <div>
                <h3 className="text-sm font-black text-slate-800 mb-0.5">
                  {lang === 'ur' ? 'حاضری فارمز ایڈٹ پینل' : 'Edit Attendance Forms'}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                  {lang === 'ur' 
                    ? 'یہاں سے آپ طلباء یا اساتذہ کے حاضری فارم کے آپشنز اور فیلڈز کو تبدیل، نیا فیلڈ شامل یا حذف کر سکتے ہیں۔' 
                    : 'Customize attendance forms. Modify, toggle visibility, add new custom fields or delete existing custom options.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Student Form */}
              <div 
                onClick={() => setActiveEditForm('student')}
                className="bg-white hover:bg-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all-custom cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                    👨‍🎓
                  </div>
                  <h4 className="text-sm font-black text-slate-800 mb-1">
                    {lang === 'ur' ? 'طالب علم حاضری فارم (Student Form)' : 'Student Attendance Form'}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold mb-4">
                    {lang === 'ur' 
                      ? 'رول نمبر، نام، کلاس، سیکشن، اور دیگر کسٹم فیلڈز شامل یا تبدیل کریں۔' 
                      : 'Customize roll number, name, class, extra fields, auto-fill logic and toggles.'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold">
                    <span className="bg-slate-100 px-2 py-1 rounded-lg">
                      {lang === 'ur' ? `کل فیلڈز: ${studentFields.length}` : `Total Fields: ${studentFields.length}`}
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                      {lang === 'ur' ? `فعال: ${studentFields.filter(f => f.enabled).length}` : `Active: ${studentFields.filter(f => f.enabled).length}`}
                    </span>
                  </div>
                </div>
                <button className="mt-6 w-full py-2 px-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1">
                  <span>{lang === 'ur' ? 'تبدیل کریں' : 'Edit Form'}</span>
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card 2: Teacher Form */}
              <div 
                onClick={() => setActiveEditForm('teacher')}
                className="bg-white hover:bg-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all-custom cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                    🎓
                  </div>
                  <h4 className="text-sm font-black text-slate-800 mb-1">
                    {lang === 'ur' ? 'ٹیچر حاضری فارم (Teacher Form)' : 'Staff/Teacher Attendance Form'}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold mb-4">
                    {lang === 'ur' 
                      ? 'اساتذہ کے نام، مضامین، کلاسز اور دیگر کسٹم فیلڈز شامل یا تبدیل کریں۔' 
                      : 'Customize teacher profile forms, available subjects, status questions and extra options.'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold">
                    <span className="bg-slate-100 px-2 py-1 rounded-lg">
                      {lang === 'ur' ? `کل فیلڈز: ${teacherFields.length}` : `Total Fields: ${teacherFields.length}`}
                    </span>
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                      {lang === 'ur' ? `فعال: ${teacherFields.filter(f => f.enabled).length}` : `Active: ${teacherFields.filter(f => f.enabled).length}`}
                    </span>
                  </div>
                </div>
                <button className="mt-6 w-full py-2 px-4 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1">
                  <span>{lang === 'ur' ? 'تبدیل کریں' : 'Edit Form'}</span>
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === 'edit-forms' && activeEditForm !== null && (
          <motion.div
            key="edit-forms-active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Header with Close X Button */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setActiveEditForm(null); setEditingFieldId(null); }}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-extrabold text-sm"
                  title="Go Back"
                >
                  <span className="text-base">←</span>
                </button>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {activeEditForm === 'student' 
                      ? (lang === 'ur' ? 'طالب علم حاضری فارم کی تخصیص' : 'Customize Student Attendance Form')
                      : (lang === 'ur' ? 'ٹیچر حاضری فارم کی تخصیص' : 'Customize Teacher Attendance Form')
                    }
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {lang === 'ur' ? 'تمام فیلڈز کو منظم کریں' : 'Configure input fields, labels and parameters'}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => { setActiveEditForm(null); setEditingFieldId(null); }}
                className="py-1 px-2.5 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg transition-colors cursor-pointer font-bold text-[11px] flex items-center gap-1 border border-transparent hover:border-rose-100"
              >
                <span>{lang === 'ur' ? 'بند کریں' : 'Close'}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* COLUMN 1: CURRENT FIELDS LIST (col-span-7) */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
                  {lang === 'ur' ? 'موجودہ فارم فیلڈز کی فہرست' : 'Current Form Fields'}
                </h4>

                <div className="space-y-3">
                  {(activeEditForm === 'student' ? studentFields : teacherFields).map((field) => {
                    const isSystem = field.isSystem;
                    const isEditing = editingFieldId === field.id;

                    if (isEditing) {
                      return (
                        <form 
                          key={field.id}
                          onSubmit={handleSaveEditedField}
                          className="bg-slate-50 border border-indigo-200 rounded-2xl p-4 space-y-3 shadow-inner animate-fade-in"
                        >
                          <div className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                            {lang === 'ur' ? `فیلڈ تبدیل کریں: ${field.id}` : `Edit Field: ${field.id}`}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Name (English)</label>
                              <input 
                                type="text"
                                value={editingFieldName}
                                onChange={(e) => setEditingFieldName(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">نام (اردو - اختیاری)</label>
                              <input 
                                type="text"
                                value={editingFieldNameUr}
                                onChange={(e) => setEditingFieldNameUr(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Placeholder (English)</label>
                              <input 
                                type="text"
                                value={editingFieldPlaceholder}
                                onChange={(e) => setEditingFieldPlaceholder(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">پلیس ہولڈر (اردو - اختیاری)</label>
                              <input 
                                type="text"
                                value={editingFieldPlaceholderUr}
                                onChange={(e) => setEditingFieldPlaceholderUr(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                              />
                            </div>
                          </div>

                          {field.type === 'select' && (
                            <div>
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Options (comma-separated)</label>
                              <input 
                                type="text"
                                value={editingFieldOptionsStr}
                                onChange={(e) => setEditingFieldOptionsStr(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                                placeholder="Option 1, Option 2, Option 3"
                                required
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-4 pt-1">
                            <div className="flex items-center gap-1.5">
                              <input 
                                type="checkbox"
                                id={`edit_req_${field.id}`}
                                checked={editingFieldRequired}
                                onChange={(e) => setEditingFieldRequired(e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <label htmlFor={`edit_req_${field.id}`} className="text-[10px] font-bold text-slate-600">
                                {lang === 'ur' ? 'یہ فیلڈ لازمی (Required) ہے' : 'Required Field'}
                              </label>
                            </div>

                            <div className="flex gap-1.5">
                              <button 
                                type="button"
                                onClick={() => setEditingFieldId(null)}
                                className="px-2.5 py-1 text-[10px] font-bold bg-white border border-slate-200 rounded-lg text-slate-600 cursor-pointer"
                              >
                                {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                              </button>
                              <button 
                                type="submit"
                                className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded-lg cursor-pointer"
                              >
                                {lang === 'ur' ? 'محفوظ کریں' : 'Save'}
                              </button>
                            </div>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div 
                        key={field.id}
                        className={`border rounded-2xl p-4 flex flex-col justify-between md:flex-row md:items-center gap-3 bg-white shadow-sm transition-all ${
                          field.enabled ? 'border-slate-100' : 'border-slate-100 bg-slate-50/50 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800">
                              {lang === 'ur' && field.nameUr ? field.nameUr : field.name}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 font-mono">
                              ({field.id})
                            </span>
                            {isSystem && (
                              <span className="px-1 text-[8px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-500 rounded font-sans">
                                {lang === 'ur' ? 'بنیادی' : 'System'}
                              </span>
                            )}
                            {field.required && (
                              <span className="px-1 text-[8px] font-black tracking-wider uppercase bg-rose-50 text-rose-500 rounded font-sans">
                                * {lang === 'ur' ? 'لازمی' : 'Required'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                              Type: {field.type}
                            </span>
                            {field.placeholder && (
                              <span className="text-[10px] text-slate-400 font-semibold italic">
                                Placeholder: "{lang === 'ur' && field.placeholderUr ? field.placeholderUr : field.placeholder}"
                              </span>
                            )}
                          </div>

                          {field.options && field.options.length > 0 && (
                            <div className="text-[9px] font-extrabold text-slate-500 mt-1 flex flex-wrap gap-1">
                              <span>Options:</span>
                              {field.options.map(o => (
                                <span key={o} className="px-1 bg-slate-100 rounded text-slate-600">{o}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 border-t border-slate-50 pt-2 md:pt-0 md:border-0 justify-end shrink-0">
                          {/* Toggle Switch: Enabled */}
                          <button
                            type="button"
                            onClick={() => handleToggleFieldEnabled(field.id)}
                            className={`px-2 py-1 rounded-lg font-bold text-[10px] border transition-all cursor-pointer flex items-center gap-1 ${
                              field.enabled
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                          >
                            {field.enabled ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>{lang === 'ur' ? 'دکھائیں' : 'Shown'}</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>{lang === 'ur' ? 'چھپائیں' : 'Hidden'}</span>
                              </>
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEditField(field)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                            title="Edit field details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id)}
                            disabled={isSystem}
                            className={`p-1.5 rounded transition-all ${
                              isSystem 
                                ? 'text-slate-200 cursor-not-allowed' 
                                : 'text-rose-500 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={isSystem ? "System fields cannot be deleted" : "Delete custom field"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLUMN 2: ADD NEW CUSTOM FIELD (col-span-5) */}
              <div className="lg:col-span-5">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    {lang === 'ur' ? 'نیا کسٹم فیلڈ شامل کریں' : 'Add New Custom Field'}
                  </h4>

                  <form onSubmit={handleAddNewCustomField} className="space-y-3">
                    {/* Label (English) */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Field Label (English): *
                      </label>
                      <input 
                        type="text"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        placeholder="e.g. Father's Name"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                        required
                      />
                    </div>

                    {/* Label (Urdu) */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        فیلڈ لیبل (اردو - اختیاری):
                      </label>
                      <input 
                        type="text"
                        value={newFieldNameUr}
                        onChange={(e) => setNewFieldNameUr(e.target.value)}
                        placeholder="مثال: والد کا نام"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      />
                    </div>

                    {/* Field Type selector */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Field Type:
                      </label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      >
                        <option value="text">Text Box (تحریر)</option>
                        <option value="number">Number Box (نمبر)</option>
                        <option value="select">Dropdown List (فہرست)</option>
                      </select>
                    </div>

                    {/* Options if select */}
                    {newFieldType === 'select' && (
                      <div className="animate-fade-in">
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                          Options (comma-separated): *
                        </label>
                        <input 
                          type="text"
                          value={newFieldOptionsStr}
                          onChange={(e) => setNewFieldOptionsStr(e.target.value)}
                          placeholder="e.g. Present, Absent, Sick"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                          required
                        />
                      </div>
                    )}

                    {/* Placeholder (English) */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Placeholder (English):
                      </label>
                      <input 
                        type="text"
                        value={newFieldPlaceholder}
                        onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                        placeholder="e.g. Enter Father's Name"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      />
                    </div>

                    {/* Placeholder (Urdu) */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        پلیس ہولڈر (اردو - اختیاری):
                      </label>
                      <input 
                        type="text"
                        value={newFieldPlaceholderUr}
                        onChange={(e) => setNewFieldPlaceholderUr(e.target.value)}
                        placeholder="مثال: والد کا نام درج کریں"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                      />
                    </div>

                    {/* Is Required toggle */}
                    <div className="flex items-center gap-2 py-1">
                      <input 
                        type="checkbox"
                        id="new_req"
                        checked={newFieldRequired}
                        onChange={(e) => setNewFieldRequired(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="new_req" className="text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer">
                        {lang === 'ur' ? 'یہ فیلڈ لازمی بنادیں' : 'Make this field required'}
                      </label>
                    </div>

                    {/* Submit Add Button */}
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:shadow-indigo-100 transition-all cursor-pointer text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{lang === 'ur' ? 'فیلڈ شامل کریں' : 'Add Custom Field'}</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
