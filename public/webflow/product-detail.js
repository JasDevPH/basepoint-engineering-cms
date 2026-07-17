// FILE: public/webflow/product-detail.js
const API_URL = "https://cms.basepointengineering.com";

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

let allVariants = [];
let selectedVariant = null;
let currentPage = 1;
const itemsPerPage = 10;
let currentProductStripePaymentLink = null;

// ── Skeleton helpers ──────────────────────
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

// ── Replace the showSkeleton function in product-detail.js with this ──

function showSkeleton() {
  const SKEL_S =
    "background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:200% 100%;animation:skel-shimmer 1.5s infinite;border-radius:6px;";

  function bar(w, h, mb) {
    return (
      '<div style="height:' +
      h +
      ";width:" +
      w +
      ";" +
      SKEL_S +
      "margin-bottom:" +
      (mb || "0.75rem") +
      ';display:block;"></div>'
    );
  }

  // ── Side nav skeleton — full panel with category rows ──
  const navContainer = document.querySelector('[data-product-nav="container"]');
  if (navContainer) {
    let navHtml =
      '<div style="padding:1.5rem;background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">';
    // 6 category rows with expand arrows
    for (let i = 0; i < 6; i++) {
      navHtml +=
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;margin-bottom:0.5rem;">' +
        '<div style="height:0.875rem;width:' +
        (i % 2 === 0 ? "55%" : "45%") +
        ";" +
        SKEL_S +
        '"></div>' +
        '<div style="height:0.75rem;width:12px;' +
        SKEL_S +
        '"></div>' +
        "</div>";
      // Show sub-items for first category
      if (i === 0) {
        navHtml +=
          '<div style="padding-left:0.75rem;margin-bottom:0.5rem;">' +
          '<div style="height:2rem;width:100%;background:#3b82f6;border-radius:4px;opacity:0.3;margin-bottom:0.25rem;"></div>' +
          bar("80%", "1.75rem", "0.25rem") +
          "</div>";
      }
    }
    navHtml += "</div>";
    navContainer.innerHTML = navHtml;
  }

  // ── Image skeleton — large square like actual product image ──
  const imgEl = document.querySelector('[data-product-detail="image"]');
  if (imgEl) {
    imgEl.style.cssText =
      "width:100%;height:450px;" + SKEL_S + "border-radius:8px;display:block;";
    imgEl.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }

  // ── Title skeleton ──
  const titleEl = document.querySelector('[data-product-detail="title"]');
  if (titleEl) {
    titleEl.innerHTML = bar("55%", "2.25rem", "0.5rem");
    titleEl.style.display = "block";
  }

  // ── Category badge skeleton ──
  const catEl = document.querySelector('[data-product-detail="category"]');
  if (catEl) {
    catEl.innerHTML =
      '<div style="height:1.5rem;width:100px;' +
      SKEL_S +
      'border-radius:9999px;display:inline-block;"></div>';
  }

  // ── Breadcrumb skeleton ──
  const contentTarget = document.querySelector(
    '[data-product-detail="content"]',
  );
  if (contentTarget && contentTarget.parentElement) {
    let existingSkel = document.getElementById("breadcrumb-skel");
    if (!existingSkel) {
      existingSkel = document.createElement("div");
      existingSkel.id = "breadcrumb-skel";
      existingSkel.style.marginBottom = "1rem";
      existingSkel.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div style="height:0.875rem;width:40px;' +
        SKEL_S +
        '"></div>' +
        '<div style="height:0.875rem;width:8px;' +
        SKEL_S +
        '"></div>' +
        '<div style="height:0.875rem;width:60px;' +
        SKEL_S +
        '"></div>' +
        '<div style="height:0.875rem;width:8px;' +
        SKEL_S +
        '"></div>' +
        '<div style="height:0.875rem;width:100px;' +
        SKEL_S +
        '"></div>' +
        "</div>";
      contentTarget.parentElement.insertBefore(existingSkel, contentTarget);
    }
  }

  // ── Configurator skeleton ──
  const imgParent = imgEl ? imgEl.parentElement : null;
  if (imgParent) {
    let existingConfSkel = document.getElementById("configurator-skel");
    if (!existingConfSkel) {
      existingConfSkel = document.createElement("div");
      existingConfSkel.id = "configurator-skel";
      existingConfSkel.style.cssText =
        "background:#fff;border:2px solid #e5e7eb;border-radius:12px;padding:2rem;margin-top:1.5rem;";
      existingConfSkel.innerHTML =
        bar("50%", "1.25rem", "1.5rem") +
        // Select field 1
        '<div style="margin-bottom:1rem;">' +
        bar("25%", "0.875rem", "0.5rem") +
        bar("100%", "2.75rem", "0") +
        "</div>" +
        // Select field 2
        '<div style="margin-bottom:1.5rem;">' +
        bar("30%", "0.875rem", "0.5rem") +
        bar("100%", "2.75rem", "0") +
        "</div>" +
        // Purchase button
        '<div style="height:3rem;width:100%;background:linear-gradient(90deg,#d1fae5 25%,#ecfdf5 50%,#d1fae5 75%);background-size:200% 100%;animation:skel-shimmer 1.5s infinite;border-radius:8px;"></div>';
      imgParent.insertAdjacentElement("afterend", existingConfSkel);
    }
  }

  // ── Content skeleton ──
  if (contentTarget) {
    let html = bar("50%", "2rem", "1.5rem");
    for (let i = 0; i < 4; i++) {
      html += bar(i % 2 === 0 ? "100%" : "80%", "1rem");
    }
    contentTarget.innerHTML = html;
  }
}

function clearSkeletons() {
  const breadcrumbSkel = document.getElementById("breadcrumb-skel");
  if (breadcrumbSkel) breadcrumbSkel.remove();
  const configuratorSkel = document.getElementById("configurator-skel");
  if (configuratorSkel) configuratorSkel.remove();
  // Reset image style
  const imgEl = document.querySelector('[data-product-detail="image"]');
  if (imgEl) imgEl.style.cssText = "";
}

