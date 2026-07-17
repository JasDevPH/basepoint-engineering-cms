const API_URL = "https://cms.basepointengineering.com";

// ── Helper ────────────────────────────────
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

// ── Skeleton ──────────────────────────────
const SKEL = "linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)";
const SKEL_STYLE =
  "background:" +
  SKEL +
  ";background-size:200% 100%;animation:skel-shimmer 1.5s infinite;border-radius:6px;display:block;";

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

function showSkeleton() {
  // Featured image skeleton
  const imgEl = document.querySelector('[data-blog-detail="image"]');
  if (imgEl) {
    imgEl.style.cssText =
      "width:100%;height:420px;" + SKEL_STYLE + "border-radius:0;";
    imgEl.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  }

  // Title skeleton
  const titleEl = document.querySelector('[data-blog-detail="title"]');
  if (titleEl) {
    titleEl.innerHTML =
      skelBar("75%", "2.25rem", "0.5rem") + skelBar("50%", "2.25rem", "0");
  }

  // Author skeleton
  const authorEl = document.querySelector('[data-blog-detail="author"]');
  if (authorEl) authorEl.innerHTML = skelBar("20%", "1rem", "0");

  // Date skeleton
  const dateEl = document.querySelector('[data-blog-detail="date"]');
  if (dateEl) dateEl.innerHTML = skelBar("25%", "1rem", "0");

  // Breadcrumb skeleton — inject before content
  const contentTarget = document.querySelector('[data-blog-detail="content"]');
  if (contentTarget && contentTarget.parentElement) {
    let existingSkel = document.getElementById("breadcrumb-skel");
    if (!existingSkel) {
      existingSkel = document.createElement("div");
      existingSkel.id = "breadcrumb-skel";
      existingSkel.style.cssText =
        "display:flex;align-items:center;gap:8px;padding:12px 0;margin-bottom:1rem;";
      existingSkel.innerHTML =
        '<div style="height:0.875rem;width:35px;' +
        SKEL_STYLE +
        '"></div>' +
        '<div style="height:0.875rem;width:8px;' +
        SKEL_STYLE +
        '"></div>' +
        '<div style="height:0.875rem;width:45px;' +
        SKEL_STYLE +
        '"></div>' +
        '<div style="height:0.875rem;width:8px;' +
        SKEL_STYLE +
        '"></div>' +
        '<div style="height:0.875rem;width:120px;' +
        SKEL_STYLE +
        '"></div>';
      contentTarget.parentElement.insertBefore(existingSkel, contentTarget);
    }
  }

  // Content skeleton
  if (contentTarget) {
    let html = "";
    // Heading
    html += skelBar("55%", "1.75rem", "1.5rem");
    // Paragraphs
    for (let i = 0; i < 3; i++) {
      html += skelBar("100%", "1rem");
      html += skelBar("100%", "1rem");
      html += skelBar(i % 2 === 0 ? "80%" : "65%", "1rem", "1.5rem");
    }
    // Subheading
    html += skelBar("40%", "1.5rem", "1rem");
    // More paragraph lines
    for (let i = 0; i < 4; i++) {
      html += skelBar(i === 3 ? "60%" : "100%", "1rem");
    }
    // Image placeholder
    html +=
      '<div style="width:100%;height:300px;' +
      SKEL_STYLE +
      'border-radius:8px;margin-top:1.5rem;margin-bottom:1.5rem;"></div>';
    // More content
    for (let i = 0; i < 3; i++) {
      html += skelBar(i === 2 ? "70%" : "100%", "1rem");
    }
    contentTarget.innerHTML = html;
  }
}

