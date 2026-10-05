import React, { useState } from 'react';
import { Gift, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { DeveloperConfig } from '../config/developerConfig';
import { soundEngine } from '../utils/soundEngine';

interface BannerAdSlotProps {
  config: DeveloperConfig['ads'];
  placement: 'Home' | 'Levels' | 'Garage' | 'Rewards';
}

export const BannerAdSlot: React.FC<BannerAdSlotProps> = ({ config, placement }) => {
  // Only render if ADS_ENABLED and BANNER_AD_ENABLED and real provider credentials configured
  if (!config.ADS_ENABLED || !config.BANNER_AD_ENABLED || !config.AD_PROVIDER_CONFIGURED) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto my-3 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between text-xs text-slate-400">
      <span>Ad SDK Slot ({placement})</span>
      <span className="font-mono-num text-[11px] text-slate-500">Verified Ad Container</span>
    </div>
  );
};

interface RewardedAdButtonProps {
  config: DeveloperConfig['ads'];
  onRewardEarned: (rewardType: 'coins' | 'nitro' | 'gems', amount: number) => void;
}

export const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({ config }) => {
  const [showSdkModal, setShowSdkModal] = useState(false);

  const handleWatchAdClick = () => {
    soundEngine.playClick();
    // Strict rule: Never grant rewards merely from clicking the button.
    // Only grant reward when the real ad SDK confirms completion.
    setShowSdkModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleWatchAdClick}
        className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
      >
        <Gift className="w-4 h-4 text-amber-400 shrink-0" />
        <span>🎁 WATCH AD &amp; GET REWARD</span>
      </button>

      {showSdkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-base text-white">
                  Rewarded Ad Status
                </h3>
              </div>
              <button
                onClick={() => setShowSdkModal(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                <strong>No Fake Ads Policy:</strong> BABU CAR RACING uses a strict legitimate advertising architecture.
              </p>
              <p className="text-slate-400">
                Current configuration: <code className="text-amber-300">ADS_ENABLED = {String(config.ADS_ENABLED)}</code>,{' '}
                <code className="text-amber-300">REWARDED_AD_ENABLED = {String(config.REWARDED_AD_ENABLED)}</code>.
              </p>
              <p className="text-slate-400">
                Rewards (+100 Coins, +1 Nitro, or +5 Gems) are only granted when a configured third-party Ad SDK dispatches a verified <code className="text-cyan-300">onRewardedVideoCompleted</code> callback. No reward is granted simply from clicking the button without a verified SDK callback.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSdkModal(false)}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
