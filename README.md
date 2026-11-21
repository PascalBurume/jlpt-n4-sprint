# N4Flow · JLPT N4 15-Day Express Sprint

A lightweight, zero-dependency web app for the final 15-day JLPT N4 grammar sprint (J-15 → December 6), supporting **French + English** bilingual explanations, toggleable **Furigana (`ON / Hover / OFF`)**, adjustable **Text Size (`A / A+ / A++`)**, and Japanese TTS audio.

## Features
- **15-Day Countdown Plan (J-15 → J-1):** Live countdown to December 6, 30-minute daily sprint timer, routine checklist, and 3-phase roadmap.
- **23 Grammar Duels + 106 N4 Pack Q-Cards:** Grouped by sprint day with side-by-side form comparisons, audio examples, N4 trap callouts, and interactive Q1–Q106 drills.
- **Step-by-Step Guided Solver & Universal Rule Search:** Built-in `💡 Comment résoudre ?` 3-step hints, `📖 Règles à connaître` batch study tabs, and live rule lookup across all 23 duels, signal words, *Word After Blank*, and *Nom + ?* rules.
- **Conjugation Sheet & Verb Speed Gym:** 13-form model table with tap-to-listen audio, Group 1 あいうえお trick, Group 1 trap verbs, and a 36-verb speed trainer (`10 Q / 20 Q / ∞`).
- **Tests & Quiz Center:** Configurable test sizes (`10 Q / 20 Q / 32 Q / 50 Q`) across both the **32-question Test éclair** and the **106-question N4 Pack**, in Exam Mode (1-min/question pace clock) or Practice Mode.
- **Auto Error Notebook (`Carnet d’erreurs`):** Automatically saves mistakes to `localStorage` with a targeted Re-Drill mode for J-3 & J-2.

## Run Locally
Zero dependencies required (Node.js 18+):

```bash
npm run dev
```

Then open **http://localhost:5173** (or host the static files directly on GitHub Pages / Netlify / Vercel).
