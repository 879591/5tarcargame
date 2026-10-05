import React, { useEffect, useState, useMemo } from 'react';
import {
  Play,
  Map,
  Car,
  Trophy,
  Gift,
  User,
  Settings,
  Info,
  Lock,
  Star,
  Flame,
  CheckCircle2,
  RotateCcw,
  Home,
  ArrowRight,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Camera,
} from 'lucide-react';
import { ORIGINAL_CARS, CarDefinition } from './data/cars';
import { LEVELS_50, ENVIRONMENTS } from './data/levels';
import { DAILY_REWARDS, MILESTONE_REWARDS, ACHIEVEMENTS } from './data/rewards';
import {
  PlayerSaveData,
  loadSaveData,
  persistSaveData,
  createInitialSaveData,
  evaluateAchievements,
  CarUpgradeLevels,
} from './utils/storage';
import { soundEngine } from './utils/soundEngine';
import { GameLogo, CarIllustration } from './components/GameLogo';
import { ProfilePhotoModal, PlayerAvatar } from './components/ProfilePhotoModal';
import { BannerAdSlot, RewardedAdButton } from './components/AdSystem';
import { RaceEngine, RaceResultPayload } from './components/RaceEngine';
import { AboutDeveloperView } from './components/AboutDeveloperView';
import { LegalModal } from './components/LegalModal';

type ScreenView =
  | 'home'
  | 'levels'
  | 'garage'
  | 'championship'
  | 'rewards'
  | 'profile'
  | 'settings'
  | 'about'
  | 'race'
  | 'results';

interface CompletedRaceSummary {
  level: number;
  position: number;
  raceTimeMs: number;
  coinsEarned: number;
  xpEarned: number;
  starsEarned: number;
  isNewBestTime: boolean;
  unlockedNextLevel: boolean;
  isChampionshipWin: boolean;
  crashedOut?: boolean;
  failReason?: string;
}

