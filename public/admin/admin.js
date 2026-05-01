/* =============================================
   RAZATECH ADMIN — admin.js v4
   ALL data goes through /api/* → MySQL
   Changes appear on the public site instantly.
   ============================================= */

// ─── AUTH ─────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('rt_admin');
  window.location.href = 'index.html';
});

// ─── NAVIGATION ───────────────────────────────
const navItems    = document.querySelectorAll('.nav-item');
const panels      = document.querySelectorAll('.panel');
const topbarTitle = document.getElementById('topbarTitle');
const sectionLoaders = {
  overview: loadOverview,
  messages: loadMessages,
  projects: loadProjects,
  services: loadServices,
  clients:  loadClients,
  team:     loadTeam,
  settings: loadSettings,
};

navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const sec = item.dataset.section;
    navItems.forEach(n => n.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('panel-' + sec)?.classList.add('active');
    topbarTitle.textContent = item.textContent.replace(/[◈✉◫⬡🤝👤⚙]/g,'').replace(/\d+/g,'').trim();
    sectionLoaders[sec]?.();
  });
});

// Mobile sidebar
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar       = document.getElementById('sidebar');
sidebarToggle?.addEventListener('click', () => sidebar.classList.toggle('open'));
document.addEventListener('click', e => {
  if (!sidebar.contains(e.target) && !sidebarToggle?.contains(e.target)) sidebar.classList.remove('open');
});

// ─── API HELPERS ──────────────────────────────
async function api(url, method, body) {
  method = method || 'GET';
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'HTTP ' + r.status);
  return data;
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return isNaN(d) ? String(ts) : d.toLocaleDateString() + ' ' + d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}
function flash(id, msg, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok === false ? '#f87171' : '#22c55e';
  setTimeout(() => el.textContent = '', 3500);
}
function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// Modal helpers
window.openModal = function(id, data) {
  const modal = document.getElementById(id);
  if (!modal) return;
  // Clear form
  modal.querySelectorAll('input,textarea,select').forEach(el => el.value = '');
  // Populate if editing
  if (data) populateModal(id, data);
  document.getElementById(id + 'Title').textContent = data ? 'Edit ' + id.replace('Modal','').replace('project','Project').replace('service','Service').replace('client','Client') : 'Add ' + id.replace('Modal','').replace('project','Project').replace('service','Service').replace('client','Client');
  modal.classList.add('open');
};
window.closeModal = function(id) {
  document.getElementById(id)?.classList.remove('open');
};
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

function populateModal(id, d) {
  if (id === 'projectModal') {
    document.getElementById('pId').value    = d.id;
    document.getElementById('pTitle').value = d.title;
    document.getElementById('pCat').value   = d.category;
    document.getElementById('pDesc').value  = d.description;
    document.getElementById('pTech').value  = d.tech;
    document.getElementById('pEmoji').value = d.emoji;
    document.getElementById('pGrad').value  = d.gradient;
  } else if (id === 'serviceModal') {
    document.getElementById('svcId').value       = d.id;
    document.getElementById('svcName').value     = d.name;
    document.getElementById('svcIcon').value     = d.icon;
    document.getElementById('svcDesc').value     = d.description;
    document.getElementById('svcFeatures').value = d.features;
  } else if (id === 'clientModal') {
    document.getElementById('cliId').value      = d.id;
    document.getElementById('cliName').value    = d.name;
    document.getElementById('cliInitials').value= d.initials;
    document.getElementById('cliIndustry').value= d.industry;
    document.getElementById('cliGrad').value    = d.gradient;
    document.getElementById('cliTesti').value   = d.testimonial;
    document.getElementById('cliCName').value   = d.contact_name;
    document.getElementById('cliCTitle').value  = d.contact_title;
  }
}

