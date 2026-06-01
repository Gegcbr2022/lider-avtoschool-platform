export type PublicRuntimeConfig = {
  siteUrl: string;
  appDomain: string;
  apiUrl: string;
};

export function getPublicRuntimeConfig(env: NodeJS.ProcessEnv = process.env): PublicRuntimeConfig {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const appDomain = env.APP_DOMAIN ?? new URL(siteUrl).host;

  return {
    siteUrl,
    appDomain,
    apiUrl: env.API_URL ?? "http://localhost:5001/lider-avtoschool/europe-west1/api"
  };
}

export const deploymentEnvironments = ["dev", "staging", "production"] as const;

export type DeploymentEnvironment = (typeof deploymentEnvironments)[number];
