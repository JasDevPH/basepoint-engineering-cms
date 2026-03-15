// FILE: public/webflow/product-detail.js

const API_URL = "https://cms.basepointengineering.com"; // Change to production URL when deploying
let allVariants = [];
let selectedVariant = null;
let currentPage = 1;
const itemsPerPage = 10;
let currentProductStripePaymentLink = null; // Stripe Payment Link for current product

// Show/hide loading
function showLoading() {
  const loader = document.createElement("div");
  loader.id = "product-loading-screen";
  loader.className = "product-loading-screen";
  loader.innerHTML =
    '<div class="product-spinner"></div><div class="product-loading-text">Loading product...</div>';
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById("product-loading-screen");
  if (loader) {
    loader.classList.add("hidden");
    setTimeout(() => loader.remove(), 300);
  }
}

// Load Google Fonts
function loadGoogleFonts() {
  if (!document.querySelector("#google-fonts-link")) {
    const link = document.createElement("link");
    link.id = "google-fonts-link";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;600&display=swap";
    document.head.appendChild(link);
    console.log("✓ Google Fonts loaded");
  }
}

// Get slug from URL
function getSlugFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("slug");
}

async function loadSideNavigation(currentSlug) {
  try {
    const response = await fetch(`${API_URL}/api/products/categories`);
    const data = await response.json();

    if (data.success) {
      displaySideNavigation(data.data, currentSlug);
    }
  } catch (error) {
    console.error("Error loading navigation:", error);
  }
}

function displaySideNavigation(categories, currentSlug) {
  let html = '<div class="side-nav">';

  Object.keys(categories)
    .sort()
    .forEach((category, index) => {
      const hasCurrentProduct = categories[category].some(
        (p) => p.slug === currentSlug,
      );
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

      categories[category].forEach((product) => {
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

      html += "</div>";
      html += "</div>";
    });

  html += "</div>";

  const navContainer = document.querySelector('[data-product-nav="container"]');
  if (navContainer) {
    navContainer.innerHTML = html;
  }

  if (window.innerWidth <= 768) {
    let mobileNavContainer = document.getElementById("side-nav-mobile");
    if (!mobileNavContainer) {
      mobileNavContainer = document.createElement("div");
      mobileNavContainer.id = "side-nav-mobile";
      mobileNavContainer.className = "side-nav-mobile-container";
    }
    mobileNavContainer.innerHTML = html;

    // Place mobile nav at the very bottom of the page
    const variantsTable = document.querySelector(
      '[data-product-detail="variants-table"]',
    );
    const contentContainer = document.querySelector(
      '[data-product-detail="content"]',
    );

    if (variantsTable && variantsTable.parentElement) {
      // Insert after the variants table's parent to be at the bottom
      variantsTable.after(mobileNavContainer);
    } else if (contentContainer && contentContainer.parentElement) {
      contentContainer.parentElement.appendChild(mobileNavContainer);
    } else {
      document.body.appendChild(mobileNavContainer);
    }
  }

  console.log("✓ Navigation loaded");
}

function toggleCategory(element) {
  const items = element.nextElementSibling;
  const isCurrentlyHidden = items.classList.contains("hidden");

  // Auto-close all other categories first
  const allTitles = document.querySelectorAll(".side-nav-category-title");
  allTitles.forEach(function (title) {
    const titleItems = title.nextElementSibling;
    if (titleItems) {
      titleItems.classList.add("hidden");
      title.classList.remove("expanded");
      title.classList.add("collapsed");
    }
  });

  // If the clicked one was closed, open it
  if (isCurrentlyHidden) {
    items.classList.remove("hidden");
    element.classList.remove("collapsed");
    element.classList.add("expanded");
  }
}

let resizeTimeout;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function () {
    const slug = getSlugFromURL();
    if (slug) {
      loadSideNavigation(slug);
    }
  }, 250);
});

async function loadProductDetail() {
  const slug = getSlugFromURL();
  console.log("=== LOADING PRODUCT ===");
  console.log("Slug from URL:", slug);

  if (!slug) {
    hideLoading();
    showError("No product specified");
    return;
  }

  showLoading();

  try {
    const apiUrl = `${API_URL}/api/products/${slug}`;
    console.log("Fetching from:", apiUrl);

    const response = await fetch(apiUrl);
    const data = await response.json();

    console.log("API Response:", data);

    if (data.success) {
      displayProductDetail(data.data);
      loadSideNavigation(slug);
      setTimeout(hideLoading, 300);
    } else {
      hideLoading();
      showError("Product not found");
    }
  } catch (error) {
    console.error("Error loading product:", error);
    hideLoading();
    showError("Failed to load product");
  }
}

