import React from 'react';
import { CheckCircle, XCircle, Users, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponseEntry, LanguageType } from '../types';
import { translations } from '../lib/translations';

interface StatsGridProps {
  responses: ResponseEntry[];
  lang: LanguageType;
  categories: string[];
  showMainStats?: boolean;
  showClassStats?: boolean;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ 
  responses, 
  lang, 
  categories,
  showMainStats = true,
  showClassStats = true
}) => {
  const t = translations[lang];
  const yesCount = responses.filter((r) => r.status === 'yes').length;
  const noCount = responses.filter((r) => r.status === 'no').length;
  const totalCount = responses.length;

  // Group responses by category and count 'yes' (present) and 'no' (absent)
  const categoryStats = categories.reduce((acc, cat) => {
    acc[cat] = { yes: 0, no: 0 };
    return acc;
  }, {} as Record<string, { yes: number; no: number }>);

  responses.forEach((curr) => {
    if (!categoryStats[curr.category]) {
      categoryStats[curr.category] = { yes: 0, no: 0 };
    }
    if (curr.status === 'yes') {
      categoryStats[curr.category].yes += 1;
    } else if (curr.status === 'no') {
      categoryStats[curr.category].no += 1;
    }
  });

  // Get current categories from the admin's categories list, sorted
  const activeCategories = [...categories].sort();

  return (
    <div className="space-y-4 mb-6">
      {/* Main Stats Row */}
      {showMainStats && (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {/* Aa Rahe / Coming Card */}
          <div 
            id="stat-yes-card"
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
          >
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mb-2">
              <CheckCircle className="w-5 h-5 md:w-6 h-6" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-600 tracking-tight" id="stat-yes-val">
              {yesCount}
            </span>
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
              {t.coming}
            </span>
          </div>

          {/* Nahi / Not Coming Card */}
          <div 
            id="stat-no-card"
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
          >
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl mb-2">
              <XCircle className="w-5 h-5 md:w-6 h-6" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-rose-600 tracking-tight" id="stat-no-val">
              {noCount}
            </span>
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
              {t.notComing}
            </span>
          </div>

          {/* Total Card */}
          <div 
            id="stat-total-card"
            className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center transition-transform hover:scale-[1.02]"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mb-2">
              <Users className="w-5 h-5 md:w-6 h-6" />
            </div>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-600 tracking-tight" id="stat-total-val">
              {totalCount}
            </span>
            <span className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
              {t.total}
            </span>
          </div>
        </div>
      )}

      {/* Dynamic Category Attending Stats */}
      <AnimatePresence>
        {showClassStats && activeCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              <div className="text-[11px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
                <span>{lang === 'ur' ? 'کلاس کے لحاظ سے حاضری' : 'Class-wise Attendance'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="grid grid-cols-2 gap-3" id="category-stats-grid">
                {activeCategories.map((cat) => {
                  const stats = categoryStats[cat];
                  return (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col items-center text-center transition-transform hover:scale-[1.02] relative overflow-hidden"
                    >
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mb-3">
                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 w-full mb-3 border-b border-slate-50 pb-2">
                        {/* Present Column */}
                        <div className="text-center">
                          <span className="text-[9px] md:text-[10px] text-emerald-600 font-bold block uppercase tracking-tight">
                            {lang === 'ur' ? 'آ رہے ہیں' : 'present'}
                          </span>
                          <span className="text-lg md:text-xl font-extrabold text-emerald-600 block mt-0.5">
                            {stats.yes}
                          </span>
                        </div>

                        {/* Absent Column */}
                        <div className="text-center border-l border-slate-100">
                          <span className="text-[9px] md:text-[10px] text-rose-500 font-bold block uppercase tracking-tight">
                            {lang === 'ur' ? 'نہیں آ رہے' : 'absent'}
                          </span>
                          <span className="text-lg md:text-xl font-extrabold text-rose-500 block mt-0.5">
                            {stats.no}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs md:text-sm text-slate-800 font-extrabold tracking-tight line-clamp-1 w-full" title={cat}>
                        {cat}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
