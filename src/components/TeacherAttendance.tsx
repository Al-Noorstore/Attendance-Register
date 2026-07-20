import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Teacher, LanguageType, CustomField } from '../types';
import { translations } from '../lib/translations';

interface TeacherAttendanceProps {
  teachers: Teacher[];
  lang: LanguageType;
  onSubmit: (
    name: string,
    classSchedule: 'weekly' | 'monthly' | 'both',
    subject: string,
    status: 'yes' | 'no',
    reason?: string,
    extraFields?: Record<string, any>
  ) => void;
  onUpdateTeacher?: (updatedTeach: Teacher) => void;
  teacherFields?: CustomField[];
}

const ALL_SUBJECTS = ['Biochem', 'Anatomy', 'Physiology', 'Microbiology', 'Pharmaceutics', 'Pharmacology'];

export const TeacherAttendance: React.FC<TeacherAttendanceProps> = ({
  teachers = [],
  lang,
  onSubmit,
  onUpdateTeacher,
  teacherFields = []
}) => {
  const t = translations[lang];

  // Dynamic fields state variables
  const [staffId, setStaffId] = useState('');
  const [typedName, setTypedName] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [classSchedule, setClassSchedule] = useState<'weekly' | 'monthly' | 'both'>('weekly');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [status, setStatus] = useState<'yes' | 'no' | null>(null);
  const [reason, setReason] = useState('');

  // Custom non-system fields state
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  // Submit states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Add Subject states
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [selectedNewSubject, setSelectedNewSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const handleAddSubjectToProfile = () => {
    setAddError(null);
    if (!selectedTeacher) {
      setAddError(lang === 'ur' ? 'برائے مہربانی پہلے اپنا نام منتخب کریں!' : 'Please select a teacher first!');
      return;
    }

    const finalSubject = (customSubject.trim() || selectedNewSubject).trim();
    if (!finalSubject) {
      setAddError(lang === 'ur' ? 'برائے مہربانی کوئی مضمون منتخب کریں یا لکھیں!' : 'Please select or type a subject name!');
      return;
    }

    // Check if duplicate
    const isDuplicate = selectedTeacher.subjects.some(
      (sub) => sub.toLowerCase() === finalSubject.toLowerCase()
    );

    if (isDuplicate) {
      setAddError(lang === 'ur' ? 'یہ مضمون پہلے سے آپ کے پروفائل میں موجود ہے!' : 'This subject already exists in your profile!');
      return;
    }

    const updatedSubjects = [...selectedTeacher.subjects, finalSubject];
    const updatedTeacher = { ...selectedTeacher, subjects: updatedSubjects };

    if (onUpdateTeacher) {
      onUpdateTeacher(updatedTeacher);
    }

    setSelectedTeacher(updatedTeacher);
    setSelectedSubject(finalSubject);
    
    setSelectedNewSubject('');
    setCustomSubject('');
    setShowAddSubject(false);
  };

  const filteredTeachers = teachers.filter((teach) =>
    teach.name.toLowerCase().includes(typedName.toLowerCase())
  );

  const handleClearSelectedTeacher = () => {
    setSelectedTeacher(null);
    setStaffId('');
    setTypedName('');
    setClassSchedule('weekly');
    setSelectedSubject('');
    setCustomValues({});
    setFormError(null);
  };

  // Auto-fill based on specific field inputs (staffId)
  const handleAutoFill = (fieldId: 'staffId', value: string) => {
    if (!value.trim()) return;

    const match = teachers.find((teach) => {
      const matchVal = teach[fieldId] ? String(teach[fieldId]).trim().toLowerCase() : '';
      return matchVal && matchVal === value.trim().toLowerCase();
    });

    if (match) {
      setSelectedTeacher(match);
      setTypedName(match.name);
      setClassSchedule(match.classSchedule);
      if (match.subjects && match.subjects.length > 0) {
        setSelectedSubject(match.subjects[0]);
      } else {
        setSelectedSubject('');
      }

      // Auto-fill custom fields
      const updatedCustom: Record<string, any> = { ...customValues };
      teacherFields.forEach((f) => {
        if (!f.isSystem && match[f.id] !== undefined) {
          updatedCustom[f.id] = match[f.id];
        }
      });
      setCustomValues(updatedCustom);
      setFormError(null);
    }
  };

  const handleSelectTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setTypedName(teacher.name);
    setClassSchedule(teacher.classSchedule);
    if (teacher.staffId) {
      setStaffId(teacher.staffId);
    }
    if (teacher.subjects.length > 0) {
      setSelectedSubject(teacher.subjects[0]);
    } else {
      setSelectedSubject('');
    }
    setShowDropdown(false);
    setFormError(null);

    // Auto-fill custom fields
    const updatedCustom: Record<string, any> = { ...customValues };
    teacherFields.forEach((f) => {
      if (!f.isSystem && teacher[f.id] !== undefined) {
        updatedCustom[f.id] = teacher[f.id];
      }
    });
    setCustomValues(updatedCustom);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedName(val);
    if (selectedTeacher && val !== selectedTeacher.name) {
      setSelectedTeacher(null);
    }
    setShowDropdown(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate active fields
    const enabledFields = teacherFields && teacherFields.length > 0 
      ? teacherFields.filter(f => f.enabled) 
      : [];

    for (const field of enabledFields) {
      if (field.required) {
        if (field.id === 'name' && !typedName.trim()) {
          setFormError(lang === 'ur' ? 'برائے مہربانی اپنا نام درج کریں!' : 'Please enter your name!');
          return;
        }
        if (field.id === 'staffId' && !staffId.trim()) {
          setFormError(lang === 'ur' ? 'اسٹاف آئی ڈی درج کرنا لازمی ہے!' : 'Staff ID is required!');
          return;
        }
        if (field.id === 'subject' && !selectedSubject) {
          setFormError(lang === 'ur' ? 'برائے مہربانی ایک مضمون منتخب کریں!' : 'Please select a subject!');
          return;
        }
        if (!field.isSystem && (!customValues[field.id] || !String(customValues[field.id]).trim())) {
          const fieldLabel = lang === 'ur' && field.nameUr ? field.nameUr : field.name;
          setFormError(lang === 'ur' ? `${fieldLabel} درج کرنا لازمی ہے!` : `${fieldLabel} is required!`);
          return;
        }
      }
    }

    if (!typedName.trim()) {
      setFormError(lang === 'ur' ? 'برائے مہربانی اپنا نام درج کریں!' : 'Please enter your name!');
      return;
    }

    if (teacherFields.some(f => f.id === 'subject' && f.enabled) && !selectedSubject) {
      setFormError(lang === 'ur' ? 'برائے مہربانی ایک مضمون منتخب کریں!' : 'Please select a subject!');
      return;
    }

    if (!status) {
      setFormError(
        lang === 'ur'
          ? "برائے مہربانی 'I Am Coming' یا 'Can't Come' پر کلک کریں (آپ کا یہ فیلڈ رہ گیا ہے)"
          : "Please click 'I Am Coming' or 'Can't Come' to indicate your attendance"
      );
      return;
    }

    // Build the extra payload
    const extraFieldsPayload: Record<string, any> = { ...customValues };
    if (teacherFields.some(f => f.id === 'staffId' && f.enabled)) {
      extraFieldsPayload.staffId = staffId;
    }

    onSubmit(
      typedName.trim(),
      classSchedule,
      selectedSubject,
      status,
      status === 'no' ? reason.trim() : undefined,
      extraFieldsPayload
    );

    setIsSubmitted(true);
    setFormError(null);
  };

  const handleResetForm = () => {
    setTypedName('');
    setStaffId('');
    setSelectedTeacher(null);
    setClassSchedule('weekly');
    setSelectedSubject('');
    setStatus(null);
    setReason('');
    setCustomValues({});
    setIsSubmitted(false);
    setFormError(null);
    setShowAddSubject(false);
    setSelectedNewSubject('');
    setCustomSubject('');
    setAddError(null);
  };

  const availableSubjects = selectedTeacher ? selectedTeacher.subjects : ALL_SUBJECTS;

  const defaultFields: CustomField[] = [
    { id: 'name', name: 'Teacher Name', nameUr: 'استاد کا نام', type: 'text', required: true, enabled: true, isSystem: true },
    { id: 'classSchedule', name: 'Teaching Class Schedule', nameUr: 'پڑھانے کا شیڈول', type: 'select', required: true, enabled: true, isSystem: true },
    { id: 'subject', name: 'Subject', nameUr: 'مضمون', type: 'select', required: true, enabled: true, isSystem: true }
  ];
  const fieldsToRender = teacherFields && teacherFields.length > 0 
    ? teacherFields.filter(f => f.enabled) 
    : defaultFields;

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-md max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />

      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="teacher-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <span>🎓</span> {lang === 'ur' ? 'اسٹاف پورٹل' : 'Staff Portal'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                {new Date().toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {lang === 'ur' ? 'اسٹاف حاضری فارم' : 'Staff Attendance Form'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {lang === 'ur' ? 'براہ کرم اپنی حاضری کی تفصیلات درج کریں۔' : 'Please input your daily schedule details.'}
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {fieldsToRender.map((field) => {
                const label = lang === 'ur' && field.nameUr ? field.nameUr : field.name;
                const placeholder = lang === 'ur' && field.placeholderUr ? field.placeholderUr : (field.placeholder || '');

                // 1. Staff ID
                if (field.id === 'staffId') {
                  return (
                    <div key={field.id}>
                      <label htmlFor="teacher-input-staff-id" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input
                        type="text"
                        id="teacher-input-staff-id"
                        value={staffId}
                        onChange={(e) => {
                          setStaffId(e.target.value);
                          handleAutoFill('staffId', e.target.value);
                        }}
                        placeholder={placeholder || (lang === 'ur' ? 'اسٹاف آئی ڈی درج کریں...' : 'Enter Staff ID...')}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800"
                        required={field.required}
                      />
                    </div>
                  );
                }

                // 2. Teacher Name Combobox
                if (field.id === 'name') {
                  return (
                    <div key={field.id} className="relative">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex justify-between">
                        <span>{label} {field.required && <span className="text-rose-500">*</span>}</span>
                        {selectedTeacher && (
                          <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                            ✓ {lang === 'ur' ? 'تصدیق شدہ ریکارڈ' : 'Registered Teacher'}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={typedName}
                          onChange={handleNameChange}
                          onFocus={() => setShowDropdown(true)}
                          placeholder={placeholder || (lang === 'ur' ? 'اپنا نام درج کریں یا تلاش کریں...' : 'Enter your name or select...')}
                          className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800"
                          autoComplete="off"
                          required={field.required}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          {typedName.length > 0 && (
                            <button
                              type="button"
                              onClick={handleClearSelectedTeacher}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                              title={lang === 'ur' ? 'صاف کریں' : 'Clear name'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer transition-all"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Profile Matched Status Alert */}
                      {selectedTeacher && (
                        <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs text-emerald-800 animate-fade-in">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>
                              {lang === 'ur' 
                                ? `پروفائل میچ ہو گئی: ${selectedTeacher.name} (${selectedTeacher.classSchedule === 'weekly' ? 'ہفتہ وار' : selectedTeacher.classSchedule === 'monthly' ? 'روزانہ/ماہانہ' : 'دونوں'})` 
                                : `Profile Matched: ${selectedTeacher.name} (${selectedTeacher.classSchedule})`
                              }
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearSelectedTeacher}
                            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 hover:text-emerald-800 transition-all cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Combobox Dropdown */}
                      {showDropdown && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto">
                            <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                {lang === 'ur' ? 'رجسٹرڈ اساتذہ کے نام' : 'Registered Staff Names'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowDropdown(false)}
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <ul className="divide-y divide-slate-50">
                              {filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teach) => (
                                  <li key={teach.id}>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectTeacher(teach)}
                                      className="w-full px-4 py-2.5 text-left hover:bg-indigo-50/40 flex items-center justify-between transition-all cursor-pointer group"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 font-sans">
                                          {teach.name}
                                        </span>
                                        {teach.subjects && teach.subjects.length > 0 && (
                                          <span className="text-[10px] font-semibold text-slate-400">
                                            {teach.subjects.join(', ')}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg group-hover:bg-indigo-100/80">
                                        {lang === 'ur' ? 'منتخب کریں' : 'Select'}
                                      </span>
                                    </button>
                                  </li>
                                ))
                              ) : (
                                <div className="p-4 text-center text-xs text-slate-400 italic">
                                  {lang === 'ur' ? 'کوئی نام نہیں ملا، آپ خود ٹائپ کر سکتے ہیں۔' : 'No matches found. Typing manual name.'}
                                </div>
                              )}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }

                // 3. Class Schedule
                if (field.id === 'classSchedule') {
                  return (
                    <div key={field.id}>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(['weekly', 'monthly', 'both'] as const).map((type) => {
                          const isSelected = classSchedule === type;
                          const isDisabled = !!selectedTeacher;
                          return (
                            <button
                              key={type}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => setClassSchedule(type)}
                              className={`py-2 px-1 rounded-lg text-[10px] md:text-xs font-bold text-center border transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              } ${isDisabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {type === 'weekly' && t.weeklyTeacher}
                              {type === 'monthly' && t.monthlyTeacher}
                              {type === 'both' && t.bothTeacher}
                            </button>
                          );
                        })}
                      </div>
                      {selectedTeacher && (
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">
                          {lang === 'ur' ? 'شڈول ریکارڈ سے لاک کر دیا گیا ہے۔' : 'Schedule type locked from teacher profile.'}
                        </p>
                      )}
                    </div>
                  );
                }

                // 4. Subject Dropdown
                if (field.id === 'subject') {
                  return (
                    <div key={field.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {selectedTeacher && !showAddSubject && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddSubject(true);
                              setAddError(null);
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-colors cursor-pointer"
                          >
                            ➕ {t.addSubjectToProfile}
                          </button>
                        )}
                      </div>

                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-800 bg-white"
                        required={field.required}
                      >
                        <option value="">{t.selectPlaceholder}</option>
                        {availableSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>

                      {/* Existing subjects of teacher */}
                      {selectedTeacher && selectedTeacher.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTeacher.subjects.map((sub) => (
                            <span
                              key={sub}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold"
                            >
                              🔒 {sub}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add Subject panel */}
                      {selectedTeacher && showAddSubject && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 border border-indigo-100 bg-indigo-50/20 rounded-xl space-y-2 mt-2"
                        >
                          <div className="text-xs font-black text-indigo-800 uppercase tracking-wider mb-1">
                            {t.addSubjectToProfile}
                          </div>

                          {addError && (
                            <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded-lg">
                              ⚠️ {addError}
                            </p>
                          )}

                          <div className="space-y-2 text-xs font-sans">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                {t.selectOrTypeSubject}
                              </label>
                              <select
                                value={selectedNewSubject}
                                onChange={(e) => {
                                  setSelectedNewSubject(e.target.value);
                                  setCustomSubject('');
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none transition-all text-xs font-semibold text-slate-800 bg-white"
                              >
                                <option value="">{lang === 'ur' ? '-- منتخب کریں --' : '-- Select standard subject --'}</option>
                                {ALL_SUBJECTS.filter(s => !selectedTeacher.subjects.includes(s)).map((sub) => (
                                  <option key={sub} value={sub}>
                                    {sub}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">
                                {t.orWriteCustom}
                              </label>
                              <input
                                type="text"
                                value={customSubject}
                                onChange={(e) => {
                                  setCustomSubject(e.target.value);
                                  setSelectedNewSubject('');
                                }}
                                placeholder={lang === 'ur' ? 'مضمون کا نام یہاں لکھیں...' : "Type custom subject name..."}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none transition-all text-xs font-semibold text-slate-800 bg-white"
                              />
                            </div>

                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddSubject(false);
                                  setAddError(null);
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-lg text-[10px]"
                              >
                                {lang === 'ur' ? 'منسوخ' : 'Cancel'}
                              </button>
                              <button
                                type="button"
                                onClick={handleAddSubjectToProfile}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[10px]"
                              >
                                {t.addBtn}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                }

                // 5. Dynamic non-system field
                return (
                  <div key={field.id}>
                    <label htmlFor={`custom-input-${field.id}`} className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        id={`custom-input-${field.id}`}
                        value={customValues[field.id] || ''}
                        onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-700 bg-white font-sans"
                        dir={lang === 'ur' ? 'rtl' : 'ltr'}
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
                        id={`custom-input-${field.id}`}
                        value={customValues[field.id] || ''}
                        onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all font-semibold text-slate-800"
                        dir={lang === 'ur' ? 'rtl' : 'ltr'}
                        required={field.required}
                      />
                    )}
                  </div>
                );
              })}

              {/* Attendance Status */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center font-sans">
                  {t.yourResponse}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('yes');
                      setFormError(null);
                    }}
                    className={`py-3.5 px-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      status === 'yes'
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/10'
                    }`}
                  >
                    <span className="text-lg">😊</span>
                    <span>{t.iAmComing}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStatus('no');
                      setFormError(null);
                    }}
                    className={`py-3.5 px-4 rounded-xl font-bold text-sm flex flex-col items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      status === 'no'
                        ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/10'
                    }`}
                  >
                    <span className="text-lg">😔</span>
                    <span>{t.cantCome}</span>
                  </button>
                </div>
              </div>

              {/* Reason for Absence */}
              <AnimatePresence>
                {status === 'no' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        {t.reasonOptional}
                      </label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={t.reasonPlaceholder}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none transition-all text-xs font-semibold text-slate-800 resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{t.submitResponse}</span>
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="teacher-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">{t.thankYou}</h3>
              <p className="text-sm text-slate-500 font-semibold">{t.responseRecorded}</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-600 space-y-1 max-w-xs mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">{lang === 'ur' ? 'نام:' : 'Name:'}</span>
                <span className="text-slate-800 font-sans">{typedName}</span>
              </div>
              {selectedSubject && (
                <div className="flex justify-between">
                  <span className="text-slate-400">{lang === 'ur' ? 'مضمون:' : 'Subject:'}</span>
                  <span className="text-slate-800">{selectedSubject}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">{lang === 'ur' ? 'جواب:' : 'Status:'}</span>
                <span className={`font-sans ${status === 'yes' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {status === 'yes' ? t.iAmComing : t.cantCome}
                </span>
              </div>
            </div>

            <button
              onClick={handleResetForm}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              {t.submitAnother}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
