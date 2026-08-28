import { prisma } from "@/lib/prisma";

// Matches the canonical domain used in every page's own <link rel="canonical">
// tag (public/webflow/*.js) — keep these in sync, a www/non-www mismatch
// between the sitemap and canonical tags is a real trust-signal problem.
const BASE_URL = "https://basepointengineering.com";

// Only real, indexable content pages. Transactional/utility pages
// (checkout, paypal-checkout, order-confirmation, thank-you) are deliberately
// excluded — they have no indexable content and dilute the sitemap's signal.
const STATIC_PAGES = ["", "/blogs", "/about-us", "/products", "/contact-us"];

function urlEntry(loc: string, lastmod?: Date, changefreq?: string) {
  return `    <url>
        <loc>${loc}</loc>${
          lastmod
            ? `
        <lastmod>${lastmod.toISOString().split("T")[0]}</lastmod>`
            : ""
        }${
          changefreq
            ? `
        <changefreq>${changefreq}</changefreq>`
            : ""
        }
    </url>`;
}

export async function GET() {
  // Fetch all blogs, products, and published services
  const [blogs, products, services] = await Promise.all([
    prisma.blog.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.service.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const urls: string[] = [];

  // Static pages
  for (const page of STATIC_PAGES) {
    urls.push(urlEntry(`${BASE_URL}${page}`, undefined, "monthly"));
  }

  // Blog detail pages
  for (const blog of blogs) {
    urls.push(
      urlEntry(
        `${BASE_URL}/blog-detail?slug=${encodeURIComponent(blog.slug)}`,
        blog.updatedAt,
        "weekly"
      )
    );
  }

  // Product detail pages
  for (const product of products) {
    urls.push(
      urlEntry(
        `${BASE_URL}/product-detail?slug=${encodeURIComponent(product.slug)}`,
        product.updatedAt,
        "weekly"
      )
    );
  }

  // Service detail pages
  for (const service of services) {
    urls.push(
      urlEntry(
        `${BASE_URL}/service-detail?slug=${encodeURIComponent(service.slug)}`,
        service.updatedAt,
        "weekly"
      )
    );
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
