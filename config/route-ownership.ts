export type RouteOwner = 'spa' | 'astro' | 'static' | 'redirect';

export interface RouteOwnershipRule {
  pattern: string;
  owner: RouteOwner;
  indexable: boolean;
  notes?: string;
}

export const ROUTE_OWNERSHIP_RULES: RouteOwnershipRule[] = [
  { pattern: '/', owner: 'spa', indexable: true, notes: 'SPA shell homepage' },
  { pattern: '/learn/*', owner: 'astro', indexable: true },
  { pattern: '/compare/*', owner: 'astro', indexable: true },
  { pattern: '/tools/*', owner: 'astro', indexable: true },
  { pattern: '/dictionary/*', owner: 'astro', indexable: true },
  { pattern: '/support/', owner: 'astro', indexable: true, notes: 'Public support content page' },
  { pattern: '/api/*', owner: 'spa', indexable: false, notes: 'API surface' },
];

export const PWA_NAVIGATE_DENYLIST_PREFIXES = [
  '/learn',
  '/compare',
  '/tools',
  '/dictionary',
  '/support',
  '/api',
];
