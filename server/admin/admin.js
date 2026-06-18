const API = '/api';
let token = localStorage.getItem('token');
let currentView = 'dashboard';

function req(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API}${path}`, { ...options, headers }).then(r => {
    if (r.status === 401) { logout(); throw new Error('Unauthorized'); }
    if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Request failed'); });
    return r.json();
  });
}

function logout() {
  token = null;
  localStorage.removeItem('token');
  render();
}

async function login(username, password) {
  const data = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  token = data.token;
  localStorage.setItem('token', data.token);
  render();
}

function navigate(view) {
  currentView = view;
  render();
}

async function render() {
  const app = document.getElementById('app');
  if (!token) {
    app.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <h1>VibeCove Admin</h1>
          <p>Sign in to manage your properties and inquiries.</p>
          <div class="login-error" id="login-error">Invalid credentials</div>
          <input type="text" id="login-user" placeholder="Username" autocomplete="off">
          <input type="password" id="login-pass" placeholder="Password">
          <button id="login-btn">Sign In</button>
        </div>
      </div>
    `;
    document.getElementById('login-btn').addEventListener('click', async () => {
      const u = document.getElementById('login-user').value;
      const p = document.getElementById('login-pass').value;
      try {
        await login(u, p);
      } catch {
        document.getElementById('login-error').style.display = 'block';
      }
    });
    document.getElementById('login-pass').addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('login-btn').click();
    });
    return;
  }

  let content = '';
  if (currentView === 'dashboard') content = await renderDashboard();
  else if (currentView === 'properties') content = await renderProperties();
  else if (currentView === 'contacts') content = await renderContacts();

  app.innerHTML = `
    <div class="admin-layout">
      <div class="sidebar">
        <h2>VibeCove Admin</h2>
        <nav>
          <button class="${currentView === 'dashboard' ? 'active' : ''}" onclick="navigate('dashboard')">Dashboard</button>
          <button class="${currentView === 'properties' ? 'active' : ''}" onclick="navigate('properties')">Properties</button>
          <button class="${currentView === 'contacts' ? 'active' : ''}" onclick="navigate('contacts')">Inquiries</button>
        </nav>
        <button class="logout-btn" onclick="logout()">Sign Out</button>
      </div>
      <div class="main-content">${content}</div>
    </div>
  `;
}

async function renderDashboard() {
  const [properties, contacts] = await Promise.all([
    req('/properties'),
    req('/contacts')
  ]);
  return `
    <h1>Dashboard</h1>
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Properties</h3>
        <div class="value">${properties.length}</div>
      </div>
      <div class="stat-card">
        <h3>Total Inquiries</h3>
        <div class="value">${contacts.length}</div>
      </div>
      <div class="stat-card">
        <h3>Avg. Price</h3>
        <div class="value">$${(properties.reduce((s, p) => s + p.price, 0) / (properties.length || 1)).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
      </div>
    </div>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:24px;">
      <h2 style="font-size:1rem;margin-bottom:16px;">Recent Inquiries</h2>
      ${contacts.length === 0 ? '<p style="color:#737373;">No inquiries yet.</p>' : ''}
      ${contacts.slice(0, 5).map(c => `
        <div style="padding:12px 0;border-bottom:1px solid #242424;display:flex;justify-content:space-between;">
          <div><strong>${c.name}</strong> <span style="color:#737373;">— ${c.subject || 'General Inquiry'}</span></div>
          <div style="color:#737373;font-size:0.85rem;">${new Date(c.created_at).toLocaleDateString()}</div>
        </div>
      `).join('')}
    </div>
  `;
}

