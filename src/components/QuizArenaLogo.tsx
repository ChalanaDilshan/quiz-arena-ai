import React from 'react';

interface QuizArenaLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const QuizArenaLogo: React.FC<QuizArenaLogoProps> = ({
  className = 'w-6 h-6',
  size,
  glow = true,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      <defs>
        {/* Shield Outer Gradient */}
        <linearGradient id="qaShieldGrad" x1="50" y1="6" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F08A6E" />
          <stop offset="50%" stopColor="#E07A5F" />
          <stop offset="100%" stopColor="#A84724" />
        </linearGradient>

        {/* Flanking Wing Accents */}
        <linearGradient id="qaWingGrad" x1="12" y1="28" x2="88" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF9E80" />
          <stop offset="100%" stopColor="#8C3315" />
        </linearGradient>

        {/* Neural Circuit Tracks */}
        <linearGradient id="qaCircuitGrad" x1="50" y1="24" x2="50" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#E07A5F" />
        </linearGradient>

        {/* Luminous Core Glow */}
        <radialGradient id="qaCoreGlow" cx="50" cy="50" r="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
          <stop offset="35%" stopColor="#FBBF24" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#E07A5F" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E07A5F" stopOpacity="0" />
        </radialGradient>

        {/* Spark Filter */}
        <filter id="qaSparkGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Flanking Wings */}
      {/* Left Wing */}
      <path
        d="M 12 34 L 20 28 L 22 42 L 14 54 Z"
        fill="url(#qaWingGrad)"
        opacity="0.9"
      />
      <path
        d="M 7 45 L 15 39 L 16 51 L 10 61 Z"
        fill="url(#qaWingGrad)"
        opacity="0.65"
      />

      {/* Right Wing */}
      <path
        d="M 88 34 L 80 28 L 78 42 L 86 54 Z"
        fill="url(#qaWingGrad)"
        opacity="0.9"
      />
      <path
        d="M 93 45 L 85 39 L 84 51 L 90 61 Z"
        fill="url(#qaWingGrad)"
        opacity="0.65"
      />

      {/* Arena Shield Outer Hull */}
      <path
        d="M 50 8 L 78 18 L 78 48 C 78 68 50 88 50 88 C 50 88 22 68 22 48 L 22 18 Z"
        fill="#1C1412"
        stroke="url(#qaShieldGrad)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Inner Shield Bevel Accent */}
      <path
        d="M 50 14 L 72 22 L 72 47 C 72 63 50 80 50 80 C 50 80 28 63 28 47 L 28 22 Z"
        stroke="#E07A5F"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Neural Network Circuit Tracks */}
      <g stroke="url(#qaCircuitGrad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.9">
        {/* Ring Connections */}
        <line x1="50" y1="26" x2="67" y2="34" />
        <line x1="67" y1="34" x2="71" y2="52" />
        <line x1="71" y1="52" x2="59" y2="67" />
        <line x1="59" y1="67" x2="41" y2="67" />
        <line x1="41" y1="67" x2="29" y2="52" />
        <line x1="29" y1="52" x2="33" y2="34" />
        <line x1="33" y1="34" x2="50" y2="26" />

        {/* Inward Radial Circuit Traces */}
        <line x1="50" y1="26" x2="50" y2="38" />
        <line x1="67" y1="34" x2="59" y2="43" />
        <line x1="71" y1="52" x2="61" y2="52" />
        <line x1="59" y1="67" x2="54" y2="59" />
        <line x1="41" y1="67" x2="46" y2="59" />
        <line x1="29" y1="52" x2="39" y2="52" />
        <line x1="33" y1="34" x2="41" y2="43" />
      </g>

      {/* Neural Node Dots */}
      <g fill="#FED7AA">
        <circle cx="50" cy="26" r="2.5" />
        <circle cx="67" cy="34" r="2.5" />
        <circle cx="71" cy="52" r="2.5" />
        <circle cx="59" cy="67" r="2.5" />
        <circle cx="41" cy="67" r="2.5" />
        <circle cx="29" cy="52" r="2.5" />
        <circle cx="33" cy="34" r="2.5" />
      </g>

      {/* Luminous Core Ambient Glow */}
      {glow && (
        <circle cx="50" cy="50" r="18" fill="url(#qaCoreGlow)" />
      )}

      {/* Central Generative AI Diamond Spark */}
      <path
        d="M 50 35 Q 50 50 65 50 Q 50 50 50 65 Q 50 50 35 50 Q 50 50 50 35 Z"
        fill="#FFFFFF"
        filter={glow ? "url(#qaSparkGlow)" : undefined}
      />
      {/* Inner Warm Spark Facet */}
      <path
        d="M 50 41 Q 50 50 59 50 Q 50 50 50 59 Q 50 50 41 50 Q 50 50 50 41 Z"
        fill="#FEF08A"
      />
      {/* Central Core Point */}
      <circle cx="50" cy="50" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};

export default QuizArenaLogo;
