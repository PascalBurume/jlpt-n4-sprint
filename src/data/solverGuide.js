import { DUELS } from './duels.js';
import { SIGNAL_WORDS, FORM_BEFORE_WORDS, NOUN_CONNECTORS } from './traps.js';
import { N4_KANJI } from './kanji.js';
import { N4_VOCAB } from './vocab.js';

/**
 * Easy-to-understand step-by-step solving guides for each of the 23 Duels.
 * Designed so the learner can DEDUCE the right answer themselves without spoiling it!
 */
export const DUEL_SOLVER_STEPS = {
  1: {
    clue: {
      fr: 'Les 4 choix sont le MÊME verbe à des voix différentes. Regarde la particule : が = capacité ? Xに + situation subie = passif ? Xに + quelqu’un oblige/fait faire = causatif ou causatif passif ?',
      en: 'All 4 choices are the SAME verb in different voices. Check the particle: が = ability? Xに + something happens to me = passive? Someone makes/forces = causative or causative-passive?',
    },
    formula: {
      fr: 'G1 : son え+る (peux) · あ+れる (subis) · あ+せる (fais faire) · あ+される (forcé). G2 : られる (peux/subis) · させる (fais faire) · させられる (forcé).',
      en: 'G1: え+る (can) · あ+れる (passive) · あ+せる (make/let) · あ+される (forced). G2: られる (can/passive) · させる (make/let) · させられる (forced).',
    },
  },
  2: {
    clue: {
      fr: 'Repère une invitation familière (« 〜ない？ » → « うん、___ ») OU le mot-signal « と思っています » juste après le trou.',
      en: 'Spot a casual invitation ("〜ない？" → "うん、___") OR the signal "と思っています" right after the blank.',
    },
    formula: {
      fr: 'Forme volitive : G1 dernier son en お + う (走る → 走ろう, 休む → 休もう). G2 : enlève る + よう. する → しよう.',
      en: 'Volitional form: G1 last sound to お + う (走る → 走ろう, 休む → 休もう). G2: drop る + よう. する → しよう.',
    },
  },
  3: {
    clue: {
      fr: 'Regarde le contexte : panneau routier brutal (止まれ / 入るな) OU parent/professeur (なさい) ? Regarde le mot juste APRÈS le trou !',
      en: 'Check the context: blunt road sign (止まれ / 入るな) OR parent/teacher (なさい)? Look at the word RIGHT AFTER the blank!',
    },
    formula: {
      fr: 'Ordre : G1 → son え (止まれ), G2 → ろ (食べろ). Devant な (défense) → DICTIONNAIRE. Devant なさい → RADICAL ます.',
      en: 'Command: G1 → え sound (止まれ), G2 → ろ (食べろ). Before な (don’t) → DICTIONARY. Before なさい → ます-STEM.',
    },
  },
  4: {
    clue: {
      fr: 'Regarde la particule が et demande-toi : la chose s’est-elle faite toute seule (intransitif + ている) OU quelqu’un l’a-t-il mise/faite exprès (transitif + てある) ?',
      en: 'Look at particle が and ask: did it happen by itself (intransitive + ている) OR did someone do it on purpose (transitive + てある)?',
    },
    formula: {
      fr: 'Intransitif (開く, つく, おちる) + ている = état naturel. Transitif (開ける, はる, かざる) + てある = résultat voulu.',
      en: 'Intransitive (開く, つく, おちる) + ている = natural state. Transitive (開ける, はる, かざる) + てある = done on purpose.',
    },
  },
  5: {
    clue: {
      fr: 'Cherche le sens de l’action : « goûter/essayer pour voir » → てみる · « préparer à l’avance (avant un voyage/test) » → ておく · « finir / regret / accident » → てしまう.',
      en: 'Check the intent: "try to see" → てみる · "prepare in advance (before trip/test)" → ておく · "finish completely / regret / oops" → てしまう.',
    },
    formula: {
      fr: 'Verbe à la forme て + みる / おく / しまう.',
      en: 'Verb て-form + みる / おく / しまう.',
    },
  },
  6: {
    clue: {
      fr: 'Regarde la direction dans le temps : これから (à partir de maintenant vers le futur) → ていく. だんだん / 急に (jusqu’à maintenant, ça commence) → てくる.',
      en: 'Check time direction: これから (from now into the future) → ていく. だんだん / 急に (gradually up to now / just started) → てくる.',
    },
    formula: {
      fr: 'Futur (これから) → ていく · Jusqu’à maintenant (だんだん, 急に) → てくる.',
      en: 'Future (これから) → ていく · Up to now (だんだん, 急に) → てくる.',
    },
  },
  7: {
    clue: {
      fr: 'Demande-toi : QUI donne/aide et QUI reçoit ? Moi → autre = あげる (plantes/animaux = やる). Autre → moi (ou avec ありがとう) = くれる. Je reçois DE quelqu’un (に) = もらう.',
      en: 'Ask: WHO gives/helps and WHO receives? Me → other = あげる (plants/animals = やる). Other → me (or with ありがとう) = くれる. I receive FROM X (に) = もらう.',
    },
    formula: {
      fr: 'Demande très polie : 〜ていただけませんか. Vouloir que X fasse : Xに + 〜てほしい.',
      en: 'Very polite request: 〜ていただけませんか. Want X to do: Xに + 〜てほしい.',
    },
  },
  8: {
    clue: {
      fr: 'Identifie le sens : permis (てもいい / てもかまわない), interdit (てはいけない), pas obligatoire (なくてもいい), obligatoire (なければならない).',
      en: 'Identify the meaning: allowed (てもいい / てもかまわない), forbidden (てはいけない), not required (なくてもいい), must (なければならない).',
    },
    formula: {
      fr: 'Réponse « いいえ » à « dois-je faire ? » → 〜なくてもいいです. Date limite までに → 〜なければならない.',
      en: '"いいえ" answer to "must I?" → 〜なくてもいいです. Deadline までに → 〜なければならない.',
    },
  },
  9: {
    clue: {
      fr: 'Y a-t-il un SENTIMENT ou des EXCUSES après la virgule (こまりました, すみませんでした, しんぱい) ? Si OUI → なくて ! Sinon (« sans faire ») → ないで ou ずに.',
      en: 'Is there a FEELING or APOLOGY after the comma (こまりました, すみませんでした, しんぱい)? If YES → なくて! Otherwise ("without doing") → ないで or ずに.',
    },
    formula: {
      fr: 'SANS faire = ないで (ou radical ない + ずに ; する → せずに). PARCE QUE ne… pas (+ émotion) = なくて.',
      en: 'WITHOUT doing = ないで (or ない-stem + ずに; する → せずに). BECAUSE not (+ feeling) = なくて.',
    },
  },
  10: {
    clue: {
      fr: 'Regarde la FIN de la phrase ! Demande / invitation (ください, 行きませんか) → たら (JAMAIS と !). Automatique (machine, saison) → と. Regret (よかった) ou conseil (いいですか) → ば. Reprise de ce que dit A → なら.',
      en: 'Look at the END of the sentence! Request/invitation → たら (NEVER と!). Automatic/machine/nature → と. Regret (よかった) or advice (いいですか) → ば. Picking up A’s topic → なら.',
    },
    formula: {
      fr: 'と = dictionnaire + と · ば = son え + ば (する→すれば) · たら = forme た + ら · なら = neutre/nom + なら.',
      en: 'と = dictionary + と · ば = え-sound + ば (する→すれば) · たら = た-form + ら · なら = plain/noun + なら.',
    },
  },
  11: {
    clue: {
      fr: 'L’action est-elle PONCTUELLE (1 seule fois pendant la période ou avant la limite) ? Ajoute に → 間に / までに. Continue tout le temps → 間 / まで. Avant que ça change → うちに.',
      en: 'Is it ONE single action inside a period or before a deadline? Add に → 間に / までに. Continuous → 間 / まで. Before it changes → うちに.',
    },
    formula: {
      fr: 'Ponctuel = 間に / までに · Continu (ずっと) = 間 / まで · Tant que (あたたかい) = うちに.',
      en: 'Single action = 間に / までに · Continuous (ずっと) = 間 / まで · While still (あたたかい) = うちに.',
    },
  },
  12: {
    clue: {
      fr: 'Regarde le mot de temps : 先週 / il y a quelques jours mais récent pour moi → たばかり. 今から (sur le point de) → るところ. 今 / さっき (à l’instant) → ているところ / たところ.',
      en: 'Check the time word: 先週 / days ago but feels recent → たばかり. 今から (about to) → るところ. さっき (just a second ago) → たところ.',
    },
    formula: {
      fr: 'る + ところ (avant) · ている + ところ (pendant) · た + ところ (à l’instant) · た + ばかり (récent).',
      en: 'る + ところ (before) · ている + ところ (during) · た + ところ (moment ago) · た + ばかり (feels recent).',
    },
  },
  13: {
    clue: {
      fr: 'Regarde la FORME du verbe juste avant le trou ! Forme て → から. Forme た → あとで. Dictionnaire → まえに. Radical ます → ながら.',
      en: 'Check the VERB FORM right before the blank! て-form → から. た-form → あとで. Dictionary → まえに. ます-stem → ながら.',
    },
    formula: {
      fr: 'て + から · た + あとで · る + まえに · radical ます + ながら.',
      en: 'て + から · た + あとで · dictionary + まえに · ます-stem + ながら.',
    },
  },
  14: {
    clue: {
      fr: 'Repère le mot-signal : 見て → そう (apparence). 〜によると / 話では → そうだ (ouï-dire). うわさでは → らしい. から (fait logique) → はず. たぶん → でしょう.',
      en: 'Spot the signal: 見て → そう (looks like). 〜によると / 話では → そうだ (hearsay). うわさでは → らしい. から (logical fact) → はず. たぶん → でしょう.',
    },
    formula: {
      fr: 'Vérifie « Nom + ? » : Nom + だ + そうだ · Nom + の + ようだ/はず · Nom + ∅ + みたい/らしい/かもしれない.',
      en: 'Check "Noun + ?": N + だ + そうだ · N + の + ようだ/はず · N + ∅ + みたい/らしい/かもしれない.',
    },
  },
  15: {
    clue: {
      fr: 'Qui a pris la décision ? MOI-même → ことにする. L’entreprise / le chef / un règlement → ことになる. Attention devant よてい après un nom → の !',
      en: 'Who decided? MYSELF → ことにする. Company / boss / rule → ことになる. Before よてい after a noun → の!',
    },
    formula: {
      fr: 'Dictionnaire / ない + つもり / ことにする / ことになる. Nom + の + よてい.',
      en: 'Dictionary / ない + つもり / ことにする / ことになる. Noun + の + よてい.',
    },
  },
  16: {
    clue: {
      fr: 'Effort / habitude quotidienne (ex: 毎日〜している) → ようにする. Progrès / devenir capable (souvent avec potentiel 読める, およげる) → ようになる.',
      en: 'Daily effort / habit (毎日〜している) → ようにする. Progress / became able (often with potential 読める, およげる) → ようになる.',
    },
    formula: {
      fr: 'Effort = ようにする (ようにしている) · Progrès = potentiel + ようになる.',
      en: 'Effort = ようにする (ようにしている) · Skill progress = potential + ようになる.',
    },
  },
  17: {
    clue: {
      fr: 'Regarde le verbe juste AVANT le trou : est-ce un verbe POTENTIEL ou NÉGATIF (話せる, 聞こえる, わすれない) ? → ように. Est-ce une action VOLONTAIRE (買う, 入る) ? → ために.',
      en: 'Look at the verb right BEFORE the blank: is it POTENTIAL or NEGATIVE (話せる, 聞こえる)? → ように. Is it a VOLITIONAL action (買う, 入る)? → ために.',
    },
    formula: {
      fr: 'Non-contrôlable (potentiel / ない) → ように · Action volontaire (dictionnaire) → ために.',
      en: 'Non-controllable (potential / ない) → ように · Controllable (dictionary) → ために.',
    },
  },
  18: {
    clue: {
      fr: 'Vérifie la logique : cause → ので/から · déception/surprise contraire à l’attente → のに · contraste neutre → けど · liste de raisons → し · explication → んです.',
      en: 'Check the logic: reason → ので/から · unexpected/disappointing → のに · neutral "but" → けど · listing reasons → し · explanation → んです.',
    },
    formula: {
      fr: 'PIÈGE NOM : devant ので, のに, んです, un Nom/な-adj prend TOUJOURS な (試験なので, 日曜日なのに).',
      en: 'NOUN TRAP: before ので, のに, んです, a Noun/な-adj ALWAYS takes な (試験なので, 日曜日なのに).',
    },
  },
  19: {
    clue: {
      fr: 'Regarde le mot après le trou : 見る/聞く (perception) → の. Devant です → こと. Nom inconnu + nom → という. Question fermée (oui/non) → かどうか. Mot interrogatif (何時, 何人, どこ) → か SEUL !',
      en: 'Check what follows: 見る/聞く → の. Before です → こと. Unknown name + noun → という. Yes/No embedded Q → かどうか. Question word (何時, 何人, どこ) → か ONLY!',
    },
    formula: {
      fr: 'Nom + だ + と思う · Citation = と / って · Question avec 何/どこ/いつ = か seul.',
      en: 'Noun + だ + と思う · Quote = と / って · Question with 何/どこ/いつ = か alone.',
    },
  },
  20: {
    clue: {
      fr: 'Ces suffixes s’attachent presque tous au RADICAL ます (sans ます) ou à un い-adj SANS い : 方 (manière), さ (nom de mesure), やすい/にくい (facile/difficile), すぎる (trop), 始める/終わる/つづける.',
      en: 'These attach to the ます-STEM (or い-adj WITHOUT い): 方 (way), さ (degree noun), やすい/にくい (easy/hard), すぎる (too), 始める/終わる/つづける.',
    },
    formula: {
      fr: 'い-adj : enlève い avant さ et すぎる (重い→重さ, からい→からすぎる). Verbe : radical ます + やすい / 始める / 終わる.',
      en: 'い-adj: drop い before さ and すぎる (重い→重さ, からい→からすぎる). Verb: ます-stem + やすい / 始める / 終わる.',
    },
  },
  21: {
    clue: {
      fr: 'REGARDE LA FIN DE LA PHRASE EN PREMIER ! Fin NÉGATIVE → しか (seulement) ou ほど (pas aussi… que). Fin POSITIVE → ばかり (que des), より (plus que), も (autant que ça !), ずつ (chacun).',
      en: 'LOOK AT THE END OF THE SENTENCE FIRST! NEGATIVE end → しか (only) or ほど (not as… as). POSITIVE end → ばかり (nothing but), より (more than), も (as much as!), ずつ (each).',
    },
    formula: {
      fr: 'しか + NÉGATIF · ほど + NÉGATIF · Période + に + nombre (fréquence) · い-adj(く) + する.',
      en: 'しか + NEGATIVE · ほど + NEGATIVE · Period + に + number (frequency) · い-adj(く) + する.',
    },
  },
  22: {
    clue: {
      fr: 'Pose-toi UNE question : QUI fait l’action ? Le professeur / président (先生, 社長) → 尊敬語 (Respect). MOI je fais pour lui → 謙譲語 (Modestie).',
      en: 'Ask ONE question: WHO does the action? Teacher / president (先生, 社長) → Respectful (尊敬語). ME acting for them → Humble (謙譲語).',
    },
    formula: {
      fr: 'Respect (autre) : お〜になる, いらっしゃる, ごらんになる, めしあがる. Modestie (moi) : お〜する, まいる, もうす, はいけんする, いただく.',
      en: 'Respectful (other): お〜になる, いらっしゃる, ごらんになる, めしあがる. Humble (me): お〜する, まいる, もうす, はいけんする, いただく.',
    },
  },
  23: {
    clue: {
      fr: 'Vérifie la paire : AとかBとか · VたりVたりする · ぜんぜん + NÉGATIF · 何でも + POSITIF · 何も + NÉGATIF · AかAないか · outil + で.',
      en: 'Check the pair: AとかBとか · VたりVたりする · ぜんぜん + NEGATIVE · 何でも + POSITIVE · 何も + NEGATIVE · AかAないか · tool + で.',
    },
    formula: {
      fr: 'Ne mélange pas とか avec や/と. Finis toujours たり par する. ぜんぜん exige une négation.',
      en: 'Don’t mix とか with や/と. Always end たり with する. ぜんぜん requires a negative ending.',
    },
  },
};

