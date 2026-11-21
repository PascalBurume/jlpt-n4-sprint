import { GOLDEN_RULES } from './data/schedule.js';
import { searchAllRules } from './data/solverGuide.js';
import {
  renderGuidanceSection,
  renderBatchRulesPanel,
  wireGuidanceEvents,
} from './components/guidanceWidget.js';
import {
  ui,
  t,
  renderRuby,
  speakJP,
  getDaysRemaining,
  loadState,
  saveState,
  recordError,
} from './utils.js';
import {
  renderDashboard,
  getDashboardSubtabs,
  setDashboardSubtab,
  getDashboardSubtab,
} from './views/dashboard.js';
import {
  renderConjugation,
  getConjugationSubtabs,
  setConjugationSubtab,
  getConjugationSubtab,
} from './views/conjugationView.js';
import {
  renderDuels,
  setDuelsFilter,
  getDuelsSubtabs,
  setDuelsSubtab,
  getDuelsSubtab,
} from './views/duelsView.js';
import {
  renderRadar,
  setRadarTab,
  getRadarSubtabs,
  getRadarTab,
} from './views/radarView.js';
import {
  renderBlitz,
  getBlitzSubtabs,
  setBlitzSubtab,
  getBlitzSubtab,
} from './views/blitzView.js';
import {
  renderErrors,
  getErrorsSubtabs,
  setErrorsSubtab,
  getErrorsSubtab,
} from './views/errorsView.js';

const state = loadState();
let globalQuery = '';

const MAIN_TABS = [
  { id: 'dashboard', icon: '📅', label: { fr: 'Plan', en: 'Plan' } },
  { id: 'conjugation', icon: '📘', label: { fr: 'Conjugaison', en: 'Verbs' } },
  { id: 'duels', icon: '⚔️', label: { fr: '23 Duels', en: '23 Duels' } },
  { id: 'radar', icon: '🎯', label: { fr: 'Pièges', en: 'Trap Radar' } },
  { id: 'errors', icon: '📓', label: { fr: 'Erreurs', en: 'Error Log' } },
];

const viewRoot = document.getElementById('view-root');
const navDesktop = document.getElementById('nav-desktop');
const navMobile = document.getElementById('nav-mobile');
const subbarTabs = document.getElementById('subbar-tabs');
const searchInput = document.getElementById('global-search-input');
const searchPopover = document.getElementById('global-search-popover');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalSheet = document.getElementById('modal-sheet');

function applyBodySettings() {
  document.body.classList.remove(
    'furigana-on',
    'furigana-hover',
    'furigana-off',
    'text-md',
    'text-lg',
    'text-xl'
  );
  document.body.classList.add(`furigana-${state.furigana}`, `text-${state.textSize || 'md'}`);

  document.querySelectorAll('#textsize-toggle .pill-seg').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tsize === (state.textSize || 'md'));
  });
  document.querySelectorAll('#furigana-toggle .pill-seg').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.furi === state.furigana);
  });
  document.querySelectorAll('#lang-toggle .pill-seg').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });

  const days = getDaysRemaining();
  const badge = document.getElementById('header-days-badge');
  if (badge) badge.textContent = state.lang === 'en' ? `★ D-${days}` : `★ J-${days}`;

  const blitzLbl = document.getElementById('blitz-cta-label');
  if (blitzLbl) blitzLbl.textContent = 'Tests & Quiz';

  if (searchInput) {
    searchInput.placeholder =
      state.lang === 'en' ? 'Search a rule (たら, しか…)' : 'Chercher une règle (たら, しか…)';
  }
}

function updateErrorBell() {
  const activeErrors = state.errors.filter((e) => !e.mastered).length;
  const bellBadge = document.getElementById('bell-error-badge');
  if (!bellBadge) return;
  if (activeErrors > 0) {
    bellBadge.textContent = String(activeErrors);
    bellBadge.classList.remove('hidden');
  } else {
    bellBadge.classList.add('hidden');
  }
}

function renderNav() {
  navDesktop.innerHTML = MAIN_TABS.map(
    (tab) => `
      <button class="nav-link ${state.activeTab === tab.id ? 'active' : ''}" data-nav="${tab.id}">
        ${ui(tab.label, state.lang)}
      </button>
    `
  ).join('');

  navMobile.innerHTML = MAIN_TABS.map(
    (tab) => `
      <button class="nav-mobile-btn ${state.activeTab === tab.id ? 'active' : ''}" data-nav="${tab.id}">
        <span>${tab.icon}</span>
        <span>${ui(tab.label, state.lang)}</span>
      </button>
    `
  ).join('');

  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });

  updateErrorBell();
}

