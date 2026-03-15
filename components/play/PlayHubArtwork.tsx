import React from 'react';

export type PlayHubArtworkVariant =
  | 'flashcards'
  | 'multiple_choice'
  | 'type_it'
  | 'wordle'
  | 'speed_match'
  | 'quick_fire'
  | 'ai_challenge'
  | 'conversation'
  | 'verb_mastery'
  | 'love_notes'
  | 'word_gift';

interface PlayHubArtworkProps {
  variant: PlayHubArtworkVariant;
  className?: string;
  style?: React.CSSProperties;
}

const Grid = ({ children }: { children: React.ReactNode }) => (
  <>
    <rect x="10" y="10" width="92" height="92" rx="28" fill="currentColor" opacity="0.08" />
    <rect x="22" y="22" width="68" height="68" rx="22" fill="currentColor" opacity="0.08" />
    {children}
  </>
);

export const PlayHubArtwork: React.FC<PlayHubArtworkProps> = ({ variant, className = 'w-28 h-28', style }) => {
  return (
    <svg
      viewBox="0 0 112 112"
      aria-hidden="true"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === 'flashcards' && (
        <Grid>
          <rect x="30" y="34" width="38" height="26" rx="8" stroke="currentColor" strokeWidth="4" />
          <rect x="42" y="50" width="38" height="26" rx="8" stroke="currentColor" strokeWidth="4" opacity="0.75" />
          <path d="M39 47h20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
        </Grid>
      )}

      {variant === 'multiple_choice' && (
        <Grid>
          <circle cx="39" cy="39" r="9" stroke="currentColor" strokeWidth="4" />
          <path d="M34 39l3 3 7-7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M56 38h22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="39" cy="61" r="9" stroke="currentColor" strokeWidth="4" opacity="0.5" />
          <path d="M56 60h18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </Grid>
      )}

      {variant === 'type_it' && (
        <Grid>
          <rect x="28" y="38" width="56" height="34" rx="10" stroke="currentColor" strokeWidth="4" />
          <path d="M35 50h8M48 50h8M61 50h8M35 61h20M59 61h12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </Grid>
      )}

      {variant === 'wordle' && (
        <Grid>
          <rect x="28" y="32" width="18" height="18" rx="6" stroke="currentColor" strokeWidth="4" />
          <rect x="50" y="32" width="18" height="18" rx="6" fill="currentColor" opacity="0.16" stroke="currentColor" strokeWidth="4" />
          <rect x="72" y="32" width="18" height="18" rx="6" stroke="currentColor" strokeWidth="4" opacity="0.58" />
          <rect x="28" y="54" width="18" height="18" rx="6" stroke="currentColor" strokeWidth="4" opacity="0.58" />
          <rect x="50" y="54" width="18" height="18" rx="6" stroke="currentColor" strokeWidth="4" />
          <rect x="72" y="54" width="18" height="18" rx="6" fill="currentColor" opacity="0.22" stroke="currentColor" strokeWidth="4" />
          <path d="M34 41h6M57 63h4M78 63h6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </Grid>
      )}

      {variant === 'speed_match' && (
        <Grid>
          <path d="M32 44h24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M32 60h18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
          <circle cx="76" cy="44" r="12" stroke="currentColor" strokeWidth="4" />
          <path d="M76 38v6l4 3" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="60" y="62" width="28" height="18" rx="9" stroke="currentColor" strokeWidth="4" />
          <path d="M52 72h8M88 72h-2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </Grid>
      )}

      {variant === 'quick_fire' && (
        <Grid>
          <circle cx="56" cy="56" r="24" stroke="currentColor" strokeWidth="4" opacity="0.28" />
          <path d="M60 30L44 57h11l-2 21 15-25H57l3-23z" fill="currentColor" opacity="0.14" />
          <path d="M60 30L44 57h11l-2 21 15-25H57l3-23z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <path d="M56 20v8M83 29l-6 5M92 56h-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
        </Grid>
      )}

      {variant === 'ai_challenge' && (
        <Grid>
          <rect x="32" y="34" width="48" height="40" rx="14" stroke="currentColor" strokeWidth="4" />
          <path d="M42 54h8M54 54h8M66 54h4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M45 65h22" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
          <circle cx="56" cy="25" r="5" fill="currentColor" />
          <path d="M56 18v-4M56 32v4M49 25h-4M63 25h4" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
        </Grid>
      )}

      {variant === 'conversation' && (
        <Grid>
          <path d="M28 40c0-7 6-12 13-12h16c7 0 13 5 13 12v10c0 7-6 12-13 12H47l-9 8v-8h-1c-5 0-9-3-9-8V40z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <path d="M54 56c0-5 4-9 9-9h8c7 0 13 5 13 12v6c0 7-6 12-13 12h-4l-7 7v-7c-4-1-6-4-6-8V56z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" opacity="0.68" />
          <path d="M42 45h15M42 54h10M63 60h9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </Grid>
      )}

      {variant === 'verb_mastery' && (
        <Grid>
          <rect x="28" y="34" width="34" height="12" rx="6" stroke="currentColor" strokeWidth="4" />
          <rect x="28" y="52" width="42" height="12" rx="6" stroke="currentColor" strokeWidth="4" opacity="0.82" />
          <rect x="28" y="70" width="30" height="12" rx="6" stroke="currentColor" strokeWidth="4" opacity="0.66" />
          <circle cx="76" cy="43" r="8" stroke="currentColor" strokeWidth="4" />
          <path d="M72 43l3 3 5-6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 61h12M66 77h20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
        </Grid>
      )}

      {variant === 'love_notes' && (
        <Grid>
          <path d="M56 80s-22-13-22-31c0-8 6-14 14-14 4 0 7 2 8 5 1-3 4-5 8-5 8 0 14 6 14 14 0 18-22 31-22 31z" fill="currentColor" opacity="0.14" />
          <path d="M56 80s-22-13-22-31c0-8 6-14 14-14 4 0 7 2 8 5 1-3 4-5 8-5 8 0 14 6 14 14 0 18-22 31-22 31z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <path d="M41 56h30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        </Grid>
      )}

      {variant === 'word_gift' && (
        <Grid>
          <rect x="30" y="44" width="52" height="32" rx="8" stroke="currentColor" strokeWidth="4" />
          <path d="M30 52h52M56 44v32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M40 40c0-5 3-8 8-8 5 0 8 5 8 12-8 0-16 0-16-4zM72 40c0-5-3-8-8-8-5 0-8 5-8 12 8 0 16 0 16-4z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
        </Grid>
      )}
    </svg>
  );
};

export default PlayHubArtwork;
