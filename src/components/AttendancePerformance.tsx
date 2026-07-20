import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Search, Calendar, ChevronDown, ChevronUp, GraduationCap, Percent, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { ResponseEntry, LanguageType } from '../types';
import { translations } from '../lib/translations';

interface AttendancePerformanceProps {
  responses: ResponseEntry[];
  categories: string[];
  lang: LanguageType;
}

const MONTHS = [
  { value: 'Jan', nameEn: 'January', nameUr: 'جنوری' },
  { value: 'Feb', nameEn: 'February', nameUr: 'فروری' },
  { value: 'Mar', nameEn: 'March', nameUr: 'مارچ' },
  { value: 'Apr', nameEn: 'April', nameUr: 'اپریل' },
  { value: 'May', nameEn: 'May', nameUr: 'مئی' },
  { value: 'Jun', nameEn: 'June', nameUr: 'جون' },
  { value: 'Jul', nameEn: 'July', nameUr: 'جولائی' },
  { value: 'Aug', nameEn: 'August', nameUr: 'اگست' },
  { value: 'Sep', nameEn: 'September', nameUr: 'ستمبر' },
  { value: 'Oct', nameEn: 'October', nameUr: 'اکتوبر' },
  { value: 'Nov', nameEn: 'November', nameUr: 'نومبر' },
  { value: 'Dec', nameEn: 'December', nameUr: 'دسمبر' }
];

const DAYS_IN_MONTH: Record<string, number> = {
  Jan: 31, Feb: 28, Mar: 31, Apr: 30, May: 31, Jun: 30,
  Jul: 31, Aug: 31, Sep: 30, Oct: 31, Nov: 30, Dec: 31
};

const MONTHS_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getTotalDaysInMonth(monthName: string, yearNum: number): number {
  const m = MONTHS_MAP[monthName];
  if (m === undefined) return 30;
  // Handle February leap year
  if (m === 1 && isLeapYear(yearNum)) return 29;
  return DAYS_IN_MONTH[monthName] || 30;
}

function getTotalSundays(monthName: string, yearNum: number): number {
  const m = MONTHS_MAP[monthName];
  if (m === undefined) return 4;
  const totalDays = m === 1 && isLeapYear(yearNum) ? 29 : (DAYS_IN_MONTH[monthName] || 30);
  let sundays = 0;
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(yearNum, m, d);
    if (date.getDay() === 0) { // 0 is Sunday
      sundays++;
    }
  }
  return sundays;
}

function parseClassType(classTypeStr: string | undefined): { type: 'weekly' | 'daily' | 'custom'; days: number } {
  if (!classTypeStr) return { type: 'weekly', days: 4 };
  const normalized = classTypeStr.toLowerCase();
  
  if (normalized.includes('weekly')) {
    return { type: 'weekly', days: 4 };
  }
  if (normalized.includes('daily')) {
    return { type: 'daily', days: 30 };
  }
  
  // Try parsing numeric values e.g. "26 days", "20 days"
  const match = normalized.match(/\d+/);
  if (match) {
    return { type: 'custom', days: parseInt(match[0], 10) };
  }
  
  return { type: 'weekly', days: 4 }; // fallback
}

