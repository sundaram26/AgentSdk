import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://weave.sundaramsingh.com/sitemap.xml',
    host: 'https://weave.sundaramsingh.com',
  };
}
