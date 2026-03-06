/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, CacheableResponsePlugin, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Google Fonts stylesheets — CacheFirst, 1 year
    {
      matcher: ({ url }) => url.origin === "https://fonts.googleapis.com",
      handler: new CacheFirst({
        cacheName: "google-fonts-cache",
        plugins: [
          new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
    },
    // Google Fonts files (woff2) — CacheFirst, 1 year
    {
      matcher: ({ url }) => url.origin === "https://fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "gstatic-fonts-cache",
        plugins: [
          new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
    },
    // Next.js default caching strategies for pages, assets, data
    ...defaultCache,
  ],
});

serwist.addEventListeners();
