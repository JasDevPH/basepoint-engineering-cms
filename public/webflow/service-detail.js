const API_URL = "https://cms.basepointengineering.com";

// ── Inject shimmer keyframes once ─────────
(function injectSkeletonStyles() {
  if (document.getElementById("skel-styles")) return;
  const style = document.createElement("style");
  style.id = "skel-styles";
  style.textContent =
    "@keyframes skel-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}";
  document.head.appendChild(style);
})();

// ── Helper ────────────────────────────────
function setMetaTag(property, content) {
  if (!content) return;
  let tag =
    document.querySelector('meta[property="' + property + '"]') ||
    document.querySelector('meta[name="' + property + '"]');
  if (!tag) {
    tag = document.createElement("meta");
    if (property.startsWith("og:")) tag.setAttribute("property", property);
    else tag.setAttribute("name", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

const SKEL = "linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)";
const SKEL_STYLE =
  "background:" +
  SKEL +
  ";background-size:200% 100%;animation:skel-shimmer 1.5s infinite;border-radius:6px;";

function skelBar(w, h, mb) {
  return (
    '<div style="height:' +
    h +
    ";width:" +
    w +
    ";" +
    SKEL_STYLE +
    "margin-bottom:" +
    (mb || "0.75rem") +
    ';"></div>'
  );
}

// ── Skeleton Loading ───────────────────────
function showSkeleton() {
  // Title
  const titleEl = document.querySelector('[data-service="title"]');
  if (titleEl) titleEl.innerHTML = skelBar("55%", "2.5rem", "0");

  // Excerpt
  const excerptEl = document.querySelector('[data-service="excerpt"]');
  if (excerptEl)
    excerptEl.innerHTML = skelBar("90%", "1rem") + skelBar("70%", "1rem", "0");

  // Breadcrumb
  const breadcrumbEl = document.querySelector('[data-service="breadcrumb"]');
  if (breadcrumbEl) breadcrumbEl.innerHTML = skelBar("30%", "1rem", "0");

  // Content
  const contentEl = document.querySelector('[data-service="content"]');
  if (contentEl) {
    let html = skelBar("45%", "2rem", "1.5rem");
    for (let i = 0; i < 4; i++) {
      html += skelBar(i % 2 === 0 ? "100%" : "82%", "1rem");
    }
    html +=
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:2rem;">';
    for (let i = 0; i < 4; i++) {
      html +=
        '<div style="padding:1.5rem;border:2px solid #e5e7eb;border-radius:16px;">' +
        '<div style="width:64px;height:64px;' +
        SKEL_STYLE +
        'border-radius:16px;margin-bottom:1rem;"></div>' +
        skelBar("65%", "1.25rem") +
        skelBar("100%", "0.875rem") +
        skelBar("80%", "0.875rem", "0") +
        "</div>";
    }
    html += "</div>";
    contentEl.innerHTML = html;
  }

  // Side nav
  const navContainer = document.querySelector('[data-service-nav="container"]');
  if (navContainer) {
    let navHtml =
      '<div style="padding:1.5rem;background:#f9fafb;border-radius:8px;">';
    navHtml += skelBar("55%", "1.125rem", "1rem");
    for (let i = 0; i < 4; i++) {
      navHtml +=
        '<div style="height:2.5rem;width:100%;' +
        SKEL_STYLE +
        'margin-bottom:0.5rem;border-radius:6px;"></div>';
    }
    navHtml += "</div>";
    navContainer.innerHTML = navHtml;
  }
}

// ── Google Fonts ──────────────────────────
function loadGoogleFonts() {
  if (!document.querySelector("#google-fonts-link")) {
    const link = document.createElement("link");
    link.id = "google-fonts-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;600&display=swap";
    document.head.appendChild(link);
  }
}

// ── Get slug ──────────────────────────────
function getSlugFromURL() {
  return new URLSearchParams(window.location.search).get("slug");
}

// ── Side navigation ───────────────────────
async function loadSideNavigation(currentSlug) {
  try {
    const response = await fetch(API_URL + "/api/services");
    const data = await response.json();
    if (data.success) displaySideNavigation(data.data, currentSlug);
  } catch (error) {
    console.error("Error loading navigation:", error);
  }
}

function displaySideNavigation(services, currentSlug) {
  let html =
    '<div class="side-nav"><div class="side-nav-title">Our Services</div>';
  services.forEach((service) => {
    const isActive = service.slug === currentSlug;
    const iconName = service.icon || "Briefcase";
    html +=
      '<a href="/service-detail?slug=' +
      service.slug +
      '" class="side-nav-item' +
      (isActive ? " active" : "") +
      '">';
    html +=
      '<span data-lucide="' +
      iconName.toLowerCase() +
      '" class="side-nav-icon"></span>';
    html += "<span>" + service.title + "</span></a>";
  });
  html += "</div>";

  const navContainer = document.querySelector('[data-service-nav="container"]');
  if (navContainer) navContainer.innerHTML = html;

  if (window.innerWidth <= 768) {
    const contentContainer = document.querySelector('[data-service="content"]');
    if (contentContainer && contentContainer.parentElement) {
      let mobileNav = document.getElementById("side-nav-mobile");
      if (!mobileNav) {
        mobileNav = document.createElement("div");
        mobileNav.id = "side-nav-mobile";
        mobileNav.className = "side-nav-mobile-container";
      }
      mobileNav.innerHTML = html;
      contentContainer.parentElement.appendChild(mobileNav);
    }
  }

  setTimeout(() => {
    if (window.lucide) window.lucide.createIcons();
  }, 100);
}

let resizeTimeout;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function () {
    const slug = getSlugFromURL();
    if (slug) loadSideNavigation(slug);
  }, 250);
});

