export const EXAM_DATE = '2026-12-06';

export const STUDY_PLAN = [
  {
    id: 'j15-14',
    days: [15, 14],
    label: { fr: 'J-15, J-14', en: 'D-15, D-14' },
    dates: '21–22 Nov',
    summary: {
      fr: 'Fiche de conjugaison + duels 1 à 3',
      en: 'Conjugation sheet + Duels 1 to 3',
    },
    packRef: {
      fr: 'Cartes Q1 à 9 (Formes verbales)',
      en: 'Cards Q1 to 9 (Verb forms)',
    },
    duels: [1, 2, 3],
    qRange: [1, 9],
    recommendedTab: 'conjugation',
  },
  {
    id: 'j13-12',
    days: [13, 12],
    label: { fr: 'J-13, J-12', en: 'D-13, D-12' },
    dates: '23–24 Nov',
    summary: {
      fr: 'Duels 4 à 8',
      en: 'Duels 4 to 8',
    },
    packRef: {
      fr: 'Cartes Q10 à 30 (Forme て, donner/recevoir, obligation)',
      en: 'Cards Q10 to 30 (て-form, giving/receiving, obligation)',
    },
    duels: [4, 5, 6, 7, 8],
    qRange: [10, 30],
    recommendedTab: 'duels',
  },
  {
    id: 'j11-10',
    days: [11, 10],
    label: { fr: 'J-11, J-10', en: 'D-11, D-10' },
    dates: '25–26 Nov',
    summary: {
      fr: 'Duels 9 et 10',
      en: 'Duels 9 & 10',
    },
    packRef: {
      fr: 'Cartes Q31 à 40 (Négations & conditionnels)',
      en: 'Cards Q31 to 40 (Negatives & conditionals)',
    },
    duels: [9, 10],
    qRange: [31, 40],
    recommendedTab: 'duels',
  },
  {
    id: 'j9-8',
    days: [9, 8],
    label: { fr: 'J-9, J-8', en: 'D-9, D-8' },
    dates: '27–28 Nov',
    summary: {
      fr: 'Duels 11 à 14 + page « Nom + ? »',
      en: 'Duels 11 to 14 + "Noun + ?" sheet',
    },
    packRef: {
      fr: 'Cartes Q41 à 55 (Temps, apparence & ouï-dire)',
      en: 'Cards Q41 to 55 (Time, appearance & hearsay)',
    },
    duels: [11, 12, 13, 14],
    qRange: [41, 55],
    recommendedTab: 'radar',
  },
  {
    id: 'j7-6',
    days: [7, 6],
    label: { fr: 'J-7, J-6', en: 'D-7, D-6' },
    dates: '29–30 Nov',
    summary: {
      fr: 'Duels 15 à 19',
      en: 'Duels 15 to 19',
    },
    packRef: {
      fr: 'Cartes Q56 à 79 (Projets, raisons, nominalisation)',
      en: 'Cards Q56 to 79 (Plans, reasons, nominalizers)',
    },
    duels: [15, 16, 17, 18, 19],
    qRange: [56, 79],
    recommendedTab: 'duels',
  },
  {
    id: 'j5',
    days: [5],
    label: { fr: 'J-5', en: 'D-5' },
    dates: '1 Dec',
    summary: {
      fr: 'Duels 20 à 23',
      en: 'Duels 20 to 23',
    },
    packRef: {
      fr: 'Cartes Q80 à 106 (Degré, comparaison, keigo)',
      en: 'Cards Q80 to 106 (Degree, comparison, keigo)',
    },
    duels: [20, 21, 22, 23],
    qRange: [80, 106],
    recommendedTab: 'duels',
  },
  {
    id: 'j4',
    days: [4],
    label: { fr: 'J-4', en: 'D-4' },
    dates: '2 Dec',
    summary: {
      fr: 'Test éclair (32 questions), sans regarder les pages',
      en: 'Blitz Test (32 questions), closed-book',
    },
    packRef: {
      fr: 'Condition examen (1 min max / question)',
      en: 'Exam conditions (1 min max / question)',
    },
    duels: [],
    qRange: null,
    recommendedTab: 'blitz',
  },
  {
    id: 'j3-2',
    days: [3, 2],
    label: { fr: 'J-3, J-2', en: 'D-3, D-2' },
    dates: '3–4 Dec',
    summary: {
      fr: 'Refais seulement tes erreurs (test + livret)',
      en: 'Redo only your mistakes (blitz test + pack)',
    },
    packRef: {
      fr: 'Carnet d’erreurs uniquement',
      en: 'Error Notebook only',
    },
    duels: [],
    qRange: null,
    recommendedTab: 'errors',
  },
  {
    id: 'j1',
    days: [1],
    label: { fr: 'J-1', en: 'D-1' },
    dates: '5 Dec',
    summary: {
      fr: 'Relis « Le mot après le trou », « Nom + ? » et les duels. Pas de nouvelle grammaire.',
      en: 'Review "Word after the blank", "Noun + ?", and the duels. No new grammar.',
    },
    packRef: {
      fr: 'Dormir tôt !',
      en: 'Sleep early!',
    },
    duels: [],
    qRange: null,
    recommendedTab: 'radar',
  },
];

export const DAILY_ROUTINE = [
  {
    id: 'conj',
    minutes: 10,
    title: { fr: 'Fiche de conjugaison', en: 'Conjugation Sheet' },
    desc: { fr: 'Relis les 13 formes + 5 min de Verb Gym', en: 'Review the 13 forms + 5 min Verb Gym' },
    tab: 'conjugation',
  },
  {
    id: 'duels',
    minutes: 15,
    title: { fr: 'Duels du jour', en: 'Today’s Duels' },
    desc: { fr: 'Compare les formes et fais les cartes Q liées', en: 'Compare the pairs & drill linked Q cards' },
    tab: 'duels',
  },
  {
    id: 'review',
    minutes: 5,
    title: { fr: 'Refaire 2 ou 3 cartes', en: 'Redo 2–3 Mistake Cards' },
    desc: { fr: 'Vérifie ton Carnet d’erreurs', en: 'Check your Error Notebook' },
    tab: 'errors',
  },
  {
    id: 'listening',
    minutes: 10,
    title: { fr: 'Écoute (bonus quotidien)', en: 'Listening (daily bonus)' },
    desc: { fr: '10 min d’écoute JLPT N4 ou audio des phrases', en: '10 min JLPT N4 listening or sentence audio' },
    tab: 'duels',
  },
];

export const GOLDEN_RULES = [
  {
    step: 1,
    fr: 'Lis toute la phrase et cherche le mot-signal (しか, たぶん, ありがとう, 先生…).',
    en: 'Read the entire sentence and spot the signal word (しか, たぶん, ありがとう, 先生…).',
  },
  {
    step: 2,
    fr: 'Regarde le mot juste APRÈS le trou : il décide de la forme (page « Le mot après le trou »).',
    en: 'Look at the word RIGHT AFTER the blank: it determines the required form ("Word after the blank" radar).',
  },
  {
    step: 3,
    fr: 'Si les 4 choix sont le même verbe : qui fait l’action ? (Duel 1 : potentiel / passif / causatif).',
    en: 'If all 4 choices are the same verb: who does the action? (Duel 1: potential / passive / causative).',
  },
  {
    step: 4,
    fr: 'Barre les formes inventées, choisis, passe. Une minute maximum.',
    en: 'Cross out impossible forms, pick one, move on. One minute maximum.',
  },
];
