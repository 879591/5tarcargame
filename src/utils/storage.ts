import { DEFAULT_DEVELOPER_CONFIG, DeveloperConfig } from '../config/developerConfig';
import { ORIGINAL_CARS } from '../data/cars';
import { ACHIEVEMENTS } from '../data/rewards';

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  bestPosition: number | null; // 1 to 10
  bestTimeMs: number | null;
  stars: number; // 0 to 3
}

export interface CarUpgradeLevels {
  speed: number;        // 1 to 5
  acceleration: number; // 1 to 5
  handling: number;     // 1 to 5
  brake: number;        // 1 to 5
  nitro: number;        // 1 to 5
}

export interface GameSettings {
  musicOn: boolean;
  sfxOn: boolean;
  engineSoundOn: boolean;
  vibrationOn: boolean;
  musicVolume: number;
  sfxVolume: number;
  engineVolume: number;
  graphics: 'LOW' | 'MEDIUM' | 'HIGH';
  controls: 'BUTTONS' | 'TILT';
}

export interface PlayerSaveData {
  playerName: string;
  profilePhotoDataUrl: string; // Stored locally
  currentLevel: number;
  coins: number;
  gems: number;
  xp: number;
  selectedCarId: string;
  unlockedCarIds: string[];
  unlockedSkins: string[];
  carUpgrades: Record<string, CarUpgradeLevels>;
  levels: Record<number, LevelProgress>;
  totalRaces: number;
  totalWins: number;
  totalPodiums: number;
  totalNitroUses: number;
  championshipWon: boolean;
  unlockedAchievements: string[];
  claimedAchievements: string[];
  claimedMilestones: number[];
  dailyRewardDay: number; // 1 to 7
  lastDailyClaimDate: string | null; // YYYY-MM-DD
  completedRacesSinceLastAd: number;
  settings: GameSettings;
  developerConfig: DeveloperConfig;
}

const STORAGE_KEY = 'babu_car_racing_save_v1';

export function createInitialSaveData(): PlayerSaveData {
  const levels: Record<number, LevelProgress> = {};
  for (let i = 1; i <= 50; i++) {
    levels[i] = {
      unlocked: i === 1, // Level 1 = unlocked, all other levels = locked
      completed: false,
      bestPosition: null,
      bestTimeMs: null,
      stars: 0,
    };
  }

  const carUpgrades: Record<string, CarUpgradeLevels> = {};
  ORIGINAL_CARS.forEach((car) => {
    carUpgrades[car.id] = {
      speed: 1,
      acceleration: 1,
      handling: 1,
      brake: 1,
      nitro: 1,
    };
  });

  return {
    playerName: DEFAULT_DEVELOPER_CONFIG.defaultPlayerName,
    profilePhotoDataUrl: DEFAULT_DEVELOPER_CONFIG.defaultProfilePhotoUrl,
    currentLevel: 1,
    coins: 1000,
    gems: 20,
    xp: 0,
    selectedCarId: 'babu-racer',
    unlockedCarIds: ['babu-racer'],
    unlockedSkins: ['Standard Factory Finish'],
    carUpgrades,
    levels,
    totalRaces: 0,
    totalWins: 0,
    totalPodiums: 0,
    totalNitroUses: 0,
    championshipWon: false,
    unlockedAchievements: [],
    claimedAchievements: [],
    claimedMilestones: [],
    dailyRewardDay: 1,
    lastDailyClaimDate: null,
    completedRacesSinceLastAd: 0,
    settings: {
      musicOn: true,
      sfxOn: true,
      engineSoundOn: true,
      vibrationOn: true,
      musicVolume: 0.35,
      sfxVolume: 0.7,
      engineVolume: 0.45,
      graphics: 'HIGH',
      controls: 'BUTTONS',
    },
    developerConfig: DEFAULT_DEVELOPER_CONFIG,
  };
}

export function loadSaveData(): PlayerSaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSaveData();
    const parsed = JSON.parse(raw) as Partial<PlayerSaveData>;
    const defaults = createInitialSaveData();

    return {
      ...defaults,
      ...parsed,
      settings: {
        ...defaults.settings,
        ...(parsed.settings || {}),
      },
      developerConfig: {
        ...defaults.developerConfig,
        ...(parsed.developerConfig || {}),
        contact: {
          ...defaults.developerConfig.contact,
          ...(parsed.developerConfig?.contact || {}),
        },
        ads: {
          ...defaults.developerConfig.ads,
          ...(parsed.developerConfig?.ads || {}),
        },
      },
      levels: {
        ...defaults.levels,
        ...(parsed.levels || {}),
      },
      carUpgrades: {
        ...defaults.carUpgrades,
        ...(parsed.carUpgrades || {}),
      },
    };
  } catch {
    return createInitialSaveData();
  }
}

export function persistSaveData(data: PlayerSaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Handle storage quota gracefully
  }
}

export function evaluateAchievements(data: PlayerSaveData): string[] {
  const newlyUnlocked: string[] = [];
  const has = (id: string) => data.unlockedAchievements.includes(id);

  const totalStars = Object.values(data.levels).reduce((acc, l) => acc + (l.stars || 0), 0);

  if (data.totalRaces >= 1 && !has('first-race')) newlyUnlocked.push('first-race');
  if (data.totalWins >= 1 && !has('first-victory')) newlyUnlocked.push('first-victory');
  if (data.totalWins >= 10 && !has('ten-wins')) newlyUnlocked.push('ten-wins');
  if (data.totalNitroUses >= 25 && !has('nitro-master')) newlyUnlocked.push('nitro-master');
  if (data.unlockedCarIds.length >= 5 && !has('garage-collector')) newlyUnlocked.push('garage-collector');
  if (totalStars >= 50 && !has('fifty-stars')) newlyUnlocked.push('fifty-stars');
  if (data.championshipWon && !has('grand-champion')) newlyUnlocked.push('grand-champion');

  return newlyUnlocked.filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
}
