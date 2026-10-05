export interface DailyRewardItem {
  day: number;
  title: string;
  rewardType: 'coins' | 'gems' | 'nitro' | 'skin' | 'big';
  amount: number;
  description: string;
}

export const DAILY_REWARDS: DailyRewardItem[] = [
  { day: 1, title: 'Day 1', rewardType: 'coins', amount: 500, description: '+500 Coins' },
  { day: 2, title: 'Day 2', rewardType: 'coins', amount: 1000, description: '+1,000 Coins' },
  { day: 3, title: 'Day 3', rewardType: 'gems', amount: 15, description: '+15 Gems' },
  { day: 4, title: 'Day 4', rewardType: 'nitro', amount: 3, description: '+3 Full Nitro Charges' },
  { day: 5, title: 'Day 5', rewardType: 'coins', amount: 2500, description: '+2,500 Coins' },
  { day: 6, title: 'Day 6', rewardType: 'skin', amount: 1, description: 'Crimson Pulse Finish' },
  { day: 7, title: 'Day 7', rewardType: 'big', amount: 5000, description: '+5,000 Coins & +30 Gems' },
];

export interface MilestoneRewardItem {
  level: number;
  title: string;
  description: string;
  rewardType: 'coins' | 'car' | 'gems' | 'skin' | 'championship';
  coins?: number;
  gems?: number;
  carId?: string;
  skinName?: string;
}

export const MILESTONE_REWARDS: MilestoneRewardItem[] = [
  { level: 5, title: 'Level 5 Milestone', description: '+1,500 Coins', rewardType: 'coins', coins: 1500 },
  { level: 10, title: 'Level 10 Milestone', description: 'Unlocks Turbo X', rewardType: 'car', carId: 'turbo-x', coins: 1000 },
  { level: 15, title: 'Level 15 Milestone', description: '+25 Gems', rewardType: 'gems', gems: 25 },
  { level: 20, title: 'Level 20 Milestone', description: 'Night Rider + Special Skin', rewardType: 'car', carId: 'night-rider', skinName: 'Midnight Cyber Wrap' },
  { level: 25, title: 'Level 25 Milestone', description: '+5,000 Coins', rewardType: 'coins', coins: 5000 },
  { level: 30, title: 'Level 30 Milestone', description: 'Unlocks Speed Hawk', rewardType: 'car', carId: 'speed-hawk', coins: 2000 },
  { level: 40, title: 'Level 40 Milestone', description: 'Royal GT + Premium Skin', rewardType: 'car', carId: 'royal-gt', skinName: 'Royal Gold Trim' },
  { level: 50, title: 'Level 50 Grand Milestone', description: 'Babu Champion Car + Grand Trophy', rewardType: 'championship', carId: 'babu-champion', coins: 10000, gems: 50 },
];

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardGems: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-race',
    title: 'First Race',
    description: 'Complete your first official race in BABU CAR RACING.',
    rewardCoins: 500,
    rewardGems: 5,
  },
  {
    id: 'first-victory',
    title: 'First Victory',
    description: 'Finish in 1st Place against 9 AI opponents.',
    rewardCoins: 1000,
    rewardGems: 10,
  },
  {
    id: 'ten-wins',
    title: '10 Wins',
    description: 'Win 10 races in 1st Place across any tracks.',
    rewardCoins: 3000,
    rewardGems: 20,
  },
  {
    id: 'nitro-master',
    title: 'Nitro Master',
    description: 'Activate Nitro boost 25 times during races.',
    rewardCoins: 1500,
    rewardGems: 10,
  },
  {
    id: 'garage-collector',
    title: 'Garage Collector',
    description: 'Unlock at least 5 original cars in your Garage.',
    rewardCoins: 4000,
    rewardGems: 25,
  },
  {
    id: 'fifty-stars',
    title: '50 Stars',
    description: 'Earn a total of 50 or more stars across levels.',
    rewardCoins: 5000,
    rewardGems: 30,
  },
  {
    id: 'grand-champion',
    title: 'Grand Champion',
    description: 'Win Level 50 — The Babu Grand Championship.',
    rewardCoins: 15000,
    rewardGems: 100,
  },
];