function clearBreadcrumbSkel() {
  const skel = document.getElementById("breadcrumb-skel");
  if (skel) skel.remove();
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

function getSlugFromURL() {
  return new URLSearchParams(window.location.search).get("slug");
}

// ── Side navigation ───────────────────────
var navLoading = false;

async function loadSideNavigation(currentSlug) {
  if (navLoading) return;
  navLoading = true;
  try {
    const response = await fetch(API_URL + "/api/products/categories");
    const data = await response.json();
    if (data.success) displaySideNavigation(data.data, currentSlug);
  } catch (error) {
    console.error("Error loading navigation:", error);
  } finally {
    navLoading = false;
  }
}

function displaySideNavigation(categories, currentSlug) {
  // Remove all existing mobile navs
  document.querySelectorAll("#side-nav-mobile").forEach(function (el) {
    el.remove();
  });

  let html = '<div class="side-nav">';
  Object.keys(categories)
    .sort()
    .forEach(function (category) {
      const hasCurrentProduct = categories[category].some(function (p) {
        return p.slug === currentSlug;
      });
      const isExpanded = hasCurrentProduct;
      html += '<div class="side-nav-category">';
      html +=
        '<div class="side-nav-category-title ' +
        (isExpanded ? "expanded" : "collapsed") +
        '" onclick="toggleCategory(this)">' +
        category +
        "</div>";
      html +=
        '<div class="side-nav-items' + (isExpanded ? "" : " hidden") + '">';
      categories[category].forEach(function (product) {
        const isActive = product.slug === currentSlug ? " active" : "";
        html +=
          '<a href="/product-detail?slug=' +
          product.slug +
          '" class="side-nav-item' +
          isActive +
          '">' +
          product.title +
          "</a>";
      });
      html += "</div></div>";
    });
  html += "</div>";

  // Desktop nav
  const navContainer = document.querySelector('[data-product-nav="container"]');
  if (navContainer) navContainer.innerHTML = html;

  // Mobile nav — always inject, CSS controls visibility
  const contentContainer = document.querySelector(
    '[data-product-detail="content"]',
  );
  if (contentContainer && contentContainer.parentElement) {
    const mobileNav = document.createElement("div");
    mobileNav.id = "side-nav-mobile";
    mobileNav.className = "side-nav-mobile-container";
    mobileNav.innerHTML = html;
    contentContainer.parentElement.appendChild(mobileNav);
  }
}

function toggleCategory(element) {
  const items = element.nextElementSibling;
  const isHidden = items.classList.contains("hidden");
  document
    .querySelectorAll(".side-nav-category-title")
    .forEach(function (title) {
      const titleItems = title.nextElementSibling;
      if (titleItems) {
        titleItems.classList.add("hidden");
        title.classList.remove("expanded");
        title.classList.add("collapsed");
      }
    });
  if (isHidden) {
    items.classList.remove("hidden");
    element.classList.remove("collapsed");
    element.classList.add("expanded");
  }
}

// ── Load product detail ───────────────────
async function loadProductDetail() {
  const slug = getSlugFromURL();
  if (!slug) {
    showError("No product specified");
    return;
  }

  // Show skeleton immediately — no spinner
  showSkeleton();

  try {
    const response = await fetch(API_URL + "/api/products/" + slug);
    const data = await response.json();
    if (data.success) {
      displayProductDetail(data.data);
      loadSideNavigation(slug);
    } else {
      showError("Product not found");
    }
  } catch (error) {
    console.error("Error loading product:", error);
    showError("Failed to load product");
  }
}

function displayProductDetail(product) {
  clearSkeletons();
  currentProductStripePaymentLink = product.stripePaymentLink || null;
  allVariants = product.variants || [];
  const enabledVariants = allVariants.filter(function (v) {
    return v.enabled !== false;
  });

  document.title = product.title + " - Basepoint Engineering";

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content =
    product.excerpt ||
    (product.description
      ? product.description
          .replace(/<[^>]*>/g, "")
          .substring(0, 160)
          .trim()
      : "") ||
    product.title +
      " — " +
      (product.category || "") +
      " | Basepoint Engineering.";

  setMetaTag("og:title", product.title + " - Basepoint Engineering");
  setMetaTag("twitter:title", product.title + " - Basepoint Engineering");
  setMetaTag("og:description", metaDesc.content);
  setMetaTag("twitter:description", metaDesc.content);
  setMetaTag("og:url", window.location.href);
  setMetaTag("og:type", "product");
  setMetaTag("twitter:card", "summary_large_image");
  if (product.imageUrl) {
    setMetaTag("og:image", product.imageUrl);
    setMetaTag("twitter:image", product.imageUrl);
  }

  // Clear breadcrumb skeleton and inject real breadcrumb
  clearBreadcrumbSkel();
  injectBreadcrumb(product.title, product.category || null);

  const titleEl = document.querySelector('[data-product-detail="title"]');
  if (titleEl) {
    titleEl.textContent = product.title;
    titleEl.style.fontFamily = "'Montserrat', sans-serif";
    titleEl.style.fontWeight = "700";
    titleEl.style.color = "#1D3A89";
  }

  const categoryEl = document.querySelector('[data-product-detail="category"]');
  if (categoryEl && product.category) {
    categoryEl.textContent = product.category;
    categoryEl.style.cssText =
      "font-family:'Open Sans',sans-serif;display:inline-block;padding:0.25rem 0.75rem;background:#e0f2fe;color:#0369a1;border-radius:9999px;font-size:0.875rem;font-weight:500;";
  }

  const imgEl = document.querySelector('[data-product-detail="image"]');
  if (imgEl && product.imageUrl) {
    imgEl.style.cssText = "";
    imgEl.src = product.imageUrl + "?t=" + new Date().getTime();
    imgEl.alt = product.title;
    imgEl.style.height = "auto";
    imgEl.style.objectFit = "cover";
    imgEl.style.borderRadius = "8px";
    imgEl.style.width =
      window.innerWidth <= 768 ? "calc(100% - 1.5rem)" : "100%";
  }

  if (enabledVariants.length > 0) {
    displayProductConfigurator(enabledVariants, product);
  } else if (product.basePrice) {
    displaySimplePriceBox(product);
  }

  const contentEl = document.querySelector('[data-product-detail="content"]');
  if (contentEl) {
    if (product.contentBlocks && Array.isArray(product.contentBlocks)) {
      contentEl.innerHTML = renderProductContentBlocks(product.contentBlocks);
    } else if (product.description) {
      contentEl.innerHTML =
        "<p style=\"font-family:'Open Sans',sans-serif;line-height:1.8;\">" +
        product.description
          .replace(
            /\n\n/g,
            "</p><p style=\"font-family:'Open Sans',sans-serif;line-height:1.8;\">",
          )
          .replace(/\n/g, "<br>") +
        "</p>";
    }
  }

  if (product.showVariantsTable && allVariants.length > 0)
    displayVariants(allVariants);

  if (product.faqs && product.faqs.length > 0) displayProductFaqs(product.faqs);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: "view_item",
    ecommerce: {
      items: [
        {
          item_id: product.slug,
          item_name: product.title,
          item_category: product.category || undefined,
          price: product.basePrice || undefined,
        },
      ],
    },
  });
}

