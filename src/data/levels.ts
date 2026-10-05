export type WeatherType = 'day' | 'night' | 'rain' | 'snow' | 'fog';

export type EnvironmentId =
  | 'village-road'
  | 'green-fields'
  | 'small-town'
  | 'city-road'
  | 'highway'
  | 'mountain-pass'
  | 'forest-road'
  | 'desert-road'
  | 'rainy-highway'
  | 'night-city'
  | 'snow-road'
  | 'coastal-road'
  | 'bridge-route'
  | 'tunnel-route'
  | 'industrial-route'
  | 'grand-city'
  | 'championship-circuit';

export interface EnvironmentTheme {
  id: EnvironmentId;
  name: string;
  weather: WeatherType;
  skyTop: string;
  skyBottom: string;
  grassLight: string;
  grassDark: string;
  roadLight: string;
  roadDark: string;
  rumbleLight: string;
  rumbleDark: string;
  laneColor: string;
  sceneryType: 'village' | 'fields' | 'town' | 'city' | 'highway' | 'mountain' | 'forest' | 'desert' | 'coastal' | 'bridge' | 'tunnel' | 'industrial' | 'stadium';
}

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentTheme> = {
  'village-road': {
    id: 'village-road',
    name: 'Village Road',
    weather: 'day',
    skyTop: '#0284C7',
    skyBottom: '#BAE6FD',
    grassLight: '#65A30D',
    grassDark: '#4D7C0F',
    roadLight: '#475569',
    roadDark: '#334155',
    rumbleLight: '#F59E0B',
    rumbleDark: '#FFFFFF',
    laneColor: '#E2E8F0',
    sceneryType: 'village',
  },
  'green-fields': {
    id: 'green-fields',
    name: 'Green Fields',
    weather: 'day',
    skyTop: '#0369A1',
    skyBottom: '#7DD3FC',
    grassLight: '#22C55E',
    grassDark: '#16A34A',
    roadLight: '#3F3F46',
    roadDark: '#27272A',
    rumbleLight: '#EF4444',
    rumbleDark: '#F8FAFC',
    laneColor: '#F8FAFC',
    sceneryType: 'fields',
  },
  'small-town': {
    id: 'small-town',
    name: 'Small Town',
    weather: 'day',
    skyTop: '#1D4ED8',
    skyBottom: '#93C5FD',
    grassLight: '#84CC16',
    grassDark: '#65A30D',
    roadLight: '#334155',
    roadDark: '#1E293B',
    rumbleLight: '#F97316',
    rumbleDark: '#F1F5F9',
    laneColor: '#FACC15',
    sceneryType: 'town',
  },
  'city-road': {
    id: 'city-road',
    name: 'City Road',
    weather: 'day',
    skyTop: '#1E3A8A',
    skyBottom: '#60A5FA',
    grassLight: '#334155',
    grassDark: '#1E293B',
    roadLight: '#1E293B',
    roadDark: '#0F172A',
    rumbleLight: '#06B6D4',
    rumbleDark: '#F8FAFC',
    laneColor: '#F8FAFC',
    sceneryType: 'city',
  },
  'highway': {
    id: 'highway',
    name: 'Highway',
    weather: 'day',
    skyTop: '#0F172A',
    skyBottom: '#F59E0B',
    grassLight: '#A16207',
    grassDark: '#854D0E',
    roadLight: '#27272A',
    roadDark: '#18181B',
    rumbleLight: '#F59E0B',
    rumbleDark: '#18181B',
    laneColor: '#FDE047',
    sceneryType: 'highway',
  },
  'mountain-pass': {
    id: 'mountain-pass',
    name: 'Mountain Pass',
    weather: 'fog',
    skyTop: '#334155',
    skyBottom: '#94A3B8',
    grassLight: '#3F6212',
    grassDark: '#365314',
    roadLight: '#475569',
    roadDark: '#334155',
    rumbleLight: '#EF4444',
    rumbleDark: '#FFFFFF',
    laneColor: '#FFFFFF',
    sceneryType: 'mountain',
  },
  'forest-road': {
    id: 'forest-road',
    name: 'Forest Road',
    weather: 'day',
    skyTop: '#065F46',
    skyBottom: '#6EE7B7',
    grassLight: '#15803D',
    grassDark: '#14532D',
    roadLight: '#374151',
    roadDark: '#1F2937',
    rumbleLight: '#84CC16',
    rumbleDark: '#F9FAFB',
    laneColor: '#E5E7EB',
    sceneryType: 'forest',
  },
  'desert-road': {
    id: 'desert-road',
    name: 'Desert Road',
    weather: 'day',
    skyTop: '#9A3412',
    skyBottom: '#FDBA74',
    grassLight: '#D97706',
    grassDark: '#B45309',
    roadLight: '#44403C',
    roadDark: '#292524',
    rumbleLight: '#F59E0B',
    rumbleDark: '#FFFBEB',
    laneColor: '#FDE68A',
    sceneryType: 'desert',
  },
  'rainy-highway': {
    id: 'rainy-highway',
    name: 'Rainy Highway',
    weather: 'rain',
    skyTop: '#0F172A',
    skyBottom: '#334155',
    grassLight: '#1E293B',
    grassDark: '#0F172A',
    roadLight: '#1E293B',
    roadDark: '#090D16',
    rumbleLight: '#06B6D4',
    rumbleDark: '#E2E8F0',
    laneColor: '#38BDF8',
    sceneryType: 'highway',
  },
  'night-city': {
    id: 'night-city',
    name: 'Night City',
    weather: 'night',
    skyTop: '#020617',
    skyBottom: '#1E1B4B',
    grassLight: '#0F172A',
    grassDark: '#020617',
    roadLight: '#1E293B',
    roadDark: '#0F172A',
    rumbleLight: '#EC4899',
    rumbleDark: '#06B6D4',
    laneColor: '#22D3EE',
    sceneryType: 'city',
  },
  'snow-road': {
    id: 'snow-road',
    name: 'Snow Road',
    weather: 'snow',
    skyTop: '#475569',
    skyBottom: '#E2E8F0',
    grassLight: '#F1F5F9',
    grassDark: '#CBD5E1',
    roadLight: '#475569',
    roadDark: '#334155',
    rumbleLight: '#0284C7',
    rumbleDark: '#FFFFFF',
    laneColor: '#E0F2FE',
    sceneryType: 'mountain',
  },
  'coastal-road': {
    id: 'coastal-road',
    name: 'Coastal Road',
    weather: 'day',
    skyTop: '#0284C7',
    skyBottom: '#38BDF8',
    grassLight: '#FDE047',
    grassDark: '#EAB308',
    roadLight: '#334155',
    roadDark: '#1E293B',
    rumbleLight: '#06B6D4',
    rumbleDark: '#FFFFFF',
    laneColor: '#FFFFFF',
    sceneryType: 'coastal',
  },
  'bridge-route': {
    id: 'bridge-route',
    name: 'Bridge Route',
    weather: 'fog',
    skyTop: '#1E293B',
    skyBottom: '#64748B',
    grassLight: '#0284C7',
    grassDark: '#0369A1',
    roadLight: '#334155',
    roadDark: '#1E293B',
    rumbleLight: '#F59E0B',
    rumbleDark: '#F8FAFC',
    laneColor: '#F8FAFC',
    sceneryType: 'bridge',
  },
  'tunnel-route': {
    id: 'tunnel-route',
    name: 'Tunnel Route',
    weather: 'night',
    skyTop: '#090D16',
    skyBottom: '#18181B',
    grassLight: '#27272A',
    grassDark: '#18181B',
    roadLight: '#27272A',
    roadDark: '#18181B',
    rumbleLight: '#F59E0B',
    rumbleDark: '#EF4444',
    laneColor: '#FBBF24',
    sceneryType: 'tunnel',
  },
  'industrial-route': {
    id: 'industrial-route',
    name: 'Industrial Route',
    weather: 'fog',
    skyTop: '#27272A',
    skyBottom: '#71717A',
    grassLight: '#3F3F46',
    grassDark: '#27272A',
    roadLight: '#27272A',
    roadDark: '#18181B',
    rumbleLight: '#EAB308',
    rumbleDark: '#18181B',
    laneColor: '#FACC15',
    sceneryType: 'industrial',
  },
  'grand-city': {
    id: 'grand-city',
    name: 'Grand City',
    weather: 'night',
    skyTop: '#090D16',
    skyBottom: '#311042',
    grassLight: '#1E1B4B',
    grassDark: '#0F172A',
    roadLight: '#1E293B',
    roadDark: '#090D16',
    rumbleLight: '#F59E0B',
    rumbleDark: '#06B6D4',
    laneColor: '#F8FAFC',
    sceneryType: 'city',
  },
  'championship-circuit': {
    id: 'championship-circuit',
    name: 'Championship Circuit',
    weather: 'night',
    skyTop: '#020617',
    skyBottom: '#1E1B4B',
    grassLight: '#111827',
    grassDark: '#030712',
    roadLight: '#1F2937',
    roadDark: '#111827',
    rumbleLight: '#F59E0B',
    rumbleDark: '#EF4444',
    laneColor: '#FDE047',
    sceneryType: 'stadium',
  },
};

