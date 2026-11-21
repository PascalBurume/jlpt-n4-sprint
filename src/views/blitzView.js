import { BLITZ_TEST } from '../data/blitzTest.js';
import { GRAMMAR_QUESTIONS } from '../data/grammarQuestions.js';
import { renderGuidanceSection, wireGuidanceEvents } from '../components/guidanceWidget.js';
import {
  ui,
  t,
  renderRuby,
  speakJP,
  formatTime,
  recordError,
  saveState,
  shuffle,
} from '../utils.js';

let blitzSubtab = 'test'; // 'test' | 'history'
let phase = 'intro'; // 'intro' | 'running' | 'result'
let bank = 'blitz'; // 'blitz' | 'pack'
let selectedSize = 32; // 10 | 20 | 32 | 50
let mode = 'exam'; // 'exam' | 'practice'
let activeQuestions = [];
let qIndex = 0;
let answers = {};
let totalSeconds = 0;
let qSeconds = 0;
let timerHandle = null;
let resultFilter = 'wrong';
let showBlitzHint = false;
let showBlitzSearch = false;
let blitzGuideQuery = '';

export function getBlitzSubtabs(lang, state) {
  return [
    { id: 'test', label: ui({ fr: 'Configurer un test', en: 'Configure Test' }, lang) },
    { id: 'history', label: ui({ fr: 'Historique', en: 'Past Attempts' }, lang), count: state.blitzHistory.length },
  ];
}

export function setBlitzSubtab(id) {
  blitzSubtab = id || 'test';
  if (blitzSubtab === 'history') stopBlitzTimer();
}

export function getBlitzSubtab() {
  return blitzSubtab;
}

function stopBlitzTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function startBlitzTimer() {
  stopBlitzTimer();
  timerHandle = setInterval(() => {
    totalSeconds += 1;
    qSeconds += 1;
    const totalEl = document.getElementById('blitz-total-clock');
    const qEl = document.getElementById('blitz-q-clock');
    if (totalEl) totalEl.textContent = formatTime(totalSeconds);
    if (qEl) {
      qEl.textContent = `${formatTime(qSeconds)} / 01:00`;
      qEl.classList.toggle('pace-warn', qSeconds > 60);
    }
  }, 1000);
}

function formatSentenceWithBlank(sentence, fillHtml = '___') {
  const rendered = renderRuby(sentence);
  const slot = `<span class="blank-slot">${fillHtml}</span>`;
  if (rendered.includes('___')) return rendered.replace('___', slot);
  if (rendered.includes('（　）')) return rendered.replace('（　）', slot);
  return rendered;
}

function finishBlitz(ctx) {
  stopBlitzTimer();
  const { state, refreshBadges } = ctx;
  let score = 0;
  activeQuestions.forEach((q) => {
    const chosen = answers[q.uid];
    if (chosen === q.answer) {
      score += 1;
    } else {
      recordError(state, {
        key: q.uid,
        source: bank,
        refLabel: bank === 'blitz' ? `Test éclair #${q.id}` : `N4 Pack Q${q.id}`,
        duelId: q.duelId,
        sentence: q.sentence,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
      });
    }
  });
  state.blitzHistory.unshift({
    date: new Date().toLocaleDateString(),
    score,
    total: activeQuestions.length,
    seconds: totalSeconds,
    mode,
    bank,
  });
  state.blitzHistory = state.blitzHistory.slice(0, 15);
  saveState(state);
  refreshBadges();
  phase = 'result';
  resultFilter = score === activeQuestions.length ? 'all' : 'wrong';
}

