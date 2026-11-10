import { describe, expect, it } from 'vitest';

import { emotionFromAnswer, oniQuestions, splitContext, withContext } from '../lib/oni-questions';

describe('questions d’Oni', () => {
  it('pose trois questions au plus, choisies selon le récit, la dernière sur le contexte de vie', () => {
    const qs = oniQuestions('Je marche dans une maison que je ne connais pas. Une porte est fermée.');
    expect(qs.map((q) => q.id)).toEqual(['lieu', 'emotion', 'contexte']);
    expect(qs[0].text).toContain('inconnu');
    expect(qs[1].text).toContain('passage');
  });

  it('demande la place d’une personne connue et la récurrence d’un rêve qui revient', () => {
    expect(oniQuestions('Encore ce rêve : ma mère me parle', 'tristesse').map((q) => q.id)).toEqual(['personne', 'recurrence', 'contexte']);
  });

  it('ne redemande pas l’émotion déjà donnée', () => {
    const qs = oniQuestions('Je tombe dans le vide', 'peur');
    expect(qs.map((q) => q.id)).toEqual(['moment', 'contexte']);
    expect(oniQuestions('Un champ de fleurs', 'joie').map((q) => q.id)).toEqual(['contexte']);
  });

  it('joint les réponses données au récit, omet les questions passées, et sait les séparer', () => {
    const qs = oniQuestions('Une maison inconnue');
    const story = withContext('Une maison inconnue', qs, [
      { id: 'lieu', choices: ['Une période de ma vie'], text: 'La maison de ma grand-mère' },
      { id: 'emotion', choices: [], text: '' },
    ]);
    expect(story).toContain('— Précisions pour Oni —');
    expect(story).toContain('Une période de ma vie — La maison de ma grand-mère');
    expect(story).not.toContain('Quelle émotion');
    expect(splitContext(story).story).toBe('Une maison inconnue');
    expect(withContext('Rien', qs, [])).toBe('Rien');
    expect(splitContext('Rien').context).toBeUndefined();
  });

  it('déduit l’émotion d’une réponse rapide', () => {
    const q = oniQuestions('Un rêve flou')[0];
    expect(emotionFromAnswer(q, { id: q.id, choices: ['Peur / angoisse'], text: '' })).toBe('peur');
  });
});
