import { DUELS } from '../data/duels.js';
import { GRAMMAR_QUESTIONS } from '../data/grammarQuestions.js';
import { ui, t, renderRuby, speakJP, saveState } from '../utils.js';

let statusSubtab = 'all'; // 'all' | 'review' | 'mastered'
let dayFilter = 'all';
let expandedDuels = new Set([1]);
let scrollTargetDuel = null;

export function getDuelsSubtabs(lang, state) {
  const mastered = state.masteredDuels.length;
  const remaining = DUELS.length - mastered;
  return [
    { id: 'all', label: ui({ fr: 'Tous les duels', en: 'All Duels' }, lang), count: DUELS.length },
    { id: 'review', label: ui({ fr: 'À travailler', en: 'To Review' }, lang), count: remaining },
    { id: 'mastered', label: ui({ fr: 'Maîtrisés', en: 'Mastered' }, lang), count: mastered },
  ];
}

export function setDuelsSubtab(id) {
  statusSubtab = id || 'all';
}

export function getDuelsSubtab() {
  return statusSubtab;
}

export function setDuelsFilter(opts = {}) {
  if (opts.dayFilter) {
    dayFilter = opts.dayFilter;
    statusSubtab = 'all';
  }
  if (opts.duelId) {
    dayFilter = 'all';
    statusSubtab = 'all';
    expandedDuels.add(opts.duelId);
    scrollTargetDuel = opts.duelId;
  }
}

const DUEL_GROUPS = [
  { id: 'j15-14', short: 'J-15/14', title: { fr: 'J-15, J-14 · Voix verbales, Volitif & Ordres', en: 'D-15, D-14 · Verb Voices, Volitional & Commands' } },
  { id: 'j13-12', short: 'J-13/12', title: { fr: 'J-13, J-12 · Forme て, Donner/Recevoir & Obligation', en: 'D-13, D-12 · て-Form, Giving/Receiving & Obligation' } },
  { id: 'j11-10', short: 'J-11/10', title: { fr: 'J-11, J-10 · Liaisons négatives & Conditionnels', en: 'D-11, D-10 · Negative Links & Conditionals' } },
  { id: 'j9-8', short: 'J-9/8', title: { fr: 'J-9, J-8 · Temps, Apparence & Ouï-dire', en: 'D-9, D-8 · Time, Appearance & Hearsay' } },
  { id: 'j7-6', short: 'J-7/6', title: { fr: 'J-7, J-6 · Projets, Raisons & Nominalisation', en: 'D-7, D-6 · Plans, Reasons & Nominalizers' } },
  { id: 'j5', short: 'J-5', title: { fr: 'J-5 · Suffixes, Quantités & Politesse (Keigo)', en: 'D-5 · Suffixes, Quantities & Keigo' } },
];

