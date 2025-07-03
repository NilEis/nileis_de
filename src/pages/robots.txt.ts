import type {APIRoute} from 'astro';

const text = (sitemapURL: URL) => `\
User-agent: *
Disallow: /admin/
Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({site}) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(text(sitemapURL));
};