const API_URL = "https://cms.basepointengineering.com";

// Create and show loading screen
function showLoading() {
  const existingLoader = document.getElementById("blog-loading-screen");
  if (existingLoader) return;

  const loader = document.createElement("div");
  loader.id = "blog-loading-screen";
  loader.className = "blog-loading-screen";
  loader.innerHTML = `
    <div class="blog-spinner"></div>
    <div class="blog-loading-text">Loading blog post...</div>
  `;
  document.body.appendChild(loader);
  console.log("✓ Loading screen shown");
}

// Hide loading screen
function hideLoading() {
  const loader = document.getElementById("blog-loading-screen");
  if (loader) {
    loader.classList.add("hidden");
    setTimeout(function () {
      loader.remove();
      console.log("✓ Loading screen hidden");
    }, 300);
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

// Fetch and display single blog
async function loadBlogDetail() {
  const slug = getSlugFromURL();
  console.log("Loading blog with slug:", slug);

  if (!slug) {
    hideLoading();
    showError("No blog slug provided");
    return;
  }

  // Show loading screen
  showLoading();

  try {
    const response = await fetch(`${API_URL}/api/blogs/${slug}`);
    const data = await response.json();

    console.log("Blog detail data:", data);

    if (data.success) {
      displayBlogDetail(data.data);
      // Hide loading after content is displayed
      setTimeout(hideLoading, 300);
    } else {
      hideLoading();
      showError("Blog post not found");
    }
  } catch (error) {
    console.error("Error loading blog:", error);
    hideLoading();
    showError("Failed to load blog post. Please try again.");
  }
}

function displayBlogDetail(blog) {
  console.log("Displaying blog:", blog.title);

  // Update page title
  document.title = blog.title + " - Basepoint Engineering";

  // Update blog title
  const titleEl = document.querySelector('[data-blog-detail="title"]');
  if (titleEl) {
    titleEl.textContent = blog.title;
    titleEl.style.fontFamily = "'Montserrat', sans-serif";
    titleEl.style.fontWeight = "700";
    console.log("✓ Title updated");
  }

  // Update featured image
  const imgEl = document.querySelector('[data-blog-detail="image"]');
  if (imgEl && blog.imageUrl) {
    imgEl.src = blog.imageUrl + "?t=" + new Date().getTime();
    imgEl.alt = blog.title;
    imgEl.style.width = "100%";
    imgEl.style.height = "auto";
    imgEl.style.objectFit = "cover";
    console.log("✓ Image updated");
  }

  // Update author
  const authorEl = document.querySelector('[data-blog-detail="author"]');
  if (authorEl && blog.author) {
    authorEl.textContent = "By " + blog.author;
    authorEl.style.fontFamily = "'Open Sans', sans-serif";
    console.log("✓ Author updated");
  } else if (authorEl) {
    authorEl.style.display = "none";
  }

  // Update date
  const dateEl = document.querySelector('[data-blog-detail="date"]');
  if (dateEl && blog.publishedAt) {
    const date = new Date(blog.publishedAt);
    const formattedDate = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    dateEl.textContent = formattedDate;
    dateEl.style.fontFamily = "'Open Sans', sans-serif";
    console.log("✓ Date updated");
  }

  // Update content
  const contentEl = document.querySelector('[data-blog-detail="content"]');
  if (contentEl) {
    if (blog.contentBlocks && Array.isArray(blog.contentBlocks)) {
      // Render structured content blocks
      contentEl.innerHTML = renderContentBlocks(blog.contentBlocks);
      console.log("✓ Structured content rendered");
    } else if (blog.content) {
      // Fallback to plain content
      contentEl.innerHTML =
        "<p style=\"font-family: 'Open Sans', sans-serif; line-height: 1.8;\">" +
        blog.content
          .replace(
            /\n\n/g,
            "</p><p style=\"font-family: 'Open Sans', sans-serif; line-height: 1.8;\">",
          )
          .replace(/\n/g, "<br>") +
        "</p>";
      console.log("✓ Plain content rendered");
    }
  }

  console.log("✓ Blog detail loaded successfully");
}

function renderContentBlocks(blocks) {
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
          return '<p style="' + paragraphStyle + '">' + block.content + "</p>";

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

        case "image":
          const imageStyle =
            baseStyle +
            " max-width: 100%; height: auto; display: block; border-radius: 8px;";
          return (
            '<img src="' +
            block.content +
            '" alt="' +
            (block.alt || "") +
            '" style="' +
            imageStyle +
            '" />'
          );

        case "embed":
          // FIXED: Properly extract and render YouTube embeds
          const content = block.content.trim();

          // Check if it's already an iframe (embed code)
          if (content.includes("<iframe") && content.includes("</iframe>")) {
            // Extract the iframe src URL
            const srcMatch = content.match(/src=["']([^"']+)["']/);
            if (srcMatch && srcMatch[1]) {
              const embedUrl = srcMatch[1];
              return (
                '<div style="' +
                baseStyle +
                ' position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">' +
                '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" ' +
                'src="' +
                embedUrl +
                '" ' +
                'frameborder="0" ' +
                'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
                "allowfullscreen></iframe></div>"
              );
            }
            // If we can't extract src, just clean and return the iframe
            return (
              '<div style="' +
              baseStyle +
              ' position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">' +
              content.replace(
                /style="[^"]*"/g,
                'style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"',
              ) +
              "</div>"
            );
          }
          // Check if it's a YouTube URL
          else if (
            content.includes("youtube.com") ||
            content.includes("youtu.be")
          ) {
            const videoId = extractYouTubeId(content);
            if (videoId) {
              return (
                '<div style="' +
                baseStyle +
                ' position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">' +
                '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" ' +
                'src="https://www.youtube.com/embed/' +
                videoId +
                '" ' +
                'frameborder="0" ' +
                'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
                "allowfullscreen></iframe></div>"
              );
            }
          }
          // Check if it's a Vimeo URL
          else if (content.includes("vimeo.com")) {
            const videoId = extractVimeoId(content);
            if (videoId) {
              return (
                '<div style="' +
                baseStyle +
                ' position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;">' +
                '<iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" ' +
                'src="https://player.vimeo.com/video/' +
                videoId +
                '" ' +
                'frameborder="0" ' +
                'allow="autoplay; fullscreen; picture-in-picture" ' +
                "allowfullscreen></iframe></div>"
              );
            }
          }

          // If nothing matched, just return a link
          const linkStyle =
            baseStyle +
            " display: block; color: #3b82f6; text-decoration: underline; font-family: 'Open Sans', sans-serif;";
          return (
            '<a href="' +
            content +
            '" target="_blank" rel="noopener noreferrer" style="' +
            linkStyle +
            '">' +
            content +
            "</a>"
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

          // Force columns to stay on one row - divide 100% by number of columns
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

            // Column Title
            if (column.title) {
              columnsHtml +=
                "<h4 style=\"font-family: 'Montserrat', sans-serif; font-size: 1.25rem; font-weight: bold; color: #1e3a8a; margin-bottom: 1rem;\">" +
                column.title +
                "</h4>";
            }

            // Column Items
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

function extractYouTubeId(url) {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = url.match(patterns[i]);
    if (match && match[1]) {
      return match[1];
    }
  }
  return "";
}

function extractVimeoId(url) {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : "";
}

function showError(message) {
  const contentEl = document.querySelector('[data-blog-detail="content"]');
  if (contentEl) {
    contentEl.innerHTML =
      '<div style="text-align: center; padding: 3rem;">' +
      "<p style=\"color: #ef4444; font-size: 1.25rem; font-family: 'Open Sans', sans-serif; margin-bottom: 1rem;\">" +
      message +
      '</p><a href="/" style="color: #3b82f6; text-decoration: underline; font-family: \'Open Sans\', sans-serif; font-size: 1rem;">← Back to Home</a>' +
      "</div>";
  }
}

// Load fonts and blog when page loads
loadGoogleFonts();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(loadBlogDetail, 500);
  });
} else {
  setTimeout(loadBlogDetail, 500);
}
