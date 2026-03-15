export type PlayColorRole = 'warm' | 'bright' | 'blend' | 'ink';

export type PlayColorToken = 'color' | 'soft' | 'mist' | 'border' | 'deep' | 'text';

export function playRoleVar(role: PlayColorRole, token: PlayColorToken): string {
  return `var(--play-${role}-${token})`;
}
