# 汉字日记 — Daily Chinese

A Progressive Web App for daily Mandarin Chinese vocabulary learning, targeted at HSK 4 level.

🌐 **Live app:** [hanzi-daily.netlify.app](https://hanzi-daily.netlify.app)

---

## Features

- **One new word per day** — works through 87 entries in order: HSK 4 vocabulary, 成语 chéngyǔ idioms, and common phrases
- **Tap-to-reveal cards** — see the character and meaning first, tap to reveal pinyin and an example sentence with full sentence pinyin
- **SM-2 spaced repetition** — Known ✓ / Still Learning buttons schedule the next review at the optimal interval
- **Review queue** — due words surface each day alongside the new word
- **Day streak** — tracks consecutive days of study
- **Daily push notifications** — set a reminder time in Settings; tapping the notification opens the app to that day's word
- **Fully offline** — service worker caches the app shell; works without a connection once installed
- **Installable on iPhone** — open in Safari → Share → Add to Home Screen

---

## Word list

87 words across three categories:

| Category | Count |
|---|---|
| HSK 4 vocabulary | 57 |
| 成语 (chéngyǔ idioms) | 15 |
| Common phrases | 15 |

Each entry includes: character · pinyin · meaning · example sentence (Chinese + pinyin + English).

---

## Tech stack

| | |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Storage | localStorage (no backend) |
| Spaced repetition | SM-2 algorithm |
| PWA | Custom service worker + Web App Manifest |
| Hosting | Netlify |

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Building & deploying

```bash
npm run build
netlify deploy --prod --dir=dist
```

---

## Project structure

```
src/
├── data/
│   └── hsk4.js          # All 87 words with pinyin, meaning, examples
├── lib/
│   ├── sm2.js           # SM-2 spaced repetition algorithm
│   ├── storage.js       # localStorage helpers
│   └── notifications.js # Push notification scheduling
├── screens/
│   ├── HomeScreen.jsx
│   ├── WordDetailScreen.jsx
│   ├── ReviewScreen.jsx
│   └── SettingsScreen.jsx
├── components/
│   ├── WordCard.jsx     # Tap-to-reveal card
│   └── NavBar.jsx
public/
├── sw.js                # Service worker (caching + notifications)
└── manifest.json        # PWA manifest
```

---

## How spaced repetition works

After revealing a word, tap:

- **Known ✓** — schedules the next review at an increasing interval (1 day → 6 days → progressively longer)
- **Still Learning** — resets the interval back to 1 day

The SM-2 algorithm adjusts each word's easiness factor based on your responses, so words you find harder come back more frequently.