// ── Load service detail ───────────────────
async function loadServiceDetail() {
  const slug = getSlugFromURL();
  if (!slug) {
    showError("No service specified");
    return;
  }

  // Show skeleton immediately — no spinner
  showSkeleton();

  try {
    const timestamp = new Date().getTime();
    const response = await fetch(
      API_URL + "/api/services/" + slug + "?_=" + timestamp,
    );
    const data = await response.json();

    if (data.success) {
      displayServiceDetail(data.data);
      loadSideNavigation(slug);
    } else {
      showError("Service not found");
    }
  } catch (error) {
    console.error("Error loading service:", error);
    showError("Failed to load service");
  }
}

// ── Display service ───────────────────────
function displayServiceDetail(service) {
  document.title = service.title + " - Basepoint Engineering";

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content =
    service.excerpt ||
    service.title +
      " — Basepoint Engineering services for below-the-hook lifting devices, CWB welding, structural inspection, and custom engineering.";

  setMetaTag("og:title", service.title + " - Basepoint Engineering");
  setMetaTag("twitter:title", service.title + " - Basepoint Engineering");
  setMetaTag("og:description", metaDesc.content);
  setMetaTag("twitter:description", metaDesc.content);
  setMetaTag("og:url", window.location.href);
  setMetaTag("og:type", "website");

  injectServiceBreadcrumb(service.title);

  const titleEl = document.querySelector('[data-service="title"]');
  if (titleEl) {
    titleEl.textContent = service.title;
    titleEl.style.fontFamily = "'Montserrat', sans-serif";
    titleEl.style.fontWeight = "700";
    titleEl.style.color = "#1e3a8a";
  }

  const excerptEl = document.querySelector('[data-service="excerpt"]');
  if (excerptEl && service.excerpt) {
    excerptEl.textContent = service.excerpt;
    excerptEl.style.fontFamily = "'Open Sans', sans-serif";
    excerptEl.style.fontSize = "1.125rem";
    excerptEl.style.lineHeight = "1.75";
    excerptEl.style.color = "#6b7280";
  }

  const contentEl = document.querySelector('[data-service="content"]');
  if (
    contentEl &&
    service.contentBlocks &&
    Array.isArray(service.contentBlocks)
  ) {
    contentEl.innerHTML = renderServiceContentBlocks(service.contentBlocks);
    setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
        document.querySelectorAll("[data-lucide]").forEach(function (element) {
          const iconName = element.getAttribute("data-lucide");
          if (iconName && window.lucide.icons[iconName]) {
            element.innerHTML = window.lucide.icons[iconName].toSvg({
              width: 36,
              height: 36,
              "stroke-width": 2,
              color: "#ffffff",
            });
          }
        });
      }
    }, 100);
  }
}

