export interface CarDefinition {
  id: string;
  index: number;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bodyStyle: 'coupe' | 'muscle' | 'gt' | 'hyper' | 'offroad' | 'stealth' | 'desert' | 'aero' | 'royal' | 'champion';
  unlockType: 'free' | 'coins' | 'level' | 'championship';
  unlockCoins?: number;
  unlockLevel?: number;
  baseStats: {
    speed: number;        // 40 - 95
    acceleration: number; // 40 - 95
    handling: number;     // 40 - 95
    brake: number;        // 40 - 95
    nitro: number;        // 40 - 95
  };
  upgradeBasePrice: number;
}

export const ORIGINAL_CARS: CarDefinition[] = [
  {
    id: 'babu-racer',
    index: 1,
    name: 'Babu Racer',
    tagline: 'Balanced agility built for aspiring street champions.',
    primaryColor: '#EF4444',
    secondaryColor: '#F59E0B',
    accentColor: '#FFFFFF',
    bodyStyle: 'coupe',
    unlockType: 'free',
    baseStats: {
      speed: 52,
      acceleration: 55,
      handling: 60,
      brake: 54,
      nitro: 55,
    },
    upgradeBasePrice: 300,
  },
  {
    id: 'street-king',
    index: 2,
    name: 'Street King',
    tagline: 'Tuned urban drift specialist with high-torque launch.',
    primaryColor: '#3B82F6',
    secondaryColor: '#06B6D4',
    accentColor: '#E2E8F0',
    bodyStyle: 'muscle',
    unlockType: 'coins',
    unlockCoins: 2000,
    baseStats: {
      speed: 58,
      acceleration: 62,
      handling: 63,
      brake: 58,
      nitro: 60,
    },
    upgradeBasePrice: 450,
  },
  {
    id: 'thunder-gt',
    index: 3,
    name: 'Thunder GT',
    tagline: 'Twin-intake grand tourer engineered for highway sprints.',
    primaryColor: '#F59E0B',
    secondaryColor: '#EA580C',
    accentColor: '#FEF3C7',
    bodyStyle: 'gt',
    unlockType: 'coins',
    unlockCoins: 5000,
    baseStats: {
      speed: 65,
      acceleration: 64,
      handling: 66,
      brake: 63,
      nitro: 65,
    },
    upgradeBasePrice: 600,
  },
  {
    id: 'turbo-x',
    index: 4,
    name: 'Turbo X',
    tagline: 'Lightweight carbon chassis with rapid boost recovery.',
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentColor: '#A7F3D0',
    bodyStyle: 'hyper',
    unlockType: 'level',
    unlockLevel: 10,
    baseStats: {
      speed: 70,
      acceleration: 72,
      handling: 70,
      brake: 68,
      nitro: 74,
    },
    upgradeBasePrice: 800,
  },
  {
    id: 'road-beast',
    index: 5,
    name: 'Road Beast',
    tagline: 'Heavy-duty widebody machine that dominates rough passes.',
    primaryColor: '#DC2626',
    secondaryColor: '#1E293B',
    accentColor: '#FCA5A5',
    bodyStyle: 'offroad',
    unlockType: 'coins',
    unlockCoins: 10000,
    baseStats: {
      speed: 74,
      acceleration: 73,
      handling: 72,
      brake: 75,
      nitro: 72,
    },
    upgradeBasePrice: 1000,
  },
  {
    id: 'night-rider',
    index: 6,
    name: 'Night Rider',
    tagline: 'Stealth midnight interceptor with razor-sharp cornering.',
    primaryColor: '#1E1B4B',
    secondaryColor: '#06B6D4',
    accentColor: '#38BDF8',
    bodyStyle: 'stealth',
    unlockType: 'level',
    unlockLevel: 20,
    baseStats: {
      speed: 78,
      acceleration: 79,
      handling: 82,
      brake: 78,
      nitro: 77,
    },
    upgradeBasePrice: 1250,
  },
  {
    id: 'desert-storm',
    index: 7,
    name: 'Desert Storm',
    tagline: 'Sand-tested aerodynamic predator with thermal boost jets.',
    primaryColor: '#D97706',
    secondaryColor: '#78350F',
    accentColor: '#FDE68A',
    bodyStyle: 'desert',
    unlockType: 'coins',
    unlockCoins: 20000,
    baseStats: {
      speed: 82,
      acceleration: 81,
      handling: 80,
      brake: 81,
      nitro: 84,
    },
    upgradeBasePrice: 1500,
  },
  {
    id: 'speed-hawk',
    index: 8,
    name: 'Speed Hawk',
    tagline: 'Active-wing track prototype built for extreme velocity.',
    primaryColor: '#0284C7',
    secondaryColor: '#38BDF8',
    accentColor: '#F0F9FF',
    bodyStyle: 'aero',
    unlockType: 'level',
    unlockLevel: 30,
    baseStats: {
      speed: 86,
      acceleration: 85,
      handling: 86,
      brake: 84,
      nitro: 86,
    },
    upgradeBasePrice: 1800,
  },
  {
    id: 'royal-gt',
    index: 9,
    name: 'Royal GT',
    tagline: 'Signature luxury hyper-coupe with precision telemetry.',
    primaryColor: '#7C3AED',
    secondaryColor: '#F59E0B',
    accentColor: '#DDD6FE',
    bodyStyle: 'royal',
    unlockType: 'level',
    unlockLevel: 40,
    baseStats: {
      speed: 90,
      acceleration: 89,
      handling: 90,
      brake: 88,
      nitro: 90,
    },
    upgradeBasePrice: 2200,
  },
  {
    id: 'babu-champion',
    index: 10,
    name: 'Babu Champion',
    tagline: 'The apex Grand Championship flagship. Unrivaled speed.',
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    accentColor: '#FFFFFF',
    bodyStyle: 'champion',
    unlockType: 'championship',
    unlockLevel: 50,
    baseStats: {
      speed: 96,
      acceleration: 96,
      handling: 95,
      brake: 94,
      nitro: 98,
    },
    upgradeBasePrice: 3000,
  },
];

