const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'weeks.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'relyjw-secret-key-moyo-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

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
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const startMonth = months[start.getMonth()];
  const endMonth = months[end.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();
  if (start.getMonth() === end.getMonth()) return `${startMonth} ${startDay}–${endDay}, ${year}`;
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

function getWeekId(startDate) {
  return new Date(startDate).toISOString().split('T')[0];
}

function loadWeeks() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return []; }
}

function saveWeeks(weeks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(weeks, null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const weekId = req.body.weekId || getWeekId(req.body.startDate);
    const dir = path.join(UPLOADS_DIR, weekId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const type = file.fieldname;
    cb(null, `${type}.pdf`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.get('/api/weeks', (req, res) => {
  const weeks = loadWeeks();
  const currentStart = getCurrentWeekStart();
  const currentId = getWeekId(currentStart);
  const sorted = weeks.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  res.json({
    currentWeekId: currentId,
    currentWeekLabel: formatWeekLabel(currentStart),
    weeks: sorted
  });
});

app.get('/api/weeks/:id', (req, res) => {
  const weeks = loadWeeks();
  const week = weeks.find(w => w.id === req.params.id);
  if (!week) return res.status(404).json({ error: 'Week not found' });
  res.json(week);
});

app.post('/api/admin/login', (req, res) => {
  if (req.body.password === 'Moyo') {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Incorrect password' });
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
    const weeks = loadWeeks();
    let week = weeks.find(w => w.id === id);
    if (!week) {
      week = {
        id,
        startDate,
        label: formatWeekLabel(startDate),
        lmMain: null,
        lmCbs: null,
        watchtower: null,
        createdAt: new Date().toISOString()
      };
      weeks.push(week);
    }
    if (req.files) {
      if (req.files.lmMain) week.lmMain = `/uploads/${id}/lmMain.pdf`;
      if (req.files.lmCbs) week.lmCbs = `/uploads/${id}/lmCbs.pdf`;
      if (req.files.watchtower) week.watchtower = `/uploads/${id}/watchtower.pdf`;
    }
    week.updatedAt = new Date().toISOString();
    saveWeeks(weeks);
    res.json({ success: true, week });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/weeks/:id', requireAuth, (req, res) => {
  let weeks = loadWeeks();
  weeks = weeks.filter(w => w.id !== req.params.id);
  saveWeeks(weeks);
  const dir = path.join(UPLOADS_DIR, req.params.id);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`RelyJW running at http://localhost:${PORT}`);
});
