/* =============================================
   RAZATECH — js/render.js
   Shared helpers: fetch from API + render HTML
   Every public page calls these on load so that
   admin changes appear immediately.
   ============================================= */

const API = '';   // same origin — empty string = relative URL

// ── Fetch with graceful fallback ──────────────
async function apiFetch(url) {
  try {
    const r = await fetch(API + url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch (e) {
    console.warn('[RazaTech] Could not reach API:', url, e.message);
    return null;
  }
}

// ── Safe HTML escape ──────────────────────────
function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════
//  SETTINGS — inject into navbar logo, footer, WhatsApp FAB
// ══════════════════════════════════════════════
async function applySettings() {
  const s = await apiFetch('/api/settings');
  if (!s) return;

  // Company name in all logo elements
  document.querySelectorAll('.nav-logo').forEach(el => {
    el.innerHTML = esc(s.company_name) + '<span>' + esc(s.company_name.slice(-4)) + '</span>';
    // simpler: keep "RazaTech" style — first part + last 4 as accent
    // Actually just replace text nodes properly:
    el.innerHTML = esc(s.company_name.slice(0,-4)) + '<span>' + esc(s.company_name.slice(-4)) + '</span>';
  });

  // Page title
  const base = esc(s.company_name) + ' — ' + esc(s.tagline);
  if (document.title.includes('—')) {
    document.title = document.title.split('—')[0].trim() + ' — ' + esc(s.company_name);
  }

  // Footer description
  const fd = document.getElementById('footerDesc');
  if (fd && s.footer_desc) fd.textContent = s.footer_desc;

  // Footer contact links
  const fe = document.getElementById('footerEmail');
  if (fe) { fe.href = 'mailto:' + s.email; fe.textContent = s.email; }
  const fp = document.getElementById('footerPhone');
  if (fp) { fp.href = 'tel:' + s.phone.replace(/\s/g,''); fp.textContent = s.phone; }

  // WhatsApp FAB
  document.querySelectorAll('.whatsapp-fab').forEach(el => {
    el.href = 'https://wa.me/' + s.whatsapp;
  });
  // Contact page WhatsApp button
  const waBtn = document.querySelector('.channel-btn.whatsapp');
  if (waBtn) waBtn.href = 'https://wa.me/' + s.whatsapp;
  const waSpan = document.querySelector('.channel-btn.whatsapp span:not(.ch-icon):not(.ch-arrow)');
  if (waSpan) waSpan.textContent = 'Chat with us now';

  const phBtn = document.querySelector('.channel-btn.phone');
  if (phBtn) { phBtn.href = 'tel:' + s.phone.replace(/\s/g,''); }
  const phSpan = document.querySelector('.channel-btn.phone span:not(.ch-icon):not(.ch-arrow)');
  if (phSpan) phSpan.textContent = s.phone;

  const emBtn = document.querySelector('.channel-btn.email');
  if (emBtn) emBtn.href = 'mailto:' + s.email;
  const emSpan = document.querySelector('.channel-btn.email span:not(.ch-icon):not(.ch-arrow)');
  if (emSpan) emSpan.textContent = s.email;

  // Home page stats
  const statProj = document.getElementById('heroStatProjects');
  const statCli  = document.getElementById('heroStatClients');
  const statYrs  = document.getElementById('heroStatYears');
  if (statProj) statProj.textContent = s.stat_projects;
  if (statCli)  statCli.textContent  = s.stat_clients;
  if (statYrs)  statYrs.textContent  = s.stat_years;

  // Social links
  const socials = [
    { id: 'socialTwitter',  val: s.social_twitter },
    { id: 'socialLinkedin', val: s.social_linkedin },
    { id: 'socialGithub',   val: s.social_github },
  ];
  socials.forEach(({ id, val }) => {
    const el = document.getElementById(id);
    if (el && val) el.href = val;
  });
}

// ══════════════════════════════════════════════
//  SERVICES — render on services.html
// ══════════════════════════════════════════════
async function renderServicesPage() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-msg">Loading services...</div>';
  const data = await apiFetch('/api/services');
  if (!data || !data.length) {
    grid.innerHTML = '<p style="color:var(--text-secondary);padding:40px">No services found.</p>';
    return;
  }
  grid.innerHTML = data.map(svc => `
    <div class="service-card glass reveal">
      <div class="service-icon">${esc(svc.icon)}</div>
      <h3>${esc(svc.name)}</h3>
      <p>${esc(svc.description)}</p>
      <ul class="service-list">
        ${svc.features.split(',').map(f => `<li>${esc(f.trim())}</li>`).join('')}
      </ul>
      <div class="service-hover-line"></div>
    </div>`).join('');
  if (window.initReveal) window.initReveal();
}

// ══════════════════════════════════════════════
//  PORTFOLIO — render on portfolio.html
// ══════════════════════════════════════════════
async function renderPortfolioPage() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-msg">Loading projects...</div>';
  const data = await apiFetch('/api/projects');
  if (!data || !data.length) {
    grid.innerHTML = '<p style="color:var(--text-secondary);padding:40px">No projects found.</p>';
    return;
  }
  grid.innerHTML = data.map(p => `
    <div class="project-card reveal" data-cat="${esc(p.category)}">
      <div class="project-img" style="background:${esc(p.gradient)}">
        <span class="project-emoji">${esc(p.emoji)}</span>
      </div>
      <div class="project-info">
        <div class="project-tags">
          ${p.tech.split(',').map(t => `<span>${esc(t.trim())}</span>`).join('')}
        </div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <a href="contact.html" class="project-link">Enquire About This →</a>
      </div>
    </div>`).join('');
  if (window.initReveal) window.initReveal();
  // Re-attach filter buttons
  attachPortfolioFilter();
}

function attachPortfolioFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.project-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.cat === filter) ? '' : 'none';
      });
    });
  });
}

// ══════════════════════════════════════════════
//  TEAM — render on team.html
// ══════════════════════════════════════════════
async function renderTeamPage() {
  const wrap = document.getElementById('ceoWrap');
  if (!wrap) return;
  const t = await apiFetch('/api/team');
  if (!t) return;

  const tags = (t.expertise || '').split(',').map(tag =>
    `<span class="expertise-tag">${esc(tag.trim())}</span>`).join('');

  wrap.innerHTML = `
    <div class="ceo-card glass">
      <div class="ceo-photo-col">
        <div class="ceo-photo-frame">
          <div class="ceo-photo-ring"></div>
          <div class="ceo-photo-ring ring-2"></div>
          <div class="ceo-avatar" id="ceoAvatarWrap">
            ${t.photo
              ? `<img src="/images/${esc(t.photo)}?t=${Date.now()}" alt="${esc(t.full_name)}" class="ceo-img" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`
              : `<div class="ceo-initials-wrap">
                   <span class="ceo-initials">${esc((t.full_name||'RM').split(' ').map(w=>w[0]).join('').slice(0,2))}</span>
                 </div>`
            }
          </div>
        </div>
        <div class="ceo-badge-pill">${esc(t.role)}</div>
        <div class="ceo-social-strip">
          ${t.linkedin ? `<a href="${esc(t.linkedin)}" class="ceo-social-btn" target="_blank">in</a>` : ''}
          ${t.twitter  ? `<a href="${esc(t.twitter)}"  class="ceo-social-btn" target="_blank">𝕏</a>` : ''}
          ${t.github   ? `<a href="${esc(t.github)}"   class="ceo-social-btn" target="_blank">⌥</a>` : ''}
          <a href="contact.html" class="ceo-social-btn">✉</a>
        </div>
      </div>
      <div class="ceo-info-col">
        <h2 class="ceo-name">${esc(t.full_name).replace(/ (\S+)$/, ' <span class="gradient-text">$1</span>')}</h2>
        <p class="ceo-role-line">${esc(t.role_sub)}</p>
        <p class="ceo-bio">${esc(t.bio1)}</p>
        <p class="ceo-bio">${esc(t.bio2)}</p>
        <div class="ceo-stats-row">
          <div class="ceo-stat glass"><strong>${esc(t.stat_years)}</strong><span>Years coding</span></div>
          <div class="ceo-stat glass"><strong>${esc(t.stat_projects)}</strong><span>Projects led</span></div>
          <div class="ceo-stat glass"><strong>${esc(t.stat_clients)}</strong><span>Clients served</span></div>
          <div class="ceo-stat glass"><strong>${esc(t.stat_countries)}</strong><span>Countries</span></div>
        </div>
        <div class="ceo-expertise">${tags}</div>
        <div class="ceo-actions">
          <a href="contact.html" class="btn btn-primary">Work With Us</a>
          <a href="contact.html" class="btn btn-ghost">Send Message</a>
        </div>
      </div>
    </div>`;
  if (window.initReveal) window.initReveal();
}

// ══════════════════════════════════════════════
//  CLIENTS — render on clients.html
// ══════════════════════════════════════════════
async function renderClientsPage() {
  const marqueeInner  = document.getElementById('marqueeInner');
  const testiGrid     = document.getElementById('testiGrid');
  if (!marqueeInner && !testiGrid) return;

  const data = await apiFetch('/api/clients');
  if (!data || !data.length) return;

  // Marquee — duplicate list for infinite scroll
  if (marqueeInner) {
    const cards = data.map(c => `
      <div class="client-logo-card">
        <div class="client-logo-icon" style="background:${esc(c.gradient)}">${esc(c.initials)}</div>
        <div class="client-logo-info">
          <strong>${esc(c.name)}</strong>
          <span>${esc(c.industry)}</span>
        </div>
      </div>`).join('');
    marqueeInner.innerHTML = cards + cards; // duplicate for seamless loop
  }

  // Testimonials
  if (testiGrid) {
    const withTesti = data.filter(c => c.testimonial && c.testimonial.trim());
    if (!withTesti.length) {
      testiGrid.innerHTML = '<p style="color:var(--text-secondary)">Testimonials coming soon.</p>';
      return;
    }
    testiGrid.innerHTML = withTesti.map(c => `
      <div class="testimonial-card glass reveal">
        <div class="testi-quote">"</div>
        <p class="testi-text">${esc(c.testimonial)}</p>
        <div class="testi-author">
          <div class="testi-avatar" style="background:${esc(c.gradient)}">${esc(c.initials)}</div>
          <div>
            <strong>${esc(c.contact_name)}</strong>
            <span>${esc(c.contact_title)}</span>
          </div>
          <div class="testi-stars">★★★★★</div>
        </div>
      </div>`).join('');
    if (window.initReveal) window.initReveal();
  }
}

// ══════════════════════════════════════════════
//  HOME PAGE — featured projects + service cards
// ══════════════════════════════════════════════
async function renderHomeFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const data = await apiFetch('/api/projects');
  if (!data || !data.length) return;
  grid.innerHTML = data.slice(0, 4).map(p => `
    <a href="pages/portfolio.html" class="featured-card reveal">
      <div class="fc-img" style="background:${esc(p.gradient)}">
        <span class="fc-emoji">${esc(p.emoji)}</span>
      </div>
      <div class="fc-info">
        <span class="fc-tag">${esc(p.category)}</span>
        <h4>${esc(p.title)}</h4>
      </div>
    </a>`).join('');
  if (window.initReveal) window.initReveal();
}