// ══════════════════════════════════════════════
//  OVERVIEW
// ══════════════════════════════════════════════
async function loadOverview() {
  try {
    const [msgs, projs, svcs, clis] = await Promise.all([
      api('/api/messages'), api('/api/projects'),
      api('/api/services'), api('/api/clients'),
    ]);
    const unread = (Array.isArray(msgs) ? msgs : []).filter(m => !m.is_read).length;
    setHtml('ov-msg',  Array.isArray(msgs)  ? msgs.length  : '?');
    setHtml('ov-proj', Array.isArray(projs) ? projs.length : '?');
    setHtml('ov-svc',  Array.isArray(svcs)  ? svcs.length  : '?');
    setHtml('ov-cli',  Array.isArray(clis)  ? clis.length  : '?');
    const badge = document.getElementById('msgBadge');
    badge.textContent = unread || '';
    badge.style.display = unread ? 'inline-block' : 'none';
    // Recent messages
    const recent = Array.isArray(msgs) ? msgs.slice(0, 5) : [];
    setHtml('recentMsgs', recent.length ? recent.map(m => `
      <div class="msg-row">
        <div class="msg-name">${esc(m.name)}</div>
        <div style="font-size:12px;color:#8b99b8">
          ${m.phone ? '<span style="margin-right:10px">📞 ' + esc(m.phone) + '</span>' : ''}
          ${m.whatsapp ? '<span>✆ ' + esc(m.whatsapp) + '</span>' : ''}
        </div>
        <div class="msg-preview">${esc(m.message)}</div>
        <div class="msg-time">${fmt(m.created_at)} <span class="badge ${m.is_read?'badge-read':'badge-new'}">${m.is_read?'Read':'New'}</span></div>
      </div>`).join('') : '<div class="loading">No messages yet.</div>');
  } catch (e) {
    setHtml('recentMsgs', '<div class="loading" style="color:#f87171">⚠ Cannot connect to database. Is the server running?</div>');
  }
}

// ══════════════════════════════════════════════
//  MESSAGES
// ══════════════════════════════════════════════
async function loadMessages() {
  setHtml('msgTable', '<div class="loading">Loading messages from database...</div>');
  try {
    const msgs = await api('/api/messages');
    const unread = msgs.filter(m => !m.is_read).length;
    const badge = document.getElementById('msgBadge');
    badge.textContent = unread || '';
    badge.style.display = unread ? 'inline-block' : 'none';

    if (!msgs.length) {
      setHtml('msgTable', '<div class="empty-state"><span class="es-icon">✉</span><p>No messages yet.</p><p style="font-size:13px;color:#8b99b8;margin-top:8px">Messages from the public Contact page will appear here.</p></div>');
      return;
    }
    setHtml('msgTable', `<table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>WhatsApp</th>
          <th>Service</th>
          <th>Message</th>
          <th>Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${msgs.map((m,i) => `
        <tr id="mrow-${m.id}" style="${!m.is_read ? 'background:rgba(59,130,246,0.04)' : ''}">
          <td style="color:#4a5568;font-size:12px">${i+1}</td>
          <td style="font-weight:600;white-space:nowrap;min-width:120px">${esc(m.name)}</td>
          <td style="min-width:160px">
            <a href="mailto:${esc(m.email)}" style="color:#60a5fa;display:block">${esc(m.email)}</a>
          </td>
          <td style="white-space:nowrap">
            ${m.phone
              ? `<a href="tel:${esc(m.phone)}" style="color:#34d399;text-decoration:none">📞 ${esc(m.phone)}</a>`
              : '<span style="color:#4a5568">—</span>'}
          </td>
          <td style="white-space:nowrap">
            ${m.whatsapp
              ? `<a href="https://wa.me/${esc(m.whatsapp.replace(/[^0-9]/g,''))}" target="_blank" style="color:#25d366;text-decoration:none">✆ ${esc(m.whatsapp)}</a>`
              : '<span style="color:#4a5568">—</span>'}
          </td>
          <td style="min-width:120px">${esc(m.service||'—')}</td>
          <td style="max-width:220px;word-break:break-word;font-size:13px;min-width:150px">${esc(m.message)}</td>
          <td style="white-space:nowrap;font-size:12px;color:#8b99b8;min-width:110px">${fmt(m.created_at)}</td>
          <td><span class="badge ${m.is_read?'badge-read':'badge-new'}" id="ms-${m.id}">${m.is_read?'Read':'New'}</span></td>
          <td style="white-space:nowrap">
            ${!m.is_read?`<button class="tbl-btn tbl-btn-mark" onclick="markRead(${m.id})">Mark Read</button>`:''}
            <button class="tbl-btn tbl-btn-del" onclick="delMsg(${m.id})">Delete</button>
          </td>
        </tr>`).join('')}
      </tbody></table>`);
  } catch (e) {
    setHtml('msgTable', '<div class="empty-state"><span class="es-icon" style="color:#f87171">⚠</span><p style="color:#f87171">Cannot load messages.</p><p style="font-size:13px;color:#8b99b8;margin-top:8px">Make sure the Node.js server and MySQL are running.</p></div>');
  }
}

