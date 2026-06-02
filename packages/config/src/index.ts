export type PublicRuntimeConfig = {
  siteUrl: string;
  appDomain: string;
  apiUrl: string;
};

export function getPublicRuntimeConfig(env: NodeJS.ProcessEnv = process.env): PublicRuntimeConfig {
  const rawSiteUrl = env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl = normalizeSiteUrl(rawSiteUrl || "http://localhost:3000");
  const rawAppDomain = env.APP_DOMAIN?.trim();
  const appDomain = rawAppDomain || new URL(siteUrl).host;

  return {
    siteUrl,
    appDomain,
    apiUrl: env.API_URL?.trim() || "http://localhost:5001/lider-avtoschool-dev/europe-west1/api"
  };
}

function normalizeSiteUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export const deploymentEnvironments = ["dev", "staging", "production"] as const;

export type DeploymentEnvironment = (typeof deploymentEnvironments)[number];
