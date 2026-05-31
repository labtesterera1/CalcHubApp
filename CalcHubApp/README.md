# CalcHubApp

**Professional Calculation Hub — PWA**  
Warm-black · Lime-accent · Instrument-panel aesthetic

## Features

| Module | Description |
|--------|-------------|
| 🖥️ PSM Server | NIK PSM Storage Sizing Calculator |
| 🔐 Vault Server | NIK Vault Server Storage Sizing |
| ⚖️ Unit Converter | Storage units (Bytes → PB) + Bandwidth |
| 🎓 Score Card | Student marks, grades, gap analysis |
| 💰 Loan EMI | Personal loan EMI + amortisation |
| 📅 Date / Age | Age, date diff, future dates, work days |
| ⏱️ Time | Time converter + world clock |

## PWA Features
- ✅ Installable on Android (Chrome) & Desktop (Edge/Chrome)
- ✅ Offline-first via Service Worker
- ✅ IndexedDB + localStorage persistence
- ✅ Export / Import data as JSON
- ✅ Profile with photo
- ✅ Custom banner image
- ✅ Semantic versioning

## Deploy via GitHub Pages

1. Push this folder to a public GitHub repo named `CalcHubApp`
2. Go to **Settings → Pages → Source: Deploy from branch**
3. Select `main` branch, root `/` folder
4. Your app will be at: `https://<username>.github.io/CalcHubApp/`

## Tech Stack
- Vanilla JS ES Modules (no build step, no framework)
- IndexedDB + localStorage storage
- Service Worker (offline-first)
- Web App Manifest (PWA installable)
- Instrument Serif + JetBrains Mono fonts

## Version History
- **v1.0.0** — Initial release (7 modules)

## Module Architecture
```
CalcHubApp/
├── index.html          # App shell + routing
├── sw.js               # Service Worker
├── manifest.json       # PWA manifest
├── icons/              # PWA icons (72 → 512px)
└── modules/
    ├── registry.js     # Central module registration
    ├── storage.js      # IndexedDB + localStorage layer
    ├── psm.js          # NIK PSM Calculator
    ├── vault.js        # NIK Vault Calculator  
    ├── unit-converter.js
    ├── scorecard.js
    ├── loan-emi.js
    ├── date-age.js
    └── time-converter.js
```
