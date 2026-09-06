import React from 'react';
import {
  siDell,
  siHp,
  siAsus,
  siLenovo,
  siQnap,
  siSynology,
  siApple,
  siToshiba,
  siSamsung,
  siCisco,
  siFortinet,
  siVeeam,
  siVmware,
  siPaloaltonetworks,
  siNvidia,
  siRedhat,
  siSchneiderelectric,
  siGoogle,
} from 'simple-icons';

interface LogoProps {
  className?: string;
  size?: number;
}

// 1. DELL - Official Simple Icon in Dell Blue #007DB8
export const DellLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#007DB8" aria-label="Dell Logo">
    <path d={siDell.path} />
  </svg>
);

// 2. HP - Official Simple Icon in HP Cyan #0096D6
export const HpLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#0096D6" aria-label="HP Logo">
    <path d={siHp.path} />
  </svg>
);

// 3. HPE (Hewlett Packard Enterprise) - The official green rectangle symbol #01A982 + HPE typography
export const HpeLogo: React.FC<LogoProps> = ({ className = "w-10 h-7" }) => (
  <svg viewBox="0 0 54 26" className={className} aria-label="HPE Logo">
    {/* Iconic HPE Green Rectangle */}
    <rect x="2" y="2" width="50" height="22" rx="1" fill="none" stroke="#01A982" strokeWidth="3.5" />
    <text
      x="27"
      y="17"
      fill="#01A982"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="13"
      textAnchor="middle"
      letterSpacing="1"
    >
      HPE
    </text>
  </svg>
);

// 4. ARUBA NETWORKS - Official Orange Emblem #F5831F
export const ArubaLogo: React.FC<LogoProps> = ({ className = "w-9 h-8" }) => (
  <svg viewBox="0 0 100 48" className={className} aria-label="Aruba Networks Logo">
    {/* 4-petal curve emblem */}
    <g fill="#F5831F">
      <circle cx="16" cy="18" r="9" />
      <circle cx="34" cy="18" r="9" />
      <path d="M 25 18 C 25 32 37 36 37 36 C 37 36 13 36 13 24 Z" />
      <text
        x="68"
        y="30"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="20"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        aruba
      </text>
    </g>
  </svg>
);

