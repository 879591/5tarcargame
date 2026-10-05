import React from 'react';
import { ShieldCheck, FileText, X } from 'lucide-react';
import { DeveloperConfig } from '../config/developerConfig';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  config: DeveloperConfig;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, config, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            {type === 'privacy' ? (
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            ) : (
              <FileText className="w-5 h-5 text-amber-400" />
            )}
            <h2 className="font-display text-xl font-bold text-white">
              {type === 'privacy' ? 'Privacy Policy' : 'Terms of Use'} — {config.gameName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <p>
                <strong>Effective Year:</strong> {config.year} · <strong>Game:</strong>{' '}
                {config.gameName} · <strong>Developer:</strong> {config.developerName} (
                {config.creatorBrand} / {config.digitalBrand})
              </p>
              <div>
                <h3 className="font-display font-bold text-white mb-1">
                  1. Local Game Progress Storage
                </h3>
                <p className="text-slate-400">
                  All game progress—including unlocked levels, stars, coins, gems, garage cars, upgrades, achievements, and audio/graphics settings—is stored locally on your device using browser LocalStorage.
                </p>
              </div>
              <div>
                <h3 className="font-display font-bold text-white mb-1">
                  2. Profile Photo Handling
                </h3>
                <p className="text-slate-400">
                  When you select a photo from your gallery or capture a photo using your device camera for your racer profile, the image is cropped and saved strictly inside your device&apos;s local storage. Your photo is never uploaded or transmitted to any external server.
                </p>
              </div>
              <div>
                <h3 className="font-display font-bold text-white mb-1">
                  3. Optional Advertisements &amp; Third-Party SDKs
                </h3>
                <p className="text-slate-400">
                  By default, advertisements are disabled (<code className="text-amber-300">ADS_ENABLED = false</code>). If an official third-party advertising provider is configured in a future build, that provider may process standard technical device identifiers in accordance with their own privacy policy.
                </p>
              </div>
              <div>
                <h3 className="font-display font-bold text-white mb-1">
                  4. No Unnecessary Device Permissions
                </h3>
                <p className="text-slate-400">
                  {config.gameName} does not collect or access your contacts, SMS messages, call logs, or background location. Camera access is optional and only invoked when you explicitly click &ldquo;Use Camera&rdquo; in the Profile Photo tool.
                </p>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>Effective Year:</strong> {config.year} · <strong>Game:</strong>{' '}
                {config.gameName} v{config.version}
              </p>
              <div>
                <h3 className="font-display font-bold text-white mb-1">
                  1. Entertainment &amp; Learning Purpose
                </h3>
                <p className="text-slate-400">
                  {config.gameName} is an original racing game created by {config.developerName} ({config.creatorBrand} / {config.digitalBrand}) for entertainment, creativity, and learning.
                </p>
              </div>
              <div>
                <h3 className="font-display font-bold text-white mb-1">
                  2. Fictional In-Game Currency &amp; Rewards
                </h3>
                <p className="text-slate-400">
                  All in-game Coins, Gems, Stars, Nitro charges, Cars, and Trophies are purely fictional gameplay items. They have no real-world monetary or cash value and cannot be exchanged for real currency. The game contains no gambling mechanics.
                </p>
              </div>
              <div>
                <h3 className="font-display font-bold text-white mb-1">
                  3. Game Updates &amp; Intellectual Property
                </h3>
                <p className="text-slate-400">
                  The developer may update levels, vehicle balance, or features over time. Open-source libraries and fonts used in the project remain governed by their respective licenses.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