export interface LevelDefinition {
  level: number;
  trackName: string;
  subtitle: string;
  environmentId: EnvironmentId;
  difficulty: 'Rookie' | 'Amateur' | 'Pro' | 'Elite' | 'Master' | 'Championship';
  laps: number;
  trackLengthSegments: number;
  curveIntensity: number;
  hillIntensity: number;
  trafficDensity: number;
  obstacleDensity: number;
  baseCoinReward: number;
  baseXpReward: number;
  milestoneRewardLabel?: string;
  isChampionship?: boolean;
}

const ENVIRONMENT_ROTATION: EnvironmentId[] = [
  'village-road',
  'green-fields',
  'small-town',
  'city-road',
  'highway',
  'mountain-pass',
  'forest-road',
  'desert-road',
  'rainy-highway',
  'night-city',
  'snow-road',
  'coastal-road',
  'bridge-route',
  'tunnel-route',
  'industrial-route',
  'grand-city',
  'championship-circuit',
];

const ROUTE_SUFFIXES = [
  'Sprint',
  'Circuit',
  'Expressway',
  'Challenge',
  'Run',
  'Dash',
  'Overpass',
  'Apex',
  'Showdown',
  'GP',
];

const MILESTONE_LABELS: Record<number, string> = {
  5: '+1,500 Bonus Coins',
  10: 'Unlocks Turbo X Car',
  15: '+25 Bonus Gems',
  20: 'Unlocks Night Rider Car + Neon Skin',
  25: '+5,000 Bonus Coins',
  30: 'Unlocks Speed Hawk Car',
  40: 'Unlocks Royal GT Car + Gold Trim',
  50: 'Babu Champion Car + Grand Trophy',
};

