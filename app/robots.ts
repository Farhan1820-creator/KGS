import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thelearnexacademy.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/icon.png",
          "/logo.png",
          "/manifest.webmanifest",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/students",
          "/students/*",
          "/teachers",
          "/teachers/*",
          "/payroll",
          "/payroll/*",
          "/accounts",
          "/accounts/*",
          "/settings",
          "/settings/*",
          "/tasks",
          "/tasks/*",
          "/diary",
          "/diary/*",
          "/api",
          "/api/*",
          "/onboarding",
          "/onboarding/*",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/"],
        disallow: ["/api/*", "/dashboard/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