export function renderDuels(container, ctx) {
  const { state, openPackDrill, globalQuery } = ctx;
  const lang = state.lang;
  const q = (globalQuery || '').trim().toLowerCase();

  const matchesDuel = (d) => {
    const isMastered = state.masteredDuels.includes(d.id);
    if (statusSubtab === 'review' && isMastered) return false;
    if (statusSubtab === 'mastered' && !isMastered) return false;
    if (dayFilter !== 'all' && d.dayId !== dayFilter) return false;
    if (q) {
      const hay = [
        String(d.id),
        d.title.fr,
        d.title.en,
        d.trap.fr,
        d.trap.en,
        ...d.items.map((i) => `${i.form} ${i.fr} ${i.en}`),
        ...d.examples,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const visibleDuels = DUELS.filter(matchesDuel);
  const allExpanded = visibleDuels.length > 0 && visibleDuels.every((d) => expandedDuels.has(d.id));

  const topFilterBar = `
    <div class="section-header" style="margin-bottom:20px;">
      <div class="section-filters">
        <button class="filter-pill-btn ${dayFilter === 'all' ? 'active' : ''}" data-day-pill="all">
          ${ui({ fr: 'Tous les jours', en: 'All Days' }, lang)}
        </button>
        ${DUEL_GROUPS.map(
          (g) => `
          <button class="filter-pill-btn ${dayFilter === g.id ? 'active' : ''}" data-day-pill="${g.id}">
            ${lang === 'en' ? g.short.replace('J', 'D') : g.short}
          </button>
        `
        ).join('')}
      </div>
      <button class="btn-ghost-pill" id="btn-toggle-all-duels">
        ${allExpanded ? ui({ fr: 'Tout replier', en: 'Collapse All' }, lang) : ui({ fr: 'Tout déplier', en: 'Expand All' }, lang)}
      </button>
    </div>
  `;

  const groupsHtml = DUEL_GROUPS.map((grp) => {
    const list = DUELS.filter((d) => d.dayId === grp.id && matchesDuel(d));
    if (list.length === 0) return '';

    return `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">
            ${ui(grp.title, lang)}
            <span class="section-subtitle">(${list.length})</span>
          </h2>
        </div>

        <div class="flow-card">
          ${list
            .map((duel) => {
              const isMastered = state.masteredDuels.includes(duel.id);
              const isOpen = expandedDuels.has(duel.id);
              const linkedQs = GRAMMAR_QUESTIONS.filter((item) => item.duelId === duel.id);
              const solvedCount = linkedQs.filter((item) => state.solvedPackIds.includes(item.id)).length;
              const previewForms = duel.items
                .slice(0, 4)
                .map((i) => i.form.replace(/\[[^\]]+\]/g, ''))
                .join(' · ');

              return `
                <div id="duel-row-${duel.id}">
                  <div class="flow-row" style="cursor:pointer;" data-toggle-expand="${duel.id}">
                    <div>
                      <span class="pill-tag ${isOpen ? 'pill-tag-violet' : ''}">
                        Duel ${String(duel.id).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <div class="cell-primary">${ui(duel.title, lang)}</div>
                      <div class="cell-sub">${duel.qRange} · ${solvedCount}/${linkedQs.length} ${ui({ fr: 'cartes', en: 'cards' }, lang)}</div>
                    </div>
                    <div>
                      <div class="cell-jp" style="color:var(--brand);">${previewForms}</div>
                      <div class="cell-sub">${isOpen ? ui({ fr: 'Replier le détail', en: 'Collapse details' }, lang) : ui({ fr: 'Cliquer pour étudier', en: 'Click to study' }, lang)}</div>
                    </div>
                    <div class="row-actions" data-stop-prop="true">
                      ${
                        isMastered
                          ? `<button class="btn-mint-pill" data-drill-duel="${duel.id}">✓ ${ui({ fr: 'Maîtrisé', en: 'Mastered' }, lang)}</button>`
                          : `<button class="btn-violet-pill" data-drill-duel="${duel.id}">+ ${ui({ fr: `Quiz (${linkedQs.length} Q)`, en: `Drill (${linkedQs.length} Q)` }, lang)}</button>`
                      }
                      <button class="circle-icon-btn ${isMastered ? 'is-active' : ''}" data-master-duel="${duel.id}" title="Toggle mastered">✓</button>
                      <button class="circle-icon-btn" data-toggle-expand="${duel.id}" title="Expand">${isOpen ? '▴' : '▾'}</button>
                    </div>
                  </div>

                  ${
                    isOpen
                      ? `
                    <div class="duel-expand-panel">
                      <div class="duel-compare-grid">
                        ${duel.items
                          .map(
                            (item) => `
                          <div class="duel-compare-row">
                            <div class="duel-compare-form">${renderRuby(item.form)}</div>
                            <div>${t({ fr: item.fr, en: item.en }, lang)}</div>
                          </div>
                        `
                          )
                          .join('')}
                      </div>

                      <div class="example-chips">
                        ${duel.examples
                          .map(
                            (ex) => `
                          <button class="example-chip" data-speak="${ex}" title="Listen in Japanese">
                            <span>🔊</span>
                            <span>${renderRuby(ex)}</span>
                          </button>
                        `
                          )
                          .join('')}
                      </div>

                      <div class="trap-note">
                        <strong>⚠️ ${ui({ fr: 'Piège N4 :', en: 'N4 Trap:' }, lang)}</strong>
                        ${t(duel.trap, lang)}
                      </div>
                    </div>
                  `
                      : ''
                  }
                </div>
              `;
            })
            .join('')}
        </div>
      </section>
    `;
  }).join('');

  container.innerHTML = `
    ${topFilterBar}
    ${
      visibleDuels.length === 0
        ? `<div class="flow-card flow-card-pad" style="text-align:center;color:var(--text-muted);padding:42px;">
            ${ui({ fr: 'Aucun duel ne correspond à ce filtre.', en: 'No duels match this filter.' }, lang)}
            <div style="margin-top:12px;">
              <button class="btn-ghost-pill" data-reset-duels>${ui({ fr: 'Réinitialiser', en: 'Reset Filters' }, lang)}</button>
            </div>
          </div>`
        : groupsHtml
    }

    <div class="summary-bar">
      <div class="summary-left">
        <span>${ui({ fr: 'Clique sur n’importe quel duel pour comparer les formes et écouter les exemples.', en: 'Click any duel row to expand the comparison table & Japanese audio.' }, lang)}</span>
      </div>
      <div class="summary-right">
        <span class="summary-label">${ui({ fr: 'Duels maîtrisés :', en: 'Duels Mastered:' }, lang)}</span>
        <span class="summary-total">${state.masteredDuels.length} / ${DUELS.length}</span>
      </div>
    </div>
  `;

  if (scrollTargetDuel) {
    const el = container.querySelector(`#duel-row-${scrollTargetDuel}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    scrollTargetDuel = null;
  }

  container.querySelector('#btn-toggle-all-duels')?.addEventListener('click', () => {
    if (allExpanded) {
      visibleDuels.forEach((d) => expandedDuels.delete(d.id));
    } else {
      visibleDuels.forEach((d) => expandedDuels.add(d.id));
    }
    renderDuels(container, ctx);
  });

  container.querySelectorAll('[data-stop-prop]').forEach((el) => {
    el.addEventListener('click', (e) => e.stopPropagation());
  });

  container.querySelectorAll('[data-toggle-expand]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(el.dataset.toggleExpand);
      if (expandedDuels.has(id)) expandedDuels.delete(id);
      else expandedDuels.add(id);
      renderDuels(container, ctx);
    });
  });

  container.querySelectorAll('[data-day-pill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      dayFilter = btn.dataset.dayPill;
      renderDuels(container, ctx);
    });
  });

  container.querySelector('[data-reset-duels]')?.addEventListener('click', () => {
    dayFilter = 'all';
    statusSubtab = 'all';
    ctx.clearGlobalSearch?.();
    renderDuels(container, ctx);
  });

  container.querySelectorAll('[data-master-duel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.masterDuel);
      if (state.masteredDuels.includes(id)) {
        state.masteredDuels = state.masteredDuels.filter((x) => x !== id);
      } else {
        state.masteredDuels.push(id);
      }
      saveState(state);
      ctx.refreshSubbar?.();
      renderDuels(container, ctx);
    });
  });

  container.querySelectorAll('[data-drill-duel]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.drillDuel);
      const duel = DUELS.find((d) => d.id === id);
      const qs = GRAMMAR_QUESTIONS.filter((item) => item.duelId === id);
      openPackDrill(qs, {
        fr: `Duel ${id} · ${duel.title.fr}`,
        en: `Duel ${id} · ${duel.title.en}`,
      });
    });
  });

  container.querySelectorAll('[data-speak]').forEach((btn) => {
    btn.addEventListener('click', () => speakJP(btn.dataset.speak));
  });
}
