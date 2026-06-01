import { getPublicRuntimeConfig } from "@lider/config";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const config = getPublicRuntimeConfig();

  return {
    rules: {
      userAgent: "*",
      allow: "/"
    },
    sitemap: `${config.siteUrl}/sitemap.xml`
  };
}
