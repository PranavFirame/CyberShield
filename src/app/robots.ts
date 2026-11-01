import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cybershield.dev";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/*", "/faq", "/sitemap", "/legal/*"],
        disallow: [
          "/api/",
          "/admin/",
          "/api/*",
          "/admin/*",
          "/*?scanId=*",
          "/app/",
          "/app/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