export function renderBlitz(container, ctx) {
  const { state, navigate } = ctx;
  const lang = state.lang;

  if (blitzSubtab === 'history') {
    container.innerHTML = `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui({ fr: 'Historique de tes tests', en: 'Past Test Attempts' }, lang)}</h2>
          <button class="btn-violet-pill" id="hist-start-new">+ ${ui({ fr: 'Nouveau test', en: 'New Test' }, lang)}</button>
        </div>

        <div class="flow-card">
          ${
            state.blitzHistory.length === 0
              ? `<div class="flow-card-pad" style="text-align:center;color:var(--text-muted);">
                  ${ui({ fr: 'Aucun test terminé pour le moment.', en: 'No completed attempts yet.' }, lang)}
                </div>`
              : state.blitzHistory
                  .map((h, idx) => {
                    const pct = Math.round((h.score / h.total) * 100);
                    return `
                      <div class="flow-row">
                        <div><span class="pill-tag">#${state.blitzHistory.length - idx}</span></div>
                        <div>
                          <div class="cell-primary">
                            ${h.bank === 'pack' ? 'N4 Pack' : 'Test éclair'} · ${h.total} Q
                          </div>
                          <div class="cell-sub">${h.date} · ${h.mode === 'exam' ? ui({ fr: 'Examen', en: 'Exam' }, lang) : ui({ fr: 'Entraînement', en: 'Practice' }, lang)}</div>
                        </div>
                        <div>
                          <div class="cell-primary">${h.score} / ${h.total} (${pct}%)</div>
                          <div class="cell-sub">⏱ ${formatTime(h.seconds)}</div>
                        </div>
                        <div class="row-actions">
                          <span class="${pct >= 85 ? 'btn-mint-pill' : 'pill-tag pill-tag-amber'}">
                            ${pct >= 85 ? '✓ ' + ui({ fr: 'Prêt !', en: 'Ready!' }, lang) : ui({ fr: 'À revoir', en: 'Review' }, lang)}
                          </span>
                        </div>
                      </div>
                    `;
                  })
                  .join('')
          }
        </div>
      </section>
    `;
    container.querySelector('#hist-start-new')?.addEventListener('click', () => {
      blitzSubtab = 'test';
      phase = 'intro';
      ctx.refreshSubbar?.();
      renderBlitz(container, ctx);
    });
    return;
  }

  if (phase === 'intro') {
    stopBlitzTimer();
    const sizeChoices =
      bank === 'blitz'
        ? [
            { n: 10, lbl: { fr: 'Express · ~8 min', en: 'Express · ~8 min' } },
            { n: 20, lbl: { fr: 'Moyen · ~18 min', en: 'Medium · ~18 min' } },
            { n: 32, lbl: { fr: 'Complet J-4 · 32 Q', en: 'Full D-4 · 32 Q' } },
          ]
        : [
            { n: 10, lbl: { fr: 'Express · ~8 min', en: 'Express · ~8 min' } },
            { n: 20, lbl: { fr: 'Standard · ~18 min', en: 'Standard · ~18 min' } },
            { n: 32, lbl: { fr: 'Simul. N4 · ~30 min', en: 'N4 Sim · ~30 min' } },
            { n: 50, lbl: { fr: 'Endurance · 50 Q', en: 'Endurance · 50 Q' } },
          ];

    if (!sizeChoices.some((s) => s.n === selectedSize)) {
      selectedSize = sizeChoices[sizeChoices.length - 1].n;
    }

    container.innerHTML = `
      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui({ fr: '1. Choisis la banque de questions & la taille du test', en: '1. Choose Question Bank & Test Size' }, lang)}</h2>
          <div class="section-filters">
            <button class="filter-pill-btn ${bank === 'blitz' ? 'active' : ''}" data-bank="blitz">
              ${ui({ fr: 'Test éclair (32 Q)', en: 'Blitz Test (32 Q)' }, lang)}
            </button>
            <button class="filter-pill-btn ${bank === 'pack' ? 'active' : ''}" data-bank="pack">
              ${ui({ fr: 'Grand Livret N4 (106 Q)', en: 'N4 Pack Bank (106 Q)' }, lang)}
            </button>
          </div>
        </div>

        <div class="flow-card flow-card-pad">
          <div class="cell-sub" style="margin-bottom:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">
            ${ui({ fr: 'Taille du test (nombre de questions)', en: 'Test Size (Number of Questions)' }, lang)}
          </div>
          <div class="test-size-grid" style="grid-template-columns:repeat(${sizeChoices.length}, minmax(0, 1fr));">
            ${sizeChoices
              .map(
                (s) => `
              <button class="size-option-btn ${selectedSize === s.n ? 'active' : ''}" data-tsize-opt="${s.n}">
                <div class="size-option-num">${s.n} Q</div>
                <div class="size-option-lbl">${ui(s.lbl, lang)}</div>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      </section>

      <section class="section-group">
        <div class="section-header">
          <h2 class="section-title">${ui({ fr: '2. Lance ta session', en: '2. Launch Your Session' }, lang)}</h2>
        </div>

        <div class="flow-card">
          <div class="flow-row">
            <div><span class="pill-tag pill-tag-violet">${selectedSize} Q · Exam</span></div>
            <div>
              <div class="cell-primary">${ui({ fr: 'Mode Examen (Sans regarder les pages)', en: 'Exam Mode (Closed-book)' }, lang)}</div>
              <div class="cell-sub">${t({ fr: 'Rythme 1 min/question, corrigé détaillé et score à la fin.', en: '1 min/question pace clock, full review & verdict at the end.' }, lang, true)}</div>
            </div>
            <div>
              <div class="cell-primary">~${selectedSize} min</div>
              <div class="cell-sub">${ui({ fr: 'Conditions JLPT', en: 'Real JLPT pace' }, lang)}</div>
            </div>
            <div class="row-actions">
              <button class="btn-violet-pill" id="start-exam-mode">+ ${ui({ fr: `Examen (${selectedSize} Q)`, en: `Start (${selectedSize} Q)` }, lang)}</button>
            </div>
          </div>

          <div class="flow-row">
            <div><span class="pill-tag">${selectedSize} Q · Libre</span></div>
            <div>
              <div class="cell-primary">${ui({ fr: 'Mode Entraînement (Corrigé immédiat)', en: 'Practice Mode (Instant Feedback)' }, lang)}</div>
              <div class="cell-sub">${t({ fr: 'Explication bilingue + audio japonais immédiatement après chaque réponse.', en: 'Bilingual explanation & Japanese audio right after each answer.' }, lang, true)}</div>
            </div>
            <div>
              <div class="cell-primary">${ui({ fr: 'Libre', en: 'Untimed' }, lang)}</div>
              <div class="cell-sub">${ui({ fr: 'Idéal pour apprendre', en: 'Best for learning' }, lang)}</div>
            </div>
            <div class="row-actions">
              <button class="btn-ghost-pill" id="start-practice-mode">${ui({ fr: `Entraînement (${selectedSize} Q)`, en: `Practice (${selectedSize} Q)` }, lang)} →</button>
            </div>
          </div>
        </div>
      </section>

      <div class="summary-bar">
        <div class="summary-left">
          <span><strong>85%+ (28/32)</strong> ${ui({ fr: 'Tu es prêt !', en: 'Ready!' }, lang)}</span>
          <span>·</span>
          <span><strong>70–84% (22–27)</strong> ${ui({ fr: 'Relis les duels manqués', en: 'Review missed duels' }, lang)}</span>
          <span>·</span>
          <span><strong>&lt;70%</strong> ${ui({ fr: 'Refais les cartes Q', en: 'Redo Pack cards' }, lang)}</span>
        </div>
        <div class="summary-right">
          <span class="summary-label">${ui({ fr: 'Taille choisie :', en: 'Selected Size:' }, lang)}</span>
          <span class="summary-total">${selectedSize} Q</span>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-bank]').forEach((btn) => {
      btn.addEventListener('click', () => {
        bank = btn.dataset.bank;
        selectedSize = bank === 'blitz' ? 32 : 20;
        renderBlitz(container, ctx);
      });
    });

    container.querySelectorAll('[data-tsize-opt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedSize = Number(btn.dataset.tsizeOpt);
        renderBlitz(container, ctx);
      });
    });

    const launch = (selectedMode) => {
      mode = selectedMode;
      const source =
        bank === 'blitz'
          ? BLITZ_TEST.map((item) => ({ ...item, uid: `blitz_${item.id}` }))
          : GRAMMAR_QUESTIONS.map((item) => ({ ...item, uid: `pack_q${item.id}` }));

      // Keep exact sequential order if taking Full 32Q Blitz Test; shuffle for smaller/pack quizzes
      activeQuestions =
        bank === 'blitz' && selectedSize === 32
          ? source
          : shuffle(source).slice(0, selectedSize);

      qIndex = 0;
      answers = {};
      totalSeconds = 0;
      qSeconds = 0;
      phase = 'running';
      startBlitzTimer();
      renderBlitz(container, ctx);
    };

    container.querySelector('#start-exam-mode')?.addEventListener('click', () => launch('exam'));
    container.querySelector('#start-practice-mode')?.addEventListener('click', () => launch('practice'));
    return;
  }

  if (phase === 'running') {
    const q = activeQuestions[qIndex];
    const chosen = answers[q.uid];
    const hasAnswered = chosen !== undefined;
    const pct = Math.round(((qIndex + 1) / activeQuestions.length) * 100);

    const fillText =
      hasAnswered && mode === 'practice'
        ? renderRuby(q.options[q.answer])
        : hasAnswered
        ? renderRuby(q.options[chosen])
        : '　　';

    container.innerHTML = `
      <div class="quiz-studio">
        <div class="section-header">
          <h2 class="section-title">
            Question ${qIndex + 1} / ${activeQuestions.length}
            <span class="section-subtitle">${bank === 'blitz' ? 'Test éclair' : 'N4 Pack'} · ${mode === 'exam' ? 'Exam' : 'Practice'}</span>
          </h2>
          <div class="section-filters" style="font-size:0.86em;color:var(--text-subtle);">
            <span id="blitz-q-clock" class="${qSeconds > 60 ? 'pace-warn' : ''}">${formatTime(qSeconds)} / 01:00</span>
            <span>·</span>
            <span>⏱ <span id="blitz-total-clock">${formatTime(totalSeconds)}</span></span>
          </div>
        </div>

        <div class="flow-card">
          <div class="quiz-progress-track">
            <div class="quiz-progress-bar" style="width:${pct}%"></div>
          </div>

          <div class="flow-card-pad">
            <div class="quiz-sentence">${formatSentenceWithBlank(q.sentence, fillText)}</div>

            ${
              mode === 'practice'
                ? renderGuidanceSection({
                    duelId: q.duelId,
                    lang,
                    showHint: showBlitzHint,
                    showSearch: showBlitzSearch,
                    searchQuery: blitzGuideQuery,
                  })
                : ''
            }

            <div class="options-grid">
              ${q.options
                .map((opt, idx) => {
                  let cls = 'opt-card';
                  if (mode === 'practice' && hasAnswered) {
                    if (idx === q.answer) cls += ' correct';
                    else if (idx === chosen) cls += ' wrong';
                  } else if (chosen === idx) {
                    cls += ' selected';
                  }
                  return `
                    <button class="${cls}" data-bopt="${idx}" ${mode === 'practice' && hasAnswered ? 'disabled' : ''}>
                      <span class="opt-index">${idx + 1}</span>
                      <span>${renderRuby(opt)}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>

            ${
              mode === 'practice' && hasAnswered
                ? `
              <div class="feedback-banner ${chosen === q.answer ? 'ok' : 'err'}">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:5px;">
                  <strong>
                    ${chosen === q.answer ? '✓ ' + ui({ fr: 'Correct !', en: 'Correct!' }, lang) : '✗ ' + ui({ fr: 'Réponse :', en: 'Answer:' }, lang) + ' ' + renderRuby(q.options[q.answer])}
                  </strong>
                  <button class="circle-icon-btn" id="blitz-speak-full" title="Listen">🔊</button>
                </div>
                <div>${t(q.explanation, lang)}</div>
              </div>
            `
                : ''
            }

            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:24px;flex-wrap:wrap;">
              <button class="btn-ghost-pill" id="blitz-quit">✕ ${ui({ fr: 'Quitter', en: 'Quit' }, lang)}</button>
              <div style="display:flex;gap:8px;">
                ${
                  qIndex > 0 && mode === 'exam'
                    ? `<button class="btn-ghost-pill" id="blitz-prev">← ${ui({ fr: 'Précédent', en: 'Back' }, lang)}</button>`
                    : ''
                }
                ${
                  qIndex < activeQuestions.length - 1
                    ? `<button class="btn-violet-pill" id="blitz-next" ${!hasAnswered ? 'disabled' : ''}>${ui({ fr: 'Suivant →', en: 'Next →' }, lang)}</button>`
                    : `<button class="btn-violet-pill" id="blitz-finish" ${!hasAnswered ? 'disabled' : ''}>✓ ${ui({ fr: 'Terminer', en: 'Finish' }, lang)}</button>`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-bopt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        answers[q.uid] = Number(btn.dataset.bopt);
        renderBlitz(container, ctx);
      });
    });

    if (mode === 'practice') {
      wireGuidanceEvents(container, {
        onToggleHint() {
          showBlitzHint = !showBlitzHint;
          if (showBlitzHint) showBlitzSearch = false;
          renderBlitz(container, ctx);
        },
        onToggleSearch() {
          showBlitzSearch = !showBlitzSearch;
          if (showBlitzSearch) showBlitzHint = false;
          renderBlitz(container, ctx);
          if (showBlitzSearch) container.querySelector('[data-guide-search-input]')?.focus();
        },
        onSearchInput(val, pos) {
          blitzGuideQuery = val;
          renderBlitz(container, ctx);
          const inp = container.querySelector('[data-guide-search-input]');
          if (inp) {
            inp.focus();
            inp.setSelectionRange(pos, pos);
          }
        },
      });
    }

    container.querySelector('#blitz-speak-full')?.addEventListener('click', () => {
      speakJP(q.sentence.replace('___', q.options[q.answer]).replace('（　）', q.options[q.answer]));
    });

    container.querySelector('#blitz-quit')?.addEventListener('click', () => {
      stopBlitzTimer();
      showBlitzHint = false;
      showBlitzSearch = false;
      phase = 'intro';
      renderBlitz(container, ctx);
    });

    container.querySelector('#blitz-prev')?.addEventListener('click', () => {
      if (qIndex > 0) {
        qIndex -= 1;
        qSeconds = 0;
        showBlitzHint = false;
        showBlitzSearch = false;
        renderBlitz(container, ctx);
      }
    });

    container.querySelector('#blitz-next')?.addEventListener('click', () => {
      if (qIndex < activeQuestions.length - 1) {
        qIndex += 1;
        qSeconds = 0;
        showBlitzHint = false;
        showBlitzSearch = false;
        renderBlitz(container, ctx);
      }
    });

    container.querySelector('#blitz-finish')?.addEventListener('click', () => {
      finishBlitz(ctx);
      renderBlitz(container, ctx);
    });
    return;
  }

  // Results screen
  const score = activeQuestions.filter((q) => answers[q.uid] === q.answer).length;
  const pct = Math.round((score / activeQuestions.length) * 100);
  const wrongList = activeQuestions.filter((q) => answers[q.uid] !== q.answer);
  const verdictMsg =
    pct >= 85
      ? { fr: 'Excellent score : tu es prêt pour le N4 !', en: 'Great score: you are ready for N4!' }
      : pct >= 68
      ? { fr: 'Bon niveau : relis les duels de tes erreurs.', en: 'Solid progress: review the duels for your mistakes.' }
      : { fr: 'À renforcer : refais les cartes Q pour ces duels.', en: 'Needs work: redo the Pack cards for these duels.' };

  const displayList = resultFilter === 'wrong' ? wrongList : activeQuestions;

  container.innerHTML = `
    <section class="section-group">
      <div class="flow-card">
        <div class="verdict-box">
          <div class="verdict-score">${score} / ${activeQuestions.length} <span style="font-size:0.55em;color:var(--text-muted);">(${pct}%)</span></div>
          <div style="font-weight:700;font-size:1.05em;margin-top:8px;color:var(--text-strong);">${t(verdictMsg, lang)}</div>
          <div class="cell-sub" style="margin-top:6px;">
            ⏱ ${formatTime(totalSeconds)} · ${wrongList.length} ${ui({ fr: 'erreur(s) sauvegardée(s)', en: 'mistake(s) saved' }, lang)}
          </div>
          <div style="display:flex;justify-content:center;gap:10px;margin-top:18px;flex-wrap:wrap;">
            <button class="btn-violet-pill" id="blitz-restart">↺ ${ui({ fr: 'Nouveau test', en: 'New Test' }, lang)}</button>
            <button class="btn-ghost-pill" id="blitz-goto-errors">${ui({ fr: 'Carnet d’erreurs', en: 'Error Log' }, lang)} →</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section-group">
      <div class="section-header">
        <h2 class="section-title">${ui({ fr: 'Corrigé détaillé', en: 'Answer Key & Review' }, lang)}</h2>
        <div class="section-filters">
          <button class="filter-pill-btn ${resultFilter === 'wrong' ? 'active' : ''}" data-rfilter="wrong">
            ${ui({ fr: `Erreurs (${wrongList.length})`, en: `Mistakes (${wrongList.length})` }, lang)}
          </button>
          <button class="filter-pill-btn ${resultFilter === 'all' ? 'active' : ''}" data-rfilter="all">
            ${ui({ fr: `Tout (${activeQuestions.length})`, en: `All (${activeQuestions.length})` }, lang)}
          </button>
        </div>
      </div>

      <div class="flow-card">
        ${displayList
          .map((q) => {
            const isOk = answers[q.uid] === q.answer;
            const fullSentence = q.sentence.replace('___', q.options[q.answer]).replace('（　）', q.options[q.answer]);
            return `
              <div class="flow-row-compact">
                <div>
                  <span class="${isOk ? 'btn-mint-pill' : 'pill-tag pill-tag-rose'}" style="min-width:74px;padding:5px 10px;">
                    #${q.id} ${isOk ? '✓' : '✗'}
                  </span>
                </div>
                <div>
                  <div class="cell-jp">
                    ${formatSentenceWithBlank(q.sentence, renderRuby(q.options[q.answer]))}
                  </div>
                  <div class="cell-sub">${t(q.explanation, lang, true)}</div>
                </div>
                <div class="row-actions">
                  <button class="circle-icon-btn" data-speak="${fullSentence}" title="Listen">🔊</button>
                  <button class="btn-ghost-pill" data-jump-duel="${q.duelId}">Duel #${q.duelId}</button>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </section>
  `;

  container.querySelector('#blitz-restart')?.addEventListener('click', () => {
    phase = 'intro';
    renderBlitz(container, ctx);
  });

  container.querySelector('#blitz-goto-errors')?.addEventListener('click', () => navigate('errors'));

  container.querySelectorAll('[data-rfilter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      resultFilter = btn.dataset.rfilter;
      renderBlitz(container, ctx);
    });
  });

  container.querySelectorAll('[data-speak]').forEach((btn) => {
    btn.addEventListener('click', () => speakJP(btn.dataset.speak));
  });

  container.querySelectorAll('[data-jump-duel]').forEach((btn) => {
    btn.addEventListener('click', () => navigate('duels', { duelId: Number(btn.dataset.jumpDuel) }));
  });
}
