export interface DeveloperConfig {
  gameName: string;
  tagline: string;
  version: string;
  year: number;
  developerName: string;
  creatorBrand: string;
  digitalBrand: string;
  location: string;
  countryFlag: string;
  gamePurpose: string;
  developerMessage: string;
  announcement: string;
  creatorBio: {
    intro: string;
    interests: string[];
  };
  contact: {
    DEVELOPER_EMAIL: string;
    DEVELOPER_WHATSAPP: string;
    DEVELOPER_WEBSITE: string;
    DEVELOPER_INSTAGRAM: string;
    DEVELOPER_YOUTUBE: string;
  };
  ads: {
    ADS_ENABLED: boolean;
    BANNER_AD_ENABLED: boolean;
    INTERSTITIAL_AD_ENABLED: boolean;
    REWARDED_AD_ENABLED: boolean;
    INTERSTITIAL_FREQUENCY: number;
    AD_PROVIDER_CONFIGURED: boolean;
  };
  defaultPlayerName: string;
  defaultProfilePhotoUrl: string;
}

export const DEFAULT_DEVELOPER_CONFIG: DeveloperConfig = {
  gameName: "BABU CAR RACING",
  tagline: "Race • Win • Unlock • Become Champion",
  version: "1.1.0",
  year: 2026,
  developerName: "Suraj Maurya",
  creatorBrand: "5tar Suraj",
  digitalBrand: "Supriya Digital Research",
  location: "Rudhauli, Basti, Uttar Pradesh, India",
  countryFlag: "🇮🇳",
  gamePurpose:
    "BABU CAR RACING is an original mobile racing project created for entertainment, creativity and learning. The game provides players with different cars, tracks, levels, races, rewards and championship progression.",
  developerMessage:
    "BABU CAR RACING is an original racing project created for entertainment, creativity and learning. The game is designed to provide players with exciting races, different routes, cars, rewards and championship progression.",
  announcement: "Welcome to BABU CAR RACING! Watch out for falling boulders, wild elephants, and rival AI racers!",
  creatorBio: {
    intro:
      "Suraj Maurya is a digital creator and technology-focused developer from Rudhauli, Basti, Uttar Pradesh.",
    interests: [
      "Digital technology",
      "Websites & website development",
      "AI tools & technology",
      "Creative projects & graphic/design work",
      "Educational projects",
      "Social media content",
      "Digital services",
      "Game and software development experiments",
    ],
  },
  // IMPORTANT: Do NOT invent any contact details. Empty fields automatically hide their button.
  contact: {
    DEVELOPER_EMAIL: "",
    DEVELOPER_WHATSAPP: "",
    DEVELOPER_WEBSITE: "",
    DEVELOPER_INSTAGRAM: "",
    DEVELOPER_YOUTUBE: "",
  },
  // Legitimate ad architecture: disabled by default until real SDK credentials are configured
  ads: {
    ADS_ENABLED: false,
    BANNER_AD_ENABLED: false,
    INTERSTITIAL_AD_ENABLED: false,
    REWARDED_AD_ENABLED: false,
    INTERSTITIAL_FREQUENCY: 3,
    AD_PROVIDER_CONFIGURED: false,
  },
  defaultPlayerName: "BABU",
  defaultProfilePhotoUrl: "",
};
