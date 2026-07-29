import React, { useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Wifi,
  HardDrive,
  CheckCircle2,
  Lock,
  Award,
  Layers,
  ShieldCheck,
  Network,
  ChevronDown,
} from 'lucide-react';
import { SpotlightCard } from './SpotlightCard';
import { useLanguage } from '../context/LanguageContext';

interface HeroProps {
  onOpenQuiz: () => void;
  onOpenTerminal?: () => void;
  onNavigateToDefense?: () => void;
  onOpenServicesIndex?: () => void;
  lang?: 'he' | 'en';
}

export const Hero: React.FC<HeroProps> = ({
  onNavigateToDefense,
  onOpenServicesIndex,
}) => {
  const { isHe } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulse: number;
      pulseSpeed: number;
    }

    interface PulseSignal {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
    }

    const nodeCount = Math.min(Math.floor((canvas.width * canvas.height) / 12000), 70);
    const nodes: Node[] = [];
    const signals: PulseSignal[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1.5,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.025
      });
    }

    const mouse = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      active: false
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const parentEl = canvas.parentElement;
    if (parentEl) {
      parentEl.addEventListener('mousemove', handleMouseMove);
      parentEl.addEventListener('mouseleave', handleMouseLeave);
    }

    const signalInterval = setInterval(() => {
      if (nodes.length < 2) return;
      const i = Math.floor(Math.random() * nodes.length);
      let closestDist = Infinity;
      let closestIdx = -1;
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist < closestDist) {
          closestDist = dist;
          closestIdx = j;
        }
      }
      if (closestIdx !== -1 && signals.length < 20) {
        signals.push({
          fromIndex: i,
          toIndex: closestIdx,
          progress: 0,
          speed: 0.015 + Math.random() * 0.025
        });
      }
    }, 250);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        n.pulse += n.pulseSpeed;

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 160;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.25;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }

        if (mouse.active) {
          const mdx = mouse.x - n.x;
          const mdy = mouse.y - n.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 160) {
            const force = (160 - mdist) / 160;
            n.x += (mdx / mdist) * force * 0.6;
            n.y += (mdy / mdist) * force * 0.6;

            ctx.strokeStyle = `rgba(168, 85, 247, ${force * 0.45})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        const glow = Math.sin(n.pulse) * 0.5 + 0.5;
        ctx.fillStyle = i % 3 === 0 ? `rgba(56, 189, 248, ${0.6 + glow * 0.4})` : `rgba(129, 140, 248, ${0.6 + glow * 0.4})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + glow * 1, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let k = signals.length - 1; k >= 0; k--) {
        const sig = signals[k];
        sig.progress += sig.speed;

        const n1 = nodes[sig.fromIndex];
        const n2 = nodes[sig.toIndex];

        if (!n1 || !n2 || sig.progress >= 1) {
          signals.splice(k, 1);
          continue;
        }

        const px = n1.x + (n2.x - n1.x) * sig.progress;
        const py = n1.y + (n2.y - n1.y) * sig.progress;

        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(signalInterval);
      window.removeEventListener('resize', resizeCanvas);
      if (parentEl) {
        parentEl.removeEventListener('mousemove', handleMouseMove);
        parentEl.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const pillars = [
    {
      icon: Wifi,
      title: isHe ? 'אפיון ותכנון רשתות' : 'Network Architecture',
      tag: 'NETWORKING & WI-FI',
      desc: isHe
        ? 'מכירה, אפיון והטמעה של סוויצ\'ים, נתבים, נקודות גישה ופרויקטי תקשורת מקצה לקצה עד למסירה ותיעוד מלא.'
        : 'Procurement, architecture & deployment of switches, routers, access points and end-to-end communication projects.',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      icon: HardDrive,
      title: isHe ? 'אספקת ציוד וחומרה' : 'Genuine Hardware Supply',
      tag: 'ORIGINAL HARDWARE',
      desc: isHe
        ? 'אספקת שרתים, תחנות עבודה, ניידים ופתרונות אחסון מקוריים מיצרנים מובילים בעולם עם אחריות מלאה.'
        : 'Direct supply of original servers, workstations, laptops and storage solutions from world-leading OEMs with full warranty.',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      icon: Layers,
      title: isHe ? 'פרויקטי "יישור קו"' : 'Infrastructure Alignment',
      tag: 'STANDARDIZATION',
      desc: isHe
        ? 'הבראת תשתיות, סידור ארונות תקשורת, מיגרציות וסדר תפעולי המהווים בסיס יציב לשירות ארוך טווח.'
        : 'Infrastructure remediation, rack cable management, cloud migrations, and operational standardization for long-term stability.',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      icon: Lock,
      title: isHe ? 'אבטחה ותמיכה שוטפת' : 'Security & SLA Managed Services',
      tag: 'SECURITY & SLA',
      desc: isHe
        ? 'חומות אש, הגנת תחנות, ניהול סביבות M365/Azure ושירותי תמיכה בריטיינר עם מענה אנושי ועמידה ב-SLA.'
        : 'Enterprise firewalls, endpoint protection, M365/Azure cloud administration and retainer support with strict SLA metrics.',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    }
  ];

  const advantages = [
    {
      title: isHe ? 'ציוד מקורי ואחריות יצרן מלאה' : '100% OEM Genuine Hardware & Warranty',
      badge: 'ORIGINAL HARDWARE',
      desc: isHe
        ? 'אספקה ישירה של שרתים, מתגים, תחנות עבודה ופתרונות אחסון מהיצרנים המובילים בעולם (Dell, Lenovo, Cisco, Fortinet, HPE) עם תעודות מקור ואחריות יצרן מלאה.'
        : 'Direct OEM supply of enterprise servers, switches, workstations, and storage solutions (Dell, Lenovo, Cisco, Fortinet, HPE) with certified source documentation and warranty.',
      icon: HardDrive,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    },
    {
      title: isHe ? 'יישור קו וסדר תפעולי מוחלט' : 'Infrastructure Alignment & Standardization',
      badge: 'STANDARDIZATION',
      desc: isHe
        ? 'הבראת תשתיות קיימות, סידור ארונות תקשורת, מיגרציות ותיעוד הנדסי שקוף שמבטיח שקט תעשייתי ושליטה מלאה של הארגון.'
        : 'Comprehensive infrastructure remediation, rack cable organization, cloud migrations, and clear engineering documentation for total operational peace of mind.',
      icon: Layers,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30'
    },
    {
      title: isHe ? 'תגובה מהירה ועמידה ב-SLA' : 'Rapid Response & 24/7 SLA Guarantee',
      badge: '24/7 SLA GUARANTEE',
      desc: isHe
        ? 'מוקד תמיכה פרואקטיבי, ניטור רציף 24/7 ומענה אנושי ישיר ע"י מהנדסי IT בכירים בלבד – ללא מענה אוטומטי מנותק.'
        : 'Proactive support desk, 24/7 continuous monitoring, and direct human response by senior IT engineers — never outsourced bots.',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: isHe ? 'התמחות בסביבות ביטחוניות ורגישות' : 'Defense Grade & Classified Systems Expertise',
      badge: 'DEFENSE GRADE',
      desc: isHe
        ? 'ניסיון עשיר בסביבות מוקשחות, נהלי אבטחת מידע מוחמרים, הפרדת רשתות (Air-Gapped) וחומות אש מבוצרות.'
        : 'Proven experience in hardened environments, defense security standards, air-gapped network isolation, and fortified cyber firewalls.',
      icon: Lock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      title: isHe ? 'מודל Delivery צפוי ומבוקר' : 'Predictable & Controlled Delivery Model',
      badge: 'FIXED BUDGET',
      desc: isHe
        ? 'תקציב IT שקוף במודל ריטיינר מנוהל ללא עלויות נסתרות או הפתעות, המותאם בצורה דינמית לקצב צמיחת הארגון.'
        : 'Transparent IT budget under a managed retainer model without hidden fees or surprises, dynamically scaled to your growth.',
      icon: Award,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      title: isHe ? 'מעטפת Turnkey מקצה לקצה' : 'One-Stop Turnkey Enterprise Partner',
      badge: 'ONE-STOP IT PARTNER',
      desc: isHe
        ? 'כתובת מקצועית אחת לאפיון, אספקת ציוד, הטמעה בשטח וניהול שוטף לטווח ארוך – גורם אחד שאחראי על הכל.'
        : 'Single responsible engineering point for assessment, hardware procurement, field deployment, and long-term lifecycle management.',
      icon: Network,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30'
    }
  ];

  return (
    <section className="relative overflow-hidden bg-[#07090e]">
      
      {/* 1. Full-Screen Viewport Interactive Network Mesh Hero Fold */}
      <div className="relative min-h-[calc(100vh-80px)] sm:min-h-screen flex flex-col items-center justify-between py-8 sm:py-12 px-4 sm:px-6 z-10 overflow-hidden">
        
        {/* Full-bleed interactive background canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto opacity-75 z-0"
        />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-blue-900/25 via-cyan-900/20 to-purple-900/20 rounded-full blur-[150px] pointer-events-none" />

        {/* Main Center Content (Headline + Slogan + CTAs) */}
        <div className="relative z-10 text-center space-y-6 max-w-4xl mx-auto my-auto py-8">
          
          {/* Official Slogan Quote */}
          <div className="inline-block px-5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
            <p className="text-slate-200 text-sm sm:text-base font-serif italic tracking-wide ltr">
              "Empowering businesses with cutting-edge IT solutions."
            </p>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.15] font-heading drop-shadow-md">
            {isHe ? (
              <>
                תשתיות מחשוב, אפיון רשתות,<br />
                <span className="gemini-text-gradient">
                  סייבר ופיתוח מערכות מורכבות
                </span>
              </>
            ) : (
              <>
                Enterprise IT Infrastructure, Cybersecurity<br />
                <span className="gemini-text-gradient">
                  & Complex Custom Software Engineering
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-lg leading-relaxed font-normal max-w-3xl mx-auto drop-shadow-sm">
            {isHe
              ? 'טק-סלקט מספקת מעטפת הנדסית מלאה לארגונים: מאפיון ותכנון רשתות תקשורת, אבטחת מידע מתקדמת, פיתוח תוכנה ומערכות מורכבות, ניהול IT במודל ריטיינר ב-SLA, לצד אספקת ציוד משלימה כמעטפת שירות מלאה ללקוח.'
              : 'TECH-SELECT delivers a total engineering IT envelope: network architecture, cybersecurity, complex custom software engineering, managed SLA support, alongside OEM hardware supply as a value-added service.'}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-medium px-7 py-3.5 rounded-full text-xs sm:text-sm shadow-xl shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>{isHe ? 'תיאום פגישת אפיון ותכנון IT' : 'Schedule Tech Assessment'}</span>
              {isHe ? <ArrowLeft className="w-4 h-4 text-cyan-200" /> : <ArrowRight className="w-4 h-4 text-cyan-200" />}
            </a>

            <button
              onClick={onOpenServicesIndex}
              className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/50 px-6 py-3.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer group"
            >
              <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>{isHe ? 'מפתח השירותים והציוד' : 'Explore Services & Hardware'}</span>
            </button>

            {onNavigateToDefense && (
              <button
                onClick={onNavigateToDefense}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/50 px-6 py-3.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer group"
              >
                <ShieldAlert className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>{isHe ? 'מענה לגופים רגישים וביטחוניים' : 'Defense & Sensitive Sector Envelope'}</span>
              </button>
            )}
          </div>

          {/* Core Technical Capabilities Strip */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
              <span className="text-xs font-medium text-slate-200">{isHe ? 'אפיון ותכנון רשתות' : 'Network Engineering'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
              <span className="text-xs font-medium text-slate-200">{isHe ? 'אספקת ציוד תקשורת וחומרה' : 'Hardware & Supply'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
              <span className="text-xs font-medium text-slate-200">{isHe ? 'אבטחת מידע וסייבר' : 'Cyber & Security'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
              <span className="text-xs font-medium text-slate-200">{isHe ? 'תשתיות מסווגות ו-Air-Gap' : 'Air-Gap & Defense IT'}</span>
            </div>
          </div>

        </div>

        {/* Downward Scroll Indicator */}
        <div className="relative z-10 pt-4 animate-bounce">
          <a href="#advantages" className="text-slate-400 hover:text-cyan-400 transition-colors flex flex-col items-center gap-1 text-xs font-mono">
            <span>{isHe ? 'גולל לגילוי יתרונות TECH-SELECT' : 'Scroll to explore TECH-SELECT advantages'}</span>
            <ChevronDown className="w-4 h-4" />
          </a>
        </div>

      </div>

      {/* 2. Key Strategic Advantages Grid (HIGH AUTHORITY SECTION) */}
      <div id="advantages" className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 py-12 sm:py-16 border-t border-white/10">
        <div className="text-center space-y-3 mb-10 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/70 border border-cyan-500/40 px-3.5 py-1 rounded-full shadow-sm">
            WHY TECH-SELECT
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">
            {isHe ? 'היתרונות המרכזיים המעניקים לארגון שלך שקט תעשייתי' : 'Core Advantages Delivering Complete Peace of Mind'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isHe
              ? 'אנחנו מביאים לארגון מעטפת הנדסית יציבה, מקצועית ומחויבת – מאספקת ציוד תקשורת ועד לניהול שוטף ומאובטח.'
              : 'We provide a stable, highly professional, and dedicated engineering envelope — from networking hardware supply to ongoing secure management.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((adv, idx) => {
            const Icon = adv.icon;
            return (
              <SpotlightCard
                key={idx}
                className="p-6 flex flex-col justify-between border-2 border-slate-700/70 bg-[#0d121f]/85 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.25)] hover:bg-[#12182b] transition-all duration-300"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl ${adv.bgColor} border ${adv.borderColor} ${adv.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/40">
                      {adv.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-heading pt-1">
                    {adv.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {adv.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-cyan-400 font-semibold">
                  <span>{isHe ? 'יתרון ארגוני מוכח' : 'Proven Enterprise Advantage'}</span>
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>

      {/* 3. Executive 4-Pillars Section */}
      <div id="pillars" className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 py-12 sm:py-16 border-t border-white/10">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
            FOUR EXECUTIVE PILLARS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading">
            {isHe ? 'עמודי התווך של TECH-SELECT' : 'The Executive Pillars of TECH-SELECT'}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <SpotlightCard
                key={idx}
                className="p-6 flex flex-col justify-between border-2 border-slate-700/70 bg-[#0d121f]/85 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.25)] hover:bg-[#12182b] transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-2xl ${item.bgColor} border ${item.borderColor} ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-heading pt-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-cyan-400 font-medium">
                  <span>{isHe ? 'שותף אסטרטגי לארגון' : 'Strategic IT Partner'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>

    </section>
  );
};
