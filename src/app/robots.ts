import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/jobs/", "/settings", "/onboarding", "/api/", "/proposal/"],
      },
    ],
    sitemap: "https://groundwork-blush-eta.vercel.app/sitemap.xml",
  };
}