async function renderProperties() {
  const properties = await req('/properties');
  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <h1>Properties (${properties.length})</h1>
      <button class="add-btn" onclick="showPropertyModal()">+ Add Property</button>
    </div>
    <table>
      <thead><tr>
        <th>Title</th><th>Location</th><th>Price</th><th>Type</th><th>Beds</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${properties.map(p => `
          <tr>
            <td style="color:#f5f5f5;">${p.title}</td>
            <td>${p.location}</td>
            <td style="color:#c9a84c;">$${p.price.toLocaleString()}</td>
            <td>${p.type}</td>
            <td>${p.beds}</td>
            <td>
              <div class="actions">
                <button class="btn-edit" onclick="showPropertyModal(${p.id})">Edit</button>
                <button class="btn-delete" onclick="deleteProperty(${p.id})">Delete</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function showPropertyModal(id) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.id = 'property-modal';

  const isEdit = !!id;
  let property = {};
  if (isEdit) {
    req(`/properties/${id}`).then(p => {
      property = p;
      fillForm(p);
    });
  }

  overlay.innerHTML = `
    <div class="modal">
      <h2>${isEdit ? 'Edit Property' : 'Add Property'}</h2>
      <form id="property-form">
        <div class="form-row">
          <div class="form-group"><label>Title *</label><input name="title" id="f-title" required></div>
          <div class="form-group"><label>Location *</label><input name="location" id="f-location" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Price *</label><input type="number" name="price" id="f-price" required></div>
          <div class="form-group"><label>Type *</label>
            <select name="type" id="f-type">
              <option value="House">House</option>
              <option value="Apartment">Apartment</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Bedrooms *</label><input type="number" name="beds" id="f-beds" required></div>
          <div class="form-group"><label>Bathrooms *</label><input type="number" name="baths" id="f-baths" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Sq Ft *</label><input type="number" name="sqft" id="f-sqft" required></div>
          <div class="form-group"><label>Status</label>
            <select name="status" id="f-status">
              <option value="For Sale">For Sale</option>
              <option value="Sold">Sold</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Badge</label><input name="badge" id="f-badge" placeholder="e.g. Featured, New"></div>
          <div class="form-group"><label>Image URL</label><input name="image" id="f-image" placeholder="https://..."></div>
        </div>
        <div class="form-group"><label>Image URLs (comma separated)</label><input name="images" id="f-images" placeholder="https://..., https://..."></div>
        <div class="form-group"><label>Amenities (comma separated)</label><input name="amenities" id="f-amenities" placeholder="Pool, Garage, Gym"></div>
        <div class="form-group"><label>Description</label><textarea name="description" id="f-description" rows="3"></textarea></div>
        <div class="modal-actions">
          <button type="submit" class="btn-save">${isEdit ? 'Update' : 'Create'}</button>
          <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
        </div>
      </form>
    </div>
  `;

  function fillForm(p) {
    document.getElementById('f-title').value = p.title || '';
    document.getElementById('f-location').value = p.location || '';
    document.getElementById('f-price').value = p.price || '';
    document.getElementById('f-type').value = p.type || 'House';
    document.getElementById('f-beds').value = p.beds || '';
    document.getElementById('f-baths').value = p.baths || '';
    document.getElementById('f-sqft').value = p.sqft || '';
    document.getElementById('f-status').value = p.status || 'For Sale';
    document.getElementById('f-badge').value = p.badge || '';
    document.getElementById('f-image').value = p.image || '';
    document.getElementById('f-images').value = (p.images || []).join(', ');
    document.getElementById('f-amenities').value = (p.amenities || []).join(', ');
    document.getElementById('f-description').value = p.description || '';
  }

  if (isEdit && property.id) fillForm(property);

  document.body.appendChild(overlay);

  document.getElementById('property-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('f-title').value,
      location: document.getElementById('f-location').value,
      price: parseInt(document.getElementById('f-price').value),
      type: document.getElementById('f-type').value,
      beds: parseInt(document.getElementById('f-beds').value),
      baths: parseInt(document.getElementById('f-baths').value),
      sqft: parseInt(document.getElementById('f-sqft').value),
      status: document.getElementById('f-status').value,
      badge: document.getElementById('f-badge').value || null,
      image: document.getElementById('f-image').value,
      images: document.getElementById('f-images').value.split(',').map(s => s.trim()).filter(Boolean),
      amenities: document.getElementById('f-amenities').value.split(',').map(s => s.trim()).filter(Boolean),
      description: document.getElementById('f-description').value
    };

    try {
      if (isEdit) {
        await req(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      } else {
        await req('/properties', { method: 'POST', body: JSON.stringify(data) });
      }
      closeModal();
      render();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function deleteProperty(id) {
  if (!confirm('Delete this property?')) return;
  await req(`/properties/${id}`, { method: 'DELETE' });
  render();
}

async function renderContacts() {
  const contacts = await req('/contacts');
  return `
    <h1>Inquiries (${contacts.length})</h1>
    <table>
      <thead><tr>
        <th>Date</th><th>Name</th><th>Email</th><th>Subject</th><th>Property</th><th>Message</th>
      </tr></thead>
      <tbody>
        ${contacts.map(c => `
          <tr>
            <td style="white-space:nowrap;">${new Date(c.created_at).toLocaleDateString()}</td>
            <td style="color:#f5f5f5;">${c.name}</td>
            <td>${c.email}</td>
            <td>${c.subject || '—'}</td>
            <td>${c.property_title || '—'}</td>
            <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.message}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function closeModal() {
  const m = document.getElementById('property-modal');
  if (m) m.remove();
}

render();