function renderSubbar() {
  const lang = state.lang;
  let tabs = [];
  let activeSub = '';

  switch (state.activeTab) {
    case 'conjugation':
      tabs = getConjugationSubtabs(lang);
      activeSub = getConjugationSubtab();
      break;
    case 'duels':
      tabs = getDuelsSubtabs(lang, state);
      activeSub = getDuelsSubtab();
      break;
    case 'radar':
      tabs = getRadarSubtabs(lang);
      activeSub = getRadarTab();
      break;
    case 'blitz':
      tabs = getBlitzSubtabs(lang, state);
      activeSub = getBlitzSubtab();
      break;
    case 'errors':
      tabs = getErrorsSubtabs(lang, state);
      activeSub = getErrorsSubtab();
      break;
    case 'dashboard':
    default:
      tabs = getDashboardSubtabs(lang);
      activeSub = getDashboardSubtab();
      break;
  }

  subbarTabs.innerHTML = tabs
    .map(
      (item) => `
      <button class="subbar-tab ${activeSub === item.id ? 'active' : ''}" data-subbar-id="${item.id}" role="tab">
        <span>${item.label}</span>
        ${typeof item.count === 'number' ? `<span class="subbar-count">${item.count}</span>` : ''}
      </button>
    `
    )
    .join('');

  subbarTabs.querySelectorAll('[data-subbar-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.subbarId;
      switch (state.activeTab) {
        case 'conjugation':
          setConjugationSubtab(id);
          break;
        case 'duels':
          setDuelsSubtab(id);
          break;
        case 'radar':
          setRadarTab(id);
          break;
        case 'blitz':
          setBlitzSubtab(id);
          break;
        case 'errors':
          setErrorsSubtab(id);
          break;
        case 'dashboard':
        default:
          setDashboardSubtab(id);
          break;
      }
      renderSubbar();
      renderActiveView();
    });
  });
}

function hideGlobalSearchPopover() {
  searchPopover?.classList.add('hidden');
}

function renderGlobalSearchPopover() {
  if (!searchPopover) return;
  const q = globalQuery.trim();
  if (!q) {
    hideGlobalSearchPopover();
    return;
  }
  const lang = state.lang;
  const results = searchAllRules(q);

  searchPopover.innerHTML = `
    <div class="popover-head">
      <span>${ui({ fr: `Guide rapide · ${results.length} règle(s)`, en: `Instant Rule Finder · ${results.length} match(es)` }, lang)}</span>
      <button type="button" class="footer-link-btn" id="popover-close-btn">✕</button>
    </div>
    ${
      results.length === 0
        ? `<div style="padding:14px 10px;font-size:0.84rem;color:var(--text-muted);">
            ${ui({ fr: 'Aucune règle trouvée. Essaie : たら, しか, ので, なさい, passif, Nom.', en: 'No matching rule. Try: たら, しか, ので, なさい, passive, Noun.' }, lang)}
          </div>`
        : results
            .map(
              (r, i) => `
            <button type="button" class="popover-item" data-pop-idx="${i}">
              <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;flex-wrap:wrap;">
                <span class="pill-tag pill-tag-violet" style="font-size:0.72rem;padding:2px 9px;">${renderRuby(r.badge)}</span>
                <strong style="font-size:0.84rem;color:var(--text-strong);">${ui(r.title, lang)}</strong>
              </div>
              <div style="font-family:var(--font-jp);font-size:0.84rem;color:var(--brand);font-weight:600;margin-bottom:2px;">
                ${renderRuby(r.preview)}
              </div>
              <div style="font-size:0.78rem;color:var(--text-subtle);line-height:1.4;">
                ${t(r.rule, lang, true)}
              </div>
            </button>
          `
            )
            .join('')
    }
  `;

  searchPopover.classList.remove('hidden');

  searchPopover.querySelector('#popover-close-btn')?.addEventListener('click', hideGlobalSearchPopover);
  searchPopover.querySelectorAll('[data-pop-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const picked = results[Number(btn.dataset.popIdx)];
      hideGlobalSearchPopover();
      globalQuery = '';
      if (searchInput) searchInput.value = '';
      if (picked.duelId) {
        navigate('duels', { duelId: picked.duelId });
      } else if (picked.radarTab) {
        navigate('radar', { radarTab: picked.radarTab });
      }
    });
  });
}