function clearSkeletons() {
  const breadcrumbSkel = document.getElementById("breadcrumb-skel");
  if (breadcrumbSkel) breadcrumbSkel.remove();

  // Reset image style
  const imgEl = document.querySelector('[data-blog-detail="image"]');
  if (imgEl) imgEl.style.cssText = "";
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

// ── Load blog detail ──────────────────────
async function loadBlogDetail() {
  const slug = getSlugFromURL();
  if (!slug) {
    showError("No blog slug provided");
    return;
  }

  // Show skeleton immediately — no spinner
  showSkeleton();

  try {
    const response = await fetch(API_URL + "/api/blogs/" + slug);
    const data = await response.json();
    if (data.success) {
      displayBlogDetail(data.data);
    } else {
      showError("Blog post not found");
    }
  } catch (error) {
    console.error("Error loading blog:", error);
    showError("Failed to load blog post. Please try again.");
  }
}

function displayBlogDetail(blog) {
  // Clear skeletons before populating real content
  clearSkeletons();

  document.title = blog.title + " - Basepoint Engineering";

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content =
    blog.excerpt ||
    (blog.content
      ? blog.content
          .replace(/<[^>]*>/g, "")
          .substring(0, 155)
          .trim() + "..."
      : "") ||
    "Read " + blog.title + " on the Basepoint Engineering blog.";

  setMetaTag("og:title", blog.title + " - Basepoint Engineering");
  setMetaTag("twitter:title", blog.title + " - Basepoint Engineering");
  setMetaTag("og:description", metaDesc.content);
  setMetaTag("twitter:description", metaDesc.content);
  setMetaTag("og:url", window.location.href);
  setMetaTag("og:type", "article");
  setMetaTag("twitter:card", "summary_large_image");
  if (blog.imageUrl) {
    setMetaTag("og:image", blog.imageUrl);
    setMetaTag("twitter:image", blog.imageUrl);
  }

  injectBlogBreadcrumb(blog.title);

  // Title
  const titleEl = document.querySelector('[data-blog-detail="title"]');
  if (titleEl) {
    titleEl.textContent = blog.title;
    titleEl.style.fontFamily = "'Montserrat', sans-serif";
    titleEl.style.fontWeight = "700";
  }

  // Image
  const imgEl = document.querySelector('[data-blog-detail="image"]');
  if (imgEl && blog.imageUrl) {
    imgEl.style.cssText = "";
    imgEl.src = blog.imageUrl + "?t=" + new Date().getTime();
    imgEl.alt = blog.title;
    imgEl.style.width = "100%";
    imgEl.style.height = window.innerWidth <= 768 ? "260px" : "420px";
    imgEl.style.objectFit = "cover";
    imgEl.style.borderRadius = "0";
  }

  // Author
  const authorEl = document.querySelector('[data-blog-detail="author"]');
  if (authorEl && blog.author) {
    authorEl.textContent = "By " + blog.author;
    authorEl.style.fontFamily = "'Open Sans', sans-serif";
  } else if (authorEl) {
    authorEl.style.display = "none";
  }

  // Date
  const dateEl = document.querySelector('[data-blog-detail="date"]');
  if (dateEl && blog.publishedAt) {
    const date = new Date(blog.publishedAt);
    dateEl.textContent = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    dateEl.style.fontFamily = "'Open Sans', sans-serif";
  }

  // Content
  const contentEl = document.querySelector('[data-blog-detail="content"]');
  if (contentEl) {
    if (blog.contentBlocks && Array.isArray(blog.contentBlocks)) {
      contentEl.innerHTML = renderContentBlocks(blog.contentBlocks);
    } else if (blog.content) {
      contentEl.innerHTML =
        "<p style=\"font-family:'Open Sans',sans-serif;line-height:1.8;\">" +
        blog.content
          .replace(
            /\n\n/g,
            "</p><p style=\"font-family:'Open Sans',sans-serif;line-height:1.8;\">",
          )
          .replace(/\n/g, "<br>") +
        "</p>";
    }
  }

  if (blog.products && blog.products.length > 0)
    displayRelatedProducts(blog.products);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "view_blog_post",
    blog_title: blog.title,
    blog_slug: blog.slug,
    blog_author: blog.author || undefined,
  });
}

// ── Render content blocks ─────────────────
function renderContentBlocks(blocks) {
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

        case "image":
          return (
            '<img src="' +
            block.content +
            '" alt="' +
            (block.alt || "") +
            '" style="' +
            baseStyle +
            'max-width:100%;height:auto;display:block;border-radius:8px;" />'
          );

        case "embed":
          const content = block.content.trim();
          if (content.includes("<iframe") && content.includes("</iframe>")) {
            const srcMatch = content.match(/src=["']([^"']+)["']/);
            const embedUrl = srcMatch ? srcMatch[1] : null;
            return (
              '<div style="' +
              baseStyle +
              'position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;">' +
              '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" src="' +
              (embedUrl || "") +
              '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
            );
          } else if (
            content.includes("youtube.com") ||
            content.includes("youtu.be")
          ) {
            const videoId = extractYouTubeId(content);
            if (videoId)
              return (
                '<div style="' +
                baseStyle +
                'position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" src="https://www.youtube.com/embed/' +
                videoId +
                '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
              );
          } else if (content.includes("vimeo.com")) {
            const videoId = extractVimeoId(content);
            if (videoId)
              return (
                '<div style="' +
                baseStyle +
                'position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" src="https://player.vimeo.com/video/' +
                videoId +
                '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>'
              );
          }
          return (
            '<a href="' +
            content +
            '" target="_blank" rel="noopener noreferrer" style="' +
            baseStyle +
            "display:block;color:#3b82f6;text-decoration:underline;font-family:'Open Sans',sans-serif;" +
            '">' +
            content +
            "</a>"
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

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];
  for (let i = 0; i < patterns.length; i++) {
    const match = url.match(patterns[i]);
    if (match && match[1]) return match[1];
  }
  return "";
}

