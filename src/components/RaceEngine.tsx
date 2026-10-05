import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Pause,
  RotateCcw,
  Home,
  Volume2,
  VolumeX,
  Flame,
  ShieldAlert,
  AlertTriangle,
  Heart,
  Gauge,
} from 'lucide-react';
import { LevelDefinition, ENVIRONMENTS } from '../data/levels';
import { CarDefinition, AI_OPPONENTS } from '../data/cars';
import { CarUpgradeLevels, GameSettings } from '../utils/storage';
import { soundEngine } from '../utils/soundEngine';

export interface RaceResultPayload {
  level: number;
  position: number; // 1 to 10
  raceTimeMs: number;
  coinsCollectedInRace: number;
  nitroUsesInRace: number;
  crashedOut?: boolean;
  failReason?: string;
}

interface RaceEngineProps {
  levelDef: LevelDefinition;
  playerCar: CarDefinition;
  upgrades: CarUpgradeLevels;
  settings: GameSettings;
  onToggleMuteAll: () => void;
  onFinishRace: (result: RaceResultPayload) => void;
  onExitRace: () => void;
}

interface TrackSegment {
  index: number;
  curve: number;
  y: number;
  isBridge?: boolean;
  isTunnel?: boolean;
  isRamp?: boolean;
  hasShortcut?: boolean;
  hasCliffSide?: boolean;
}

interface RacerEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  x: number; // -1.3 to +1.3 (road is -1.0 to +1.0)
  z: number; // distance along track in segment units
  speed: number;
  maxSpeed: number;
  accel: number;
  handling: number;
  color: string;
  accent: string;
  aggression: number;
  targetLane: number;
  laneTimer: number;
  finished: boolean;
  finishTimeMs: number;
}

interface TrafficEntity {
  id: number;
  lane: number; // -0.65, 0, +0.65
  z: number;
  speed: number;
  type: 'sedan' | 'truck' | 'van';
  color: string;
}

type HazardType =
  | 'cone'
  | 'barrier'
  | 'coin'
  | 'nitro-orb'
  | 'boulder'     // Rolling/falling rock (Patthar)
  | 'elephant'    // Crossing elephant (Haathi)
  | 'bull'        // Charging bull/rhino
  | 'fallen-tree' // Fallen tree trunk across road
  | 'oil-slick'   // Slippery oil puddle that spins steering
  | 'repair-kit'; // Restores car health

interface HazardEntity {
  id: number;
  x: number;
  z: number;
  vx: number; // Lateral speed across the road (for rolling boulders, walking elephants, bulls)
  type: HazardType;
  collected?: boolean;
  bouncePhase: number;
}