window.markRead = async (id) => {
  try {
    await api('/api/messages/' + id + '/read', 'PUT');
    const badge = document.getElementById('ms-' + id);
    if (badge) { badge.textContent = 'Read'; badge.className = 'badge badge-read'; }
    const btn = document.querySelector(`[onclick="markRead(${id})"]`);
    if (btn) btn.remove();
    loadOverview();
  } catch { alert('Error updating message.'); }
};
window.delMsg = async (id) => {
  if (!confirm('Delete this message permanently?')) return;
  try {
    await api('/api/messages/' + id, 'DELETE');
    document.getElementById('mrow-' + id)?.remove();
    loadOverview();
  } catch { alert('Error deleting message.'); }
};

// ══════════════════════════════════════════════
//  PROJECTS
// ══════════════════════════════════════════════
async function loadProjects() {
  setHtml('projectsGrid', '<div class="loading">Loading...</div>');
  try {
    const data = await api('/api/projects');
    setHtml('projectsGrid', data.length ? data.map(p => `
      <div class="admin-card">
        <div class="ac-icon">${esc(p.emoji)}</div>
        <div class="ac-title">${esc(p.title)}</div>
        <div class="ac-desc">${esc(p.description)}</div>
        <div class="ac-tags">${p.tech.split(',').map(t=>`<span class="ac-tag">${esc(t.trim())}</span>`).join('')}</div>
        <div class="ac-actions">
          <button class="tbl-btn tbl-btn-edit" onclick='openModal("projectModal",${JSON.stringify(p)})'>Edit</button>
          <button class="tbl-btn tbl-btn-del"  onclick="delProject(${p.id})">Delete</button>
        </div>
      </div>`).join('') : '<div class="empty-state"><span class="es-icon">◫</span>No projects yet.</div>');
  } catch { setHtml('projectsGrid', '<div class="empty-state" style="color:#f87171">Failed to load projects.</div>'); }
}

window.saveProject = async () => {
  const id = document.getElementById('pId').value;
  const body = {
    title:       document.getElementById('pTitle').value.trim(),
    category:    document.getElementById('pCat').value,
    description: document.getElementById('pDesc').value.trim(),
    tech:        document.getElementById('pTech').value.trim(),
    emoji:       document.getElementById('pEmoji').value.trim() || '◫',
    gradient:    document.getElementById('pGrad').value.trim() || 'linear-gradient(135deg,#0a2342,#1a5276)',
  };
  if (!body.title) return alert('Title is required.');
  try {
    if (id) await api('/api/projects/' + id, 'PUT', body);
    else    await api('/api/projects', 'POST', body);
    closeModal('projectModal');
    loadProjects();
    loadOverview();
  } catch (e) { alert('Error saving project: ' + e.message); }
};
window.delProject = async (id) => {
  if (!confirm('Delete this project from the public site?')) return;
  try { await api('/api/projects/' + id, 'DELETE'); loadProjects(); loadOverview(); }
  catch (e) { alert('Error: ' + e.message); }
};