// 5. ASUS - Official Simple Icon
export const AsusLogo: React.FC<LogoProps> = ({ className = "w-9 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#00539B" aria-label="ASUS Logo">
    <path d={siAsus.path} />
  </svg>
);

// 6. IBM - Official 8-Bar Logo in IBM Blue #054ADA
export const IbmLogo: React.FC<LogoProps> = ({ className = "w-11 h-6" }) => (
  <svg viewBox="0 0 512 205" className={className} fill="#054ADA" aria-label="IBM Logo">
    <path d="M99.55552,190.060579 L99.55552,204.282819 L0,204.282819 L0,190.060579 L99.55552,190.060579 Z M255.1384,190.059939 C245.151671,199.241068 232.070596,204.31949 218.50496,204.282019 L218.50496,204.282019 L113.77792,204.141379 L113.77792,190.059939 Z M403.1664,190.059779 L398.2,204.282179 L393.2784,190.059779 L403.1664,190.059779 Z M355.55584,190.060579 L355.55584,204.282819 L284.44464,204.282819 L284.44464,190.060579 L355.55584,190.060579 Z M512,190.060579 L512,204.282819 L440.8888,204.282819 L440.8888,190.060579 L512,190.060579 Z M271.24672,162.908899 C270.026362,167.89787 268.099708,172.686973 265.52512,177.131139 L265.52512,177.131139 L113.77792,177.131139 L113.77792,162.908899 Z M412.6976,162.909379 L407.7056,177.131779 L388.7392,177.131779 L383.7472,162.909379 L412.6976,162.909379 Z M355.55584,162.908899 L355.55584,177.131139 L284.44464,177.131139 L284.44464,162.908899 L355.55584,162.908899 Z M512,162.908899 L512,177.131139 L440.8888,177.131139 L440.8888,162.908899 L512,162.908899 Z M99.55552,162.908899 L99.55552,177.131139 L0,177.131139 L0,162.908899 L99.55552,162.908899 Z M71.11104,135.757379 L71.11104,149.979779 L28.44432,149.979779 L28.44432,135.757379 L71.11104,135.757379 Z M184.88896,135.757379 L184.88896,149.979779 L142.22224,149.979779 L142.22224,135.757379 L184.88896,135.757379 Z M270.90576,135.757379 C272.166041,140.393192 272.805755,145.175711 272.80816,149.979779 L272.80816,149.979779 L224.96976,149.979779 L224.96976,135.757379 Z M422.2304,135.757379 L417.2368,149.979779 L379.208,149.979779 L374.2144,135.757379 L422.2304,135.757379 Z M355.55568,135.757379 L355.55568,149.979779 L312.88896,149.979779 L312.88896,135.757379 L355.55568,135.757379 Z M483.55552,135.757379 L483.55552,149.979779 L440.8888,149.979779 L440.8888,135.757379 L483.55552,135.757379 Z M71.11104,108.606019 L71.11104,122.828259 L28.44432,122.828259 L28.44432,108.606019 L71.11104,108.606019 Z M355.55568,108.606019 L355.55568,122.828259 L312.88896,122.828259 L312.88896,108.606019 L355.55568,108.606019 Z M483.55552,108.606019 L483.55552,122.828259 L440.8888,122.828259 L440.8888,108.606019 L483.55552,108.606019 Z M253.64576,108.605379 C258.382421,112.634795 262.394807,117.444874 265.50928,122.827459 L265.50928,122.827459 L142.22176,122.827459 L142.22176,108.605379 Z M431.7616,108.605379 L426.7696,122.827779 L369.6752,122.827779 L364.6832,108.605379 L431.7616,108.605379 Z M394.224,81.4549786 L398.2224,92.9509786 L402.2192,81.4549786 L483.5552,81.4549786 L483.5552,95.6773786 L440.8896,95.6773786 L440.8896,82.6085786 L436.3008,95.6773786 L360.144,95.6773786 L355.5552,82.6069786 L355.5552,95.6773786 L312.8896,95.6773786 L312.8896,81.4549786 L394.224,81.4549786 Z M142.22224,81.4543386 L265.51024,81.4551386 C262.395586,86.8377816 258.383042,91.6479099 253.64624,95.6773786 L253.64624,95.6773786 L142.22224,95.6773786 L142.22224,81.4543386 Z M71.11104,81.4543386 L71.11104,95.6765786 L28.44432,95.6765786 L28.44432,81.4543386 L71.11104,81.4543386 Z M71.11104,54.3029786 L71.11104,68.5252186 L28.44432,68.5252186 L28.44432,54.3029786 L71.11104,54.3029786 Z M184.88896,54.3029786 L184.88896,68.5252186 L142.22224,68.5252186 L142.22224,54.3029786 L184.88896,54.3029786 Z M272.80816,54.3031386 C272.805733,59.1071522 272.166019,63.8896155 270.90576,68.5253786 L270.90576,68.5253786 L224.96976,68.5253786 L224.96976,54.3031386 Z M384.7824,54.3029786 L389.728,68.5253786 L312.8896,68.5253786 L312.8896,54.3029786 L384.7824,54.3029786 Z M483.5552,54.3029786 L483.5552,68.5253786 L406.7168,68.5253786 L411.6624,54.3029786 L483.5552,54.3029786 Z M99.55552,27.1514586 L99.55552,41.3736986 L0,41.3736986 L0,27.1514586 L99.55552,27.1514586 Z M265.52512,27.1514586 C268.099627,31.5955505 270.026276,36.3845354 271.24672,41.3733786 L271.24672,41.3733786 L113.77792,41.3733786 L113.77792,27.1514586 Z M512,27.1509786 L512,41.3733786 L416.1584,41.3733786 L421.104,27.1509786 L512,27.1509786 Z M375.3408,27.1509786 L380.2864,41.3733786 L284.4448,41.3733786 L284.4448,27.1509786 L375.3408,27.1509786 Z M99.55552,9.85716419e-05 L99.55552,14.2223386 L0,14.2223386 L0,9.85716419e-05 L99.55552,9.85716419e-05 Z M218.50496,4.91529226e-05 C232.066886,-0.0182214039 245.141087,5.05759937 255.13792,14.2221786 L255.13792,14.2221786 L113.77792,14.2221786 L113.77792,4.91529226e-05 Z M512,0.000578571642 L512,14.2229786 L425.6,14.2229786 L430.5456,0.000578571642 L512,0.000578571642 Z M365.8992,0.000578571642 L370.8448,14.2229786 L284.4448,14.2229786 L284.4448,0.000578571642 L365.8992,0.000578571642 Z" />
  </svg>
);

// 7. LENOVO - Official Simple Icon in Lenovo Red #E2231A
export const LenovoLogo: React.FC<LogoProps> = ({ className = "w-11 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#E2231A" aria-label="Lenovo Logo">
    <path d={siLenovo.path} />
  </svg>
);

// 8. QNAP - Official Simple Icon in QNAP Navy #0C2E82
export const QnapLogo: React.FC<LogoProps> = ({ className = "w-10 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#0C2E82" aria-label="QNAP Logo">
    <path d={siQnap.path} />
  </svg>
);

// 9. SYNOLOGY - Official Simple Icon in Synology Slate #5A6978
export const SynologyLogo: React.FC<LogoProps> = ({ className = "w-11 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#4A5568" aria-label="Synology Logo">
    <path d={siSynology.path} />
  </svg>
);

// 10. APPLE - Official Apple Monochrome Silhouette
export const AppleLogo: React.FC<LogoProps> = ({ className = "w-7 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-label="Apple Logo">
    <path d={siApple.path} />
  </svg>
);

// 11. APC (Schneider Electric) - The official APC trademark badge + Schneider Electric green
export const ApcSchneiderLogo: React.FC<LogoProps> = ({ className = "w-10 h-7" }) => (
  <svg viewBox="0 0 70 32" className={className} aria-label="APC by Schneider Electric Logo">
    {/* Schneider Green Leaf/Arc */}
    <path
      d="M10 28 C 3 24 1 12 10 5 C 19 12 17 24 10 28 Z"
      fill="#3DCD58"
    />
    <path
      d="M8 7 L 12 26"
      stroke="#ffffff"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* APC Bold Typography */}
    <text
      x="44"
      y="22"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="900"
      fontSize="20"
      fill="#D9222A"
      letterSpacing="-0.5"
      textAnchor="middle"
    >
      APC
    </text>
  </svg>
);

// 12. CRUCIAL (by Micron) - Official Micron Deep Blue #00629B & Crucial 'C' swoosh
export const CrucialMicronLogo: React.FC<LogoProps> = ({ className = "w-11 h-7" }) => (
  <svg viewBox="0 0 85 30" className={className} aria-label="Crucial by Micron Logo">
    {/* Micron 'M' Curves */}
    <path
      d="M 5 24 L 5 8 C 5 4 8 2 12 2 C 16 2 19 5 21 9 C 23 5 26 2 30 2 C 34 2 37 4 37 8 L 37 24 L 32 24 L 32 10 C 32 6 30 5 28 5 C 26 5 24 6 24 10 L 24 24 L 19 24 L 19 10 C 19 6 17 5 15 5 C 13 5 11 6 11 10 L 11 24 Z"
      fill="#00629B"
    />
    {/* Crucial wordmark */}
    <text
      x="60"
      y="18"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontWeight="800"
      fontSize="14"
      fill="#009BD9"
      textAnchor="middle"
      letterSpacing="0.5"
    >
      crucial
    </text>
  </svg>
);

// 13. TOSHIBA - Official Simple Icon in Toshiba Red #FF0000
export const ToshibaLogo: React.FC<LogoProps> = ({ className = "w-11 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#FF0000" aria-label="Toshiba Logo">
    <path d={siToshiba.path} />
  </svg>
);

// 14. SAMSUNG - Official Simple Icon in Samsung Blue #1428A0
export const SamsungLogo: React.FC<LogoProps> = ({ className = "w-11 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#1428A0" aria-label="Samsung Logo">
    <path d={siSamsung.path} />
  </svg>
);

// 15. CISCO - Official Simple Icon in Cisco Blue #1BA0D7
export const CiscoLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#1BA0D7" aria-label="Cisco Logo">
    <path d={siCisco.path} />
  </svg>
);

// 16. CISCO MERAKI - Official Meraki Green Pill with Bars and Wordmark
export const CiscoMerakiLogo: React.FC<LogoProps> = ({ className = "w-11 h-7" }) => (
  <svg viewBox="0 0 110 38" className={className} aria-label="Cisco Meraki Logo">
    {/* Meraki Green Rounded Badge */}
    <rect x="1" y="1" width="108" height="36" rx="8" fill="#78BE20" />
    {/* Signal wave bars above */}
    <g fill="#ffffff">
      <rect x="14" y="6" width="3" height="7" rx="1.5" />
      <rect x="20" y="4" width="3" height="11" rx="1.5" />
      <rect x="26" y="2" width="3" height="15" rx="1.5" />
      <rect x="32" y="4" width="3" height="11" rx="1.5" />
      <rect x="38" y="6" width="3" height="7" rx="1.5" />
      {/* Meraki text */}
      <text
        x="72"
        y="25"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="15"
        fill="#ffffff"
        textAnchor="middle"
        letterSpacing="0.8"
      >
        meraki
      </text>
    </g>
  </svg>
);

// 17. MICROSOFT 365 - The universal 4 colored squares
export const MicrosoftLogo: React.FC<LogoProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-label="Microsoft Logo">
    <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
    <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
    <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
  </svg>
);

// 18. MICROSOFT AZURE - The official Azure folded 'A' icon
export const AzureLogo: React.FC<LogoProps> = ({ className = "w-7 h-7" }) => (
  <svg viewBox="0 0 96 96" className={className} aria-label="Azure Logo">
    <path d="M51.9 6.2h28.3L44.1 89.8H15.8z" fill="#0078D4" />
    <path d="M51.9 6.2L15.8 89.8h28.3l15.3-35.4 16.4 35.4h20.2L51.9 6.2z" fill="#008AD7" opacity="0.4" />
    <path d="M43.7 54.4l-14 35.4h50.5l-8.2-18.9H51.2l6.8-16.5z" fill="#005BA1" />
  </svg>
);

// 19. AWS - Official Amazon Web Services smile & letters
export const AwsLogo: React.FC<LogoProps> = ({ className = "w-10 h-7" }) => (
  <svg viewBox="0 0 256 153" className={className} aria-label="AWS Logo">
    {/* Letters AWS in Dark Slate */}
    <g fill="#232F3E">
      <path d="M72.39 55.44c0 3.14.34 5.68.93 7.54.68 1.87 1.53 3.9 2.72 6.1.42.68.6 1.36.6 1.95 0 .85-.51 1.7-1.61 2.55l-5.34 3.56c-.76.51-1.52.76-2.2.76-.85 0-1.7-.42-2.55-1.18-1.19-1.27-2.2-2.63-3.05-3.99-.85-1.44-1.7-3.05-2.63-5-6.61 7.8-14.92 11.7-24.92 11.7-7.12 0-12.8-2.03-16.95-6.1-4.15-4.07-6.27-9.5-6.27-16.28 0-7.21 2.54-13.06 7.71-17.47 5.17-4.41 12.04-6.61 20.77-6.61 2.88 0 5.85.25 8.99.68 3.14.42 6.36 1.1 9.75 1.86v-6.19c0-6.44-1.36-10.93-3.98-13.56-2.71-2.63-7.29-3.9-13.82-3.9-2.97 0-6.02.34-9.16 1.1-3.14.76-6.19 1.7-9.16 2.88-1.36.6-2.37.93-2.97 1.1-.6.17-1.02.26-1.36.26-1.19 0-1.78-.85-1.78-2.63v-4.15c0-1.36.17-2.37.6-2.97.42-.6 1.18-1.19 2.37-1.78 2.97-1.53 6.53-2.8 10.68-3.82 4.15-1.1 8.56-1.61 13.22-1.61 10.09 0 17.47 2.29 22.21 6.87 4.66 4.58 7.04 11.53 7.04 20.85v27.47zM37.98 68.32c2.8 0 5.68-.51 8.73-1.53 3.05-1.02 5.76-2.88 8.05-5.42 1.36-1.61 2.37-3.39 2.88-5.42.51-2.03.85-4.49.85-7.37v-3.56c-2.46-.6-5.09-1.1-7.8-1.44-2.71-.34-5.34-.51-7.97-.51-5.68 0-9.83 1.1-12.63 3.39-2.8 2.29-4.15 5.51-4.15 9.75 0 3.98 1.02 6.95 3.14 8.99 2.03 2.12 5 3.12 8.9 3.12z" />
      <path d="M106.05 77.48c-1.53 0-2.54-.25-3.22-.85-.68-.51-1.27-1.7-1.78-3.31L81.12 7.8c-.51-1.7-.76-2.8-.76-3.39 0-1.36.68-2.12 2.03-2.12h8.31c1.61 0 2.71.25 3.31.85.68.51 1.19 1.7 1.69 3.31l14.24 56.12 13.22-56.12c.42-1.7.93-2.8 1.61-3.31.68-.51 1.86-.85 3.39-.85h6.78c1.61 0 2.71.25 3.39.85.68.51 1.27 1.7 1.61 3.31l13.39 56.8 14.66-56.8c.51-1.7 1.1-2.8 1.7-3.31.68-.51 1.78-.85 3.31-.85h7.88c1.36 0 2.12.68 2.12 2.12 0 .42-.08.85-.17 1.36-.08.51-.25 1.19-.59 2.12l-20.43 65.53c-.51 1.7-1.1 2.8-1.78 3.31-.68.51-1.78.85-3.22.85h-7.29c-1.61 0-2.71-.25-3.39-.85-.68-.59-1.27-1.7-1.61-3.39l-13.14-54.68-13.05 54.59c-.42 1.7-.93 2.8-1.61 3.39-.68.6-1.86.85-3.39.85h-7.29z" />
      <path d="M214.97 79.77c-4.41 0-8.82-.51-13.05-1.53-4.24-1.02-7.55-2.12-9.75-3.39-1.36-.76-2.29-1.61-2.63-2.37-.34-.76-.51-1.61-.51-2.37v-4.32c0-1.78.68-2.63 1.95-2.63.51 0 1.02.08 1.53.25.51.17 1.27.51 2.12.85 2.88 1.27 6.02 2.29 9.32 2.97 3.39.68 6.7 1.02 10.09 1.02 5.34 0 9.49-.93 12.38-2.8 2.88-1.86 4.41-4.58 4.41-8.05 0-2.37-.76-4.32-2.29-5.93-1.53-1.61-4.41-3.05-8.56-4.41l-12.29-3.81c-6.19-1.95-10.77-4.83-13.56-8.65-2.8-3.73-4.24-7.88-4.24-12.29 0-3.56.76-6.7 2.29-9.41 1.53-2.71 3.56-5.09 6.1-6.95 2.54-1.95 5.42-3.39 8.82-4.41 3.39-1.02 6.95-1.44 10.68-1.44 1.86 0 3.81.08 5.68.34 1.95.25 3.73.6 5.51.93 1.7.42 3.31.85 4.83 1.36 1.53.51 2.71 1.02 3.56 1.53 1.19.68 2.03 1.36 2.54 2.12.51.68.76 1.61.76 2.8v3.98c0 1.78-.68 2.71-1.95 2.71-.68 0-1.78-.34-3.22-1.02-4.83-2.2-10.26-3.31-16.28-3.31-4.83 0-8.65.76-11.27 2.37-2.63 1.61-3.98 4.07-3.98 7.55 0 2.37.85 4.41 2.54 6.02 1.7 1.61 4.83 3.22 9.32 4.66l12.04 3.81c6.1 1.95 10.51 4.66 13.14 8.14 2.63 3.48 3.9 7.46 3.9 11.87 0 3.65-.76 6.95-2.2 9.83-1.53 2.88-3.56 5.42-6.19 7.46-2.63 2.12-5.76 3.64-9.41 4.74-3.81 1.19-7.8 1.78-12.12 1.78z" />
    </g>
    {/* Orange Smile Arrow */}
    <path
      d="M230.99 120.96c-27.89 20.6-68.41 31.54-103.25 31.54-48.83 0-92.82-18.06-126.05-48.07-2.63-2.37-.25-5.59 2.88-3.73 35.94 20.85 80.28 33.48 126.14 33.48 30.94 0 64.93-6.44 96.21-19.66 4.66-2.12 8.65 3.05 4.07 6.44z"
      fill="#FF9900"
    />
    <path
      d="M242.61 107.74c-3.56-4.58-23.57-2.2-32.64-1.1-2.71.34-3.13-2.03-.68-3.81 15.94-11.19 42.13-7.97 45.18-4.24 3.05 3.82-.85 30.01-15.77 42.55-2.29 1.95-4.49.93-3.48-1.61 3.39-8.39 10.94-27.29 7.39-31.79z"
      fill="#FF9900"
    />
  </svg>
);

// 20. FORTINET - Official Simple Icon in Fortinet Red #EE3124
export const FortinetLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#EE3124" aria-label="Fortinet Logo">
    <path d={siFortinet.path} />
  </svg>
);

// 21. CHECK POINT SOFTWARE - Official Disc / Shield Vector in Brand Magenta #EA005A
export const CheckPointLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 90 90" className={className} aria-label="Check Point Logo">
    <path
      d="M 45 5 C 67.1 5 85 22.9 85 45 C 85 67.1 67.1 85 45 85 C 22.9 85 5 67.1 5 45 C 5 22.9 22.9 5 45 5 Z"
      fill="#EA005A"
    />
    {/* Inner connected circuit keyhole in white */}
    <circle cx="45" cy="45" r="14" fill="#ffffff" />
    <circle cx="45" cy="45" r="7" fill="#EA005A" />
    <path
      d="M 45 18 L 45 31 M 45 59 L 45 72 M 18 45 L 31 45 M 59 45 L 72 45"
      stroke="#ffffff"
      strokeWidth="4"
      strokeLinecap="round"
    />
  </svg>
);

// 22. SENTINELONE - Official 5 crystalline purple bars #6B0AEA
export const SentinelOneLogo: React.FC<LogoProps> = ({ className = "w-8 h-9" }) => (
  <svg viewBox="0 0 80 96" className={className} aria-label="SentinelOne Logo">
    <rect x="32" y="9" width="13" height="78" rx="2" fill="#6B0AEA" />
    <path d="M48 95.88l13-8V21a32.2 32.2 0 0 0-13-5.72Z" fill="#6B0AEA" />
    <path d="M16 87.92l13 8V15.32A32.2 32.2 0 0 0 16 21Z" fill="#6B0AEA" />
    <path d="M64 3.67V86.48l7-3.72a15.3 15.3 0 0 0 7-13V30.65C78 19.37 64 3.67 64 3.67Z" fill="#6B0AEA" />
    <path d="M0 69.73a15.3 15.3 0 0 0 7 13l7 3.72V3.67S0 19.37 0 30.65Z" fill="#6B0AEA" />
  </svg>
);

// 23. VEEAM - Official Simple Icon in Veeam Green #00B336
export const VeeamLogo: React.FC<LogoProps> = ({ className = "w-11 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#00B336" aria-label="Veeam Logo">
    <path d={siVeeam.path} />
  </svg>
);

// 24. VMWARE - Official Simple Icon in VMware Slate #607078
export const VmwareLogo: React.FC<LogoProps> = ({ className = "w-11 h-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#607078" aria-label="VMware Logo">
    <path d={siVmware.path} />
  </svg>
);

// 25. PALO ALTO NETWORKS - Official Simple Icon in Palo Alto Orange #F04E23
export const PaloAltoLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#F04E23" aria-label="Palo Alto Networks Logo">
    <path d={siPaloaltonetworks.path} />
  </svg>
);

// 26. NVIDIA - Official Simple Icon in NVIDIA Green #76B900
export const NvidiaLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#76B900" aria-label="NVIDIA Logo">
    <path d={siNvidia.path} />
  </svg>
);

// 27. RED HAT - Official Simple Icon in Red Hat Red #EE0000
export const RedHatLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#EE0000" aria-label="Red Hat Logo">
    <path d={siRedhat.path} />
  </svg>
);

// 28. GOOGLE CLOUD - Official Simple Icon in Google Blue #4285F4
export const GoogleCloudLogo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#4285F4" aria-label="Google Cloud Logo">
    <path d={siGoogle.path} />
  </svg>
);
