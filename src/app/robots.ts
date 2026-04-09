import { siteConfig } from "@/lib/site";

import type { MetadataRoute } from "next";

/**
 * Returns the production crawl policy and sitemap location for search engines.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteConfig.liveUrl}/sitemap.xml`,
    host: siteConfig.liveUrl,
  };
}