// ── Breadcrumb ────────────────────────────
function injectBreadcrumb(productTitle, category) {
  var existing = document.querySelector(".bp-breadcrumb");
  if (existing) existing.remove();

  var breadcrumbHTML = '<nav class="bp-breadcrumb" aria-label="Breadcrumb">';
  breadcrumbHTML += '<a href="https://basepointengineering.com">Home</a>';
  breadcrumbHTML += '<span class="bp-separator">›</span>';
  if (category) {
    breadcrumbHTML +=
      '<a href="https://basepointengineering.com/products?category=' +
      encodeURIComponent(category) +
      '">' +
      category +
      "</a>";
  } else {
    breadcrumbHTML +=
      '<a href="https://basepointengineering.com/products">Products</a>';
  }
  breadcrumbHTML += '<span class="bp-separator">›</span>';
  breadcrumbHTML += '<span class="bp-current">' + productTitle + "</span>";
  breadcrumbHTML += "</nav>";

  var target = document.querySelector('[data-product-detail="content"]');
  if (target && target.parentElement) {
    var div = document.createElement("div");
    div.innerHTML = breadcrumbHTML;
    target.parentElement.insertBefore(div.firstChild, target);
  }

  var existing2 = document.getElementById("bp-breadcrumb-schema");
  if (existing2) existing2.remove();

  var slug = getSlugFromURL();
  var schema = {
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
        name: category || "Products",
        item: category
          ? "https://basepointengineering.com/products?category=" +
            encodeURIComponent(category)
          : "https://basepointengineering.com/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productTitle,
        item:
          "https://basepointengineering.com/product-detail?slug=" +
          encodeURIComponent(slug || ""),
      },
    ],
  };
  var script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "bp-breadcrumb-schema";
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

// ── Simple price box ──────────────────────
function displaySimplePriceBox(product) {
  let html = '<div class="product-configurator">';
  html +=
    '<h3 class="configurator-title" style="color:#1D3A89">💰 Product Pricing</h3>';
  html +=
    '<div class="variant-price-info" style="display:block;"><div class="price-label">Price:</div><div class="price-amount">CA$' +
    product.basePrice.toFixed(2) +
    "</div></div>";
  html +=
    '<button class="configurator-cta" onclick="handleSimplePurchase(\'' +
    product.title.replace(/'/g, "\\'") +
    "'," +
    product.basePrice +
    ')">🛒 Purchase Now</button>';
  html +=
    '<div class="configurator-help">Need help? <a href="/contact" style="color:#3b82f6;text-decoration:underline;">Contact our team</a></div>';
  html += "</div>";
  const imgEl = document.querySelector('[data-product-detail="image"]');
  if (imgEl && imgEl.parentElement)
    imgEl.parentElement.insertAdjacentHTML("afterend", html);
}

async function handleSimplePurchase(productTitle, price) {
  if (currentProductStripePaymentLink) {
    try {
      const response = await fetch(API_URL + "/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: getSlugFromURL(),
          customData: { product_title: productTitle, product_type: "simple" },
        }),
      });
      const data = await response.json();
      if (data.success && data.checkoutUrl)
        window.open(data.checkoutUrl, "_blank");
      else
        alert(
          "Failed to create checkout: " + (data.error || "Please try again."),
        );
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
    return;
  }
  try {
    const response = await fetch(API_URL + "/api/checkout/lemon-squeezy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName: productTitle,
        price: price,
        customData: { product_title: productTitle, product_type: "simple" },
      }),
    });
    const data = await response.json();
    if (data.success && data.checkoutUrl)
      window.open(data.checkoutUrl, "_blank");
    else
      alert(
        "Failed to create checkout: " + (data.error || "Please try again."),
      );
  } catch (error) {
    alert("An error occurred. Please try again.");
  }
}

