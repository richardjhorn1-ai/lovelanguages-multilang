export interface PwaInstallEnvironment {
  hasInstallPrompt: boolean;
  isInstalled: boolean;
  isNativeApp: boolean;
  maxTouchPoints?: number;
  platform?: string;
  userAgent?: string;
}

export type PwaInstallMode =
  | 'installed'
  | 'prompt'
  | 'ios_safari_help'
  | 'ios_browser_help'
  | 'unavailable';

export function isStandaloneDisplayMode(win: Window): boolean {
  return win.matchMedia('(display-mode: standalone)').matches || (win.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function isIosLikeDevice(userAgent = '', platform = '', maxTouchPoints = 0): boolean {
  if (/iPad|iPhone|iPod/i.test(userAgent)) return true;
  return platform === 'MacIntel' && maxTouchPoints > 1;
}

export function isSafariBrowser(userAgent = ''): boolean {
  return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\//i.test(userAgent);
}

export function getPwaInstallMode(environment: PwaInstallEnvironment): PwaInstallMode {
  if (environment.isInstalled) return 'installed';
  if (environment.isNativeApp) return 'unavailable';
  if (environment.hasInstallPrompt) return 'prompt';

  const isIos = isIosLikeDevice(environment.userAgent, environment.platform, environment.maxTouchPoints);
  if (!isIos) return 'unavailable';

  return isSafariBrowser(environment.userAgent) ? 'ios_safari_help' : 'ios_browser_help';
}
