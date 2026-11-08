import type { Dream, User } from './model';
import { t } from '../i18n';

export const DEMO_USER: User = { id: 'demo-local', name: 'Démonstration locale' };
export function demoDreams(): Dream[] {
  return [
    {
      id: 'demo-forest', title: t('La forêt lumineuse'), dreamDate: '2026-11-06', createdAt: '2026-11-06T07:30:00Z',
      story: t('Exemple fictif : je marche dans une forêt. Une lumière apparaît entre les arbres et je me sens plus calme.'),
      emotion: 'serenite', intensity: 3, symbols: [t('La forêt'), t('La lumière')],
      oniReading: t('La lecture d’Oni\nExemple fictif de lecture : cette forêt peut évoquer un espace encore à explorer. La lumière pourrait représenter un repère, si cette piste vous parle.\n\nCe qui se joue\nUn passage de l’incertitude vers un sentiment d’appui.\n\nCe que le rêve laisse ouvert\nQuel détail de cette forêt souhaitez-vous retenir ?\n\nUne piste, jamais un diagnostic ni une prédiction.'),
    },
    { id: 'demo-house', title: t('La maison près du lac'), dreamDate: '2026-11-05', createdAt: '2026-11-05T08:00:00Z', story: t('Exemple fictif : une maison familière se trouve près d’un lac. Je cherche une clé.'), emotion: 'emerveillement', intensity: 2, symbols: [t('La maison'), t('La clé')] },
    { id: 'demo-key', title: t('La clé dans le jardin'), dreamDate: '2026-11-04', createdAt: '2026-11-04T07:00:00Z', story: t('Exemple fictif : je retrouve une clé sous un arbre et j’hésite à ouvrir une petite porte.'), emotion: 'surprise', intensity: 2, symbols: [t('La clé'), t('La porte')] },
  ];
}
