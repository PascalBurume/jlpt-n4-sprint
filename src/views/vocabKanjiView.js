import { N4_VOCAB } from '../data/vocab.js';
import { N4_KANJI } from '../data/kanji.js';
import { ui, t, renderRuby, speakJP, saveState, shuffle, escapeHtml } from '../utils.js';

let activeSubtab = 'vocab'; // 'vocab' | 'kanji' | 'flashcards'
let vocabFilter = 'all'; // 'all' | 'n' | 'v' | 'iadj' | 'naadj' | 'other' | 'todo' | 'done'
let vocabKanaRow = 'all';
let vocabPage = 1;
let vocabLocalQuery = '';
let expandedVocabIds = new Set();

let kanjiFilter = 'all'; // 'all' | 'g1' | 'g2' | 'g3' | 'todo' | 'done'
let kanjiPage = 1;
let kanjiLocalQuery = '';

// Flashcards state
let fcDeckType = 'vocab'; // 'vocab' | 'kanji'
let fcScope = 'todo'; // 'todo' | 'all'
let fcSize = 20; // 10 | 20 | 30
let fcCards = [];
let fcIndex = 0;
let fcFlipped = false;
let fcKnownCount = 0;
let fcDone = false;

const VOCAB_PER_PAGE = 40;
const KANJI_PER_PAGE = 30;

const KANA_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'a', label: 'あ', chars: 'あいうえおアイウエオ' },
  { id: 'ka', label: 'か', chars: 'かきくけこがぎぐげごカキクケコガギグゲゴ' },
  { id: 'sa', label: 'さ', chars: 'さしすせそざじずぜぞサシスセソザジズゼゾ' },
  { id: 'ta', label: 'た', chars: 'たちつてとだぢづでどタチツテトダヂヅデド' },
  { id: 'na', label: 'な', chars: 'なにぬねのナニヌネノ' },
  { id: 'ha', label: 'は', chars: 'はひふへほばびぶべぼぱぴぷぺぽハヒフヘホバビブベボパピプペポ' },
  { id: 'ma', label: 'ま', chars: 'まみむめもマミムメモ' },
  { id: 'ya', label: 'や', chars: 'やゆよヤユヨ' },
  { id: 'ra', label: 'ら', chars: 'らりるれろラリルレロ' },
  { id: 'wa', label: 'わ', chars: 'わをんワヲン' },
];

export function getVocabSubtabs(lang) {
  return [
    { id: 'vocab', label: ui({ fr: 'Vocabulaire', en: 'Vocabulary' }, lang), count: N4_VOCAB.length },
    { id: 'kanji', label: 'Kanji', count: N4_KANJI.length },
    { id: 'flashcards', label: ui({ fr: 'Flashcards', en: 'Flashcards' }, lang) },
  ];
}

export function setVocabSubtab(id) {
  activeSubtab = id || 'vocab';
}

export function getVocabSubtab() {
  return activeSubtab;
}

export function setVocabSearchFocus({ subtab, query }) {
  if (subtab) activeSubtab = subtab;
  if (subtab === 'kanji') {
    kanjiLocalQuery = query || '';
    kanjiFilter = 'all';
    kanjiPage = 1;
  } else {
    vocabLocalQuery = query || '';
    vocabFilter = 'all';
    vocabKanaRow = 'all';
    vocabPage = 1;
  }
}

function classifyVocabPos(typeStr = '') {
  const s = typeStr.toLowerCase();
  if (s.startsWith('v')) return 'v';
  if (s.includes('い-adj')) return 'iadj';
  if (s.includes('な-adj')) return 'naadj';
  if (s === 'n' || s.startsWith('n ') || s.startsWith('n,')) return 'n';
  return 'other';
}