function displayProductDetail(product) {
  console.log("=== DISPLAYING PRODUCT ===");
  console.log("Product:", product.title);
  console.log(
    "Number of variants:",
    product.variants ? product.variants.length : 0,
  );
  console.log("Price Type:", product.priceType);
  console.log("Base Price:", product.basePrice);
  console.log("Stripe Payment Link:", product.stripePaymentLink);

  // Store Stripe Payment Link for checkout
  currentProductStripePaymentLink = product.stripePaymentLink || null;

  // 🔥 DEBUG: Log all variants with their custom fields
  if (product.variants && product.variants.length > 0) {
    console.log("🔍 ALL VARIANTS:");
    product.variants.forEach((v, i) => {
      console.log(`  Variant ${i + 1}:`);
      console.log("    modelNumber:", v.modelNumber);
      console.log("    capacity:", v.capacity);
      console.log("    customFields:", v.customFields);
      console.log("    customFieldsJSON:", JSON.stringify(v.customFields));
      console.log("    price:", v.price);
      console.log("    ---");
    });
  }

  allVariants = product.variants || [];
  // Separate enabled variants for configurator (disabled ones still in allVariants for table)
  const enabledVariants = allVariants.filter(function(v) { return v.enabled !== false; });

  document.title = product.title + " - Basepoint Engineering";

  const titleEl = document.querySelector('[data-product-detail="title"]');
  if (titleEl) {
    titleEl.textContent = product.title;
    titleEl.style.fontFamily = "'Montserrat', sans-serif";
    titleEl.style.fontWeight = "700";
    console.log("✓ Title updated");
  }

  const categoryEl = document.querySelector('[data-product-detail="category"]');
  if (categoryEl && product.category) {
    categoryEl.textContent = product.category;
    categoryEl.style.fontFamily = "'Open Sans', sans-serif";
    categoryEl.style.display = "inline-block";
    categoryEl.style.padding = "0.25rem 0.75rem";
    categoryEl.style.background = "#e0f2fe";
    categoryEl.style.color = "#0369a1";
    categoryEl.style.borderRadius = "9999px";
    categoryEl.style.fontSize = "0.875rem";
    categoryEl.style.fontWeight = "500";
    console.log("✓ Category updated");
  }

  const imgEl = document.querySelector('[data-product-detail="image"]');
  if (imgEl && product.imageUrl) {
    imgEl.src = product.imageUrl + "?t=" + new Date().getTime();
    imgEl.alt = product.title;
    imgEl.style.height = "auto";
    imgEl.style.objectFit = "cover";
    imgEl.style.borderRadius = "8px";

    if (window.innerWidth <= 768) {
      // Mobile: center image with reasonable size
      imgEl.style.width = "auto";
      imgEl.style.maxWidth = "85%";
      imgEl.style.display = "block";
      imgEl.style.margin = "1.5rem auto";
    } else {
      imgEl.style.width = "100%";
    }
    console.log("✓ Image updated");
  }

  if (enabledVariants.length > 0) {
    console.log("✓ Displaying configurator with variants");
    displayProductConfigurator(enabledVariants, product);
  } else if (product.basePrice) {
    console.log("✓ Displaying simple price (no variants)");
    displaySimplePriceBox(product);
  }

  const contentEl = document.querySelector('[data-product-detail="content"]');
  if (contentEl) {
    if (product.contentBlocks && Array.isArray(product.contentBlocks)) {
      contentEl.innerHTML = renderProductContentBlocks(product.contentBlocks);
      console.log("✓ Content blocks rendered");
    } else if (product.description) {
      contentEl.innerHTML =
        "<p style=\"font-family: 'Open Sans', sans-serif; line-height: 1.8;\">" +
        product.description
          .replace(
            /\n\n/g,
            "</p><p style=\"font-family: 'Open Sans', sans-serif; line-height: 1.8;\">",
          )
          .replace(/\n/g, "<br>") +
        "</p>";
      console.log("✓ Description rendered");
    }
  }

  if (product.showVariantsTable && allVariants.length > 0) {
    console.log("✓ Displaying variants table");
    displayVariants(allVariants);
  }

  console.log("=== PRODUCT DISPLAY COMPLETE ===");
}

function displaySimplePriceBox(product) {
  let html = '<div class="product-configurator">';
  html += '<h3 class="configurator-title">💰 Product Pricing</h3>';
  html += '<div class="variant-price-info" style="display: block;">';
  html += '<div class="price-label">Price:</div>';
  html +=
    '<div class="price-amount">$' + product.basePrice.toFixed(2) + "</div>";
  html += "</div>";
  html +=
    '<button class="configurator-cta" onclick="handleSimplePurchase(\'' +
    product.title.replace(/'/g, "\\'") +
    "', " +
    product.basePrice +
    ')">';
  html += "🛒 Purchase Now";
  html += "</button>";
  html += '<div class="configurator-help">';
  html +=
    'Need help? <a href="/contact" style="color: #3b82f6; text-decoration: underline;">Contact our team</a>';
  html += "</div>";
  html += "</div>";

  const imgEl = document.querySelector('[data-product-detail="image"]');
  if (imgEl && imgEl.parentElement) {
    imgEl.parentElement.insertAdjacentHTML("afterend", html);
  } else {
    const contentEl = document.querySelector('[data-product-detail="content"]');
    if (contentEl) {
      contentEl.insertAdjacentHTML("beforebegin", html);
    }
  }

  console.log("✓ Simple price box displayed");
}

async function handleSimplePurchase(productTitle, price) {
  console.log("Initiating simple purchase:", productTitle, "Price:", price);

  const buttons = document.querySelectorAll(".configurator-cta");
  let purchaseBtn = null;
  buttons.forEach((btn) => {
    if (btn.onclick && btn.onclick.toString().includes(productTitle)) {
      purchaseBtn = btn;
    }
  });

  if (purchaseBtn) {
    const originalText = purchaseBtn.innerHTML;
    purchaseBtn.disabled = true;
    purchaseBtn.innerHTML = "⏳ Processing...";
  }

  // Check if Stripe is configured - use Stripe Checkout API
  if (currentProductStripePaymentLink) {
    console.log("✓ Using Stripe Checkout API for simple product");

    try {
      const response = await fetch(`${API_URL}/api/checkout/stripe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productSlug: getSlugFromURL(),
          customData: {
            product_title: productTitle,
            product_type: "simple",
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        console.log("✓ Stripe Checkout URL received:", data.checkoutUrl);

        const checkoutWindow = window.open(data.checkoutUrl, "_blank");

        if (
          !checkoutWindow ||
          checkoutWindow.closed ||
          typeof checkoutWindow.closed === "undefined"
        ) {
          alert(
            "Popup blocked! Please allow popups for this site and try again.",
          );
        }
      } else {
        console.error("Stripe Checkout failed:", data);
        alert(
          "Failed to create checkout: " + (data.error || "Please try again."),
        );
      }

      if (purchaseBtn) {
        purchaseBtn.disabled = false;
        purchaseBtn.innerHTML = originalText;
      }
      return;
    } catch (error) {
      console.error("Stripe Checkout error:", error);
      alert("An error occurred. Please try again.");
      if (purchaseBtn) {
        purchaseBtn.disabled = false;
        purchaseBtn.innerHTML = originalText;
      }
      return;
    }
  }

  // Fallback to Lemon Squeezy checkout
  try {
    const response = await fetch(`${API_URL}/api/checkout/lemon-squeezy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productName: productTitle,
        price: price,
        customData: {
          product_title: productTitle,
          product_type: "simple",
        },
      }),
    });

    const data = await response.json();

    if (data.success && data.checkoutUrl) {
      console.log("✓ Checkout URL received:", data.checkoutUrl);

      const checkoutWindow = window.open(data.checkoutUrl, "_blank");

      if (
        !checkoutWindow ||
        checkoutWindow.closed ||
        typeof checkoutWindow.closed === "undefined"
      ) {
        alert(
          "Popup blocked! Please allow popups for this site and try again.",
        );
      }

      if (purchaseBtn) {
        purchaseBtn.disabled = false;
        purchaseBtn.innerHTML = originalText;
      }
    } else {
      console.error("Checkout failed:", data);
      alert(
        "Failed to create checkout: " + (data.error || "Please try again."),
      );
      if (purchaseBtn) {
        purchaseBtn.disabled = false;
        purchaseBtn.innerHTML = originalText;
      }
    }
  } catch (error) {
    console.error("Purchase error:", error);
    alert("An error occurred. Please try again.");
    if (purchaseBtn) {
      purchaseBtn.disabled = false;
      purchaseBtn.innerHTML = originalText;
    }
  }
}

