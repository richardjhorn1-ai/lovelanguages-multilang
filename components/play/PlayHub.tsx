import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import PlayHubArtwork, { PlayHubArtworkVariant } from './PlayHubArtwork';
import { playRoleVar, type PlayColorRole } from './playColorRoles';

type ActionVariant = 'solid' | 'soft';

interface PlayHubAction {
  label: string;
  onClick: () => void;
  colorRole?: PlayColorRole;
  variant?: ActionVariant;
}

export interface PlayHubItem {
  id: string;
  title: string;
  description: string;
  meta?: string;
  badge?: string;
  eyebrow?: string;
  artwork: PlayHubArtworkVariant;
  colorRole: PlayColorRole;
  featured?: boolean;
  disabled?: boolean;
  onClick: () => void;
  onDisabledClick?: () => void;
}

interface PlayHubStat {
  label: string;
  value: string;
}

interface PlayHubProps {
  eyebrow: string;
  headline: string;
  description: string;
  heroArtwork: PlayHubArtworkVariant;
  primaryAction: PlayHubAction;
  secondaryAction?: PlayHubAction;
  stats: PlayHubStat[];
  soloItems: PlayHubItem[];
  sharedItems: PlayHubItem[];
  experimentalItems: PlayHubItem[];
}

interface RolePalette {
  border: string;
  overlay: string;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  eyebrow: string;
  badgeBg: string;
  badgeText: string;
  metaBg: string;
  metaText: string;
  actionBg: string;
  actionBorder: string;
  actionText: string;
  description: string;
  shadow: string;
}

const rolePalette = (role: PlayColorRole, featured: boolean): RolePalette => ({
  border: `color-mix(in srgb, ${playRoleVar(role, 'border')} ${featured ? '100%' : '88%'}, var(--border-color))`,
  overlay: `radial-gradient(circle at top left, color-mix(in srgb, ${playRoleVar(role, 'soft')} ${featured ? '78%' : '62%'}, transparent), transparent 58%)`,
  iconBg: `linear-gradient(145deg, color-mix(in srgb, ${playRoleVar(role, 'soft')} 78%, var(--bg-card)), color-mix(in srgb, ${playRoleVar(role, 'mist')} 54%, var(--bg-card)))`,
  iconBorder: `color-mix(in srgb, ${playRoleVar(role, 'border')} 92%, var(--border-color))`,
  iconColor: playRoleVar(role, 'deep'),
  eyebrow: playRoleVar(role, 'deep'),
  badgeBg: `color-mix(in srgb, ${playRoleVar(role, 'soft')} 86%, var(--bg-card))`,
  badgeText: playRoleVar(role, 'deep'),
  metaBg: `color-mix(in srgb, ${playRoleVar(role, 'soft')} 70%, var(--bg-card))`,
  metaText: playRoleVar(role, 'text'),
  actionBg: playRoleVar(role, 'color'),
  actionBorder: 'transparent',
  actionText: '#ffffff',
  description: `color-mix(in srgb, var(--text-secondary) 84%, ${playRoleVar(role, 'text')})`,
  shadow: `0 18px 36px -28px color-mix(in srgb, ${playRoleVar(role, 'deep')} 24%, transparent)`,
});

const actionStyleFor = (role: PlayColorRole, variant: ActionVariant) => ({
  background: variant === 'solid'
    ? playRoleVar(role, 'color')
    : `color-mix(in srgb, ${playRoleVar(role, 'soft')} 74%, var(--bg-card))`,
  border: variant === 'solid' ? 'transparent' : playRoleVar(role, 'border'),
  color: variant === 'solid' ? '#ffffff' : playRoleVar(role, 'text'),
  shadow: variant === 'solid'
    ? `0 16px 34px -22px color-mix(in srgb, ${playRoleVar(role, 'deep')} 30%, transparent)`
    : '0 10px 24px -22px rgba(41, 47, 54, 0.18)',
});

const ActionButton: React.FC<PlayHubAction> = ({
  label,
  onClick,
  colorRole = 'warm',
  variant = 'solid',
}) => {
  const style = actionStyleFor(colorRole, variant);

  return (
    <button
      onClick={onClick}
      className="w-full sm:w-auto min-h-[54px] px-5 py-3 rounded-2xl font-black font-header text-base md:text-lg tracking-tight text-center transition-all hover:-translate-y-0.5"
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
        boxShadow: style.shadow,
      }}
    >
      {label}
    </button>
  );
};

