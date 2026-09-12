/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://jet-validator-docs.vercel.app',
  generateRobotsTxt: true,
  outDir: 'public',
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/' }],
  },
}