// 🆕 UPDATED: Configurator with Custom Fields Support
function displayProductConfigurator(variants, product) {
  // 🔥 FIX: Filter out null/undefined/empty values
  const capacities = [
    ...new Set(variants.map((v) => v.capacity).filter(Boolean)),
  ].sort();
  const lengths = [
    ...new Set(variants.map((v) => v.length).filter(Boolean)),
  ].sort();
  const endConnections = [
    ...new Set(variants.map((v) => v.endConnection).filter(Boolean)),
  ].sort();

  // 🆕 Extract custom fields from all variants
  const customFieldsMap = new Map();
  variants.forEach((variant) => {
    if (variant.customFields) {
      Object.entries(variant.customFields).forEach(([fieldName, value]) => {
        // 🔥 FIX: Only add non-empty values
        if (value && value !== "null" && value !== "undefined") {
          if (!customFieldsMap.has(fieldName)) {
            customFieldsMap.set(fieldName, new Set());
          }
          customFieldsMap.get(fieldName).add(value);
        }
      });
    }
  });

  console.log("🔧 Custom fields detected:", Array.from(customFieldsMap.keys()));
  console.log("🔧 Capacities:", capacities);
  console.log("🔧 Lengths:", lengths);
  console.log("🔧 Connections:", endConnections);

  let html = '<div class="product-configurator">';
  html +=
    '<h3 class="configurator-title">🛠️ Let\'s Customize Your Product</h3>';

  html += '<div class="configurator-options">';

  // Track which standard fields actually have values
  const hasStandardCapacity = capacities.length > 0;
  const hasStandardLength = lengths.length > 0;
  const hasStandardConnection = endConnections.length > 0;

  if (hasStandardCapacity) {
    html += '<div class="configurator-option">';
    html += '<label class="configurator-label">Capacity *</label>';
    html +=
      '<select id="capacity-select" class="configurator-select" onchange="updateConfiguration()">';
    html += '<option value="">Select capacity...</option>';
    capacities.forEach(function (capacity) {
      html += '<option value="' + capacity + '">' + capacity + "</option>";
    });
    html += "</select>";
    html += "</div>";
  }

  if (hasStandardLength) {
    html += '<div class="configurator-option">';
    html += '<label class="configurator-label">Length *</label>';
    html +=
      '<select id="length-select" class="configurator-select" onchange="updateConfiguration()" disabled>';
    html += '<option value="">Select length...</option>';
    html += "</select>";
    html += "</div>";
  }

  if (hasStandardConnection) {
    html += '<div class="configurator-option">';
    html += '<label class="configurator-label">End Connection *</label>';
    html +=
      '<select id="connection-select" class="configurator-select" onchange="updateConfiguration()" disabled>';
    html += '<option value="">Select end connection...</option>';
    html += "</select>";
    html += "</div>";
  }

  // 🆕 Add custom field dropdowns (only skip if standard field exists WITH values)
  customFieldsMap.forEach((values, fieldName) => {
    const normalizedFieldName = fieldName.toLowerCase().replace(/\s+/g, "");

    // 🔥 FIX: Only skip if standard field actually has values
    if (
      (normalizedFieldName === "capacity" && hasStandardCapacity) ||
      (normalizedFieldName === "length" && hasStandardLength) ||
      (normalizedFieldName === "endconnection" && hasStandardConnection) ||
      (normalizedFieldName === "connection" && hasStandardConnection) ||
      (normalizedFieldName === "connectiontype" && hasStandardConnection)
    ) {
      console.log("⚠ Skipping duplicate field (standard exists):", fieldName);
      return;
    }

    const fieldId = "custom-" + fieldName.replace(/\s+/g, "-").toLowerCase();
    html += '<div class="configurator-option">';
    html += '<label class="configurator-label">' + fieldName + " *</label>";
    html +=
      '<select id="' +
      fieldId +
      '" class="configurator-select" data-custom-field="' +
      fieldName +
      '" onchange="updateConfiguration()">';
    html +=
      '<option value="">Select ' + fieldName.toLowerCase() + "...</option>";
    Array.from(values)
      .sort()
      .forEach(function (value) {
        html += '<option value="' + value + '">' + value + "</option>";
      });
    html += "</select>";
    html += "</div>";
  });

  html += "</div>";

  html +=
    '<div id="selected-variant-info" style="display: none;" class="selected-variant-info">';
  html += '<div class="selected-variant-label">Selected Model:</div>';
  html +=
    '<div class="selected-variant-model" id="selected-model-number">-</div>';
  html += "</div>";

  html +=
    '<div id="variant-price-display" style="display: none;" class="variant-price-info">';
  html += '<div class="price-label">Price:</div>';
  html += '<div class="price-amount" id="price-amount">-</div>';
  html += "</div>";

  html +=
    '<button id="purchase-btn" class="configurator-cta" onclick="handlePurchase()" disabled>';
  html += "🛒 Purchase Now";
  html += "</button>";

  html += '<div class="configurator-help">';
  html +=
    'Need help? <a href="/contact" style="color: #3b82f6; text-decoration: underline;">Contact our team</a>';
  html += "</div>";

  html += "</div>";

  const imgEl = document.querySelector('[data-product-detail="image"]');
  if (imgEl && imgEl.parentElement) {
    imgEl.parentElement.insertAdjacentHTML("afterend", html);
  } else {
    const contentEl = document.querySelector('[data-product-detail="content"]');
    if (contentEl) {
      contentEl.insertAdjacentHTML("beforebegin", html);
    }
  }

  console.log("✓ Configurator displayed with custom fields");

  setTimeout(function () {
    if (capacities.length === 1) {
      document.getElementById("capacity-select").value = capacities[0];
      updateConfiguration();
    }
  }, 100);
}

