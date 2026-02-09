const SITE_URL = 'https://www.lovelanguages.io';

/** Normalize any pathname to always have trailing slash */
export function normalizePathname(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

/** Build a full canonical URL with guaranteed trailing slash */
export function canonicalUrl(pathname: string): string {
  return `${SITE_URL}${normalizePathname(pathname)}`;
}

/** Build an article URL */
export function articleUrl(native: string, target: string, slug: string): string {
  return `/learn/${native}/${target}/${slug}/`;
}

/** Build a hub URL */
export function hubUrl(native: string, target?: string): string {
  return target ? `/learn/${native}/${target}/` : `/learn/${native}/`;
}
