import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovelanguages.app',
  appName: 'Love Languages',
  webDir: 'out',
  // No server.url — app loads from bundled assets for offline support.
  // Next.js static export outputs to out/ (via `next export` or output: 'export').
  // External URLs (OAuth, Stripe, invites) use APP_URL constant in services/api-config.ts.
  ios: {
    // Prevent text size adjustment that can cause zoom
    preferredContentMode: 'mobile',
    // Scroll view configuration
    scrollEnabled: true,
    // Disable link previews (3D touch)
    allowsLinkPreview: false,
    // Keep navigation within WKWebView for app-bound domains
    // Requires WKAppBoundDomains in Info.plist
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;
