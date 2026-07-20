import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Send, PlusCircle, ChevronDown, X } from 'lucide-react';
import { LanguageType, StudentProfile, CustomField } from '../types';
import { translations } from '../lib/translations';

interface VoteFormProps {
  categories: string[];
  lang: LanguageType;
  onSubmit: (
    name: string, 
    category: string, 
    status: 'yes' | 'no', 
    reason?: string, 
    classType?: 'daily' | 'weekly', 
    session?: string,
    extraFields?: Record<string, any>
  ) => void;
  students?: StudentProfile[];
  studentFields?: CustomField[];
}

const YEARS_LIST = Array.from({ length: 21 }, (_, i) => (2020 + i).toString());

export const VoteForm: React.FC<VoteFormProps> = ({ 
  categories, 
  lang, 
  onSubmit, 
  students = [], 
  studentFields = [] 
}) => {
  const t = translations[lang];

  // Dynamic Fields States
  const [studentId, setStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [classType, setClassType] = useState<'daily' | 'weekly'>('weekly');
  const [startYear, setStartYear] = useState('2024');
  const [endYear, setEndYear] = useState('2026');
  const [status, setStatus] = useState<'yes' | 'no' | null>(null);
  const [reason, setReason] = useState('');
  
  // Custom non-system fields state
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-fill student profile dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const filteredStudents = students.filter((stud) => {
    const sName = stud.name ? stud.name.toLowerCase() : '';
    const qName = name ? name.toLowerCase() : '';
    return sName.includes(qName);
  });

  // Handle auto-fill based on specific field inputs (studentId or rollNumber)
  const handleAutoFill = (fieldId: 'studentId' | 'rollNumber', value: string) => {
    if (!value.trim()) return;

    const match = students.find((stud) => {
      const matchVal = stud[fieldId] ? String(stud[fieldId]).trim().toLowerCase() : '';
      return matchVal && matchVal === value.trim().toLowerCase();
    });

    if (match) {
      setName(match.name || '');
      setCategory(match.category || '');
      if (match.classType) {
        setClassType(match.classType as 'daily' | 'weekly');
      }
      if (match.session && match.session.includes('-')) {
        const parts = match.session.split('-');
        setStartYear(parts[0] || '2024');
        setEndYear(parts[1] || '2026');
      }
      
      const updatedCustom: Record<string, any> = { ...customValues };
      studentFields.forEach((f) => {
        if (!f.isSystem && match[f.id] !== undefined) {
          updatedCustom[f.id] = match[f.id];
        }
      });
      setCustomValues(updatedCustom);
      
      if (fieldId === 'studentId' && match.rollNumber) {
        setRollNumber(match.rollNumber);
      } else if (fieldId === 'rollNumber' && match.studentId) {
        setStudentId(match.studentId);
      }

      setSelectedProfileId(match.id);
      setFormError(null);
    }
  };

  const handleSelectStudent = (stud: StudentProfile) => {
    setName(stud.name);
    setCategory(stud.category);
    setSelectedProfileId(stud.id);
    setIsOpen(false);
    setFormError(null);
    if (stud.classType) {
      setClassType(stud.classType as 'daily' | 'weekly');
    }
    if (stud.session && stud.session.includes('-')) {
      const parts = stud.session.split('-');
      setStartYear(parts[0] || '2024');
      setEndYear(parts[1] || '2026');
    } else {
      setStartYear('2024');
      setEndYear('2026');
    }
    if (stud.studentId) setStudentId(stud.studentId);
    if (stud.rollNumber) setRollNumber(stud.rollNumber);

    const updatedCustom: Record<string, any> = { ...customValues };
    studentFields.forEach((f) => {
      if (!f.isSystem && stud[f.id] !== undefined) {
        updatedCustom[f.id] = stud[f.id];
      }
    });
    setCustomValues(updatedCustom);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setFormError(null);
    if (selectedProfileId) {
      setSelectedProfileId(null);
    }
  };

  const handleClearSelectedProfile = () => {
    setSelectedProfileId(null);
    setStudentId('');
    setRollNumber('');
    setName('');
    setCategory('');
    setStartYear('2024');
    setEndYear('2026');
    setClassType('weekly');
    setCustomValues({});
    setFormError(null);
  };

  const handleStatusSelect = (selectedStatus: 'yes' | 'no') => {
    setStatus(selectedStatus);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate active required fields
    const enabledFields = studentFields && studentFields.length > 0 
      ? studentFields.filter(f => f.enabled) 
      : [];

    for (const field of enabledFields) {
      if (field.required) {
        if (field.id === 'name' && !name.trim()) {
          setFormError(lang === 'ur' ? 'برائے مہربانی اپنا نام درج کریں!' : 'Please enter your name!');
          return;
        }
        if (field.id === 'category' && !category) {
          setFormError(lang === 'ur' ? 'برائے مہربانی اپنی کلاس منتخب کریں!' : 'Please select your class / category!');
          return;
        }
        if (field.id === 'studentId' && !studentId.trim()) {
          setFormError(lang === 'ur' ? 'طالب علم آئی ڈی درج کرنا لازمی ہے!' : 'Student ID is required!');
          return;
        }
        if (field.id === 'rollNumber' && !rollNumber.trim()) {
          setFormError(lang === 'ur' ? 'رول نمبر درج کرنا لازمی ہے!' : 'Roll Number is required!');
          return;
        }
        if (!field.isSystem && (!customValues[field.id] || !String(customValues[field.id]).trim())) {
          const fieldLabel = lang === 'ur' && field.nameUr ? field.nameUr : field.name;
          setFormError(lang === 'ur' ? `${fieldLabel} درج کرنا لازمی ہے!` : `${fieldLabel} is required!`);
          return;
        }
      }
    }

    if (name.trim().length > 0 && name.trim().length < 3) {
      setFormError(lang === 'ur' ? 'نام کم از کم 3 حروف کا ہونا چاہئے!' : 'Name must be at least 3 characters long!');
      return;
    }

    if (status === null) {
      setFormError(
        lang === 'ur'
          ? "برائے مہربانی 'I Am Coming' یا 'Can't Come' پر کلک کریں"
          : "Please click 'I Am Coming' or 'Can't Come' to indicate your attendance"
      );
      return;
    }

    if (status === 'no' && !reason.trim()) {
      setFormError(lang === 'ur' ? 'برائے مہربانی نہ آنے کی وجہ درج کریں!' : 'Please enter the reason for not coming!');
      return;
    }

    setFormError(null);

    const extraFieldsPayload: Record<string, any> = { ...customValues };
    if (studentFields.some(f => f.id === 'studentId' && f.enabled)) {
      extraFieldsPayload.studentId = studentId;
    }
    if (studentFields.some(f => f.id === 'rollNumber' && f.enabled)) {
      extraFieldsPayload.rollNumber = rollNumber;
    }

    onSubmit(
      name.trim(), 
      category, 
      status, 
      status === 'no' ? reason.trim() : undefined, 
      classType, 
      `${startYear}-${endYear}`,
      extraFieldsPayload
    );
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setStudentId('');
    setRollNumber('');
    setName('');
    setCategory('');
    setClassType('weekly');
    setStatus(null);
    setReason('');
    setCustomValues({});
    setIsSubmitted(false);
    setSelectedProfileId(null);
    setIsOpen(false);
    setStartYear('2024');
    setEndYear('2026');
    setFormError(null);
  };

  const defaultFields: CustomField[] = [
    { id: 'name', name: 'Student Name', nameUr: 'طالب علم کا نام', type: 'text', required: true, enabled: true, isSystem: true },
    { id: 'category', name: 'Category / Class', nameUr: 'کیٹیگری / کلاس', type: 'select', required: true, enabled: true, isSystem: true },
    { id: 'classType', name: 'Class Attend Type', nameUr: 'کلاس حاضری کی قسم', type: 'select', required: true, enabled: true, isSystem: true },
    { id: 'session', name: 'Session', nameUr: 'سیشن', type: 'text', required: false, enabled: true, isSystem: true }
  ];
  const fieldsToRender = studentFields && studentFields.length > 0 
    ? studentFields.filter(f => f.enabled) 
    : defaultFields;

  return (
    <div id="vote-card" className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-md mb-6 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.form
            key="vote-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className="text-xl">✍️</span> {t.yourResponse}
              </h2>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {fieldsToRender.map((field) => {
              const label = lang === 'ur' && field.nameUr ? field.nameUr : field.name;
              const placeholder = lang === 'ur' && field.placeholderUr ? field.placeholderUr : (field.placeholder || '');

              // 1. Student ID
              if (field.id === 'studentId') {
                return (
                  <div key={field.id}>
                    <label htmlFor="input-studentId" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      id="input-studentId"
                      value={studentId}
                      onChange={(e) => {
                        setStudentId(e.target.value);
                        handleAutoFill('studentId', e.target.value);
                      }}
                      placeholder={placeholder || (lang === 'ur' ? 'طالب علم آئی ڈی درج کریں...' : 'Enter Student ID...')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-800"
                      required={field.required}
                    />
                  </div>
                );
              }

              // 2. Roll Number
              if (field.id === 'rollNumber') {
                return (
                  <div key={field.id}>
                    <label htmlFor="input-roll" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="text"
                      id="input-roll"
                      value={rollNumber}
                      onChange={(e) => {
                        setRollNumber(e.target.value);
                        handleAutoFill('rollNumber', e.target.value);
                      }}
                      placeholder={placeholder || (lang === 'ur' ? 'رول نمبر درج کریں...' : 'Enter Roll Number...')}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-800"
                      required={field.required}
                    />
                  </div>
                );
              }

              // 3. Name Input with Autocomplete / Dropdown
              if (field.id === 'name') {
                return (
                  <div key={field.id} className="relative">
                    <label htmlFor="input-name" className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>{label} {field.required && <span className="text-rose-500">*</span>}</span>
                      {students.length > 0 && (
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                          {lang === 'ur' ? 'پروفائلز موجود ہیں' : 'Pre-registered'}
                        </span>
                      )}
                    </label>
                    
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        id="input-name"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder={placeholder || t.namePlaceholder}
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-800"
                        dir={lang === 'ur' ? 'rtl' : 'ltr'}
                        autoComplete="off"
                        required={field.required}
                      />
                      
                      <div className="absolute right-3 flex items-center gap-1.5">
                        {name.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearSelectedProfile}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                            title={lang === 'ur' ? 'صاف کریں' : 'Clear name'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        {students.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                            title={lang === 'ur' ? 'تمام طلباء دکھائیں' : 'Show registered students'}
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {(isOpen || (name.trim().length > 0 && filteredStudents.length > 0 && !selectedProfileId)) && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-52 overflow-y-auto"
                        >
                          <div className="p-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              {lang === 'ur' ? 'رجسٹرڈ طلباء کے نام' : 'Registered Student Names'}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsOpen(false)}
                              className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <ul className="divide-y divide-slate-50">
                            {filteredStudents.length > 0 ? (
                              filteredStudents.map((stud) => (
                                <li key={stud.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectStudent(stud)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-50/40 flex items-center justify-between transition-all cursor-pointer group"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 font-sans">
                                        {stud.name}
                                      </span>
                                      <span className="text-[10px] font-semibold text-slate-400">
                                        {stud.category}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg group-hover:bg-emerald-100/80">
                                      {lang === 'ur' ? 'منتخب کریں' : 'Select'}
                                    </span>
                                  </button>
                                </li>
                              ))
                            ) : (
                              <div className="p-4 text-center text-xs text-slate-400 italic">
                                {lang === 'ur' ? 'کوئی طالب علم نہیں ملا' : 'No registered students found'}
                              </div>
                            )}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {selectedProfileId && (
                      <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs text-emerald-800 animate-fade-in">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>
                            {lang === 'ur' 
                              ? `پروفائل میچ ہو گئی: ${name} (${category})` 
                              : `Profile Matched: ${name} (${category})`
                            }
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearSelectedProfile}
                          className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 hover:text-emerald-800 transition-all cursor-pointer"
                          title={lang === 'ur' ? 'پروفائل ہٹائیں' : 'Clear profile'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // 4. Category Dropdown
              if (field.id === 'category') {
                return (
                  <div key={field.id}>
                    <label htmlFor="input-cat" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      id="input-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-700 bg-white font-sans"
                      dir={lang === 'ur' ? 'rtl' : 'ltr'}
                      required={field.required}
                    >
                      <option value="">{t.selectPlaceholder}</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              // 5. Class Attend Dropdown
              if (field.id === 'classType') {
                return (
                  <div key={field.id}>
                    <label htmlFor="input-class-type" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      id="input-class-type"
                      value={classType}
                      onChange={(e) => setClassType(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-700 bg-white font-sans"
                      dir={lang === 'ur' ? 'rtl' : 'ltr'}
                      required={field.required}
                    >
                      <option value="weekly">{t.weeklyClass}</option>
                      <option value="daily">{t.dailyClass}</option>
                      <option value="26days">{t.classType_26days}</option>
                      <option value="24days">{t.classType_24days}</option>
                      <option value="20days">{t.classType_20days}</option>
                      <option value="15days">{t.classType_15days}</option>
                    </select>
                  </div>
                );
              }

              // 6. Session Dropdown (Start Year and End Year)
              if (field.id === 'session') {
                return (
                  <div key={field.id} className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="input-start-year" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {lang === 'ur' ? 'سیشن شروع (سال)' : 'Session Start Year'}
                      </label>
                      <select
                        id="input-start-year"
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-700 bg-white font-sans"
                        dir={lang === 'ur' ? 'rtl' : 'ltr'}
                      >
                        {YEARS_LIST.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="input-end-year" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {lang === 'ur' ? 'سیشن ختم (سال)' : 'Session End Year'}
                      </label>
                      <select
                        id="input-end-year"
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-700 bg-white font-sans"
                        dir={lang === 'ur' ? 'rtl' : 'ltr'}
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

              // 7. Non-system custom field
              return (
                <div key={field.id}>
                  <label htmlFor={`custom-input-${field.id}`} className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={`custom-input-${field.id}`}
                      value={customValues[field.id] || ''}
                      onChange={(e) => setCustomValues({ ...customValues, [field.id]: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-700 bg-white font-sans"
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-800"
                      dir={lang === 'ur' ? 'rtl' : 'ltr'}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}

            {/* YES/NO RSVP Options */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                id="btn-yes"
                onClick={() => handleStatusSelect('yes')}
                className={`py-4 px-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  status === 'yes'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-2xl mb-1.5">✅</span>
                <span className="text-sm font-bold tracking-tight">{t.iAmComing}</span>
              </button>

              <button
                type="button"
                id="btn-no"
                onClick={() => handleStatusSelect('no')}
                className={`py-4 px-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                  status === 'no'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-700 shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-2xl mb-1.5">❌</span>
                <span className="text-sm font-bold tracking-tight">{t.cantCome}</span>
              </button>
            </div>

            {/* Required Reason Field for 'Not Coming' */}
            <AnimatePresence>
              {status === 'no' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2">
                    <label htmlFor="input-reason" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {lang === 'ur' ? 'وجہ درج کریں *' : 'Reason / Tell us why *'}
                    </label>
                    <input
                      type="text"
                      id="input-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t.reasonPlaceholder}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all font-medium text-slate-800"
                      dir={lang === 'ur' ? 'rtl' : 'ltr'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                id="submit-btn"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-100 cursor-pointer active:scale-[0.98] transition-all"
              >
                <Send className="w-4 h-4" />
                {t.submitResponse}
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="success-msg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="text-center py-6 flex flex-col items-center justify-center"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mb-2">{t.thankYou}</h3>
            <p className="text-slate-500 text-sm max-w-xs mb-6 leading-relaxed">
              {t.responseRecorded}
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 shadow-sm active:scale-95 transition-all cursor-pointer text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              {t.submitAnother}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