function closeModal() {
  modalBackdrop.classList.add('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  modalSheet.innerHTML = '';
}

function openGoldenRuleModal() {
  const lang = state.lang;
  modalSheet.innerHTML = `
    <div class="modal-head">
      <div>
        <div class="cell-sub" style="text-transform:uppercase;letter-spacing:0.06em;font-weight:700;color:var(--brand);">
          ${ui({ fr: 'Réflexe JLPT N4 · 6 décembre', en: 'JLPT N4 Exam Reflex · Dec 6' }, lang)}
        </div>
        <h2 style="margin:2px 0 0;font-size:1.12em;color:var(--text-strong);">
          ★ ${ui({ fr: 'La règle d’or devant chaque question', en: 'The Golden Rule for Every Question' }, lang)}
        </h2>
      </div>
      <button class="circle-icon-btn" id="modal-close-btn">✕</button>
    </div>
    <div class="modal-body">
      <div class="flow-card" style="box-shadow:none;">
        ${GOLDEN_RULES.map(
          (r) => `
          <div class="flow-row-compact" style="grid-template-columns:82px 1fr;">
            <div><span class="pill-tag pill-tag-violet">Step ${r.step}</span></div>
            <div class="cell-primary" style="font-weight:500;">${t(r, lang)}</div>
          </div>
        `
        ).join('')}
      </div>
      <div class="trap-note" style="margin-top:16px;">
        ${t(
          {
            fr: 'Une minute maximum par question : barre les formes impossibles, choisis, passe.',
            en: 'One minute maximum per question: eliminate impossible forms, pick one, move on.',
          },
          lang
        )}
      </div>
    </div>
  `;
  modalBackdrop.classList.remove('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  modalSheet.querySelector('#modal-close-btn')?.addEventListener('click', closeModal);
}

function openPackDrill(questions, titleObj) {
  if (!questions || questions.length === 0) return;
  let idx = 0;
  let chosen = null;
  let sessionScore = 0;
  let modalTab = 'quiz'; // 'quiz' | 'rules'
  let showHint = false;
  let showSearch = false;
  let guideSearchQuery = '';
  const batchDuelIds = [...new Set(questions.map((item) => item.duelId))];

  function renderModalQuiz(refocusSearchPos = null) {
    const lang = state.lang;
    const done = idx >= questions.length;

    if (done) {
      modalSheet.innerHTML = `
        <div class="modal-head">
          <h2 style="margin:0;font-size:1.05em;color:var(--text-strong);">${ui(titleObj, lang)}</h2>
          <button class="circle-icon-btn" id="modal-close-btn">✕</button>
        </div>
        <div class="verdict-box">
          <div class="verdict-score">${sessionScore} / ${questions.length}</div>
          <div class="cell-primary" style="margin-top:8px;">
            ${
              sessionScore === questions.length
                ? ui({ fr: 'Sans faute ! Toutes ces cartes sont validées.', en: 'Flawless! All these cards are mastered.' }, lang)
                : ui({ fr: 'Les erreurs ont été ajoutées au Carnet d’erreurs.', en: 'Missed cards were saved to your Error Log.' }, lang)
            }
          </div>
          <div style="display:flex;justify-content:center;gap:10px;margin-top:18px;">
            <button class="btn-ghost-pill" id="pack-retry">↺ ${ui({ fr: 'Recommencer', en: 'Retry' }, lang)}</button>
            <button class="btn-violet-pill" id="pack-done">${ui({ fr: 'Terminer', en: 'Done' }, lang)}</button>
          </div>
        </div>
      `;
      const finishAndClose = () => {
        closeModal();
        renderNav();
        renderSubbar();
        renderActiveView();
      };
      modalSheet.querySelector('#modal-close-btn')?.addEventListener('click', finishAndClose);
      modalSheet.querySelector('#pack-done')?.addEventListener('click', finishAndClose);
      modalSheet.querySelector('#pack-retry')?.addEventListener('click', () => {
        idx = 0;
        chosen = null;
        sessionScore = 0;
        showHint = false;
        showSearch = false;
        renderModalQuiz();
      });
      return;
    }

    const q = questions[idx];
    const answered = chosen !== null;
    const isOk = chosen === q.answer;
    const pct = Math.round(((idx + 1) / questions.length) * 100);
    const renderedSentence = renderRuby(q.sentence).replace(
      '（　）',
      `<span class="blank-slot">${answered ? renderRuby(q.options[q.answer]) : '　　'}</span>`
    );

    const duelSpanLabel =
      batchDuelIds.length === 1
        ? `Duel ${batchDuelIds[0]}`
        : `Duels ${Math.min(...batchDuelIds)}–${Math.max(...batchDuelIds)}`;

    modalSheet.innerHTML = `
      <div class="modal-head">
        <div>
          <div class="cell-sub" style="color:var(--brand);font-weight:600;">${ui(titleObj, lang)}</div>
          <h2 style="margin:2px 0 0;font-size:1em;color:var(--text-strong);">
            Q${q.id} · ${idx + 1} / ${questions.length}
            <span class="section-subtitle" style="margin-left:6px;">(Duel #${q.duelId})</span>
          </h2>
        </div>
        <button class="circle-icon-btn" id="modal-close-btn">✕</button>
      </div>

      <div class="modal-subtabs">
        <button type="button" class="subbar-tab ${modalTab === 'quiz' ? 'active' : ''}" style="height:44px;" data-mtab="quiz">
          ✏️ ${ui({ fr: `Question (${idx + 1}/${questions.length})`, en: `Quiz (${idx + 1}/${questions.length})` }, lang)}
        </button>
        <button type="button" class="subbar-tab ${modalTab === 'rules' ? 'active' : ''}" style="height:44px;" data-mtab="rules">
          📖 ${ui({ fr: `Règles à connaître (${duelSpanLabel})`, en: `Rules to Follow (${duelSpanLabel})` }, lang)}
        </button>
      </div>

      <div class="quiz-progress-track">
        <div class="quiz-progress-bar" style="width:${pct}%"></div>
      </div>

      <div class="modal-body">
        ${
          modalTab === 'rules'
            ? `
              ${renderBatchRulesPanel(batchDuelIds, lang)}
              <div style="margin-top:16px;display:flex;justify-content:flex-end;">
                <button class="btn-violet-pill" data-mtab="quiz">← ${ui({ fr: 'Revenir à la question', en: 'Back to Question' }, lang)}</button>
              </div>
            `
            : `
              <div class="quiz-sentence">${renderedSentence}</div>

              ${renderGuidanceSection({
                duelId: q.duelId,
                lang,
                showHint,
                showSearch,
                searchQuery: guideSearchQuery,
              })}

              <div class="options-grid">
                ${q.options
                  .map((opt, i) => {
                    let cls = 'opt-card';
                    if (answered) {
                      if (i === q.answer) cls += ' correct';
                      else if (i === chosen) cls += ' wrong';
                    }
                    return `
                      <button class="${cls}" data-popt="${i}" ${answered ? 'disabled' : ''}>
                        <span class="opt-index">${i + 1}</span>
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
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap;">
                    <strong>
                      ${isOk ? '✓ ' + ui({ fr: 'Bravo !', en: 'Correct!' }, lang) : '✗ ' + ui({ fr: 'Enregistré dans le Carnet d’erreurs', en: 'Saved to Error Log' }, lang)}
                    </strong>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <button class="circle-icon-btn" id="pack-speak" title="Listen">🔊</button>
                      <button class="btn-ghost-pill" style="padding:4px 11px;font-size:0.78em;" id="pack-open-duel">Duel #${q.duelId} →</button>
                    </div>
                  </div>
                  <div>${t(q.explanation, lang)}</div>
                  <div style="margin-top:12px;display:flex;justify-content:flex-end;">
                    <button class="btn-violet-pill" id="pack-next">
                      ${idx < questions.length - 1 ? ui({ fr: 'Suivante →', en: 'Next →' }, lang) : ui({ fr: 'Bilan →', en: 'Summary →' }, lang)}
                    </button>
                  </div>
                </div>
              `
                  : ''
              }
            `
        }
      </div>
    `;

    modalSheet.querySelector('#modal-close-btn')?.addEventListener('click', () => {
      closeModal();
      renderNav();
      renderSubbar();
      renderActiveView();
    });

    modalSheet.querySelectorAll('[data-mtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        modalTab = btn.dataset.mtab;
        renderModalQuiz();
      });
    });

    wireGuidanceEvents(modalSheet, {
      onToggleHint() {
        showHint = !showHint;
        if (showHint) showSearch = false;
        renderModalQuiz();
      },
      onToggleSearch() {
        showSearch = !showSearch;
        if (showSearch) showHint = false;
        renderModalQuiz(showSearch ? guideSearchQuery.length : null);
      },
      onSearchInput(val, pos) {
        guideSearchQuery = val;
        renderModalQuiz(pos);
      },
    });

    if (refocusSearchPos !== null) {
      const inp = modalSheet.querySelector('[data-guide-search-input]');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(refocusSearchPos, refocusSearchPos);
      }
    }

    modalSheet.querySelectorAll('[data-popt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (chosen !== null) return;
        chosen = Number(btn.dataset.popt);
        if (chosen === q.answer) {
          sessionScore += 1;
          if (!state.solvedPackIds.includes(q.id)) {
            state.solvedPackIds.push(q.id);
            saveState(state);
          }
        } else {
          recordError(state, {
            key: `pack_q${q.id}`,
            source: 'pack',
            refLabel: `N4 Pack Q${q.id}`,
            duelId: q.duelId,
            sentence: q.sentence,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation,
          });
          updateErrorBell();
        }
        renderModalQuiz();
      });
    });

    modalSheet.querySelector('#pack-speak')?.addEventListener('click', () => {
      speakJP(q.sentence.replace('（　）', q.options[q.answer]));
    });

    modalSheet.querySelector('#pack-open-duel')?.addEventListener('click', () => {
      closeModal();
      navigate('duels', { duelId: q.duelId });
    });

    modalSheet.querySelector('#pack-next')?.addEventListener('click', () => {
      idx += 1;
      chosen = null;
      showHint = false;
      showSearch = false;
      renderModalQuiz();
    });
  }

  modalBackdrop.classList.remove('hidden');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  renderModalQuiz();
}

