// =============================================
// RAZATECH v4 — server/db.js  (Railway Fixed)
//
// Railway provides a MySQL database that already
// exists. We must NOT run CREATE DATABASE or USE.
// We connect directly to the given database and
// only CREATE TABLEs if they don't exist.
//
// Railway env vars are named differently:
//   MYSQLHOST, MYSQLUSER, MYSQLPASSWORD,
//   MYSQLDATABASE, MYSQLPORT
// We support BOTH Railway and local .env names.
// =============================================
const mysql = require('mysql2/promise');

// Support Railway variable names AND local .env names
const DB_CONF = {
  host:     process.env.MYSQLHOST     || process.env.DB_HOST     || 'localhost',
  user:     process.env.MYSQLUSER     || process.env.DB_USER     || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME     || 'razatech_db',
  port:     parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
  charset:  'utf8mb4',
  ssl: process.env.MYSQLHOST ? { rejectUnauthorized: false } : false,
  waitForConnections: true,
  connectionLimit:    10,
  connectTimeout:     30000,
};

console.log('[DB] Connecting to:', DB_CONF.host + ':' + DB_CONF.port + '/' + DB_CONF.database);

// Export pool immediately — used by all API routes
const pool = mysql.createPool(DB_CONF);
module.exports = pool;

// ─── AUTO INIT ────────────────────────────────
// Connect directly (not via pool) to run CREATE TABLE
// Do NOT run CREATE DATABASE or USE — Railway manages that
(async () => {
  let conn;
  try {
    conn = await mysql.createConnection(DB_CONF);
    console.log('[DB] Connected successfully.');

    await createTables(conn);
    await seedData(conn);
    await conn.end();
    console.log('[DB] Initialization complete.');

  } catch (err) {
    if (conn) try { await conn.end(); } catch {}

    console.error('');
    console.error('==============================================');
    console.error('  DATABASE CONNECTION FAILED');
    console.error('==============================================');
    console.error('  Error:', err.message);
    console.error('');
    console.error('  If on Railway:');
    console.error('  1. Go to your Railway project');
    console.error('  2. Click your MySQL database service');
    console.error('  3. Go to "Variables" tab');
    console.error('  4. Click "Add to service" next to your');
    console.error('     Node.js service so it gets the vars');
    console.error('');
    console.error('  Required vars (Railway auto-provides):');
    console.error('  MYSQLHOST, MYSQLUSER, MYSQLPASSWORD,');
    console.error('  MYSQLDATABASE, MYSQLPORT');
    console.error('==============================================');
    console.error('');
  }
})();

