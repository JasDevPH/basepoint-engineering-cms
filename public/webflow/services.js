// Services Listing Page
var API_URL = "https://cms.basepointengineering.com";

// ── SEO ────────────────────────────────────
document.title = "Engineering Services | Basepoint Engineering";

(function setStaticSEO() {
  var desc =
    "Professional engineering services — custom design, structural inspection, lifting equipment, and CWB welding. PE-certified, Alberta, Canada.";
  var canonical = "https://basepointengineering.com/services";

  var metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = desc;

  setMetaTag("og:title", "Engineering Services | Basepoint Engineering");
  setMetaTag("twitter:title", "Engineering Services | Basepoint Engineering");
  setMetaTag("og:description", desc);
  setMetaTag("twitter:description", desc);
  setMetaTag("og:url", canonical);
  setMetaTag("og:type", "website");

  var link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = canonical;
})();

function setMetaTag(property, content) {
  if (!content) return;
  var tag =
    document.querySelector('meta[property="' + property + '"]') ||
    document.querySelector('meta[name="' + property + '"]');
  if (!tag) {
    tag = document.createElement("meta");
    if (property.indexOf("og:") === 0) tag.setAttribute("property", property);
    else tag.setAttribute("name", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

// ── Fix wrapper layout via JS (overrides Webflow inline styles) ────
function fixLayout() {
  var wrapper = document.querySelector(".div-block-15");
  if (wrapper) {
    wrapper.style.cssText =
      "max-width:100% !important; width:100% !important; padding:0 !important; margin:0 !important; background:#f3f4f6 !important; display:block !important;";
  }
  var grid = document.querySelector('[data-services="grid"]');
  if (grid) {
    grid.style.cssText =
      "display:grid !important; grid-template-columns:repeat(2,1fr) !important; gap:1.5rem !important; padding:2rem !important; width:100% !important; max-width:1200px !important; margin:0 auto !important; box-sizing:border-box !important; background:transparent !important;";
  }
}

// ── Breadcrumb ────────────────────────────
function injectBreadcrumb() {
  var existing = document.querySelector(".bp-breadcrumb-wrapper");
  if (existing) existing.remove();

  var wrapper = document.createElement("div");
  wrapper.className = "bp-breadcrumb-wrapper";
  wrapper.style.cssText =
    "background:#f3f4f6; padding:12px 2rem; border-bottom:1px solid #e5e7eb; width:100%; box-sizing:border-box;";
  wrapper.innerHTML =
    '<nav class="bp-breadcrumb" aria-label="Breadcrumb" style="display:flex;align-items:center;gap:8px;font-family:Open Sans,sans-serif;font-size:14px;color:#6b7280;max-width:1200px;margin:0 auto;">' +
    '<a href="https://basepointengineering.com" style="color:#6b7280;text-decoration:none;">Home</a>' +
    '<span style="color:#d1d5db;font-size:12px;">›</span>' +
    '<span style="color:#111827;font-weight:500;">Services</span>' +
    "</nav>";

  var grid = document.querySelector('[data-services="grid"]');
  if (grid && grid.parentElement) {
    grid.parentElement.insertBefore(wrapper, grid);
  }

  // JSON-LD schema
  var s = document.getElementById("bp-breadcrumb-schema");
  if (s) s.remove();
  s = document.createElement("script");
  s.type = "application/ld+json";
  s.id = "bp-breadcrumb-schema";
  s.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://basepointengineering.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Services",
        item: "https://basepointengineering.com/services",
      },
    ],
  });
  document.head.appendChild(s);
}

// ── Icon mapping ───────────────────────────
var ICON_MAP = {
  Settings: "settings",
  Glasses: "glasses",
  Forklift: "truck",
  Zap: "zap",
  Briefcase: "briefcase",
  Wrench: "wrench",
  Clipboard: "clipboard-check",
  HardHat: "hard-hat",
  Cog: "cog",
  Hammer: "hammer",
  Ruler: "ruler",
  PenTool: "pen-tool",
};
function getIcon(name) {
  return ICON_MAP[name] || "briefcase";
}

// ── Skeleton ───────────────────────────────
function showSkeleton(grid) {
  var count = window.innerWidth <= 768 ? 2 : 4;
  var h = "";
  for (var i = 0; i < count; i++) {
    h +=
      '<div class="svc-card svc-skeleton">' +
      '<div class="svc-card-icon skel-shimmer"></div>' +
      '<div class="svc-card-body">' +
      '<div class="skel-line skel-line-title skel-shimmer"></div>' +
      '<div class="skel-line skel-shimmer"></div>' +
      '<div class="skel-line skel-line-short skel-shimmer"></div>' +
      "</div>" +
      '<div class="svc-card-arrow skel-shimmer" style="width:20px;height:20px;border-radius:50%;"></div>' +
      "</div>";
  }
  grid.innerHTML = h;
}

// ── Load ───────────────────────────────────
async function loadServices() {
  var grid = document.querySelector('[data-services="grid"]');
  if (grid) showSkeleton(grid);

  try {
    var res = await fetch(API_URL + "/api/services");
    var data = await res.json();
    if (data.success && data.data.length > 0) {
      displayServices(data.data);
    } else {
      if (grid)
        grid.innerHTML = '<p class="svc-error">No services available.</p>';
    }
  } catch (err) {
    console.error("Error loading services:", err);
    if (grid)
      grid.innerHTML = '<p class="svc-error">Failed to load services.</p>';
  }
}

// ── Display — uses onclick instead of <a> to bypass Webflow click interceptor ──
function displayServices(services) {
  var grid = document.querySelector('[data-services="grid"]');
  if (!grid) return;

  grid.innerHTML = services
    .map(function (svc) {
      var icon = getIcon(svc.icon);
      return (
        '<div class="svc-card" onclick="window.location.href=\'/service-detail?slug=' +
        svc.slug +
        '\'" style="cursor:pointer;" title="' +
        svc.title +
        '">' +
        '<div class="svc-card-icon"><i data-lucide="' +
        icon +
        '" class="svc-icon"></i></div>' +
        '<div class="svc-card-body">' +
        '<h3 class="svc-card-title">' +
        svc.title +
        "</h3>" +
        '<p class="svc-card-excerpt">' +
        (svc.excerpt || "") +
        "</p>" +
        "</div>" +
        '<div class="svc-card-arrow">›</div>' +
        "</div>"
      );
    })
    .join("");

  if (window.lucide) {
    setTimeout(function () {
      window.lucide.createIcons();
    }, 50);
  }

  // Re-apply layout after cards are injected
  fixLayout();
}

// ── Init ───────────────────────────────────
injectBreadcrumb();
fixLayout();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    loadServices();
    fixLayout();
  });
} else {
  loadServices();
}