export const RaceEngine: React.FC<RaceEngineProps> = ({
  levelDef,
  playerCar,
  upgrades,
  settings,
  onToggleMuteAll,
  onFinishRace,
  onExitRace,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // HUD State synced smoothly
  const [countdown, setCountdown] = useState<number>(3); // 3, 2, 1, 0 (GO!), -1 (Racing)
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [confirmExit, setConfirmExit] = useState<boolean>(false);
  const [hudPosition, setHudPosition] = useState<number>(10);
  const [hudSpeedKmh, setHudSpeedKmh] = useState<number>(0);
  const [hudProgressPct, setHudProgressPct] = useState<number>(0);
  const [hudNitroPct, setHudNitroPct] = useState<number>(65);
  const [hudCoins, setHudCoins] = useState<number>(0);
  const [hudTimeMs, setHudTimeMs] = useState<number>(0);
  const [hudCarHealth, setHudCarHealth] = useState<number>(100);
  const [hazardWarning, setHazardWarning] = useState<string>('');
  const [cruiseLock, setCruiseLock] = useState<boolean>(false); // Optional toggle so player has 100% manual throttle control by default
  const [resetCounter, setResetCounter] = useState<number>(0);

  // Live control states — Manual Gas (Accelerate) + Brake + Steer + Nitro
  const controlsRef = useRef({
    gas: false,
    left: false,
    right: false,
    brake: false,
    nitro: false,
    tiltX: 0,
  });

  const cruiseLockRef = useRef(false);
  cruiseLockRef.current = cruiseLock;

  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  // Compute effective player car stats based on upgrade levels (1-5)
  const effectiveSpeedStat = playerCar.baseStats.speed + (upgrades.speed - 1) * 4;
  const effectiveAccelStat = playerCar.baseStats.acceleration + (upgrades.acceleration - 1) * 4;
  const effectiveHandlingStat = playerCar.baseStats.handling + (upgrades.handling - 1) * 4;
  const effectiveBrakeStat = playerCar.baseStats.brake + (upgrades.brake - 1) * 4;
  const effectiveNitroStat = playerCar.baseStats.nitro + (upgrades.nitro - 1) * 4;

  // Keyboard listeners for desktop testing (W/Up = Gas, S/Down = Brake, A/D = Steer, Space = Nitro)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        controlsRef.current.gas = true;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        controlsRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        controlsRef.current.right = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        controlsRef.current.brake = true;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        controlsRef.current.nitro = true;
      }
      if (e.key === 'Escape') {
        setIsPaused((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        controlsRef.current.gas = false;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        controlsRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        controlsRef.current.right = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        controlsRef.current.brake = false;
      }
      if (e.code === 'Space') {
        controlsRef.current.nitro = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Optional Tilt Orientation Listener
  useEffect(() => {
    if (settings.controls !== 'TILT') return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        const clamped = Math.max(-30, Math.min(30, e.gamma));
        controlsRef.current.tiltX = clamped / 30;
      }
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [settings.controls]);

  // Countdown sequence: 3 -> 2 -> 1 -> GO!
  useEffect(() => {
    setCountdown(3);
    setHudCarHealth(100);
    setHazardWarning('');
    soundEngine.playCountdown(false);

    const t1 = window.setTimeout(() => {
      setCountdown(2);
      soundEngine.playCountdown(false);
    }, 900);
    const t2 = window.setTimeout(() => {
      setCountdown(1);
      soundEngine.playCountdown(false);
    }, 1800);
    const t3 = window.setTimeout(() => {
      setCountdown(0); // GO!
      soundEngine.playCountdown(true);
      soundEngine.startEngine();
    }, 2700);
    const t4 = window.setTimeout(() => {
      setCountdown(-1);
    }, 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      soundEngine.stopEngine();
    };
  }, [resetCounter, levelDef.level]);

  const handleRestartRace = useCallback(() => {
    soundEngine.playClick();
    setIsPaused(false);
    setConfirmExit(false);
    setResetCounter((c) => c + 1);
  }, []);

  // Core 60FPS Racing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const env = ENVIRONMENTS[levelDef.environmentId];
    const totalSegments = levelDef.trackLengthSegments * levelDef.laps;

    // 1. Build dynamic, challenging track geometry with sharp hairpins, S-curves, steep hills, cliffs, bridges, tunnels & ramps
    const track: TrackSegment[] = [];
    for (let i = 0; i < totalSegments + 200; i++) {
      const section = Math.floor(i / 55);
      let curve = 0;

      // Create varied, real-feeling corners instead of a flat/simple road
      if (section % 5 === 1) {
        curve = 1.15 * levelDef.curveIntensity; // Sharp right sweeper
      } else if (section % 5 === 2) {
        curve = -1.25 * levelDef.curveIntensity; // Sharp left hairpin
      } else if (section % 5 === 3) {
        curve = Math.sin(i * 0.14) * 1.35 * levelDef.curveIntensity; // Winding S-chicane
      } else if (section % 5 === 4) {
        curve = Math.cos(i * 0.08) * 0.95 * levelDef.curveIntensity;
      }

      const y =
        Math.sin(i / 22) * levelDef.hillIntensity * 26 +
        Math.cos(i / 11) * levelDef.hillIntensity * 12;

      const isBridge =
        env.sceneryType === 'bridge' || (i % 250 > 100 && i % 250 < 155);
      const isTunnel =
        env.sceneryType === 'tunnel' || (i % 330 > 200 && i % 330 < 250);
      const isRamp = i > 45 && i % 115 === 0;
      const hasShortcut = i > 70 && i % 180 > 0 && i % 180 < 32;
      const hasCliffSide = i % 140 > 40 && i % 140 < 95;

      track.push({
        index: i,
        curve,
        y,
        isBridge,
        isTunnel,
        isRamp,
        hasShortcut,
        hasCliffSide,
      });
    }

    // 2. Initialize 10 Racers (1 Player + 9 Competitive AI Opponents)
    // AI opponents are now genuinely competitive so winning requires active gas, steering, dodging, and nitro!
    const playerMaxSpeed = 1.48 + (effectiveSpeedStat / 100) * 0.72;
    const playerAccel = 0.013 + (effectiveAccelStat / 100) * 0.012;
    const playerHandling = 0.036 + (effectiveHandlingStat / 100) * 0.022;

    const racers: RacerEntity[] = [];

    AI_OPPONENTS.forEach((ai, idx) => {
      const gridRow = 9 - idx;
      const laneOffset = idx % 2 === 0 ? -0.45 : 0.45;
      // Competitive AI scaling: top AI racers drive near or slightly above base speed so player must drive well to win
      const levelScale = 0.95 + (levelDef.level / 50) * 0.22;
      const aiMax =
        playerMaxSpeed * ai.skillFactor * levelScale * (0.93 + (idx % 4) * 0.035);

      racers.push({
        id: ai.id,
        name: ai.name,
        isPlayer: false,
        x: laneOffset,
        z: gridRow * 5.2,
        speed: 0,
        maxSpeed: aiMax,
        accel: 0.015 * ai.skillFactor,
        handling: 0.035,
        color: ai.color,
        accent: ai.accent,
        aggression: ai.aggression,
        targetLane: laneOffset,
        laneTimer: 25 + idx * 10,
        finished: false,
        finishTimeMs: 0,
      });
    });

    const playerEntity: RacerEntity = {
      id: 'player',
      name: 'BABU',
      isPlayer: true,
      x: 0,
      z: 0,
      speed: 0,
      maxSpeed: playerMaxSpeed,
      accel: playerAccel,
      handling: playerHandling,
      color: playerCar.primaryColor,
      accent: playerCar.accentColor,
      aggression: 1,
      targetLane: 0,
      laneTimer: 0,
      finished: false,
      finishTimeMs: 0,
    };
    racers.push(playerEntity);

    // 3. Populate Civilian Traffic
    const trafficList: TrafficEntity[] = [];
    const numTraffic = Math.floor(totalSegments * 0.028 * levelDef.trafficDensity);
    const lanes = [-0.65, 0, 0.65];
    const trafficColors = ['#64748B', '#475569', '#94A3B8', '#334155'];
    for (let i = 0; i < numTraffic; i++) {
      trafficList.push({
        id: i,
        lane: lanes[i % lanes.length],
        z: 55 + i * Math.floor(totalSegments / Math.max(1, numTraffic)),
        speed: 0.5 + (i % 3) * 0.14,
        type: i % 3 === 0 ? 'truck' : i % 2 === 0 ? 'van' : 'sedan',
        color: trafficColors[i % trafficColors.length],
      });
    }

    // 4. Populate Rich Dynamic Hazards:
    // - Falling/Rolling Boulders (Patthar)
    // - Crossing Wild Elephants (Haathi)
    // - Charging Bulls (Saand)
    // - Fallen Tree Logs (Ped)
    // - Slippery Oil Slicks
    // - Repair Kits, Coins & Nitro Orbs
    const hazards: HazardEntity[] = [];
    for (let z = 28; z < totalSegments - 25; z += 9) {
      const randLane = ((z * 23) % 160) / 100 - 0.8;

      if (z % 27 === 0) {
        hazards.push({
          id: z,
          x: randLane,
          z,
          vx: 0,
          type: 'coin',
          bouncePhase: z,
        });
      } else if (z % 63 === 0) {
        hazards.push({
          id: z,
          x: randLane * 0.7,
          z,
          vx: 0,
          type: 'nitro-orb',
          bouncePhase: z,
        });
      } else if (z % 135 === 0) {
        hazards.push({
          id: z,
          x: 0,
          z,
          vx: 0,
          type: 'repair-kit',
          bouncePhase: z,
        });
      } else if (z % 36 === 0) {
        // Rolling Boulder (Patthar) that tumbles across the road!
        hazards.push({
          id: z,
          x: z % 72 === 0 ? -0.9 : 0.9,
          z,
          vx: z % 72 === 0 ? 0.018 : -0.018,
          type: 'boulder',
          bouncePhase: Math.random() * Math.PI * 2,
        });
      } else if (z % 45 === 0) {
        // Giant Wild Elephant (Haathi) walking across the track!
        hazards.push({
          id: z,
          x: z % 90 === 0 ? -0.85 : 0.85,
          z,
          vx: z % 90 === 0 ? 0.008 : -0.008,
          type: 'elephant',
          bouncePhase: 0,
        });
      } else if (z % 54 === 0) {
        // Charging Bull / Rhino crossing fast
        hazards.push({
          id: z,
          x: randLane,
          z,
          vx: 0.014,
          type: 'bull',
          bouncePhase: 0,
        });
      } else if (z % 81 === 0) {
        // Fallen Tree Trunk blocking part of the road
        hazards.push({
          id: z,
          x: z % 162 === 0 ? -0.45 : 0.45,
          z,
          vx: 0,
          type: 'fallen-tree',
          bouncePhase: 0,
        });
      } else if (z % 99 === 0) {
        // Oil Slick that spins steering
        hazards.push({
          id: z,
          x: randLane * 0.6,
          z,
          vx: 0,
          type: 'oil-slick',
          bouncePhase: 0,
        });
      } else if (z % 18 === 0) {
        hazards.push({
          id: z,
          x: randLane,
          z,
          vx: 0,
          type: z % 36 === 0 ? 'barrier' : 'cone',
          bouncePhase: 0,
        });
      }
    }

    const weatherParticles = Array.from(
      { length: settings.graphics === 'LOW' ? 20 : settings.graphics === 'MEDIUM' ? 45 : 80 },
      () => ({
        x: Math.random(),
        y: Math.random(),
        speed: 0.015 + Math.random() * 0.02,
      })
    );

    let nitroCharge = 65; // 0 to 100
    let carHealth = 100; // 0 to 100 — hitting boulders/elephants damages the car; 0 = wrecked!
    let coinsCollected = 0;
    let nitroActivations = 0;
    let wasNitroActive = false;
    let elapsedRaceMs = 0;
    let jumpHeight = 0;
    let jumpVel = 0;
    let cameraTilt = 0;
    let screenShake = 0;
    let spinOutTimer = 0; // Triggered when hitting oil slicks or heavy impacts
    let lastTime = performance.now();
    let animFrameId = 0;
    let raceCompleted = false;

    // Helper: Draw 3D-scaled Hazards (Boulder, Elephant, Bull, Fallen Tree, Oil Slick, Repair Kit)
    const drawHazard = (obs: HazardEntity, ox: number, oy: number, scale: number) => {
      const r = 22 * scale;
      if (r < 2 || oy < 0) return;

      ctx.save();
      ctx.translate(ox, oy);

      if (obs.type === 'boulder') {
        // Giant Rolling Craggy Rock (Patthar)
        const bounceY = Math.abs(Math.sin(obs.bouncePhase)) * 18 * scale;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.4, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(0, -r * 1.2 - bounceY);
        ctx.rotate(obs.bouncePhase);

        const rockGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r * 1.4);
        rockGrad.addColorStop(0, '#94A3B8');
        rockGrad.addColorStop(0.6, '#475569');
        rockGrad.addColorStop(1, '#1E293B');
        ctx.fillStyle = rockGrad;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = Math.max(1, 2.5 * scale);

        ctx.beginPath();
        ctx.moveTo(-r * 1.2, -r * 0.4);
        ctx.lineTo(-r * 0.5, -r * 1.3);
        ctx.lineTo(r * 0.6, -r * 1.2);
        ctx.lineTo(r * 1.3, -r * 0.3);
        ctx.lineTo(r * 0.9, r * 1.0);
        ctx.lineTo(-r * 0.4, r * 1.2);
        ctx.lineTo(-r * 1.3, r * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cracks on boulder
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = Math.max(1, 1.2 * scale);
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.5);
        ctx.lineTo(0, 0);
        ctx.lineTo(r * 0.6, -r * 0.2);
        ctx.stroke();
      } else if (obs.type === 'elephant') {
        // Detailed Giant Elephant (Haathi) crossing the road
        const ew = r * 2.4;
        const eh = r * 2.2;
        const walkBob = Math.sin(obs.bouncePhase * 2) * 4 * scale;

        // Ground shadow
        ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
        ctx.beginPath();
        ctx.ellipse(0, 0, ew * 0.7, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(0, -walkBob);

        // 4 Thick Legs
        ctx.fillStyle = '#475569';
        ctx.fillRect(-ew * 0.45, -eh * 0.45, ew * 0.2, eh * 0.45);
        ctx.fillRect(-ew * 0.15, -eh * 0.42, ew * 0.2, eh * 0.42);
        ctx.fillRect(ew * 0.12, -eh * 0.45, ew * 0.2, eh * 0.45);
        ctx.fillRect(ew * 0.32, -eh * 0.42, ew * 0.2, eh * 0.42);

        // Huge Torso Body
        ctx.fillStyle = '#64748B';
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.beginPath();
        ctx.ellipse(0, -eh * 0.65, ew * 0.58, eh * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Decorative Saddle Blanket (Royal Indian Caparison)
        ctx.fillStyle = '#DC2626';
        ctx.strokeStyle = '#FACC15';
        ctx.fillRect(-ew * 0.32, -eh * 0.95, ew * 0.64, eh * 0.45);
        ctx.strokeRect(-ew * 0.32, -eh * 0.95, ew * 0.64, eh * 0.45);

        // Head & Big Ears
        const headX = obs.vx >= 0 ? ew * 0.48 : -ew * 0.48;
        const dir = obs.vx >= 0 ? 1 : -1;

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(headX - dir * ew * 0.12, -eh * 0.78, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#64748B';
        ctx.beginPath();
        ctx.arc(headX, -eh * 0.78, r * 0.58, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Curved Trunk (Soond)
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = Math.max(2, 10 * scale);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(headX + dir * r * 0.4, -eh * 0.75);
        ctx.quadraticCurveTo(
          headX + dir * r * 0.95,
          -eh * 0.4,
          headX + dir * r * 0.65,
          -eh * 0.15
        );
        ctx.stroke();

        // White Ivory Tusks (Daant)
        ctx.strokeStyle = '#FEFCE8';
        ctx.lineWidth = Math.max(1.5, 4 * scale);
        ctx.beginPath();
        ctx.moveTo(headX + dir * r * 0.25, -eh * 0.62);
        ctx.lineTo(headX + dir * r * 0.85, -eh * 0.52);
        ctx.stroke();

        if (scale > 0.28) {
          ctx.font = `bold ${Math.max(10, Math.round(13 * scale))}px "Plus Jakarta Sans", sans-serif`;
          ctx.fillStyle = '#FDE047';
          ctx.textAlign = 'center';
          ctx.fillText('🐘 HAATHI!', 0, -eh * 1.22);
        }
      } else if (obs.type === 'bull') {
        // Charging Wild Bull / Rhino
        const bw = r * 1.6;
        const bh = r * 1.4;
        ctx.fillStyle = '#292524';
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.beginPath();
        ctx.ellipse(0, -bh * 0.6, bw * 0.55, bh * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Horns
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = Math.max(1.5, 3 * scale);
        ctx.beginPath();
        ctx.moveTo(-bw * 0.35, -bh * 0.85);
        ctx.lineTo(-bw * 0.65, -bh * 1.2);
        ctx.moveTo(bw * 0.35, -bh * 0.85);
        ctx.lineTo(bw * 0.65, -bh * 1.2);
        ctx.stroke();
      } else if (obs.type === 'fallen-tree') {
        // Fallen Tree Log across lane
        const lw = r * 3.2;
        const lh = r * 0.85;
        ctx.fillStyle = '#78350F';
        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.beginPath();
        ctx.roundRect(-lw * 0.5, -lh, lw, lh, 6 * scale);
        ctx.fill();
        ctx.stroke();

        // Green foliage branch cluster
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.arc(lw * 0.35, -lh * 0.9, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'oil-slick') {
        // Dark Rainbow Oil Puddle on road
        ctx.fillStyle = '#090D16';
        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.1, r * 1.5, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (obs.type === 'repair-kit') {
        // Green Wrench / Armor Repair Crate
        ctx.fillStyle = '#10B981';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.beginPath();
        ctx.roundRect(-r * 0.8, -r * 1.6, r * 1.6, r * 1.6, 5 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-r * 0.45, -r * 0.95, r * 0.9, r * 0.3);
        ctx.fillRect(-r * 0.15, -r * 1.25, r * 0.3, r * 0.9);
      } else if (obs.type === 'coin') {
        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.beginPath();
        ctx.arc(0, -r, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (obs.type === 'nitro-orb') {
        ctx.fillStyle = '#06B6D4';
        ctx.strokeStyle = '#E0F2FE';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.beginPath();
        ctx.arc(0, -r, r * 0.95, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (obs.type === 'cone') {
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.9);
        ctx.lineTo(-r * 0.85, 0);
        ctx.lineTo(r * 0.85, 0);
        ctx.closePath();
        ctx.fill();
      } else if (obs.type === 'barrier') {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-r * 1.6, -r * 1.2, r * 3.2, r * 1.2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-r * 0.7, -r * 1.2, r * 1.4, r * 1.2);
      }

      ctx.restore();
    };

    const drawVehicle = (
      cx: number,
      cy: number,
      scale: number,
      color: string,
      accent: string,
      label: string,
      isPlayerCar: boolean,
      isNitroActive: boolean,
      isTraffic = false,
      spinAngle = 0
    ) => {
      const w = 88 * scale;
      const h = 44 * scale;
      if (w < 4 || cy < 0) return;

      ctx.save();
      ctx.translate(cx, cy);
      if (spinAngle !== 0) {
        ctx.rotate(spinAngle);
      }

      // Ground shadow
      ctx.fillStyle = 'rgba(2, 6, 23, 0.75)';
      ctx.beginPath();
      ctx.ellipse(0, h * 0.42, w * 0.56, h * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      if (isTraffic) {
        ctx.fillStyle = color;
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.beginPath();
        ctx.roundRect(-w * 0.46, -h * 0.75, w * 0.92, h * 1.1, 4 * scale);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0F172A';
        ctx.fillRect(-w * 0.36, -h * 0.62, w * 0.72, h * 0.35);

        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-w * 0.42, -h * 0.05, w * 0.18, h * 0.15);
        ctx.fillRect(w * 0.24, -h * 0.05, w * 0.18, h * 0.15);
        ctx.restore();
        return;
      }

      // Sport Racer Body
      ctx.fillStyle = color;
      ctx.strokeStyle = accent;
      ctx.lineWidth = Math.max(1, 2 * scale);

      ctx.beginPath();
      ctx.moveTo(-w * 0.5, h * 0.25);
      ctx.lineTo(-w * 0.44, -h * 0.35);
      ctx.lineTo(-w * 0.28, -h * 0.78);
      ctx.lineTo(w * 0.28, -h * 0.78);
      ctx.lineTo(w * 0.44, -h * 0.35);
      ctx.lineTo(w * 0.5, h * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rear Windshield
      ctx.fillStyle = '#090D16';
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, -h * 0.32);
      ctx.lineTo(-w * 0.22, -h * 0.68);
      ctx.lineTo(w * 0.22, -h * 0.68);
      ctx.lineTo(w * 0.3, -h * 0.32);
      ctx.closePath();
      ctx.fill();

      // Center racing stripe
      ctx.fillStyle = accent;
      ctx.fillRect(-w * 0.08, -h * 0.32, w * 0.16, h * 0.55);

      // Spoiler Wing
      ctx.fillStyle = '#090D16';
      ctx.fillRect(-w * 0.48, -h * 0.22, w * 0.96, h * 0.11);

      // Glowing Tail Lights
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-w * 0.44, -h * 0.02, w * 0.2, h * 0.14);
      ctx.fillRect(w * 0.24, -h * 0.02, w * 0.2, h * 0.14);

      // Wheels
      ctx.fillStyle = '#020617';
      ctx.fillRect(-w * 0.54, -h * 0.05, w * 0.12, h * 0.42);
      ctx.fillRect(w * 0.42, -h * 0.05, w * 0.12, h * 0.42);

      // Dual Nitro Exhaust Flames
      if (isNitroActive) {
        const flameLen = (18 + Math.random() * 18) * scale;
        const grad = ctx.createLinearGradient(0, h * 0.25, 0, h * 0.25 + flameLen);
        grad.addColorStop(0, '#38BDF8');
        grad.addColorStop(0.5, '#F59E0B');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(-w * 0.22, h * 0.25);
        ctx.lineTo(-w * 0.14, h * 0.25 + flameLen);
        ctx.lineTo(-w * 0.06, h * 0.25);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w * 0.06, h * 0.25);
        ctx.lineTo(w * 0.14, h * 0.25 + flameLen);
        ctx.lineTo(w * 0.22, h * 0.25);
        ctx.fill();
      }

      // Driver Nameplate above AI cars
      if (!isPlayerCar && scale > 0.22) {
        ctx.font = `bold ${Math.max(9, Math.round(12 * scale))}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, 0, -h * 0.95);
      }

      ctx.restore();
    };

    const step = (now: number) => {
      const dt = Math.min(50, now - lastTime);
      lastTime = now;

      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const W = canvas.width;
      const H = canvas.height;
      const horizonY = H * 0.42 - jumpHeight * 0.6;

      if (!isPausedRef.current && countdown === -1 && !raceCompleted) {
        elapsedRaceMs += dt;

        const ctrl = controlsRef.current;
        const isGasPressed = ctrl.gas || ctrl.nitro || cruiseLockRef.current;
        const isNitroActive = ctrl.nitro && nitroCharge > 1;

        if (isNitroActive && !wasNitroActive) {
          nitroActivations++;
          soundEngine.playNitro();
        }
        wasNitroActive = isNitroActive;

        if (isNitroActive) {
          nitroCharge = Math.max(0, nitroCharge - 0.42);
        } else if (isGasPressed) {
          nitroCharge = Math.min(
            100,
            nitroCharge + 0.035 * (1 + effectiveNitroStat / 150)
          );
        }

        // 100% PLAYER-CONTROLLED THROTTLE & BRAKING:
        // If player is NOT pressing GAS (or NITRO or Cruise Lock), the car naturally decelerates due to friction/wind!
        const targetMax = isNitroActive
          ? playerEntity.maxSpeed * (1.28 + (effectiveNitroStat / 100) * 0.12)
          : playerEntity.maxSpeed;

        if (ctrl.brake) {
          const brakeDecel = 0.038 + (effectiveBrakeStat / 100) * 0.022;
          playerEntity.speed = Math.max(0, playerEntity.speed - brakeDecel);
        } else if (isGasPressed) {
          const boostMultiplier = isNitroActive ? 2.15 : 1.0;
          playerEntity.speed = Math.min(
            targetMax,
            playerEntity.speed + playerEntity.accel * boostMultiplier
          );
        } else {
          // Coasting drag when player releases gas pedal
          playerEntity.speed = Math.max(0, playerEntity.speed - 0.011);
        }

        const currentSeg =
          track[Math.floor(playerEntity.z) % track.length] || track[0];

        // Off-road slowdown & cliff hazard!
        if (Math.abs(playerEntity.x) > 0.98 && !currentSeg.hasShortcut) {
          playerEntity.speed *= 0.94;
          if (Math.abs(playerEntity.x) > 1.22 && currentSeg.hasCliffSide && jumpHeight === 0) {
            // Driving off the mountain/bridge edge damages and resets car onto road
            carHealth = Math.max(0, carHealth - 22);
            playerEntity.speed *= 0.3;
            playerEntity.x = playerEntity.x > 0 ? 0.65 : -0.65;
            screenShake = 14;
            soundEngine.playCollision();
          }
        }

        // Steering + strong Centrifugal Curve pull (requires active steering on turns!)
        let steerInput = 0;
        if (ctrl.left) steerInput -= 1;
        if (ctrl.right) steerInput += 1;
        if (settings.controls === 'TILT' && Math.abs(ctrl.tiltX) > 0.08) {
          steerInput += ctrl.tiltX;
        }

        if (spinOutTimer > 0) {
          spinOutTimer--;
          steerInput += Math.sin(spinOutTimer * 0.5) * 1.4;
        }

        playerEntity.x +=
          steerInput *
          playerEntity.handling *
          (0.35 + (playerEntity.speed / playerEntity.maxSpeed) * 0.75);
        // Stronger curve centrifugal pull so player must actively steer into turns
        playerEntity.x -=
          currentSeg.curve * 0.025 * Math.pow(playerEntity.speed / playerEntity.maxSpeed, 1.15);
        playerEntity.x = Math.max(-1.38, Math.min(1.38, playerEntity.x));

        cameraTilt = cameraTilt * 0.84 + steerInput * 3.2 * 0.16;
        if (screenShake > 0) screenShake *= 0.85;

        // Ramp jump physics
        if (currentSeg.isRamp && jumpHeight === 0 && playerEntity.speed > 0.75) {
          jumpVel = 10.5;
        }
        if (jumpHeight > 0 || jumpVel !== 0) {
          jumpHeight += jumpVel;
          jumpVel -= 0.55;
          if (jumpHeight <= 0) {
            jumpHeight = 0;
            jumpVel = 0;
          }
        }

        playerEntity.z += playerEntity.speed;

        soundEngine.updateEngine(
          Math.min(1.2, playerEntity.speed / playerEntity.maxSpeed),
          isNitroActive
        );

        // Update 9 Competitive AI Racers
        racers.forEach((r) => {
          if (r.isPlayer || r.finished) return;
          const aiSeg = track[Math.floor(r.z) % track.length] || track[0];

          const curveBrake = Math.abs(aiSeg.curve) > 1.1 ? 0.94 : 1.0;
          // Rubber-banding competitive push so AI never falls trivially behind
          const distBehindPlayer = playerEntity.z - r.z;
          const catchupBoost = distBehindPlayer > 25 ? 1.08 : 1.0;
          const desiredSpeed = r.maxSpeed * curveBrake * catchupBoost;

          if (r.speed < desiredSpeed) {
            r.speed = Math.min(desiredSpeed, r.speed + r.accel);
          } else {
            r.speed *= 0.988;
          }

          r.laneTimer--;
          if (r.laneTimer <= 0) {
            r.targetLane = Math.random() * 1.4 - 0.7;
            r.laneTimer = 40 + Math.floor(Math.random() * 55);
          }
          r.x += (r.targetLane - r.x) * 0.06;
          r.x = Math.max(-0.85, Math.min(0.85, r.x));
          r.z += r.speed;

          // Car-to-Car collision check with Player
          const dz = Math.abs(r.z - playerEntity.z);
          const dx = Math.abs(r.x - playerEntity.x);
          if (dz < 1.8 && dx < 0.28 && jumpHeight < 5) {
            if (playerEntity.z < r.z) {
              playerEntity.speed *= 0.78;
              r.speed = Math.min(r.maxSpeed * 1.08, r.speed + 0.14);
            }
            playerEntity.x += playerEntity.x < r.x ? -0.1 : 0.1;
            carHealth = Math.max(0, carHealth - 4);
            screenShake = 6;
            soundEngine.playCollision();
          }

          if (r.z >= totalSegments && !r.finished) {
            r.finished = true;
            r.finishTimeMs = elapsedRaceMs;
          }
        });

        // Update Civilian Traffic
        trafficList.forEach((t) => {
          t.z += t.speed;
          if (t.z > totalSegments) t.z -= totalSegments;

          const dz = Math.abs(t.z - playerEntity.z);
          const dx = Math.abs(t.lane - playerEntity.x);
          if (dz < 1.8 && dx < 0.3 && jumpHeight < 5) {
            playerEntity.speed *= 0.45;
            carHealth = Math.max(0, carHealth - 12);
            screenShake = 10;
            t.z += 3.5;
            soundEngine.playCollision();
            if (settings.vibrationOn && navigator.vibrate) {
              navigator.vibrate(70);
            }
          }
        });

        // Update Dynamic Hazards (Rolling Boulders, Walking Elephants, Charging Bulls) & Check Collisions
        let upcomingAlert = '';
        hazards.forEach((obs) => {
          if (obs.collected) return;

          // Move dynamic boulders/elephants/bulls across the road!
          if (obs.vx !== 0) {
            obs.x += obs.vx;
            obs.bouncePhase += 0.14;
            if (obs.x > 1.05 || obs.x < -1.05) {
              obs.vx = -obs.vx;
            }
          }

          const distAhead = obs.z - playerEntity.z;
          if (distAhead > 4 && distAhead < 36) {
            if (obs.type === 'elephant') {
              upcomingAlert = '🐘 SAVDHAAN! HAATHI AAGE HAI (ELEPHANT CROSSING)!';
            } else if (obs.type === 'boulder' && !upcomingAlert) {
              upcomingAlert = '🪨 SAVDHAAN! GIRTA HUA PATTHAR (FALLING BOULDER)!';
            } else if (obs.type === 'bull' && !upcomingAlert) {
              upcomingAlert = '🐂 WILD BULL ON ROAD!';
            }
          }

          const dz = Math.abs(obs.z - playerEntity.z);
          const dx = Math.abs(obs.x - playerEntity.x);
          const hitRadius =
            obs.type === 'elephant'
              ? 0.42
              : obs.type === 'fallen-tree'
              ? 0.44
              : obs.type === 'boulder'
              ? 0.36
              : 0.31;

          if (dz < 1.9 && dx < hitRadius) {
            if (obs.type === 'coin') {
              obs.collected = true;
              coinsCollected += 25;
              soundEngine.playCoinPickup();
            } else if (obs.type === 'nitro-orb') {
              obs.collected = true;
              nitroCharge = Math.min(100, nitroCharge + 32);
              soundEngine.playCoinPickup();
            } else if (obs.type === 'repair-kit') {
              obs.collected = true;
              carHealth = Math.min(100, carHealth + 30);
              soundEngine.playReward();
            } else if (obs.type === 'oil-slick' && jumpHeight < 3) {
              obs.collected = true;
              spinOutTimer = 26;
              playerEntity.speed *= 0.78;
              soundEngine.playBrake();
            } else if (jumpHeight < 6) {
              obs.collected = true;
              soundEngine.playCollision();

              if (obs.type === 'elephant') {
                // Heavy crash into Elephant!
                playerEntity.speed *= 0.2;
                carHealth = Math.max(0, carHealth - 28);
                spinOutTimer = 22;
                screenShake = 18;
              } else if (obs.type === 'boulder') {
                // Crushed by Rolling Boulder (Patthar)!
                playerEntity.speed *= 0.25;
                carHealth = Math.max(0, carHealth - 24);
                spinOutTimer = 18;
                screenShake = 16;
              } else if (obs.type === 'bull' || obs.type === 'fallen-tree') {
                playerEntity.speed *= 0.35;
                carHealth = Math.max(0, carHealth - 18);
                screenShake = 12;
              } else {
                playerEntity.speed *= 0.6;
                carHealth = Math.max(0, carHealth - 10);
                screenShake = 8;
              }

              if (settings.vibrationOn && navigator.vibrate) {
                navigator.vibrate(90);
              }
            }
          }
        });

        setHazardWarning(upcomingAlert);
        setHudCarHealth(Math.round(carHealth));

        // Check if Car Health reached 0 (Crashed Out / Defeat!)
        if (carHealth <= 0 && !raceCompleted) {
          raceCompleted = true;
          soundEngine.stopEngine();
          onFinishRace({
            level: levelDef.level,
            position: 10,
            raceTimeMs: Math.round(elapsedRaceMs),
            coinsCollectedInRace: coinsCollected,
            nitroUsesInRace: nitroActivations,
            crashedOut: true,
            failReason: 'Your car was wrecked by boulders and road hazards!',
          });
          return;
        }

        // Compute dynamic race position (1/10 to 10/10)
        const sorted = [...racers].sort((a, b) => b.z - a.z);
        const playerPos = sorted.findIndex((r) => r.isPlayer) + 1;

        setHudPosition(playerPos);
        setHudSpeedKmh(
          Math.round((playerEntity.speed / playerMaxSpeed) * (220 + effectiveSpeedStat))
        );
        setHudProgressPct(
          Math.min(100, Math.round((playerEntity.z / totalSegments) * 100))
        );
        setHudNitroPct(Math.round(nitroCharge));
        setHudCoins(coinsCollected);
        setHudTimeMs(Math.round(elapsedRaceMs));

        // Check Race Completion
        if (playerEntity.z >= totalSegments && !raceCompleted) {
          raceCompleted = true;
          soundEngine.stopEngine();
          onFinishRace({
            level: levelDef.level,
            position: playerPos,
            raceTimeMs: Math.round(elapsedRaceMs),
            coinsCollectedInRace: coinsCollected,
            nitroUsesInRace: nitroActivations,
            crashedOut: false,
          });
          return;
        }
      }

      // ================= RENDERING =================
      ctx.save();
      if (screenShake > 0.5) {
        ctx.translate(
          (Math.random() - 0.5) * screenShake,
          (Math.random() - 0.5) * screenShake
        );
      }
      if (settings.graphics !== 'LOW' && Math.abs(cameraTilt) > 0.05) {
        ctx.translate(W / 2, H / 2);
        ctx.rotate((cameraTilt * Math.PI) / 180);
        ctx.translate(-W / 2, -H / 2);
      }

      // 1. Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, env.skyTop);
      skyGrad.addColorStop(1, env.skyBottom);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, horizonY + 2);

      // Sun / Moon / Stadium Lights
      if (levelDef.isChampionship || env.sceneryType === 'stadium') {
        ctx.fillStyle = '#FDE047';
        for (let s = 0; s < 6; s++) {
          const sx = (W / 6) * s + W / 12;
          ctx.beginPath();
          ctx.arc(sx, horizonY * 0.35, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (env.weather === 'night') {
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.arc(W * 0.78, horizonY * 0.3, 22, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(W * 0.22, horizonY * 0.32, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mountain Range / Skyline Silhouette
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let x = 0; x <= W; x += 35) {
        const peak =
          env.sceneryType === 'city' || env.sceneryType === 'stadium'
            ? ((x * 13) % 48) + 14
            : Math.sin(x * 0.018) * 34 + Math.cos(x * 0.04) * 16 + 24;
        ctx.lineTo(x, horizonY - peak);
      }
      ctx.lineTo(W, horizonY);
      ctx.closePath();
      ctx.fill();

      // 2. Pseudo-3D Road Projection
      const baseSegIndex = Math.floor(playerEntity.z);
      const fracZ = playerEntity.z - baseSegIndex;
      const drawDistance =
        settings.graphics === 'LOW' ? 45 : settings.graphics === 'MEDIUM' ? 65 : 85;

      let curveAccum = 0;
      let curveStep = 0;

      const projectedSlices: Array<{
        segIndex: number;
        screenY: number;
        roadHalfWidth: number;
        centerX: number;
        scale: number;
        seg: TrackSegment;
      }> = [];

      for (let n = 0; n < drawDistance; n++) {
        const segIdx = baseSegIndex + n;
        const seg = track[segIdx % track.length] || track[0];
        const depth = Math.max(0.5, n - fracZ);
        const scale = 1 / (depth * 0.14 + 0.35);

        curveStep += seg.curve * 0.68;
        curveAccum += curveStep;

        const screenY =
          horizonY + (H - horizonY) * Math.pow(scale, 1.15) - seg.y * scale * 0.42;
        const roadHalfWidth = W * 0.46 * scale;
        const centerX =
          W * 0.5 -
          playerEntity.x * roadHalfWidth * 0.85 +
          curveAccum * scale * 0.92;

        projectedSlices.push({
          segIndex: segIdx,
          screenY,
          roadHalfWidth,
          centerX,
          scale,
          seg,
        });
      }

      // Render road strips back-to-front
      for (let i = projectedSlices.length - 1; i > 0; i--) {
        const curr = projectedSlices[i - 1];
        const prev = projectedSlices[i];
        if (curr.screenY <= prev.screenY) continue;

        const isAlt = Math.floor(curr.segIndex / 3) % 2 === 0;

        // Environment Terrain / Cliff Dropoff
        ctx.fillStyle = curr.seg.isTunnel
          ? '#090D16'
          : curr.seg.hasCliffSide
          ? isAlt
            ? '#1E293B'
            : '#0F172A'
          : isAlt
          ? env.grassLight
          : env.grassDark;
        ctx.fillRect(0, prev.screenY, W, curr.screenY - prev.screenY + 1);

        // Shortcut gravel lane
        if (curr.seg.hasShortcut) {
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.moveTo(prev.centerX + prev.roadHalfWidth, prev.screenY);
          ctx.lineTo(prev.centerX + prev.roadHalfWidth * 1.45, prev.screenY);
          ctx.lineTo(curr.centerX + curr.roadHalfWidth * 1.45, curr.screenY);
          ctx.lineTo(curr.centerX + curr.roadHalfWidth, curr.screenY);
          ctx.closePath();
          ctx.fill();
        }

        // Rumble Strips
        const prevRumbleW = prev.roadHalfWidth * 1.15;
        const currRumbleW = curr.roadHalfWidth * 1.15;
        ctx.fillStyle = isAlt ? env.rumbleLight : env.rumbleDark;
        ctx.beginPath();
        ctx.moveTo(prev.centerX - prevRumbleW, prev.screenY);
        ctx.lineTo(prev.centerX + prevRumbleW, prev.screenY);
        ctx.lineTo(curr.centerX + currRumbleW, curr.screenY);
        ctx.lineTo(curr.centerX - currRumbleW, curr.screenY);
        ctx.closePath();
        ctx.fill();

        // Main Road Surface
        ctx.fillStyle = curr.seg.isRamp
          ? '#F59E0B'
          : isAlt
          ? env.roadLight
          : env.roadDark;
        ctx.beginPath();
        ctx.moveTo(prev.centerX - prev.roadHalfWidth, prev.screenY);
        ctx.lineTo(prev.centerX + prev.roadHalfWidth, prev.screenY);
        ctx.lineTo(curr.centerX + curr.roadHalfWidth, curr.screenY);
        ctx.lineTo(curr.centerX - curr.roadHalfWidth, curr.screenY);
        ctx.closePath();
        ctx.fill();

        // Checkered Finish Line Banner
        if (Math.abs(curr.segIndex - totalSegments) <= 2) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.moveTo(prev.centerX - prev.roadHalfWidth, prev.screenY);
          ctx.lineTo(prev.centerX + prev.roadHalfWidth, prev.screenY);
          ctx.lineTo(curr.centerX + curr.roadHalfWidth, curr.screenY);
          ctx.lineTo(curr.centerX - curr.roadHalfWidth, curr.screenY);
          ctx.closePath();
          ctx.fill();
        }

        // Dashed Lane Dividers
        if (isAlt) {
          const laneWPrev = Math.max(1, prev.roadHalfWidth * 0.03);
          const laneWCurr = Math.max(1, curr.roadHalfWidth * 0.03);
          ctx.fillStyle = env.laneColor;

          [-0.33, 0.33].forEach((offset) => {
            const px = prev.centerX + prev.roadHalfWidth * offset;
            const cx = curr.centerX + curr.roadHalfWidth * offset;
            ctx.beginPath();
            ctx.moveTo(px - laneWPrev, prev.screenY);
            ctx.lineTo(px + laneWPrev, prev.screenY);
            ctx.lineTo(cx + laneWCurr, curr.screenY);
            ctx.lineTo(cx - laneWCurr, curr.screenY);
            ctx.closePath();
            ctx.fill();
          });
        }

        // Roadside Scenery: Trees, Cliffs, or Bridge Guardrails
        if (curr.segIndex % 5 === 0 && curr.scale > 0.08) {
          const leftEdge = curr.centerX - curr.roadHalfWidth * 1.35;
          const rightEdge = curr.centerX + curr.roadHalfWidth * 1.35;
          const propScale = curr.scale;

          if (curr.seg.isBridge) {
            ctx.strokeStyle = '#38BDF8';
            ctx.lineWidth = Math.max(1, 3 * propScale);
            ctx.beginPath();
            ctx.moveTo(curr.centerX - curr.roadHalfWidth * 1.15, curr.screenY);
            ctx.lineTo(
              curr.centerX - curr.roadHalfWidth * 1.15,
              curr.screenY - 38 * propScale
            );
            ctx.moveTo(curr.centerX + curr.roadHalfWidth * 1.15, curr.screenY);
            ctx.lineTo(
              curr.centerX + curr.roadHalfWidth * 1.15,
              curr.screenY - 38 * propScale
            );
            ctx.stroke();
          } else {
            // Roadside rocks & palm/forest trees
            ctx.fillStyle = '#14532D';
            ctx.beginPath();
            ctx.arc(
              leftEdge,
              curr.screenY - 26 * propScale,
              18 * propScale,
              0,
              Math.PI * 2
            );
            ctx.arc(
              rightEdge,
              curr.screenY - 26 * propScale,
              18 * propScale,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }
      }

      // 3. Draw Hazards (Boulders, Elephants, Bulls, Trees, Coins), Traffic & AI Cars back-to-front
      for (let i = projectedSlices.length - 1; i >= 0; i--) {
        const slice = projectedSlices[i];

        hazards.forEach((obs) => {
          if (obs.collected || Math.floor(obs.z) !== slice.segIndex) return;
          const ox = slice.centerX + obs.x * slice.roadHalfWidth;
          drawHazard(obs, ox, slice.screenY, slice.scale);
        });

        trafficList.forEach((t) => {
          if (Math.floor(t.z) !== slice.segIndex) return;
          const tx = slice.centerX + t.lane * slice.roadHalfWidth;
          drawVehicle(
            tx,
            slice.screenY,
            slice.scale,
            t.color,
            '#F8FAFC',
            '',
            false,
            false,
            true
          );
        });

        racers.forEach((r) => {
          if (r.isPlayer || Math.floor(r.z) !== slice.segIndex) return;
          const rx = slice.centerX + r.x * slice.roadHalfWidth;
          drawVehicle(
            rx,
            slice.screenY,
            slice.scale,
            r.color,
            r.accent,
            r.name,
            false,
            r.speed > r.maxSpeed * 0.96
          );
        });
      }

      // 4. Draw Player Car in foreground
      const playerScreenY = H * 0.82 - jumpHeight * 1.8;
      const isPlayerNitro = controlsRef.current.nitro && nitroCharge > 1;
      const spinAngle =
        spinOutTimer > 0 ? Math.sin(spinOutTimer * 0.6) * 0.35 : 0;

      drawVehicle(
        W * 0.5,
        playerScreenY,
        1.05,
        playerCar.primaryColor,
        playerCar.accentColor,
        playerCar.name,
        true,
        isPlayerNitro,
        false,
        spinAngle
      );

      // 5. Speed Lines & Weather Effects
      if (isPlayerNitro && settings.graphics !== 'LOW') {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        for (let s = 0; s < 10; s++) {
          const angle = (s / 10) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(
            W * 0.5 + Math.cos(angle) * (W * 0.25),
            H * 0.5 + Math.sin(angle) * (H * 0.25)
          );
          ctx.lineTo(
            W * 0.5 + Math.cos(angle) * (W * 0.6),
            H * 0.5 + Math.sin(angle) * (H * 0.6)
          );
          ctx.stroke();
        }
      }

      if (env.weather === 'rain' || env.weather === 'snow') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.fillStyle = 'rgba(241, 245, 249, 0.75)';
        ctx.lineWidth = 1.5;
        weatherParticles.forEach((p) => {
          p.y = (p.y + p.speed) % 1;
          const px = p.x * W;
          const py = p.y * H;
          if (env.weather === 'rain') {
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - 4, py + 14);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      ctx.restore();
      animFrameId = requestAnimationFrame(step);
    };

    animFrameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [
    levelDef,
    playerCar,
    effectiveSpeedStat,
    effectiveAccelStat,
    effectiveHandlingStat,
    effectiveBrakeStat,
    effectiveNitroStat,
    settings.graphics,
    settings.controls,
    settings.vibrationOn,
    countdown,
    resetCounter,
    onFinishRace,
  ]);

  const formatRaceTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${min}:${sec.toString().padStart(2, '0')}.${tenths}`;
  };

  const isMuted = !settings.musicOn && !settings.sfxOn && !settings.engineSoundOn;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#090D16] select-none">
      {/* Full-Viewport 3D Perspective Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Floating Telemetry HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 sm:p-4 pointer-events-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 bg-black/65 backdrop-blur-md border border-white/10 rounded-2xl px-3.5 py-2.5">
          {/* Position & Speed */}
          <div className="flex items-center gap-3">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                POSITION
              </span>
              <span className="font-display font-bold text-xl sm:text-2xl text-amber-400 font-mono-num">
                {hudPosition}/10
              </span>
            </div>
            <div className="h-7 w-px bg-white/10" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                SPEED
              </span>
              <span className="font-display font-bold text-xl sm:text-2xl text-white font-mono-num">
                {hudSpeedKmh} <small className="text-xs text-slate-400">KM/H</small>
              </span>
            </div>
          </div>

          {/* Center Progress & Track Info */}
          <div className="hidden sm:flex flex-col items-center flex-1 max-w-xs px-4">
            <div className="w-full flex items-center justify-between text-xs text-slate-300 mb-1">
              <span className="truncate font-semibold">
                Lv.{levelDef.level} · {levelDef.trackName}
              </span>
              <span className="font-mono-num text-amber-400">{hudProgressPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-100"
                style={{ width: `${hudProgressPct}%` }}
              />
            </div>
          </div>

          {/* Right Coins, Time & Pause */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            <div className="text-right">
              <span className="block text-[10px] text-slate-400">TIME · COINS</span>
              <span className="font-mono-num text-xs sm:text-sm font-bold text-slate-200">
                {formatRaceTime(hudTimeMs)} · <span className="text-amber-400">+{hudCoins}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleMuteAll}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-slate-200 hover:text-amber-400"
              aria-label="Toggle sound"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsPaused(true);
              }}
              className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-white hover:bg-slate-800"
              aria-label="Pause race"
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-HUD: Car Armor/Health, Progress & Nitro Meter */}
        <div className="max-w-5xl mx-auto mt-2 grid grid-cols-3 gap-2">
          {/* Car Health Bar */}
          <div className="bg-black/55 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1 whitespace-nowrap">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Car HP
            </span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hudCarHealth > 50
                    ? 'bg-emerald-500'
                    : hudCarHealth > 25
                    ? 'bg-amber-500'
                    : 'bg-red-600'
                }`}
                style={{ width: `${hudCarHealth}%` }}
              />
            </div>
            <span className="font-mono-num text-[11px] text-white">{hudCarHealth}%</span>
          </div>

          {/* Progress */}
          <div className="bg-black/55 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">
              Track
            </span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{ width: `${hudProgressPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[11px] text-amber-400">{hudProgressPct}%</span>
          </div>

          {/* Nitro */}
          <div className="bg-black/55 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold text-cyan-300 flex items-center gap-1 whitespace-nowrap">
              <Flame className="w-3.5 h-3.5 text-cyan-400" /> Nitro
            </span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{ width: `${hudNitroPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[11px] text-cyan-300">{hudNitroPct}%</span>
          </div>
        </div>

        {/* Dynamic Hazard Alert Banner (Elephant / Falling Boulder Warning) */}
        {hazardWarning && (
          <div className="max-w-md mx-auto mt-2 px-4 py-1.5 rounded-xl bg-red-600/90 border border-amber-300 text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{hazardWarning}</span>
          </div>
        )}
      </div>

      {/* Race Countdown Overlay: 3 -> 2 -> 1 -> GO! */}
      {countdown >= 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] pointer-events-none">
          <div className="text-center animate-bounce">
            <span className="block text-xs font-display tracking-[0.25em] text-amber-300 uppercase mb-2">
              Hold GAS / RACE Pedal to Accelerate · Watch out for Boulders &amp; Elephants!
            </span>
            <div className="font-display font-bold italic text-7xl sm:text-8xl text-white drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Full Manual Mobile Touch Controls: LEFT + RIGHT | BRAKE + NITRO + GAS (RACE PEDAL) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-5 pointer-events-none">
        <div className="max-w-5xl mx-auto flex items-end justify-between gap-2">
          {/* Left & Right Steering Pad */}
          <div className="flex items-center gap-2.5 pointer-events-auto">
            <button
              type="button"
              onPointerDown={() => {
                controlsRef.current.left = true;
              }}
              onPointerUp={() => {
                controlsRef.current.left = false;
              }}
              onPointerLeave={() => {
                controlsRef.current.left = false;
              }}
              className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-slate-900/85 active:bg-amber-500 active:text-slate-950 border-2 border-white/25 backdrop-blur-md flex flex-col items-center justify-center text-white font-display font-bold shadow-xl transition-transform active:scale-95"
            >
              <span className="text-2xl">◀</span>
              <span className="text-[10px] tracking-wider mt-0.5">LEFT</span>
            </button>

            <button
              type="button"
              onPointerDown={() => {
                controlsRef.current.right = true;
              }}
              onPointerUp={() => {
                controlsRef.current.right = false;
              }}
              onPointerLeave={() => {
                controlsRef.current.right = false;
              }}
              className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-slate-900/85 active:bg-amber-500 active:text-slate-950 border-2 border-white/25 backdrop-blur-md flex flex-col items-center justify-center text-white font-display font-bold shadow-xl transition-transform active:scale-95"
            >
              <span className="text-2xl">▶</span>
              <span className="text-[10px] tracking-wider mt-0.5">RIGHT</span>
            </button>
          </div>

          {/* Center Optional Cruise Lock & Keyboard Hint */}
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setCruiseLock((c) => !c);
              }}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-display font-bold flex items-center gap-1.5 transition-colors ${
                cruiseLock
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                  : 'bg-slate-900/80 text-slate-300 border-white/15'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              {cruiseLock ? 'AUTO-GAS: ON' : 'MANUAL GAS (HOLD RACE)'}
            </button>
            <div className="hidden lg:block text-center text-[10px] text-slate-400 bg-black/60 px-2.5 py-1 rounded-lg border border-white/5">
              W/Up: Gas · S/Down: Brake · A/D: Steer · Space: Nitro
            </div>
          </div>

          {/* Right Pedals: BRAKE + NITRO + MANUAL GAS (RACE) */}
          <div className="flex items-end gap-2 sm:gap-2.5 pointer-events-auto">
            <button
              type="button"
              onPointerDown={() => {
                controlsRef.current.brake = true;
                soundEngine.playBrake();
              }}
              onPointerUp={() => {
                controlsRef.current.brake = false;
              }}
              onPointerLeave={() => {
                controlsRef.current.brake = false;
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-950/90 active:bg-red-500 border-2 border-red-400/50 backdrop-blur-md flex flex-col items-center justify-center text-red-100 font-display font-bold shadow-xl transition-transform active:scale-95"
            >
              <span className="text-base">🛑</span>
              <span className="text-[10px] tracking-wider mt-0.5">BRAKE</span>
            </button>

            <button
              type="button"
              onPointerDown={() => {
                controlsRef.current.nitro = true;
              }}
              onPointerUp={() => {
                controlsRef.current.nitro = false;
              }}
              onPointerLeave={() => {
                controlsRef.current.nitro = false;
              }}
              className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-cyan-950/90 active:bg-cyan-400 active:text-slate-950 border-2 border-cyan-400/60 backdrop-blur-md flex flex-col items-center justify-center text-cyan-200 font-display font-bold shadow-xl transition-transform active:scale-95"
            >
              <Flame className="w-6 h-6 text-cyan-300" />
              <span className="text-[10px] tracking-wider mt-0.5">NITRO</span>
            </button>

            {/* Manual Accelerator / Gas Pedal */}
            <button
              type="button"
              onPointerDown={() => {
                controlsRef.current.gas = true;
              }}
              onPointerUp={() => {
                controlsRef.current.gas = false;
              }}
              onPointerLeave={() => {
                controlsRef.current.gas = false;
              }}
              className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gradient-to-t from-emerald-600 to-amber-500 active:from-amber-400 active:to-emerald-400 border-2 border-amber-200 flex flex-col items-center justify-center text-slate-950 font-display font-bold shadow-2xl transition-transform active:scale-95"
            >
              <span className="text-2xl">⚡</span>
              <span className="text-xs tracking-wider mt-1 font-extrabold">RACE</span>
              <span className="text-[9px] uppercase opacity-80">GAS PEDAL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pause Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h2 className="font-display text-2xl font-bold text-white text-center">
              RACE PAUSED
            </h2>
            <p className="text-xs text-slate-400 text-center">
              Level {levelDef.level} · {levelDef.trackName}
            </p>

            {!confirmExit ? (
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setIsPaused(false);
                  }}
                  className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm transition-colors"
                >
                  RESUME
                </button>

                <button
                  type="button"
                  onClick={handleRestartRace}
                  className="w-full min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  RESTART
                </button>

                <button
                  type="button"
                  onClick={onToggleMuteAll}
                  className="w-full min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                  SOUND: {isMuted ? 'MUTED' : 'ON'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setConfirmExit(true);
                  }}
                  className="w-full min-h-[48px] rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  EXIT RACE
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2 bg-slate-950 p-4 rounded-2xl border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Confirm exit? Current race progress will not be saved.</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmExit(false)}
                    className="min-h-[44px] rounded-xl bg-slate-800 text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      soundEngine.stopEngine();
                      onExitRace();
                    }}
                    className="min-h-[44px] rounded-xl bg-red-600 text-white text-xs font-bold"
                  >
                    Confirm Exit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
