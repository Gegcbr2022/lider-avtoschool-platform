import { getPublicRuntimeConfig } from "@lider/config";
import type { MetadataRoute } from "next";
import { contentPages } from "../lib/site-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getPublicRuntimeConfig();
  const now = new Date();

  return [
    {
      url: config.siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    ...contentPages.map((page) => ({
      url: `${config.siteUrl}/${page.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