function updateConfiguration() {
  console.log("🔄 updateConfiguration called");

  const capacitySelect = document.getElementById("capacity-select");
  const lengthSelect = document.getElementById("length-select");
  const connectionSelect = document.getElementById("connection-select");

  // 🔥 FIX: If no standard fields exist, just call findSelectedVariant directly
  if (!capacitySelect && !lengthSelect && !connectionSelect) {
    console.log("✓ No standard fields, using custom fields only");
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
    availableLengths.forEach(function (length) {
      lengthSelect.innerHTML +=
        '<option value="' + length + '">' + length + "</option>";
    });

    lengthSelect.disabled = !selectedCapacity || availableLengths.length === 0;

    if (availableLengths.length === 1) {
      lengthSelect.value = availableLengths[0];
    } else if (
      currentLengthValue &&
      availableLengths.includes(currentLengthValue)
    ) {
      lengthSelect.value = currentLengthValue;
    }

    const selectedLength = lengthSelect.value;
    if (selectedLength) {
      filteredVariants = filteredVariants.filter(
        (v) => v.length === selectedLength,
      );
    }
  }

  if (connectionSelect) {
    const currentConnectionValue = connectionSelect.value;
    const availableConnections = [
      ...new Set(filteredVariants.map((v) => v.endConnection).filter(Boolean)),
    ].sort();

    connectionSelect.innerHTML =
      '<option value="">Select end connection...</option>';
    availableConnections.forEach(function (connection) {
      connectionSelect.innerHTML +=
        '<option value="' + connection + '">' + connection + "</option>";
    });

    connectionSelect.disabled =
      !selectedCapacity || availableConnections.length === 0;

    if (availableConnections.length === 1) {
      connectionSelect.value = availableConnections[0];
    } else if (
      currentConnectionValue &&
      availableConnections.includes(currentConnectionValue)
    ) {
      connectionSelect.value = currentConnectionValue;
    }
  }

  findSelectedVariant();
}

