import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileQuestion, Clock, Tag } from 'lucide-react';
import { ResponseEntry, LanguageType } from '../types';
import { translations } from '../lib/translations';

interface RecentResponsesProps {
  responses: ResponseEntry[];
  lang: LanguageType;
}

export const RecentResponses: React.FC<RecentResponsesProps> = ({ responses, lang }) => {
  const t = translations[lang];
  const [filter, setFilter] = useState<'all' | 'yes' | 'no'>('all');

  const filteredResponses = responses.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getCount = (status: 'all' | 'yes' | 'no') => {
    if (status === 'all') return responses.length;
    return responses.filter((r) => r.status === status).length;
  };

  return (
    <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <span>📋</span> {t.recentResponses}
        </h2>
      </div>

      {/* Responsive Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2.5 mb-4 scrollbar-thin">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all-custom cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          {t.all} ({getCount('all')})
        </button>
        <button
          onClick={() => setFilter('yes')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all-custom cursor-pointer flex items-center gap-1.5 ${
            filter === 'yes'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-50 text-emerald-700 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <span>✅</span> {t.coming} ({getCount('yes')})
        </button>
        <button
          onClick={() => setFilter('no')}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all-custom cursor-pointer flex items-center gap-1.5 ${
            filter === 'no'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-slate-50 text-rose-700 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <span>❌</span> {t.notComing} ({getCount('no')})
        </button>
      </div>

      {/* Responses List */}
      <div id="response-list" className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
        <AnimatePresence initial={false} mode="popLayout">
          {filteredResponses.length > 0 ? (
            filteredResponses.map((r) => (
              <motion.div
                layout
                key={r.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all-custom bg-slate-50/50"
              >
                {/* Status Avatar */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm flex-shrink-0 ${
                    r.status === 'yes'
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                      : 'bg-gradient-to-br from-rose-400 to-rose-600'
                  }`}
                >
                  {r.name.trim().charAt(0).toUpperCase()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-sm md:text-base truncate">
                      {r.name}
                    </span>
                    <span className="text-base flex-shrink-0">
                      {r.status === 'yes' ? '✅' : '❌'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] md:text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {r.category}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {r.classType === 'daily' 
                        ? (lang === 'ur' ? 'روزانہ (30 دن کی کلاس)' : 'Daily (30 days class)') 
                        : r.classType === '26days'
                        ? (lang === 'ur' ? '26 دن کی کلاس (اتوار کے بغیر)' : '26 Days class (excluding Sunday)')
                        : r.classType === '24days'
                        ? (lang === 'ur' ? '24 دن کی کلاس' : '24 Days class')
                        : r.classType === '20days'
                        ? (lang === 'ur' ? '20 دن کی کلاس' : '20 Days class')
                        : r.classType === '15days'
                        ? (lang === 'ur' ? '15 دن کی کلاس' : '15 Days class')
                        : (lang === 'ur' ? 'ہفتہ وار کلاس' : 'Weekly class')
                      }
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {r.time} • {r.date}
                    </span>
                  </div>

                  {/* Reason Block */}
                  {r.reason && (
                    <div className="mt-2.5 bg-white border border-slate-100 rounded-lg p-2.5 text-xs text-slate-600 border-l-4 border-l-slate-300 leading-relaxed italic" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
                      {r.reason}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-10 text-slate-400 flex flex-col items-center justify-center"
            >
              <FileQuestion className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold">{t.noResponses}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
