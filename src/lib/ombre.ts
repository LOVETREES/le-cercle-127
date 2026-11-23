import type { JournalEntry } from './journal-intime';

// Formes explicites pour limiter les faux rapprochements (notamment les négations).
const WORDS: Record<'tensions' | 'ressources' | 'mouvements', Record<string, readonly string[]>> = {
  tensions: {
    peur: ['peur', 'peurs'], angoisse: ['angoisse', 'angoisses', 'angoissees', 'angoisses'],
    anxiete: ['anxiete', 'anxietes'], colere: ['colere', 'coleres'], tristesse: ['tristesse', 'tristesses'],
    honte: ['honte', 'hontes'], culpabilite: ['culpabilite', 'culpabilites'], solitude: ['solitude', 'solitudes'],
    doute: ['doute', 'doutes', 'douter', 'doutais', 'doutait', 'doutons'],
  },
  ressources: {
    aide: ['aide', 'aides', 'aider', 'aidons', 'aidaient'], soutien: ['soutien', 'soutiens', 'soutenir', 'soutient', 'soutenu'],
    confiance: ['confiance', 'confiances'], courage: ['courage', 'courages'], calme: ['calme', 'calmes'],
    espoir: ['espoir', 'espoirs'], gratitude: ['gratitude', 'gratitudes'], repos: ['repos', 'reposer', 'repose', 'reposes'],
    joie: ['joie', 'joies'], lumiere: ['lumiere', 'lumieres'],
  },
  mouvements: { courir: ['courir', 'cours', 'court', 'courons', 'courez', 'courent', 'courais', 'courait', 'couru'] },
};

const normalized = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const FORMS = { ...WORDS.tensions, ...WORDS.ressources, ...WORDS.mouvements };
export function shadowLabel(word: string): string {
  return ({ anxiete: 'anxiété', colere: 'colère', culpabilite: 'culpabilité', lumiere: 'lumière' } as Record<string, string>)[word] ?? word;
}
export function shadowMatches(text: string, word: string): boolean {
  const forms = FORMS[word];
  if (!forms) return false;
  const tokens = normalized(text).match(/[a-z]+/g) ?? [];
  return tokens.some((token) => forms.includes(token));
}
export function shadowMap(entries: Pick<JournalEntry, 'text'>[]) {
  const count = (words: Record<string, readonly string[]>) => Object.keys(words).map((word) => ({
    word, occurrences: entries.filter(({ text }) => shadowMatches(text, word)).length,
  })).filter(({ occurrences }) => occurrences >= 2).sort((a, b) => b.occurrences - a.occurrences || a.word.localeCompare(b.word));
  return { tensions: count(WORDS.tensions), ressources: count(WORDS.ressources), mouvements: count(WORDS.mouvements) };
}
export function isShadowWord(word: string): boolean { return Object.hasOwn(FORMS, word); }
