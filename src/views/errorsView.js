import { ui, t, renderRuby, speakJP, markErrorMastered, saveState } from '../utils.js';
import { renderGuidanceSection, wireGuidanceEvents } from '../components/guidanceWidget.js';

let errorSubtab = 'active'; // 'active' | 'mastered'
let drillQueue = null;
let drillIdx = 0;
let drillChosen = null;
let showErrHint = false;
let showErrSearch = false;
let errGuideQuery = '';

export function getErrorsSubtabs(lang, state) {
  const activeCount = state.errors.filter((e) => !e.mastered).length;
  const masteredCount = state.errors.filter((e) => e.mastered).length;
  return [
    { id: 'active', label: ui({ fr: 'À refaire', en: 'To Review' }, lang), count: activeCount },
    { id: 'mastered', label: ui({ fr: 'Corrigées', en: 'Mastered' }, lang), count: masteredCount },
  ];
}

export function setErrorsSubtab(id) {
  errorSubtab = id || 'active';
  drillQueue = null;
}

export function getErrorsSubtab() {
  return errorSubtab;
}

function formatSentence(sentence, answerOpt) {
  const rendered = renderRuby(sentence);
  const slot = `<span class="blank-slot">${answerOpt ? renderRuby(answerOpt) : '　　'}</span>`;
  if (rendered.includes('___')) return rendered.replace('___', slot);
  if (rendered.includes('（　）')) return rendered.replace('（　）', slot);
  return rendered;
}

