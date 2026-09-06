import React, { useState } from 'react';
import { ShieldCheck, Server, RefreshCw, CheckCircle2, HardDrive, Activity, Radio, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const LiveMonitorWidget: React.FC = () => {
  const { isDark } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [lastCheck, setLastCheck] = useState('לפני דקה אחת');

  const runSystemScan = () => {
    setIsScanning(true);
    setScanComplete(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
      setLastCheck('עכשיו');
    }, 1800);
  };

  return (
    <div className={`relative rounded-2xl border p-6 shadow-xl overflow-hidden group transition-colors duration-200 ${
      isDark ? 'bg-[#0b1120] border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />

      {/* Header */}
      <div className={`flex items-center justify-between pb-4 border-b relative z-10 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`relative w-9 h-9 rounded-xl border flex items-center justify-center ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 block absolute top-1 right-1 animate-ping opacity-75"></span>
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Globe className="w-3 h-3 text-blue-600" />
              NOC / SOC SYSTEM MONITOR :: ONLINE
            </span>
            <span className={`text-sm font-extrabold flex items-center gap-1.5 font-heading ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              כל המערכות פועלות כסדרן (זמינות 99.99%)
            </span>
          </div>
        </div>

        <button
          onClick={runSystemScan}
          disabled={isScanning}
          className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 font-bold border cursor-pointer ${
            isDark 
              ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' 
              : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-300 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'סורק...' : 'בדיקת תקינות'}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3 my-5 relative z-10">
        <div className={`rounded-xl p-3.5 border text-center transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200/90 text-slate-900'
        }`}>
          <span className={`text-[11px] font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>זמינות שרתים</span>
          <span className="text-xl font-black text-emerald-600" dir="ltr">99.99%</span>
        </div>

        <div className={`rounded-xl p-3.5 border text-center transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200/90 text-slate-900'
        }`}>
          <span className={`text-[11px] font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>SLA קריטי</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400" dir="ltr">&lt;15m</span>
        </div>

        <div className={`rounded-xl p-3.5 border text-center transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200/90 text-slate-900'
        }`}>
          <span className={`text-[11px] font-medium block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>חריגות אבטחה</span>
          <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>0 תקלות</span>
        </div>
      </div>

      {/* Health Bars */}
      <div className="space-y-3.5 text-xs font-medium relative z-10">
        <div>
          <div className={`flex justify-between mb-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <span className="flex items-center gap-1.5 font-bold">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              תשתיות ענן M365 & Azure
            </span>
            <span className="text-emerald-600 font-bold">100% פעיל</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <div className={`h-full bg-indigo-600 rounded-full transition-all duration-1000 ${isScanning ? 'w-1/2' : 'w-[100%]'}`}></div>
          </div>
        </div>

        <div>
          <div className={`flex justify-between mb-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <span className="flex items-center gap-1.5 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              גיבוי מוצפן Immutable DRP
            </span>
            <span className="text-emerald-600 font-bold">מסונכרן</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <div className={`h-full bg-blue-600 rounded-full transition-all duration-1000 ${isScanning ? 'w-3/4' : 'w-[100%]'}`}></div>
          </div>
        </div>

        <div>
          <div className={`flex justify-between mb-1.5 text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ניטור SOC & הגנת EDR רציפה
            </span>
            <span className="text-emerald-600 font-bold">מאובטח</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
            <div className={`h-full bg-emerald-600 rounded-full transition-all duration-1000 ${isScanning ? 'w-2/3' : 'w-[100%]'}`}></div>
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className={`mt-5 pt-3.5 border-t flex items-center justify-between text-[11px] relative z-10 ${
        isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          עדכון אחרון: <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{lastCheck}</strong>
        </span>
        <span className={`font-bold text-[10px] px-2 py-0.5 rounded border ${
          isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
        }`}>
          EST. 2018 | SLA VERIFIED
        </span>
      </div>

      {scanComplete && (
        <div className={`mt-3.5 p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-300 relative z-10 font-medium ${
          isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
        }`}>
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            בדיקת תקינות הושלמה! כל מערכות ה-IT והענן מתפקדות ברמה מירבית.
          </span>
        </div>
      )}
    </div>
  );
};



