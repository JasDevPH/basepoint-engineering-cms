// Blogs Listing Page — dynamic JSON-LD CollectionPage schema
var BLOG_API = 'https://cms.basepointengineering.com';

// ── SEO ────────────────────────────────────
document.title = 'Blogs | Basepoint Engineering';
var PAGE_CANONICAL = 'https://basepointengineering.com/blogs';
var PAGE_DESC = 'Industry insights, tips, and updates from Basepoint Engineering — lifting equipment, below-the-hook devices, ASME standards, and engineering best practices.';

(function setStaticSEO() {
  var metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
  metaDesc.content = PAGE_DESC;

  setMetaTag('og:title', 'Blogs | Basepoint Engineering');
  setMetaTag('twitter:title', 'Blogs | Basepoint Engineering');
  setMetaTag('og:description', PAGE_DESC);
  setMetaTag('twitter:description', PAGE_DESC);
  setMetaTag('og:url', PAGE_CANONICAL);
  setMetaTag('og:type', 'website');

  var link = document.querySelector("link[rel='canonical']");
  if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
  link.href = PAGE_CANONICAL;

  injectBreadcrumb();
})();

function setMetaTag(property, content) {
  if (!content) return;
  var tag = document.querySelector('meta[property="' + property + '"]') || document.querySelector('meta[name="' + property + '"]');
  if (!tag) { tag = document.createElement('meta'); if (property.indexOf('og:') === 0) tag.setAttribute('property', property); else tag.setAttribute('name', property); document.head.appendChild(tag); }
  tag.setAttribute('content', content);
}

// ── Breadcrumb ────────────────────────────
function injectBreadcrumb() {
  var existing = document.querySelector('.bp-breadcrumb-wrapper');
  if (existing) existing.remove();

  var wrapper = document.createElement('div');
  wrapper.className = 'bp-breadcrumb-wrapper';
  wrapper.innerHTML = '<nav class="bp-breadcrumb" aria-label="Breadcrumb">' +
    '<a href="https://basepointengineering.com">Home</a>' +
    '<span class="bp-separator">›</span>' +
    '<span class="bp-current">Blogs</span>' +
    '</nav>';

  var target = document.querySelector('[data-blogs="grid"]') || document.querySelector('.container') || document.querySelector('section');
  if (target && target.parentElement) {
    target.parentElement.insertBefore(wrapper, target);
  }
}

// ── Dynamic JSON-LD CollectionPage ─────────
async function injectBlogSchema() {
  try {
    var res = await fetch(BLOG_API + '/api/blogs');
    var data = await res.json();
    if (!data.success || !data.data) return;

    var posts = data.data;
    var hasPart = posts.map(function(post) {
      return {
        "@type": "BlogPosting",
        "headline": post.title,
        "url": "https://basepointengineering.com/blog-detail?slug=" + encodeURIComponent(post.slug),
        "datePublished": post.publishedAt || undefined,
        "author": post.author ? { "@type": "Person", "name": post.author } : undefined,
        "image": post.imageUrl || undefined,
        "inLanguage": "en"
      };
    });

    var schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Blogs",
      "description": PAGE_DESC,
      "url": PAGE_CANONICAL,
      "inLanguage": "en",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://basepointengineering.com" },
          { "@type": "ListItem", "position": 2, "name": "Blogs", "item": PAGE_CANONICAL }
        ]
      },
      "about": {
        "@type": "Organization",
        "name": "Basepoint Engineering",
        "email": "info@basepointengineering.com",
        "telephone": "(877) 240-4149",
        "address": {
          "@type": "PostalAddress",
          "postOfficeBoxNumber": "10426",
          "addressLocality": "Airdrie",
          "addressRegion": "AB",
          "postalCode": "T4A0H7",
          "addressCountry": "CA"
        }
      },
      "hasPart": hasPart
    };

    var s = document.getElementById('bp-collection-schema');
    if (s) s.remove();
    s = document.createElement('script');
    s.type = 'application/ld+json';
    s.id = 'bp-collection-schema';
    s.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(s);

    console.log('✓ Blog CollectionPage schema injected (' + posts.length + ' posts)');
  } catch (err) {
    console.error('Error injecting blog schema:', err);
  }
}

// ── Prerender.io / Cloudflare Worker readiness contract ──
window.prerenderReady = false;
setTimeout(function () {
  window.prerenderReady = true;
}, 5000);

// ── Init ───────────────────────────────────
function initBlogsPage() {
  injectBlogSchema().finally(function () {
    window.prerenderReady = true;
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogsPage);
} else {
  initBlogsPage();
}
