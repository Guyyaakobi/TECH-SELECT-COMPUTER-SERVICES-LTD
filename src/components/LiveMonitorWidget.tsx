import React, { useState } from 'react';
import { ShieldCheck, Server, RefreshCw, CheckCircle2, HardDrive, Activity, Radio, Globe } from 'lucide-react';

export const LiveMonitorWidget: React.FC = () => {
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
    <div className="relative rounded-2xl bg-white border border-slate-200 p-6 shadow-xl overflow-hidden group text-slate-900">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-900 via-indigo-600 to-blue-600" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-emerald-500 block absolute top-1 right-1 animate-ping opacity-75"></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-600 tracking-wider font-extrabold flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-600" />
              NOC / SOC SYSTEM MONITOR :: ONLINE
            </span>
            <span className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 font-heading">
              כל המערכות פועלות כסדרן (24/7/365)
            </span>
          </div>
        </div>

        <button
          onClick={runSystemScan}
          disabled={isScanning}
          className="flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 px-3.5 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-300 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'סורק...' : 'בדיקת תקינות'}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3 my-5 relative z-10">
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-center hover:border-emerald-500/50 transition-colors shadow-2xs">
          <span className="text-[11px] text-slate-600 font-medium block mb-1">זמינות שרתים</span>
          <span className="text-xl font-black text-emerald-600" dir="ltr">99.99%</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-center hover:border-indigo-500/50 transition-colors shadow-2xs">
          <span className="text-[11px] text-slate-600 font-medium block mb-1">SLA קריטי</span>
          <span className="text-xl font-black text-indigo-700" dir="ltr">&lt;15m</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/90 text-center hover:border-blue-500/50 transition-colors shadow-2xs">
          <span className="text-[11px] text-slate-600 font-medium block mb-1">חריגות אבטחה</span>
          <span className="text-xl font-black text-slate-900">0 תקלות</span>
        </div>
      </div>

      {/* Health Bars */}
      <div className="space-y-3.5 text-xs font-medium relative z-10">
        <div>
          <div className="flex justify-between text-slate-700 mb-1.5 text-[11px]">
            <span className="flex items-center gap-1.5 font-bold">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              תשתיות ענן M365 & Azure
            </span>
            <span className="text-emerald-700 font-bold">100% פעיל</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className={`h-full bg-indigo-600 rounded-full transition-all duration-1000 ${isScanning ? 'w-1/2' : 'w-[100%]'}`}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-700 mb-1.5 text-[11px]">
            <span className="flex items-center gap-1.5 font-bold">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              גיבוי מוצפן Immutable DRP
            </span>
            <span className="text-emerald-700 font-bold">מסונכרן</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className={`h-full bg-blue-600 rounded-full transition-all duration-1000 ${isScanning ? 'w-3/4' : 'w-[100%]'}`}></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-slate-700 mb-1.5 text-[11px]">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              מוקד SOC 24/7 & הגנת EDR
            </span>
            <span className="text-emerald-700 font-bold">מאובטח</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div className={`h-full bg-emerald-600 rounded-full transition-all duration-1000 ${isScanning ? 'w-2/3' : 'w-[100%]'}`}></div>
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className="mt-5 pt-3.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 relative z-10">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-600" />
          עדכון אחרון: <strong className="text-slate-900 font-bold">{lastCheck}</strong>
        </span>
        <span className="text-slate-700 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          EST. 2018 | SLA VERIFIED
        </span>
      </div>

      {scanComplete && (
        <div className="mt-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-300 relative z-10 font-medium">
          <span className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            בדיקת תקינות הושלמה! כל מערכות ה-IT והענן מתפקדות ברמה מירבית.
          </span>
        </div>
      )}
    </div>
  );
};