const ctx = {
  state,
  navigate,
  openPackDrill,
  refreshBadges: updateErrorBell,
  refreshSubbar: renderSubbar,
  get globalQuery() {
    return globalQuery;
  },
  clearGlobalSearch() {
    globalQuery = '';
    if (searchInput) searchInput.value = '';
    hideGlobalSearchPopover();
  },
};

function navigate(tabId, opts = {}) {
  state.activeTab = tabId;
  saveState(state);
  if (tabId === 'duels') setDuelsFilter(opts);
  if (tabId === 'radar' && opts.radarTab) setRadarTab(opts.radarTab);
  hideGlobalSearchPopover();
  renderNav();
  renderSubbar();
  renderActiveView();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderActiveView() {
  switch (state.activeTab) {
    case 'conjugation':
      renderConjugation(viewRoot, ctx);
      break;
    case 'duels':
      renderDuels(viewRoot, ctx);
      break;
    case 'radar':
      renderRadar(viewRoot, ctx);
      break;
    case 'blitz':
      renderBlitz(viewRoot, ctx);
      break;
    case 'errors':
      renderErrors(viewRoot, ctx);
      break;
    case 'dashboard':
    default:
      renderDashboard(viewRoot, ctx);
      break;
  }
}

// Header & Subbar events
document.getElementById('brand-home')?.addEventListener('click', () => navigate('dashboard'));
document.getElementById('btn-blitz-cta')?.addEventListener('click', () => navigate('blitz'));
document.getElementById('btn-errors-bell')?.addEventListener('click', () => navigate('errors'));
document.getElementById('btn-golden-rule')?.addEventListener('click', openGoldenRuleModal);

// Footer shortcuts
document.getElementById('footer-golden-btn')?.addEventListener('click', openGoldenRuleModal);
document.getElementById('footer-blitz-btn')?.addEventListener('click', () => navigate('blitz'));
document.getElementById('footer-radar-btn')?.addEventListener('click', () => navigate('radar', { radarTab: 'noun' }));
document.getElementById('footer-errors-btn')?.addEventListener('click', () => navigate('errors'));

// One-click segmented pill controls
document.querySelectorAll('#textsize-toggle .pill-seg').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.textSize = btn.dataset.tsize;
    saveState(state);
    applyBodySettings();
  });
});

