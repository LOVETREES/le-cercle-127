import { describe, expect, it } from 'vitest';
import { shadowMap, shadowMatches } from '../lib/ombre';
import { normalizeBirthDate, birthInstant } from '../lib/labyrinthe/acquis';

describe('journal et ciel de naissance', () => {
  it('compte les mots par note sans exposer le texte et laisse les mots isolés de côté', () => {
    const result = shadowMap([{ text: 'Peur, peur. Je cherche du soutien.' }, { text: 'J’ai peur et du soutien.' }, { text: 'De la joie.' }]);
    expect(result.tensions).toEqual([{ word: 'peur', occurrences: 2 }]);
    expect(result.ressources).toEqual([{ word: 'soutien', occurrences: 2 }]);
    expect(JSON.stringify(result)).not.toContain('cherche');
  });
  it('accepte la date française et rejette les dates ou heures impossibles', () => {
    expect(normalizeBirthDate('03/09/1978')).toBe('1978-09-03');
    expect(normalizeBirthDate('1978-09-03')).toBe('1978-09-03');
    expect(normalizeBirthDate('31/02/1978')).toBeUndefined();
    expect(normalizeBirthDate('29/02/2024')).toBe('2024-02-29');
    expect(birthInstant({ date: '03/09/1978', time: 'abc' })).toBeUndefined();
    expect(birthInstant({ date: '03/09/1978' })).toBeInstanceOf(Date);
  });
  it('regroupe les formes prévues et filtre les mêmes pages sans confondre les sous-chaînes', () => {
    const notes = [{ text: 'Des peurs et des lumières.' }, { text: 'Une peur et une lumière.' }, { text: 'Je cours.' }, { text: 'Nous allons courir.' }];
    const map = shadowMap(notes);
    expect(map.tensions).toContainEqual({ word: 'peur', occurrences: 2 });
    expect(map.ressources).toContainEqual({ word: 'lumiere', occurrences: 2 });
    expect(map.mouvements).toContainEqual({ word: 'courir', occurrences: 2 });
    expect(notes.filter((e) => shadowMatches(e.text, 'peur'))).toHaveLength(2);
    expect(shadowMatches('J’ai peur de la vapeur.', 'peur')).toBe(true);
    expect(shadowMatches('De la vapeur.', 'peur')).toBe(false);
    expect(shadowMatches('Une peur', '.*')).toBe(false);
  });
});
