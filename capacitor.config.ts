import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.talkhero.app',
  appName: 'TalkHero',
  webDir: 'public',

  server: {
      url: 'https://talk-hero.com/dashboard',
    cleartext: false,
  },

  android: {
    allowMixedContent: false,
  },
};

export default config;
