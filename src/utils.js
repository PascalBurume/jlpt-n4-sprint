import { EXAM_DATE, STUDY_PLAN } from './data/schedule.js';

export const STORAGE_KEY = 'jlpt_n4_sprint_v1';

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Converts ruby shorthand like "漢字[かんじ]" into <ruby>漢字<rt>かんじ</rt></ruby>
 */
export function renderRuby(text = '') {
  const escaped = escapeHtml(text);
  return escaped.replace(
    /([\u4E00-\u9FFF々ヶ]+)\[([^\]]+)\]/g,
    '<ruby>$1<rt>$2</rt></ruby>'
  );
}

export function stripForTTS(text = '') {
  return String(text)
    .replace(/\[[^\]]+\]/g, '')
    .replace(/___/g, ' ')
    .replace(/（　）/g, ' ')
    .replace(/[「」]/g, '')
    .trim();
}

export function speakJP(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const clean = stripForTTS(text);
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = 'ja-JP';
  utter.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const jpVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('ja'));
  if (jpVoice) utter.voice = jpVoice;
  window.speechSynthesis.speak(utter);
}

/**
 * Clean single-language UI chrome helper (prevents cluttered double-labels on buttons & tabs).
 * Uses EN when lang==='en', otherwise FR (so FR+EN keeps crisp controls & bilingual study content).
 */
export function ui(obj, lang = 'both') {
  if (!obj) return '';
  if (typeof obj === 'string') return renderRuby(obj);
  return renderRuby(lang === 'en' ? obj.en || obj.fr : obj.fr || obj.en);
}

/**
 * Bilingual study-content renderer supporting 'fr', 'en', or 'both'
 */
export function t(obj, lang = 'both', inline = false) {
  if (!obj) return '';
  if (typeof obj === 'string') return renderRuby(obj);
  const fr = obj.fr ? renderRuby(obj.fr) : '';
  const en = obj.en ? renderRuby(obj.en) : '';
  if (lang === 'fr') return fr || en;
  if (lang === 'en') return en || fr;
  if (fr === en) return fr;
  if (inline) {
    return `<span class="bi-fr">${fr}</span> <span class="bi-sep">·</span> <span class="bi-en">${en}</span>`;
  }
  return `<span class="bi-fr">${fr}</span><span class="bi-en-block">${en}</span>`;
}

export function getDaysRemaining() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = EXAM_DATE.split('-').map(Number);
  const exam = new Date(y, m - 1, d);
  const diffMs = exam.getTime() - today.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function getTodayPlanBlock(daysRemaining) {
  const found = STUDY_PLAN.find((block) => block.days.includes(daysRemaining));
  if (found) return found;
  if (daysRemaining > 15) return STUDY_PLAN[0];
  return STUDY_PLAN[STUDY_PLAN.length - 1];
}

export function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadState() {
  const fallback = {
    lang: 'both', // 'fr' | 'en' | 'both'
    furigana: 'on', // 'on' | 'hover' | 'off'
    textSize: 'md', // 'md' | 'lg' | 'xl'
    activeTab: 'dashboard',
    completedBlocks: [],
    masteredDuels: [],
    solvedPackIds: [],
    dailyChecks: {},
    errors: [],
    blitzHistory: [],
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function recordError(state, item) {
  const existing = state.errors.find((e) => e.key === item.key);
  if (existing) {
    existing.wrongCount = (existing.wrongCount || 1) + 1;
    existing.mastered = false;
    existing.updatedAt = Date.now();
  } else {
    state.errors.unshift({
      ...item,
      wrongCount: 1,
      mastered: false,
      updatedAt: Date.now(),
    });
  }
  saveState(state);
}

export function markErrorMastered(state, key, mastered = true) {
  const found = state.errors.find((e) => e.key === key);
  if (found) {
    found.mastered = mastered;
    found.updatedAt = Date.now();
    saveState(state);
  }
}

export function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
