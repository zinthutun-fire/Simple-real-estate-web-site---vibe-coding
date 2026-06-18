const API_PROPERTIES = '/api/properties';

function formatPrice(price) {
  return '$' + price.toLocaleString('en-US');
}

function createPropertyCard(property) {
  const badgeHtml = property.badge
    ? `<span class="property-card-badge">${property.badge}</span>`
    : '';

  return `
    <div class="property-card fade-in" data-id="${property.id}">
      <div class="property-card-image">
        <img src="${property.image}" alt="${property.title}" loading="lazy">
        ${badgeHtml}
      </div>
      <div class="property-card-body">
        <div class="property-card-price">${formatPrice(property.price)}</div>
        <div class="property-card-title">${property.title}</div>
        <div class="property-card-location">${property.location}</div>
        <div class="property-card-details">
          <span><span class="icon">🛏</span> ${property.beds} Beds</span>
          <span><span class="icon">🛁</span> ${property.baths} Baths</span>
          <span><span class="icon">📐</span> ${property.sqft.toLocaleString()} sqft</span>
        </div>
      </div>
    </div>
  `;
}

function renderProperties(propertiesToRender) {
  const grid = document.querySelector('.property-grid');
  if (!grid) return;

  if (propertiesToRender.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 1.2rem; margin-bottom: 8px;">No properties found</p>
        <p>Try adjusting your filters.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = propertiesToRender
    .map(p => createPropertyCard(p))
    .join('');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  document.querySelectorAll('.property-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      window.location.href = `property-detail.html?id=${id}`;
    });
  });
}

function renderPropertyDetail(property) {
  const container = document.getElementById('property-detail-content');
  if (!container || !property) return;

  const mainImg = document.getElementById('gallery-main');
  const thumbsContainer = document.getElementById('gallery-thumbs');
  const imgs = property.images && property.images.length ? property.images : [property.image];

  let thumbsHtml = imgs.map((img, i) => `
    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
      <img src="${img}" alt="">
    </div>
  `).join('');

  thumbsContainer.innerHTML = thumbsHtml;

  thumbsContainer.querySelectorAll('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbsContainer.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.src = imgs[thumb.dataset.index];
    });
  });

  document.getElementById('detail-title').textContent = property.title;
  document.getElementById('detail-location').textContent = property.location;
  document.getElementById('detail-price').textContent = formatPrice(property.price);
  document.getElementById('detail-beds').textContent = property.beds;
  document.getElementById('detail-baths').textContent = property.baths;
  document.getElementById('detail-sqft').textContent = property.sqft.toLocaleString();
  document.getElementById('detail-type').textContent = property.type;
  document.getElementById('detail-description').textContent = property.description;

  const amenitiesList = document.getElementById('detail-amenities');
  amenitiesList.innerHTML = (property.amenities || []).map(a => `<li>${a}</li>`).join('');

  document.title = `${property.title} - VibeCove Realty`;

  // Set property_id on agent form
  const propIdInput = document.getElementById('agent-property-id');
  if (propIdInput) propIdInput.value = property.id;
}

// Fetch properties from API with query params
async function fetchProperties(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, v);
  });
  const url = `${API_PROPERTIES}${qs.toString() ? '?' + qs.toString() : ''}`;
  const res = await fetch(url);
  return res.json();
}

// Fetch single property
async function fetchProperty(id) {
  const res = await fetch(`${API_PROPERTIES}/${id}`);
  if (!res.ok) return null;
  return res.json();
}

function buildFilterParams() {
  const params = {};
  const selectedTypes = [];
  document.querySelectorAll('input[name="type"]:checked').forEach(cb => selectedTypes.push(cb.value));
  if (selectedTypes.length) params.type = selectedTypes.join(',');

  const selectedBeds = [];
  document.querySelectorAll('input[name="beds"]:checked').forEach(rb => selectedBeds.push(rb.value));
  const bedVals = selectedBeds.filter(b => b !== '');
  if (bedVals.length) params.beds = bedVals.join(',');

  const priceRange = document.getElementById('price-range');
  if (priceRange && parseInt(priceRange.value) > 0) {
    params.minPrice = priceRange.value;
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect && sortSelect.value !== 'default') {
    params.sort = sortSelect.value;
  }

  return params;
}

function initPropertyFilters() {
  const grid = document.querySelector('.property-grid');
  if (!grid) return;

  const priceRange = document.getElementById('price-range');
  const priceDisplay = document.getElementById('price-display');
  const sortSelect = document.getElementById('sort-select');
  const countEl = document.getElementById('property-count');
  const applyBtn = document.getElementById('apply-filters');

  if (priceRange && priceDisplay) {
    priceRange.addEventListener('input', () => {
      priceDisplay.textContent = `$${parseInt(priceRange.value).toLocaleString()}+`;
    });
  }

  async function updateDisplay() {
    const params = buildFilterParams();
    const data = await fetchProperties(params);
    renderProperties(data);
    if (countEl) {
      countEl.textContent = `${data.length} property${data.length !== 1 ? 'ies' : 'y'}`;
    }
  }

  if (applyBtn) applyBtn.addEventListener('click', updateDisplay);
  if (sortSelect) sortSelect.addEventListener('change', updateDisplay);
  document.querySelectorAll('input[name="type"], input[name="beds"]').forEach(el => {
    el.addEventListener('change', updateDisplay);
  });

  updateDisplay();
}

async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  if (!id) {
    const container = document.getElementById('property-detail-content');
    if (container) {
      container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--text-muted)"><h2>Property not found</h2><p style="margin-top:8px"><a href="properties.html" style="color:var(--gold)">View all properties</a></p></div>';
    }
    return;
  }

  const property = await fetchProperty(id);
  if (property) {
    renderPropertyDetail(property);
  } else {
    const container = document.getElementById('property-detail-content');
    if (container) {
      container.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--text-muted)"><h2>Property not found</h2><p style="margin-top:8px"><a href="properties.html" style="color:var(--gold)">View all properties</a></p></div>';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.property-grid')) {
    initPropertyFilters();
  }
  if (document.getElementById('property-detail-content')) {
    initDetailPage();
  }
});
