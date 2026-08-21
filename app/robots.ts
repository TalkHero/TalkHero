import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://talk-hero.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/chat/",
          "/profile/",
          "/settings/",
          "/review/",
          "/vocabulary/",
          "/speaking/",
          "/assessment/",
          "/quests/",
          "/adventure/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
