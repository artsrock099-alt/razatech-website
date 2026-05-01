/* =============================================
   RAZATECH — js/global.js
   ============================================= */

// ─── THEME ───────────────────────────────────
const html = document.documentElement;
const savedTheme = localStorage.getItem('razatech-theme') || 'dark';
html.setAttribute('data-theme', savedTheme);

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('razatech-theme', next);
  });
}

// ─── NAVBAR SCROLL ───────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ─── MOBILE NAV ──────────────────────────────
const hamburger  = document.getElementById('hamburger');
const navLinks   = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

function closeNav() {
  navLinks?.classList.remove('open');
  hamburger?.classList.remove('open');
  navOverlay?.classList.remove('active');
  document.body.style.overflow = '';
}

hamburger?.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  navOverlay?.classList.toggle('active', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
navOverlay?.addEventListener('click', closeNav);
navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

// ─── SCROLL REVEAL ────────────────────────────
// FIX: rootMargin '0px' so elements already in the
// viewport on page load are revealed immediately.
// Also expose initReveal() so render.js can call it
// after dynamically injecting new .reveal elements.
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px 0px 0px'   // no negative bottom margin — catches all in-viewport elements
  });

  document.querySelectorAll('.reveal:not(.visible), .fade-up:not(.visible)')
    .forEach(el => obs.observe(el));
}

// Run on load, and again after a short delay to catch
// any elements that were in the viewport from the start.
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  // Second pass after 100ms — catches above-fold elements
  // that the observer may have missed on first evaluation
  setTimeout(initReveal, 100);
});

// Expose globally so render.js can call after dynamic render
window.initReveal = initReveal;