document.querySelectorAll('#furigana-toggle .pill-seg').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.furigana = btn.dataset.furi;
    saveState(state);
    applyBodySettings();
  });
});

document.querySelectorAll('#lang-toggle .pill-seg').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.lang = btn.dataset.lang;
    saveState(state);
    applyBodySettings();
    renderNav();
    renderSubbar();
    renderActiveView();
    if (globalQuery.trim()) renderGlobalSearchPopover();
  });
});

searchInput?.addEventListener('input', (e) => {
  globalQuery = e.target.value;
  renderActiveView();
  renderGlobalSearchPopover();
});

searchInput?.addEventListener('focus', () => {
  if (globalQuery.trim()) renderGlobalSearchPopover();
});

document.addEventListener('click', (e) => {
  const wrap = document.getElementById('global-search-wrap');
  if (wrap && !wrap.contains(e.target)) {
    hideGlobalSearchPopover();
  }
});

modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) {
    closeModal();
    renderNav();
    renderSubbar();
    renderActiveView();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideGlobalSearchPopover();
    if (!modalBackdrop.classList.contains('hidden')) {
      closeModal();
      renderNav();
      renderSubbar();
      renderActiveView();
    }
  }
});

// Boot
applyBodySettings();
renderNav();
renderSubbar();
renderActiveView();