// ── Render content blocks ─────────────────
function renderServiceContentBlocks(blocks) {
  return blocks
    .map(function (block) {
      const spacing = block.spacing || 20;
      const baseStyle = "margin-bottom:" + spacing + "px;";

      switch (block.type) {
        case "heading":
          const level = block.level || "h2";
          const sizes = {
            h1: "2.5rem",
            h2: "2rem",
            h3: "1.5rem",
            h4: "1.25rem",
          };
          return (
            "<" +
            level +
            ' style="' +
            baseStyle +
            "font-family:'Montserrat',sans-serif;font-weight:bold;color:#1e3a8a;line-height:1.3;font-size:" +
            (sizes[level] || "2rem") +
            ';">' +
            block.content +
            "</" +
            level +
            ">"
          );

        case "paragraph":
          return (
            '<p style="' +
            baseStyle +
            "font-family:'Open Sans',sans-serif;line-height:1.75;font-size:1.125rem;color:#4b5563;" +
            '">' +
            block.content +
            "</p>"
          );

        case "bulletList":
          return (
            '<ul style="' +
            baseStyle +
            "font-family:'Open Sans',sans-serif;line-height:1.75;color:#4b5563;list-style-type:disc;padding-left:1.5rem;" +
            '">' +
            (block.items || [])
              .map((i) => '<li style="margin-bottom:0.5rem;">' + i + "</li>")
              .join("") +
            "</ul>"
          );

        case "numberedList":
          return (
            '<ol style="' +
            baseStyle +
            "font-family:'Open Sans',sans-serif;line-height:1.75;color:#4b5563;list-style-type:decimal;padding-left:1.5rem;" +
            '">' +
            (block.items || [])
              .map((i) => '<li style="margin-bottom:0.5rem;">' + i + "</li>")
              .join("") +
            "</ol>"
          );

        case "image":
          if (!block.url) return "";
          return (
            '<img src="' +
            block.url +
            "?t=" +
            new Date().getTime() +
            '" alt="' +
            (block.alt || "") +
            '" style="' +
            baseStyle +
            'max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);" />'
          );

        case "embed":
          if (!block.content) return "";
          return (
            '<div style="' +
            baseStyle +
            'max-width:100%;">' +
            block.content +
            "</div>"
          );

        case "divider":
          return (
            '<hr style="' +
            baseStyle +
            'border:0;border-top:2px solid #e5e7eb;margin-top:2rem;margin-bottom:2rem;" />'
          );

        case "columnList":
          const columns = block.columns || [];
          if (!columns.length) return "";
          const gridCols = ["1fr", "1fr 1fr", "1fr 1fr 1fr", "1fr 1fr 1fr 1fr"][
            Math.min(columns.length - 1, 3)
          ];
          let colHtml =
            '<div style="' +
            baseStyle +
            "display:grid;grid-template-columns:" +
            gridCols +
            ';gap:2rem;margin-top:1.5rem;">';
          columns.forEach((col) => {
            colHtml += "<div>";
            if (col.title)
              colHtml +=
                "<h4 style=\"font-family:'Montserrat',sans-serif;font-size:1.25rem;font-weight:bold;color:#1e3a8a;margin-bottom:1rem;\">" +
                col.title +
                "</h4>";
            if (col.items && col.items.length) {
              colHtml +=
                "<ul style=\"font-family:'Open Sans',sans-serif;line-height:1.75;color:#4b5563;list-style:none;padding:0;\">";
              col.items.forEach((item) => {
                colHtml +=
                  '<li style="display:flex;align-items:flex-start;gap:0.5rem;margin-bottom:0.75rem;"><span style="color:#00bcd4;font-size:1.25rem;line-height:1;">☑</span><span>' +
                  item +
                  "</span></li>";
              });
              colHtml += "</ul>";
            }
            colHtml += "</div>";
          });
          colHtml += "</div>";
          return colHtml;

        case "iconCards":
          const cards = block.cards || [];
          if (!cards.length) return "";
          let cardsHtml =
            '<div style="' +
            baseStyle +
            'display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:1.5rem;margin-top:1.5rem;">';
          cards.forEach((card) => {
            cardsHtml +=
              "<div style=\"padding:2rem;background:#fff;border-radius:16px;border:2px solid #e5e7eb;box-shadow:0 2px 4px rgba(0,0,0,0.05);transition:all 0.3s ease;\" onmouseover=\"this.style.transform='translateY(-4px)';this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)';this.style.borderColor='#00bcd4';\" onmouseout=\"this.style.transform='translateY(0)';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';this.style.borderColor='#e5e7eb';\">";
            cardsHtml +=
              '<div style="width:64px;height:64px;background:linear-gradient(135deg,#00bcd4,#1e3a8a);border-radius:16px;display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;padding:14px;">';
            cardsHtml +=
              '<i data-lucide="' +
              card.icon +
              '" style="width:36px;height:36px;color:#fff;stroke-width:2;"></i></div>';
            cardsHtml +=
              "<h3 style=\"font-family:'Montserrat',sans-serif;font-size:1.375rem;font-weight:bold;color:#1e3a8a;margin-bottom:0.75rem;line-height:1.3;\">" +
              card.title +
              "</h3>";
            cardsHtml +=
              "<p style=\"font-family:'Open Sans',sans-serif;color:#6b7280;line-height:1.7;font-size:1rem;\">" +
              card.description +
              "</p></div>";
          });
          cardsHtml += "</div>";
          return cardsHtml;

        default:
          return "";
      }
    })
    .join("");
}

