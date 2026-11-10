// Laboratoire pédagogique : 7 qubits indépendants, un par Sœur (simulation mathématique locale).
// Chaque qubit est dans l'un des états |0⟩, |1⟩, |+⟩ ou |−⟩ ; H et X agissent qubit par qubit.
// Mesurer donne 7 bits = le masque d'une lame ; l'état 0000000 (aucune Sœur) n'est pas une lame.
// Cette simulation ne fournit PAS le hasard du tirage de l'Oracle.
export type QState = '0' | '1' | '+' | '-';

export const H: Record<QState, QState> = { '0': '+', '+': '0', '1': '-', '-': '1' };
export const X: Record<QState, QState> = { '0': '1', '1': '0', '+': '+', '-': '-' }; // |−⟩ ne change qu'à une phase près

export const isSuperposed = (q: QState) => q === '+' || q === '-';
export const ket = (q: QState) => (q === '+' ? '|+⟩' : q === '-' ? '|−⟩' : `|${q}⟩`);

/** Nombre d'issues possibles (toutes équiprobables) pour ces 7 qubits. */
export const outcomes = (qs: QState[]) => 2 ** qs.filter(isSuperposed).length;

/** Mesure : les qubits en superposition tombent sur 0 ou 1 (un bit aléatoire chacun). */
export function measure(qs: QState[], randomBits: (n: number) => number[]): { bits: number[]; mask: number } {
  const rnd = randomBits(qs.length);
  const bits = qs.map((q, i) => (q === '1' ? 1 : q === '0' ? 0 : rnd[i] & 1));
  return { bits, mask: bits.reduce((m, b, i) => m | (b << i), 0) };
}
