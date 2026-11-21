import { STUDY_PLAN, DAILY_ROUTINE } from '../data/schedule.js';
import { DUELS } from '../data/duels.js';
import { GRAMMAR_QUESTIONS } from '../data/grammarQuestions.js';
import {
  ui,
  t,
  getDaysRemaining,
  getTodayPlanBlock,
  getTodayDateKey,
  formatTime,
  saveState,
} from '../utils.js';

let sprintSeconds = 30 * 60;
let sprintRunning = false;
let sprintInterval = null;
let dashSubtab = 'today'; // 'today' | 'roadmap'

function stopTimer() {
  sprintRunning = false;
  if (sprintInterval) {
    clearInterval(sprintInterval);
    sprintInterval = null;
  }
}

export function getDashboardSubtabs(lang) {
  return [
    { id: 'today', label: ui({ fr: 'Aujourd’hui', en: 'Today' }, lang) },
    { id: 'roadmap', label: ui({ fr: 'Programme 15 jours', en: '15-Day Roadmap' }, lang) },
  ];
}

export function setDashboardSubtab(id) {
  dashSubtab = id || 'today';
}

export function getDashboardSubtab() {
  return dashSubtab;
}

const PLAN_GROUPS = [
  {
    id: 'week1',
    title: { fr: 'Phase 1 · Bases & Conditionnels (J-15 → J-10)', en: 'Phase 1 · Foundations & Conditionals (D-15 → D-10)' },
    blockIds: ['j15-14', 'j13-12', 'j11-10'],
  },
  {
    id: 'week2',
    title: { fr: 'Phase 2 · Temps, Nuances & Keigo (J-9 → J-5)', en: 'Phase 2 · Time, Nuances & Keigo (D-9 → D-5)' },
    blockIds: ['j9-8', 'j7-6', 'j5'],
  },
  {
    id: 'final',
    title: { fr: 'Phase 3 · Sprint final avant le 6 décembre (J-4 → J-1)', en: 'Phase 3 · Final Countdown to Dec 6 (D-4 → D-1)' },
    blockIds: ['j4', 'j3-2', 'j1'],
  },
];

