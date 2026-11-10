// Hasard quantique facultatif : quelques octets d'un générateur quantique public (LfD QRNG,
// université Humboldt de Berlin). Ils sont MÉLANGÉS à l'aléa de l'appareil, jamais substitués :
// si le service ne répond pas, le tirage continue avec l'aléa de l'appareil seul.
export const QRNG_URL = 'https://lfdr.de/qrng_api/qrng';
export const QRNG_LABEL = 'générateur quantique LfD (université Humboldt de Berlin)';

/** Lit une réponse du service ({"qrn":"A1B2…"}) ; undefined si elle n'a pas la forme attendue. */
export function parseQrng(body: unknown, n: number): Uint8Array | undefined {
  const hex = typeof body === 'object' && body ? String((body as { qrn?: unknown }).qrn ?? '') : '';
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < n * 2) return undefined;
  return Uint8Array.from({ length: n }, (_, i) => parseInt(hex.slice(i * 2, i * 2 + 2), 16));
}

export async function quantumBytes(n: number, timeoutMs = 2500, fetcher: typeof fetch = fetch): Promise<Uint8Array | undefined> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetcher(`${QRNG_URL}?length=${n}&format=HEX`, { signal: ctrl.signal, credentials: 'omit' });
    if (!res.ok) return undefined;
    return parseQrng(await res.json(), n);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/** Mélange (OU exclusif) : le résultat est au moins aussi imprévisible que la meilleure des deux sources. */
export function mixBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  return Uint8Array.from(a, (x, i) => x ^ (b[i % b.length] ?? 0));
}
