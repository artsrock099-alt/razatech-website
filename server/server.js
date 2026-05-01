// =============================================
// RAZATECH v4 — server/server.js
// Full REST API — all content served from MySQL
// =============================================

// ─── ALL REQUIRES FIRST ───────────────────────
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const db      = require('./db');

// ─── FILE UPLOAD SETUP (CEO photo) ────────────
// path is now available — safe to use here
const uploadDir = path.join(__dirname, '..', 'public', 'images');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'ceo' + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
  }
});

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── SANITIZE ─────────────────────────────────
function s(str, max) {
  max = max || 2000;
  return String(str || '').trim()
    .replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#x27;')
    .slice(0, max);
}

// ─── HEALTH ───────────────────────────────────
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ══════════════════════════════════════════════
//  SITE SETTINGS
// ══════════════════════════════════════════════
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM site_settings WHERE id=1');
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/settings', async (req, res) => {
  const { company_name, tagline, email, phone, whatsapp, location,
          stat_projects, stat_clients, stat_years, footer_desc,
          social_twitter, social_linkedin, social_github } = req.body;
  try {
    await db.execute(`UPDATE site_settings SET
      company_name=?, tagline=?, email=?, phone=?, whatsapp=?, location=?,
      stat_projects=?, stat_clients=?, stat_years=?, footer_desc=?,
      social_twitter=?, social_linkedin=?, social_github=?
      WHERE id=1`,
      [s(company_name,100), s(tagline,300), s(email,200), s(phone,50),
       s(whatsapp,50), s(location,200), s(stat_projects,20), s(stat_clients,20),
       s(stat_years,20), s(footer_desc,500), s(social_twitter,300),
       s(social_linkedin,300), s(social_github,300)]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
//  PROJECTS
// ══════════════════════════════════════════════
app.get('/api/projects', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM projects ORDER BY sort_order, id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/projects', async (req, res) => {
  const { title, category, description, tech, emoji, gradient } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required.' });
  try {
    const [r] = await db.execute(
      'INSERT INTO projects (title,category,description,tech,emoji,gradient) VALUES (?,?,?,?,?,?)',
      [s(title,255), s(category,50)||'web', s(description), s(tech,500), s(emoji,10)||'◫', s(gradient,200)]);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/projects/:id', async (req, res) => {
  const { title, category, description, tech, emoji, gradient } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required.' });
  try {
    await db.execute(
      'UPDATE projects SET title=?,category=?,description=?,tech=?,emoji=?,gradient=? WHERE id=?',
      [s(title,255), s(category,50)||'web', s(description), s(tech,500), s(emoji,10)||'◫', s(gradient,200), req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM projects WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
//  SERVICES
// ══════════════════════════════════════════════
app.get('/api/services', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM services ORDER BY sort_order, id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/services', async (req, res) => {
  const { icon, name, description, features } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required.' });
  try {
    const [r] = await db.execute(
      'INSERT INTO services (icon,name,description,features) VALUES (?,?,?,?)',
      [s(icon,10)||'⬡', s(name,255), s(description), s(features,2000)]);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/services/:id', async (req, res) => {
  const { icon, name, description, features } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required.' });
  try {
    await db.execute(
      'UPDATE services SET icon=?,name=?,description=?,features=? WHERE id=?',
      [s(icon,10)||'⬡', s(name,255), s(description), s(features,2000), req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM services WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
//  CLIENTS
// ══════════════════════════════════════════════
app.get('/api/clients', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM clients ORDER BY sort_order, id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients', async (req, res) => {
  const { name, initials, industry, gradient, testimonial, contact_name, contact_title } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required.' });
  try {
    const [r] = await db.execute(
      'INSERT INTO clients (name,initials,industry,gradient,testimonial,contact_name,contact_title) VALUES (?,?,?,?,?,?,?)',
      [s(name,255), s(initials,5).toUpperCase(), s(industry,255), s(gradient,200),
       s(testimonial), s(contact_name,255), s(contact_title,255)]);
    res.status(201).json({ success: true, id: r.insertId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clients/:id', async (req, res) => {
  const { name, initials, industry, gradient, testimonial, contact_name, contact_title } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name required.' });
  try {
    await db.execute(
      'UPDATE clients SET name=?,initials=?,industry=?,gradient=?,testimonial=?,contact_name=?,contact_title=? WHERE id=?',
      [s(name,255), s(initials,5).toUpperCase(), s(industry,255), s(gradient,200),
       s(testimonial), s(contact_name,255), s(contact_title,255), req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM clients WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
//  TEAM PROFILE
// ══════════════════════════════════════════════
app.get('/api/team', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM team_profile WHERE id=1');
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/team', async (req, res) => {
  const { full_name, role, role_sub, bio1, bio2,
          stat_years, stat_projects, stat_clients, stat_countries,
          expertise, linkedin, github, twitter } = req.body;
  try {
    await db.execute(`UPDATE team_profile SET
      full_name=?,role=?,role_sub=?,bio1=?,bio2=?,
      stat_years=?,stat_projects=?,stat_clients=?,stat_countries=?,
      expertise=?,linkedin=?,github=?,twitter=? WHERE id=1`,
      [s(full_name,255), s(role,255), s(role_sub,500), s(bio1), s(bio2),
       s(stat_years,20), s(stat_projects,20), s(stat_clients,20), s(stat_countries,20),
       s(expertise,1000), s(linkedin,300), s(github,300), s(twitter,300)]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ── POST /api/team/photo — upload CEO photo ───
app.post('/api/team/photo', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const filename = req.file.filename; // e.g. ceo.jpg
    await db.execute('UPDATE team_profile SET photo=? WHERE id=1', [filename]);
    res.json({ success: true, filename, url: '/images/' + filename });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/team/photo — remove CEO photo ─
app.delete('/api/team/photo', async (req, res) => {
  try {
    const [[row]] = await db.execute('SELECT photo FROM team_profile WHERE id=1');
    if (row && row.photo) {
      const filePath = path.join(uploadDir, row.photo);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.execute("UPDATE team_profile SET photo='' WHERE id=1");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
//  CONTACT MESSAGES
// ══════════════════════════════════════════════
app.post('/contact', async (req, res) => {
  const { name, email, phone, whatsapp, service, message } = req.body || {};
  const errs = [];
  if (!name || name.trim().length < 2) errs.push('Name required.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Valid email required.');
  if (!message || message.trim().length < 10) errs.push('Message too short (min 10 chars).');
  if (errs.length) return res.status(400).json({ error: errs.join(' ') });
  try {
    const [r] = await db.execute(
      'INSERT INTO contacts (name,email,phone,whatsapp,service,message) VALUES (?,?,?,?,?,?)',
      [s(name,255), s(email,255), s(phone,50), s(whatsapp,50), s(service,255), s(message)]);
    console.log('[Contact] New from', s(name,50), '— ID:', r.insertId);
    res.status(201).json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error. Try again.' }); }
});

app.get('/api/messages', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id,name,email,phone,whatsapp,service,message,is_read,created_at FROM contacts ORDER BY created_at DESC LIMIT 300');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/messages/:id/read', async (req, res) => {
  try {
    await db.execute('UPDATE contacts SET is_read=1 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM contacts WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── FALLBACK ─────────────────────────────────
// Static files are served by express.static above.
// This only catches clean URLs like /about, /services etc.
// Admin panel pages are served as static files — don't interfere.
app.get('*', (req, res) => {
  const p = req.path;
  // Let static file requests 404 naturally
  if (p.includes('.')) return res.status(404).send('Not found');
  // Admin panel — serve the admin index
  if (p.startsWith('/admin')) {
    return res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
  }
  // Everything else — serve public home page
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// Render requires binding to 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('RazaTech v4 running!');
  console.log('------------------------------------------');
  console.log('  Port:        ' + PORT);
  console.log('  Public site: /');
  console.log('  Admin panel: /admin/');
  console.log('  Health:      /api/health');
  console.log('------------------------------------------');
  console.log('');
});
