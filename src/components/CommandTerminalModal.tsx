import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, CornerDownLeft, Shield, Cpu, Cloud, Zap, CheckCircle2, RotateCcw } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';
import { useTheme } from '../context/ThemeContext';

interface CommandTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogEntry {
  type: 'cmd' | 'output' | 'success' | 'warning' | 'info';
  text: string;
}

export const CommandTerminalModal: React.FC<CommandTerminalModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'info', text: 'TECH-SELECT Enterprise OS v4.8 [Defense & Cyber Shell]' },
    { type: 'info', text: 'מערכת ניטור IT ואבטחת סייבר פעילה באזור ישראל (IL-EAST).' },
    { type: 'info', text: 'הקלד "help" לרשימת פקודות או לחץ על הכפתורים המהירים.' },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const handleRunCommand = (cmdStr: string) => {
    const cleanCmd = cmdStr.trim().toLowerCase();
    if (!cleanCmd) return;

    const newLogs: LogEntry[] = [...logs, { type: 'cmd', text: `> ${cmdStr}` }];

    switch (cleanCmd) {
      case 'help':
        newLogs.push(
          { type: 'output', text: 'פקודות זמינות בשרת:' },
          { type: 'output', text: '  status    - בדיקת סטטוס שרתי ניטור, Air-Gap, SOC ותשתיות סייבר' },
          { type: 'output', text: '  ping      - בדיקת שיהוי לתשתיות ענן (Azure/M365 IL)' },
          { type: 'output', text: '  scan      - הרצת סריקת סיכוני סייבר מהירה' },
          { type: 'output', text: '  contact   - הצגת פרטי התקשרות ישירים למוקד' },
          { type: 'output', text: '  clear     - ניקוי מסך המסוף' }
        );
        break;

      case 'status':
        newLogs.push(
          { type: 'success', text: '[OK] Helpdesk Service Desk: ONLINE (זמן תגובה ממוצע: 4 דקות)' },
          { type: 'success', text: '[OK] SOC Cyber Defense Engine: 100% Operational (AI EDR Active)' },
          { type: 'success', text: '[OK] Air-Gap Systems & Classified Redundancy: Sync OK' },
          { type: 'info', text: 'מאושר: כל מערכות TECH-SELECT עובדות ברמת זמינות 99.99%' }
        );
        break;

      case 'ping':
        newLogs.push(
          { type: 'output', text: 'PING israel-central.cloud.microsoft (185.120.40.11) 56 bytes of data.' },
          { type: 'success', text: '64 bytes: icmp_seq=1 ttl=118 time=4.2 ms' },
          { type: 'success', text: '64 bytes: icmp_seq=2 ttl=118 time=3.8 ms' },
          { type: 'success', text: '64 bytes: icmp_seq=3 ttl=118 time=4.1 ms' },
          { type: 'info', text: 'שיהוי מעולה! חיבור ישיר ומהיר לתשתיות ענן בישראל.' }
        );
        break;

      case 'scan':
        newLogs.push(
          { type: 'warning', text: 'מתחיל סריקת אבטחה מדומה לתחנות ולרשת...' },
          { type: 'output', text: '[1/3] Checking MFA Policy... Completed.' },
          { type: 'output', text: '[2/3] Verifying Offsite Encrypted Backups... Completed.' },
          { type: 'success', text: '[3/3] Threat Intelligence Scan Finished. 0 active breaches.' },
          { type: 'info', text: 'מומלץ לבצע בדיקת עומק תקופתית עם יועץ אבטחה של TECH-SELECT.' }
        );
        break;

      case 'contact':
        newLogs.push(
          { type: 'output', text: `פנייה ב-WhatsApp: ${COMPANY_INFO.whatsappUrl}` },
          { type: 'output', text: `דוא"ל: ${COMPANY_INFO.email}` },
          { type: 'output', text: `כתובת: ${COMPANY_INFO.address}` }
        );
        break;

      case 'clear':
        setLogs([]);
        setInputVal('');
        return;

      default:
        newLogs.push({
          type: 'warning',
          text: `פקודה לא מוכרת: "${cmdStr}". הקלד "help" לרשימת הפקודות.`,
        });
        break;
    }

    setLogs(newLogs);
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[520px] transition-colors duration-200 ${
        isDark
          ? 'bg-[#080c14] border-white/[0.08] text-slate-100'
          : 'bg-white border-slate-300/80 text-slate-900 shadow-slate-900/15'
      }`}>
        
        {/* Terminal Titlebar */}
        <div className={`px-4 py-3 flex items-center justify-between shrink-0 border-b ${
          isDark ? 'bg-[#05070c] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <span className={`text-xs font-sans font-bold mr-2 flex items-center gap-1.5 ${
              isDark ? 'text-cyan-400' : 'text-blue-700'
            }`}>
              <Terminal className="w-3.5 h-3.5" />
              TECH-SELECT_DEFENSE_CLI_v4.8 :: bash
            </span>
          </div>

          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Command Action Buttons */}
        <div className={`p-2.5 flex flex-wrap gap-2 text-xs font-sans shrink-0 border-b ${
          isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className={`text-[11px] self-center ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>פקודות מהירות:</span>
          <button
            onClick={() => handleRunCommand('status')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-cyan-300'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-blue-700 shadow-2xs'
            }`}
          >
            status
          </button>
          <button
            onClick={() => handleRunCommand('ping')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-emerald-300'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-emerald-700 shadow-2xs'
            }`}
          >
            ping
          </button>
          <button
            onClick={() => handleRunCommand('scan')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-amber-300'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-amber-700 shadow-2xs'
            }`}
          >
            scan
          </button>
          <button
            onClick={() => handleRunCommand('contact')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-blue-300'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-indigo-700 shadow-2xs'
            }`}
          >
            contact
          </button>
          <button
            onClick={() => handleRunCommand('clear')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-400'
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600 shadow-2xs'
            }`}
          >
            clear
          </button>
        </div>

        {/* Terminal Screen Body */}
        <div className={`flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2 dir-ltr text-left select-text ${
          isDark ? 'bg-[#05070c]' : 'bg-[#fafafa]'
        }`}>
          {logs.map((log, idx) => {
            let textColor = isDark ? 'text-slate-300' : 'text-slate-800';
            if (log.type === 'cmd') textColor = isDark ? 'text-cyan-400 font-bold' : 'text-blue-700 font-bold';
            if (log.type === 'success') textColor = isDark ? 'text-emerald-400' : 'text-emerald-700';
            if (log.type === 'warning') textColor = isDark ? 'text-amber-400' : 'text-amber-700';
            if (log.type === 'info') textColor = isDark ? 'text-sky-300' : 'text-indigo-700';

            return (
              <div key={idx} className={`${textColor} leading-relaxed whitespace-pre-wrap`}>
                {log.text}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCommand(inputVal);
          }}
          className={`p-3 border-t flex items-center gap-2 dir-ltr ${
            isDark ? 'bg-[#05070c] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <span className={`font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>tech-select$</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type 'help' or command..."
            className={`flex-1 bg-transparent font-mono text-xs outline-none ${
              isDark ? 'text-white placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'
            }`}
            autoFocus
          />
          <button
            type="submit"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark 
                ? 'text-cyan-400 hover:text-white bg-white/[0.04] border-white/[0.08]' 
                : 'text-blue-600 hover:text-blue-900 bg-white border-slate-300 shadow-2xs'
            }`}
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
