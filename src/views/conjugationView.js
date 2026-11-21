import {
  MODEL_VERBS,
  CONJUGATION_ROWS,
  AIUEO_TRICK,
  QUICK_RECOGNIZE,
  TRAP_G1_VERBS,
  N4_VERB_BANK,
} from '../data/conjugation.js';
import { N4_VERBS_160 } from '../data/verbs160.js';
import { ui, t, renderRuby, speakJP, recordError, escapeHtml } from '../utils.js';

let activeSubtab = 'table'; // 'table' | 'verbs160' | 'tricks' | 'gym'
let verbsTableMode = 'A'; // 'A' (basic forms) | 'B' (N4 forms)
let verbsFilter = 'all'; // 'all' | 'g1' | 'g2' | 'tr' | 'intr'
let verbsPage = 1;
let verbsLocalQuery = '';
const VERBS_PER_PAGE = 40;

let gymFilter = 'pack160'; // 'pack160' | 'all' | 'n4only' | 'traps' | 'g1' | 'g2'
let gymSize = 10; // 10 | 20 | 0 (endless)
let currentQ = null;
let selectedIdx = null;
let gymStreak = 0;
let gymCorrect = 0;
let gymTotal = 0;
let gymFinished = false;

export function getConjugationSubtabs(lang) {
  return [
    { id: 'table', label: ui({ fr: 'Fiche (13)', en: 'Model (13)' }, lang) },
    { id: 'verbs160', label: ui({ fr: 'Verbes N4', en: 'N4 Verbs' }, lang), count: N4_VERBS_160.length },
    { id: 'tricks', label: ui({ fr: 'あいうえお & Pièges', en: 'あいうえお & Traps' }, lang) },
    { id: 'gym', label: ui({ fr: 'Verb Gym', en: 'Verb Gym' }, lang) },
  ];
}

export function setConjugationSubtab(id) {
  activeSubtab = id || 'table';
}

export function getConjugationSubtab() {
  return activeSubtab;
}

const FORM_LABELS = {
  masu: { fr: 'forme ます', en: 'ます-form' },
  te: { fr: 'forme て', en: 'て-form' },
  ta: { fr: 'forme た', en: 'た-form' },
  nai: { fr: 'forme ない', en: 'ない-form' },
  pastNeg: { fr: 'passé négatif', en: 'past negative' },
  ba: { fr: 'forme ば (si)', en: 'ば-form (if)' },
  tara: { fr: 'forme たら', en: 'たら-form' },
  potential: { fr: 'potentiel (peux)', en: 'potential (can)' },
  volitional: { fr: 'volitif (faisons)', en: 'volitional (let’s)' },
  passive: { fr: 'passif (subir)', en: 'passive' },
  causative: { fr: 'causatif (faire faire)', en: 'causative' },
  imperative: { fr: 'impératif (ordre)', en: 'imperative' },
};

const N4_FORMS = ['potential', 'volitional', 'passive', 'causative', 'imperative', 'ba', 'tara'];
const ALL_FORMS = Object.keys(FORM_LABELS);

const PACK_160_GYM_POOL = N4_VERBS_160.map((v) => ({
  dict: v.verb !== v.reading ? `${v.verb} (${v.reading})` : v.verb,
  speakWord: v.reading || v.verb,
  group: v.group,
  transitivity: v.transitivity,
  trapG1:
    v.group === 1 &&
    v.reading.endsWith('る') &&
    'いきしちにひみりぎじぢびぴえけせてねへめれげぜでべぺ'.includes(v.reading.slice(-2, -1)),
  meaning: v.meaning,
  forms: v.forms,
}));

