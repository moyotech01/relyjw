const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'weeks.json');

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());
app.use(session({
  secret: 'relyjw-moyo-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 }
}));

// Serve the single HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatWeekLabel(startDate) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const m = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  if (start.getMonth() === end.getMonth()) {
    return `${m[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${m[start.getMonth()]} ${start.getDate()} – ${m[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

function getWeekId(d) {
  return new Date(d).toISOString().split('T')[0];
}

function loadWeeks() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; }
}
function saveWeeks(w) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(w, null, 2));
}

// Memory storage so we can convert to base64
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF allowed'));
  },
  limits: { fileSize: 15 * 1024 * 1024 }
});

app.get('/api/weeks', (req, res) => {
  const weeks = loadWeeks();
  const currentStart = getCurrentWeekStart();
  res.json({
    currentWeekId: getWeekId(currentStart),
    currentWeekLabel: formatWeekLabel(currentStart),
    weeks: weeks.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  });
});

app.get('/api/weeks/:id', (req, res) => {
  const week = loadWeeks().find(w => w.id === req.params.id);
  if (!week) return res.status(404).json({ error: 'Not found' });
  res.json(week);
});

// Serve PDF from base64
app.get('/api/pdf/:weekId/:type', (req, res) => {
  const week = loadWeeks().find(w => w.id === req.params.weekId);
  if (!week) return res.status(404).send('Not found');
  const key = req.params.type; // lmMain, lmCbs, watchtower
  if (!week[key]) return res.status(404).send('No file');
  const buffer = Buffer.from(week[key], 'base64');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${key}.pdf"`);
  res.send(buffer);
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.password === 'Moyo') {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/admin/check', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

app.post('/api/admin/weeks', requireAuth, upload.fields([
  { name: 'lmMain', maxCount: 1 },
  { name: 'lmCbs', maxCount: 1 },
  { name: 'watchtower', maxCount: 1 }
]), (req, res) => {
  try {
    const { startDate } = req.body;
    if (!startDate) return res.status(400).json({ error: 'Start date required' });
    const id = getWeekId(startDate);
    let weeks = loadWeeks();
    let week = weeks.find(w => w.id === id);
    if (!week) {
      week = {
        id,
        startDate,
        label: formatWeekLabel(startDate),
        lmMain: null,
        lmCbs: null,
        watchtower: null
      };
      weeks.push(week);
    }
    if (req.files?.lmMain?.[0]) {
      week.lmMain = req.files.lmMain[0].buffer.toString('base64');
    }
    if (req.files?.lmCbs?.[0]) {
      week.lmCbs = req.files.lmCbs[0].buffer.toString('base64');
    }
    if (req.files?.watchtower?.[0]) {
      week.watchtower = req.files.watchtower[0].buffer.toString('base64');
    }
    week.updatedAt = new Date().toISOString();
    saveWeeks(weeks);
    res.json({ success: true, week: { id: week.id, label: week.label } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/weeks/:id', requireAuth, (req, res) => {
  const weeks = loadWeeks().filter(w => w.id !== req.params.id);
  saveWeeks(weeks);
  res.json({ success: true });
});

app.listen(PORT, () => console.log('RelyJW running on port ' + PORT));