export function renderErrors(container, ctx) {
  const { state, navigate, refreshBadges, globalQuery } = ctx;
  const lang = state.lang;
  const q = (globalQuery || '').trim().toLowerCase();

  const activeList = state.errors.filter((e) => !e.mastered);
  const masteredList = state.errors.filter((e) => e.mastered);

  if (drillQueue) {
    const item = drillQueue[drillIdx];
    if (!item) {
      drillQueue = null;
      renderErrors(container, ctx);
      return;
    }

    const answered = drillChosen !== null;
    const isOk = drillChosen === item.answer;
    const pct = Math.round(((drillIdx + 1) / drillQueue.length) * 100);

    container.innerHTML = `
      <div class="quiz-studio">
        <div class="section-header">
          <h2 class="section-title">
            ${ui({ fr: 'Révision des erreurs (J-3 / J-2)', en: 'Error Re-Drill (D-3 / D-2)' }, lang)}
            <span class="section-subtitle">${drillIdx + 1} / ${drillQueue.length} · ${item.refLabel}</span>
          </h2>
          <button class="btn-ghost-pill" id="err-exit-drill">← ${ui({ fr: 'Retour', en: 'Back' }, lang)}</button>
        </div>

        <div class="flow-card">
          <div class="quiz-progress-track">
            <div class="quiz-progress-bar" style="width:${pct}%"></div>
          </div>

          <div class="flow-card-pad">
            <span class="pill-tag pill-tag-violet">Duel #${item.duelId}</span>

            <div class="quiz-sentence">${formatSentence(item.sentence, answered ? item.options[item.answer] : null)}</div>

            ${renderGuidanceSection({
              duelId: item.duelId,
              lang,
              showHint: showErrHint,
              showSearch: showErrSearch,
              searchQuery: errGuideQuery,
            })}

            <div class="options-grid">
              ${item.options
                .map((opt, idx) => {
                  let cls = 'opt-card';
                  if (answered) {
                    if (idx === item.answer) cls += ' correct';
                    else if (idx === drillChosen) cls += ' wrong';
                  }
                  return `
                    <button class="${cls}" data-eropt="${idx}" ${answered ? 'disabled' : ''}>
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
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                  <div>
                    <strong>${isOk ? '✓ ' + ui({ fr: 'Corrigé ! Marqué comme maîtrisé.', en: 'Fixed! Marked as mastered.' }, lang) : '✗ ' + ui({ fr: 'Encore un piège — conservée dans le carnet.', en: 'Still tricky — kept in your log.' }, lang)}</strong>
                    <div style="margin-top:4px;">${t(item.explanation, lang)}</div>
                  </div>
                  <button class="btn-violet-pill" id="err-next-drill">
                    ${drillIdx < drillQueue.length - 1 ? ui({ fr: 'Suivante →', en: 'Next →' }, lang) : ui({ fr: 'Terminer ✓', en: 'Finish ✓' }, lang)}
                  </button>
                </div>
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;

    container.querySelector('#err-exit-drill')?.addEventListener('click', () => {
      drillQueue = null;
      showErrHint = false;
      showErrSearch = false;
      renderErrors(container, ctx);
    });

    wireGuidanceEvents(container, {
      onToggleHint() {
        showErrHint = !showErrHint;
        if (showErrHint) showErrSearch = false;
        renderErrors(container, ctx);
      },
      onToggleSearch() {
        showErrSearch = !showErrSearch;
        if (showErrSearch) showErrHint = false;
        renderErrors(container, ctx);
        if (showErrSearch) container.querySelector('[data-guide-search-input]')?.focus();
      },
      onSearchInput(val, pos) {
        errGuideQuery = val;
        renderErrors(container, ctx);
        const inp = container.querySelector('[data-guide-search-input]');
        if (inp) {
          inp.focus();
          inp.setSelectionRange(pos, pos);
        }
      },
    });

    container.querySelectorAll('[data-eropt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (drillChosen !== null) return;
        drillChosen = Number(btn.dataset.eropt);
        if (drillChosen === item.answer) {
          markErrorMastered(state, item.key, true);
          refreshBadges();
          ctx.refreshSubbar?.();
        }
        renderErrors(container, ctx);
      });
    });

    container.querySelector('#err-next-drill')?.addEventListener('click', () => {
      if (drillIdx < drillQueue.length - 1) {
        drillIdx += 1;
        drillChosen = null;
        showErrHint = false;
        showErrSearch = false;
      } else {
        drillQueue = null;
      }
      renderErrors(container, ctx);
    });
    return;
  }

  const baseList = errorSubtab === 'active' ? activeList : masteredList;
  const shown = baseList.filter((e) => {
    if (!q) return true;
    return `${e.refLabel} ${e.sentence} ${e.explanation?.fr || ''} ${e.explanation?.en || ''}`
      .toLowerCase()
      .includes(q);
  });

  container.innerHTML = `
    <section class="section-group">
      <div class="section-header">
        <h2 class="section-title">
          ${
            errorSubtab === 'active'
              ? ui({ fr: 'Carnet d’erreurs · À refaire (J-3 / J-2)', en: 'Error Log · To Review (D-3 / D-2)' }, lang)
              : ui({ fr: 'Erreurs corrigées & maîtrisées', en: 'Fixed & Mastered Errors' }, lang)
          }
          <span class="section-subtitle">(${shown.length})</span>
        </h2>
        ${
          activeList.length > 0
            ? `<button class="btn-violet-pill" id="btn-start-err-drill">+ ${ui({ fr: `Refaire (${activeList.length})`, en: `Re-Drill (${activeList.length})` }, lang)}</button>`
            : ''
        }
      </div>

      <div class="flow-card">
        ${
          shown.length === 0
            ? `<div class="flow-card-pad" style="text-align:center;padding:44px 20px;">
                <div class="cell-primary" style="font-size:1.05em;">
                  ${
                    errorSubtab === 'active'
                      ? ui({ fr: 'Aucune erreur en attente !', en: 'No pending errors!' }, lang)
                      : ui({ fr: 'Aucune erreur maîtrisée pour l’instant.', en: 'No mastered errors yet.' }, lang)
                  }
                </div>
                <div class="cell-sub" style="max-width:460px;margin:8px auto 18px;">
                  ${t({ fr: 'Toute erreur faite dans les Duels, le Verb Gym ou les Tests est enregistrée ici.', en: 'Any mistake from Duels, Verb Gym, or Tests is automatically saved here.' }, lang, true)}
                </div>
                <button class="btn-violet-pill" id="btn-go-blitz">+ ${ui({ fr: 'Lancer un test', en: 'Start a Test' }, lang)}</button>
              </div>`
            : shown
                .map((err) => {
                  const fullSentence = err.sentence
                    .replace('___', err.options[err.answer])
                    .replace('（　）', err.options[err.answer]);
                  return `
                    <div class="flow-row">
                      <div>
                        <span class="pill-tag ${err.mastered ? '' : 'pill-tag-amber'}">${err.refLabel}</span>
                      </div>
                      <div>
                        <div class="cell-jp">
                          ${formatSentence(err.sentence, err.options[err.answer])}
                        </div>
                        <div class="cell-sub">${t(err.explanation, lang, true)}</div>
                      </div>
                      <div>
                        <div class="cell-primary" style="font-size:0.88em;">Duel #${err.duelId}</div>
                        <div class="cell-sub">×${err.wrongCount || 1} ${ui({ fr: 'manquée(s)', en: 'missed' }, lang)}</div>
                      </div>
                      <div class="row-actions">
                        ${
                          err.mastered
                            ? `<button class="btn-mint-pill" data-toggle-master="${err.key}">✓ ${ui({ fr: 'Maîtrisée', en: 'Mastered' }, lang)}</button>`
                            : `<button class="btn-violet-pill" data-redrill-one="${err.key}">+ ${ui({ fr: 'Refaire', en: 'Re-Drill' }, lang)}</button>`
                        }
                        <button class="circle-icon-btn" data-speak="${fullSentence}" title="Listen">🔊</button>
                        <button class="circle-icon-btn" data-jump-duel="${err.duelId}" title="Open Duel">⚔</button>
                        <button class="circle-icon-btn ${err.mastered ? 'is-active' : ''}" data-toggle-master="${err.key}" title="Toggle mastered">✓</button>
                      </div>
                    </div>
                  `;
                })
                .join('')
        }
      </div>
    </section>

    <div class="summary-bar">
      <div class="summary-left">
        <span>${ui({ fr: 'J-3 & J-2 : refais uniquement ces erreurs jusqu’à ce qu’elles passent toutes au vert.', en: 'D-3 & D-2: drill only these errors until every row turns mint green.' }, lang)}</span>
      </div>
      <div class="summary-right">
        <span class="summary-label">${ui({ fr: 'Erreurs actives :', en: 'Active Errors:' }, lang)}</span>
        <span class="summary-total">${activeList.length}</span>
      </div>
    </div>
  `;

  container.querySelector('#btn-start-err-drill')?.addEventListener('click', () => {
    drillQueue = [...activeList];
    drillIdx = 0;
    drillChosen = null;
    renderErrors(container, ctx);
  });

  container.querySelectorAll('[data-redrill-one]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = state.errors.find((e) => e.key === btn.dataset.redrillOne);
      if (target) {
        drillQueue = [target];
        drillIdx = 0;
        drillChosen = null;
        renderErrors(container, ctx);
      }
    });
  });

  container.querySelector('#btn-go-blitz')?.addEventListener('click', () => navigate('blitz'));

  container.querySelectorAll('[data-speak]').forEach((btn) => {
    btn.addEventListener('click', () => speakJP(btn.dataset.speak));
  });

  container.querySelectorAll('[data-jump-duel]').forEach((btn) => {
    btn.addEventListener('click', () => navigate('duels', { duelId: Number(btn.dataset.jumpDuel) }));
  });

  container.querySelectorAll('[data-toggle-master]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggleMaster;
      const found = state.errors.find((e) => e.key === key);
      if (found) {
        found.mastered = !found.mastered;
        saveState(state);
        refreshBadges();
        ctx.refreshSubbar?.();
        renderErrors(container, ctx);
      }
    });
  });
}