// ══════════════════════════════════════════════
//  SERVICES
// ══════════════════════════════════════════════
async function loadServices() {
  setHtml('servicesGrid', '<div class="loading">Loading...</div>');
  try {
    const data = await api('/api/services');
    setHtml('servicesGrid', data.length ? data.map(s => `
      <div class="admin-card">
        <div class="ac-icon">${esc(s.icon)}</div>
        <div class="ac-title">${esc(s.name)}</div>
        <div class="ac-desc">${esc(s.description)}</div>
        <div class="ac-actions">
          <button class="tbl-btn tbl-btn-edit" onclick='openModal("serviceModal",${JSON.stringify(s)})'>Edit</button>
          <button class="tbl-btn tbl-btn-del"  onclick="delService(${s.id})">Delete</button>
        </div>
      </div>`).join('') : '<div class="empty-state"><span class="es-icon">⬡</span>No services yet.</div>');
  } catch { setHtml('servicesGrid', '<div class="empty-state" style="color:#f87171">Failed to load services.</div>'); }
}

window.saveService = async () => {
  const id = document.getElementById('svcId').value;
  const body = {
    icon:        document.getElementById('svcIcon').value.trim() || '⬡',
    name:        document.getElementById('svcName').value.trim(),
    description: document.getElementById('svcDesc').value.trim(),
    features:    document.getElementById('svcFeatures').value.trim(),
  };
  if (!body.name) return alert('Service name is required.');
  try {
    if (id) await api('/api/services/' + id, 'PUT', body);
    else    await api('/api/services', 'POST', body);
    closeModal('serviceModal');
    loadServices();
    loadOverview();
  } catch (e) { alert('Error saving service: ' + e.message); }
};
window.delService = async (id) => {
  if (!confirm('Delete this service from the public site?')) return;
  try { await api('/api/services/' + id, 'DELETE'); loadServices(); loadOverview(); }
  catch (e) { alert('Error: ' + e.message); }
};

// ══════════════════════════════════════════════
//  CLIENTS
// ══════════════════════════════════════════════
async function loadClients() {
  setHtml('clientsGrid', '<div class="loading">Loading...</div>');
  try {
    const data = await api('/api/clients');
    setHtml('clientsGrid', data.length ? data.map(c => `
      <div class="admin-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="width:40px;height:40px;border-radius:8px;background:${esc(c.gradient)};display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fff;flex-shrink:0">${esc(c.initials)}</div>
          <div><div class="ac-title" style="margin-bottom:2px">${esc(c.name)}</div><div style="font-size:12px;color:#8b99b8">${esc(c.industry)}</div></div>
        </div>
        ${c.testimonial?`<div class="ac-desc" style="font-style:italic">"${esc(c.testimonial.slice(0,80))}…"</div>`:''}
        <div class="ac-actions">
          <button class="tbl-btn tbl-btn-edit" onclick='openModal("clientModal",${JSON.stringify(c)})'>Edit</button>
          <button class="tbl-btn tbl-btn-del"  onclick="delClient(${c.id})">Delete</button>
        </div>
      </div>`).join('') : '<div class="empty-state"><span class="es-icon">🤝</span>No clients yet.</div>');
  } catch { setHtml('clientsGrid', '<div class="empty-state" style="color:#f87171">Failed to load clients.</div>'); }
}

window.saveClient = async () => {
  const id = document.getElementById('cliId').value;
  const body = {
    name:          document.getElementById('cliName').value.trim(),
    initials:      document.getElementById('cliInitials').value.trim().toUpperCase().slice(0,3),
    industry:      document.getElementById('cliIndustry').value.trim(),
    gradient:      document.getElementById('cliGrad').value.trim() || 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
    testimonial:   document.getElementById('cliTesti').value.trim(),
    contact_name:  document.getElementById('cliCName').value.trim(),
    contact_title: document.getElementById('cliCTitle').value.trim(),
  };
  if (!body.name) return alert('Company name is required.');
  try {
    if (id) await api('/api/clients/' + id, 'PUT', body);
    else    await api('/api/clients', 'POST', body);
    closeModal('clientModal');
    loadClients();
    loadOverview();
  } catch (e) { alert('Error saving client: ' + e.message); }
};
window.delClient = async (id) => {
  if (!confirm('Delete this client from the public site?')) return;
  try { await api('/api/clients/' + id, 'DELETE'); loadClients(); loadOverview(); }
  catch (e) { alert('Error: ' + e.message); }
};

