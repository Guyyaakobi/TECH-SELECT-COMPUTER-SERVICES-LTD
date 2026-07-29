import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, CornerDownLeft, Shield, Cpu, Cloud, Zap, CheckCircle2, RotateCcw } from 'lucide-react';
import { COMPANY_INFO } from '../data/content';

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
          { type: 'output', text: `טלפון משרדי: ${COMPANY_INFO.phoneLandline}` },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col h-[520px]">
        
        {/* Terminal Titlebar */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 mr-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              TECH-SELECT_DEFENSE_CLI_v4.8 :: bash
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Command Action Buttons */}
        <div className="bg-slate-900/40 border-b border-slate-800/80 p-2.5 flex flex-wrap gap-2 text-xs font-mono shrink-0">
          <span className="text-slate-400 text-[11px] self-center ml-1">פקודות מהירות:</span>
          <button
            onClick={() => handleRunCommand('status')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-300 rounded-lg text-[11px] transition-colors"
          >
            status
          </button>
          <button
            onClick={() => handleRunCommand('ping')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400 text-emerald-300 rounded-lg text-[11px] transition-colors"
          >
            ping
          </button>
          <button
            onClick={() => handleRunCommand('scan')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-amber-300 rounded-lg text-[11px] transition-colors"
          >
            scan
          </button>
          <button
            onClick={() => handleRunCommand('contact')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-blue-400 text-blue-300 rounded-lg text-[11px] transition-colors"
          >
            contact
          </button>
          <button
            onClick={() => handleRunCommand('clear')}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-lg text-[11px] transition-colors"
          >
            clear
          </button>
        </div>

        {/* Terminal Output Logs */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs space-y-2 leading-relaxed" dir="ltr">
          {logs.map((log, index) => (
            <div
              key={index}
              className={`break-words ${
                log.type === 'cmd'
                  ? 'text-cyan-300 font-bold'
                  : log.type === 'success'
                  ? 'text-emerald-400'
                  : log.type === 'warning'
                  ? 'text-amber-300'
                  : log.type === 'info'
                  ? 'text-sky-400'
                  : 'text-slate-300'
              }`}
            >
              {log.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Terminal Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCommand(inputVal);
          }}
          className="bg-slate-900 border-t border-slate-800 p-3 flex items-center gap-2 shrink-0"
        >
          <span className="text-cyan-400 font-mono text-xs font-bold pl-2" dir="ltr">
            root@tech-select:~#
          </span>
          <input
            type="text"
            dir="ltr"
            placeholder="type command (e.g. status, ping, scan, contact)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-transparent text-white font-mono text-xs outline-none focus:ring-0 placeholder:text-slate-600"
            autoFocus
          />
          <button
            type="submit"
            className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