function pickGymQuestion() {
  let pool = PACK_160_GYM_POOL;
  if (gymFilter === 'all') pool = N4_VERB_BANK;
  if (gymFilter === 'g1') pool = PACK_160_GYM_POOL.filter((v) => v.group === 1);
  if (gymFilter === 'g2') pool = PACK_160_GYM_POOL.filter((v) => v.group === 2);
  if (gymFilter === 'traps') pool = N4_VERB_BANK.filter((v) => v.trapG1);

  const formPool = gymFilter === 'n4only' ? N4_FORMS : ALL_FORMS;

  // Retry up to 30 times to guarantee a verb with a non-empty target form & >= 3 distinct distractors
  for (let attempt = 0; attempt < 30; attempt++) {
    const verb = pool[Math.floor(Math.random() * pool.length)];
    const validTargets = formPool.filter((f) => verb.forms[f] && verb.forms[f].trim());
    if (validTargets.length === 0) continue;
    const targetForm = validTargets[Math.floor(Math.random() * validTargets.length)];
    const correctAns = verb.forms[targetForm];

    const otherForms = ALL_FORMS.filter((f) => f !== targetForm)
      .map((f) => verb.forms[f])
      .filter((val) => val && val.trim() && val !== correctAns);

    const uniqueDistractors = [...new Set(otherForms)];
    if (uniqueDistractors.length < 3) continue;

    for (let i = uniqueDistractors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniqueDistractors[i], uniqueDistractors[j]] = [uniqueDistractors[j], uniqueDistractors[i]];
    }
    const options = [correctAns, ...uniqueDistractors.slice(0, 3)];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    currentQ = { verb, targetForm, options, answer: options.indexOf(correctAns) };
    selectedIdx = null;
    return;
  }
}

function resetGymSession() {
  gymStreak = 0;
  gymCorrect = 0;
  gymTotal = 0;
  gymFinished = false;
  pickGymQuestion();
}