function getExpectedClasses(
  classTypeStr: string | undefined,
  period: 'all' | 'custom' | 'monthly' | 'two_months' | 'six_months' | 'yearly',
  customNumber: number,
  customUnit: 'days' | 'months',
  filterMonth: string,
  historyDates: string[]
): number {
  const { type, days: customDays } = parseClassType(classTypeStr);
  
  // Determine year
  let yearNum = new Date().getFullYear();
  for (const dateStr of historyDates) {
    const parts = dateStr.split(' ');
    if (parts.length >= 3) {
      const yr = parseInt(parts[2], 10);
      if (!isNaN(yr)) {
        yearNum = yr;
        break;
      }
    }
  }

  // If filtered by specific month
  if (filterMonth) {
    if (type === 'weekly') {
      return getTotalSundays(filterMonth, yearNum);
    } else if (type === 'daily') {
      return getTotalDaysInMonth(filterMonth, yearNum);
    } else {
      return customDays; // e.g. 26 days
    }
  }

  // Filtered by Period
  if (period === 'monthly') {
    const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' }); // e.g. "Jul"
    if (type === 'weekly') {
      return getTotalSundays(currentMonthName, yearNum);
    } else if (type === 'daily') {
      return getTotalDaysInMonth(currentMonthName, yearNum);
    } else {
      return customDays;
    }
  }

  if (period === 'two_months') {
    if (type === 'weekly') return 8;
    if (type === 'daily') return 60;
    return customDays * 2;
  }

  if (period === 'six_months') {
    if (type === 'weekly') return 24;
    if (type === 'daily') return 180;
    return customDays * 6;
  }

  if (period === 'yearly') {
    if (type === 'weekly') return 52;
    if (type === 'daily') return isLeapYear(yearNum) ? 366 : 365;
    return customDays * 12;
  }

  if (period === 'custom') {
    if (customUnit === 'days') {
      if (type === 'weekly') {
        return Math.max(1, Math.round(customNumber / 7));
      } else if (type === 'daily') {
        return customNumber;
      } else {
        return Math.max(1, Math.round((customNumber / 30) * customDays));
      }
    } else {
      if (type === 'weekly') {
        return customNumber * 4;
      } else if (type === 'daily') {
        return customNumber * 30;
      } else {
        return customNumber * customDays;
      }
    }
  }

  // period === 'all'
  if (type === 'weekly') {
    return 52;
  } else if (type === 'daily') {
    return isLeapYear(yearNum) ? 366 : 365;
  } else {
    return customDays * 12;
  }
}

