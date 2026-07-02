import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/client",
        "/login",
        "/register",
        "/confirm-email",
        "/forgot-password",
        "/reset-password",
        "/api",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
