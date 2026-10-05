import React, { useState } from 'react';
import {
  Mail,
  MessageCircle,
  Globe,
  Instagram,
  Youtube,
  MapPin,
  Award,
  Code2,
  Edit3,
  Save,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { DeveloperConfig } from '../config/developerConfig';
import { PlayerAvatar } from './ProfilePhotoModal';
import { GameLogo } from './GameLogo';
import { soundEngine } from '../utils/soundEngine';

interface AboutDeveloperViewProps {
  config: DeveloperConfig;
  profilePhoto: string;
  onUpdateConfig: (updated: DeveloperConfig) => void;
  onOpenPhotoModal: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const AboutDeveloperView: React.FC<AboutDeveloperViewProps> = ({
  config,
  profilePhoto,
  onUpdateConfig,
  onOpenPhotoModal,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [draft, setDraft] = useState<DeveloperConfig>(config);

  const contactSectionRef = React.useRef<HTMLDivElement>(null);

  const scrollToContact = () => {
    soundEngine.playClick();
    contactSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    onUpdateConfig(draft);
    setIsEditingConfig(false);
  };

  const { contact } = config;
  const hasAnyContact =
    Boolean(contact.DEVELOPER_EMAIL.trim()) ||
    Boolean(contact.DEVELOPER_WHATSAPP.trim()) ||
    Boolean(contact.DEVELOPER_WEBSITE.trim()) ||
    Boolean(contact.DEVELOPER_INSTAGRAM.trim()) ||
    Boolean(contact.DEVELOPER_YOUTUBE.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-24">
      {/* DEVELOPER CARD */}
      <section className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <PlayerAvatar
              photoUrl={profilePhoto}
              name={config.developerName}
              size="xl"
              onClick={onOpenPhotoModal}
            />
            <div className="space-y-1">
              <GameLogo size="sm" gameName={config.gameName} />
              <p className="text-xs text-slate-400 pt-1">
                Developed By <strong className="text-white">{config.developerName}</strong> · Creator{' '}
                <strong className="text-amber-400">{config.creatorBrand}</strong>
              </p>
              <p className="text-xs text-slate-300">
                Digital Development: <strong className="text-cyan-300">{config.digitalBrand}</strong>
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  📍 {config.location} {config.countryFlag}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                🎮 Original Mobile Racing Game · Year {config.year} · v{config.version}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={scrollToContact}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs tracking-wide transition-colors whitespace-nowrap"
            >
              CONTACT DEVELOPER
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setDraft(config);
                setIsEditingConfig(!isEditingConfig);
              }}
              className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              {isEditingConfig ? 'Close Developer Config' : 'Developer Configuration'}
            </button>
          </div>
        </div>

        {/* Developer Message & Game Purpose */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
          <blockquote className="text-sm sm:text-base italic text-slate-200 leading-relaxed">
            “{config.developerMessage}”
          </blockquote>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            {config.gamePurpose}
          </p>
        </div>
      </section>

      {/* ABOUT THE CREATOR & BIO */}
      <section className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Code2 className="w-5 h-5 text-amber-400" />
          <h2 className="font-display text-xl font-bold text-white">
            👨💻 About the Creator — {config.developerName}
          </h2>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{config.creatorBio.intro}</p>

        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            Core Interests &amp; Focus Areas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-200">
            {config.creatorBio.interests.map((interest, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1">
                <span className="text-amber-400">•</span>
                <span>{interest}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Creator Identity</span>
            <strong className="text-white text-sm">{config.creatorBrand}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Digital Development Brand</span>
            <strong className="text-cyan-300 text-sm">{config.digitalBrand}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">Hometown</span>
            <strong className="text-white text-sm">{config.location}</strong>
          </div>
        </div>
      </section>

      {/* CONTACT DEVELOPER */}
      <section
        ref={contactSectionRef}
        className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4"
      >
        <h2 className="font-display text-xl font-bold text-white">📞 Contact Developer</h2>
        <p className="text-xs text-slate-400">
          Official developer channels for {config.developerName} ({config.creatorBrand} /{' '}
          {config.digitalBrand}). Empty fields are automatically hidden.
        </p>

        {hasAnyContact ? (
          <div className="flex flex-wrap gap-3 pt-2">
            {contact.DEVELOPER_EMAIL.trim() && (
              <a
                href={`mailto:${contact.DEVELOPER_EMAIL.trim()}`}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Mail className="w-4 h-4 text-amber-400" />
                📧 Email Developer
              </a>
            )}

            {contact.DEVELOPER_WHATSAPP.trim() && (
              <a
                href={`https://wa.me/${contact.DEVELOPER_WHATSAPP.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                💬 WhatsApp Developer
              </a>
            )}

            {contact.DEVELOPER_WEBSITE.trim() && (
              <a
                href={contact.DEVELOPER_WEBSITE.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                🌐 Website
              </a>
            )}

            {contact.DEVELOPER_INSTAGRAM.trim() && (
              <a
                href={contact.DEVELOPER_INSTAGRAM.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Instagram className="w-4 h-4 text-pink-400" />
                📸 Instagram
              </a>
            )}

            {contact.DEVELOPER_YOUTUBE.trim() && (
              <a
                href={contact.DEVELOPER_YOUTUBE.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Youtube className="w-4 h-4 text-red-500" />
                ▶️ YouTube
              </a>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              No external contact links are configured yet. Click &ldquo;Configure Contact Links&rdquo; to add your official Email, WhatsApp, Website, Instagram, or YouTube URLs.
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setDraft(config);
                setIsEditingConfig(true);
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-semibold whitespace-nowrap"
            >
              Configure Contact Links
            </button>
          </div>
        )}
      </section>

      {/* Section 53: Editable Developer Configuration Panel */}
      {isEditingConfig && (
        <form
          onSubmit={handleSaveConfig}
          className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-display text-lg font-bold text-amber-400">
              Developer Configuration Editor
            </h3>
            <span className="text-xs text-slate-400">Persisted Locally</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Game Name</label>
              <input
                type="text"
                value={draft.gameName}
                onChange={(e) => setDraft({ ...draft, gameName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Version</label>
              <input
                type="text"
                value={draft.version}
                onChange={(e) => setDraft({ ...draft, version: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Developer Name</label>
              <input
                type="text"
                value={draft.developerName}
                onChange={(e) => setDraft({ ...draft, developerName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Creator Brand</label>
              <input
                type="text"
                value={draft.creatorBrand}
                onChange={(e) => setDraft({ ...draft, creatorBrand: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Digital Development Brand</label>
              <input
                type="text"
                value={draft.digitalBrand}
                onChange={(e) => setDraft({ ...draft, digitalBrand: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Location</label>
              <input
                type="text"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
              />
            </div>
          </div>

          {/* Editable Contact Variables */}
          <div className="pt-2 border-t border-white/10">
            <h4 className="font-display font-bold text-sm text-white mb-3">
              Contact Variables (Leave empty to hide button)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">DEVELOPER_EMAIL</label>
                <input
                  type="email"
                  placeholder="e.g. yourname@example.com"
                  value={draft.contact.DEVELOPER_EMAIL}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      contact: { ...draft.contact, DEVELOPER_EMAIL: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">DEVELOPER_WHATSAPP</label>
                <input
                  type="text"
                  placeholder="e.g. +919876543210"
                  value={draft.contact.DEVELOPER_WHATSAPP}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      contact: { ...draft.contact, DEVELOPER_WHATSAPP: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">DEVELOPER_WEBSITE</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={draft.contact.DEVELOPER_WEBSITE}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      contact: { ...draft.contact, DEVELOPER_WEBSITE: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">DEVELOPER_INSTAGRAM</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={draft.contact.DEVELOPER_INSTAGRAM}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      contact: { ...draft.contact, DEVELOPER_INSTAGRAM: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">DEVELOPER_YOUTUBE</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={draft.contact.DEVELOPER_YOUTUBE}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      contact: { ...draft.contact, DEVELOPER_YOUTUBE: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          {/* Editable Ad Configuration */}
          <div className="pt-2 border-t border-white/10">
            <h4 className="font-display font-bold text-sm text-white mb-3">
              Ad Architecture Configuration (Default: Disabled)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  checked={draft.ads.ADS_ENABLED}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      ads: { ...draft.ads, ADS_ENABLED: e.target.checked },
                    })
                  }
                />
                <span>ADS_ENABLED</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  checked={draft.ads.BANNER_AD_ENABLED}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      ads: { ...draft.ads, BANNER_AD_ENABLED: e.target.checked },
                    })
                  }
                />
                <span>BANNER_AD</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  checked={draft.ads.INTERSTITIAL_AD_ENABLED}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      ads: { ...draft.ads, INTERSTITIAL_AD_ENABLED: e.target.checked },
                    })
                  }
                />
                <span>INTERSTITIAL</span>
              </label>

              <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-white/5">
                <input
                  type="checkbox"
                  checked={draft.ads.REWARDED_AD_ENABLED}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      ads: { ...draft.ads, REWARDED_AD_ENABLED: e.target.checked },
                    })
                  }
                />
                <span>REWARDED_AD</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Developer Configuration
          </button>
        </form>
      )}

      {/* Section 7: COPYRIGHT / CREDITS & LEGAL */}
      <section className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 text-xs text-slate-400 space-y-3">
        <div className="flex items-center gap-2 text-white font-display font-bold text-sm">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Game Credits — {config.gameName}</span>
        </div>
        <p>
          Developed by <strong className="text-slate-200">{config.developerName}</strong> · Creator:{' '}
          <strong className="text-slate-200">{config.creatorBrand}</strong> · Digital Development:{' '}
          <strong className="text-slate-200">{config.digitalBrand}</strong> · Location:{' '}
          {config.location} · Year: {config.year}
        </p>
        <p>
          © {config.year} {config.developerName}. All original game logic, progression systems, and custom designs are part of the BABU CAR RACING project. Third-party open-source libraries and fonts remain the property of their respective authors under their open licenses.
        </p>
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Privacy Policy
          </button>
          <button
            type="button"
            onClick={onOpenTerms}
            className="text-amber-400 hover:underline flex items-center gap-1 font-medium"
          >
            <FileText className="w-3.5 h-3.5" /> Terms of Use
          </button>
        </div>
      </section>
    </div>
  );
};
