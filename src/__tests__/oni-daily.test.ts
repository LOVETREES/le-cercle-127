import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-constants', () => ({ default: { expoConfig: { extra: {} } } }));

import { parseDailyReading } from '../lib/api';

describe('lecture du jour d’Oni', () => {
  it('lit une lecture immédiate, ses questions et sa clôture', () => {
    const r = parseDailyReading({ ok: true, status: 'lue', saved: true, reading: ' Une porte. ', questions: 'Quoi ?\n\nOù ?', closing: 'Doucement.' });
    expect(r).toEqual({ status: 'lue', reading: 'Une porte.', questions: ['Quoi ?', 'Où ?'], closing: 'Doucement.', saved: true });
  });
  it('reconnaît l’accompagnement (détresse) sans interprétation', () => {
    expect(parseDailyReading({ ok: true, status: 'accompagnement', reading: 'Appelez le 3114.' })).toEqual({ status: 'accompagnement', reading: 'Appelez le 3114.' });
  });
  it('quota et demande déjà faite', () => {
    expect(parseDailyReading({ ok: true, status: 'quota' })).toEqual({ status: 'quota' });
    expect(parseDailyReading({ ok: true, status: 'deja_demandee' })).toEqual({ status: 'deja_demandee' });
  });
  it('toute autre réponse est « indisponible » (repli sur la lecture relue)', () => {
    for (const x of [undefined, 'Accepted', {}, { ok: true, status: 'lue', reading: '' }, { ok: false, status: 'lue', reading: 'x' }]) {
      expect(parseDailyReading(x).status).toBe('indisponible');
    }
  });
});