// ── Breadcrumb ────────────────────────────
function injectServiceBreadcrumb(serviceTitle) {
  const target = document.querySelector('[data-service="breadcrumb"]');
  if (target) {
    target.innerHTML =
      '<nav class="bp-breadcrumb" aria-label="Breadcrumb">' +
      '<a href="https://basepointengineering.com">Home</a>' +
      '<span class="bp-separator">›</span>' +
      '<a href="https://basepointengineering.com/services">Services</a>' +
      '<span class="bp-separator">›</span>' +
      '<span class="bp-current">' +
      serviceTitle +
      "</span></nav>";
  }

  const existing = document.getElementById("bp-breadcrumb-schema");
  if (existing) existing.remove();

  const slug = getSlugFromURL();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "bp-breadcrumb-schema";
  script.textContent = JSON.stringify(
    {
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
        {
          "@type": "ListItem",
          position: 3,
          name: serviceTitle,
          item:
            "https://basepointengineering.com/service-detail?slug=" +
            encodeURIComponent(slug || ""),
        },
      ],
    },
    null,
    2,
  );
  document.head.appendChild(script);
}

// ── Error ─────────────────────────────────
function showError(message) {
  const contentEl = document.querySelector('[data-service="content"]');
  if (contentEl) {
    contentEl.innerHTML =
      '<div style="text-align:center;padding:3rem;">' +
      "<p style=\"color:#ef4444;font-size:1.25rem;font-family:'Open Sans',sans-serif;margin-bottom:1rem;\">" +
      message +
      "</p>" +
      '<a href="/" style="color:#3b82f6;text-decoration:underline;">← Back to Home</a></div>';
  }
}

// ── Canonical ─────────────────────────────
(function () {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (slug) {
    const canonicalUrl =
      "https://basepointengineering.com/service-detail?slug=" + slug;
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);
  }
})();

// ── Init ──────────────────────────────────
loadGoogleFonts();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadServiceDetail);
} else {
  loadServiceDetail();
}
