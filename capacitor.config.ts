import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: '{{BUNDLE_ID}}',
  appName: '{{APP_NAME}}',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '{{PRIMARY_COLOR}}',
      showSpinner: false,
    },
  },
}

export default config
