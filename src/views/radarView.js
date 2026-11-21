import {
  SIGNAL_WORDS,
  FORM_BEFORE_WORDS,
  NOUN_CONNECTORS,
  APPEARANCE_MATRIX,
  RADAR_DRILL_ITEMS,
} from '../data/traps.js';
import { ui, t, renderRuby, speakJP } from '../utils.js';

let radarTab = 'after'; // 'after' | 'noun' | 'appear' | 'drill'
let drillMode = 'all';
let drillSize = 10; // 10 | 20 | 0
let currentDrill = null;
let drillChoice = null;
let drillStreak = 0;
let drillCorrect = 0;
let drillTotal = 0;
let drillFinished = false;

export function getRadarSubtabs(lang) {
  return [
    { id: 'after', label: ui({ fr: 'Mot après le trou', en: 'Word After Blank' }, lang) },
    { id: 'noun', label: ui({ fr: 'Nom + ?', en: 'Noun + ?' }, lang) },
    { id: 'appear', label: ui({ fr: 'Apparence / Ouï-dire', en: 'Appearance / Hearsay' }, lang) },
    { id: 'drill', label: ui({ fr: 'Flash Drill', en: 'Reflex Drill' }, lang) },
  ];
}

export function setRadarTab(tab) {
  if (tab) radarTab = tab;
}

export function getRadarTab() {
  return radarTab;
}

const VERB_FORM_OPTIONS = [
  { id: 'stem', label: { fr: 'Radical ます', en: 'ます-stem' } },
  { id: 'dict', label: { fr: 'Forme dictionnaire', en: 'Dictionary form' } },
  { id: 'ta', label: { fr: 'Forme た', en: 'た-form' } },
  { id: 'te', label: { fr: 'Forme て', en: 'て-form' } },
  { id: 'nai', label: { fr: 'Forme ない', en: 'ない-form' } },
];

const NOUN_FORM_OPTIONS = [
  { id: 'da', label: { fr: 'だ', en: 'だ' } },
  { id: 'na', label: { fr: 'な', en: 'な' } },
  { id: 'no', label: { fr: 'の', en: 'の' } },
  { id: 'none', label: { fr: '∅ (rien)', en: '∅ (nothing)' } },
];

function nextRadarDrill() {
  const pool =
    drillMode === 'all'
      ? RADAR_DRILL_ITEMS
      : RADAR_DRILL_ITEMS.filter((i) => i.category === drillMode);
  currentDrill = pool[Math.floor(Math.random() * pool.length)];
  drillChoice = null;
}

function resetRadarDrill() {
  drillStreak = 0;
  drillCorrect = 0;
  drillTotal = 0;
  drillFinished = false;
  nextRadarDrill();
}

