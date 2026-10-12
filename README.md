# RelyJW — Meeting Answers Platform

Professional website for sharing Jehovah’s Witnesses meeting answers (Life & Ministry + Watchtower Study).

## Features
- Automatic current week detection
- Admin panel (password: Moyo)
- Upload 3 PDFs per week:
  1. Life & Ministry – Main Answers
  2. Life & Ministry – Congregation Bible Study
  3. Watchtower Study Answers
- View + Download documents
- WhatsApp contact button (08129961562)
- Clean dark professional design (SVG icons only)

## How to Run

```bash
npm install
npm start
```

Open http://localhost:3000

## Admin
1. Click "Admin" in the header
2. Password: **Moyo**
3. Add Week → select the Monday date → upload the 3 PDFs → Save

## Project Structure
- server.js          → Backend (Express)
- public/            → Frontend
- data/weeks.json    → Week metadata
- uploads/           → PDF storage