// ── Configurator ──────────────────────────
function displayProductConfigurator(variants, product) {
  const capacities = [
    ...new Set(variants.map((v) => v.capacity).filter(Boolean)),
  ].sort();
  const lengths = [
    ...new Set(variants.map((v) => v.length).filter(Boolean)),
  ].sort();
  const endConnections = [
    ...new Set(variants.map((v) => v.endConnection).filter(Boolean)),
  ].sort();
  const customFieldsMap = new Map();
  variants.forEach((variant) => {
    if (variant.customFields) {
      Object.entries(variant.customFields).forEach(([fieldName, value]) => {
        if (value && value !== "null" && value !== "undefined") {
          if (!customFieldsMap.has(fieldName))
            customFieldsMap.set(fieldName, new Set());
          customFieldsMap.get(fieldName).add(value);
        }
      });
    }
  });

  const hasStandardCapacity = capacities.length > 0;
  const hasStandardLength = lengths.length > 0;
  const hasStandardConnection = endConnections.length > 0;

  let html =
    '<div class="product-configurator"><h3 class="configurator-title" style="color:#1D3A89">🛠️ Let\'s Customize Your Product</h3><div class="configurator-options">';

  if (hasStandardCapacity) {
    html +=
      '<div class="configurator-option"><label class="configurator-label">Capacity *</label><select id="capacity-select" class="configurator-select" onchange="updateConfiguration()"><option value="">Select capacity...</option>';
    capacities.forEach((c) => {
      html += '<option value="' + c + '">' + c + "</option>";
    });
    html += "</select></div>";
  }
  if (hasStandardLength) {
    html +=
      '<div class="configurator-option"><label class="configurator-label">Length *</label><select id="length-select" class="configurator-select" onchange="updateConfiguration()" disabled><option value="">Select length...</option></select></div>';
  }
  if (hasStandardConnection) {
    html +=
      '<div class="configurator-option"><label class="configurator-label">End Connection *</label><select id="connection-select" class="configurator-select" onchange="updateConfiguration()" disabled><option value="">Select end connection...</option></select></div>';
  }

  customFieldsMap.forEach((values, fieldName) => {
    const n = fieldName.toLowerCase().replace(/\s+/g, "");
    if (
      (n === "capacity" && hasStandardCapacity) ||
      (n === "length" && hasStandardLength) ||
      ((n === "endconnection" ||
        n === "connection" ||
        n === "connectiontype") &&
        hasStandardConnection)
    )
      return;
    const fieldId = "custom-" + fieldName.replace(/\s+/g, "-").toLowerCase();
    html +=
      '<div class="configurator-option"><label class="configurator-label">' +
      fieldName +
      ' *</label><select id="' +
      fieldId +
      '" class="configurator-select" data-custom-field="' +
      fieldName +
      '" onchange="updateConfiguration()"><option value="">Select ' +
      fieldName.toLowerCase() +
      "...</option>";
    Array.from(values)
      .sort()
      .forEach((v) => {
        html += '<option value="' + v + '">' + v + "</option>";
      });
    html += "</select></div>";
  });

  html += "</div>";
  html +=
    '<div id="selected-variant-info" style="display:none;" class="selected-variant-info"><div class="selected-variant-label">Selected Model:</div><div class="selected-variant-model" id="selected-model-number">-</div></div>';
  html +=
    '<div id="variant-price-display" style="display:none;" class="variant-price-info"><div class="price-label">Price:</div><div class="price-amount" id="price-amount">-</div></div>';
  html +=
    '<button id="purchase-btn" class="configurator-cta" onclick="handlePurchase()" disabled>🛒 Purchase Now</button>';
  html +=
    '<div class="configurator-help">Need help? <a href="/contact" style="color:#3b82f6;text-decoration:underline;">Contact our team</a></div></div>';

  const imgEl = document.querySelector('[data-product-detail="image"]');
  if (imgEl && imgEl.parentElement)
    imgEl.parentElement.insertAdjacentHTML("afterend", html);
  else {
    const contentEl = document.querySelector('[data-product-detail="content"]');
    if (contentEl) contentEl.insertAdjacentHTML("beforebegin", html);
  }

  setTimeout(function () {
    if (capacities.length === 1) {
      document.getElementById("capacity-select").value = capacities[0];
      updateConfiguration();
    }
  }, 100);
}

function updateConfiguration() {
  const capacitySelect = document.getElementById("capacity-select");
  const lengthSelect = document.getElementById("length-select");
  const connectionSelect = document.getElementById("connection-select");
  if (!capacitySelect && !lengthSelect && !connectionSelect) {
    findSelectedVariant();
    return;
  }
  if (!capacitySelect) return;
  const selectedCapacity = capacitySelect.value;
  let filteredVariants = allVariants.filter(
    (v) => v.capacity === selectedCapacity,
  );
  if (lengthSelect) {
    const currentLengthValue = lengthSelect.value;
    const availableLengths = [
      ...new Set(filteredVariants.map((v) => v.length).filter(Boolean)),
    ].sort();
    lengthSelect.innerHTML = '<option value="">Select length...</option>';
    availableLengths.forEach((l) => {
      lengthSelect.innerHTML += '<option value="' + l + '">' + l + "</option>";
    });
    lengthSelect.disabled = !selectedCapacity || availableLengths.length === 0;
    if (availableLengths.length === 1) lengthSelect.value = availableLengths[0];
    else if (
      currentLengthValue &&
      availableLengths.includes(currentLengthValue)
    )
      lengthSelect.value = currentLengthValue;
    if (lengthSelect.value)
      filteredVariants = filteredVariants.filter(
        (v) => v.length === lengthSelect.value,
      );
  }
  if (connectionSelect) {
    const currentConnectionValue = connectionSelect.value;
    const availableConnections = [
      ...new Set(filteredVariants.map((v) => v.endConnection).filter(Boolean)),
    ].sort();
    connectionSelect.innerHTML =
      '<option value="">Select end connection...</option>';
    availableConnections.forEach((c) => {
      connectionSelect.innerHTML +=
        '<option value="' + c + '">' + c + "</option>";
    });
    connectionSelect.disabled =
      !selectedCapacity || availableConnections.length === 0;
    if (availableConnections.length === 1)
      connectionSelect.value = availableConnections[0];
    else if (
      currentConnectionValue &&
      availableConnections.includes(currentConnectionValue)
    )
      connectionSelect.value = currentConnectionValue;
  }
  findSelectedVariant();
}