// ══════════════════════════════════════════════
//  TEAM
// ══════════════════════════════════════════════
async function loadTeam() {
  try {
    const t = await api('/api/team');
    document.getElementById('tName').value      = t.full_name     || '';
    document.getElementById('tRole').value      = t.role          || '';
    document.getElementById('tRoleSub').value   = t.role_sub      || '';
    document.getElementById('tBio1').value      = t.bio1          || '';
    document.getElementById('tBio2').value      = t.bio2          || '';
    document.getElementById('tYears').value     = t.stat_years    || '';
    document.getElementById('tProjects').value  = t.stat_projects || '';
    document.getElementById('tClients').value   = t.stat_clients  || '';
    document.getElementById('tCountries').value = t.stat_countries|| '';
    document.getElementById('tExpertise').value = t.expertise     || '';
    document.getElementById('tLinkedin').value  = t.linkedin      || '';
    document.getElementById('tGithub').value    = t.github        || '';
    document.getElementById('tTwitter').value   = t.twitter       || '';

    // Update initials from name
    const initials = (t.full_name || 'RM').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    const initialsEl = document.getElementById('photoInitials');
    if (initialsEl) initialsEl.textContent = initials;

    // Show photo if one exists
    if (t.photo) {
      showPhotoPreview('/images/' + t.photo);
    } else {
      clearPhotoPreview();
    }
  } catch (e) { flash('teamStatus', '⚠ Could not load team data: ' + e.message, false); }
}

// ── Photo helpers ─────────────────────────────
function showPhotoPreview(url) {
  const img      = document.getElementById('photoImg');
  const initials = document.getElementById('photoInitials');
  const removeBtn = document.getElementById('removePhotoBtn');
  if (!img) return;
  img.src           = url + '?t=' + Date.now(); // cache bust
  img.style.display = 'block';
  if (initials) initials.style.display = 'none';
  if (removeBtn) removeBtn.style.display = 'inline-block';
}

function clearPhotoPreview() {
  const img       = document.getElementById('photoImg');
  const initials  = document.getElementById('photoInitials');
  const removeBtn = document.getElementById('removePhotoBtn');
  if (img)     { img.src = ''; img.style.display = 'none'; }
  if (initials) initials.style.display = 'flex';
  if (removeBtn) removeBtn.style.display = 'none';
}

// ── Photo file input change → auto upload ────
document.getElementById('photoInput')?.addEventListener('change', async function() {
  const file = this.files[0];
  if (!file) return;

  const statusEl = document.getElementById('photoStatus');
  statusEl.textContent  = 'Uploading...';
  statusEl.style.color  = '#8b99b8';

  const formData = new FormData();
  formData.append('photo', file);

  try {
    const res  = await fetch('/api/team/photo', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok && data.success) {
      showPhotoPreview(data.url);
      statusEl.textContent = '✓ Photo uploaded! Visible on the public Team page now.';
      statusEl.style.color = '#22c55e';
      setTimeout(() => statusEl.textContent = '', 4000);
    } else {
      statusEl.textContent = '⚠ Upload failed: ' + (data.error || 'Unknown error');
      statusEl.style.color = '#f87171';
    }
  } catch (err) {
    statusEl.textContent = '⚠ Upload failed. Is the server running?';
    statusEl.style.color = '#f87171';
  }

  // Reset file input so same file can be re-uploaded if needed
  this.value = '';
});

