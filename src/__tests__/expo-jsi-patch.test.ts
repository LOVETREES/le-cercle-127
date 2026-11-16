import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { patch } = require('../../scripts/fix-expo-jsi.cjs') as { patch: (source: string) => string };
const source = `    // The isolated closure below runs synchronously on this thread.
    nonisolated(unsafe) let slot = buffer.baseAddress!
    expo.emplaceUndefined(slot)
      try JavaScriptActor.assumeIsolated {
        try encode(JavaScriptValue.Slot(slot), runtime)`;

describe('correctif iOS Expo', () => {
  it('corrige la capture de slot et reste idempotent', () => {
    const result = patch(source);
    expect(result).toContain('let slotAddress = UInt(bitPattern: slot)');
    expect(result).toContain('let slot = UnsafeMutablePointer<facebook.jsi.Value>(bitPattern: slotAddress)!');
    expect(patch(result)).toBe(result);
  });
  it('refuse un fichier inconnu ou partiellement modifié', () => {
    expect(() => patch('source inattendue')).toThrow('code Expo a changé');
    expect(() => patch(source.replace('nonisolated(unsafe)', 'different'))).toThrow('code Expo a changé');
  });
});