function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : "";
}

// ── Breadcrumb ────────────────────────────
function injectBlogBreadcrumb(blogTitle) {
  var existing = document.querySelector(".bp-breadcrumb");
  if (existing) existing.remove();

  var breadcrumbHTML =
    '<nav class="bp-breadcrumb" aria-label="Breadcrumb">' +
    '<a href="https://basepointengineering.com">Home</a>' +
    '<span class="bp-separator">›</span>' +
    '<a href="https://basepointengineering.com/blogs">Blogs</a>' +
    '<span class="bp-separator">›</span>' +
    '<span class="bp-current">' +
    blogTitle +
    "</span>" +
    "</nav>";

  var target = document.querySelector('[data-blog-detail="content"]');
  if (target && target.parentElement) {
    var div = document.createElement("div");
    div.innerHTML = breadcrumbHTML;
    target.parentElement.insertBefore(div.firstChild, target);
  }

  var existingSchema = document.getElementById("bp-breadcrumb-schema");
  if (existingSchema) existingSchema.remove();

  var slug = getSlugFromURL();
  var script = document.createElement("script");
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
          name: "Blogs",
          item: "https://basepointengineering.com/blogs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: blogTitle,
          item:
            "https://basepointengineering.com/blog-detail?slug=" +
            encodeURIComponent(slug || ""),
        },
      ],
    },
    null,
    2,
  );
  document.head.appendChild(script);
}

// ── Related products carousel ─────────────
function displayRelatedProducts(products) {
  if (!products || products.length === 0) return;

  var items = products.slice(0, 12);

  var html = '<div class="related-products-section">';
  html += '<div class="related-products-header">';
  html += '<h2 class="related-products-title">Related Products</h2>';
  html += '<div class="related-products-nav">';
  html +=
    '<button type="button" class="related-products-arrow" onclick="scrollProductCarousel(-1)" aria-label="Scroll left">‹</button>';
  html +=
    '<button type="button" class="related-products-arrow" onclick="scrollProductCarousel(1)" aria-label="Scroll right">›</button>';
  html += "</div></div>";
  html += '<div class="related-products-row" id="related-products-row">';

  items.forEach(function (p) {
    html +=
      '<a class="related-product-card" href="https://basepointengineering.com/product-detail?slug=' +
      encodeURIComponent(p.slug) +
      '">';
    html += '<div class="related-product-image-wrap">';
    if (p.imageUrl) {
      html += '<img src="' + p.imageUrl + '" alt="' + p.title + '">';
    } else {
      html +=
        '<div style="width:100%;height:140px;background:#f3f4f6;"></div>';
    }
    html += "</div>";
    html += '<div class="related-product-card-body">';
    if (p.category) {
      html +=
        '<span class="related-product-category">' + p.category + "</span>";
    }
    html +=
      '<span class="related-product-drawing-badge">Technical Drawing</span>';
    html += '<div class="related-product-title">' + p.title + "</div>";
    if (p.basePrice != null) {
      html +=
        '<div class="related-product-price">CA$' +
        p.basePrice.toFixed(2) +
        "</div>";
    } else {
      html += '<div class="related-product-price">View Product →</div>';
    }
    html += "</div></a>";
  });

  html +=
    '<a class="related-product-viewall" href="https://basepointengineering.com/products">View All<br>Products →</a>';

  html += "</div></div>";

  var anchor = document.querySelector('[data-blog-detail="content"]');
  if (anchor) anchor.insertAdjacentHTML("afterend", html);
}

function scrollProductCarousel(direction) {
  var row = document.getElementById("related-products-row");
  if (!row) return;
  row.scrollBy({ left: direction * 276, behavior: "smooth" });
}

// ── Error ─────────────────────────────────
function showError(message) {
  const contentEl = document.querySelector('[data-blog-detail="content"]');
  if (contentEl) {
    contentEl.innerHTML =
      '<div style="text-align:center;padding:3rem;"><p style="color:#ef4444;font-size:1.25rem;font-family:\'Open Sans\',sans-serif;margin-bottom:1rem;">' +
      message +
      '</p><a href="/" style="color:#3b82f6;text-decoration:underline;font-family:\'Open Sans\',sans-serif;font-size:1rem;">← Back to Home</a></div>';
  }
}

// ── Canonical ─────────────────────────────
(function () {
  const blogSlug = new URLSearchParams(window.location.search).get("slug");
  if (blogSlug) {
    const canonicalUrl =
      "https://basepointengineering.com/blog-detail?slug=" + blogSlug;
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
  document.addEventListener("DOMContentLoaded", loadBlogDetail);
} else {
  loadBlogDetail();
}
