// RelyJW Application
const state = {
  weeks: [],
  currentWeekId: null,
  currentWeekLabel: '',
  isAdmin: false,
  view: 'home'
};

// Icons (SVG)
const icons = {
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  empty: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
};

// API helpers
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  return res.json();
}

// Load data
async function loadWeeks() {
  const data = await api('/api/weeks');
  state.weeks = data.weeks || [];
  state.currentWeekId = data.currentWeekId;
  state.currentWeekLabel = data.currentWeekLabel;
}

async function checkAuth() {
  const data = await api('/api/admin/check');
  state.isAdmin = data.isAdmin;
}

// Render helpers
function renderDocRow(name, path, type) {
  const hasFile = !!path;
  return `
    <div class="doc-row">
      <div class="doc-info">
        <div class="doc-icon">${icons.file}</div>
        <div>
          <div class="doc-name">${name}</div>
          <div class="doc-status">${hasFile ? 'Available' : 'Not uploaded yet'}</div>
        </div>
      </div>
      <div class="doc-actions">
        <a class="btn btn-secondary" ${hasFile ? `href="${path}" target="_blank"` : 'disabled'} ${!hasFile ? 'style="pointer-events:none;opacity:0.45"' : ''}>
          ${icons.eye} View
        </a>
        <a class="btn btn-primary" ${hasFile ? `href="${path}" download` : 'disabled'} ${!hasFile ? 'style="pointer-events:none;opacity:0.45"' : ''}>
          ${icons.download} Download
        </a>
      </div>
    </div>
  `;
}

function renderWeekDetail(week) {
  const isCurrent = week.id === state.currentWeekId;
  return `
    <div class="card ${isCurrent ? 'card-current' : ''}">
      ${isCurrent ? '<div class="badge">Current Week</div>' : ''}
      <h1 class="week-title">${week.label}</h1>
      <p class="week-subtitle">Meeting materials for this week</p>

      <div class="doc-section">
        <div class="doc-section-title">Life and Ministry</div>
        ${renderDocRow('Main Answers', week.lmMain, 'lmMain')}
        ${renderDocRow('Congregation Bible Study Answers', week.lmCbs, 'lmCbs')}
      </div>

      <div class="doc-section">
        <div class="doc-section-title">Watchtower Study</div>
        ${renderDocRow('Watchtower Answers', week.watchtower, 'watchtower')}
      </div>
    </div>
    <button class="btn btn-secondary" onclick="showHome()" style="margin-top:8px">← Back to all weeks</button>
  `;
}

function renderHome() {
  const currentWeek = state.weeks.find(w => w.id === state.currentWeekId);
  
  let html = '';
  
  // Current week highlight
  if (currentWeek) {
    html += `
      <div class="card card-current" style="cursor:pointer" onclick="showWeek('${currentWeek.id}')">
        <div class="badge">Current Week</div>
        <h2 class="week-title">${currentWeek.label}</h2>
        <p class="week-subtitle">Tap to view documents</p>
      </div>
    `;
  } else {
    html += `
      <div class="card card-current">
        <div class="badge">Current Week</div>
        <h2 class="week-title">${state.currentWeekLabel}</h2>
        <p class="week-subtitle">No documents uploaded for this week yet</p>
      </div>
    `;
  }

  // Other weeks
  const otherWeeks = state.weeks.filter(w => w.id !== state.currentWeekId);
  
  if (otherWeeks.length > 0) {
    html += `<h3 style="font-size:0.9rem;font-weight:600;color:var(--text-muted);margin:28px 0 12px;text-transform:uppercase;letter-spacing:0.04em">All Weeks</h3>`;
    otherWeeks.forEach(w => {
      html += `
        <a class="week-list-item" onclick="showWeek('${w.id}'); return false;" href="#">
          <span style="font-weight:500">${w.label}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      `;
    });
  }

  if (state.weeks.length === 0) {
    html += `
      <div class="empty-state">
        ${icons.empty}
        <p>No meeting documents available yet.</p>
        <p style="font-size:0.9rem;margin-top:8px">Check back soon or contact the administrator.</p>
      </div>
    `;
  }

  return html;
}

function renderLogin() {
  return `
    <div class="card" style="max-width:400px;margin:40px auto">
      <div style="text-align:center;margin-bottom:24px">
        <div class="doc-icon" style="margin:0 auto 12px;width:48px;height:48px">${icons.lock}</div>
        <h2 class="page-title">Admin Login</h2>
      </div>
      <form onsubmit="handleLogin(event)">
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" class="form-input" id="password" required autofocus placeholder="Enter admin password">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px">Sign In</button>
      </form>
      <p id="loginError" style="color:var(--danger);font-size:0.85rem;margin-top:12px;text-align:center;display:none"></p>
    </div>
  `;
}

