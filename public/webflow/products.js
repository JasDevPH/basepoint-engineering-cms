// Products Listing Page — dynamic JSON-LD CollectionPage schema
var PRODUCT_API = 'https://cms.basepointengineering.com';
var PAGE_CANONICAL = 'https://basepointengineering.com/products';
var PAGE_DESC = 'Pre-engineered manufacturing drawings for below-the-hook lifting devices. PE-stamped spreader bars, lifting beams, crane jibs, forklift attachments, and baskets. Basepoint Engineering.';

// ── SEO ────────────────────────────────────
document.title = 'Products | Basepoint Engineering';

(function setStaticSEO() {
  var metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
  metaDesc.content = PAGE_DESC;

  setMetaTag('og:title', 'Products | Basepoint Engineering');
  setMetaTag('twitter:title', 'Products | Basepoint Engineering');
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
    '<span class="bp-current">Products</span>' +
    '</nav>';

  var target = document.querySelector('[data-products="grid"]') || document.querySelector('.container') || document.querySelector('section');
  if (target && target.parentElement) {
    target.parentElement.insertBefore(wrapper, target);
  }
}

// ── Dynamic JSON-LD CollectionPage ─────────
async function injectProductSchema() {
  try {
    var res = await fetch(PRODUCT_API + '/api/products');
    var data = await res.json();
    if (!data.success || !data.data) return;

    var products = data.data;
    var hasPart = products.map(function(p) {
      return {
        "@type": "Product",
        "name": p.title,
        "description": p.excerpt || p.description || p.title,
        "url": "https://basepointengineering.com/product-detail?slug=" + encodeURIComponent(p.slug),
        "image": p.imageUrl || undefined,
        "category": p.category || undefined,
        "sku": p.slug,
        "brand": { "@type": "Brand", "name": "Basepoint Engineering" },
        "offers": p.basePrice ? {
          "@type": "Offer",
          "price": p.basePrice.toFixed(2),
          "priceCurrency": "CAD",
          "availability": "https://schema.org/InStock",
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": { "@type": "MonetaryAmount", "value": "0.00", "currency": "CAD" },
            "deliveryTime": { "@type": "ShippingDeliveryTime", "handlingTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 1, "unitCode": "DAY" }, "transitTime": { "@type": "QuantitativeValue", "minValue": 0, "maxValue": 0, "unitCode": "DAY" } }
          }
        } : undefined
      };
    });

    var schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Products",
      "description": PAGE_DESC,
      "url": PAGE_CANONICAL,
      "inLanguage": "en",
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://basepointengineering.com" },
          { "@type": "ListItem", "position": 2, "name": "Products", "item": PAGE_CANONICAL }
        ]
      },
      "about": {
        "@type": "Organization",
        "name": "Basepoint Engineering",
        "email": "info@basepointengineering.com",
        "telephone": "(877) 240-4149",
        "image": "https://cdn.prod.website-files.com/691b593e94604e4077935ec5/691c378f9ddfcd2a59257a10_Basepoint_logo_default.png",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "PO BOX 10426",
          "addressLocality": "Airdrie",
          "addressRegion": "AB",
          "postalCode": "T4A0H7",
          "addressCountry": "CA"
        },
        "logo": {
          "@type": "ImageObject",
          "url": "https://cdn.prod.website-files.com/691b593e94604e4077935ec5/691c378f9ddfcd2a59257a10_Basepoint_logo_default.png"
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

    console.log('✓ Product CollectionPage schema injected (' + products.length + ' products)');
  } catch (err) {
    console.error('Error injecting product schema:', err);
  }
}

// ── Init ───────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { injectProductSchema(); });
} else {
  injectProductSchema();
}
