// Services Listing Page — injects cards, SEO tags, breadcrumb
const API_URL = 'https://cms.basepointengineering.com';

// SEO defaults (static, indexed by Google even without JS)
document.title = 'Engineering Services | Basepoint Engineering';

(function setStaticSEO() {
  var desc = 'Professional engineering services — custom design, structural inspection, lifting equipment, and CWB welding. PE-certified, Alberta, Canada.';
  var canonical = 'https://www.basepointengineering.com/services';

  var metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = desc;

  setMetaTag('og:title', 'Engineering Services | Basepoint Engineering');
  setMetaTag('twitter:title', 'Engineering Services | Basepoint Engineering');
  setMetaTag('og:description', desc);
  setMetaTag('twitter:description', desc);
  setMetaTag('og:url', canonical);
  setMetaTag('og:type', 'website');

  var link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonical;

  // Breadcrumb + JSON-LD
  injectBreadcrumb();
})();

function setMetaTag(property, content) {
  if (!content) return;
  var tag = document.querySelector('meta[property="' + property + '"]') || document.querySelector('meta[name="' + property + '"]');
  if (!tag) {
    tag = document.createElement('meta');
    if (property.indexOf('og:') === 0) tag.setAttribute('property', property);
    else tag.setAttribute('name', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function injectBreadcrumb() {
  var existing = document.querySelector('.bp-breadcrumb');
  if (existing) existing.remove();

  var html = '<nav class="bp-breadcrumb" aria-label="Breadcrumb">';
  html += '<a href="https://www.basepointengineering.com">Home</a>';
  html += '<span class="bp-separator">›</span>';
  html += '<span class="bp-current">Services</span>';
  html += '</nav>';

  var target = document.querySelector('[data-services="grid"]') || document.querySelector('main') || document.querySelector('.container');
  if (target) {
    target.insertAdjacentHTML('beforebegin', html);
  }

  var existingSchema = document.getElementById('bp-breadcrumb-schema');
  if (existingSchema) existingSchema.remove();

  var schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.basepointengineering.com" },
      { "@type": "ListItem", "position": 2, "name": "Services", "item": "https://www.basepointengineering.com/services" }
    ]
  };

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'bp-breadcrumb-schema';
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

// Icon name → Lucide icon mapping
var ICON_MAP = {
  'Settings': 'settings',
  'Glasses': 'glasses',
  'Forklift': 'truck',
  'Zap': 'zap',
  'Briefcase': 'briefcase',
  'Wrench': 'wrench',
  'Clipboard': 'clipboard-check',
  'HardHat': 'hard-hat',
  'Cog': 'cog',
  'Hammer': 'hammer',
  'Ruler': 'ruler',
  'PenTool': 'pen-tool'
};

function getLucideIcon(iconName) {
  return ICON_MAP[iconName] || 'briefcase';
}

async function loadServices() {
  var grid = document.querySelector('[data-services="grid"]');
  if (grid) grid.innerHTML = '<div class="svc-loading">Loading services...</div>';

  try {
    var res = await fetch(API_URL + '/api/services');
    var data = await res.json();

    if (data.success && data.data.length > 0) {
      displayServices(data.data);
    } else {
      if (grid) grid.innerHTML = '<p class="svc-error">No services available.</p>';
    }
  } catch (err) {
    console.error('Error loading services:', err);
    if (grid) grid.innerHTML = '<p class="svc-error">Failed to load services. Please try again.</p>';
  }
}

function displayServices(services) {
  var grid = document.querySelector('[data-services="grid"]');
  if (!grid) return;

  var html = '';
  services.forEach(function(svc) {
    var iconName = getLucideIcon(svc.icon);
    html += '<a href="/service-detail?slug=' + svc.slug + '" class="svc-card" title="' + svc.title + '">';
    html += '<div class="svc-card-icon">';
    html += '<i data-lucide="' + iconName + '" class="svc-icon"></i>';
    html += '</div>';
    html += '<div class="svc-card-body">';
    html += '<h3 class="svc-card-title">' + svc.title + '</h3>';
    html += '<p class="svc-card-excerpt">' + (svc.excerpt || '') + '</p>';
    html += '</div>';
    html += '<div class="svc-card-arrow">›</div>';
    html += '</a>';
  });

  grid.innerHTML = html;

  // Initialize Lucide icons
  if (window.lucide) {
    setTimeout(function() {
      window.lucide.createIcons();
    }, 50);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadServices);
} else {
  loadServices();
}