export const LEVELS_50: LevelDefinition[] = Array.from({ length: 50 }, (_, idx) => {
  const level = idx + 1;
  const isChampionship = level === 50;
  const envId: EnvironmentId = isChampionship
    ? 'championship-circuit'
    : ENVIRONMENT_ROTATION[idx % (ENVIRONMENT_ROTATION.length - 1)];
  const env = ENVIRONMENTS[envId];
  const suffix = isChampionship
    ? 'Grand Finale'
    : ROUTE_SUFFIXES[idx % ROUTE_SUFFIXES.length];

  let difficulty: LevelDefinition['difficulty'] = 'Rookie';
  if (level === 50) difficulty = 'Championship';
  else if (level >= 40) difficulty = 'Master';
  else if (level >= 28) difficulty = 'Elite';
  else if (level >= 16) difficulty = 'Pro';
  else if (level >= 7) difficulty = 'Amateur';

  return {
    level,
    trackName: isChampionship ? 'Babu Grand Championship' : `${env.name} ${suffix}`,
    subtitle: `${env.name} · ${env.weather.toUpperCase()}`,
    environmentId: envId,
    difficulty,
    laps: isChampionship ? 2 : level >= 35 ? 2 : 1,
    trackLengthSegments: 900 + level * 22,
    curveIntensity: Math.min(1.6, 0.45 + level * 0.022),
    hillIntensity: Math.min(1.4, 0.25 + (level % 7) * 0.16),
    trafficDensity: Math.min(0.85, 0.22 + level * 0.012),
    obstacleDensity: Math.min(0.8, 0.18 + level * 0.011),
    baseCoinReward: 1000 + (level - 1) * 120,
    baseXpReward: 50 + (level - 1) * 10,
    milestoneRewardLabel: MILESTONE_LABELS[level],
    isChampionship,
  };
});