// 🆕 UPDATED: Find variant with custom fields support
function findSelectedVariant() {
  const capacitySelect = document.getElementById("capacity-select");
  const lengthSelect = document.getElementById("length-select");
  const connectionSelect = document.getElementById("connection-select");
  const purchaseBtn = document.getElementById("purchase-btn");
  const variantInfo = document.getElementById("selected-variant-info");
  const modelNumber = document.getElementById("selected-model-number");
  const priceDisplay = document.getElementById("variant-price-display");
  const priceAmount = document.getElementById("price-amount");

  // Get standard field values (if they exist)
  const capacity = capacitySelect ? capacitySelect.value : null;
  const length = lengthSelect ? lengthSelect.value : null;
  const connection = connectionSelect ? connectionSelect.value : null;

  // 🆕 Get custom field selections
  const customFieldSelects = document.querySelectorAll("[data-custom-field]");
  const customFieldSelections = {};
  let allCustomFieldsSelected = true;

  customFieldSelects.forEach((select) => {
    const fieldName = select.getAttribute("data-custom-field");
    const value = select.value;
    if (value) {
      customFieldSelections[fieldName] = value;
    } else {
      allCustomFieldsSelected = false;
    }
  });

  console.log("🔍 Finding variant with:", {
    capacity,
    length,
    connection,
    customFields: customFieldSelections,
    allCustomFieldsSelected,
  });

  const hasStandardCapacity = capacitySelect && !capacitySelect.disabled;
  const hasStandardLength = lengthSelect && !lengthSelect.disabled;
  const hasStandardConnection = connectionSelect && !connectionSelect.disabled;
  const hasCustomFields = customFieldSelects.length > 0;

  // 🔥 FIX: Check if all required fields are selected
  const allRequiredSelected =
    (!hasStandardCapacity || capacity) &&
    (!hasStandardLength || length) &&
    (!hasStandardConnection || connection) &&
    (!hasCustomFields || allCustomFieldsSelected);

  console.log("✓ All required selected?", allRequiredSelected);

  if (!allRequiredSelected) {
    variantInfo.style.display = "none";
    priceDisplay.style.display = "none";
    purchaseBtn.disabled = true;
    return;
  }

  // Find variant matching all criteria — skip disabled variants
  selectedVariant = allVariants.find((v) => {
    if (v.enabled === false) return false;
    console.log("🔍 Checking variant:", v.modelNumber);
    console.log("  - Variant data:", v);

    const matchCapacity = !hasStandardCapacity || v.capacity === capacity;
    const matchLength = !hasStandardLength || v.length === length;
    const matchConnection =
      !hasStandardConnection || v.endConnection === connection;

    console.log("  - Standard field matches:", {
      matchCapacity,
      matchLength,
      matchConnection,
    });

    // 🆕 Check custom fields match
    let matchCustomFields = true;
    if (hasCustomFields) {
      console.log("  - Has custom fields to check");
      console.log("  - Variant customFields:", v.customFields);
      console.log("  - Looking for:", customFieldSelections);

      if (!v.customFields) {
        console.log("  - ❌ Variant has no customFields object");
        matchCustomFields = false;
      } else {
        Object.entries(customFieldSelections).forEach(([fieldName, value]) => {
          const variantValue = v.customFields[fieldName];
          const matches = variantValue === value;
          console.log(
            `  - Custom field "${fieldName}": variant="${variantValue}", looking for="${value}", matches=${matches}`,
          );
          if (!matches) {
            matchCustomFields = false;
          }
        });
      }
    }

    console.log("  - matchCustomFields:", matchCustomFields);

    const matches =
      matchCapacity && matchLength && matchConnection && matchCustomFields;

    console.log("  - FINAL MATCH:", matches);

    if (matches) {
      console.log("✅ FOUND MATCHING VARIANT:", v.modelNumber, v);
    }

    return matches;
  });

  console.log("Selected variant:", selectedVariant);

  // Remove existing preview button if any
  var existingPreviewBtn = document.getElementById("preview-btn");
  if (existingPreviewBtn) existingPreviewBtn.remove();

  var priceLabel = priceDisplay.querySelector(".price-label");

  if (selectedVariant) {
    variantInfo.style.display = "block";
    modelNumber.textContent =
      selectedVariant.modelNumber || "Model: " + selectedVariant.capacity;

    // Restore normal price label visibility
    if (priceLabel) priceLabel.style.display = "";
    priceAmount.removeAttribute("style");

    if (selectedVariant.price !== null && selectedVariant.price !== undefined) {
      priceDisplay.style.display = "block";
      priceAmount.textContent = "$" + selectedVariant.price.toFixed(2);
    } else {
      priceDisplay.style.display = "none";
    }

    purchaseBtn.disabled = false;

    // Show "Get Preview File" button if variant has a preview link
    if (selectedVariant.previewFileLink) {
      var previewBtn = document.createElement("button");
      previewBtn.id = "preview-btn";
      previewBtn.className = "configurator-cta";
      previewBtn.style.marginTop = "10px";
      previewBtn.style.background = "#1e3a8a";
      previewBtn.innerHTML = "📄 Get Preview File";
      previewBtn.onclick = function() { showPreviewClaimModal(selectedVariant); };
      purchaseBtn.parentNode.insertBefore(previewBtn, purchaseBtn.nextSibling);
    }
  } else if (allRequiredSelected) {
    // All dropdowns filled but matching variant is disabled — show "Not Available"
    variantInfo.style.display = "none";
    if (priceLabel) priceLabel.style.display = "none";
    priceDisplay.style.display = "block";
    priceAmount.textContent = "⚠ Not Available — select a different variation";
    priceAmount.style.cssText = "color:#ef4444;font-size:0.9rem;font-weight:600;background:#fef2f2;padding:0.5rem 0.75rem;border-radius:8px;border:1px solid #fecaca;display:inline-block;";
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

  console.log("Initiating purchase for variant:", selectedVariant);

  const purchaseBtn = document.getElementById("purchase-btn");
  const originalText = purchaseBtn.innerHTML;
  purchaseBtn.disabled = true;
  purchaseBtn.innerHTML = "⏳ Processing...";

  // Check if Stripe is configured - use Stripe Checkout API
  if (currentProductStripePaymentLink) {
    console.log(
      "✓ Using Stripe Checkout API for variant:",
      selectedVariant.modelNumber,
    );

    try {
      const response = await fetch(`${API_URL}/api/checkout/stripe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      if (data.success && data.checkoutUrl) {
        console.log("✓ Stripe Checkout URL received:", data.checkoutUrl);

        const checkoutWindow = window.open(data.checkoutUrl, "_blank");

        if (
          !checkoutWindow ||
          checkoutWindow.closed ||
          typeof checkoutWindow.closed === "undefined"
        ) {
          alert(
            "Popup blocked! Please allow popups for this site and try again.",
          );
        }
      } else {
        console.error("Stripe Checkout failed:", data);
        alert(
          "Failed to create checkout: " + (data.error || "Please try again."),
        );
      }

      purchaseBtn.disabled = false;
      purchaseBtn.innerHTML = originalText;
      return;
    } catch (error) {
      console.error("Stripe Checkout error:", error);
      alert("An error occurred. Please try again.");
      purchaseBtn.disabled = false;
      purchaseBtn.innerHTML = originalText;
      return;
    }
  }

  // Fallback to Lemon Squeezy checkout
  try {
    const response = await fetch(`${API_URL}/api/checkout/lemon-squeezy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    if (data.success && data.checkoutUrl) {
      console.log("✓ Checkout URL received:", data.checkoutUrl);

      const checkoutWindow = window.open(data.checkoutUrl, "_blank");

      if (
        !checkoutWindow ||
        checkoutWindow.closed ||
        typeof checkoutWindow.closed === "undefined"
      ) {
        alert(
          "Popup blocked! Please allow popups for this site and try again.",
        );
      }

      purchaseBtn.disabled = false;
      purchaseBtn.innerHTML = originalText;
    } else {
      console.error("Checkout failed:", data);
      alert(
        "Failed to create checkout: " + (data.error || "Please try again."),
      );
      purchaseBtn.disabled = false;
      purchaseBtn.innerHTML = originalText;
    }
  } catch (error) {
    console.error("Purchase error:", error);
    alert("An error occurred. Please try again.");
    purchaseBtn.disabled = false;
    purchaseBtn.innerHTML = originalText;
  }
}

function renderProductContentBlocks(blocks) {
  return blocks
    .map(function (block) {
      const marginTop = block.marginTop || 0;
      const marginBottom = block.marginBottom || 20;
      const baseStyle =
        "margin-top: " +
        marginTop +
        "px; margin-bottom: " +
        marginBottom +
        "px;";

      switch (block.type) {
        case "heading":
          const level = block.level || 2;
          const headingStyle =
            baseStyle +
            " font-family: 'Montserrat', sans-serif; font-weight: " +
            (level === 1 ? "700" : level === 2 ? "600" : "500") +
            "; line-height: 1.3;";
          return (
            "<h" +
            level +
            ' style="' +
            headingStyle +
            '">' +
            block.content +
            "</h" +
            level +
            ">"
          );

        case "paragraph":
          const paragraphStyle =
            baseStyle +
            " font-family: 'Open Sans', sans-serif; line-height: 1.8; font-size: 1rem;";
          var paragraphContent = block.content.replace(/<a /gi, '<a target="_blank" rel="noopener noreferrer" ');
          return '<p style="' + paragraphStyle + '">' + paragraphContent + "</p>";

        case "list":
          const listTag = block.listType === "numbered" ? "ol" : "ul";
          const listStyle =
            baseStyle +
            " font-family: 'Open Sans', sans-serif; line-height: 1.8; font-size: 1rem; " +
            (block.listType === "numbered"
              ? "list-style-type: decimal; padding-left: 2rem;"
              : "list-style-type: disc; padding-left: 2rem;");
          const items = block.listItems || [];
          const itemsHtml = items
            .map(function (item) {
              return '<li style="margin-bottom: 0.5rem;">' + item + "</li>";
            })
            .join("");
          return (
            "<" +
            listTag +
            ' style="' +
            listStyle +
            '">' +
            itemsHtml +
            "</" +
            listTag +
            ">"
          );

        case "specifications":
          const specs = block.specs || [];
          const specsHtml = specs
            .map(function (spec) {
              return (
                '<div style="display: flex; padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">' +
                "<div style=\"flex: 1; font-weight: 600; font-family: 'Montserrat', sans-serif; color: #374151;\">" +
                spec.label +
                ":</div>" +
                "<div style=\"flex: 1; font-family: 'Open Sans', sans-serif; color: #6b7280;\">" +
                spec.value +
                "</div>" +
                "</div>"
              );
            })
            .join("");
          return (
            '<div style="' +
            baseStyle +
            ' background: #f9fafb; padding: 1.5rem; border-radius: 8px;">' +
            specsHtml +
            "</div>"
          );

        case "image":
          const imageStyle =
            baseStyle +
            " width: 400px; height: 400px; object-fit: contain; display: block; border-radius: 8px; background: #f9fafb;";
          return (
            '<div style="display: flex; justify-content: center; margin: 1rem 0;">' +
            '<img src="' +
            block.content +
            '" alt="' +
            (block.alt || "") +
            '" style="' +
            imageStyle +
            '" />' +
            "</div>"
          );
        case "quote-form":
          return (
            '<div style="' +
            baseStyle +
            ' background: #fef3c7; padding: 2rem; border-radius: 8px; border: 2px solid #fbbf24;">' +
            "<h3 style=\"font-family: 'Montserrat', sans-serif; font-weight: 600; margin-bottom: 1rem; color: #92400e;\">" +
            (block.content || "Request a Quote") +
            "</h3>" +
            "<p style=\"font-family: 'Open Sans', sans-serif; color: #78350f; margin-bottom: 1rem;\">Contact us for pricing and availability.</p>" +
            '<a href="/contact" style="display: inline-block; padding: 0.75rem 1.5rem; background: #f59e0b; color: white; text-decoration: none; border-radius: 4px; font-family: \'Montserrat\', sans-serif; font-weight: 500;">Get Quote</a>' +
            "</div>"
          );

        case "divider":
          return (
            '<hr style="' +
            baseStyle +
            ' border: 0; border-top: 2px solid #e5e7eb;" />'
          );

        case "columnList":
          const columns = block.columns || [];
          if (columns.length === 0) return "";

          const columnCount = columns.length;
          let gridColumns = "";
          if (columnCount === 1) gridColumns = "1fr";
          else if (columnCount === 2) gridColumns = "1fr 1fr";
          else if (columnCount === 3) gridColumns = "1fr 1fr 1fr";
          else if (columnCount === 4) gridColumns = "1fr 1fr 1fr 1fr";
          else gridColumns = "repeat(" + columnCount + ", 1fr)";

          let columnsHtml =
            '<div style="' +
            baseStyle +
            " display: grid; grid-template-columns: " +
            gridColumns +
            '; gap: 2rem; margin-top: 1.5rem;">';

          columns.forEach(function (column) {
            columnsHtml += "<div>";

            if (column.title) {
              columnsHtml +=
                "<h4 style=\"font-family: 'Montserrat', sans-serif; font-size: 1.25rem; font-weight: bold; color: #1e3a8a; margin-bottom: 1rem;\">" +
                column.title +
                "</h4>";
            }

            if (column.items && column.items.length > 0) {
              columnsHtml +=
                "<ul style=\"font-family: 'Open Sans', sans-serif; line-height: 1.75; color: #4b5563; list-style: none; padding: 0;\">";
              column.items.forEach(function (item) {
                columnsHtml +=
                  '<li style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem;">';
                columnsHtml +=
                  '<span style="color: #00bcd4; font-size: 1.25rem; line-height: 1;">☑</span>';
                columnsHtml += "<span>" + item + "</span>";
                columnsHtml += "</li>";
              });
              columnsHtml += "</ul>";
            }

            columnsHtml += "</div>";
          });

          columnsHtml += "</div>";
          return columnsHtml;

        default:
          return "";
      }
    })
    .join("");
}

// 🆕 UPDATED: Display variants table with custom fields
function displayVariants(variants) {
  const tableContainer = document.querySelector(
    '[data-product-detail="variants-table"]',
  );

  if (!tableContainer) {
    console.error("✗ Variants container not found");
    return;
  }

  console.log("✓ Displaying variants with pagination and custom fields");

  // 🆕 Get all unique custom field names
  const customFieldNames = new Set();
  variants.forEach((variant) => {
    if (variant.customFields) {
      Object.keys(variant.customFields).forEach((key) =>
        customFieldNames.add(key),
      );
    }
  });

  const totalPages = Math.ceil(variants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVariants = variants.slice(startIndex, endIndex);

  let tableHtml = '<div class="variants-table-container">';
  tableHtml +=
    "<h2 style=\"font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 1.5rem; margin-bottom: 1rem;\">Available Models</h2>";
  tableHtml += '<table class="variants-table">';
  tableHtml += "<thead><tr>";
  tableHtml += "<th>Model Number</th>";

  const hasCapacity = variants.some((v) => v.capacity);
  if (hasCapacity) tableHtml += "<th>Capacity</th>";

  const hasLength = variants.some((v) => v.length);
  if (hasLength) tableHtml += "<th>Length</th>";

  const hasEndConnection = variants.some((v) => v.endConnection);
  if (hasEndConnection) tableHtml += "<th>End Connection</th>";

  // 🆕 Add custom field headers
  Array.from(customFieldNames).forEach((fieldName) => {
    tableHtml += "<th>" + fieldName.toUpperCase() + "</th>";
  });

  // Add Price column header if any variant has a price
  var hasPrice = variants.some(function(v) { return v.price !== null && v.price !== undefined; });
  if (hasPrice) tableHtml += "<th>Price</th>";

  tableHtml += "</tr></thead><tbody>";

  paginatedVariants.forEach(function (variant) {
    var isDisabled = variant.enabled === false;
    tableHtml += "<tr" + (isDisabled ? ' style="opacity:0.6;"' : "") + ">";
    tableHtml +=
      "<td><strong>" + (variant.modelNumber || "N/A") + "</strong>" +
      (isDisabled ? ' <span style="font-size:0.75rem;color:#ef4444;font-weight:600;">⊘ Disabled</span>' : "") + "</td>";
    if (hasCapacity) tableHtml += "<td>" + (variant.capacity || "-") + "</td>";
    if (hasLength) tableHtml += "<td>" + (variant.length || "-") + "</td>";
    if (hasEndConnection)
      tableHtml += "<td>" + (variant.endConnection || "-") + "</td>";

    // Add custom field values
    Array.from(customFieldNames).forEach((fieldName) => {
      const value = variant.customFields?.[fieldName] || "-";
      tableHtml += "<td>" + value + "</td>";
    });

    // Price cell
    if (hasPrice) {
      if (isDisabled) {
        tableHtml += '<td><span style="color:#9ca3af;font-size:0.85rem;">Not Available</span></td>';
      } else if (variant.price !== null && variant.price !== undefined) {
        tableHtml += "<td><strong>$" + variant.price.toFixed(2) + "</strong></td>";
      } else {
        tableHtml += "<td>—</td>";
      }
    }

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

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      tableHtml +=
        '<button class="pagination-button" onclick="goToPage(1)">1</button>';
      if (startPage > 2) {
        tableHtml += '<span class="pagination-info">...</span>';
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? " active" : "";
      tableHtml +=
        '<button class="pagination-button' +
        activeClass +
        '" onclick="goToPage(' +
        i +
        ')">' +
        i +
        "</button>";
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        tableHtml += '<span class="pagination-info">...</span>';
      }
      tableHtml +=
        '<button class="pagination-button" onclick="goToPage(' +
        totalPages +
        ')">' +
        totalPages +
        "</button>";
    }

    tableHtml +=
      '<button class="pagination-button" onclick="goToPage(' +
      (currentPage + 1) +
      ')" ' +
      (currentPage === totalPages ? "disabled" : "") +
      ">Next →</button>";

    const showingStart = startIndex + 1;
    const showingEnd = Math.min(endIndex, variants.length);
    tableHtml +=
      '<span class="pagination-info">Showing ' +
      showingStart +
      "-" +
      showingEnd +
      " of " +
      variants.length +
      "</span>";

    tableHtml += "</div>";
  }

  tableHtml += "</div>";

  // 🆕 Mobile cards with custom fields
  let cardsHtml = '<div class="variants-cards">';
  cardsHtml +=
    "<h2 style=\"font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 1.5rem; margin-bottom: 1rem;\">Available Models</h2>";

  variants.forEach(function (variant) {
    cardsHtml += '<div class="variant-card">';
    cardsHtml +=
      '<div class="variant-card-header">' +
      (variant.modelNumber || "Variant") +
      "</div>";

    if (variant.capacity) {
      cardsHtml += '<div class="variant-card-row">';
      cardsHtml += '<div class="variant-card-label">Capacity</div>';
      cardsHtml +=
        '<div class="variant-card-value">' + variant.capacity + "</div>";
      cardsHtml += "</div>";
    }

    if (variant.length) {
      cardsHtml += '<div class="variant-card-row">';
      cardsHtml += '<div class="variant-card-label">Length</div>';
      cardsHtml +=
        '<div class="variant-card-value">' + variant.length + "</div>";
      cardsHtml += "</div>";
    }

    if (variant.endConnection) {
      cardsHtml += '<div class="variant-card-row">';
      cardsHtml += '<div class="variant-card-label">End Connection</div>';
      cardsHtml +=
        '<div class="variant-card-value">' + variant.endConnection + "</div>";
      cardsHtml += "</div>";
    }

    // 🆕 Add custom fields to mobile cards
    if (variant.customFields) {
      Object.entries(variant.customFields).forEach(([fieldName, value]) => {
        cardsHtml += '<div class="variant-card-row">';
        cardsHtml += '<div class="variant-card-label">' + fieldName + "</div>";
        cardsHtml += '<div class="variant-card-value">' + value + "</div>";
        cardsHtml += "</div>";
      });
    }

    cardsHtml += "</div>";
  });

  cardsHtml += "</div>";

  tableContainer.innerHTML = tableHtml + cardsHtml;
  console.log("✓ Variants displayed with custom fields (table + cards)");
}

function goToPage(pageNumber) {
  currentPage = pageNumber;
  displayVariants(allVariants);

  const tableContainer = document.querySelector(
    '[data-product-detail="variants-table"]',
  );
  if (tableContainer) {
    tableContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function showError(message) {
  const contentEl = document.querySelector('[data-product-detail="content"]');
  if (contentEl) {
    contentEl.innerHTML =
      '<div style="text-align: center; padding: 3rem;">' +
      "<p style=\"color: #ef4444; font-size: 1.25rem; font-family: 'Open Sans', sans-serif; margin-bottom: 1rem;\">" +
      message +
      '</p><a href="/" style="color: #3b82f6; text-decoration: underline; font-family: \'Open Sans\', sans-serif;">← Back to Home</a>' +
      "</div>";
  }
}

function showPreviewClaimModal(variant) {
  // Remove existing modal if any
  var existing = document.getElementById("preview-claim-modal");
  if (existing) existing.remove();

  var productSlug = getSlugFromURL();
  var productTitle = document.querySelector('[data-product-detail="title"]')?.textContent || "";

  var overlay = document.createElement("div");
  overlay.id = "preview-claim-modal";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;";

  overlay.innerHTML = [
    '<div style="background:#fff;border-radius:16px;padding:2rem;max-width:440px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">',
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">',
        '<h2 style="font-family:Montserrat,sans-serif;font-size:1.25rem;font-weight:700;color:#1e3a8a;margin:0;">📄 Get Your Preview File</h2>',
        '<button id="modal-close-btn" style="background:none;border:none;cursor:pointer;font-size:1.5rem;color:#9ca3af;line-height:1;">×</button>',
      '</div>',
      '<p style="font-family:Open Sans,sans-serif;color:#6b7280;font-size:0.875rem;margin-bottom:1.25rem;">',
        'Selected: <strong style="color:#1f2937;">' + (variant.modelNumber || "") + '</strong>',
      '</p>',
      '<div id="modal-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:8px;padding:0.75rem;font-size:0.875rem;margin-bottom:1rem;font-family:Open Sans,sans-serif;"></div>',
      '<div style="margin-bottom:1rem;">',
        '<label style="display:block;font-family:Open Sans,sans-serif;font-size:0.875rem;font-weight:600;color:#374151;margin-bottom:0.4rem;">Full Name *</label>',
        '<input id="modal-name" type="text" placeholder="Jane Smith" style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border:1px solid #d1d5db;border-radius:8px;font-family:Open Sans,sans-serif;font-size:0.9rem;outline:none;" />',
      '</div>',
      '<div style="margin-bottom:1.5rem;">',
        '<label style="display:block;font-family:Open Sans,sans-serif;font-size:0.875rem;font-weight:600;color:#374151;margin-bottom:0.4rem;">Email Address *</label>',
        '<input id="modal-email" type="email" placeholder="jane@example.com" style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border:1px solid #d1d5db;border-radius:8px;font-family:Open Sans,sans-serif;font-size:0.9rem;outline:none;" />',
      '</div>',
      '<div id="modal-success" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:8px;padding:0.75rem;font-size:0.875rem;margin-bottom:1rem;font-family:Open Sans,sans-serif;"></div>',
      '<div style="display:flex;gap:0.75rem;">',
        '<button id="modal-submit-btn" style="flex:1;padding:0.75rem;background:#1e3a8a;color:#fff;border:none;border-radius:8px;font-family:Montserrat,sans-serif;font-weight:600;font-size:0.9rem;cursor:pointer;">Claim Preview File</button>',
        '<button id="modal-cancel-btn" style="padding:0.75rem 1.25rem;background:#f3f4f6;color:#374151;border:none;border-radius:8px;font-family:Montserrat,sans-serif;font-weight:600;font-size:0.9rem;cursor:pointer;">Cancel</button>',
      '</div>',
    '</div>'
  ].join("");

  document.body.appendChild(overlay);

  document.getElementById("modal-close-btn").onclick = function() { overlay.remove(); };
  document.getElementById("modal-cancel-btn").onclick = function() { overlay.remove(); };
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  document.getElementById("modal-submit-btn").onclick = async function() {
    var name = document.getElementById("modal-name").value.trim();
    var email = document.getElementById("modal-email").value.trim();
    var errorEl = document.getElementById("modal-error");
    var successEl = document.getElementById("modal-success");
    var submitBtn = document.getElementById("modal-submit-btn");

    errorEl.style.display = "none";
    successEl.style.display = "none";

    if (!name || !email) {
      errorEl.textContent = "Please enter your name and email.";
      errorEl.style.display = "block";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      var res = await fetch(API_URL + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          email: email,
          productSlug: productSlug,
          productTitle: productTitle,
          variantId: variant.id,
          variantModel: variant.modelNumber,
          previewFileLink: variant.previewFileLink,
        }),
      });
      var data = await res.json();

      if (data.success) {
        successEl.innerHTML = "✅ Success! " +
          (data.previewFileLink
            ? 'Your preview file is ready: <a href="' + data.previewFileLink + '" target="_blank" style="color:#166534;font-weight:700;text-decoration:underline;">Open Preview File</a>'
            : "We have recorded your request.");
        successEl.style.display = "block";
        submitBtn.style.display = "none";
        document.getElementById("modal-cancel-btn").textContent = "Close";
        if (data.previewFileLink) {
          window.open(data.previewFileLink, "_blank");
        }
      } else {
        errorEl.textContent = data.error || "Something went wrong. Please try again.";
        errorEl.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.textContent = "Claim Preview File";
      }
    } catch (err) {
      errorEl.textContent = "Network error. Please try again.";
      errorEl.style.display = "block";
      submitBtn.disabled = false;
      submitBtn.textContent = "Claim Preview File";
    }
  };
}

// Initialize
loadGoogleFonts();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(loadProductDetail, 500);
  });
} else {
  setTimeout(loadProductDetail, 500);
}

console.log(
  "✓ Product detail script loaded with custom fields and Stripe Payment Link support",
);