const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mb-4 md:mb-5">
    <div className="inline-flex items-center gap-2 mb-2">
      <span
        className="block w-8 h-[3px] rounded-full"
        style={{ background: `linear-gradient(90deg, ${playRoleVar('warm', 'color')}, ${playRoleVar('blend', 'color')})` }}
      />
      <h2 className="text-xl md:text-2xl font-black font-header text-[var(--text-primary)]">{title}</h2>
    </div>
    <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1">{description}</p>
  </div>
);

const PlayModeTile: React.FC<{ item: PlayHubItem }> = ({ item }) => {
  const { t } = useTranslation();
  const isFeatured = Boolean(item.featured);
  const palette = rolePalette(item.colorRole, isFeatured);
  const featureClass = isFeatured ? 'md:col-span-2 xl:col-span-2' : '';

  return (
    <button
      type="button"
      onClick={() => {
        if (item.disabled) {
          item.onDisabledClick?.();
          return;
        }
        item.onClick();
      }}
      aria-disabled={item.disabled}
      className={`group glass-card relative overflow-hidden rounded-[30px] p-4 md:p-5 text-left transition-all hover:shadow-card ${item.disabled ? 'opacity-45' : ''} ${featureClass}`}
      style={{
        border: `1px solid ${palette.border}`,
        boxShadow: palette.shadow,
        cursor: item.disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-75" style={{ background: palette.overlay }} />
      <div
        className="absolute inset-x-0 top-0 h-16 md:h-20 pointer-events-none opacity-60"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${playRoleVar(item.colorRole, 'mist')} 24%, transparent), transparent 88%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 rounded-[22px] flex items-center justify-center ${isFeatured ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-[4.5rem] md:h-[4.5rem]'}`}
            style={{
              background: palette.iconBg,
              border: `1px solid ${palette.iconBorder}`,
            }}
          >
            <PlayHubArtwork
              variant={item.artwork}
              className={isFeatured ? 'w-10 h-10 md:w-12 md:h-12' : 'w-8 h-8 md:w-9 md:h-9'}
              style={{ color: palette.iconColor }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {item.eyebrow && (
                <span
                  className="text-[10px] md:text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: palette.eyebrow }}
                >
                  {item.eyebrow}
                </span>
              )}
              {item.badge && (
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ background: palette.badgeBg, color: palette.badgeText }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <h3
              className={`font-black font-header text-[var(--text-primary)] tracking-[-0.03em] ${isFeatured ? 'text-[2.05rem] md:text-[2.35rem] leading-[0.95]' : 'text-[1.65rem] md:text-[1.85rem] leading-[0.97]'}`}
              style={{ textWrap: 'balance' }}
            >
              {item.title}
            </h3>
          </div>
        </div>

        <p
          className={`mt-4 ${isFeatured ? 'max-w-[36rem] text-lg md:text-[1.15rem] leading-[1.55]' : 'max-w-[24rem] text-base md:text-lg leading-[1.55]'}`}
          style={{ color: palette.description }}
        >
          {item.description}
        </p>

        <div className={`mt-auto pt-5 flex items-end gap-3 ${isFeatured ? 'md:pt-6' : ''}`}>
          {item.meta && (
            <span
              className="inline-flex min-w-0 max-w-full items-center justify-center rounded-full px-3.5 py-2 text-sm md:text-base font-bold text-center leading-tight"
              style={{ background: palette.metaBg, color: palette.metaText }}
            >
              {item.meta}
            </span>
          )}

          <span
            className="ml-auto shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm md:text-base font-black font-header transition-transform group-hover:translate-x-0.5"
            style={{
              background: palette.actionBg,
              border: `1px solid ${palette.actionBorder}`,
              color: palette.actionText,
            }}
          >
            {t('play.hub.openLabel')}
            <ICONS.ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </button>
  );
};

export const PlayHub: React.FC<PlayHubProps> = ({
  eyebrow,
  headline,
  description,
  heroArtwork,
  primaryAction,
  secondaryAction,
  stats,
  soloItems,
  sharedItems,
  experimentalItems,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <section
        className="glass-card rounded-[32px] p-5 md:p-6 xl:p-7 overflow-hidden relative mb-7"
        style={{ border: `1px solid ${playRoleVar('blend', 'border')}` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at top left, color-mix(in srgb, ${playRoleVar('warm', 'soft')} 72%, transparent), transparent 42%),
              radial-gradient(circle at bottom right, color-mix(in srgb, ${playRoleVar('bright', 'soft')} 72%, transparent), transparent 38%)
            `,
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-20 md:h-24 opacity-55"
          style={{
            background: `linear-gradient(180deg, color-mix(in srgb, ${playRoleVar('blend', 'mist')} 22%, transparent), transparent 92%)`,
          }}
        />

        <div className="relative z-10 grid xl:grid-cols-[1.25fr_0.72fr] gap-5 md:gap-6 items-center">
          <div>
            <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.28em]" style={{ color: playRoleVar('warm', 'deep') }}>
              {eyebrow}
            </span>
            <h1
              className="font-black font-header text-[var(--text-primary)] tracking-[-0.045em] leading-[0.94] mt-2.5 mb-2.5 max-w-[9.2ch] md:max-w-[10.4ch] text-[clamp(2.5rem,10vw,4rem)] xl:text-[clamp(3.6rem,4.6vw,4.8rem)]"
              style={{ textWrap: 'balance' }}
            >
              {headline}
            </h1>
            <p className="text-base md:text-[1.02rem] text-[var(--text-secondary)] leading-relaxed max-w-xl">
              {description}
            </p>

            <div className="grid gap-3 sm:flex sm:flex-wrap mt-5 max-w-xl">
              <ActionButton
                {...primaryAction}
                colorRole={primaryAction.colorRole || 'warm'}
                variant={primaryAction.variant || 'solid'}
              />
              {secondaryAction && (
                <ActionButton
                  {...secondaryAction}
                  colorRole={secondaryAction.colorRole || 'ink'}
                  variant={secondaryAction.variant || 'soft'}
                />
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 md:mt-6">
              {stats.map((stat, index) => {
                const role = (['warm', 'bright', 'blend', 'ink'] as const)[index % 4];
                return (
                  <div
                    key={stat.label}
                    className="glass-card rounded-2xl px-4 py-3"
                    style={{
                      border: `1px solid ${playRoleVar(role, 'border')}`,
                      boxShadow: `0 12px 28px -28px color-mix(in srgb, ${playRoleVar(role, 'deep')} 26%, transparent)`,
                    }}
                  >
                    <div className="text-xl md:text-2xl font-black font-header text-[var(--text-primary)]">{stat.value}</div>
                    <div
                      className="text-[11px] md:text-xs uppercase tracking-[0.18em] font-bold mt-1"
                      style={{ color: playRoleVar(role, 'deep') }}
                    >
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden xl:flex justify-end pr-2" style={{ color: playRoleVar(heroArtwork === 'word_gift' ? 'bright' : 'blend', 'color') }}>
            <div
              className="rounded-[28px] p-5"
              style={{
                background: `linear-gradient(145deg, color-mix(in srgb, ${playRoleVar('blend', 'soft')} 74%, var(--bg-card)), color-mix(in srgb, ${playRoleVar('bright', 'soft')} 52%, var(--bg-card)))`,
                border: `1px solid ${playRoleVar('blend', 'border')}`,
              }}
            >
              <PlayHubArtwork variant={heroArtwork} className="w-48 h-48" />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <SectionHeader
          title={t('play.hub.sectionSoloTitle')}
          description={t('play.hub.sectionSoloCopy')}
        />
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {soloItems.map((item) => <PlayModeTile key={item.id} item={item} />)}
        </div>
      </section>

      <section className="mb-10">
        <SectionHeader
          title={t('play.hub.sectionSharedTitle')}
          description={t('play.hub.sectionSharedCopy')}
        />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sharedItems.map((item) => <PlayModeTile key={item.id} item={item} />)}
        </div>
      </section>

      <section className="pb-2">
        <SectionHeader
          title={t('play.hub.sectionExperimentalTitle')}
          description={t('play.hub.sectionExperimentalCopy')}
        />
        <div className="grid md:grid-cols-2 gap-4">
          {experimentalItems.map((item) => <PlayModeTile key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  );
};

export default PlayHub;
