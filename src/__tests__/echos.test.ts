import { describe, expect, it } from 'vitest';
import { archetypalEchoes, mirrorForSister } from '../lib/echos';

describe('échos symboliques', () => {
  it('ne propose une famille que sur deux pages distinctes et ne renvoie pas leurs textes', () => {
    expect(archetypalEchoes([{ text: 'Peur, peurs, fuite.' }])).toEqual([]);
    const result = archetypalEchoes([{ text: 'Je pars en voyage.' }, { text: 'Une étoile éclaire mon choix.' }]);
    expect(result.map((x) => x.key)).toEqual(['exploration']);
    expect(result[0].matched).toBe(2);
    expect(JSON.stringify(result)).not.toContain('Je pars');
  });
  it('associe un miroir stable à une Sœur reconnue', () => {
    expect(mirrorForSister('Oni')?.name).toBe('Le Veilleur');
    expect(mirrorForSister('inconnue')).toBeUndefined();
  });
  it('considère les quinze pages les plus récentes et classe par nombre de pages, pas par répétition du même mot', () => {
    const recent = [{ text: 'peur peur peur' }, { text: 'peur' }, { text: 'choix' }, { text: 'choix' }, { text: 'étoile' }, ...Array.from({ length: 10 }, () => ({ text: 'rien' }))];
    const result = archetypalEchoes([...recent, { text: 'fuite' }]);
    expect(result.map((x) => [x.key, x.matched])).toEqual([['exploration', 3], ['ombre', 2]]);
  });
});
