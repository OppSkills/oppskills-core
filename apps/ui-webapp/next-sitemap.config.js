/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://oppskills.com",
  generateRobotsTxt: true,
  sitemapSize: 7000,

  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }],
  },

  exclude: ["/api/*", "/dashboard/*"],
};