function findSelectedVariant() {
  const capacitySelect = document.getElementById("capacity-select");
  const lengthSelect = document.getElementById("length-select");
  const connectionSelect = document.getElementById("connection-select");
  const purchaseBtn = document.getElementById("purchase-btn");
  const variantInfo = document.getElementById("selected-variant-info");
  const modelNumber = document.getElementById("selected-model-number");
  const priceDisplay = document.getElementById("variant-price-display");
  const priceAmount = document.getElementById("price-amount");
  const capacity = capacitySelect ? capacitySelect.value : null;
  const length = lengthSelect ? lengthSelect.value : null;
  const connection = connectionSelect ? connectionSelect.value : null;
  const customFieldSelects = document.querySelectorAll("[data-custom-field]");
  const customFieldSelections = {};
  let allCustomFieldsSelected = true;
  customFieldSelects.forEach((select) => {
    const fieldName = select.getAttribute("data-custom-field");
    if (select.value) customFieldSelections[fieldName] = select.value;
    else allCustomFieldsSelected = false;
  });
  const hasStandardCapacity = capacitySelect && !capacitySelect.disabled;
  const hasStandardLength = lengthSelect && !lengthSelect.disabled;
  const hasStandardConnection = connectionSelect && !connectionSelect.disabled;
  const hasCustomFields = customFieldSelects.length > 0;
  const allRequiredSelected =
    (!hasStandardCapacity || capacity) &&
    (!hasStandardLength || length) &&
    (!hasStandardConnection || connection) &&
    (!hasCustomFields || allCustomFieldsSelected);
  if (!allRequiredSelected) {
    variantInfo.style.display = "none";
    priceDisplay.style.display = "none";
    purchaseBtn.disabled = true;
    return;
  }
  selectedVariant = allVariants.find((v) => {
    if (v.enabled === false) return false;
    const matchCapacity = !hasStandardCapacity || v.capacity === capacity;
    const matchLength = !hasStandardLength || v.length === length;
    const matchConnection =
      !hasStandardConnection || v.endConnection === connection;
    let matchCustomFields = true;
    if (hasCustomFields) {
      if (!v.customFields) matchCustomFields = false;
      else
        Object.entries(customFieldSelections).forEach(([fieldName, value]) => {
          if (v.customFields[fieldName] !== value) matchCustomFields = false;
        });
    }
    return matchCapacity && matchLength && matchConnection && matchCustomFields;
  });
  var existingPreviewBtn = document.getElementById("preview-btn");
  if (existingPreviewBtn) existingPreviewBtn.remove();
  var priceLabel = priceDisplay.querySelector(".price-label");
  if (selectedVariant) {
    variantInfo.style.display = "block";
    modelNumber.textContent =
      selectedVariant.modelNumber || "Model: " + selectedVariant.capacity;
    if (priceLabel) priceLabel.style.display = "";
    priceAmount.removeAttribute("style");
    if (selectedVariant.price !== null && selectedVariant.price !== undefined) {
      priceDisplay.style.display = "block";
      priceAmount.textContent = "CA$" + selectedVariant.price.toFixed(2);
    } else priceDisplay.style.display = "none";
    purchaseBtn.disabled = false;
    if (selectedVariant.previewFileLink) showPreviewClaimModal(selectedVariant);
  } else if (allRequiredSelected) {
    variantInfo.style.display = "none";
    if (priceLabel) priceLabel.style.display = "none";
    priceDisplay.style.display = "block";
    priceAmount.textContent = "⚠ Not Available — select a different variation";
    priceAmount.style.cssText =
      "color:#ef4444;font-size:0.9rem;font-weight:600;background:#fef2f2;padding:0.5rem 0.75rem;border-radius:8px;border:1px solid #fecaca;display:inline-block;";
    purchaseBtn.disabled = true;
  } else {
    variantInfo.style.display = "none";
    priceDisplay.style.display = "none";
    if (priceLabel) priceLabel.style.display = "";
    priceAmount.removeAttribute("style");
    purchaseBtn.disabled = true;
  }
}

async function handlePurchase() {
  if (!selectedVariant) {
    alert("Please select all options first");
    return;
  }
  const purchaseBtn = document.getElementById("purchase-btn");
  const originalText = purchaseBtn.innerHTML;
  purchaseBtn.disabled = true;
  purchaseBtn.innerHTML = "⏳ Processing...";
  if (currentProductStripePaymentLink) {
    try {
      const response = await fetch(API_URL + "/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          productSlug: getSlugFromURL(),
          customData: {
            model_number: selectedVariant.modelNumber,
            capacity: selectedVariant.capacity,
            length: selectedVariant.length || null,
            end_connection: selectedVariant.endConnection || null,
            variant_id: selectedVariant.id,
            custom_fields: selectedVariant.customFields || null,
          },
        }),
      });
      const data = await response.json();
      if (data.success && data.checkoutUrl)
        window.open(data.checkoutUrl, "_blank");
      else
        alert(
          "Failed to create checkout: " + (data.error || "Please try again."),
        );
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
    purchaseBtn.disabled = false;
    purchaseBtn.innerHTML = originalText;
    return;
  }
  try {
    const response = await fetch(API_URL + "/api/checkout/lemon-squeezy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variantId: selectedVariant.id,
        productSlug: getSlugFromURL(),
        customData: {
          model_number: selectedVariant.modelNumber,
          capacity: selectedVariant.capacity,
          length: selectedVariant.length || null,
          end_connection: selectedVariant.endConnection || null,
          variant_id: selectedVariant.id,
          custom_fields: selectedVariant.customFields || null,
        },
      }),
    });
    const data = await response.json();
    if (data.success && data.checkoutUrl)
      window.open(data.checkoutUrl, "_blank");
    else
      alert(
        "Failed to create checkout: " + (data.error || "Please try again."),
      );
  } catch (error) {
    alert("An error occurred. Please try again.");
  }
  purchaseBtn.disabled = false;
  purchaseBtn.innerHTML = originalText;
}

