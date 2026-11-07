import { describe, expect, it } from 'vitest';
import { appendTranscript, speechErrorMessage, voiceFileExtension } from '../lib/dictation';

describe('texte reconnu', () => {
  it('conserve le format WAV des captures Android sans renommer leur contenu en M4A', () => {
    expect(voiceFileExtension('file:///cache/recording.wav')).toBe('wav');
    expect(voiceFileExtension('file:///cache/recording.M4A')).toBe('m4a');
    expect(voiceFileExtension('file:///cache/recording.caf')).toBe('caf');
  });
  it('remplace les résultats cumulés et conserve les phrases déjà reconnues', () => {
    expect(appendTranscript('Je marchais', 'Je marchais dans une forêt.')).toBe('Je marchais dans une forêt.');
    expect(appendTranscript('Je marchais dans une forêt.', 'Une porte s’ouvrait.')).toBe('Je marchais dans une forêt.\nUne porte s’ouvrait.');
    expect(appendTranscript('Je marchais.\nUne porte s’ouvrait.', 'Une porte s’ouvrait.')).toBe('Je marchais.\nUne porte s’ouvrait.');
  });
  it('conserve le texte écrit quand aucun mot n’a été reconnu', () => {
    expect(appendTranscript('Mon récit privé.', '')).toBe('Mon récit privé.');
    expect(speechErrorMessage('not-allowed')).toContain('réglages');
    expect(speechErrorMessage('no-speech')).toContain('Aucune parole');
  });
});
