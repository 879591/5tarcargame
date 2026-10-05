import React from 'react';
import { CarDefinition } from '../data/cars';

interface GameLogoProps {
  size?: 'sm' | 'md' | 'lg';
  gameName?: string;
}

export const GameLogo: React.FC<GameLogoProps> = ({ size = 'md', gameName = 'BABU CAR RACING' }) => {
  const parts = gameName.split(' ');
  const firstWord = parts[0] || 'BABU';
  const restWords = parts.slice(1).join(' ') || 'CAR RACING';

  const scaleClass =
    size === 'lg'
      ? 'text-3xl sm:text-4xl'
      : size === 'sm'
      ? 'text-lg sm:text-xl'
      : 'text-2xl sm:text-3xl';

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Original Speed Crest SVG */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size === 'lg' ? 56 : size === 'sm' ? 36 : 46}
          height={size === 'lg' ? 44 : size === 'sm' ? 28 : 36}
          viewBox="0 0 80 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(245,158,11,0.45)]"
        >
          {/* Speed motion streaks */}
          <path d="M2 16H28L22 22H2V16Z" fill="#F59E0B" />
          <path d="M8 28H32L26 34H8V28Z" fill="#EF4444" />
          <path d="M0 40H24L18 46H0V40Z" fill="#06B6D4" />

          {/* Checkered racing shield */}
          <path
            d="M30 8L74 8L64 52L20 52L30 8Z"
            fill="url(#logoGrad)"
            stroke="#F8FAFC"
            strokeWidth="2.5"
          />

          {/* Original stylized sports car silhouette */}
          <path
            d="M31 35L39 24H57L65 31L68 37H28L31 35Z"
            fill="#090D16"
          />
          <path
            d="M33 34L40 26H55L62 32H33V34Z"
            fill="#F8FAFC"
          />
          <circle cx="37" cy="38" r="5" fill="#F59E0B" stroke="#090D16" strokeWidth="2" />
          <circle cx="58" cy="38" r="5" fill="#F59E0B" stroke="#090D16" strokeWidth="2" />

          <defs>
            <linearGradient id="logoGrad" x1="20" y1="8" x2="74" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EF4444" />
              <stop offset="0.55" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-display font-bold italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-red-500 ${scaleClass}`}
          >
            {firstWord}
          </span>
          <span className="text-xs sm:text-sm font-mono-num font-bold text-amber-400 tracking-widest uppercase">
            🏁
          </span>
        </div>
        <span className="font-display font-bold italic tracking-[0.22em] text-xs sm:text-sm text-slate-200 uppercase">
          {restWords}
        </span>
      </div>
    </div>
  );
};

interface CarIllustrationProps {
  car: CarDefinition;
  className?: string;
  showShadow?: boolean;
}

export const CarIllustration: React.FC<CarIllustrationProps> = ({
  car,
  className = 'w-full h-40',
  showShadow = true,
}) => {
  const { primaryColor, secondaryColor, accentColor, bodyStyle } = car;

  // Adjust spoiler and roof contours based on bodyStyle so every car looks distinct
  const hasHighWing =
    bodyStyle === 'gt' ||
    bodyStyle === 'hyper' ||
    bodyStyle === 'aero' ||
    bodyStyle === 'champion';
  const isBulky = bodyStyle === 'muscle' || bodyStyle === 'offroad' || bodyStyle === 'desert';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 360 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-[360px]"
      >
        <defs>
          <linearGradient id={`bodyGrad-${car.id}`} x1="40" y1="40" x2="320" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="65%" stopColor={secondaryColor} />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id={`glassGrad-${car.id}`} x1="110" y1="45" x2="230" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#090D16" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id={`glow-${car.id}`} cx="50%" cy="68%" r="48%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.42" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground underglow shadow */}
        {showShadow && (
          <>
            <ellipse cx="180" cy="126" rx="145" ry="14" fill={`url(#glow-${car.id})`} />
            <ellipse cx="180" cy="124" rx="132" ry="8" fill="#020617" fillOpacity="0.85" />
          </>
        )}

        {/* Rear Aero Wing */}
        {hasHighWing && (
          <g>
            <path d="M44 68L30 46H54L58 68H44Z" fill={secondaryColor} stroke={accentColor} strokeWidth="1.5" />
            <rect x="24" y="42" width="36" height="6" rx="2" fill={primaryColor} stroke={accentColor} strokeWidth="1.5" />
          </g>
        )}

        {/* Main Chassis Silhouette */}
        {isBulky ? (
          <path
            d="M38 92L46 66L98 62L135 40H225L268 65L322 74L330 98L316 112H46L38 92Z"
            fill={`url(#bodyGrad-${car.id})`}
            stroke={accentColor}
            strokeWidth="2"
          />
        ) : (
          <path
            d="M32 96L48 68L105 62L152 38H228L276 66L332 78L336 98L320 112H42L32 96Z"
            fill={`url(#bodyGrad-${car.id})`}
            stroke={accentColor}
            strokeWidth="2"
          />
        )}

        {/* Cabin / Windshield */}
        <path
          d="M114 62L154 43H222L262 65L114 62Z"
          fill={`url(#glassGrad-${car.id})`}
          stroke={accentColor}
          strokeWidth="1.5"
        />

        {/* Racing Livery Stripe */}
        <path
          d="M52 84H318L310 92H46L52 84Z"
          fill={accentColor}
          fillOpacity="0.85"
        />

        {/* Side Air Intake Vent */}
        <path d="M185 74L215 74L206 98L176 98L185 74Z" fill="#090D16" fillOpacity="0.75" stroke={secondaryColor} strokeWidth="1.2" />

        {/* Headlight & Taillight LEDs */}
        <path d="M312 78L332 82L328 90L308 86L312 78Z" fill="#38BDF8" />
        <path d="M38 74L50 74L46 86L34 86L38 74Z" fill="#EF4444" />

        {/* Championship Crown Emblem for Car 10 */}
        {bodyStyle === 'champion' && (
          <path
            d="M160 76L166 86L174 74L182 86L188 76L185 92H163L160 76Z"
            fill="#FDE047"
          />
        )}

        {/* Rear Wheel */}
        <g>
          <circle cx="96" cy="108" r="24" fill="#0F172A" stroke="#334155" strokeWidth="4" />
          <circle cx="96" cy="108" r="16" fill="#1E293B" stroke={accentColor} strokeWidth="2" />
          <circle cx="96" cy="108" r="6" fill={primaryColor} />
          <line x1="96" y1="92" x2="96" y2="124" stroke={accentColor} strokeWidth="2" />
          <line x1="80" y1="108" x2="112" y2="108" stroke={accentColor} strokeWidth="2" />
        </g>

        {/* Front Wheel */}
        <g>
          <circle cx="268" cy="108" r="24" fill="#0F172A" stroke="#334155" strokeWidth="4" />
          <circle cx="268" cy="108" r="16" fill="#1E293B" stroke={accentColor} strokeWidth="2" />
          <circle cx="268" cy="108" r="6" fill={primaryColor} />
          <line x1="268" y1="92" x2="268" y2="124" stroke={accentColor} strokeWidth="2" />
          <line x1="252" y1="108" x2="284" y2="108" stroke={accentColor} strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};
