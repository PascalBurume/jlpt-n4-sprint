import { getGuidanceForDuel, searchAllRules } from '../data/solverGuide.js';
import { ui, t, renderRuby, speakJP } from '../utils.js';

/**
 * Renders the expandable "How to Solve (Which Rule?)" + "Search Any Rule" helper block
 * that works inside Pack Q-Card Modals, Blitz Practice Mode, and Error Re-Drill.
 */
export function renderGuidanceSection({ duelId, lang, showHint, showSearch, searchQuery }) {
  const guide = getGuidanceForDuel(duelId);
  const results = showSearch ? searchAllRules(searchQuery) : [];

  return `
    <div class="guide-toolbar">
      <button type="button" class="guide-toggle-btn ${showHint ? 'active' : ''}" data-guide-action="toggle-hint">
        <span>💡</span>
        <span>${ui({ fr: 'Comment résoudre ? (Règle à suivre)', en: 'How to solve? (Which rule?)' }, lang)}</span>
      </button>
      <button type="button" class="guide-toggle-btn ${showSearch ? 'active' : ''}" data-guide-action="toggle-search">
        <span>🔍</span>
        <span>${ui({ fr: 'Chercher une règle', en: 'Search a rule' }, lang)}</span>
      </button>
    </div>

    ${
      showHint
        ? `
      <div class="guide-box">
        <div class="guide-box-head">
          <span class="pill-tag pill-tag-violet">Duel ${String(guide.duel.id).padStart(2, '0')}</span>
          <strong style="color:var(--text-strong);">${ui(guide.duel.title, lang)}</strong>
        </div>

        <div class="guide-step">
          <div class="guide-step-num">1</div>
          <div>
            <div class="guide-step-title">${ui({ fr: 'Cherche cet indice dans la phrase :', en: 'Spot this clue in the sentence:' }, lang)}</div>
            <div class="guide-step-body">${t(guide.clue, lang)}</div>
          </div>
        </div>

        <div class="guide-step">
          <div class="guide-step-num">2</div>
          <div style="flex:1;">
            <div class="guide-step-title">${ui({ fr: 'Compare ces formes (Règle du Duel) :', en: 'Compare these forms (Duel Rule):' }, lang)}</div>
            <div class="guide-mini-list">
              ${guide.duel.items
                .map(
                  (item) => `
                <div class="guide-mini-row">
                  <span class="guide-mini-form">${renderRuby(item.form)}</span>
                  <span class="guide-mini-meaning">${t({ fr: item.fr, en: item.en }, lang, true)}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="guide-step">
          <div class="guide-step-num">3</div>
          <div>
            <div class="guide-step-title">${ui({ fr: 'Formule rapide :', en: 'Quick formula:' }, lang)}</div>
            <div class="guide-step-body">${t(guide.formula, lang)}</div>
          </div>
        </div>
      </div>
    `
        : ''
    }

    ${
      showSearch
        ? `
      <div class="guide-search-box">
        <div class="guide-search-input-row">
          <input
            type="search"
            class="guide-search-input"
            data-guide-search-input
            placeholder="${ui({ fr: 'Tape un mot de la phrase (ex : しか, なさい, たら, ので, passif)…', en: 'Type a word from the sentence (e.g. しか, なさい, たら, ので, passive)…' }, lang)}"
            value="${(searchQuery || '').replace(/"/g, '&quot;')}"
          />
        </div>
        ${
          !searchQuery?.trim()
            ? `<div class="cell-sub" style="margin-top:8px;">
                ${ui({ fr: 'Suggestions rapides :', en: 'Quick lookups:' }, lang)}
                <div class="example-chips" style="margin-top:6px;margin-bottom:0;">
                  ${['しか', 'たら', 'ので', 'なさい', 'つもり', 'Nom', 'passif']
                    .map(
                      (kw) => `<button type="button" class="example-chip" data-guide-quick="${kw}">${kw}</button>`
                    )
                    .join('')}
                </div>
              </div>`
            : results.length === 0
            ? `<div class="cell-sub" style="margin-top:10px;">
                ${ui({ fr: 'Aucune règle trouvée pour ce mot. Essaie une particule ou un mot-clé (ex : たら, しか, passif).', en: 'No rule found. Try a particle or keyword (e.g. たら, しか, passive).' }, lang)}
              </div>`
            : `<div class="guide-search-results">
                ${results
                  .map(
                    (res) => `
                  <div class="guide-result-item">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
                      <span class="pill-tag pill-tag-violet">${renderRuby(res.badge)}</span>
                      <strong style="font-size:0.92em;color:var(--text-strong);">${t(res.title, lang, true)}</strong>
                    </div>
                    <div class="cell-jp" style="font-size:0.92em;color:var(--brand);margin-bottom:4px;">${renderRuby(res.preview)}</div>
                    <div style="font-size:0.86em;color:var(--text-subtle);">${t(res.rule, lang)}</div>
                  </div>
                `
                  )
                  .join('')}
              </div>`
        }
      </div>
    `
        : ''
    }
  `;
}

/**
 * Renders the "Study Rules for this Batch" tab inside the Pack Q-Card Drill Modal
 * (e.g., Duels 1–3 right alongside Q1–Q9!).
 */
export function renderBatchRulesPanel(duelIds, lang) {
  const uniqueIds = [...new Set(duelIds)].sort((a, b) => a - b);
  return `
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${uniqueIds
        .map((id) => {
          const g = getGuidanceForDuel(id);
          return `
            <div class="flow-card" style="box-shadow:none;">
              <div style="padding:14px 18px;border-bottom:1px solid var(--border);background:#fafbfe;display:flex;align-items:center;gap:10px;">
                <span class="pill-tag pill-tag-violet">Duel ${String(g.duel.id).padStart(2, '0')}</span>
                <strong style="color:var(--text-strong);">${ui(g.duel.title, lang)}</strong>
              </div>
              <div style="padding:14px 18px;">
                <div class="soft-note" style="margin-bottom:10px;">
                  <strong>${ui({ fr: 'Comment repérer :', en: 'How to spot:' }, lang)}</strong>
                  ${t(g.clue, lang)}
                </div>
                <div class="guide-mini-list" style="margin-bottom:10px;">
                  ${g.duel.items
                    .map(
                      (item) => `
                    <div class="guide-mini-row">
                      <span class="guide-mini-form">${renderRuby(item.form)}</span>
                      <span class="guide-mini-meaning">${t({ fr: item.fr, en: item.en }, lang, true)}</span>
                    </div>
                  `
                    )
                    .join('')}
                </div>
                <div class="example-chips" style="margin-bottom:10px;">
                  ${g.duel.examples
                    .map(
                      (ex) => `<button type="button" class="example-chip" data-batch-speak="${ex}">🔊 ${renderRuby(ex)}</button>`
                    )
                    .join('')}
                </div>
                <div class="trap-note">
                  <strong>⚠️ ${ui({ fr: 'Formule & Piège :', en: 'Formula & Trap:' }, lang)}</strong>
                  ${t(g.formula, lang)}
                </div>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

export function wireGuidanceEvents(root, { onToggleHint, onToggleSearch, onSearchInput }) {
  root.querySelector('[data-guide-action="toggle-hint"]')?.addEventListener('click', onToggleHint);
  root.querySelector('[data-guide-action="toggle-search"]')?.addEventListener('click', onToggleSearch);

  const input = root.querySelector('[data-guide-search-input]');
  if (input) {
    input.addEventListener('input', (e) => {
      onSearchInput(e.target.value, e.target.selectionStart);
    });
  }

  root.querySelectorAll('[data-guide-quick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      onSearchInput(btn.dataset.guideQuick, btn.dataset.guideQuick.length);
    });
  });

  root.querySelectorAll('[data-batch-speak]').forEach((btn) => {
    btn.addEventListener('click', () => speakJP(btn.dataset.batchSpeak));
  });
}