export function renderRadar(container, ctx) {
  const { state, navigate, globalQuery } = ctx;
  const lang = state.lang;
  const q = (globalQuery || '').trim().toLowerCase();

  if (!currentDrill) nextRadarDrill();

  if (radarTab === 'after') {
    const filteredSignals = SIGNAL_WORDS.filter((r) => {
      if (!q) return true;
      return `${r.signal} ${r.signalEn} ${r.requires.fr} ${r.requires.en} ${r.questions}`.toLowerCase().includes(q);
    });

    container.innerHTML = `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">1. ${ui({ fr: 'Mots-signaux dans la phrase', en: 'Signal Words Inside the Sentence' }, lang)}</h2>
          <button class="btn-violet-pill" id="radar-start-drill">+ ${ui({ fr: 'Flash Drill', en: 'Reflex Drill' }, lang)}</button>
        </div>

        <div class="flow-card">
          ${filteredSignals
            .map(
              (row) => `
            <div class="flow-row">
              <div><span class="pill-tag">${row.questions}</span></div>
              <div>
                <div class="cell-jp">${renderRuby(lang === 'en' ? row.signalEn : row.signal)}</div>
                <div class="cell-sub">${ui({ fr: 'Mot-signal', en: 'Signal word' }, lang)}</div>
              </div>
              <div>
                <div class="cell-primary" style="color:var(--brand);">${t(row.requires, lang, true)}</div>
                <div class="cell-sub">${ui({ fr: 'Forme demandée', en: 'Required pattern' }, lang)}</div>
              </div>
              <div class="row-actions">
                <button class="btn-ghost-pill" data-jump-duel="${row.duelId}">Duel #${row.duelId} →</button>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>

      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">2. ${ui({ fr: 'Le mot juste APRÈS le trou décide de la forme du verbe', en: 'The Word RIGHT AFTER the Blank Dictates the Verb Form' }, lang)}</h2>
        </div>

        <div class="flow-card">
          ${FORM_BEFORE_WORDS.map(
            (row) => `
            <div class="flow-row-compact">
              <div><span class="pill-tag pill-tag-violet">${ui(row.short, lang)}</span></div>
              <div>
                <div class="cell-primary" style="margin-bottom:8px;">${t(row.form, lang, true)}</div>
                <div class="example-chips" style="margin-bottom:0;">
                  ${row.words
                    .map(
                      (w) => `<span class="example-chip" style="cursor:default;">${renderRuby(w)}</span>`
                    )
                    .join('')}
                </div>
              </div>
              <div></div>
            </div>
          `
          ).join('')}
        </div>
      </section>
    `;

    container.querySelector('#radar-start-drill')?.addEventListener('click', () => {
      radarTab = 'drill';
      ctx.refreshSubbar?.();
      renderRadar(container, ctx);
    });
  } else if (radarTab === 'noun') {
    container.innerHTML = `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui({ fr: 'Nom + ? : la page qui sauve 10+ points', en: 'Noun + ? : The Sheet That Saves 10+ Points' }, lang)}</h2>
          <button class="btn-violet-pill" id="radar-drill-noun">+ ${ui({ fr: 'Tester Nom + ?', en: 'Drill Noun + ?' }, lang)}</button>
        </div>

        <div class="flow-card">
          ${NOUN_CONNECTORS.map(
            (row) => `
            <div class="flow-row">
              <div>
                <span class="pill-tag pill-tag-violet" style="font-size:0.95em;min-width:78px;">${row.connector}</span>
              </div>
              <div>
                <div class="cell-jp">${row.words.map((w) => renderRuby(w)).join(' ・ ')}</div>
                <div class="cell-sub">${ui({ fr: 'Devant ces mots', en: 'Before these words' }, lang)}</div>
              </div>
              <div>
                <div class="cell-jp" style="font-weight:500;">${renderRuby(row.cleanExamples)}</div>
                <div class="cell-sub">${ui({ fr: 'Exemples', en: 'Examples' }, lang)}</div>
              </div>
              <div class="row-actions">
                <button class="circle-icon-btn" data-speak="${row.cleanExamples}" title="Listen">🔊</button>
              </div>
            </div>
          `
          ).join('')}
        </div>
      </section>

      <div class="trap-note">
        <strong>⚠️ ${ui({ fr: 'Exception な-adj :', en: 'な-adj Rule:' }, lang)}</strong>
        ${t(
          {
            fr: 'Avec un な-adj, c’est pareil, sauf la ligne の qui devient な : しずかなようだ, しずかなはず. Avec un verbe ou un い-adj, on colle directement : ふるそうだ, 高[たか]いはず, 来[こ]ないかもしれない.',
            en: 'With a な-adjective it is identical, except the の row becomes な: しずかなようだ, しずかなはず. With verbs or い-adjectives, attach directly: ふるそうだ, 高[たか]いはず, 来[こ]ないかもしれない.',
          },
          lang
        )}
      </div>
    `;

    container.querySelector('#radar-drill-noun')?.addEventListener('click', () => {
      drillMode = 'noun-plus';
      resetRadarDrill();
      radarTab = 'drill';
      ctx.refreshSubbar?.();
      renderRadar(container, ctx);
    });
  } else if (radarTab === 'appear') {
    container.innerHTML = `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui({ fr: 'Apparence, Ouï-dire, Déduction & Familier', en: 'Appearance, Hearsay, Deduction & Casual' }, lang)}</h2>
        </div>

        <div class="flow-card">
          <div class="table-scroll">
            <table class="flow-table">
              <thead>
                <tr>
                  <th>${ui({ fr: 'Expression', en: 'Expression' }, lang)}</th>
                  <th>${ui({ fr: 'Verbe', en: 'Verb' }, lang)}</th>
                  <th>い-adj</th>
                  <th>な-adj</th>
                  <th>${ui({ fr: 'Nom', en: 'Noun' }, lang)}</th>
                </tr>
              </thead>
              <tbody>
                ${APPEARANCE_MATRIX.map(
                  (row) => `
                  <tr>
                    <td><span class="pill-tag pill-tag-violet">${ui(row.mot, lang)}</span></td>
                    <td class="jp-tap" data-speak="${row.verb}">${renderRuby(row.verb)}</td>
                    <td class="jp-tap" data-speak="${row.iAdj}">${renderRuby(row.iAdj)}</td>
                    <td class="jp-tap" data-speak="${row.naAdj}">${renderRuby(row.naAdj)}</td>
                    <td class="jp-tap" ${typeof row.noun === 'string' ? `data-speak="${row.noun}"` : ''}>
                      ${typeof row.noun === 'string' ? renderRuby(row.noun) : `<span style="color:var(--text-muted);font-weight:400;">${ui(row.noun, lang)}</span>`}
                    </td>
                  </tr>
                `
                ).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div class="soft-note">
        <strong>${ui({ fr: 'Signaux clés :', en: 'Key Signals:' }, lang)}</strong>
        ${renderRuby('見[み]て → そう ／ 〜によると, 〜の話[はなし]では → そうだ ／ うわさでは → らしい ／ から (raison) → はず ／ たぶん → でしょう')}
      </div>
    `;
  } else {
    const item = currentDrill;
    const opts = item.category === 'after-blank' ? VERB_FORM_OPTIONS : NOUN_FORM_OPTIONS;
    const answered = drillChoice !== null;
    const isOk = drillChoice === item.answer;
    const pct = drillSize > 0 ? Math.min(100, Math.round((drillTotal / drillSize) * 100)) : 0;

    container.innerHTML = `
      <div class="quiz-studio">
        <div class="section-header">
          <div class="section-filters">
            <button class="filter-pill-btn ${drillMode === 'all' ? 'active' : ''}" data-dmode="all">${ui({ fr: 'Tout', en: 'Mix All' }, lang)}</button>
            <button class="filter-pill-btn ${drillMode === 'after-blank' ? 'active' : ''}" data-dmode="after-blank">${ui({ fr: 'Mot après trou', en: 'After Blank' }, lang)}</button>
            <button class="filter-pill-btn ${drillMode === 'noun-plus' ? 'active' : ''}" data-dmode="noun-plus">Nom + ?</button>
          </div>
          <div class="section-filters">
            <span class="section-subtitle">${ui({ fr: 'Taille :', en: 'Size:' }, lang)}</span>
            <button class="filter-pill-btn ${drillSize === 10 ? 'active' : ''}" data-dsize="10">10 Q</button>
            <button class="filter-pill-btn ${drillSize === 20 ? 'active' : ''}" data-dsize="20">20 Q</button>
            <button class="filter-pill-btn ${drillSize === 0 ? 'active' : ''}" data-dsize="0">∞</button>
          </div>
        </div>

        <div class="flow-card">
          ${drillSize > 0 ? `<div class="quiz-progress-track"><div class="quiz-progress-bar" style="width:${pct}%"></div></div>` : ''}
          ${
            drillFinished
              ? `<div class="verdict-box">
                  <div class="verdict-score">${drillCorrect} / ${drillTotal}</div>
                  <div class="cell-primary" style="margin-top:8px;">${ui({ fr: 'Série Flash Drill terminée !', en: 'Reflex Drill Complete!' }, lang)}</div>
                  <div style="margin-top:16px;">
                    <button class="btn-violet-pill" id="btn-radar-restart">↺ ${ui({ fr: 'Nouvelle série', en: 'New Set' }, lang)}</button>
                  </div>
                </div>`
              : `<div class="flow-card-pad">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span class="pill-tag pill-tag-violet">
                      ${
                        item.category === 'after-blank'
                          ? ui({ fr: 'Quelle forme du VERBE ?', en: 'Which VERB FORM?' }, lang)
                          : ui({ fr: 'Que mettre après ce NOM ?', en: 'Which NOUN connector?' }, lang)
                      }
                    </span>
                    <span class="section-subtitle">🔥 ${drillStreak} · ${drillCorrect}/${drillSize > 0 ? drillSize : drillTotal}</span>
                  </div>

                  <div class="quiz-sentence" style="text-align:center;padding:12px 0;">
                    ${renderRuby(item.prompt).replace('___', '<span class="blank-slot">？</span>')}
                  </div>

                  <div class="options-grid">
                    ${opts
                      .map((o, idx) => {
                        let cls = 'opt-card';
                        if (answered) {
                          if (o.id === item.answer) cls += ' correct';
                          else if (o.id === drillChoice) cls += ' wrong';
                        }
                        return `
                          <button class="${cls}" data-dopt="${o.id}" ${answered ? 'disabled' : ''}>
                            <span class="opt-index">${idx + 1}</span>
                            <span>${t(o.label, lang, true)}</span>
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
                          <strong>${isOk ? '✓ ' + ui({ fr: 'Réflexe parfait !', en: 'Spot on!' }, lang) : '✗ ' + ui({ fr: 'À mémoriser :', en: 'Remember:' }, lang)}</strong>
                          <div style="margin-top:4px;">${t(item.hint, lang)}</div>
                        </div>
                        <button class="btn-violet-pill" id="btn-radar-next">${ui({ fr: 'Suivant →', en: 'Next →' }, lang)}</button>
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

    container.querySelectorAll('[data-dmode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        drillMode = btn.dataset.dmode;
        resetRadarDrill();
        renderRadar(container, ctx);
      });
    });

    container.querySelectorAll('[data-dsize]').forEach((btn) => {
      btn.addEventListener('click', () => {
        drillSize = Number(btn.dataset.dsize);
        resetRadarDrill();
        renderRadar(container, ctx);
      });
    });

    container.querySelector('#btn-radar-restart')?.addEventListener('click', () => {
      resetRadarDrill();
      renderRadar(container, ctx);
    });

    container.querySelectorAll('[data-dopt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (drillChoice !== null) return;
        drillChoice = btn.dataset.dopt;
        drillTotal += 1;
        if (drillChoice === currentDrill.answer) {
          drillStreak += 1;
          drillCorrect += 1;
        } else {
          drillStreak = 0;
        }
        renderRadar(container, ctx);
      });
    });

    container.querySelector('#btn-radar-next')?.addEventListener('click', () => {
      if (drillSize > 0 && drillTotal >= drillSize) {
        drillFinished = true;
      } else {
        nextRadarDrill();
      }
      renderRadar(container, ctx);
    });
  }

  container.querySelectorAll('[data-jump-duel]').forEach((btn) => {
    btn.addEventListener('click', () => navigate('duels', { duelId: Number(btn.dataset.jumpDuel) }));
  });

  container.querySelectorAll('[data-speak]').forEach((el) => {
    el.addEventListener('click', () => speakJP(el.dataset.speak));
  });
}