function renderAdmin() {
  let html = `
    <div class="admin-header">
      <h1 class="page-title">Admin Dashboard</h1>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="showAddWeek()">${icons.plus} Add Week</button>
        <button class="btn btn-secondary" onclick="handleLogout()">Logout</button>
      </div>
    </div>
  `;

  if (state.weeks.length === 0) {
    html += `<div class="empty-state">${icons.empty}<p>No weeks added yet. Click "Add Week" to start.</p></div>`;
  } else {
    state.weeks.forEach(w => {
      const docs = [w.lmMain, w.lmCbs, w.watchtower].filter(Boolean).length;
      html += `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600;margin-bottom:4px">${w.label}</div>
              <div style="font-size:0.85rem;color:var(--text-secondary)">${docs}/3 documents uploaded</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-secondary" onclick="showEditWeek('${w.id}')">Edit</button>
              <button class="btn btn-danger" onclick="deleteWeek('${w.id}')">${icons.trash}</button>
            </div>
          </div>
        </div>
      `;
    });
  }
  return html;
}

function renderAddWeek(existing = null) {
  const title = existing ? 'Edit Week' : 'Add New Week';
  return `
    <div class="card">
      <h2 class="page-title" style="margin-bottom:24px">${title}</h2>
      <form onsubmit="handleSaveWeek(event)" enctype="multipart/form-data">
        <input type="hidden" id="weekId" value="${existing ? existing.id : ''}">
        
        <div class="form-group">
          <label class="form-label">Week Start Date (Monday)</label>
          <input type="date" class="form-input" id="startDate" required value="${existing ? existing.startDate : ''}" ${existing ? 'readonly' : ''}>
        </div>

        <div class="form-group">
          <label class="form-label">Life & Ministry — Main Answers (PDF)</label>
          <div class="file-input-wrapper">
            <input type="file" id="lmMain" accept="application/pdf" onchange="updateFileName(this,'lmMainName')">
            <div>Click or drag PDF here</div>
            <div class="file-name" id="lmMainName">${existing && existing.lmMain ? 'Current file uploaded' : 'No file selected'}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Life & Ministry — Congregation Bible Study (PDF)</label>
          <div class="file-input-wrapper">
            <input type="file" id="lmCbs" accept="application/pdf" onchange="updateFileName(this,'lmCbsName')">
            <div>Click or drag PDF here</div>
            <div class="file-name" id="lmCbsName">${existing && existing.lmCbs ? 'Current file uploaded' : 'No file selected'}</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Watchtower Study Answers (PDF)</label>
          <div class="file-input-wrapper">
            <input type="file" id="watchtower" accept="application/pdf" onchange="updateFileName(this,'wtName')">
            <div>Click or drag PDF here</div>
            <div class="file-name" id="wtName">${existing && existing.watchtower ? 'Current file uploaded' : 'No file selected'}</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:28px">
          <button type="submit" class="btn btn-primary">Save Week</button>
          <button type="button" class="btn btn-secondary" onclick="showAdmin()">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

// Navigation
function setContent(html) {
  document.getElementById('content').innerHTML = html;
}

async function showHome() {
  state.view = 'home';
  setContent('<div class="loading">Loading...</div>');
  await loadWeeks();
  setContent(renderHome());
}

async function showWeek(id) {
  state.view = 'week';
  setContent('<div class="loading">Loading...</div>');
  const week = await api(`/api/weeks/${id}`);
  setContent(renderWeekDetail(week));
}

async function showAdmin() {
  await checkAuth();
  if (!state.isAdmin) {
    setContent(renderLogin());
    return;
  }
  state.view = 'admin';
  setContent('<div class="loading">Loading...</div>');
  await loadWeeks();
  setContent(renderAdmin());
}

function showAddWeek() {
  setContent(renderAddWeek());
}

async function showEditWeek(id) {
  const week = await api(`/api/weeks/${id}`);
  setContent(renderAddWeek(week));
}

// Actions
function updateFileName(input, targetId) {
  const el = document.getElementById(targetId);
  el.textContent = input.files[0] ? input.files[0].name : 'No file selected';
}

async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (data.success) {
    state.isAdmin = true;
    showAdmin();
  } else {
    const err = document.getElementById('loginError');
    err.textContent = data.error || 'Login failed';
    err.style.display = 'block';
  }
}

async function handleLogout() {
  await api('/api/admin/logout', { method: 'POST' });
  state.isAdmin = false;
  showHome();
}

async function handleSaveWeek(e) {
  e.preventDefault();
  const startDate = document.getElementById('startDate').value;
  const formData = new FormData();
  formData.append('startDate', startDate);
  formData.append('weekId', startDate);

  const lmMain = document.getElementById('lmMain').files[0];
  const lmCbs = document.getElementById('lmCbs').files[0];
  const watchtower = document.getElementById('watchtower').files[0];

  if (lmMain) formData.append('lmMain', lmMain);
  if (lmCbs) formData.append('lmCbs', lmCbs);
  if (watchtower) formData.append('watchtower', watchtower);

  const res = await fetch('/api/admin/weeks', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (data.success) {
    showAdmin();
  } else {
    alert(data.error || 'Failed to save');
  }
}

async function deleteWeek(id) {
  if (!confirm('Delete this week and all its documents?')) return;
  await fetch(`/api/admin/weeks/${id}`, { method: 'DELETE' });
  showAdmin();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  showHome();
});