// ── Remove photo ──────────────────────────────
window.removePhoto = async function() {
  if (!confirm('Remove the CEO photo? The initials avatar will be shown instead.')) return;
  const statusEl = document.getElementById('photoStatus');
  try {
    const res  = await fetch('/api/team/photo', { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.success) {
      clearPhotoPreview();
      statusEl.textContent = '✓ Photo removed.';
      statusEl.style.color = '#22c55e';
      setTimeout(() => statusEl.textContent = '', 3000);
    } else {
      statusEl.textContent = '⚠ ' + (data.error || 'Failed to remove photo.');
      statusEl.style.color = '#f87171';
    }
  } catch (err) {
    statusEl.textContent = '⚠ Cannot reach server.';
    statusEl.style.color = '#f87171';
  }
};

window.saveTeam = async () => {
  const body = {
    full_name:      document.getElementById('tName').value.trim(),
    role:           document.getElementById('tRole').value.trim(),
    role_sub:       document.getElementById('tRoleSub').value.trim(),
    bio1:           document.getElementById('tBio1').value.trim(),
    bio2:           document.getElementById('tBio2').value.trim(),
    stat_years:     document.getElementById('tYears').value.trim(),
    stat_projects:  document.getElementById('tProjects').value.trim(),
    stat_clients:   document.getElementById('tClients').value.trim(),
    stat_countries: document.getElementById('tCountries').value.trim(),
    expertise:      document.getElementById('tExpertise').value.trim(),
    linkedin:       document.getElementById('tLinkedin').value.trim(),
    github:         document.getElementById('tGithub').value.trim(),
    twitter:        document.getElementById('tTwitter').value.trim(),
  };
  try {
    await api('/api/team', 'PUT', body);
    flash('teamStatus', '✓ Saved! Public Team page updated.');
  } catch (e) { flash('teamStatus', '⚠ Error: ' + e.message, false); }
};

// ══════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════
async function loadSettings() {
  try {
    const s = await api('/api/settings');
    document.getElementById('sName').value     = s.company_name   || '';
    document.getElementById('sTagline').value  = s.tagline        || '';
    document.getElementById('sEmail').value    = s.email          || '';
    document.getElementById('sPhone').value    = s.phone          || '';
    document.getElementById('sWhatsapp').value = s.whatsapp       || '';
    document.getElementById('sLocation').value = s.location       || '';
    document.getElementById('sSP').value       = s.stat_projects  || '';
    document.getElementById('sSC').value       = s.stat_clients   || '';
    document.getElementById('sSY').value       = s.stat_years     || '';
    document.getElementById('sFooter').value   = s.footer_desc    || '';
    document.getElementById('sSocT').value     = s.social_twitter || '';
    document.getElementById('sSocL').value     = s.social_linkedin|| '';
    document.getElementById('sSocG').value     = s.social_github  || '';
  } catch (e) { flash('settingsStatus', '⚠ Could not load settings: ' + e.message, false); }
}

window.saveSettings = async () => {
  const body = {
    company_name:    document.getElementById('sName').value.trim(),
    tagline:         document.getElementById('sTagline').value.trim(),
    email:           document.getElementById('sEmail').value.trim(),
    phone:           document.getElementById('sPhone').value.trim(),
    whatsapp:        document.getElementById('sWhatsapp').value.trim(),
    location:        document.getElementById('sLocation').value.trim(),
    stat_projects:   document.getElementById('sSP').value.trim(),
    stat_clients:    document.getElementById('sSC').value.trim(),
    stat_years:      document.getElementById('sSY').value.trim(),
    footer_desc:     document.getElementById('sFooter').value.trim(),
    social_twitter:  document.getElementById('sSocT').value.trim(),
    social_linkedin: document.getElementById('sSocL').value.trim(),
    social_github:   document.getElementById('sSocG').value.trim(),
  };
  try {
    await api('/api/settings', 'PUT', body);
    flash('settingsStatus', '✓ Saved! All public pages updated.');
  } catch (e) { flash('settingsStatus', '⚠ Error: ' + e.message, false); }
};

// ─── INIT ─────────────────────────────────────
loadOverview();
