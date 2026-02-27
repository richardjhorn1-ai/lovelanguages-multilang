import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovelanguages.app',
  appName: 'Love Languages',
  webDir: 'dist',
  server: {
    // Load from production server so APIs work
    // Use www. to avoid redirect which triggers Safari
    // TODO: This means no network = blank WebView (no offline support).
    // Future: bundle app locally (remove server.url), use absolute API URLs,
    // and add a service worker for offline caching.
    url: 'https://www.lovelanguages.io',
    cleartext: false
  },
  ios: {
    // Prevent text size adjustment that can cause zoom
    preferredContentMode: 'mobile',
    // Scroll view configuration
    scrollEnabled: true,
    // Disable link previews (3D touch)
    allowsLinkPreview: false,
    // Keep navigation within WKWebView for app-bound domains
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;
