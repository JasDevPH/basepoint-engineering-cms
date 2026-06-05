const API_URL = 'https://cms.basepointengineering.com';

// Helper to set or create a meta tag
function setMetaTag(property, content) {
  if (!content) return;
  let tag = document.querySelector('meta[property="' + property + '"]') || document.querySelector('meta[name="' + property + '"]');
  if (!tag) {
    tag = document.createElement('meta');
    if (property.startsWith('og:')) tag.setAttribute('property', property);
    else tag.setAttribute('name', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

// Show/hide loading
function showLoading() {
  const loader = document.createElement('div');
  loader.id = 'service-loading-screen';
  loader.className = 'service-loading-screen';
  loader.innerHTML = '<div class="service-spinner"></div><div class="service-loading-text">Loading service...</div>';
  document.body.appendChild(loader);
}

function hideLoading() {
  const loader = document.getElementById('service-loading-screen');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 300);
  }
}

// Load Google Fonts
function loadGoogleFonts() {
  if (!document.querySelector('#google-fonts-link')) {
    const link = document.createElement('link');
    link.id = 'google-fonts-link';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Open+Sans:wght@400;600&display=swap';
    document.head.appendChild(link);
    console.log('✓ Google Fonts loaded');
  }
}

// Get slug from URL
function getSlugFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('slug');
}

// Load side navigation with services
async function loadSideNavigation(currentSlug) {
  try {
    const response = await fetch(`${API_URL}/api/services`);
    const data = await response.json();

    if (data.success) {
      displaySideNavigation(data.data, currentSlug);
    }
  } catch (error) {
    console.error('Error loading navigation:', error);
  }
}

function displaySideNavigation(services, currentSlug) {
  console.log('Displaying service navigation:', services.length, 'services');

  let html = '<div class="side-nav">';
  html += '<div class="side-nav-title">Our Services</div>';

  services.forEach(service => {
    const isActive = service.slug === currentSlug;
    const iconName = service.icon || 'Briefcase';

    html += '<a href="/service-detail?slug=' + service.slug + '" class="side-nav-item' + (isActive ? ' active' : '') + '">';
    html += '<span data-lucide="' + iconName.toLowerCase() + '" class="side-nav-icon"></span>';
    html += '<span>' + service.title + '</span>';
    html += '</a>';
  });

  html += '</div>';

  // Desktop: Insert into nav container
  const navContainer = document.querySelector('[data-service-nav="container"]');
  if (navContainer) {
    navContainer.innerHTML = html;
  }

  // Mobile: Insert at bottom of content
  if (window.innerWidth <= 768) {
    const contentContainer = document.querySelector('[data-service="content"]');
    if (contentContainer && contentContainer.parentElement) {
      let mobileNavContainer = document.getElementById('side-nav-mobile');
      if (!mobileNavContainer) {
        mobileNavContainer = document.createElement('div');
        mobileNavContainer.id = 'side-nav-mobile';
        mobileNavContainer.className = 'side-nav-mobile-container';
      }
      mobileNavContainer.innerHTML = html;
      contentContainer.parentElement.appendChild(mobileNavContainer);
    }
  }

  // Initialize Lucide icons
  setTimeout(() => {
    if (window.lucide) {
      window.lucide.createIcons();
      console.log('✓ Navigation icons initialized');
    }
  }, 100);

  console.log('✓ Service navigation displayed');
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function() {
    const slug = getSlugFromURL();
    if (slug) {
      loadSideNavigation(slug);
    }
  }, 250);
});

// Load service detail
async function loadServiceDetail() {
  const slug = getSlugFromURL();
  console.log('=== LOADING SERVICE ===');
  console.log('Slug from URL:', slug);

  if (!slug) {
    hideLoading();
    showError('No service specified');
    return;
  }

  showLoading();

  try {
    const apiUrl = `${API_URL}/api/services/${slug}`;
    console.log('Fetching from:', apiUrl);

    const timestamp = new Date().getTime();
    const response = await fetch(`${apiUrl}?_=${timestamp}`);
    const data = await response.json();

    console.log('API Response:', data);

    if (data.success) {
      displayServiceDetail(data.data);
      loadSideNavigation(slug);
      setTimeout(hideLoading, 300);
    } else {
      hideLoading();
      showError('Service not found');
    }
  } catch (error) {
    console.error('Error loading service:', error);
    hideLoading();
    showError('Failed to load service');
  }
}

