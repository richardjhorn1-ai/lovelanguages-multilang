import React from 'react';
import { playRoleVar, type PlayColorRole } from '../../play/playColorRoles';

type StageLayout = 'hero' | 'compact';

interface GameStageProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  tone?: PlayColorRole;
  layout?: StageLayout;
  children: React.ReactNode;
  className?: string;
}

const stageStyles = (tone: PlayColorRole) => ({
  background: `
    radial-gradient(circle at top left, color-mix(in srgb, ${playRoleVar(tone, 'soft')} 66%, transparent), transparent 42%),
    linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 94%, transparent), var(--bg-card))
  `,
  border: playRoleVar(tone, 'border'),
  accent: playRoleVar(tone, 'deep'),
});

export const GameStage: React.FC<GameStageProps> = ({
  eyebrow,
  title,
  description,
  tone = 'blend',
  layout = 'hero',
  children,
  className = '',
}) => {
  const style = stageStyles(tone);
  const isCompact = layout === 'compact';

  return (
    <section
      className={`glass-card overflow-hidden relative ${
        isCompact ? 'rounded-[28px] p-4 md:p-6' : 'rounded-[32px] p-5 md:p-8'
      } ${className}`}
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
        ['--game-accent-color' as string]: playRoleVar(tone, 'color'),
        ['--game-accent-soft' as string]: playRoleVar(tone, 'soft'),
        ['--game-accent-mist' as string]: playRoleVar(tone, 'mist'),
        ['--game-accent-border' as string]: playRoleVar(tone, 'border'),
        ['--game-accent-deep' as string]: playRoleVar(tone, 'deep'),
        ['--game-accent-text' as string]: playRoleVar(tone, 'text'),
        ['--game-accent-shadow' as string]: `color-mix(in srgb, ${playRoleVar(tone, 'deep')} 24%, transparent)`,
      }}
    >
      <div
        className={`absolute inset-x-0 top-0 opacity-70 ${isCompact ? 'h-16' : 'h-28'}`}
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${playRoleVar(tone, 'mist')} 24%, transparent), transparent 88%)`,
        }}
      />

      <div className="relative z-10">
        {(eyebrow || title || description) && (
          <header className={isCompact ? 'mb-4 md:mb-5' : 'mb-6'}>
            {eyebrow && (
              <span
                className={`inline-flex items-center rounded-full font-black uppercase ${
                  isCompact
                    ? 'px-3 py-1 text-[9px] md:text-[10px] tracking-[0.18em]'
                    : 'px-3 py-1.5 text-[10px] md:text-xs tracking-[0.22em]'
                }`}
                style={{
                  background: `color-mix(in srgb, ${playRoleVar(tone, 'soft')} 82%, var(--bg-card))`,
                  color: style.accent,
                  border: `1px solid ${style.border}`,
                }}
              >
                {eyebrow}
              </span>
            )}
            {title && (
              <h2
                className={`font-black font-header text-[var(--text-primary)] tracking-tight ${
                  isCompact ? 'mt-3 text-xl md:text-2xl leading-tight' : 'mt-4 text-2xl md:text-3xl'
                }`}
              >
                {title}
              </h2>
            )}
            {description && !isCompact && (
              <p className="mt-2 text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </header>
        )}

        {children}
      </div>
    </section>
  );
};

export default GameStage;
