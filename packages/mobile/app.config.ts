import { ExpoConfig } from 'expo/config';

const config = {
  name: "Skill Issue",
  slug: "skill-issue",
  version: "1.0.0",
  owner: "jmurphy786s-organization",
  orientation: "portrait",
  icon: "./assets/images/play_store.png",
  scheme: "mobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.anonymous.mobile"
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/images/play_store.png"
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    package: "com.jmurphy.skillissue.mobile",
  },
  web: {
    output: "static",
    favicon: "./assets/images/play_store.png",
  },
  plugins: [
    "expo-router",
    "expo-build-properties",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/play_store.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/images/play_store.png",
          backgroundColor: "#ffffff"
        }
      }
    ],
    [
      "expo-notifications",
      {
        color: "#ffffff",
        defaultChannel: "default"
      }
    ]
  ] as const,
  experiments: {
    typedRoutes: true,
    reactCompiler: true
  },
  extra: {
    router: {},
    eas: {
      projectId: "b302dea4-1c3f-42d5-bd5f-eca4acebea90"
    },
    // Environment variables from EAS (using $VAR syntax in eas.json)
    clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    backendUrl: process.env.BACKEND_URL,
    apiBearerToken: process.env.API_BEARER_TOKEN,
  }
} satisfies ExpoConfig;

export default config;