// ─── CREATE TABLES ────────────────────────────
async function createTables(conn) {
  // contacts
  await conn.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id         INT           NOT NULL AUTO_INCREMENT,
      name       VARCHAR(255)  NOT NULL,
      email      VARCHAR(255)  NOT NULL,
      phone      VARCHAR(50)   DEFAULT '',
      whatsapp   VARCHAR(50)   DEFAULT '',
      service    VARCHAR(255)  DEFAULT '',
      message    TEXT          NOT NULL,
      is_read    TINYINT(1)    DEFAULT 0,
      created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_read    (is_read),
      INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // projects
  await conn.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id          INT          NOT NULL AUTO_INCREMENT,
      title       VARCHAR(255) NOT NULL,
      category    VARCHAR(50)  DEFAULT 'web',
      description TEXT         NOT NULL,
      tech        VARCHAR(500) DEFAULT '',
      emoji       VARCHAR(10)  DEFAULT '◫',
      gradient    VARCHAR(200) DEFAULT 'linear-gradient(135deg,#0a2342,#1a5276)',
      sort_order  INT          DEFAULT 0,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // services
  await conn.query(`
    CREATE TABLE IF NOT EXISTS services (
      id          INT          NOT NULL AUTO_INCREMENT,
      icon        VARCHAR(10)  DEFAULT '⬡',
      name        VARCHAR(255) NOT NULL,
      description TEXT         NOT NULL,
      features    TEXT         DEFAULT '',
      sort_order  INT          DEFAULT 0,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // clients
  await conn.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id            INT          NOT NULL AUTO_INCREMENT,
      name          VARCHAR(255) NOT NULL,
      initials      VARCHAR(5)   DEFAULT '',
      industry      VARCHAR(255) DEFAULT '',
      gradient      VARCHAR(200) DEFAULT 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
      testimonial   TEXT         DEFAULT '',
      contact_name  VARCHAR(255) DEFAULT '',
      contact_title VARCHAR(255) DEFAULT '',
      sort_order    INT          DEFAULT 0,
      created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // team_profile
  await conn.query(`
    CREATE TABLE IF NOT EXISTS team_profile (
      id             INT          NOT NULL AUTO_INCREMENT,
      full_name      VARCHAR(255) DEFAULT 'Raza Muhamad',
      role           VARCHAR(255) DEFAULT 'CEO & Founder',
      role_sub       VARCHAR(500) DEFAULT 'Full-Stack Developer · Blockchain Engineer · Tech Entrepreneur',
      bio1           TEXT,
      bio2           TEXT,
      stat_years     VARCHAR(20)  DEFAULT '5+',
      stat_projects  VARCHAR(20)  DEFAULT '50+',
      stat_clients   VARCHAR(20)  DEFAULT '30+',
      stat_countries VARCHAR(20)  DEFAULT '3',
      expertise      TEXT,
      photo          VARCHAR(255) DEFAULT '',
      linkedin       VARCHAR(500) DEFAULT '',
      github         VARCHAR(500) DEFAULT '',
      twitter        VARCHAR(500) DEFAULT '',
      updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // site_settings
  await conn.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id              INT          NOT NULL AUTO_INCREMENT,
      company_name    VARCHAR(255) DEFAULT 'RazaTech',
      tagline         VARCHAR(500) DEFAULT 'Innovative Digital Solutions',
      email           VARCHAR(255) DEFAULT 'razatech@gmail.com',
      phone           VARCHAR(50)  DEFAULT '+256 700 000 000',
      whatsapp        VARCHAR(50)  DEFAULT '256700000000',
      location        VARCHAR(255) DEFAULT 'Kampala, Uganda',
      stat_projects   VARCHAR(20)  DEFAULT '50+',
      stat_clients    VARCHAR(20)  DEFAULT '30+',
      stat_years      VARCHAR(20)  DEFAULT '5+',
      footer_desc     TEXT,
      social_twitter  VARCHAR(500) DEFAULT '',
      social_linkedin VARCHAR(500) DEFAULT '',
      social_github   VARCHAR(500) DEFAULT '',
      updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Safely add columns that may be missing in older installs
  try {
    await conn.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone    VARCHAR(50) DEFAULT '' AFTER service`);
    await conn.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50) DEFAULT '' AFTER phone`);
    await conn.query(`ALTER TABLE team_profile ADD COLUMN IF NOT EXISTS photo VARCHAR(255) DEFAULT '' AFTER expertise`);
  } catch (e) { /* columns already exist — ignore */ }

  console.log('[DB] All tables ready.');
}

// ─── SEED DATA ────────────────────────────────
async function seedData(conn) {
  const [[{c: pc}]] = await conn.query('SELECT COUNT(*) AS c FROM projects');
  if (pc === 0) {
    await conn.query(`INSERT INTO projects (title,category,description,tech,emoji,gradient,sort_order) VALUES
      ('Blockchain Voting System','blockchain','Tamper-proof decentralized voting on Ethereum. Transparent, verifiable, and anonymous results.','Solidity, Web3.js, React, Node.js','⛓','linear-gradient(135deg,#0a1628,#3b82f6)',1),
      ('Environmental Monitoring System','iot','Real-time IoT platform collecting air quality, temperature and pollution data with live alerts.','IoT, Node.js, MySQL, Chart.js','🌍','linear-gradient(135deg,#052e16,#22c55e)',2),
      ('Smart Waste Management System','iot','Sensor-based bin fill-level monitoring with optimized collection routing for cities.','IoT, React, Python, MySQL','♻','linear-gradient(135deg,#1a2e05,#65a30d)',3),
      ('Civil Engineering Project Portal','civil','Full lifecycle management for construction firms — phases, materials, workforce and reports.','Node.js, React, MySQL, PDF','🏗','linear-gradient(135deg,#1c1003,#d97706)',4),
      ('SACCO Management System','web','Full-featured savings and credit cooperative with member management, loans and financial reports.','Node.js, MySQL, Express','🏦','linear-gradient(135deg,#0a2342,#1a5276)',5),
      ('E-Commerce Platform','web','Modern online store with product catalog, cart, payment gateway and admin dashboard.','Node.js, Express, MySQL','🛒','linear-gradient(135deg,#3b1a00,#d4680a)',6),
      ('School Management System','web','Comprehensive portal for enrollment, grading, attendance, fees and parent communication.','JavaScript, PHP, MySQL','🏫','linear-gradient(135deg,#2c0a3b,#7b29c8)',7),
      ('Inventory Management Portal','web','Real-time stock tracking with alerts, supplier management and automated purchase orders.','React, MySQL, REST API','📦','linear-gradient(135deg,#0d3b1e,#1d7a40)',8)`
    );
    console.log('[DB] Seeded projects.');
  }

  const [[{c: sc}]] = await conn.query('SELECT COUNT(*) AS c FROM services');
  if (sc === 0) {
    await conn.query(`INSERT INTO services (icon,name,description,features,sort_order) VALUES
      ('⬡','Web Development','Responsive, fast, and accessible websites and web apps built with modern stacks.','Landing pages & portfolios,E-commerce platforms,Custom web applications,Progressive Web Apps',1),
      ('◫','System Development','Custom enterprise systems including SACCO management, payroll, and internal tools.','SACCO management systems,HR & payroll systems,Inventory & POS systems,School management portals',2),
      ('⬢','Database Design','Robust relational and NoSQL database architecture optimized for performance.','Schema & ER design,Query optimization,Data migration & backup,MySQL / PostgreSQL / MongoDB',3),
      ('◎','IT Consulting','Strategic technology guidance for your business architecture and digital direction.','Tech stack recommendations,System audits & reviews,Digital transformation,Security assessments',4),
      ('⛓','Blockchain & Web3','Decentralized applications using smart contracts and transparent digital ledgers.','Smart contract development,Blockchain voting systems,NFT & token platforms,DApp development',5),
      ('🌍','IoT & Environmental Tech','Smart sensor integration and real-time environmental monitoring platforms.','Environmental monitoring,Smart waste management,IoT sensor dashboards,Real-time data pipelines',6),
      ('🏗','Civil Engineering Tech','Digital platforms for civil engineering project tracking and structural reporting.','Project management portals,Structural data systems,Site inspection dashboards,BIM data integration',7),
      ('☁','Cloud & DevOps','Deploy and scale applications on modern cloud infrastructure with automated pipelines.','AWS / GCP deployment,Docker & containerization,CI/CD pipeline setup,Server monitoring & uptime',8),
      ('📱','Mobile App Development','Cross-platform mobile applications built with React Native for iOS and Android.','React Native apps,Offline-first architecture,Push notifications,App Store deployment',9),
      ('🔒','Cybersecurity','Protect your digital assets with penetration testing and security hardening.','Penetration testing,Vulnerability scanning,SSL & encryption setup,Security awareness training',10),
      ('📊','Data Analytics & BI','Transform raw data into actionable insights with custom dashboards and reports.','Custom BI dashboards,Data visualization,Automated report generation,KPI tracking systems',11),
      ('🤖','AI & Automation','Integrate machine learning, chatbots, and automation workflows to boost productivity.','AI chatbot integration,Business process automation,ML model deployment,OpenAI/Gemini API',12)`
    );
    console.log('[DB] Seeded services.');
  }

  const [[{c: cc}]] = await conn.query('SELECT COUNT(*) AS c FROM clients');
  if (cc === 0) {
    await conn.query(`INSERT INTO clients (name,initials,industry,gradient,testimonial,contact_name,contact_title,sort_order) VALUES
      ('NileTech Bank','NB','Financial Services','linear-gradient(135deg,#1e3a8a,#3b82f6)','RazaTech built our SACCO system from scratch. Outstanding quality and speed of delivery.','James Mugisha','CEO, NileTech Bank',1),
      ('GreenFields Uganda','GF','Agriculture & IoT','linear-gradient(135deg,#14532d,#22c55e)','','','',2),
      ('Savanna Builders','SB','Civil Engineering','linear-gradient(135deg,#7c2d12,#f97316)','Delivered on time and on budget. Project tracking saved us hours every week.','David Kato','MD, Savanna Builders',3),
      ('EcoVision Systems','EV','Environmental Tech','linear-gradient(135deg,#0c4a6e,#06b6d4)','The environmental dashboard is world-class. Real-time data, beautiful UI, reliable 24/7.','Sarah Auma','Director, EcoVision',4),
      ('UniPay Africa','UP','Fintech & Payments','linear-gradient(135deg,#831843,#ec4899)','','','',5),
      ('KampalaEdge','KE','IT Consulting','linear-gradient(135deg,#1e1b4b,#6366f1)','','','',6),
      ('MatrixSoft Ltd','MX','Enterprise Software','linear-gradient(135deg,#4c1d95,#8b5cf6)','','','',7),
      ('SmartCity Corp','SC','Smart Infrastructure','linear-gradient(135deg,#1a2e05,#65a30d)','','','',8)`
    );
    console.log('[DB] Seeded clients.');
  }

  const [[{c: tc}]] = await conn.query('SELECT COUNT(*) AS c FROM team_profile');
  if (tc === 0) {
    await conn.query(
      `INSERT INTO team_profile (full_name,role,role_sub,bio1,bio2,stat_years,stat_projects,stat_clients,stat_countries,expertise,linkedin,github,twitter) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ['Raza Muhamad','CEO & Founder',
       'Full-Stack Developer · Blockchain Engineer · Tech Entrepreneur',
       'Raza Muhamad is the founder and CEO of RazaTech — a passionate software engineer with over 5 years of experience building digital solutions across East Africa.',
       'His work includes blockchain voting systems, smart environmental monitoring platforms, civil engineering portals, and SACCO management tools.',
       '5+','50+','30+','3',
       'Full-Stack Dev,Blockchain,IoT Systems,Team Leadership,System Architecture,Entrepreneurship,Smart Contracts,Cloud & DevOps',
       '','','']
    );
    console.log('[DB] Seeded team profile.');
  }

  const [[{c: stc}]] = await conn.query('SELECT COUNT(*) AS c FROM site_settings');
  if (stc === 0) {
    await conn.query(
      `INSERT INTO site_settings (company_name,tagline,email,phone,whatsapp,location,stat_projects,stat_clients,stat_years,footer_desc) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      ['RazaTech','Innovative Digital Solutions','razatech@gmail.com',
       '+256 700 000 000','256700000000','Kampala, Uganda',
       '50+','30+','5+',
       'Innovative digital solutions for businesses across East Africa and beyond.']
    );
    console.log('[DB] Seeded site settings.');
  }
}
