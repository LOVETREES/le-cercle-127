// Les symboles des rêves dessinés au trait (Grimoire, parcours).
import Svg, { Path } from 'react-native-svg';

import { colors } from '../lib/theme';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/* ---------- Symboles : icônes au trait ---------- */
export const ICON: Record<string, string> = {
  eau: 'M3 8c3-2 5 2 8 0s5-2 8 0M3 13c3-2 5 2 8 0s5-2 8 0M3 18c3-2 5 2 8 0s5-2 8 0',
  porte: 'M6 21V9a6 6 0 0 1 12 0v12M6 21h12M10 21v-7a2 2 0 0 1 4 0v7',
  chute: 'M12 3v12M8 11l4 4 4-4M5 21l3-3M19 21l-3-3M12 21v-2',
  maison: 'M4 11 12 4l8 7v9H4zM10 20v-5h4v5',
  foret: 'M12 3 7 11h3l-4 6h12l-4-6h3zM12 17v4',
  lune: 'M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z',
  feu: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 2 3 1-2 1-4 1-7z',
  oiseau: 'M3 12c4-1 6-5 9-5s3 3 3 3l5-1-4 4c-1 4-5 6-9 6l2-3c-3 0-5-2-6-4z',
  serpent: 'M4 18c3 0 3-4 6-4s3 4 6 4 3-4 3-7-2-5-5-5',
  etoile: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z',
};
const SYN: [RegExp, string][] = [
  [/eau|mer|lac|riviere|ocean|pluie|vague|fleuve|bain|nag/, 'eau'], [/porte|seuil|passage|couloir|cle/, 'porte'],
  [/chute|tomb|vide|falaise|precipice/, 'chute'], [/maison|chambre|enfance|demeure|ecole/, 'maison'],
  [/foret|arbre|bois|jardin|racine/, 'foret'], [/lune|nuit|ciel|etoile/, 'lune'], [/feu|flamme|incendie|soleil/, 'feu'],
  [/vol|oiseau|aile|envol/, 'oiseau'], [/serpent|animal|loup|chat|chien/, 'serpent'],
];
export const iconKey = (s: string) => SYN.find(([re]) => re.test(norm(s)))?.[1] ?? 'etoile';

export function SymbolIcon({ name, size = 28, color = colors.gold }: { name: string; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={ICON[name]} fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


/** Ce que chaque famille de symboles murmure (sens ouvert, jamais un verdict). */
export const SYMBOL_HINT: Record<string, string> = {
  eau: 'Des émotions qui circulent, demandent à couler.',
  porte: 'Un seuil : un choix ou un passage qui s’approche.',
  chute: 'Un lâcher-prise, ou la peur de perdre pied.',
  maison: 'Votre intériorité, ce qui vous abrite.',
  foret: 'Vos racines, l’inconnu fertile.',
  lune: 'L’intuition, les cycles, ce qui veille la nuit.',
  feu: 'Une énergie vive : désir, colère ou élan.',
  oiseau: 'Un besoin de liberté, de prendre de la hauteur.',
  serpent: 'L’instinct, une transformation en cours.',
  etoile: 'Un motif singulier, à écouter tel qu’il vient.',
};
