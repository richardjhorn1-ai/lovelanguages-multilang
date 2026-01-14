import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovelanguages.app',
  appName: 'Love Languages',
  webDir: 'dist',
  server: {
    // Load from production server so APIs work
    // For local dev, comment this out and run `vercel dev`
    url: 'https://lovelanguages.xyz',
    cleartext: false
  },
  ios: {
    // Prevent text size adjustment that can cause zoom
    preferredContentMode: 'mobile',
    // Scroll view configuration
    scrollEnabled: true,
    // Disable link previews (3D touch)
    allowsLinkPreview: false
  }
};

export default config;
