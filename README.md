# 🏎️ BABU CAR RACING 🏁

**Tagline:** *Race • Win • Unlock • Become Champion*  
**Version:** `1.0.0`  
**Developed By:** Suraj Maurya (`5tar Suraj` / `Supriya Digital Research`)  
**Location:** Rudhauli, Basti, Uttar Pradesh, India 🇮🇳  
**Year:** 2026

---

## 1. Overview

**BABU CAR RACING** is a complete, original mobile-first car racing game built with React, TypeScript, Tailwind CSS, HTML5 3D-Perspective Canvas, and Web Audio API procedural sound synthesis.

### Key Features Implemented
- **50 Playable Levels:** Level 1 starts unlocked; levels 2–50 unlock sequentially across 17 distinct environments (`Village Road`, `Green Fields`, `Small Town`, `City Road`, `Highway`, `Mountain Pass`, `Forest Road`, `Desert Road`, `Rainy Highway`, `Night City`, `Snow Road`, `Coastal Road`, `Bridge Route`, `Tunnel Route`, `Industrial Route`, `Grand City`, and `Championship Circuit`).
- **10-Car Racing Engine:** Every race features 1 Player (`BABU`) competing against 9 named AI opponents (`Rocky`, `Speed King`, `Turbo`, `Storm`, `Racer X`, `Flash`, `Hunter`, `Blaze`, `Nitro`).
- **Dynamic Weather & Road Features:** Curves, elevation hills, bridges, tunnels, jump ramps, gravel shortcuts, civilian traffic (`sedan`, `van`, `truck`), cones, barriers, coins, and Nitro orbs.
- **10 Original Cars & Garage Upgrades:** `Babu Racer` (Free), `Street King`, `Thunder GT`, `Turbo X`, `Road Beast`, `Night Rider`, `Desert Storm`, `Speed Hawk`, `Royal GT`, and `Babu Champion` with 5-level upgrades for Speed, Acceleration, Handling, Brake, and Nitro.
- **Babu Grand Championship (Level 50):** Night stadium finale with floodlights and grandstands that awards the `BABU CHAMPION` title and unlocks the `Babu Champion` hypercar.
- **Rewards & Progression:** 7-Day Daily Rewards, Level Milestones, 7 Achievements, and full LocalStorage persistence (`babu_car_racing_save_v1`).
- **Profile Photo Tool:** Select from gallery or capture via camera, crop/pan without distorting the face, and display across the Loading Screen, Main Menu, Profile, and Developer Card.
- **About & Developer Page:** Displays full creator biography, academic history, and editable developer configuration for Suraj Maurya (`5tar Suraj` / `Supriya Digital Research`).

---

## 2. Build & Run Instructions

### Local Development
```bash
npm install
npm run dev
```
The development server runs on `http://localhost:3000`.

### Production Build
```bash
npm run build
npm run preview
```

---

## 3. Customization & Configuration Guide

All developer branding, education records, contact variables, and advertisement flags are centralized in:
- **`src/config/developerConfig.ts`** (and editable live inside the app via **About & Developer → Developer Configuration**).

### Where to Replace the Logo
- Open **`src/components/GameLogo.tsx`** to customize the custom SVG racing crest or replace it with your own image asset.

### Where to Replace the Profile Photo
- **In-App:** Click your avatar on the Home screen, Profile screen, or About & Developer screen (or click **Change Photo**) to select an image from your gallery or take a photo with your camera, crop it without distortion, and save it locally.
- **Default in Code:** Set `defaultProfilePhotoUrl` in `src/config/developerConfig.ts`.

### Where to Add Real Contact Details
- Open **`src/config/developerConfig.ts`** (or use the in-app **Developer Configuration** editor on the **About & Developer** screen) and fill in:
  - `DEVELOPER_EMAIL`
  - `DEVELOPER_WHATSAPP`
  - `DEVELOPER_WEBSITE`
  - `DEVELOPER_INSTAGRAM`
  - `DEVELOPER_YOUTUBE`
- Any field left empty (`""`) automatically hides its corresponding button so fake contact details are never shown.

### Where to Configure Advertising
- Open **`src/config/developerConfig.ts`** under the `ads` object:
  - `ADS_ENABLED` (default: `false`)
  - `BANNER_AD_ENABLED` (default: `false`)
  - `INTERSTITIAL_AD_ENABLED` (default: `false`)
  - `REWARDED_AD_ENABLED` (default: `false`)
  - `INTERSTITIAL_FREQUENCY` (default: `3`)
- Connect your real ad provider callback in **`src/components/AdSystem.tsx`**.

### How to Build for Android (Capacitor / TWA)
1. Run `npm run build` to generate the static `dist/` bundle.
2. To package as an Android APK/AAB using Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "BABU CAR RACING" "com.surajmaurya.babucarracing" --web-dir=dist
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
3. Build and sign the APK/AAB inside Android Studio.