export function renderConjugation(container, ctx) {
  const { state, refreshBadges, globalQuery } = ctx;
  const lang = state.lang;
  if (!currentQ) pickGymQuestion();

  if (activeSubtab === 'table') {
    const q = (globalQuery || '').trim().toLowerCase();
    const rows = CONJUGATION_ROWS.filter((r) => {
      if (!q) return true;
      return `${r.name.fr} ${r.name.en} ${r.kaku} ${r.yomu} ${r.taberu} ${r.suru} ${r.kuru}`
        .toLowerCase()
        .includes(q);
    });

    container.innerHTML = `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">
            ${ui({ fr: 'Fiche de conjugaison (clique sur un verbe pour l’écouter)', en: 'Model Conjugation Table (tap any verb for audio)' }, lang)}
          </h2>
          <div class="section-filters">
            <button class="btn-ghost-pill" id="jump-to-verbs160">${ui({ fr: '160 Verbes N4 →', en: 'All 160 Verbs →' }, lang)}</button>
            <button class="btn-violet-pill" id="jump-to-gym">+ ${ui({ fr: 'Verb Gym', en: 'Verb Gym' }, lang)}</button>
          </div>
        </div>

        <div class="flow-card">
          <div class="table-scroll">
            <table class="flow-table">
              <thead>
                <tr>
                  <th>${ui({ fr: 'Forme', en: 'Form' }, lang)}</th>
                  ${MODEL_VERBS.map((v) => `<th>${renderRuby(v.label)} (${v.group})</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (row) => `
                  <tr class="${row.highlight ? 'row-accent' : ''}">
                    <td>
                      <span class="pill-tag ${row.highlight ? 'pill-tag-violet' : ''}">${ui(row.name, lang)}</span>
                    </td>
                    ${MODEL_VERBS.map(
                      (v) => `
                      <td class="jp-tap" data-speak="${row[v.key]}" title="Tap to listen">
                        ${renderRuby(row[v.key])}
                      </td>
                    `
                    ).join('')}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div class="summary-bar">
        <div class="summary-left">
          <span>${t({ fr: 'Relis cette fiche 10 min par jour : elle résout à elle seule ~20 questions.', en: 'Review 10 min/day: this single sheet solves ~20 N4 questions.' }, lang, true)}</span>
        </div>
        <div class="summary-right">
          <span class="summary-label">${ui({ fr: 'Formes clés :', en: 'Key Forms:' }, lang)}</span>
          <span class="summary-total">13</span>
        </div>
      </div>
    `;

    container.querySelector('#jump-to-verbs160')?.addEventListener('click', () => {
      activeSubtab = 'verbs160';
      ctx.refreshSubbar?.();
      renderConjugation(container, ctx);
    });
    container.querySelector('#jump-to-gym')?.addEventListener('click', () => {
      activeSubtab = 'gym';
      ctx.refreshSubbar?.();
      renderConjugation(container, ctx);
    });
  } else if (activeSubtab === 'verbs160') {
    const q = (verbsLocalQuery || globalQuery || '').trim().toLowerCase();
    const filtered = N4_VERBS_160.filter((v) => {
      if (verbsFilter === 'g1' && v.group !== 1) return false;
      if (verbsFilter === 'g2' && v.group !== 2) return false;
      if (verbsFilter === 'tr' && v.transitivity !== 'tr') return false;
      if (verbsFilter === 'intr' && v.transitivity !== 'intr') return false;
      if (q) {
        const hay = `${v.id} ${v.verb} ${v.reading} ${v.meaning.en} ${v.meaning.fr} ${Object.values(v.forms).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / VERBS_PER_PAGE));
    if (verbsPage > totalPages) verbsPage = totalPages;
    const startIdx = (verbsPage - 1) * VERBS_PER_PAGE;
    const pageVerbs = filtered.slice(startIdx, startIdx + VERBS_PER_PAGE);

    const colsA = [
      { key: 'masu', label: 'ます' },
      { key: 'te', label: 'て' },
      { key: 'ta', label: 'た' },
      { key: 'nai', label: 'ない' },
      { key: 'pastNeg', label: 'なかった' },
      { key: 'ba', label: 'ば' },
      { key: 'tara', label: 'たら' },
    ];
    const colsB = [
      { key: 'potential', label: ui({ fr: 'Potentiel', en: 'Potential' }, lang) },
      { key: 'volitional', label: ui({ fr: 'Volitif', en: 'Volitional' }, lang) },
      { key: 'passive', label: ui({ fr: 'Passif', en: 'Passive' }, lang) },
      { key: 'causative', label: ui({ fr: 'Causatif', en: 'Causative' }, lang) },
      { key: 'imperative', label: ui({ fr: 'Impératif', en: 'Imperative' }, lang) },
    ];
    const cols = verbsTableMode === 'A' ? colsA : colsB;

    container.innerHTML = `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">
            ${ui({ fr: 'Les 160 verbes N4 · 動詞', en: 'All 160 N4 Verbs · 動詞' }, lang)}
            <span class="section-subtitle">${filtered.length} ${ui({ fr: 'verbe(s)', en: 'verb(s)' }, lang)}</span>
          </h2>
          <div class="section-filters">
            <input
              type="search"
              id="verbs160-search"
              class="inline-filter-input"
              value="${escapeHtml(verbsLocalQuery)}"
              placeholder="${lang === 'en' ? 'Search verb, reading, meaning…' : 'Chercher verbe, lecture, sens…'}"
            />
            <button class="btn-violet-pill" id="verbs160-to-gym">+ ${ui({ fr: 'Driller (160)', en: 'Drill All 160' }, lang)}</button>
          </div>
        </div>

        <div class="filter-toolbar">
          <div class="section-filters">
            <button class="filter-pill-btn ${verbsTableMode === 'A' ? 'active' : ''}" data-vtab-mode="A">
              ${ui({ fr: 'Table A · Formes de base (7)', en: 'Table A · Basic Forms (7)' }, lang)}
            </button>
            <button class="filter-pill-btn ${verbsTableMode === 'B' ? 'active' : ''}" data-vtab-mode="B">
              ${ui({ fr: 'Table B · Formes N4 (5)', en: 'Table B · N4 Forms (5)' }, lang)}
            </button>
          </div>
          <div class="section-filters">
            <button class="filter-pill-btn ${verbsFilter === 'all' ? 'active' : ''}" data-vlist-filter="all">${ui({ fr: 'Tous', en: 'All' }, lang)}</button>
            <button class="filter-pill-btn ${verbsFilter === 'g1' ? 'active' : ''}" data-vlist-filter="g1">G1</button>
            <button class="filter-pill-btn ${verbsFilter === 'g2' ? 'active' : ''}" data-vlist-filter="g2">G2</button>
            <button class="filter-pill-btn ${verbsFilter === 'tr' ? 'active' : ''}" data-vlist-filter="tr">tr</button>
            <button class="filter-pill-btn ${verbsFilter === 'intr' ? 'active' : ''}" data-vlist-filter="intr">intr</button>
          </div>
        </div>

        <div class="flow-card">
          <div class="table-scroll">
            <table class="flow-table flow-table-compact">
              <thead>
                <tr>
                  <th>#</th>
                  <th>${ui({ fr: 'Verbe & sens', en: 'Verb & Meaning' }, lang)}</th>
                  <th>G</th>
                  ${cols.map((c) => `<th>${c.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${pageVerbs
                  .map(
                    (v) => `
                  <tr>
                    <td style="color:var(--text-muted);font-size:0.8em;">${v.id}</td>
                    <td class="jp-tap" data-speak="${escapeHtml(v.reading || v.verb)}" title="Tap to listen">
                      <div style="font-weight:700;color:var(--text-strong);">
                        ${escapeHtml(v.verb)}
                        ${v.reading !== v.verb ? `<span style="font-weight:400;color:var(--text-muted);font-size:0.84em;margin-left:4px;">${escapeHtml(v.reading)}</span>` : ''}
                      </div>
                      <div style="font-size:0.76em;color:var(--text-subtle);font-family:var(--font-sans);margin-top:2px;">
                        ${t(v.meaning, lang, true)}
                      </div>
                    </td>
                    <td>
                      <span class="pill-tag ${v.group === 1 ? 'pill-tag-violet' : ''}" style="font-size:0.72em;padding:2px 7px;">G${v.group}</span>
                      ${v.transitivity ? `<div style="font-size:0.7em;color:var(--text-muted);margin-top:2px;text-align:center;">${escapeHtml(v.transitivity)}</div>` : ''}
                    </td>
                    ${cols
                      .map((c) => {
                        const val = v.forms[c.key];
                        return val
                          ? `<td class="jp-tap" data-speak="${escapeHtml(val)}" title="Tap to listen">${escapeHtml(val)}</td>`
                          : `<td style="color:var(--text-muted);text-align:center;">—</td>`;
                      })
                      .join('')}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${
          totalPages > 1
            ? `
          <div class="pagination-bar">
            <button class="btn-ghost-pill" id="v160-prev" ${verbsPage <= 1 ? 'disabled' : ''}>← ${ui({ fr: 'Précédent', en: 'Prev' }, lang)}</button>
            <span class="section-subtitle">
              ${ui({ fr: `Page ${verbsPage} sur ${totalPages}`, en: `Page ${verbsPage} of ${totalPages}` }, lang)}
              (${startIdx + 1}–${Math.min(startIdx + VERBS_PER_PAGE, filtered.length)} / ${filtered.length})
            </span>
            <button class="btn-ghost-pill" id="v160-next" ${verbsPage >= totalPages ? 'disabled' : ''}>${ui({ fr: 'Suivant', en: 'Next' }, lang)} →</button>
          </div>
        `
            : ''
        }
      </section>

      <div class="summary-bar">
        <div class="summary-left">
          <span>${t({ fr: 'Clique sur n’importe quelle forme conjuguée pour l’écouter en japonais.', en: 'Tap any conjugated cell to hear its Japanese pronunciation.' }, lang, true)}</span>
        </div>
        <div class="summary-right">
          <span class="summary-label">${ui({ fr: 'Banque complète :', en: 'Full Pack:' }, lang)}</span>
          <span class="summary-total">160 × 12</span>
        </div>
      </div>
    `;

    const sEl = container.querySelector('#verbs160-search');
    sEl?.addEventListener('input', (e) => {
      verbsLocalQuery = e.target.value;
      verbsPage = 1;
      const pos = e.target.selectionStart;
      renderConjugation(container, ctx);
      const nextInp = container.querySelector('#verbs160-search');
      if (nextInp) {
        nextInp.focus();
        nextInp.setSelectionRange(pos, pos);
      }
    });

    container.querySelector('#verbs160-to-gym')?.addEventListener('click', () => {
      gymFilter = 'pack160';
      activeSubtab = 'gym';
      resetGymSession();
      ctx.refreshSubbar?.();
      renderConjugation(container, ctx);
    });

    container.querySelectorAll('[data-vtab-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        verbsTableMode = btn.dataset.vtabMode;
        renderConjugation(container, ctx);
      });
    });

    container.querySelectorAll('[data-vlist-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        verbsFilter = btn.dataset.vlistFilter;
        verbsPage = 1;
        renderConjugation(container, ctx);
      });
    });

    container.querySelector('#v160-prev')?.addEventListener('click', () => {
      if (verbsPage > 1) {
        verbsPage -= 1;
        renderConjugation(container, ctx);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    container.querySelector('#v160-next')?.addEventListener('click', () => {
      if (verbsPage < totalPages) {
        verbsPage += 1;
        renderConjugation(container, ctx);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  } else if (activeSubtab === 'tricks') {
    container.innerHTML = `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui({ fr: 'Le truc あいうえお du groupe 1 (書[か]く)', en: 'The Group 1 あいうえお Vowel Shift (書[か]く)' }, lang)}</h2>
        </div>
        <div class="flow-card flow-card-pad">
          <div class="vowel-grid">
            ${AIUEO_TRICK.map(
              (row) => `
              <div class="vowel-tile">
                <div class="vowel-char">${row.vowel}</div>
                <div class="vowel-sub">(${row.kana})</div>
                <div style="font-family:var(--font-jp);font-size:0.9em;color:var(--text-strong);">${renderRuby(row.forms)}</div>
              </div>
            `
            ).join('')}
          </div>
          <div class="trap-note" style="margin-top:16px;">
            ${t(AIUEO_TRICK[0].note, lang)}
          </div>
        </div>
      </section>

      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui({ fr: 'Reconnaître une forme d’un coup d’œil', en: 'Recognize a Form at a Glance' }, lang)}</h2>
        </div>
        <div class="flow-card">
          ${QUICK_RECOGNIZE.map(
            (r) => `
            <div class="flow-row-compact">
              <div><span class="pill-tag pill-tag-violet">${r.group}</span></div>
              <div>
                <div class="cell-jp">${renderRuby(r.ending)}</div>
                <div class="cell-sub">${t(r.form, lang, true)}</div>
              </div>
              <div class="row-actions">
                <button class="circle-icon-btn" data-speak="${r.ending}">🔊</button>
              </div>
            </div>
          `
          ).join('')}
        </div>
      </section>

      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui({ fr: 'Pièges du groupe 1 (finissent en -iる / -eる)', en: 'Group 1 Trap Verbs (look like G2!)' }, lang)}</h2>
        </div>
        <div class="flow-card">
          ${TRAP_G1_VERBS.map(
            (tv) => `
            <div class="flow-row-compact">
              <div><span class="pill-tag pill-tag-amber">G1 Trap</span></div>
              <div>
                <div class="cell-jp">${renderRuby(tv.word)}</div>
                <div class="cell-sub">${t({ fr: tv.fr, en: tv.en }, lang, true)}</div>
              </div>
              <div class="row-actions">
                <button class="circle-icon-btn" data-speak="${tv.word}">🔊</button>
              </div>
            </div>
          `
          ).join('')}
        </div>
      </section>
    `;
  } else {
    const q = currentQ;
    const fLbl = FORM_LABELS[q.targetForm];
    const answered = selectedIdx !== null;
    const isOk = selectedIdx === q.answer;
    const pct = gymSize > 0 ? Math.min(100, Math.round((gymTotal / gymSize) * 100)) : 0;

    container.innerHTML = `
      <div class="quiz-studio">
        <div class="section-header">
          <div class="section-filters">
            <button class="filter-pill-btn ${gymFilter === 'pack160' ? 'active' : ''}" data-gym-filter="pack160">${ui({ fr: 'Pack complet (160)', en: 'Full Pack (160)' }, lang)}</button>
            <button class="filter-pill-btn ${gymFilter === 'all' ? 'active' : ''}" data-gym-filter="all">${ui({ fr: 'Essentiels (36)', en: 'Core (36)' }, lang)}</button>
            <button class="filter-pill-btn ${gymFilter === 'n4only' ? 'active' : ''}" data-gym-filter="n4only">${ui({ fr: 'Formes N4', en: 'N4 Forms' }, lang)}</button>
            <button class="filter-pill-btn ${gymFilter === 'traps' ? 'active' : ''}" data-gym-filter="traps">${ui({ fr: 'Pièges G1', en: 'G1 Traps' }, lang)}</button>
            <button class="filter-pill-btn ${gymFilter === 'g1' ? 'active' : ''}" data-gym-filter="g1">G1</button>
            <button class="filter-pill-btn ${gymFilter === 'g2' ? 'active' : ''}" data-gym-filter="g2">G2</button>
          </div>
          <div class="section-filters">
            <span class="section-subtitle">${ui({ fr: 'Taille :', en: 'Size:' }, lang)}</span>
            <button class="filter-pill-btn ${gymSize === 10 ? 'active' : ''}" data-gym-size="10">10 Q</button>
            <button class="filter-pill-btn ${gymSize === 20 ? 'active' : ''}" data-gym-size="20">20 Q</button>
            <button class="filter-pill-btn ${gymSize === 0 ? 'active' : ''}" data-gym-size="0">∞</button>
          </div>
        </div>

        <div class="flow-card">
          ${
            gymSize > 0
              ? `<div class="quiz-progress-track"><div class="quiz-progress-bar" style="width:${pct}%"></div></div>`
              : ''
          }
          ${
            gymFinished
              ? `<div class="verdict-box">
                  <div class="verdict-score">${gymCorrect} / ${gymTotal}</div>
                  <div class="cell-primary" style="margin-top:8px;">
                    ${ui({ fr: 'Série Verb Gym terminée !', en: 'Verb Gym Set Complete!' }, lang)}
                  </div>
                  <div style="margin-top:16px;">
                    <button class="btn-violet-pill" id="btn-gym-restart">↺ ${ui({ fr: 'Nouvelle série', en: 'Start New Set' }, lang)}</button>
                  </div>
                </div>`
              : `<div class="flow-card-pad">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <span class="pill-tag ${q.verb.trapG1 ? 'pill-tag-amber' : 'pill-tag-violet'}">
                        G${q.verb.group}${q.verb.transitivity ? ` · ${q.verb.transitivity}` : ''}${q.verb.trapG1 ? ' · Trap' : ''}
                      </span>
                      <span style="color:var(--text-subtle);font-size:0.88em;">${t(q.verb.meaning, lang, true)}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <span class="section-subtitle">🔥 ${gymStreak} · ${gymCorrect}/${gymSize > 0 ? gymSize : gymTotal}</span>
                      <button class="circle-icon-btn" data-speak="${escapeHtml(q.verb.speakWord || q.verb.dict)}" title="Listen">🔊</button>
                    </div>
                  </div>

                  <div class="quiz-sentence" style="margin-top:20px;">
                    <span style="font-size:1.25em;font-weight:800;color:var(--text-strong);">${renderRuby(q.verb.dict)}</span>
                    <span style="margin:0 12px;color:var(--text-muted);">→</span>
                    <span style="color:var(--brand);font-weight:700;">${t(fLbl, lang, true)}</span>
                  </div>

                  <div class="options-grid">
                    ${q.options
                      .map((opt, idx) => {
                        let cls = 'opt-card';
                        if (answered) {
                          if (idx === q.answer) cls += ' correct';
                          else if (idx === selectedIdx) cls += ' wrong';
                        }
                        return `
                          <button class="${cls}" data-gym-opt="${idx}" ${answered ? 'disabled' : ''}>
                            <span class="opt-index">${idx + 1}</span>
                            <span>${renderRuby(opt)}</span>
                          </button>
                        `;
                      })
                      .join('')}
                  </div>

                  ${
                    answered
                      ? `
                    <div class="feedback-banner ${isOk ? 'ok' : 'err'}">
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                        <div>
                          <strong>${isOk ? '✓ ' + ui({ fr: 'Exact !', en: 'Correct!' }, lang) : '✗ ' + ui({ fr: 'Ajouté au Carnet d’erreurs', en: 'Saved to Error Log' }, lang)}</strong>
                          <div style="margin-top:4px;">
                            ${renderRuby(q.verb.dict)} (G${q.verb.group}) → <strong>${renderRuby(q.options[q.answer])}</strong>
                          </div>
                        </div>
                        <button class="btn-violet-pill" id="btn-gym-next">${ui({ fr: 'Suivant →', en: 'Next →' }, lang)}</button>
                      </div>
                    </div>
                  `
                      : ''
                  }
                </div>`
          }
        </div>
      </div>
    `;

    container.querySelectorAll('[data-gym-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        gymFilter = btn.dataset.gymFilter;
        resetGymSession();
        renderConjugation(container, ctx);
      });
    });

    container.querySelectorAll('[data-gym-size]').forEach((btn) => {
      btn.addEventListener('click', () => {
        gymSize = Number(btn.dataset.gymSize);
        resetGymSession();
        renderConjugation(container, ctx);
      });
    });

    container.querySelector('#btn-gym-restart')?.addEventListener('click', () => {
      resetGymSession();
      renderConjugation(container, ctx);
    });

    container.querySelectorAll('[data-gym-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (selectedIdx !== null) return;
        selectedIdx = Number(btn.dataset.gymOpt);
        gymTotal += 1;
        if (selectedIdx === currentQ.answer) {
          gymStreak += 1;
          gymCorrect += 1;
          speakJP(currentQ.options[currentQ.answer]);
        } else {
          gymStreak = 0;
          const v = currentQ.verb;
          const fl = FORM_LABELS[currentQ.targetForm];
          recordError(state, {
            key: `verb_${v.dict}_${currentQ.targetForm}`,
            source: 'verb',
            refLabel: `Verb Gym (G${v.group})`,
            duelId: 1,
            sentence: `${v.dict} → ${fl.fr} / ${fl.en}`,
            options: currentQ.options,
            answer: currentQ.answer,
            explanation: {
              fr: `${v.dict} (${v.meaning.fr}) est du groupe ${v.group}. Forme attendue : ${currentQ.options[currentQ.answer]}.`,
              en: `${v.dict} (${v.meaning.en}) is Group ${v.group}. Expected: ${currentQ.options[currentQ.answer]}.`,
            },
          });
          refreshBadges();
        }
        renderConjugation(container, ctx);
      });
    });

    container.querySelector('#btn-gym-next')?.addEventListener('click', () => {
      if (gymSize > 0 && gymTotal >= gymSize) {
        gymFinished = true;
      } else {
        pickGymQuestion();
      }
      renderConjugation(container, ctx);
    });
  }

  container.querySelectorAll('[data-speak]').forEach((el) => {
    el.addEventListener('click', () => speakJP(el.dataset.speak));
  });
}
