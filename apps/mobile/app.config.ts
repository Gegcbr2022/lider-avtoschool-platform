import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Автошкола Лідер",
  slug: "lider-avtoschool",
  scheme: "lider",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/icon.png",
    resizeMode: "contain",
    backgroundColor: "#0d0d0d"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "ua.lider.avtoschool",
    icon: "./assets/icon.png"
  },
  android: {
    package: "ua.lider.avtoschool",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0d0d0d"
    }
  },
  plugins: ["expo-router", "expo-secure-store"],
  experiments: {
    typedRoutes: true
  },
  extra: {
    // Production Firebase Functions — lider-avtoschool project
    // For local emulator dev: set API_URL=http://10.0.2.2:5001/lider-avtoschool/europe-west1/api
    apiUrl: process.env.API_URL ?? "https://europe-west1-lider-avtoschool.cloudfunctions.net/api",
    eas: {
      projectId: "74bb8f9a-fc35-4016-b110-a17da4dcd31c"
    }
  }
};

export default config;
