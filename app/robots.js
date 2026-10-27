export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/tableau-de-bord', '/auth/'] }],
    sitemap: 'https://modelefinancier.com/sitemap.xml',
  };
}
