import { KANJI_PART_1 } from './kanjiPart1.js';
import { KANJI_PART_2 } from './kanjiPart2.js';

export const N4_KANJI = [...KANJI_PART_1, ...KANJI_PART_2].map(
  ([id, char, strokes, on, kun, en, fr, words, hintEn, hintFr]) => ({
    id,
    char,
    strokes,
    on,
    kun,
    meaning: { en, fr },
    words,
    hint: { en: hintEn, fr: hintFr },
  })
);
