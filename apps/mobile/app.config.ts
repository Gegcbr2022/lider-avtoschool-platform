import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Автошкола Лідер",
  slug: "lider-avtoschool",
  scheme: "lider",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "ua.lider.avtoschool"
  },
  android: {
    package: "ua.lider.avtoschool",
    adaptiveIcon: {
      backgroundColor: "#004d40"
    }
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true
  },
  extra: {
    apiUrl: process.env.API_URL ?? "http://localhost:5001/lider-avtoschool-dev/europe-west1/api"
  }
};

export default config;