function renderProductContentBlocks(blocks) {
  return blocks
    .map(function (block) {
      const marginTop = block.marginTop || 0;
      const marginBottom = block.marginBottom || 20;
      const baseStyle =
        "margin-top:" + marginTop + "px;margin-bottom:" + marginBottom + "px;";
      switch (block.type) {
        case "heading":
          const level = block.level || 2;
          return (
            "<h" +
            level +
            ' style="' +
            baseStyle +
            "font-family:'Montserrat',sans-serif;font-weight:" +
            (level === 1 ? "700" : level === 2 ? "600" : "500") +
            ";line-height:1.3;" +
            (level <= 3 ? "color:#1D3A89;" : "") +
            '">' +
            block.content +
            "</h" +
            level +
            ">"
          );
        case "paragraph":
          return (
            '<p style="' +
            baseStyle +
            "font-family:'Open Sans',sans-serif;line-height:1.8;font-size:1rem;" +
            '">' +
            block.content.replace(
              /<a /gi,
              '<a target="_blank" rel="noopener noreferrer" ',
            ) +
            "</p>"
          );
        case "list":
          const listTag = block.listType === "numbered" ? "ol" : "ul";
          const listStyle =
            baseStyle +
            "font-family:'Open Sans',sans-serif;line-height:1.8;font-size:1rem;" +
            (block.listType === "numbered"
              ? "list-style-type:decimal;padding-left:2rem;"
              : "list-style-type:disc;padding-left:2rem;");
          return (
            "<" +
            listTag +
            ' style="' +
            listStyle +
            '">' +
            (block.listItems || [])
              .map((i) => '<li style="margin-bottom:0.5rem;">' + i + "</li>")
              .join("") +
            "</" +
            listTag +
            ">"
          );
        case "specifications":
          return (
            '<div style="' +
            baseStyle +
            'background:#f9fafb;padding:1.5rem;border-radius:8px;">' +
            (block.specs || [])
              .map(
                (s) =>
                  '<div style="display:flex;padding:0.75rem 0;border-bottom:1px solid #e5e7eb;"><div style="flex:1;font-weight:600;font-family:\'Montserrat\',sans-serif;color:#374151;">' +
                  s.label +
                  ":</div><div style=\"flex:1;font-family:'Open Sans',sans-serif;color:#6b7280;\">" +
                  s.value +
                  "</div></div>",
              )
              .join("") +
            "</div>"
          );
        case "image":
          return (
            '<div style="display:flex;justify-content:center;margin:1rem 0;"><img src="' +
            block.content +
            '" alt="' +
            (block.alt || "") +
            '" style="' +
            baseStyle +
            'width:400px;height:400px;object-fit:contain;display:block;border-radius:8px;background:#f9fafb;" /></div>'
          );
        case "divider":
          return (
            '<hr style="' +
            baseStyle +
            'border:0;border-top:2px solid #e5e7eb;" />'
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
        default:
          return "";
      }
    })
    .join("");
}

function displayVariants(variants) {
  const tableContainer = document.querySelector(
    '[data-product-detail="variants-table"]',
  );
  if (!tableContainer) return;
  const customFieldNames = new Set();
  variants.forEach((v) => {
    if (v.customFields)
      Object.keys(v.customFields).forEach((k) => customFieldNames.add(k));
  });
  const totalPages = Math.ceil(variants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVariants = variants.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const hasCapacity = variants.some((v) => v.capacity);
  const hasLength = variants.some((v) => v.length);
  const hasEndConnection = variants.some((v) => v.endConnection);
  const hasPrice = variants.some(
    (v) => v.price !== null && v.price !== undefined,
  );
  let tableHtml =
    '<div class="variants-table-container"><h2 style="font-family:\'Montserrat\',sans-serif;font-weight:600;font-size:1.5rem;margin-bottom:1rem;color:#1D3A89;">Available Models</h2><table class="variants-table"><thead><tr><th>Model Number</th>';
  if (hasCapacity) tableHtml += "<th>Capacity</th>";
  if (hasLength) tableHtml += "<th>Length</th>";
  if (hasEndConnection) tableHtml += "<th>End Connection</th>";
  Array.from(customFieldNames).forEach((f) => {
    tableHtml += "<th>" + f.toUpperCase() + "</th>";
  });
  if (hasPrice) tableHtml += "<th>Price</th>";
  tableHtml += "</tr></thead><tbody>";
  paginatedVariants.forEach((v) => {
    const isDisabled = v.enabled === false;
    tableHtml +=
      "<tr" +
      (isDisabled ? ' style="opacity:0.6;"' : "") +
      "><td><strong>" +
      (v.modelNumber || "N/A") +
      "</strong>" +
      (isDisabled
        ? ' <span style="font-size:0.75rem;color:#ef4444;font-weight:600;">⊘ Disabled</span>'
        : "") +
      "</td>";
    if (hasCapacity) tableHtml += "<td>" + (v.capacity || "-") + "</td>";
    if (hasLength) tableHtml += "<td>" + (v.length || "-") + "</td>";
    if (hasEndConnection)
      tableHtml += "<td>" + (v.endConnection || "-") + "</td>";
    Array.from(customFieldNames).forEach((f) => {
      tableHtml += "<td>" + (v.customFields?.[f] || "-") + "</td>";
    });
    if (hasPrice)
      tableHtml +=
        "<td>" +
        (isDisabled
          ? '<span style="color:#9ca3af;font-size:0.85rem;">Not Available</span>'
          : v.price !== null && v.price !== undefined
            ? "<strong>CA$" + v.price.toFixed(2) + "</strong>"
            : "—") +
        "</td>";
    tableHtml += "</tr>";
  });
  tableHtml += "</tbody></table>";
  if (variants.length > itemsPerPage) {
    tableHtml += '<div class="pagination-container">';
    tableHtml +=
      '<button class="pagination-button" onclick="goToPage(' +
      (currentPage - 1) +
      ')" ' +
      (currentPage === 1 ? "disabled" : "") +
      ">← Previous</button>";
    for (let i = 1; i <= totalPages; i++) {
      tableHtml +=
        '<button class="pagination-button' +
        (i === currentPage ? " active" : "") +
        '" onclick="goToPage(' +
        i +
        ')">' +
        i +
        "</button>";
    }
    tableHtml +=
      '<button class="pagination-button" onclick="goToPage(' +
      (currentPage + 1) +
      ')" ' +
      (currentPage === totalPages ? "disabled" : "") +
      ">Next →</button>";
    tableHtml +=
      '<span class="pagination-info">Showing ' +
      (startIndex + 1) +
      "-" +
      Math.min(startIndex + itemsPerPage, variants.length) +
      " of " +
      variants.length +
      "</span>";
    tableHtml += "</div>";
  }
  tableHtml += "</div>";
  let cardsHtml =
    '<div class="variants-cards"><h2 style="font-family:\'Montserrat\',sans-serif;font-weight:600;font-size:1.5rem;margin-bottom:1rem;color:#1D3A89;">Available Models</h2>';
  variants.forEach((v) => {
    cardsHtml +=
      '<div class="variant-card"><div class="variant-card-header">' +
      (v.modelNumber || "Variant") +
      "</div>";
    if (v.capacity)
      cardsHtml +=
        '<div class="variant-card-row"><div class="variant-card-label">Capacity</div><div class="variant-card-value">' +
        v.capacity +
        "</div></div>";
    if (v.length)
      cardsHtml +=
        '<div class="variant-card-row"><div class="variant-card-label">Length</div><div class="variant-card-value">' +
        v.length +
        "</div></div>";
    if (v.endConnection)
      cardsHtml +=
        '<div class="variant-card-row"><div class="variant-card-label">End Connection</div><div class="variant-card-value">' +
        v.endConnection +
        "</div></div>";
    if (v.customFields)
      Object.entries(v.customFields).forEach(([k, val]) => {
        cardsHtml +=
          '<div class="variant-card-row"><div class="variant-card-label">' +
          k +
          '</div><div class="variant-card-value">' +
          val +
          "</div></div>";
      });
    cardsHtml += "</div>";
  });
  cardsHtml += "</div>";
  tableContainer.innerHTML = tableHtml + cardsHtml;
}

function goToPage(pageNumber) {
  currentPage = pageNumber;
  displayVariants(allVariants);
  const tableContainer = document.querySelector(
    '[data-product-detail="variants-table"]',
  );
  if (tableContainer)
    tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── FAQ accordion ──────────────────────────
function displayProductFaqs(faqs) {
  if (!faqs || faqs.length === 0) return;

  var html = '<div class="product-faqs">';
  html +=
    '<h2 class="faq-section-title" style="color:#1D3A89">Frequently Asked Questions</h2>';
  html += '<div class="faq-list">';
  faqs.forEach(function (f) {
    html += '<div class="faq-item">';
    html +=
      '<button type="button" class="faq-question" onclick="toggleFaq(this)">';
    html += '<span class="faq-question-text">' + f.question + "</span>";
    html += '<span class="faq-icon">+</span>';
    html += "</button>";
    html += '<div class="faq-answer hidden">';
    html += '<div class="faq-answer-inner">' + f.answer + "</div>";
    html += "</div>";
    html += "</div>";
  });
  html += "</div></div>";

  var anchor =
    document.querySelector('[data-product-detail="variants-table"]') ||
    document.querySelector('[data-product-detail="content"]');
  if (anchor) anchor.insertAdjacentHTML("afterend", html);

  injectFaqSchema(faqs);
}

function toggleFaq(buttonEl) {
  var answerEl = buttonEl.nextElementSibling;
  var isHidden = answerEl.classList.contains("hidden");
  answerEl.classList.toggle("hidden");
  buttonEl.classList.toggle("open", isHidden);
}

function injectFaqSchema(faqs) {
  var existing = document.getElementById("bp-faq-schema");
  if (existing) existing.remove();

  var schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(function (f) {
      return {
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      };
    }),
  };
  var script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "bp-faq-schema";
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

function showError(message) {
  const contentEl = document.querySelector('[data-product-detail="content"]');
  if (contentEl)
    contentEl.innerHTML =
      '<div style="text-align:center;padding:3rem;"><p style="color:#ef4444;font-size:1.25rem;font-family:\'Open Sans\',sans-serif;margin-bottom:1rem;">' +
      message +
      '</p><a href="/" style="color:#3b82f6;text-decoration:underline;">← Back to Home</a></div>';
}

function showPreviewClaimModal(variant) {
  var existing = document.getElementById("preview-claim-modal");
  if (existing) existing.remove();
  var productSlug = getSlugFromURL();
  var productTitle =
    document.querySelector('[data-product-detail="title"]')?.textContent || "";
  var checkoutLink = currentProductStripePaymentLink || window.location.href;
  var overlay = document.createElement("div");
  overlay.id = "preview-claim-modal";
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;";
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;padding:2rem;max-width:460px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;"><div><p style="font-family:Montserrat,sans-serif;font-size:0.75rem;font-weight:700;color:#2563eb;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 0.35rem;">Good News</p><h2 style="font-family:Montserrat,sans-serif;font-size:1.3rem;font-weight:700;color:#111827;margin:0;line-height:1.3;">Your engineering drawing is ready — want us to send it?</h2></div><button id="modal-close-btn" style="background:none;border:none;cursor:pointer;font-size:1.5rem;color:#9ca3af;line-height:1;margin-left:1rem;flex-shrink:0;">×</button></div><div style="display:inline-flex;align-items:center;gap:0.4rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:0.35rem 0.75rem;margin-bottom:1rem;"><span style="font-size:0.75rem;color:#1d4ed8;font-family:Open Sans,sans-serif;">Selected:</span><span style="font-size:0.8rem;font-weight:700;color:#1e3a8a;font-family:Montserrat,sans-serif;">' +
    (variant.modelNumber || "") +
    '</span></div><p style="font-family:Open Sans,sans-serif;color:#4b5563;font-size:0.875rem;line-height:1.6;margin:0 0 1.25rem;">We\'ve prepared a detailed engineering drawing for this variant. Drop your details below and we\'ll email it to you instantly.</p><div id="modal-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:8px;padding:0.75rem;font-size:0.875rem;margin-bottom:1rem;font-family:Open Sans,sans-serif;"></div><div style="margin-bottom:0.875rem;"><label style="display:block;font-family:Open Sans,sans-serif;font-size:0.8rem;font-weight:600;color:#374151;margin-bottom:0.35rem;">Full Name *</label><input id="modal-name" type="text" placeholder="Jane Smith" style="width:100%;box-sizing:border-box;padding:0.65rem 0.85rem;border:1.5px solid #d1d5db;border-radius:8px;font-family:Open Sans,sans-serif;font-size:0.9rem;outline:none;" /></div><div style="margin-bottom:1.5rem;"><label style="display:block;font-family:Open Sans,sans-serif;font-size:0.8rem;font-weight:600;color:#374151;margin-bottom:0.35rem;">Work Email *</label><input id="modal-email" type="email" placeholder="jane@company.com" style="width:100%;box-sizing:border-box;padding:0.65rem 0.85rem;border:1.5px solid #d1d5db;border-radius:8px;font-family:Open Sans,sans-serif;font-size:0.9rem;outline:none;" /></div><div id="modal-success" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:8px;padding:0.75rem;font-size:0.875rem;margin-bottom:1rem;font-family:Open Sans,sans-serif;"></div><div style="display:flex;gap:0.75rem;"><button id="modal-submit-btn" style="flex:1;padding:0.8rem;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-family:Montserrat,sans-serif;font-weight:700;font-size:0.9rem;cursor:pointer;">Send Me the Drawing →</button><button id="modal-cancel-btn" style="padding:0.8rem 1.1rem;background:#f3f4f6;color:#6b7280;border:none;border-radius:8px;font-family:Open Sans,sans-serif;font-size:0.85rem;cursor:pointer;">Maybe Later</button></div></div>';
  document.body.appendChild(overlay);
  document.getElementById("modal-close-btn").onclick = function () {
    overlay.remove();
  };
  document.getElementById("modal-cancel-btn").onclick = function () {
    overlay.remove();
  };
  overlay.onclick = function (e) {
    if (e.target === overlay) overlay.remove();
  };
  document.getElementById("modal-submit-btn").onclick = async function () {
    var name = document.getElementById("modal-name").value.trim();
    var email = document.getElementById("modal-email").value.trim();
    var errorEl = document.getElementById("modal-error");
    var submitBtn = document.getElementById("modal-submit-btn");
    errorEl.style.display = "none";
    if (!name || !email) {
      errorEl.textContent = "Please enter your name and email.";
      errorEl.style.display = "block";
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    try {
      var res = await fetch(API_URL + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          productSlug,
          productTitle,
          variantId: variant.id,
          variantModel: variant.modelNumber,
          previewFileLink: variant.previewFileLink,
          checkoutLink,
        }),
      });
      var data = await res.json();
      if (data.success) {
        overlay.remove();
        showPreviewSuccessModal(name);
      } else {
        errorEl.textContent = data.error || "Something went wrong.";
        errorEl.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Me the Drawing →";
      }
    } catch (err) {
      errorEl.textContent = "Network error. Please try again.";
      errorEl.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Me the Drawing →";
    }
  };
}

function showPreviewSuccessModal(name) {
  var popup = document.createElement("div");
  popup.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;";
  popup.innerHTML =
    '<div style="background:#fff;border-radius:20px;padding:2.5rem 2rem;max-width:400px;width:100%;box-shadow:0 24px 64px rgba(0,0,0,0.25);text-align:center;"><div style="width:64px;height:64px;background:#f0fdf4;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;font-size:2rem;">🎉</div><h2 style="font-family:Montserrat,sans-serif;font-size:1.4rem;font-weight:700;color:#111827;margin:0 0 0.75rem;">Congratulations, ' +
    name +
    '!</h2><p style="font-family:Open Sans,sans-serif;color:#4b5563;font-size:0.875rem;line-height:1.65;margin:0 0 1.75rem;">Your engineering drawing is on its way.</p><button onclick="this.closest(\'div\').parentElement.remove()" style="width:100%;padding:0.85rem;background:#1e3a8a;color:#fff;border:none;border-radius:10px;font-family:Montserrat,sans-serif;font-weight:700;font-size:0.9rem;cursor:pointer;">Got it, thanks!</button></div>';
  document.body.appendChild(popup);
  popup.onclick = function (e) {
    if (e.target === popup) popup.remove();
  };
}

// ── Canonical ─────────────────────────────
(function () {
  const productSlug = new URLSearchParams(window.location.search).get("slug");
  if (productSlug) {
    const canonicalUrl =
      "https://basepointengineering.com/product-detail?slug=" + productSlug;
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
  document.addEventListener("DOMContentLoaded", loadProductDetail);
} else {
  loadProductDetail();
}
