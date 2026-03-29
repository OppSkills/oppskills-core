/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://oppskills.com",
  generateRobotsTxt: true,
  sitemapSize: 7000,

  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }],
  },

  exclude: ["/api/*", "/dashboard/*"],
};
