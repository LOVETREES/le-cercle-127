import { describe, expect, it } from 'vitest';

import { explicitCrisis, RENEWAL_PROMPTS, renewalEntry, renewalSuggested } from '../lib/renouveau';

describe('invitation à ouvrir une page', () => {
  it('ne propose le repérage que si deux pages distinctes contiennent des mots reconnus', () => {
    expect(renewalSuggested([{ text: 'Je suis fatiguée et épuisée.' }])).toBe(false);
    expect(renewalSuggested([{ text: 'Je suis fatiguée.' }, { text: 'Une impasse.' }])).toBe(true);
    expect(renewalSuggested([{ text: 'Je suis fatiguée.', prompt: RENEWAL_PROMPTS[0] }, { text: 'Une impasse.' }])).toBe(false);
  });
  it('retrouve une page enregistrée sans examiner le contenu', () => {
    const entry = { id: '1', at: '2026-01-01', text: 'Un pas', prompt: RENEWAL_PROMPTS[3] };
    expect(renewalEntry([entry], 3)).toEqual(entry);
    expect(renewalEntry([entry], 0)).toBeUndefined();
  });
  it('repère des formulations explicites pour afficher une aide immédiate', () => {
    expect(explicitCrisis('Je veux me suicider')).toBe(true);
    expect(explicitCrisis('Je veux laisser mourir cette vieille habitude')).toBe(false);
  });
});