function displayServiceDetail(service) {
  console.log('=== DISPLAYING SERVICE ===');
  console.log('Service:', service.title);

  document.title = service.title + ' - Basepoint Engineering';

  // Set meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = service.excerpt
    || service.title + ' — Basepoint Engineering services for below-the-hook lifting devices, CWB welding, structural inspection, and custom engineering.';

  // Update OG / Twitter tags for social sharing
  setMetaTag('og:title', service.title + ' - Basepoint Engineering');
  setMetaTag('twitter:title', service.title + ' - Basepoint Engineering');
  setMetaTag('og:description', metaDesc.content);
  setMetaTag('twitter:description', metaDesc.content);
  setMetaTag('og:url', window.location.href);
  setMetaTag('og:type', 'website');

  // Update service title
  const titleEl = document.querySelector('[data-service="title"]');
  if (titleEl) {
    titleEl.textContent = service.title;
    titleEl.style.fontFamily = "'Montserrat', sans-serif";
    titleEl.style.fontWeight = '700';
    titleEl.style.color = '#1e3a8a';
    console.log('✓ Title updated');
  }

  // Update service excerpt
  const excerptEl = document.querySelector('[data-service="excerpt"]');
  if (excerptEl && service.excerpt) {
    excerptEl.textContent = service.excerpt;
    excerptEl.style.fontFamily = "'Open Sans', sans-serif";
    excerptEl.style.fontSize = '1.125rem';
    excerptEl.style.lineHeight = '1.75';
    excerptEl.style.color = '#6b7280';
    console.log('✓ Excerpt updated');
  }

  // Update content
  const contentEl = document.querySelector('[data-service="content"]');
  if (contentEl) {
    if (service.contentBlocks && Array.isArray(service.contentBlocks)) {
      contentEl.innerHTML = renderServiceContentBlocks(service.contentBlocks);

      // Initialize Lucide icons for icon cards
      setTimeout(() => {
        if (window.lucide) {
          window.lucide.createIcons();

          document.querySelectorAll('[data-lucide]').forEach(function(element) {
            const iconName = element.getAttribute('data-lucide');
            if (iconName && window.lucide.icons[iconName]) {
              const svg = window.lucide.icons[iconName].toSvg({
                width: 36,
                height: 36,
                'stroke-width': 2,
                color: '#ffffff'
              });
              element.innerHTML = svg;
            }
          });

          console.log('✓ Content block icons initialized');
        }
      }, 100);

      console.log('✓ Content blocks rendered');
    }
  }

  console.log('=== SERVICE DISPLAY COMPLETE ===');
}