export interface AIProfile {
  id: string;
  name: string;
  color: string;
  accent: string;
  aggression: number; // 0.3 to 0.95
  skillFactor: number; // 0.85 to 1.08
}

export const AI_OPPONENTS: AIProfile[] = [
  { id: 'ai-1', name: 'Rocky', color: '#E11D48', accent: '#FFE4E6', aggression: 0.55, skillFactor: 0.88 },
  { id: 'ai-2', name: 'Speed King', color: '#2563EB', accent: '#DBEAFE', aggression: 0.85, skillFactor: 1.03 },
  { id: 'ai-3', name: 'Turbo', color: '#16A34A', accent: '#DCFCE7', aggression: 0.72, skillFactor: 0.96 },
  { id: 'ai-4', name: 'Storm', color: '#9333EA', accent: '#F3E8FF', aggression: 0.68, skillFactor: 0.94 },
  { id: 'ai-5', name: 'Racer X', color: '#0891B2', accent: '#CFFAFE', aggression: 0.88, skillFactor: 1.01 },
  { id: 'ai-6', name: 'Flash', color: '#EA580C', accent: '#FFEDD5', aggression: 0.76, skillFactor: 0.98 },
  { id: 'ai-7', name: 'Hunter', color: '#4F46E5', accent: '#E0E7FF', aggression: 0.62, skillFactor: 0.91 },
  { id: 'ai-8', name: 'Blaze', color: '#DC2626', accent: '#FEE2E2', aggression: 0.80, skillFactor: 0.99 },
  { id: 'ai-9', name: 'Nitro', color: '#D97706', accent: '#FEF3C7', aggression: 0.92, skillFactor: 1.05 },
];