export function getGuidanceForDuel(duelId) {
  const duel = DUELS.find((d) => d.id === duelId) || DUELS[0];
  const steps = DUEL_SOLVER_STEPS[duel.id] || DUEL_SOLVER_STEPS[1];
  return { duel, ...steps };
}

/**
 * Universal fast rule search across all 23 Duels, Signal Words, Word-After-Blank, and Noun + ? rules.
 */
export function searchAllRules(rawQuery) {
  const q = (rawQuery || '').trim().toLowerCase();
  if (!q) return [];
  const results = [];

  // 1. Search Duels
  for (const d of DUELS) {
    const hay = [
      `duel ${d.id}`,
      d.title.fr,
      d.title.en,
      d.trap.fr,
      d.trap.en,
      d.qRange,
      ...d.items.map((i) => `${i.form.replace(/\[[^\]]+\]/g, '')} ${i.fr} ${i.en}`),
      ...d.examples.map((e) => e.replace(/\[[^\]]+\]/g, '')),
    ]
      .join(' ')
      .toLowerCase();

    if (hay.includes(q)) {
      results.push({
        type: 'duel',
        badge: `Duel ${String(d.id).padStart(2, '0')}`,
        duelId: d.id,
        title: d.title,
        preview: d.items.map((i) => i.form).join(' · '),
        rule: d.trap,
        items: d.items,
      });
    }
  }

  // 2. Search Signal Words
  for (const s of SIGNAL_WORDS) {
    const hay = `${s.signal.replace(/\[[^\]]+\]/g, '')} ${s.signalEn.replace(/\[[^\]]+\]/g, '')} ${s.requires.fr} ${s.requires.en} ${s.questions}`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        type: 'signal',
        badge: 'Signal',
        duelId: s.duelId,
        title: { fr: s.signal, en: s.signalEn },
        preview: s.requires.fr,
        rule: s.requires,
      });
    }
  }

  // 3. Search Word-After-Blank
  for (const f of FORM_BEFORE_WORDS) {
    const matchedWords = f.words.filter((w) => w.replace(/\[[^\]]+\]/g, '').toLowerCase().includes(q));
    const formMatch = `${f.form.fr} ${f.form.en}`.toLowerCase().includes(q);
    if (matchedWords.length > 0 || formMatch) {
      results.push({
        type: 'after',
        badge: f.short.fr,
        radarTab: 'after',
        title: f.form,
        preview: (matchedWords.length > 0 ? matchedWords : f.words.slice(0, 6)).join(' · '),
        rule: {
          fr: `Devant ${(matchedWords.length > 0 ? matchedWords : f.words.slice(0, 5)).join(', ')} → mets le verbe à : ${f.form.fr}.`,
          en: `Before ${(matchedWords.length > 0 ? matchedWords : f.words.slice(0, 5)).join(', ')} → use: ${f.form.en}.`,
        },
      });
    }
  }

  // 4. Search Noun + ?
  for (const n of NOUN_CONNECTORS) {
    const hay = `nom noun ${n.connector} ${n.words.join(' ')} ${n.cleanExamples}`.toLowerCase();
    if (hay.includes(q)) {
      results.push({
        type: 'noun',
        badge: `Nom + ${n.connector}`,
        radarTab: 'noun',
        title: n.label,
        preview: n.words.join(' ・ '),
        rule: {
          fr: `Après un nom devant ${n.words.join(', ')} → utilise « ${n.connector} ». Ex : ${n.cleanExamples}`,
          en: `After a noun before ${n.words.join(', ')} → use "${n.connector}". Ex: ${n.cleanExamples}`,
        },
      });
    }
  }

  // 5. Search 166 Kanji
  let kanjiHits = 0;
  for (const k of N4_KANJI) {
    if (kanjiHits >= 4) break;
    const hay = `${k.char} ${k.on} ${k.kun} ${k.meaning.en} ${k.meaning.fr} ${k.words.join(' ')}`.toLowerCase();
    if (hay.includes(q)) {
      kanjiHits += 1;
      results.push({
        type: 'kanji',
        badge: `Kanji #${k.id}`,
        vocabFocus: { subtab: 'kanji', query: k.char },
        title: { fr: `${k.char} · ${k.meaning.fr}`, en: `${k.char} · ${k.meaning.en}` },
        preview: `ON: ${k.on} · KUN: ${k.kun}`,
        rule: {
          fr: `${k.words.slice(0, 2).join(' · ')} — ${k.hint.fr}`,
          en: `${k.words.slice(0, 2).join(' · ')} — ${k.hint.en}`,
        },
      });
    }
  }

  // 6. Search 640 Vocabulary words
  let vocabHits = 0;
  for (const v of N4_VOCAB) {
    if (vocabHits >= 5) break;
    const hay = `${v.word} ${v.reading} ${v.kanjiHint} ${v.meaning.en} ${v.meaning.fr}`.toLowerCase();
    if (hay.includes(q)) {
      vocabHits += 1;
      results.push({
        type: 'vocab',
        badge: `Vocab · ${v.type}`,
        vocabFocus: { subtab: 'vocab', query: v.word },
        title: {
          fr: `${v.word}${v.reading !== v.word ? ` (${v.reading})` : ''}`,
          en: `${v.word}${v.reading !== v.word ? ` (${v.reading})` : ''}`,
        },
        preview: `${v.meaning.fr} · ${v.meaning.en}`,
        rule: {
          fr: v.example.jp,
          en: v.example.jp,
        },
      });
    }
  }

  return results.slice(0, 14);
}
