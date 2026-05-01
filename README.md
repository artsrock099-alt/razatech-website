# RazaTech v4 — Fully Dynamic Website + Admin Panel

## How It Works (the key fix)

**Previous versions** stored admin data in browser `localStorage` — which is
only available in that one browser tab. The public site never saw those changes.

**This version (v4)** stores ALL content in **MySQL**. Every public page fetches
its content from the API on load. When you save anything in the Admin Panel, it
writes to MySQL via the API — and the public site shows it immediately on the
next page load.

```
Admin Panel  →  POST/PUT /api/*  →  MySQL  →  GET /api/*  ←  Public Pages
```

---

## Folder Structure

```
/razatech-v4
  /public
    index.html                ← Home (dynamic: fetches projects + settings)
    /pages
      about.html              ← Static content + dynamic settings/footer
      services.html           ← Dynamic: renders from /api/services
      portfolio.html          ← Dynamic: renders from /api/projects
      team.html               ← Dynamic: renders from /api/team
      clients.html            ← Dynamic: renders from /api/clients
      contact.html            ← Contact form → POST /contact → MySQL
    /css
      global.css              ← Shared: navbar, footer, buttons, animations
      home.css                ← Home page only
      pages.css               ← All inner page components
    /js
      global.js               ← Theme toggle, mobile nav, scroll reveal
      home.js                 ← Particle canvas animation
      render.js               ← ★ THE BRIDGE: fetches API, renders HTML
    /admin
      index.html              ← Login page
      dashboard.html          ← Admin panel shell
      admin.css               ← Admin styles
      admin.js                ← ★ All CRUD calls go to /api/* → MySQL
    /images                   ← Add ceo.jpg here
  /server
    server.js                 ← Express + full REST API
    db.js                     ← MySQL pool
    setup.sql                 ← Creates all tables + seeds default data
  package.json
  .env.example
  README.md
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database (creates tables + seeds default content)
mysql -u root -p < server/setup.sql

# 3. Configure environment
cp .env.example .env
# Open .env and set your MySQL password

# 4. Start the server
npm start
```

Visit:
- **Public site** → http://localhost:5000
- **Admin panel** → http://localhost:5000/admin/

Admin login: `admin` / `razatech2025`

---

## API Reference

All admin changes go through these endpoints and are stored in MySQL.

### Settings (all pages read this)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/settings` | Get site settings |
| `PUT` | `/api/settings` | Update site settings |

### Projects (portfolio page)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Add new project |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |

### Services (services page)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/services` | List all services |
| `POST` | `/api/services` | Add service |
| `PUT` | `/api/services/:id` | Update service |
| `DELETE` | `/api/services/:id` | Delete service |

### Clients (clients page)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/clients` | List all clients |
| `POST` | `/api/clients` | Add client |
| `PUT` | `/api/clients/:id` | Update client |
| `DELETE` | `/api/clients/:id` | Delete client |

### Team Profile (team page)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/team` | Get CEO profile |
| `PUT` | `/api/team` | Update CEO profile |

### Contact Messages
| Method | Route | Description |
|---|---|---|
| `POST` | `/contact` | Submit message (public form) |
| `GET` | `/api/messages` | List all messages (admin) |
| `PUT` | `/api/messages/:id/read` | Mark as read |
| `DELETE` | `/api/messages/:id` | Delete message |

### Health
| Method | Route |
|---|---|
| `GET` | `/api/health` |

---

## Customisation Checklist

- [ ] Change admin password in `public/admin/index.html`
- [ ] Add CEO photo: save as `public/images/ceo.jpg` and update `team.html`
- [ ] Update all content via the Admin Panel (no file editing needed!)
- [ ] Set `ALLOWED_ORIGIN` in `.env` to your domain before going live

## Production Tips
- Use **pm2** to keep the server running: `pm2 start server/server.js`
- Put **Nginx** in front as a reverse proxy on port 80/443
- Add **rate limiting** to `/contact` with `express-rate-limit`
- Switch admin auth to proper JWT tokens for production security
