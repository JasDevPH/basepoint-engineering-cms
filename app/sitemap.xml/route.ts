import { prisma } from "@/lib/prisma";

const BASE_URL = "https://www.basepointengineering.com";

const STATIC_PAGES = [
  "",
  "/checkout",
  "/paypal-checkout",
  "/order-confirmation",
  "/blogs",
  "/about-us",
  "/products",
  "/thank-you",
  "/contact-us",
];

function urlEntry(loc: string) {
  return `    <url>
        <loc>${loc}</loc>
    </url>`;
}

export async function GET() {
  // Fetch all blogs, products, and published services
  const [blogs, products, services] = await Promise.all([
    prisma.blog.findMany({ select: { slug: true } }),
    prisma.product.findMany({ select: { slug: true } }),
    prisma.service.findMany({ where: { published: true }, select: { slug: true } }),
  ]);

  const urls: string[] = [];

  // Static pages
  for (const page of STATIC_PAGES) {
    urls.push(urlEntry(`${BASE_URL}${page}`));
  }

  // Blog detail pages
  for (const blog of blogs) {
    urls.push(urlEntry(`${BASE_URL}/blog-detail?slug=${encodeURIComponent(blog.slug)}`));
  }

  // Product detail pages
  for (const product of products) {
    urls.push(urlEntry(`${BASE_URL}/product-detail?slug=${encodeURIComponent(product.slug)}`));
  }

  // Service detail pages
  for (const service of services) {
    urls.push(urlEntry(`${BASE_URL}/service-detail?slug=${encodeURIComponent(service.slug)}`));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