export const AttendancePerformance: React.FC<AttendancePerformanceProps> = ({
  responses,
  categories,
  lang,
}) => {
  const t = translations[lang];

  // States
  const [period, setPeriod] = useState<'all' | 'custom' | 'monthly' | 'two_months' | 'six_months' | 'yearly'>('all');
  const [customNumber, setCustomNumber] = useState<number>(15);
  const [customUnit, setCustomUnit] = useState<'days' | 'months'>('days');
  const [filterName, setFilterName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterClassType, setFilterClassType] = useState('');

  // Expandable state for student detail history
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

  const toggleStudentExpand = (key: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 1. Process and Filter Responses
  const now = new Date();

  const filteredResponses = responses.filter((r) => {
    // A. Filter by Specific Month Abbreviation (e.g., Jul, Apr)
    if (filterMonth && !r.date.includes(filterMonth)) {
      return false;
    }

    // B. Filter by Duration / Period
    if (period !== 'all') {
      try {
        const entryDate = new Date(r.date);
        const diffTime = now.getTime() - entryDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (period === 'monthly' && diffDays > 30) return false;
        if (period === 'two_months' && diffDays > 60) return false;
        if (period === 'six_months' && diffDays > 180) return false;
        if (period === 'yearly' && diffDays > 365) return false;
        if (period === 'custom') {
          const thresholdDays = customUnit === 'days' ? customNumber : customNumber * 30;
          if (diffDays > thresholdDays) return false;
        }
      } catch (e) {
        return false;
      }
    }

    return true;
  });

  // 2. Group Responses by Student Name + Category + Class Type
  interface StudentPerformance {
    name: string;
    category: string;
    total: number;
    present: number;
    absent: number;
    classType: string;
    history: {
      id: string;
      date: string;
      time: string;
      status: 'yes' | 'no';
      reason?: string;
    }[];
  }

  const studentsMap: Record<string, StudentPerformance> = {};

  filteredResponses.forEach((r) => {
    const classTypeVal = r.classType || 'weekly';
    const key = `${r.name.trim().toLowerCase()}||${r.category.trim()}||${classTypeVal}`;
    if (!studentsMap[key]) {
      studentsMap[key] = {
        name: r.name,
        category: r.category,
        total: 0,
        present: 0,
        absent: 0,
        classType: classTypeVal,
        history: [],
      };
    }

    studentsMap[key].total += 1;
    if (r.status === 'yes') {
      studentsMap[key].present += 1;
    } else {
      studentsMap[key].absent += 1;
    }

    studentsMap[key].history.push({
      id: r.id,
      date: r.date,
      time: r.time,
      status: r.status,
      reason: r.reason,
    });
  });

  // Convert to array
  let studentList = Object.values(studentsMap);

  // Apply filters on Student-level search (Name and Category dropdown)
  if (filterName.trim()) {
    const query = filterName.toLowerCase().trim();
    studentList = studentList.filter((s) => s.name.toLowerCase().includes(query));
  }

  if (filterCategory) {
    studentList = studentList.filter((s) => s.category === filterCategory);
  }

  if (filterClassType) {
    studentList = studentList.filter((s) => s.classType === filterClassType);
  }

  // Sort by student name
  studentList.sort((a, b) => a.name.localeCompare(b.name));

  // Sort histories by date descending
  studentList.forEach((s) => {
    s.history.sort((h1, h2) => new Date(h2.date).getTime() - new Date(h1.date).getTime());
  });

  // 3. Overall stats for filtered students
  const totalStudents = studentList.length;
  
  let totalPerformanceSum = 0;
  let overallAbsent = 0;
  
  studentList.forEach((s) => {
    const historyDates = s.history.map(h => h.date);
    const expected = getExpectedClasses(s.classType, period, customNumber, customUnit, filterMonth, historyDates);
    const pRateNum = expected > 0 ? Math.min(100, (s.present / expected) * 100) : 0;
    totalPerformanceSum += pRateNum;
    
    const studentAbsents = expected - s.present > 0 ? expected - s.present : 0;
    overallAbsent += studentAbsents;
  });

  const averageAttendance = totalStudents > 0 ? Math.round(totalPerformanceSum / totalStudents) : 0;

  // 4. Reset Filters
  const handleResetFilters = () => {
    setPeriod('all');
    setCustomNumber(15);
    setCustomUnit('days');
    setFilterName('');
    setFilterCategory('');
    setFilterMonth('');
    setFilterClassType('');
  };

  // 5. CSV Download for Filtered Performance Data
  const handleDownloadPerformanceCSV = () => {
    if (studentList.length === 0) {
      alert(t.noDataExport);
      return;
    }

    let csv = '\uFEFF'; // UTF-8 BOM for Excel Urdu language compatibility
    csv += 'Student Name,Category,Class Type,Expected Classes,Present Classes,Absent Classes,Present Percentage,Absent Percentage,Absent History Details\n';

    studentList.forEach((s) => {
      const historyDates = s.history.map(h => h.date);
      const expected = getExpectedClasses(s.classType, period, customNumber, customUnit, filterMonth, historyDates);
      const hasError = s.present > expected;
      const pPercentNum = expected > 0 ? Math.min(100, (s.present / expected) * 100) : 0;
      const aPercentNum = Math.max(0, 100 - pPercentNum);

      const pRate = hasError ? (lang === 'ur' ? 'غلطی: دہرا اندراج!' : 'Error: Duplicate Entry!') : `${pPercentNum.toFixed(2)}%`;
      const aRate = hasError ? 'Error' : `${aPercentNum.toFixed(2)}%`;
      
      let displayClassType = s.classType;
      if (s.classType === 'weekly') {
        displayClassType = 'Weekly class';
      } else if (s.classType === 'daily') {
        displayClassType = 'Daily (30 days class)';
      }

      // Format details of absences
      const absentDetails = s.history
        .filter((h) => h.status === 'no')
        .map((h) => `${h.date}: ${h.reason || 'No Reason'}`)
        .join('; ');

      csv += `"${s.name.replace(/"/g, '""')}","${s.category.replace(/"/g, '""')}","${displayClassType}","${expected}","${s.present}","${s.absent}","${pRate}","${aRate}","${absentDetails.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_Performance_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Card */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Time Period Selector */}
          <div>
            <label htmlFor="pref-period" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {lang === 'ur' ? 'مدت منتخب کریں' : 'Time Period'}
            </label>
            <select
              id="pref-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
            >
              <option value="all">{t.allTime}</option>
              <option value="monthly">{t.monthly}</option>
              <option value="two_months">{t.twoMonths}</option>
              <option value="six_months">{t.sixMonths}</option>
              <option value="yearly">{t.yearly}</option>
              <option value="custom">{t.customDuration}</option>
            </select>
          </div>

          {/* Specific Month Selector */}
          <div>
            <label htmlFor="pref-month" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t.filterByMonth}
            </label>
            <select
              id="pref-month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
            >
              <option value="">{t.selectMonthPlaceholder}</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {lang === 'ur' ? m.nameUr : m.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Custom Duration Inputs */}
        <AnimatePresence>
          {period === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-slate-200/50 pt-3"
            >
              <div className="flex gap-2.5 items-end">
                <div className="flex-1">
                  <label htmlFor="custom-num" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {lang === 'ur' ? 'مقدار' : 'Enter Value'}
                  </label>
                  <input
                    type="number"
                    id="custom-num"
                    min="1"
                    value={customNumber}
                    onChange={(e) => setCustomNumber(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all bg-white"
                  />
                </div>
                <div className="w-28">
                  <label htmlFor="custom-unit" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {lang === 'ur' ? 'اکائی' : 'Unit'}
                  </label>
                  <select
                    id="custom-unit"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
                  >
                    <option value="days">{t.days}</option>
                    <option value="months">{t.months}</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Name, Category & Class Type Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200/50 pt-3">
          {/* Student Name Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder={t.searchByName}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 transition-all bg-white"
            />
          </div>

          {/* Class Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
          >
            <option value="">{lang === 'ur' ? '-- تمام کیٹیگریز --' : '-- All Classes --'}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Class Type Filter */}
          <select
            value={filterClassType}
            onChange={(e) => setFilterClassType(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:border-indigo-500 outline-none transition-all"
          >
            <option value="">{lang === 'ur' ? '-- تمام کلاس کی قسمیں --' : '-- All Class Types --'}</option>
            <option value="weekly">{t.weeklyClass}</option>
            <option value="daily">{t.dailyClass}</option>
            <option value="26days">{t.classType_26days}</option>
            <option value="24days">{t.classType_24days}</option>
            <option value="20days">{t.classType_20days}</option>
            <option value="15days">{t.classType_15days}</option>
          </select>
        </div>

        {/* Action Buttons: Reset & Download CSV */}
        <div className="flex gap-2 pt-1.5 justify-end">
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lang === 'ur' ? 'ری سیٹ کریں' : 'Reset'}</span>
          </button>

          <button
            onClick={handleDownloadPerformanceCSV}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.downloadReport}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Badges for Query */}
      <div className="grid grid-cols-3 gap-2.5 bg-slate-50/50 rounded-2xl p-3 border border-slate-100">
        <div className="text-center p-1.5">
          <span className="text-[9px] md:text-[10px] text-slate-500 block uppercase font-bold tracking-tight">
            {lang === 'ur' ? 'کل طلباء' : 'Students'}
          </span>
          <span className="text-base font-extrabold text-slate-800 block mt-0.5">
            {totalStudents}
          </span>
        </div>
        <div className="text-center p-1.5 border-x border-slate-200/60">
          <span className="text-[9px] md:text-[10px] text-emerald-600 block uppercase font-bold tracking-tight">
            {lang === 'ur' ? 'حاضری کی شرح' : 'Avg Present'}
          </span>
          <span className="text-base font-extrabold text-emerald-600 block mt-0.5">
            {averageAttendance}%
          </span>
        </div>
        <div className="text-center p-1.5">
          <span className="text-[9px] md:text-[10px] text-rose-500 block uppercase font-bold tracking-tight">
            {lang === 'ur' ? 'غیر حاضر' : 'Absences'}
          </span>
          <span className="text-base font-extrabold text-rose-500 block mt-0.5">
            {overallAbsent}
          </span>
        </div>
      </div>

      {/* Detailed Student Performance List */}
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
        {studentList.length > 0 ? (
          studentList.map((s) => {
            const studentKey = `${s.name.trim().toLowerCase()}||${s.category.trim()}||${s.classType}`;
            const isExpanded = expandedStudents[studentKey] || false;

            const historyDates = s.history.map(h => h.date);
            const expected = getExpectedClasses(s.classType, period, customNumber, customUnit, filterMonth, historyDates);
            const hasError = s.present > expected;
            const pRateNum = expected > 0 ? Math.min(100, (s.present / expected) * 100) : 0;
            const pRateFormatted = pRateNum.toFixed(2).replace(/\.00$/, '');
            const aRateNum = Math.max(0, 100 - pRateNum);

            let displayClassLabel = s.classType;
            if (s.classType === 'weekly') {
              displayClassLabel = lang === 'ur' ? 'ہفتہ وار کلاس' : 'Weekly class';
            } else if (s.classType === 'daily') {
              displayClassLabel = lang === 'ur' ? 'روزانہ (30 دن کی کلاس)' : 'Daily (30 days class)';
            } else if (s.classType === '26days') {
              displayClassLabel = lang === 'ur' ? '26 دن کی کلاس (اتوار کے بغیر)' : '26 Days class (excluding Sunday)';
            } else if (s.classType === '24days') {
              displayClassLabel = lang === 'ur' ? '24 دن کی کلاس' : '24 Days class';
            } else if (s.classType === '20days') {
              displayClassLabel = lang === 'ur' ? '20 دن کی کلاس' : '20 Days class';
            } else if (s.classType === '15days') {
              displayClassLabel = lang === 'ur' ? '15 دن کی کلاس' : '15 Days class';
            }

            return (
              <div
                key={studentKey}
                className={`bg-white rounded-2xl border p-4 shadow-sm hover:border-slate-200/80 transition-all space-y-3.5 ${
                  hasError ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100'
                }`}
              >
                {/* Header Information */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-600 text-sm">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm md:text-base leading-tight">
                        {s.name}
                      </h4>
                      <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-0.5 flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {s.category}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-max mt-0.5">
                          {displayClassLabel}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Compact Attendance Badges */}
                  <div className="text-right flex flex-col items-end gap-1">
                    {hasError ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg animate-pulse">
                        {t.errorDuplicateEntry || '❌ Error: Duplicate Entry!'}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        {pRateFormatted}% {lang === 'ur' ? 'کارکردگی' : 'Performance'}
                      </span>
                    )}
                    <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-tight ${hasError ? 'text-rose-600 font-extrabold' : 'text-slate-400'}`}>
                      {lang === 'ur' ? `${s.present} / ${expected} حاضری` : `${s.present} / ${expected} present`}
                    </span>
                  </div>
                </div>

                {/* Performance Progress Bar */}
                <div className="space-y-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    {hasError ? (
                      <div
                        className="bg-rose-500 h-full transition-all w-full"
                        title="Duplicate Entry"
                      />
                    ) : (
                      <>
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${pRateNum}%` }}
                          title={`Present rate: ${pRateNum.toFixed(2)}%`}
                        />
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{ width: `${aRateNum}%` }}
                          title={`Absent rate: ${aRateNum.toFixed(2)}%`}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 px-0.5">
                    <span className={hasError ? 'text-rose-500 font-bold' : ''}>
                      {s.present} {lang === 'ur' ? 'حاضر' : 'Present'}
                    </span>
                    <span>
                      {expected - s.present > 0 ? expected - s.present : 0} {lang === 'ur' ? 'غیر حاضر' : 'Absent'}
                    </span>
                  </div>
                </div>

                {/* Date-wise Detailed List Button */}
                <div>
                  <button
                    onClick={() => toggleStudentExpand(studentKey)}
                    className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <span>{isExpanded ? t.hideHistory : t.showHistory}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Collapsible history section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                          {s.history.map((h) => (
                            <div
                              key={h.id}
                              className="flex items-start justify-between p-2 rounded-xl bg-slate-50/50 border border-slate-100 text-[11px] font-medium"
                            >
                              <div className="space-y-0.5">
                                <span className="text-slate-700 font-semibold">{h.date}</span>
                                <span className="text-slate-400 text-[9px] block">{h.time}</span>
                                {h.reason && (
                                  <div className="mt-1 bg-white border border-slate-100 text-rose-600 rounded px-2 py-1 leading-relaxed italic text-[10px]">
                                    <span className="font-bold">{t.absentReason}: </span>
                                    {h.reason}
                                  </div>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  h.status === 'yes'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {h.status === 'yes' ? (lang === 'ur' ? 'حاضر' : 'Present') : (lang === 'ur' ? 'غیر حاضر' : 'Absent')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-100 rounded-2xl">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5] mb-2" />
            <p className="text-xs font-bold">{t.noResponses}</p>
          </div>
        )}
      </div>
    </div>
  );
};
