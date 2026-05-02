/* =============================================
   RAZATECH — js/config.js
   ─────────────────────────────────────────────
   BEFORE DEPLOYING TO VERCEL:
   Replace the empty string below with your
   Railway backend URL. Example:
     'https://razatech-backend.up.railway.app'

   Leave it empty ('') for local development.
   ============================================= */

(function () {
  // ↓↓ PASTE YOUR RAILWAY URL HERE ↓↓
  var RAILWAY_URL = 'https://razatech-website-production-d0d4.up.railway.app';
  // ↑↑ e.g. 'https://razatech-backend.up.railway.app' ↑↑

  window.API_BASE = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) ? '' : RAILWAY_URL;
})();
