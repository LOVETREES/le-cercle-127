// Cœur de l'Oracle 127, identique au moteur du site (« Le Reliquaire ») pour qu'un sceau
// donne le même tirage partout. Fonctions pures : le hasard et le SHA-256 sont fournis
// par l'appelant (expo-crypto dans l'app, des valeurs fixes dans les tests).
import LAMES from './lames.json';
import SOEURS from './soeurs.json';

export type Lame = { n: number; name: string; mask: number; sisters: string[]; definition: string; image: string };
export type Soeur = (typeof SOEURS)[number];
export type Mode = 'jour' | 'trois' | 'sept';

export const CARDS = LAMES as Lame[];
export const SISTERS = SOEURS as Soeur[];
const BY_N = new Map(CARDS.map((c) => [c.n, c]));

export const lameByNumber = (n: number): Lame | undefined => BY_N.get(n);
/** Les Sœurs d'un masque de 7 bits (Oni 1, Alka 2, Naïa 4, Terra 8, Ignis 16, Astria 32, Irma 64). */
export const sistersOfMask = (mask: number): Soeur[] => SISTERS.filter((_, i) => (mask >> i) & 1);

/** FNV-1a 32 bits, comme le site. */
export function hashText(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** AAAA-MM-JJ à Paris (la carte du jour change à minuit, heure de Paris, pour tout le monde). */
export function parisDayKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** La même lame pour tout le monde à un moment donné (même formule que le site). */
export function momentCard(key: string): Lame {
  return CARDS[hashText(key) % CARDS.length];
}
export const dayCard = (now = new Date()) => momentCard(`${parisDayKey(now)}|carte-du-jour`);

/** mulberry32 initialisé par le sceau. */
function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/** Les 127 masques mélangés (Fisher-Yates sans biais, par rejet) à partir d'un sceau hexadécimal. */
export function deckFromSeal(hex: string): number[] {
  const next = rngFrom(parseInt(hex, 16));
  const a = Array.from({ length: 127 }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) {
    const n = i + 1;
    const limit = Math.floor(4294967296 / n) * n;
    let x: number;
    do x = next();
    while (x >= limit);
    const j = x % n;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const BY_MASK = new Map(CARDS.map((c) => [c.mask, c]));
export const lameByMask = (m: number): Lame => BY_MASK.get(m) as Lame;

export const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

export type Crypto = { randomBytes: (n: number) => Uint8Array; sha256Hex: (s: string) => Promise<string> };

/** Le sceau : SHA-256 (intention + instant + durée du geste + 8 octets aléatoires), 4 premiers octets. */
export async function makeSeal(
  c: Crypto,
  intent: string,
  holdMs: number,
  now = new Date(),
  extra?: { bytes: Uint8Array; label: string },
): Promise<{ seal: string; source: string }> {
  // Le hasard de l'appareil, éventuellement mêlé (OU exclusif) à des octets quantiques : jamais remplacé.
  const own = c.randomBytes(8);
  const mixed = extra?.bytes.length ? Uint8Array.from(own, (x, i) => x ^ extra.bytes[i % extra.bytes.length]) : own;
  const salt = toHex(mixed);
  const base = extra?.bytes.length ? `${extra.label} + aléa cryptographique de l’appareil` : 'aléa cryptographique de l’appareil';
  try {
    const digest = await c.sha256Hex([intent.trim(), now.toISOString(), String(Math.round(holdMs)), salt].join('|'));
    return { seal: digest.slice(0, 8).toUpperCase(), source: `${base} + SHA-256` };
  } catch {
    return { seal: salt.slice(0, 8), source: base };
  }
}

export type Draw = { mode: Mode; seal?: string; source: string; cards: Lame[]; positions: string[] };

export const POSITIONS: Record<Mode, string[]> = {
  jour: ['Ta carte du jour'],
  trois: ['Ce qui s’en va', 'Ce qui est là', 'Ce qui s’ouvre'],
  sept: ['La lame et ses sept regards'],
};

/** Un tirage : la carte du jour (la même pour tous), ou les premières lames du paquet scellé. */
export function drawFrom(mode: Mode, seal: string | undefined, source: string, now = new Date()): Draw {
  if (mode === 'jour' || !seal) return { mode: 'jour', source: 'carte du jour (la même pour tout le monde, heure de Paris)', cards: [dayCard(now)], positions: POSITIONS.jour };
  const deck = deckFromSeal(seal);
  const k = mode === 'trois' ? 3 : 1;
  return { mode, seal, source, cards: deck.slice(0, k).map(lameByMask), positions: POSITIONS[mode] };
}

/** Le sceau lisible, au format du site (127-MODE-SCEAU). */
export const sealLabel = (d: Draw) => (d.seal ? `127-${d.mode === 'trois' ? 'C' : 'L'}-${d.seal}` : '');