export default function App() {
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => loadSaveData());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const [currentView, setCurrentView] = useState<ScreenView>('home');
  const [activeRaceLevel, setActiveRaceLevel] = useState<number>(1);
  const [garageCarIndex, setGarageCarIndex] = useState<number>(0);

  const [lastRaceSummary, setLastRaceSummary] = useState<CompletedRaceSummary | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Sync settings to procedural sound engine and persist saveData
  useEffect(() => {
    soundEngine.musicEnabled = saveData.settings.musicOn;
    soundEngine.sfxEnabled = saveData.settings.sfxOn;
    soundEngine.engineEnabled = saveData.settings.engineSoundOn;
    soundEngine.musicVolume = saveData.settings.musicVolume;
    soundEngine.sfxVolume = saveData.settings.sfxVolume;
    soundEngine.engineVolume = saveData.settings.engineVolume;

    persistSaveData(saveData);
  }, [saveData]);

  // Initial Loading Screen animation
  useEffect(() => {
    const interval = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 250);
          return 100;
        }
        return prev + 10;
      });
    }, 90);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? '' : curr));
    }, 3200);
  };

  const navigateTo = (view: ScreenView) => {
    soundEngine.playClick();
    if (view === 'garage') {
      const idx = ORIGINAL_CARS.findIndex((c) => c.id === saveData.selectedCarId);
      if (idx >= 0) setGarageCarIndex(idx);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedCar: CarDefinition = useMemo(() => {
    return (
      ORIGINAL_CARS.find((c) => c.id === saveData.selectedCarId) || ORIGINAL_CARS[0]
    );
  }, [saveData.selectedCarId]);

  const totalStars = useMemo(() => {
    return Object.values(saveData.levels).reduce((sum, l) => sum + (l.stars || 0), 0);
  }, [saveData.levels]);

  const highestUnlockedLevel = useMemo(() => {
    let max = 1;
    for (let i = 1; i <= 50; i++) {
      if (saveData.levels[i]?.unlocked) max = i;
    }
    return max;
  }, [saveData.levels]);

  const startLevelRace = (levelNumber: number) => {
    const lvlState = saveData.levels[levelNumber];
    if (!lvlState || !lvlState.unlocked) {
      showToast(`Level ${levelNumber} is locked. Complete previous levels first!`);
      return;
    }
    soundEngine.playClick();
    setActiveRaceLevel(levelNumber);
    setCurrentView('race');
  };

  // Handle race finish & calculate rewards, stars, unlocks, achievements
  const handleFinishRace = (payload: RaceResultPayload) => {
    const levelDef = LEVELS_50.find((l) => l.level === payload.level) || LEVELS_50[0];
    const pos = payload.crashedOut ? 10 : payload.position;
    const isWinOrPodium = !payload.crashedOut && pos <= 3;

    let baseCoins = 100;
    let baseXp = 10;
    let stars = 0;

    if (!payload.crashedOut && pos === 1) {
      baseCoins = 1000 + (payload.level - 1) * 50;
      baseXp = 50;
      stars = 3;
    } else if (!payload.crashedOut && pos === 2) {
      baseCoins = 700 + (payload.level - 1) * 35;
      baseXp = 35;
      stars = 2;
    } else if (!payload.crashedOut && pos === 3) {
      baseCoins = 500 + (payload.level - 1) * 25;
      baseXp = 25;
      stars = 1;
    } else {
      baseCoins = payload.crashedOut ? 50 : Math.max(100, 300 - pos * 20);
      baseXp = 8;
      stars = 0;
    }

    const totalCoinsEarned = baseCoins + payload.coinsCollectedInRace;

    setSaveData((prev) => {
      const prevLevelState = prev.levels[payload.level] || {
        unlocked: true,
        completed: false,
        bestPosition: null,
        bestTimeMs: null,
        stars: 0,
      };

      const isCompletedNow = isWinOrPodium || prevLevelState.completed;
      const isNewBestTime =
        !payload.crashedOut &&
        isWinOrPodium &&
        (prevLevelState.bestTimeMs === null || payload.raceTimeMs < prevLevelState.bestTimeMs);
      const bestPos =
        prevLevelState.bestPosition === null
          ? pos
          : Math.min(prevLevelState.bestPosition, pos);
      const bestStars = Math.max(prevLevelState.stars, stars);

      const updatedLevels = {
        ...prev.levels,
        [payload.level]: {
          unlocked: true,
          completed: isCompletedNow,
          bestPosition: bestPos,
          bestTimeMs: isNewBestTime ? payload.raceTimeMs : prevLevelState.bestTimeMs,
          stars: bestStars,
        },
      };

      // Strictly require Podium finish (Top 3) without crashing out to unlock the next level
      let unlockedNext = false;
      const nextLevelNum = payload.level + 1;
      if (isWinOrPodium && nextLevelNum <= 50 && !updatedLevels[nextLevelNum]?.unlocked) {
        updatedLevels[nextLevelNum] = {
          ...(updatedLevels[nextLevelNum] || {
            completed: false,
            bestPosition: null,
            bestTimeMs: null,
            stars: 0,
          }),
          unlocked: true,
        };
        unlockedNext = true;
      }

      // Check level-based car unlocks
      const newUnlockedCars = [...prev.unlockedCarIds];
      if (isWinOrPodium) {
        ORIGINAL_CARS.forEach((car) => {
          if (
            car.unlockType === 'level' &&
            car.unlockLevel &&
            nextLevelNum >= car.unlockLevel &&
            !newUnlockedCars.includes(car.id)
          ) {
            newUnlockedCars.push(car.id);
          }
        });
      }

      const isChampWin = !payload.crashedOut && levelDef.isChampionship === true && pos === 1;
      if (isChampWin && !newUnlockedCars.includes('babu-champion')) {
        newUnlockedCars.push('babu-champion');
      }

      const nextData: PlayerSaveData = {
        ...prev,
        currentLevel: unlockedNext ? nextLevelNum : prev.currentLevel,
        coins: prev.coins + totalCoinsEarned,
        xp: prev.xp + baseXp,
        unlockedCarIds: newUnlockedCars,
        levels: updatedLevels,
        totalRaces: prev.totalRaces + 1,
        totalWins: prev.totalWins + (!payload.crashedOut && pos === 1 ? 1 : 0),
        totalPodiums: prev.totalPodiums + (isWinOrPodium ? 1 : 0),
        totalNitroUses: prev.totalNitroUses + payload.nitroUsesInRace,
        championshipWon: prev.championshipWon || isChampWin,
        completedRacesSinceLastAd: prev.completedRacesSinceLastAd + 1,
      };

      const newlyUnlockedAch = evaluateAchievements(nextData);
      if (newlyUnlockedAch.length > 0) {
        nextData.unlockedAchievements = [
          ...nextData.unlockedAchievements,
          ...newlyUnlockedAch,
        ];
      }

      setLastRaceSummary({
        level: payload.level,
        position: pos,
        raceTimeMs: payload.raceTimeMs,
        coinsEarned: totalCoinsEarned,
        xpEarned: baseXp,
        starsEarned: stars,
        isNewBestTime,
        unlockedNextLevel: unlockedNext,
        isChampionshipWin: isChampWin,
        crashedOut: payload.crashedOut,
        failReason: payload.failReason,
      });

      return nextData;
    });

    if (isWinOrPodium) {
      soundEngine.playVictory(levelDef.isChampionship && pos === 1);
    } else {
      soundEngine.playDefeat();
    }

    setCurrentView('results');
  };

  const handleToggleMuteAll = () => {
    setSaveData((prev) => {
      const anyOn =
        prev.settings.musicOn || prev.settings.sfxOn || prev.settings.engineSoundOn;
      const nextState = !anyOn;
      return {
        ...prev,
        settings: {
          ...prev.settings,
          musicOn: nextState,
          sfxOn: nextState,
          engineSoundOn: nextState,
        },
      };
    });
  };

  // Garage Car Unlocking & Upgrading handlers
  const handleUnlockCar = (car: CarDefinition) => {
    if (saveData.unlockedCarIds.includes(car.id)) return;

    if (car.unlockType === 'coins' && car.unlockCoins) {
      if (saveData.coins < car.unlockCoins) {
        showToast(`Need ${car.unlockCoins.toLocaleString()} coins to unlock ${car.name}.`);
        return;
      }
      soundEngine.playLevelUnlock();
      setSaveData((prev) => {
        const updatedCars = [...prev.unlockedCarIds, car.id];
        const next: PlayerSaveData = {
          ...prev,
          coins: prev.coins - (car.unlockCoins || 0),
          unlockedCarIds: updatedCars,
          selectedCarId: car.id,
        };
        const newAch = evaluateAchievements(next);
        if (newAch.length > 0) {
          next.unlockedAchievements = [...next.unlockedAchievements, ...newAch];
        }
        return next;
      });
      showToast(`Unlocked ${car.name}!`);
    } else if (car.unlockType === 'level' && car.unlockLevel) {
      if (highestUnlockedLevel >= car.unlockLevel) {
        soundEngine.playLevelUnlock();
        setSaveData((prev) => ({
          ...prev,
          unlockedCarIds: [...prev.unlockedCarIds, car.id],
          selectedCarId: car.id,
        }));
        showToast(`Unlocked ${car.name}!`);
      } else {
        showToast(`Reach Level ${car.unlockLevel} to unlock ${car.name}.`);
      }
    } else if (car.unlockType === 'championship') {
      showToast('Win Level 50 Grand Championship to unlock Babu Champion!');
    }
  };

  const handleUpgradeStat = (
    car: CarDefinition,
    statKey: keyof CarUpgradeLevels
  ) => {
    const currentUpgrades = saveData.carUpgrades[car.id] || {
      speed: 1,
      acceleration: 1,
      handling: 1,
      brake: 1,
      nitro: 1,
    };
    const currLevel = currentUpgrades[statKey];
    if (currLevel >= 5) {
      showToast(`${statKey.toUpperCase()} is already at Maximum Level 5!`);
      return;
    }

    const price = car.upgradeBasePrice * currLevel;
    if (saveData.coins < price) {
      showToast(`Insufficient coins! Need ${price.toLocaleString()} coins.`);
      return;
    }

    soundEngine.playReward();
    setSaveData((prev) => ({
      ...prev,
      coins: prev.coins - price,
      carUpgrades: {
        ...prev.carUpgrades,
        [car.id]: {
          ...currentUpgrades,
          [statKey]: currLevel + 1,
        },
      },
    }));
    showToast(`Upgraded ${car.name} ${statKey.toUpperCase()} to Lv.${currLevel + 1}!`);
  };

  // Daily Reward Claim Handler
  const todayIso = new Date().toISOString().slice(0, 10);
  const canClaimDailyToday = saveData.lastDailyClaimDate !== todayIso;

  const handleClaimDailyReward = () => {
    if (!canClaimDailyToday) {
      showToast('Daily reward already claimed today! Come back tomorrow.');
      return;
    }
    const dayNumber = ((saveData.dailyRewardDay - 1) % 7) + 1;
    const reward = DAILY_REWARDS.find((d) => d.day === dayNumber) || DAILY_REWARDS[0];

    soundEngine.playReward();
    setSaveData((prev) => {
      let addCoins = 0;
      let addGems = 0;
      const skins = [...prev.unlockedSkins];

      if (reward.rewardType === 'coins') addCoins = reward.amount;
      if (reward.rewardType === 'gems') addGems = reward.amount;
      if (reward.rewardType === 'nitro') addCoins = 600;
      if (reward.rewardType === 'skin' && !skins.includes('Crimson Pulse Finish')) {
        skins.push('Crimson Pulse Finish');
      }
      if (reward.rewardType === 'big') {
        addCoins = 5000;
        addGems = 30;
      }

      return {
        ...prev,
        coins: prev.coins + addCoins,
        gems: prev.gems + addGems,
        unlockedSkins: skins,
        dailyRewardDay: dayNumber === 7 ? 1 : dayNumber + 1,
        lastDailyClaimDate: todayIso,
      };
    });
    showToast(`Claimed ${reward.title}: ${reward.description}!`);
  };

  // Milestone Claim Handler
  const handleClaimMilestone = (milestoneLevel: number) => {
    if (saveData.claimedMilestones.includes(milestoneLevel)) return;
    if (highestUnlockedLevel < milestoneLevel && !saveData.levels[milestoneLevel]?.completed) {
      showToast(`Reach or complete Level ${milestoneLevel} first!`);
      return;
    }

    const item = MILESTONE_REWARDS.find((m) => m.level === milestoneLevel);
    if (!item) return;

    soundEngine.playReward();
    setSaveData((prev) => {
      const cars = [...prev.unlockedCarIds];
      if (item.carId && !cars.includes(item.carId)) {
        cars.push(item.carId);
      }
      const skins = [...prev.unlockedSkins];
      if (item.skinName && !skins.includes(item.skinName)) {
        skins.push(item.skinName);
      }

      return {
        ...prev,
        coins: prev.coins + (item.coins || 0),
        gems: prev.gems + (item.gems || 0),
        unlockedCarIds: cars,
        unlockedSkins: skins,
        claimedMilestones: [...prev.claimedMilestones, milestoneLevel],
      };
    });
    showToast(`Claimed ${item.title}: ${item.description}!`);
  };

  // Achievement Claim Handler
  const handleClaimAchievement = (achId: string) => {
    if (!saveData.unlockedAchievements.includes(achId)) return;
    if (saveData.claimedAchievements.includes(achId)) return;

    const ach = ACHIEVEMENTS.find((a) => a.id === achId);
    if (!ach) return;

    soundEngine.playReward();
    setSaveData((prev) => ({
      ...prev,
      coins: prev.coins + ach.rewardCoins,
      gems: prev.gems + ach.rewardGems,
      claimedAchievements: [...prev.claimedAchievements, achId],
    }));
    showToast(`Claimed Achievement: +${ach.rewardCoins} Coins & +${ach.rewardGems} Gems!`);
  };

  // Section 45: LOADING SCREEN
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#090D16] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-full max-w-md bg-slate-900/90 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-6">
          {/* Player / Developer Photo */}
          <PlayerAvatar
            photoUrl={saveData.profilePhotoDataUrl}
            name={saveData.playerName}
            size="xl"
          />

          <div className="space-y-2">
            <GameLogo size="lg" gameName={saveData.developerConfig.gameName} />
            <p className="text-xs sm:text-sm font-medium text-amber-400 tracking-wide">
              {saveData.developerConfig.tagline}
            </p>
          </div>

          {/* Animated Racing Progress Bar */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Loading tracks, 10 cars &amp; AI drivers...</span>
              <span className="font-mono-num text-amber-400 font-bold">{loadingProgress}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 border border-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-red-500 to-cyan-400 transition-all duration-100"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 w-full text-[11px] text-slate-400 space-y-0.5">
            <p>
              Developed by <strong className="text-white">{saveData.developerConfig.developerName}</strong> ({saveData.developerConfig.creatorBrand})
            </p>
            <p>
              {saveData.developerConfig.digitalBrand} · {saveData.developerConfig.location}{' '}
              {saveData.developerConfig.countryFlag}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active 10-Car Race Viewport
  if (currentView === 'race') {
    const levelDef = LEVELS_50.find((l) => l.level === activeRaceLevel) || LEVELS_50[0];
    const upgrades = saveData.carUpgrades[selectedCar.id] || {
      speed: 1,
      acceleration: 1,
      handling: 1,
      brake: 1,
      nitro: 1,
    };

    return (
      <RaceEngine
        levelDef={levelDef}
        playerCar={selectedCar}
        upgrades={upgrades}
        settings={saveData.settings}
        onToggleMuteAll={handleToggleMuteAll}
        onFinishRace={handleFinishRace}
        onExitRace={() => navigateTo('levels')}
      />
    );
  }

  const formatTime = (ms: number | null) => {
    if (ms === null) return '--:--.-';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${min}:${sec.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <div className="min-h-screen w-full bg-[#090D16] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 Zones (Brand Wordmark | Clean Nav Links | Primary Actions) */}
      <header className="sticky top-0 z-30 h-14 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="font-display font-bold italic text-lg sm:text-xl tracking-wider text-amber-400 whitespace-nowrap focus:outline-none"
        >
          {saveData.developerConfig.gameName}
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap ${
              currentView === 'home' ? 'text-amber-400 underline underline-offset-4' : ''
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => navigateTo('levels')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap ${
              currentView === 'levels' ? 'text-amber-400 underline underline-offset-4' : ''
            }`}
          >
            50 Levels
          </button>
          <button
            type="button"
            onClick={() => navigateTo('garage')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap ${
              currentView === 'garage' ? 'text-amber-400 underline underline-offset-4' : ''
            }`}
          >
            Garage
          </button>
          <button
            type="button"
            onClick={() => navigateTo('championship')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap ${
              currentView === 'championship' ? 'text-amber-400 underline underline-offset-4' : ''
            }`}
          >
            Championship
          </button>
          <button
            type="button"
            onClick={() => navigateTo('about')}
            className={`hover:text-amber-400 transition-colors whitespace-nowrap ${
              currentView === 'about' ? 'text-amber-400 underline underline-offset-4' : ''
            }`}
          >
            About &amp; Developer
          </button>
        </nav>

        {/* Zone 3: Primary actions (Currency & Profile) */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono-num text-slate-200 whitespace-nowrap">
            <span className="text-amber-400 font-bold">{saveData.coins.toLocaleString()}</span> Coins
            <span className="mx-1.5 text-slate-600">·</span>
            <span className="text-cyan-400 font-bold">{saveData.gems}</span> Gems
          </div>
          <PlayerAvatar
            photoUrl={saveData.profilePhotoDataUrl}
            name={saveData.playerName}
            size="sm"
            onClick={() => navigateTo('profile')}
          />
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-display font-bold text-xs shadow-xl">
          {toastMessage}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* ================= VIEW 1: MAIN MENU (HOME) ================= */}
        {currentView === 'home' && (
          <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">
            {/* Top Player Identity & Showcase Card */}
            <section className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* Left: Game Brand + Player Profile Summary */}
                <div className="space-y-4 w-full lg:w-1/2">
                  <GameLogo size="lg" gameName={saveData.developerConfig.gameName} />
                  <p className="text-xs sm:text-sm text-slate-300">
                    {saveData.developerConfig.tagline} · v{saveData.developerConfig.version}
                  </p>

                  {/* Player Profile Bar */}
                  <div className="flex items-center gap-3.5 pt-2">
                    <PlayerAvatar
                      photoUrl={saveData.profilePhotoDataUrl}
                      name={saveData.playerName}
                      size="lg"
                      onClick={() => setIsPhotoModalOpen(true)}
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-lg text-white">
                          {saveData.playerName}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsPhotoModalOpen(true)}
                          className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" /> Change Photo
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 font-mono-num">
                        Current Level: <strong className="text-white">{highestUnlockedLevel}/50</strong> · Stars:{' '}
                        <strong className="text-amber-400">{totalStars}/150</strong> · XP:{' '}
                        <strong className="text-cyan-300">{saveData.xp}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Dominant Primary CTA: PLAY */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startLevelRace(highestUnlockedLevel)}
                      className="flex-1 min-h-[54px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-display font-bold text-base sm:text-lg tracking-wide flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all whitespace-nowrap"
                    >
                      <Play className="w-5 h-5 fill-slate-950" />
                      🏁 PLAY LEVEL {highestUnlockedLevel}
                    </button>
                  </div>
                </div>

                {/* Right: Active Selected Car Showcase */}
                <div className="w-full lg:w-1/2 flex flex-col items-center bg-slate-950/70 border border-white/5 rounded-2xl p-5">
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Selected Machine</span>
                    <span className="text-amber-400 font-semibold">{selectedCar.name}</span>
                  </div>
                  <CarIllustration car={selectedCar} className="w-full h-36 sm:h-44" />
                  <div className="w-full flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                    <span className="truncate">{selectedCar.tagline}</span>
                    <button
                      type="button"
                      onClick={() => navigateTo('garage')}
                      className="text-amber-400 hover:underline font-semibold ml-3 shrink-0"
                    >
                      Customize →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Main Menu Action Grid (All Major Buttons Required by Prompt) */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <button
                type="button"
                onClick={() => navigateTo('levels')}
                className="min-h-[84px] p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 flex flex-col items-start justify-between text-left transition-colors"
              >
                <Map className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-display font-bold text-sm text-white block">
                    🗺️ LEVELS
                  </span>
                  <span className="text-[11px] text-slate-400">
                    50 Tracks · Lv.{highestUnlockedLevel} Active
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('garage')}
                className="min-h-[84px] p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 flex flex-col items-start justify-between text-left transition-colors"
              >
                <Car className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="font-display font-bold text-sm text-white block">
                    🚗 GARAGE
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {saveData.unlockedCarIds.length}/10 Cars Unlocked
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('championship')}
                className="min-h-[84px] p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 flex flex-col items-start justify-between text-left transition-colors"
              >
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-display font-bold text-sm text-white block">
                    🏆 CHAMPIONSHIP
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {saveData.championshipWon ? 'Grand Champion' : 'Level 50 Finale'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('rewards')}
                className="min-h-[84px] p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 flex flex-col items-start justify-between text-left transition-colors"
              >
                <Gift className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="font-display font-bold text-sm text-white block">
                    🎁 REWARDS
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {canClaimDailyToday ? 'Daily Bonus Ready!' : 'Daily & Milestones'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('profile')}
                className="min-h-[84px] p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 flex flex-col items-start justify-between text-left transition-colors"
              >
                <User className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="font-display font-bold text-sm text-white block">
                    👤 PROFILE
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {saveData.totalWins} Wins · Photo &amp; Stats
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('settings')}
                className="min-h-[84px] p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 flex flex-col items-start justify-between text-left transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-300" />
                <div>
                  <span className="font-display font-bold text-sm text-white block">
                    ⚙️ SETTINGS
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Audio · Graphics ({saveData.settings.graphics})
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('about')}
                className="col-span-2 min-h-[84px] p-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 flex items-center justify-between text-left transition-colors"
              >
                <div className="space-y-1">
                  <span className="font-display font-bold text-sm text-amber-400 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> ABOUT &amp; DEVELOPER
                  </span>
                  <p className="text-xs text-slate-300">
                    Developed by <strong>{saveData.developerConfig.developerName}</strong> ({saveData.developerConfig.creatorBrand} / {saveData.developerConfig.digitalBrand}) · {saveData.developerConfig.location} {saveData.developerConfig.countryFlag}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-400 shrink-0" />
              </button>
            </section>

            {/* Optional Banner Ad Slot (Hidden when ADS_ENABLED = false) */}
            <BannerAdSlot config={saveData.developerConfig.ads} placement="Home" />
          </div>
        )}

        {/* ================= VIEW 2: 50 LEVELS & PROGRESSION MAP ================= */}
        {currentView === 'levels' && (
          <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  🗺️ 50 RACING LEVELS &amp; ROUTE MAP
                </h1>
                <p className="text-xs text-slate-400">
                  Complete each level to unlock the next route. Locked: 🔒 · Completed: ⭐ · Current: 🔥
                </p>
              </div>
              <div className="text-xs font-mono-num text-slate-300">
                Unlocked: <strong className="text-amber-400">{highestUnlockedLevel}/50</strong> · Total Stars:{' '}
                <strong className="text-amber-400">{totalStars}/150</strong>
              </div>
            </div>

            <BannerAdSlot config={saveData.developerConfig.ads} placement="Levels" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LEVELS_50.map((lvl) => {
                const state = saveData.levels[lvl.level] || {
                  unlocked: lvl.level === 1,
                  completed: false,
                  bestPosition: null,
                  bestTimeMs: null,
                  stars: 0,
                };
                const isCurrent = lvl.level === highestUnlockedLevel;
                const env = ENVIRONMENTS[lvl.environmentId];

                return (
                  <div
                    key={lvl.level}
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                      state.unlocked
                        ? isCurrent
                          ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900/80 border-white/10'
                        : 'bg-slate-950/60 border-white/5 opacity-75'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-display font-bold text-sm text-white">
                          LEVEL {lvl.level}{' '}
                          {!state.unlocked ? '🔒' : isCurrent ? '🔥' : state.completed ? '⭐' : ''}
                        </span>
                        <span className="text-slate-400 font-mono-num">
                          {lvl.difficulty} · {env.weather.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-base text-amber-400 truncate">
                        {lvl.trackName}
                      </h3>

                      <p className="text-xs text-slate-400 font-mono-num">
                        Best Pos:{' '}
                        <strong className="text-slate-200">
                          {state.bestPosition ? `#${state.bestPosition}/10` : '--'}
                        </strong>{' '}
                        · Best Time:{' '}
                        <strong className="text-slate-200">{formatTime(state.bestTimeMs)}</strong>
                      </p>

                      {lvl.milestoneRewardLabel && (
                        <p className="text-[11px] text-cyan-300 font-medium">
                          🎁 Milestone: {lvl.milestoneRewardLabel}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= state.stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-700'
                            }`}
                          />
                        ))}
                        <span className="text-[11px] text-slate-400 font-mono-num ml-1.5">
                          +{lvl.baseCoinReward} Coins
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!state.unlocked}
                        onClick={() => startLevelRace(lvl.level)}
                        className={`min-h-[40px] px-4 py-1.5 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 whitespace-nowrap ${
                          state.unlocked
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {state.unlocked ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-slate-950" /> PLAY
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" /> LOCKED
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: GARAGE (10 CARS & UPGRADES) ================= */}
        {currentView === 'garage' && (
          <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  🚗 BABU GARAGE — 10 ORIGINAL CARS
                </h1>
                <p className="text-xs text-slate-400">
                  Select your racing machine, unlock higher-tier prototypes, and upgrade 5 performance stats.
                </p>
              </div>
              <div className="text-xs font-mono-num text-slate-300">
                Coins: <strong className="text-amber-400">{saveData.coins.toLocaleString()}</strong> · Unlocked:{' '}
                <strong className="text-cyan-400">{saveData.unlockedCarIds.length}/10</strong>
              </div>
            </div>

            <BannerAdSlot config={saveData.developerConfig.ads} placement="Garage" />

            {/* Car Selector Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {ORIGINAL_CARS.map((car, idx) => {
                const isUnlocked = saveData.unlockedCarIds.includes(car.id);
                const isSelected = saveData.selectedCarId === car.id;
                const isViewing = garageCarIndex === idx;

                return (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setGarageCarIndex(idx);
                    }}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl font-display font-bold text-xs whitespace-nowrap shrink-0 border transition-colors flex items-center gap-1.5 ${
                      isViewing
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : isSelected
                        ? 'bg-slate-800 text-amber-400 border-amber-500/50'
                        : 'bg-slate-900 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    <span>
                      {car.index}. {car.name}
                    </span>
                    {!isUnlocked && <Lock className="w-3.5 h-3.5 opacity-75" />}
                  </button>
                );
              })}
            </div>

            {/* Active Garage Car Details */}
            {(() => {
              const car = ORIGINAL_CARS[garageCarIndex] || ORIGINAL_CARS[0];
              const isUnlocked = saveData.unlockedCarIds.includes(car.id);
              const isSelected = saveData.selectedCarId === car.id;
              const upgrades = saveData.carUpgrades[car.id] || {
                speed: 1,
                acceleration: 1,
                handling: 1,
                brake: 1,
                nitro: 1,
              };

              const statEntries: Array<{
                key: keyof CarUpgradeLevels;
                label: string;
                base: number;
              }> = [
                { key: 'speed', label: 'Speed', base: car.baseStats.speed },
                { key: 'acceleration', label: 'Acceleration', base: car.baseStats.acceleration },
                { key: 'handling', label: 'Handling', base: car.baseStats.handling },
                { key: 'brake', label: 'Brake', base: car.baseStats.brake },
                { key: 'nitro', label: 'Nitro', base: car.baseStats.nitro },
              ];

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900/90 border border-white/10 rounded-3xl p-6">
                  {/* Left: Large Car Preview & Unlock/Select CTA */}
                  <div className="flex flex-col justify-between bg-slate-950/80 border border-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 font-mono-num">
                          CAR #{car.index} OF 10
                        </span>
                        <h2 className="font-display text-2xl font-bold text-white">
                          {car.name}
                        </h2>
                      </div>
                      <span className="text-xs font-semibold text-amber-400">
                        {isSelected
                          ? 'ACTIVE RACER'
                          : isUnlocked
                          ? 'UNLOCKED'
                          : 'LOCKED'}
                      </span>
                    </div>

                    <CarIllustration car={car} className="w-full h-48" />

                    <p className="text-xs text-slate-400">{car.tagline}</p>

                    <div className="pt-2">
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setSaveData((prev) => ({ ...prev, selectedCarId: car.id }));
                            showToast(`${car.name} selected for racing!`);
                          }}
                          disabled={isSelected}
                          className={`w-full min-h-[48px] rounded-xl font-display font-bold text-sm transition-colors ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          }`}
                        >
                          {isSelected ? '✓ SELECTED FOR RACE' : 'SELECT CAR'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUnlockCar(car)}
                          className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          {car.unlockType === 'coins'
                            ? `UNLOCK — ${car.unlockCoins?.toLocaleString()} COINS`
                            : car.unlockType === 'level'
                            ? `UNLOCK AT LEVEL ${car.unlockLevel}`
                            : 'UNLOCK VIA LEVEL 50 CHAMPIONSHIP'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: 5 Performance Stats & 5-Level Upgrade Controls */}
                  <div className="space-y-4">
                    <h3 className="font-display text-lg font-bold text-white">
                      Performance Telemetry &amp; Upgrades (Lv.1 – Lv.5)
                    </h3>

                    <div className="space-y-3.5">
                      {statEntries.map((st) => {
                        const lvl = upgrades[st.key];
                        const currentVal = st.base + (lvl - 1) * 4;
                        const nextVal = lvl < 5 ? currentVal + 4 : currentVal;
                        const price = car.upgradeBasePrice * lvl;

                        return (
                          <div
                            key={st.key}
                            className="bg-slate-950/70 border border-white/5 rounded-2xl p-3.5 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">
                                {st.label}{' '}
                                <span className="text-amber-400 font-mono-num">Lv.{lvl}/5</span>
                              </span>
                              <span className="font-mono-num text-slate-300">
                                {currentVal}
                                {lvl < 5 && (
                                  <span className="text-emerald-400"> → {nextVal}</span>
                                )}
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-cyan-400"
                                style={{ width: `${Math.min(100, currentVal)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] text-slate-400 font-mono-num">
                                {lvl < 5
                                  ? `Upgrade Cost: ${price.toLocaleString()} Coins`
                                  : 'Maximum Level Reached'}
                              </span>
                              <button
                                type="button"
                                disabled={!isUnlocked || lvl >= 5}
                                onClick={() => handleUpgradeStat(car, st.key)}
                                className={`min-h-[36px] px-3.5 py-1 rounded-lg font-display font-bold text-xs whitespace-nowrap ${
                                  !isUnlocked || lvl >= 5
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                                }`}
                              >
                                {lvl >= 5 ? 'MAXED' : `UPGRADE (${price})`}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ================= VIEW 4: BABU GRAND CHAMPIONSHIP ================= */}
        {currentView === 'championship' && (
          <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
            <section className="bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="space-y-1">
                  <span className="text-xs font-mono-num text-amber-400 uppercase tracking-widest">
                    FINAL 10-CAR STADIUM EVENT
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    🏆 BABU GRAND CHAMPIONSHIP
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Stadium floodlights, grandstands, fireworks, and 9 elite AI rivals. Win 1st Place to earn the BABU CHAMPION title and unlock the flagship Babu Champion hypercar!
                  </p>
                </div>

                <div className="shrink-0 text-right font-mono-num">
                  <span className="text-xs text-slate-400 block">Status</span>
                  <strong className="text-base text-amber-400">
                    {saveData.championshipWon
                      ? '🏆 GRAND CHAMPION'
                      : saveData.levels[50]?.unlocked
                      ? '🔥 UNLOCKED & READY'
                      : `🔒 UNLOCKS AT LV.50 (${highestUnlockedLevel}/50)`}
                  </strong>
                </div>
              </div>

              {/* Flagship Car 10 Preview */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center space-y-3">
                <span className="text-xs font-semibold text-amber-400">
                  Grand Prize Flagship: {ORIGINAL_CARS[9].name}
                </span>
                <CarIllustration car={ORIGINAL_CARS[9]} className="w-full h-44" />
                <p className="text-xs text-slate-400 text-center max-w-md">
                  {ORIGINAL_CARS[9].tagline}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-300 space-y-1">
                  <p>• Track: Championship Circuit (2 Laps · Night Stadium)</p>
                  <p>• Opponents: Rocky, Speed King, Turbo, Storm, Racer X, Flash, Hunter, Blaze &amp; Nitro</p>
                </div>

                <button
                  type="button"
                  onClick={() => startLevelRace(50)}
                  className={`w-full sm:w-auto min-h-[52px] px-6 py-3 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
                    saveData.levels[50]?.unlocked
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {saveData.levels[50]?.unlocked ? (
                    <>
                      <Trophy className="w-4 h-4" /> START GRAND CHAMPIONSHIP
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> COMPLETE LEVELS 1–49 TO UNLOCK
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ================= VIEW 5: REWARDS (DAILY, MILESTONES, ACHIEVEMENTS, AD) ================= */}
        {currentView === 'rewards' && (
          <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  🎁 DAILY REWARDS, MILESTONES &amp; ACHIEVEMENTS
                </h1>
                <p className="text-xs text-slate-400">
                  All rewards are fictional in-game items with zero gambling mechanics.
                </p>
              </div>
              <RewardedAdButton
                config={saveData.developerConfig.ads}
                onRewardEarned={(type, amount) => {
                  setSaveData((prev) => ({
                    ...prev,
                    coins: prev.coins + (type === 'coins' ? amount : 0),
                    gems: prev.gems + (type === 'gems' ? amount : 0),
                  }));
                }}
              />
            </div>

            <BannerAdSlot config={saveData.developerConfig.ads} placement="Rewards" />

            {/* 7-Day Daily Rewards */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-white">
                  7-Day Daily Login Rewards
                </h2>
                <button
                  type="button"
                  disabled={!canClaimDailyToday}
                  onClick={handleClaimDailyReward}
                  className={`min-h-[44px] px-5 py-2 rounded-xl font-display font-bold text-xs whitespace-nowrap ${
                    canClaimDailyToday
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canClaimDailyToday
                    ? `CLAIM DAY ${((saveData.dailyRewardDay - 1) % 7) + 1} REWARD`
                    : 'CLAIMED FOR TODAY ✓'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {DAILY_REWARDS.map((d) => {
                  const activeDay = ((saveData.dailyRewardDay - 1) % 7) + 1;
                  const isCurrentDay = d.day === activeDay;
                  const isPastDay = d.day < activeDay;

                  return (
                    <div
                      key={d.day}
                      className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2 ${
                        isCurrentDay
                          ? 'bg-slate-900 border-amber-500'
                          : isPastDay
                          ? 'bg-slate-950/60 border-emerald-500/30 opacity-80'
                          : 'bg-slate-900/60 border-white/10'
                      }`}
                    >
                      <span className="font-display font-bold text-xs text-amber-400">
                        {d.title}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {d.description}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isPastDay ? 'Claimed ✓' : isCurrentDay ? 'Next Up' : 'Upcoming'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Level Milestone Rewards */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold text-white">
                Level Progression Milestones
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {MILESTONE_REWARDS.map((m) => {
                  const isClaimed = saveData.claimedMilestones.includes(m.level);
                  const isEligible =
                    highestUnlockedLevel >= m.level || saveData.levels[m.level]?.completed;

                  return (
                    <div
                      key={m.level}
                      className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-display font-bold text-sm text-white block">
                          {m.title}
                        </span>
                        <span className="text-xs text-amber-400 font-medium">
                          {m.description}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={isClaimed || !isEligible}
                        onClick={() => handleClaimMilestone(m.level)}
                        className={`min-h-[40px] px-3.5 py-1.5 rounded-xl font-display font-bold text-xs whitespace-nowrap ${
                          isClaimed
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isEligible
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isClaimed ? 'CLAIMED ✓' : isEligible ? 'CLAIM' : `LV.${m.level}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Achievements */}
            <section className="space-y-4">
              <h2 className="font-display text-lg font-bold text-white">
                🏆 Racing Achievements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {ACHIEVEMENTS.map((ach) => {
                  const unlocked = saveData.unlockedAchievements.includes(ach.id);
                  const claimed = saveData.claimedAchievements.includes(ach.id);

                  return (
                    <div
                      key={ach.id}
                      className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <span className="font-display font-bold text-sm text-white block">
                          {ach.title}
                        </span>
                        <p className="text-xs text-slate-400">{ach.description}</p>
                        <span className="text-[11px] font-mono-num text-amber-400 block">
                          Reward: +{ach.rewardCoins} Coins · +{ach.rewardGems} Gems
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!unlocked || claimed}
                        onClick={() => handleClaimAchievement(ach.id)}
                        className={`min-h-[40px] px-4 py-1.5 rounded-xl font-display font-bold text-xs whitespace-nowrap ${
                          claimed
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : unlocked
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {claimed ? 'CLAIMED ✓' : unlocked ? 'CLAIM' : 'LOCKED'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ================= VIEW 6: BABU PROFILE ================= */}
        {currentView === 'profile' && (
          <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
            <section className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <PlayerAvatar
                  photoUrl={saveData.profilePhotoDataUrl}
                  name={saveData.playerName}
                  size="xl"
                  onClick={() => setIsPhotoModalOpen(true)}
                />
                <div className="space-y-1">
                  <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                    👤 BABU PROFILE
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {saveData.playerName}
                  </h1>
                  <p className="text-xs text-slate-400 font-mono-num">
                    Current Level: {highestUnlockedLevel}/50 · XP: {saveData.xp} · Championship:{' '}
                    <strong className="text-amber-400">
                      {saveData.championshipWon ? 'BABU CHAMPION 🏆' : 'Contender'}
                    </strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center gap-2 whitespace-nowrap"
              >
                <Camera className="w-4 h-4" /> Change Profile Photo
              </button>
            </section>

            {/* Career Telemetry Metrics */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 font-mono-num">
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">Total Races</span>
                <strong className="text-2xl font-bold text-white">{saveData.totalRaces}</strong>
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">1st Place Wins</span>
                <strong className="text-2xl font-bold text-amber-400">{saveData.totalWins}</strong>
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">Podium Finishes</span>
                <strong className="text-2xl font-bold text-cyan-400">{saveData.totalPodiums}</strong>
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">Stars Earned</span>
                <strong className="text-2xl font-bold text-amber-400">{totalStars}/150</strong>
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">Coins Balance</span>
                <strong className="text-2xl font-bold text-amber-400">
                  {saveData.coins.toLocaleString()}
                </strong>
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">Gems Balance</span>
                <strong className="text-2xl font-bold text-cyan-300">{saveData.gems}</strong>
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">Garage Cars</span>
                <strong className="text-2xl font-bold text-white">
                  {saveData.unlockedCarIds.length}/10
                </strong>
              </div>
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
                <span className="text-xs text-slate-400 block">Achievements</span>
                <strong className="text-2xl font-bold text-emerald-400">
                  {saveData.unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </strong>
              </div>
            </section>
          </div>
        )}

        {/* ================= VIEW 7: SETTINGS ================= */}
        {currentView === 'settings' && (
          <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">
            <h1 className="font-display text-2xl font-bold text-white">⚙️ GAME SETTINGS</h1>

            {/* Audio Controls */}
            <section className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-white">
                  Audio &amp; Sound Synthesis
                </h2>
                <button
                  type="button"
                  onClick={handleToggleMuteAll}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-amber-400 flex items-center gap-1.5"
                >
                  {saveData.settings.musicOn ||
                  saveData.settings.sfxOn ||
                  saveData.settings.engineSoundOn ? (
                    <>
                      <Volume2 className="w-4 h-4" /> Mute All
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 text-red-400" /> Unmute All
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Music */}
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2.5 text-slate-200 font-medium">
                    <input
                      type="checkbox"
                      checked={saveData.settings.musicOn}
                      onChange={(e) =>
                        setSaveData((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, musicOn: e.target.checked },
                        }))
                      }
                    />
                    <span>Music ON/OFF</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={saveData.settings.musicVolume}
                    onChange={(e) =>
                      setSaveData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          musicVolume: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="w-40 accent-amber-500"
                  />
                </div>

                {/* SFX */}
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2.5 text-slate-200 font-medium">
                    <input
                      type="checkbox"
                      checked={saveData.settings.sfxOn}
                      onChange={(e) =>
                        setSaveData((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, sfxOn: e.target.checked },
                        }))
                      }
                    />
                    <span>SFX ON/OFF</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={saveData.settings.sfxVolume}
                    onChange={(e) =>
                      setSaveData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          sfxVolume: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="w-40 accent-amber-500"
                  />
                </div>

                {/* Engine Sound */}
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2.5 text-slate-200 font-medium">
                    <input
                      type="checkbox"
                      checked={saveData.settings.engineSoundOn}
                      onChange={(e) =>
                        setSaveData((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, engineSoundOn: e.target.checked },
                        }))
                      }
                    />
                    <span>Engine Sound ON/OFF</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={saveData.settings.engineVolume}
                    onChange={(e) =>
                      setSaveData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          engineVolume: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="w-40 accent-amber-500"
                  />
                </div>

                {/* Vibration */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-slate-200 font-medium">Haptic Vibration ON/OFF</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSaveData((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          vibrationOn: !prev.settings.vibrationOn,
                        },
                      }))
                    }
                    className={`min-h-[38px] px-4 py-1.5 rounded-xl font-display font-bold text-xs ${
                      saveData.settings.vibrationOn
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {saveData.settings.vibrationOn ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </section>

            {/* Graphics & Controls */}
            <section className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 space-y-5">
              <div>
                <h3 className="font-display text-sm font-bold text-white mb-2.5">
                  Graphics Quality Mode
                </h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSaveData((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, graphics: mode },
                        }));
                      }}
                      className={`min-h-[44px] rounded-xl font-display font-bold text-xs ${
                        saveData.settings.graphics === mode
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-display text-sm font-bold text-white mb-2.5">
                  Steering Control Mode
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['BUTTONS', 'TILT'] as const).map((ctrl) => (
                    <button
                      key={ctrl}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSaveData((prev) => ({
                          ...prev,
                          settings: { ...prev.settings, controls: ctrl },
                        }));
                      }}
                      className={`min-h-[44px] rounded-xl font-display font-bold text-xs ${
                        saveData.settings.controls === ctrl
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {ctrl === 'BUTTONS' ? 'TOUCH BUTTONS / KEYBOARD' : 'TILT + BUTTONS'}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Legal, About & Reset Progress */}
            <section className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigateTo('about')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  About &amp; Developer
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setLegalModalType('terms')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Terms of Use
                </button>
              </div>

              <div className="pt-4 border-t border-white/10">
                {!confirmResetOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(true)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Reset All Game Progress
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/40 space-y-3">
                    <p className="text-xs text-red-300">
                      Are you sure you want to reset your levels, coins, cars, and upgrades back to Level 1?
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmResetOpen(false)}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fresh = createInitialSaveData();
                          setSaveData(fresh);
                          persistSaveData(fresh);
                          setConfirmResetOpen(false);
                          showToast('Game progress reset to Level 1.');
                        }}
                        className="min-h-[40px] px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
                      >
                        Confirm Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ================= VIEW 8: ABOUT & DEVELOPER ================= */}
        {currentView === 'about' && (
          <AboutDeveloperView
            config={saveData.developerConfig}
            profilePhoto={saveData.profilePhotoDataUrl}
            onUpdateConfig={(updated) => {
              setSaveData((prev) => ({
                ...prev,
                developerConfig: updated,
              }));
              showToast('Developer configuration saved!');
            }}
            onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
            onOpenPrivacy={() => setLegalModalType('privacy')}
            onOpenTerms={() => setLegalModalType('terms')}
          />
        )}

        {/* ================= VIEW 9: RACE RESULTS ================= */}
        {currentView === 'results' && lastRaceSummary && (
          <div className="max-w-xl mx-auto px-4 py-8 pb-24">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
              <div className="space-y-1">
                <span className="text-xs font-mono-num text-amber-400 uppercase tracking-widest">
                  LEVEL {lastRaceSummary.level} RESULT
                </span>
                <h1 className="font-display text-3xl font-bold text-white">
                  {lastRaceSummary.crashedOut
                    ? '💥 CAR WRECKED — RACE LOST!'
                    : lastRaceSummary.isChampionshipWin
                    ? '🏆 BABU GRAND CHAMPION!'
                    : lastRaceSummary.position <= 3
                    ? '🏁 VICTORY — RACE WON!'
                    : '❌ DEFEAT — TRY AGAIN!'}
                </h1>
                {lastRaceSummary.failReason && (
                  <p className="text-xs text-red-400 font-semibold pt-1">
                    {lastRaceSummary.failReason}
                  </p>
                )}
                {!lastRaceSummary.crashedOut && lastRaceSummary.position > 3 && (
                  <p className="text-xs text-amber-300 pt-1">
                    Finish in Top 3 (1st, 2nd, or 3rd) to win the race and unlock the next level!
                  </p>
                )}
              </div>

              {/* Position Badge & Stars */}
              <div className="py-4 bg-slate-950/80 border border-white/5 rounded-2xl space-y-3">
                <div className="font-display font-bold text-4xl text-amber-400 font-mono-num">
                  {lastRaceSummary.crashedOut
                    ? '💥 DNF (Crashed)'
                    : lastRaceSummary.position === 1
                    ? '🥇 1st Place'
                    : lastRaceSummary.position === 2
                    ? '🥈 2nd Place'
                    : lastRaceSummary.position === 3
                    ? '🥉 3rd Place'
                    : `#${lastRaceSummary.position} / 10`}
                </div>

                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-7 h-7 ${
                        s <= lastRaceSummary.starsEarned
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono-num">
                  <div>
                    <span className="text-slate-400 block">Race Time</span>
                    <strong className="text-white">
                      {formatTime(lastRaceSummary.raceTimeMs)}
                    </strong>
                    {lastRaceSummary.isNewBestTime && (
                      <span className="block text-[10px] text-emerald-400">NEW RECORD!</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">Coins Earned</span>
                    <strong className="text-amber-400">
                      +{lastRaceSummary.coinsEarned.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">XP Earned</span>
                    <strong className="text-cyan-400">+{lastRaceSummary.xpEarned} XP</strong>
                  </div>
                </div>
              </div>

              {lastRaceSummary.unlockedNextLevel && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Unlocked Level {lastRaceSummary.level + 1}!
                </div>
              )}

              {/* Results Action Buttons: NEXT LEVEL, REPLAY, GARAGE, HOME */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {lastRaceSummary.level < 50 &&
                  saveData.levels[lastRaceSummary.level + 1]?.unlocked && (
                    <button
                      type="button"
                      onClick={() => startLevelRace(lastRaceSummary.level + 1)}
                      className="col-span-2 min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2"
                    >
                      NEXT LEVEL (LV.{lastRaceSummary.level + 1})
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => startLevelRace(lastRaceSummary.level)}
                  className="min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> REPLAY
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('garage')}
                  className="min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Car className="w-4 h-4 text-cyan-400" /> GARAGE
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="col-span-2 min-h-[46px] rounded-xl bg-slate-950 hover:bg-slate-800 border border-white/10 text-slate-300 font-display font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Home className="w-4 h-4" /> HOME MENU
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-slate-950/95 backdrop-blur-md border-t border-white/10 grid grid-cols-5 items-center px-2">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentView === 'home' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Home</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('levels')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentView === 'levels' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Levels</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('garage')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentView === 'garage' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Car className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Garage</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('rewards')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentView === 'rewards' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Rewards</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('about')}
          className={`flex flex-col items-center justify-center min-h-[44px] ${
            currentView === 'about' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Info className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Creator</span>
        </button>
      </nav>

      {/* Modals */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        currentPhoto={saveData.profilePhotoDataUrl}
        playerName={saveData.playerName}
        onSavePhoto={(dataUrl, newName) => {
          setSaveData((prev) => ({
            ...prev,
            profilePhotoDataUrl: dataUrl,
            playerName: newName || prev.playerName,
          }));
          showToast('Profile photo & player name updated locally!');
        }}
        onClose={() => setIsPhotoModalOpen(false)}
      />

      <LegalModal
        type={legalModalType}
        config={saveData.developerConfig}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
