import { ExpoConfig } from 'expo/config';
import * as fs from 'fs';
import * as path from 'path';

// Check if google-services.json exists locally
const googleServicesPath = path.join(__dirname, 'google-services.json');
const hasGoogleServices = fs.existsSync(googleServicesPath);

const config: ExpoConfig = {
  name: "Skill Issue",
  slug: "skill-issue",
  version: "1.0.0",
  owner: "jmurphy786s-organization",
  orientation: "portrait",
  icon: "./assets/images/diamond.png",
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
    package: "com.jmurphy.skillissue.mobile",
    ...(hasGoogleServices && {
      googleServicesFile: "./google-services.json"
    })
  },
  web: {
    output: "static",
    favicon: "./assets/images/diamond.png"
  },
  plugins: [
    "expo-router",
    "expo-build-properties",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/diamond.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/images/diamond.png",
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
  ],
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
};

export default config;