function startFlashcards(state) {
  const masteredVocab = state.masteredVocab || [];
  const masteredKanji = state.masteredKanji || [];
  let pool = fcDeckType === 'vocab' ? N4_VOCAB : N4_KANJI;
  if (fcScope === 'todo') {
    const set = new Set(fcDeckType === 'vocab' ? masteredVocab : masteredKanji);
    const filtered = pool.filter((item) => !set.has(item.id));
    if (filtered.length > 0) pool = filtered;
  }
  fcCards = shuffle(pool).slice(0, Math.min(fcSize, pool.length));
  fcIndex = 0;
  fcFlipped = false;
  fcKnownCount = 0;
  fcDone = false;
}

function renderVocabTab(container, ctx) {
  const { state, globalQuery } = ctx;
  const lang = state.lang;
  const mastered = new Set(state.masteredVocab || []);
  const q = (vocabLocalQuery || globalQuery || '').trim().toLowerCase();

  const filtered = N4_VOCAB.filter((item) => {
    if (vocabFilter === 'done' && !mastered.has(item.id)) return false;
    if (vocabFilter === 'todo' && mastered.has(item.id)) return false;
    if (['n', 'v', 'iadj', 'naadj', 'other'].includes(vocabFilter)) {
      if (classifyVocabPos(item.type) !== vocabFilter) return false;
    }
    if (vocabKanaRow !== 'all') {
      const grp = KANA_GROUPS.find((g) => g.id === vocabKanaRow);
      const firstChar = (item.reading || item.word || '').charAt(0);
      if (grp && grp.chars && !grp.chars.includes(firstChar)) return false;
    }
    if (q) {
      const hay = `${item.id} ${item.word} ${item.reading} ${item.kanjiHint} ${item.type} ${item.meaning.en} ${item.meaning.fr} ${item.example.en} ${item.example.fr}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / VOCAB_PER_PAGE));
  if (vocabPage > totalPages) vocabPage = totalPages;
  const startIdx = (vocabPage - 1) * VOCAB_PER_PAGE;
  const pageItems = filtered.slice(startIdx, startIdx + VOCAB_PER_PAGE);

  const posFilters = [
    { id: 'all', label: { fr: `Tous (${N4_VOCAB.length})`, en: `All (${N4_VOCAB.length})` } },
    { id: 'n', label: { fr: 'Noms', en: 'Nouns' } },
    { id: 'v', label: { fr: 'Verbes', en: 'Verbs' } },
    { id: 'iadj', label: { fr: 'い-adj', en: 'い-adj' } },
    { id: 'naadj', label: { fr: 'な-adj', en: 'な-adj' } },
    { id: 'other', label: { fr: 'Adv / Autres', en: 'Adv / Other' } },
    { id: 'todo', label: { fr: 'À revoir', en: 'To Review' } },
    { id: 'done', label: { fr: `Maîtrisés (${mastered.size})`, en: `Mastered (${mastered.size})` } },
  ];

  container.innerHTML = `
    <section class="section-group">
      <div class="section-header">
        <div>
          <h2 class="section-title">
            ${ui({ fr: 'Vocabulaire JLPT N4 · 語彙', en: 'JLPT N4 Vocabulary · 語彙' }, lang)}
            <span class="section-subtitle">${filtered.length} ${ui({ fr: 'mot(s)', en: 'word(s)' }, lang)}</span>
          </h2>
        </div>
        <div class="section-filters">
          <input
            type="search"
            id="vocab-local-search"
            class="inline-filter-input"
            value="${escapeHtml(vocabLocalQuery)}"
            placeholder="${lang === 'en' ? 'Filter word, kana, meaning…' : 'Filtrer mot, kana, sens…'}"
          />
          <button class="btn-violet-pill" id="vocab-launch-fc">+ ${ui({ fr: 'Flashcards', en: 'Flashcards' }, lang)}</button>
        </div>
      </div>

      <div class="filter-toolbar">
        <div class="section-filters">
          ${posFilters
            .map(
              (f) => `
            <button class="filter-pill-btn ${vocabFilter === f.id ? 'active' : ''}" data-vfilter="${f.id}">
              ${ui(f.label, lang)}
            </button>
          `
            )
            .join('')}
        </div>
        <div class="kana-strip">
          ${KANA_GROUPS.map(
            (g) => `
            <button class="kana-chip ${vocabKanaRow === g.id ? 'active' : ''}" data-kana="${g.id}">${g.label}</button>
          `
          ).join('')}
        </div>
      </div>

      <div class="flow-card">
        ${
          pageItems.length === 0
            ? `<div class="flow-card-pad" style="text-align:center;color:var(--text-muted);">
                ${ui({ fr: 'Aucun mot ne correspond à ce filtre.', en: 'No vocabulary words match this filter.' }, lang)}
              </div>`
            : pageItems
                .map((item) => {
                  const isDone = mastered.has(item.id);
                  const isOpen = expandedVocabIds.has(item.id);
                  const showReading = item.reading && item.reading !== item.word;
                  return `
                    <div class="vocab-row-wrap">
                      <div class="flow-row vocab-row">
                        <div class="vocab-meta-col">
                          <span class="vocab-num">#${item.id}</span>
                          <span class="pill-tag ${classifyVocabPos(item.type) === 'v' ? 'pill-tag-violet' : ''}" style="font-size:0.72em;padding:3px 9px;">${escapeHtml(item.type)}</span>
                        </div>
                        <div>
                          <div class="vocab-word-line">
                            <span class="vocab-word-jp">${escapeHtml(item.word)}</span>
                            ${showReading ? `<span class="vocab-reading">${escapeHtml(item.reading)}</span>` : ''}
                            ${item.kanjiHint ? `<span class="vocab-kanji-hint">漢字 ${escapeHtml(item.kanjiHint)}</span>` : ''}
                          </div>
                          <div class="vocab-meaning">${t(item.meaning, lang, true)}</div>
                        </div>
                        <div class="vocab-ex-trigger-col">
                          <button class="btn-ghost-pill vocab-ex-btn" data-toggle-vex="${item.id}">
                            ${isOpen ? ui({ fr: 'Masquer ex.', en: 'Hide ex.' }, lang) : ui({ fr: 'Exemple', en: 'Example' }, lang)} ${isOpen ? '▴' : '▾'}
                          </button>
                        </div>
                        <div class="row-actions">
                          <button class="circle-icon-btn" data-speak="${escapeHtml(item.reading || item.word)}" title="Listen">🔊</button>
                          <button class="${isDone ? 'btn-mint-pill' : 'btn-violet-pill'}" data-toggle-vmaster="${item.id}" style="min-width:112px;">
                            ${isDone ? '✓ ' + ui({ fr: 'Maîtrisé', en: 'Mastered' }, lang) : '+ ' + ui({ fr: 'Valider', en: 'Master' }, lang)}
                          </button>
                        </div>
                      </div>
                      ${
                        isOpen
                          ? `
                        <div class="vocab-example-drawer">
                          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                            <div>
                              <div class="vocab-ex-jp">${renderRuby(item.example.jp)}</div>
                              <div class="cell-sub" style="margin-top:4px;">${t({ fr: item.example.fr, en: item.example.en }, lang, true)}</div>
                            </div>
                            <button class="circle-icon-btn" data-speak="${escapeHtml(item.example.jp)}" title="Listen to example">🔊</button>
                          </div>
                        </div>
                      `
                          : ''
                      }
                    </div>
                  `;
                })
                .join('')
        }
      </div>

      ${
        totalPages > 1
          ? `
        <div class="pagination-bar">
          <button class="btn-ghost-pill" id="vocab-prev-page" ${vocabPage <= 1 ? 'disabled' : ''}>← ${ui({ fr: 'Précédent', en: 'Prev' }, lang)}</button>
          <span class="section-subtitle">
            ${ui({ fr: `Page ${vocabPage} sur ${totalPages}`, en: `Page ${vocabPage} of ${totalPages}` }, lang)}
            (${startIdx + 1}–${Math.min(startIdx + VOCAB_PER_PAGE, filtered.length)} / ${filtered.length})
          </span>
          <button class="btn-ghost-pill" id="vocab-next-page" ${vocabPage >= totalPages ? 'disabled' : ''}>${ui({ fr: 'Suivant', en: 'Next' }, lang)} →</button>
        </div>
      `
          : ''
      }
    </section>

    <div class="summary-bar">
      <div class="summary-left">
        <span>${t({ fr: 'Mots écrits en kana comme à l’examen N4 · kanji hors-N4 en gris pour reconnaissance.', en: 'Above-N4 kanji words appear in kana as on the real test · grey hint for recognition.' }, lang, true)}</span>
      </div>
      <div class="summary-right">
        <span class="summary-label">${ui({ fr: 'Vocabulaire maîtrisé :', en: 'Vocab Mastered:' }, lang)}</span>
        <span class="summary-total">${mastered.size} / ${N4_VOCAB.length}</span>
      </div>
    </div>
  `;

  const searchEl = container.querySelector('#vocab-local-search');
  searchEl?.addEventListener('input', (e) => {
    vocabLocalQuery = e.target.value;
    vocabPage = 1;
    const pos = e.target.selectionStart;
    renderVocabTab(container, ctx);
    const nextInp = container.querySelector('#vocab-local-search');
    if (nextInp) {
      nextInp.focus();
      nextInp.setSelectionRange(pos, pos);
    }
  });

  container.querySelector('#vocab-launch-fc')?.addEventListener('click', () => {
    fcDeckType = 'vocab';
    activeSubtab = 'flashcards';
    startFlashcards(state);
    ctx.refreshSubbar?.();
    renderVocabKanji(container, ctx);
  });

  container.querySelectorAll('[data-vfilter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      vocabFilter = btn.dataset.vfilter;
      vocabPage = 1;
      renderVocabTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-kana]').forEach((btn) => {
    btn.addEventListener('click', () => {
      vocabKanaRow = btn.dataset.kana;
      vocabPage = 1;
      renderVocabTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-toggle-vex]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.toggleVex);
      if (expandedVocabIds.has(id)) expandedVocabIds.delete(id);
      else expandedVocabIds.add(id);
      renderVocabTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-toggle-vmaster]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.toggleVmaster);
      const list = state.masteredVocab || [];
      if (list.includes(id)) {
        state.masteredVocab = list.filter((x) => x !== id);
      } else {
        state.masteredVocab = [...list, id];
      }
      saveState(state);
      renderVocabTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-speak]').forEach((btn) => {
    btn.addEventListener('click', () => speakJP(btn.dataset.speak));
  });

  container.querySelector('#vocab-prev-page')?.addEventListener('click', () => {
    if (vocabPage > 1) {
      vocabPage -= 1;
      renderVocabTab(container, ctx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  container.querySelector('#vocab-next-page')?.addEventListener('click', () => {
    if (vocabPage < totalPages) {
      vocabPage += 1;
      renderVocabTab(container, ctx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

function renderKanjiTab(container, ctx) {
  const { state, globalQuery } = ctx;
  const lang = state.lang;
  const mastered = new Set(state.masteredKanji || []);
  const q = (kanjiLocalQuery || globalQuery || '').trim().toLowerCase();

  const filtered = N4_KANJI.filter((k) => {
    if (kanjiFilter === 'g1' && k.id > 55) return false;
    if (kanjiFilter === 'g2' && (k.id <= 55 || k.id > 110)) return false;
    if (kanjiFilter === 'g3' && k.id <= 110) return false;
    if (kanjiFilter === 'todo' && mastered.has(k.id)) return false;
    if (kanjiFilter === 'done' && !mastered.has(k.id)) return false;
    if (q) {
      const hay = `${k.id} ${k.char} ${k.on} ${k.kun} ${k.meaning.en} ${k.meaning.fr} ${k.words.join(' ')} ${k.hint.en} ${k.hint.fr}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / KANJI_PER_PAGE));
  if (kanjiPage > totalPages) kanjiPage = totalPages;
  const startIdx = (kanjiPage - 1) * KANJI_PER_PAGE;
  const pageItems = filtered.slice(startIdx, startIdx + KANJI_PER_PAGE);

  const filters = [
    { id: 'all', label: { fr: `Tous (${N4_KANJI.length})`, en: `All (${N4_KANJI.length})` } },
    { id: 'g1', label: { fr: '#1–55', en: '#1–55' } },
    { id: 'g2', label: { fr: '#56–110', en: '#56–110' } },
    { id: 'g3', label: { fr: '#111–166', en: '#111–166' } },
    { id: 'todo', label: { fr: 'À revoir', en: 'To Review' } },
    { id: 'done', label: { fr: `Maîtrisés (${mastered.size})`, en: `Mastered (${mastered.size})` } },
  ];

  container.innerHTML = `
    <section class="section-group">
      <div class="section-header">
        <div>
          <h2 class="section-title">
            ${ui({ fr: 'Les 166 nouveaux Kanji N4 · 漢字', en: '166 New N4 Kanji · 漢字' }, lang)}
            <span class="section-subtitle">${filtered.length} kanji</span>
          </h2>
        </div>
        <div class="section-filters">
          <input
            type="search"
            id="kanji-local-search"
            class="inline-filter-input"
            value="${escapeHtml(kanjiLocalQuery)}"
            placeholder="${lang === 'en' ? 'Filter kanji, reading, meaning…' : 'Filtrer kanji, lecture, sens…'}"
          />
          <button class="btn-violet-pill" id="kanji-launch-fc">+ ${ui({ fr: 'Flashcards Kanji', en: 'Kanji Flashcards' }, lang)}</button>
        </div>
      </div>

      <div class="filter-toolbar">
        <div class="section-filters">
          ${filters
            .map(
              (f) => `
            <button class="filter-pill-btn ${kanjiFilter === f.id ? 'active' : ''}" data-kfilter="${f.id}">
              ${ui(f.label, lang)}
            </button>
          `
            )
            .join('')}
        </div>
      </div>

      <div class="flow-card">
        ${
          pageItems.length === 0
            ? `<div class="flow-card-pad" style="text-align:center;color:var(--text-muted);">
                ${ui({ fr: 'Aucun kanji trouvé.', en: 'No matching kanji.' }, lang)}
              </div>`
            : pageItems
                .map((k) => {
                  const isDone = mastered.has(k.id);
                  return `
                    <div class="kanji-row">
                      <div class="kanji-tile-wrap">
                        <div class="kanji-tile" title="#${k.id} · ${k.strokes} strokes">
                          <span class="kanji-glyph">${escapeHtml(k.char)}</span>
                          <span class="kanji-strokes">#${k.id} · ${k.strokes}画</span>
                        </div>
                      </div>
                      <div class="kanji-main-col">
                        <div class="kanji-meaning">${t(k.meaning, lang, true)}</div>
                        <div class="kanji-readings">
                          <span class="reading-chip"><strong>ON</strong> ${escapeHtml(k.on)}</span>
                          <span class="reading-chip"><strong>KUN</strong> ${escapeHtml(k.kun)}</span>
                        </div>
                        <div class="kanji-compounds">
                          ${k.words
                            .map((w) => {
                              const jpPart = w.split(' ')[0];
                              return `<button type="button" class="compound-chip" data-speak="${escapeHtml(jpPart)}" title="Listen">${escapeHtml(w)} 🔊</button>`;
                            })
                            .join('')}
                        </div>
                        <div class="kanji-hint-line">💡 ${t(k.hint, lang, true)}</div>
                      </div>
                      <div class="row-actions">
                        <button class="${isDone ? 'btn-mint-pill' : 'btn-violet-pill'}" data-toggle-kmaster="${k.id}" style="min-width:112px;">
                          ${isDone ? '✓ ' + ui({ fr: 'Maîtrisé', en: 'Mastered' }, lang) : '+ ' + ui({ fr: 'Valider', en: 'Master' }, lang)}
                        </button>
                      </div>
                    </div>
                  `;
                })
                .join('')
        }
      </div>

      ${
        totalPages > 1
          ? `
        <div class="pagination-bar">
          <button class="btn-ghost-pill" id="kanji-prev-page" ${kanjiPage <= 1 ? 'disabled' : ''}>← ${ui({ fr: 'Précédent', en: 'Prev' }, lang)}</button>
          <span class="section-subtitle">
            ${ui({ fr: `Page ${kanjiPage} sur ${totalPages}`, en: `Page ${kanjiPage} of ${totalPages}` }, lang)}
            (${startIdx + 1}–${Math.min(startIdx + KANJI_PER_PAGE, filtered.length)} / ${filtered.length})
          </span>
          <button class="btn-ghost-pill" id="kanji-next-page" ${kanjiPage >= totalPages ? 'disabled' : ''}>${ui({ fr: 'Suivant', en: 'Next' }, lang)} →</button>
        </div>
      `
          : ''
      }
    </section>

    <div class="summary-bar">
      <div class="summary-left">
        <span>${t({ fr: 'Clique sur un mot composé pour écouter sa prononciation japonaise.', en: 'Tap any compound word chip to hear its Japanese pronunciation.' }, lang, true)}</span>
      </div>
      <div class="summary-right">
        <span class="summary-label">${ui({ fr: 'Kanji maîtrisés :', en: 'Kanji Mastered:' }, lang)}</span>
        <span class="summary-total">${mastered.size} / ${N4_KANJI.length}</span>
      </div>
    </div>
  `;

  const searchEl = container.querySelector('#kanji-local-search');
  searchEl?.addEventListener('input', (e) => {
    kanjiLocalQuery = e.target.value;
    kanjiPage = 1;
    const pos = e.target.selectionStart;
    renderKanjiTab(container, ctx);
    const nextInp = container.querySelector('#kanji-local-search');
    if (nextInp) {
      nextInp.focus();
      nextInp.setSelectionRange(pos, pos);
    }
  });

  container.querySelector('#kanji-launch-fc')?.addEventListener('click', () => {
    fcDeckType = 'kanji';
    activeSubtab = 'flashcards';
    startFlashcards(state);
    ctx.refreshSubbar?.();
    renderVocabKanji(container, ctx);
  });

  container.querySelectorAll('[data-kfilter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      kanjiFilter = btn.dataset.kfilter;
      kanjiPage = 1;
      renderKanjiTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-toggle-kmaster]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.toggleKmaster);
      const list = state.masteredKanji || [];
      if (list.includes(id)) {
        state.masteredKanji = list.filter((x) => x !== id);
      } else {
        state.masteredKanji = [...list, id];
      }
      saveState(state);
      renderKanjiTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-speak]').forEach((btn) => {
    btn.addEventListener('click', () => speakJP(btn.dataset.speak));
  });

  container.querySelector('#kanji-prev-page')?.addEventListener('click', () => {
    if (kanjiPage > 1) {
      kanjiPage -= 1;
      renderKanjiTab(container, ctx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  container.querySelector('#kanji-next-page')?.addEventListener('click', () => {
    if (kanjiPage < totalPages) {
      kanjiPage += 1;
      renderKanjiTab(container, ctx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

function renderFlashcardsTab(container, ctx) {
  const { state } = ctx;
  const lang = state.lang;
  if (fcCards.length === 0) startFlashcards(state);

  const total = fcCards.length;
  const card = fcCards[fcIndex];
  const pct = total > 0 ? Math.round(((fcDone ? total : fcIndex + 1) / total) * 100) : 0;

  container.innerHTML = `
    <div class="quiz-studio">
      <div class="section-header">
        <div class="section-filters">
          <button class="filter-pill-btn ${fcDeckType === 'vocab' ? 'active' : ''}" data-fc-deck="vocab">
            ${ui({ fr: 'Vocabulaire (640)', en: 'Vocabulary (640)' }, lang)}
          </button>
          <button class="filter-pill-btn ${fcDeckType === 'kanji' ? 'active' : ''}" data-fc-deck="kanji">
            ${ui({ fr: 'Kanji (166)', en: 'Kanji (166)' }, lang)}
          </button>
          <button class="filter-pill-btn ${fcScope === 'todo' ? 'active' : ''}" data-fc-scope="todo">
            ${ui({ fr: 'Non maîtrisés', en: 'Unmastered' }, lang)}
          </button>
          <button class="filter-pill-btn ${fcScope === 'all' ? 'active' : ''}" data-fc-scope="all">
            ${ui({ fr: 'Tout le pack', en: 'Full Pack' }, lang)}
          </button>
        </div>
        <div class="section-filters">
          <span class="section-subtitle">${ui({ fr: 'Lot :', en: 'Batch:' }, lang)}</span>
          ${[10, 20, 30]
            .map(
              (sz) =>
                `<button class="filter-pill-btn ${fcSize === sz ? 'active' : ''}" data-fc-size="${sz}">${sz}</button>`
            )
            .join('')}
        </div>
      </div>

      <div class="flow-card">
        <div class="quiz-progress-track">
          <div class="quiz-progress-bar" style="width:${pct}%"></div>
        </div>

        ${
          fcDone || !card
            ? `
          <div class="verdict-box">
            <div class="verdict-score">${fcKnownCount} / ${total}</div>
            <div class="cell-primary" style="margin-top:8px;">
              ${ui({ fr: 'Session Flashcards terminée ! Tes cartes connues ont été enregistrées.', en: 'Flashcard batch complete! Known items were marked mastered.' }, lang)}
            </div>
            <div style="margin-top:18px;">
              <button class="btn-violet-pill" id="fc-new-batch">↺ ${ui({ fr: 'Nouvelle série', en: 'New Batch' }, lang)}</button>
            </div>
          </div>
        `
            : `
          <div class="flow-card-pad">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
              <span class="pill-tag pill-tag-violet">
                ${fcDeckType === 'vocab' ? `Vocab #${card.id} · ${escapeHtml(card.type)}` : `Kanji #${card.id} · ${card.strokes}画`}
              </span>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="section-subtitle">${fcIndex + 1} / ${total}</span>
                <button class="circle-icon-btn" id="fc-speak-btn" title="Listen">🔊</button>
              </div>
            </div>

            <div class="flashcard-stage ${fcFlipped ? 'is-flipped' : ''}" id="fc-card-surface" role="button" tabindex="0">
              ${
                fcDeckType === 'vocab'
                  ? `
                <div class="fc-front-word">${escapeHtml(card.word)}</div>
                ${
                  card.kanjiHint
                    ? `<div class="vocab-kanji-hint" style="margin-top:6px;">漢字 ${escapeHtml(card.kanjiHint)}</div>`
                    : ''
                }
                ${
                  !fcFlipped
                    ? `<div class="fc-tap-prompt">${ui({ fr: 'Clique pour révéler la lecture, le sens et l’exemple', en: 'Tap to reveal reading, meaning & example' }, lang)}</div>`
                    : `
                  <div class="fc-divider"></div>
                  ${card.reading && card.reading !== card.word ? `<div class="fc-reading">${escapeHtml(card.reading)}</div>` : ''}
                  <div class="fc-meaning">${t(card.meaning, lang)}</div>
                  <div class="fc-example-box">
                    <div class="vocab-ex-jp">${renderRuby(card.example.jp)}</div>
                    <div class="cell-sub" style="margin-top:4px;">${t({ fr: card.example.fr, en: card.example.en }, lang, true)}</div>
                  </div>
                `
                }
              `
                  : `
                <div class="fc-front-kanji">${escapeHtml(card.char)}</div>
                ${
                  !fcFlipped
                    ? `<div class="fc-tap-prompt">${ui({ fr: 'Clique pour révéler ON/KUN, le sens et les mots composés', en: 'Tap to reveal ON/KUN, meaning & compound words' }, lang)}</div>`
                    : `
                  <div class="fc-divider"></div>
                  <div class="fc-meaning">${t(card.meaning, lang)}</div>
                  <div class="kanji-readings" style="justify-content:center;margin-top:10px;">
                    <span class="reading-chip"><strong>ON</strong> ${escapeHtml(card.on)}</span>
                    <span class="reading-chip"><strong>KUN</strong> ${escapeHtml(card.kun)}</span>
                  </div>
                  <div class="kanji-compounds" style="justify-content:center;margin-top:12px;">
                    ${card.words.map((w) => `<span class="compound-chip">${escapeHtml(w)}</span>`).join('')}
                  </div>
                  <div class="kanji-hint-line" style="margin-top:10px;">💡 ${t(card.hint, lang, true)}</div>
                `
                }
              `
              }
            </div>

            <div class="fc-actions">
              ${
                !fcFlipped
                  ? `<button class="btn-violet-pill" id="fc-reveal-btn" style="min-width:190px;">${ui({ fr: 'Révéler la réponse', en: 'Reveal Answer' }, lang)}</button>`
                  : `
                <button class="btn-ghost-pill" id="fc-again-btn">↺ ${ui({ fr: 'À revoir', en: 'Study Again' }, lang)}</button>
                <button class="btn-mint-pill" id="fc-know-btn" style="min-width:165px;">✓ ${ui({ fr: 'Je connais !', en: 'I Know This!' }, lang)}</button>
              `
              }
            </div>
          </div>
        `
        }
      </div>
    </div>
  `;

  container.querySelectorAll('[data-fc-deck]').forEach((btn) => {
    btn.addEventListener('click', () => {
      fcDeckType = btn.dataset.fcDeck;
      startFlashcards(state);
      renderFlashcardsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-fc-scope]').forEach((btn) => {
    btn.addEventListener('click', () => {
      fcScope = btn.dataset.fcScope;
      startFlashcards(state);
      renderFlashcardsTab(container, ctx);
    });
  });

  container.querySelectorAll('[data-fc-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      fcSize = Number(btn.dataset.fcSize);
      startFlashcards(state);
      renderFlashcardsTab(container, ctx);
    });
  });

  container.querySelector('#fc-new-batch')?.addEventListener('click', () => {
    startFlashcards(state);
    renderFlashcardsTab(container, ctx);
  });

  const flipCard = () => {
    if (!fcFlipped) {
      fcFlipped = true;
      renderFlashcardsTab(container, ctx);
    }
  };

  container.querySelector('#fc-card-surface')?.addEventListener('click', flipCard);
  container.querySelector('#fc-reveal-btn')?.addEventListener('click', flipCard);

  container.querySelector('#fc-speak-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!card) return;
    if (fcDeckType === 'vocab') {
      speakJP(fcFlipped ? card.example.jp : card.reading || card.word);
    } else {
      const firstCompound = (card.words[0] || card.char).split(' ')[0];
      speakJP(firstCompound);
    }
  });

  const advance = (known) => {
    if (known && card) {
      fcKnownCount += 1;
      if (fcDeckType === 'vocab') {
        if (!state.masteredVocab.includes(card.id)) {
          state.masteredVocab = [...state.masteredVocab, card.id];
          saveState(state);
        }
      } else {
        if (!state.masteredKanji.includes(card.id)) {
          state.masteredKanji = [...state.masteredKanji, card.id];
          saveState(state);
        }
      }
    }
    if (fcIndex + 1 >= fcCards.length) {
      fcDone = true;
    } else {
      fcIndex += 1;
      fcFlipped = false;
    }
    renderFlashcardsTab(container, ctx);
  };

  container.querySelector('#fc-again-btn')?.addEventListener('click', () => advance(false));
  container.querySelector('#fc-know-btn')?.addEventListener('click', () => advance(true));
}

export function renderVocabKanji(container, ctx) {
  if (activeSubtab === 'kanji') {
    renderKanjiTab(container, ctx);
  } else if (activeSubtab === 'flashcards') {
    renderFlashcardsTab(container, ctx);
  } else {
    renderVocabTab(container, ctx);
  }
}