export function renderDashboard(container, ctx) {
  const { state, navigate, openPackDrill, globalQuery } = ctx;
  const lang = state.lang;
  const daysLeft = getDaysRemaining();
  const todayBlock = getTodayPlanBlock(daysLeft);
  const todayKey = getTodayDateKey();
  const checks = state.dailyChecks[todayKey] || {};
  const activeErrors = state.errors.filter((e) => !e.mastered).length;
  const completedRoutineCount = DAILY_ROUTINE.filter((r) => checks[r.id]).length;

  const statStripHtml = `
    <div class="stat-strip">
      <div class="stat-cell">
        <div class="stat-kicker">${ui({ fr: 'Examen · 6 déc.', en: 'Exam · Dec 6' }, lang)}</div>
        <div class="stat-value is-brand">${lang === 'en' ? `D-${daysLeft}` : `J-${daysLeft}`}</div>
        <div class="stat-sub">${ui({ fr: `${daysLeft} jours restants`, en: `${daysLeft} days left` }, lang)}</div>
      </div>
      <div class="stat-cell">
        <div class="stat-kicker">${ui({ fr: 'Routine du jour', en: 'Today’s Routine' }, lang)}</div>
        <div class="stat-value">${completedRoutineCount} / ${DAILY_ROUTINE.length}</div>
        <div class="stat-sub">${ui({ fr: '30 min + 10 min écoute', en: '30m + 10m listening' }, lang)}</div>
      </div>
      <div class="stat-cell">
        <div class="stat-kicker">${ui({ fr: 'Duels maîtrisés', en: 'Duels Mastered' }, lang)}</div>
        <div class="stat-value">${state.masteredDuels.length} / ${DUELS.length}</div>
        <div class="stat-sub">${ui({ fr: 'Grammaire essentielle', en: 'Core N4 contrasts' }, lang)}</div>
      </div>
      <div class="stat-cell">
        <div class="stat-kicker">${ui({ fr: 'Cartes N4 Pack', en: 'N4 Pack Cards' }, lang)}</div>
        <div class="stat-value">${state.solvedPackIds.length} / ${GRAMMAR_QUESTIONS.length}</div>
        <div class="stat-sub">${activeErrors} ${ui({ fr: 'erreur(s) en attente', en: 'active error(s)' }, lang)}</div>
      </div>
    </div>
  `;

  const todayCardHtml = `
    <section class="section-group">
      <div class="section-header">
        <h2 class="section-title">
          ${ui({ fr: `Mission du jour · ${todayBlock.label.fr}`, en: `Today’s Mission · ${todayBlock.label.en}` }, lang)}
          <span class="section-subtitle">${todayBlock.dates}</span>
        </h2>
        <div class="section-filters">
          <button class="filter-pill-btn ${sprintSeconds === 600 ? 'active' : ''}" data-preset="600">10 min</button>
          <button class="filter-pill-btn ${sprintSeconds === 900 ? 'active' : ''}" data-preset="900">15 min</button>
          <button class="filter-pill-btn ${sprintSeconds === 1800 ? 'active' : ''}" data-preset="1800">30 min</button>
        </div>
      </div>

      <div class="flow-card">
        <div class="timer-strip">
          <div>
            <div class="cell-primary">${t(todayBlock.summary, lang)}</div>
            <div class="cell-sub">${t(todayBlock.packRef, lang, true)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <span class="timer-clock" id="sprint-timer-display">${formatTime(sprintSeconds)}</span>
            <button class="btn-violet-pill" id="btn-timer-toggle" style="min-width:104px;">
              ${sprintRunning ? '⏸ Pause' : '▶ Start'}
            </button>
            <button class="circle-icon-btn" id="btn-timer-reset" title="Reset">↺</button>
          </div>
        </div>

        ${DAILY_ROUTINE.map((item) => {
          const isDone = !!checks[item.id];
          return `
            <div class="flow-row">
              <div>
                <span class="pill-tag ${isDone ? '' : 'pill-tag-violet'}">${item.minutes} min</span>
              </div>
              <div>
                <div class="cell-primary">${ui(item.title, lang)}</div>
                <div class="cell-sub">${t(item.desc, lang, true)}</div>
              </div>
              <div>
                <div class="cell-primary" style="font-size:0.88em;color:var(--text-subtle);">
                  ${
                    item.id === 'duels' && todayBlock.qRange
                      ? `Q${todayBlock.qRange[0]}–Q${todayBlock.qRange[1]}`
                      : item.id === 'review'
                      ? `${activeErrors} ${ui({ fr: 'erreur(s)', en: 'error(s)' }, lang)}`
                      : ui({ fr: 'Quotidien', en: 'Daily' }, lang)
                  }
                </div>
                <div class="cell-sub">${ui({ fr: 'Étape', en: 'Step' }, lang)}</div>
              </div>
              <div class="row-actions">
                ${
                  isDone
                    ? `<button class="btn-mint-pill" data-toggle-routine="${item.id}">✓ ${ui({ fr: 'Fait', en: 'Done' }, lang)}</button>`
                    : `<button class="btn-violet-pill" data-routine-go="${item.id}">+ ${ui({ fr: 'Lancer', en: 'Start' }, lang)}</button>`
                }
                <button class="circle-icon-btn ${isDone ? 'is-active' : ''}" data-toggle-routine="${item.id}" title="Toggle done">✓</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;

  const q = (globalQuery || '').trim().toLowerCase();

  const roadmapHtml = PLAN_GROUPS.map((group) => {
    const blocks = group.blockIds
      .map((id) => STUDY_PLAN.find((b) => b.id === id))
      .filter((b) => {
        if (!b) return false;
        if (!q) return true;
        return `${b.label.fr} ${b.label.en} ${b.summary.fr} ${b.summary.en} ${b.packRef.fr} ${b.packRef.en} ${b.dates}`
          .toLowerCase()
          .includes(q);
      });

    if (blocks.length === 0) return '';

    return `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui(group.title, lang)}</h2>
        </div>

        <div class="flow-card">
          ${blocks
            .map((block) => {
              const isToday = block.id === todayBlock.id;
              const isDone = state.completedBlocks.includes(block.id);
              const qCount = block.qRange ? block.qRange[1] - block.qRange[0] + 1 : 0;
              const solvedInBlock = block.qRange
                ? GRAMMAR_QUESTIONS.filter(
                    (item) =>
                      item.id >= block.qRange[0] &&
                      item.id <= block.qRange[1] &&
                      state.solvedPackIds.includes(item.id)
                  ).length
                : 0;

              return `
                <div class="flow-row ${isToday ? 'is-today' : ''}">
                  <div>
                    <span class="pill-tag ${isToday ? 'pill-tag-violet' : ''}">
                      ${lang === 'en' ? block.label.en : block.label.fr}
                    </span>
                  </div>
                  <div>
                    <div class="cell-primary">${t(block.summary, lang)}</div>
                    <div class="cell-sub">${block.dates}${isToday ? ' · ' + ui({ fr: 'Aujourd’hui', en: 'Today' }, lang) : ''}</div>
                  </div>
                  <div>
                    <div class="cell-primary" style="font-size:0.88em;">
                      ${block.qRange ? `${solvedInBlock} / ${qCount} ${ui({ fr: 'cartes', en: 'cards' }, lang)}` : ui(block.packRef, lang)}
                    </div>
                    <div class="cell-sub">
                      ${block.qRange ? `Q${block.qRange[0]}–Q${block.qRange[1]}` : ui({ fr: 'Objectif', en: 'Milestone' }, lang)}
                    </div>
                  </div>
                  <div class="row-actions">
                    ${
                      isDone
                        ? `<button class="btn-mint-pill" data-toggle-block="${block.id}">✓ ${ui({ fr: 'Validé', en: 'Done' }, lang)}</button>`
                        : block.qRange
                        ? `<button class="btn-violet-pill" data-drill-range="${block.qRange[0]}-${block.qRange[1]}">+ Q${block.qRange[0]}–${block.qRange[1]}</button>`
                        : `<button class="btn-violet-pill" data-goto-tab="${block.recommendedTab}">+ ${ui({ fr: 'Ouvrir', en: 'Open' }, lang)}</button>`
                    }
                    ${
                      block.duels.length
                        ? `<button class="circle-icon-btn" data-open-duels="${block.id}" title="View linked duels">⚔</button>`
                        : ''
                    }
                    <button class="circle-icon-btn ${isDone ? 'is-active' : ''}" data-toggle-block="${block.id}" title="Mark day complete">✓</button>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </section>
    `;
  }).join('');

  const summaryHtml = `
    <div class="summary-bar">
      <div class="summary-left">
        <span>${ui({ fr: 'Progression globale :', en: 'Overall progress:' }, lang)}</span>
        <span><strong>${state.completedBlocks.length}/${STUDY_PLAN.length}</strong> ${ui({ fr: 'blocs complétés', en: 'plan blocks done' }, lang)}</span>
      </div>
      <div class="summary-right">
        <span class="summary-label">${ui({ fr: 'Compte à rebours :', en: 'Exam Countdown:' }, lang)}</span>
        <span class="summary-total">${lang === 'en' ? `D-${daysLeft}` : `J-${daysLeft}`}</span>
      </div>
    </div>
  `;

  container.innerHTML =
    dashSubtab === 'roadmap'
      ? `${roadmapHtml}${summaryHtml}`
      : `${statStripHtml}${todayCardHtml}${roadmapHtml}${summaryHtml}`;

  // Timer wiring
  const displayEl = container.querySelector('#sprint-timer-display');
  const toggleBtn = container.querySelector('#btn-timer-toggle');

  toggleBtn?.addEventListener('click', () => {
    if (sprintRunning) {
      stopTimer();
      toggleBtn.textContent = '▶ Start';
    } else {
      sprintRunning = true;
      toggleBtn.textContent = '⏸ Pause';
      sprintInterval = setInterval(() => {
        if (sprintSeconds > 0) {
          sprintSeconds -= 1;
          const live = document.getElementById('sprint-timer-display');
          if (live) live.textContent = formatTime(sprintSeconds);
        } else {
          stopTimer();
          const btn = document.getElementById('btn-timer-toggle');
          if (btn) btn.textContent = '▶ Start';
        }
      }, 1000);
    }
  });

  container.querySelector('#btn-timer-reset')?.addEventListener('click', () => {
    stopTimer();
    sprintSeconds = 30 * 60;
    if (displayEl) displayEl.textContent = formatTime(sprintSeconds);
    if (toggleBtn) toggleBtn.textContent = '▶ Start';
  });

  container.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      stopTimer();
      sprintSeconds = Number(btn.dataset.preset);
      renderDashboard(container, ctx);
    });
  });

  container.querySelectorAll('[data-toggle-routine]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toggleRoutine;
      if (!state.dailyChecks[todayKey]) state.dailyChecks[todayKey] = {};
      state.dailyChecks[todayKey][id] = !state.dailyChecks[todayKey][id];
      saveState(state);
      renderDashboard(container, ctx);
    });
  });

  container.querySelectorAll('[data-routine-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.routineGo;
      if (id === 'conj') navigate('conjugation');
      else if (id === 'duels' && todayBlock.qRange) {
        const [start, end] = todayBlock.qRange;
        const subset = GRAMMAR_QUESTIONS.filter((item) => item.id >= start && item.id <= end);
        openPackDrill(subset, {
          fr: `Cartes du jour (Q${start}–Q${end})`,
          en: `Today’s Cards (Q${start}–Q${end})`,
        });
      } else if (id === 'review') navigate('errors');
      else navigate('duels');
    });
  });

  container.querySelectorAll('[data-toggle-block]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toggleBlock;
      if (state.completedBlocks.includes(id)) {
        state.completedBlocks = state.completedBlocks.filter((b) => b !== id);
      } else {
        state.completedBlocks.push(id);
      }
      saveState(state);
      renderDashboard(container, ctx);
    });
  });

  container.querySelectorAll('[data-drill-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [start, end] = btn.dataset.drillRange.split('-').map(Number);
      const subset = GRAMMAR_QUESTIONS.filter((item) => item.id >= start && item.id <= end);
      openPackDrill(subset, {
        fr: `Livret · Cartes Q${start} à Q${end}`,
        en: `N4 Pack · Cards Q${start} to Q${end}`,
      });
    });
  });

  container.querySelectorAll('[data-open-duels]').forEach((btn) => {
    btn.addEventListener('click', () => navigate('duels', { dayFilter: btn.dataset.openDuels }));
  });

  container.querySelectorAll('[data-goto-tab]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.gotoTab));
  });
}