function renderServiceContentBlocks(blocks) {
  return blocks.map(function(block) {
    const spacing = block.spacing || 20;
    const baseStyle = 'margin-bottom: ' + spacing + 'px;';

    switch(block.type) {
      case 'heading':
        const level = block.level || 'h2';
        const headingStyle = baseStyle + " font-family: 'Montserrat', sans-serif; font-weight: bold; color: #1e3a8a; line-height: 1.3;";
        let fontSize = '2rem';
        if (level === 'h1') fontSize = '2.5rem';
        else if (level === 'h3') fontSize = '1.5rem';
        else if (level === 'h4') fontSize = '1.25rem';
        return '<' + level + ' style="' + headingStyle + ' font-size: ' + fontSize + ';">' + block.content + '</' + level + '>';

      case 'paragraph':
        const paragraphStyle = baseStyle + " font-family: 'Open Sans', sans-serif; line-height: 1.75; font-size: 1.125rem; color: #4b5563;";
        return '<p style="' + paragraphStyle + '">' + block.content + '</p>';

      case 'bulletList':
        const bulletStyle = baseStyle + " font-family: 'Open Sans', sans-serif; line-height: 1.75; color: #4b5563; list-style-type: disc; padding-left: 1.5rem;";
        const bulletItems = (block.items || []).map(function(item) {
          return '<li style="margin-bottom: 0.5rem;">' + item + '</li>';
        }).join('');
        return '<ul style="' + bulletStyle + '">' + bulletItems + '</ul>';

      case 'numberedList':
        const numberedStyle = baseStyle + " font-family: 'Open Sans', sans-serif; line-height: 1.75; color: #4b5563; list-style-type: decimal; padding-left: 1.5rem;";
        const numberedItems = (block.items || []).map(function(item) {
          return '<li style="margin-bottom: 0.5rem;">' + item + '</li>';
        }).join('');
        return '<ol style="' + numberedStyle + '">' + numberedItems + '</ol>';

      case 'image':
        if (!block.url) return '';
        const imageStyle = baseStyle + ' max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);';
        return '<img src="' + block.url + '?t=' + new Date().getTime() + '" alt="' + (block.alt || '') + '" style="' + imageStyle + '" />';

      case 'embed':
        if (!block.content) return '';
        return '<div style="' + baseStyle + ' max-width: 100%;">' + block.content + '</div>';

      case 'divider':
        return '<hr style="' + baseStyle + ' border: 0; border-top: 2px solid #e5e7eb; margin-top: 2rem; margin-bottom: 2rem;" />';

      case 'columnList':
        const columns = block.columns || [];
        if (columns.length === 0) return '';

        const columnCount = columns.length;
        let gridColumns = '';
        if (columnCount === 1) gridColumns = '1fr';
        else if (columnCount === 2) gridColumns = '1fr 1fr';
        else if (columnCount === 3) gridColumns = '1fr 1fr 1fr';
        else if (columnCount === 4) gridColumns = '1fr 1fr 1fr 1fr';
        else gridColumns = 'repeat(' + columnCount + ', 1fr)';

        let columnsHtml = '<div style="' + baseStyle + ' display: grid; grid-template-columns: ' + gridColumns + '; gap: 2rem; margin-top: 1.5rem;">';

        columns.forEach(function(column) {
          columnsHtml += '<div>';

          if (column.title) {
            columnsHtml += '<h4 style="font-family: \'Montserrat\', sans-serif; font-size: 1.25rem; font-weight: bold; color: #1e3a8a; margin-bottom: 1rem;">' + column.title + '</h4>';
          }

          if (column.items && column.items.length > 0) {
            columnsHtml += '<ul style="font-family: \'Open Sans\', sans-serif; line-height: 1.75; color: #4b5563; list-style: none; padding: 0;">';
            column.items.forEach(function(item) {
              columnsHtml += '<li style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.75rem;">';
              columnsHtml += '<span style="color: #00bcd4; font-size: 1.25rem; line-height: 1;">☑</span>';
              columnsHtml += '<span>' + item + '</span>';
              columnsHtml += '</li>';
            });
            columnsHtml += '</ul>';
          }

          columnsHtml += '</div>';
        });

        columnsHtml += '</div>';
        return columnsHtml;

      case 'iconCards':
        const cards = block.cards || [];
        if (cards.length === 0) return '';

        let cardsHtml = '<div style="' + baseStyle + ' display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">';

        cards.forEach(function(card) {
          cardsHtml += '<div style="padding: 2rem; background: #ffffff; border-radius: 16px; border: 2px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); transition: all 0.3s ease;" onmouseover="this.style.transform=\'translateY(-4px)\'; this.style.boxShadow=\'0 8px 16px rgba(0, 0, 0, 0.1)\'; this.style.borderColor=\'#00bcd4\';" onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'0 2px 4px rgba(0, 0, 0, 0.05)\'; this.style.borderColor=\'#e5e7eb\';">';

          cardsHtml += '<div style="width: 64px; height: 64px; background: linear-gradient(135deg, #00bcd4, #1e3a8a); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; padding: 14px;">';
          cardsHtml += '<i data-lucide="' + card.icon + '" style="width: 36px; height: 36px; color: #ffffff; stroke-width: 2;"></i>';
          cardsHtml += '</div>';

          cardsHtml += '<h3 style="font-family: \'Montserrat\', sans-serif; font-size: 1.375rem; font-weight: bold; color: #1e3a8a; margin-bottom: 0.75rem; line-height: 1.3;">' + card.title + '</h3>';

          cardsHtml += '<p style="font-family: \'Open Sans\', sans-serif; color: #6b7280; line-height: 1.7; font-size: 1rem;">' + card.description + '</p>';

          cardsHtml += '</div>';
        });

        cardsHtml += '</div>';
        return cardsHtml;

      default:
        return '';
    }
  }).join('');
}

function showError(message) {
  const contentEl = document.querySelector('[data-service="content"]');
  if (contentEl) {
    contentEl.innerHTML = '<div style="text-align: center; padding: 3rem;">' +
      '<p style="color: #ef4444; font-size: 1.25rem; font-family: \'Open Sans\', sans-serif; margin-bottom: 1rem;">' +
      message +
      '</p><a href="/" style="color: #3b82f6; text-decoration: underline; font-family: \'Open Sans\', sans-serif;">← Back to Home</a>' +
      '</div>';
  }
}

// Initialize
loadGoogleFonts();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadServiceDetail, 500);
  });
} else {
  setTimeout(loadServiceDetail, 500);
}

// Service canonical injection
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceSlug = urlParams.get('slug');

  if (serviceSlug) {
    const canonicalUrl = `https://www.basepointengineering.com/service-detail?slug=${serviceSlug}`;

    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }
})();
