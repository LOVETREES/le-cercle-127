// Contenus repris de la version mobile de lecercle127.com.
import type { ImageSourcePropType } from 'react-native';

export { SITE } from './webpage';

export type Sister = {
  slug: string;
  name: string;
  verb: string; // libellé court sous l'avatar (comme sur l'accueil mobile)
  role: string;
  path: string;
  image: ImageSourcePropType;
};

export const SISTERS: Sister[] = [
  { slug: 'oni', name: 'Oni', verb: 'Lit les rêves', role: 'Elle lit votre rêve', path: '/oni-gardienne-des-reves/', image: require('../../assets/images/oni.webp') },
  { slug: 'alka', name: 'Alka', verb: 'Relie', role: 'Elle relie les motifs', path: '/alka-tisseuse-des-connexions/', image: require('../../assets/images/alka.webp') },
  { slug: 'naia', name: 'Naïa', verb: 'Apaise', role: 'Elle apaise les émotions', path: '/naia-gardienne-des-emotions/', image: require('../../assets/images/naia.webp') },
  { slug: 'terra', name: 'Terra', verb: 'Enracine', role: 'Elle ramène au corps', path: '/terra-gardienne-de-lancrage/', image: require('../../assets/images/terra.webp') },
  { slug: 'ignis', name: 'Ignis', verb: 'Agit', role: 'Elle passe à l’action', path: '/ignis-flamme-de-la-transformation/', image: require('../../assets/images/ignis.webp') },
  { slug: 'astria', name: 'Astria', verb: 'Oriente', role: 'Elle oriente vers vos envies', path: '/astria-etoile-des-aspirations/', image: require('../../assets/images/astria.webp') },
  { slug: 'irma', name: 'Irma', verb: 'Choisit', role: 'Elle aide à choisir', path: '/irma-gardienne-des-choix/', image: require('../../assets/images/irma.webp') },
];

export type LinkItem = { title: string; subtitle: string; path: string; icon: string };

// « Le Cercle 127 — Apprendre » sur l'accueil mobile.
export const LEARN: LinkItem[] = [
  { title: 'Rêve lucide', subtitle: 'Savoir qu’on rêve, pour agir dans ses rêves.', path: '/reve-lucide/', icon: '☾' },
  { title: 'Laboratoire', subtitle: 'Des exercices simples chaque semaine.', path: '/laboratoire-des-reveurs/', icon: '⚗' },
  { title: 'Carnet vocal', subtitle: 'Gardez votre voix et transformez-la en texte.', path: '/carnet-vocal/', icon: '🎙' },
  { title: 'Suis-je en train de rêver ?', subtitle: 'Quelques gestes simples pour le savoir.', path: '/verification-des-reves/', icon: '◉' },
];

// « Explorer » sur l'accueil mobile (sans l'offre payante, vendue uniquement sur le site).
export const EXPLORE: LinkItem[] = [
  { title: 'Grand Labyrinthe', subtitle: 'Un parcours guidé à travers les symboles.', path: '/labyrinthe-du-grimoire/', icon: '◎' },
  { title: 'Les 127 portes', subtitle: 'Une question à la fois, porte après porte.', path: '/les-127-portes/', icon: '⌂' },
  { title: 'Le Cercle des 7 Sœurs', subtitle: 'Sept regards, une même trame vivante.', path: '/%e2%9c%a6-le-cercle-des-soeurs-%e2%9c%a6/', icon: '✦' },
  { title: 'Cauchemar : comprendre et s’apaiser', subtitle: 'Quand la nuit a été lourde.', path: '/cauchemar-comprendre-et-sapaiser-lonirologue/', icon: '☁' },
];

export const LEGAL: { title: string; path: string }[] = [
  { title: 'Mentions légales', path: '/mentions-legales/' },
  { title: 'Confidentialité', path: '/confidentialite/' },
];

export const DISCLAIMER = 'Le Cercle 127 est un compagnon de réflexion, pas un substitut à un accompagnement thérapeutique.';

export const IMAGES = {
  hero: require('../../assets/images/home-hero.webp'),
  grimoire: require('../../assets/images/home-grimoire.webp'),
  oracle: require('../../assets/images/home-oracle.webp'),
  symboles: require('../../assets/images/home-symboles.webp'),
  oni: require('../../assets/images/home-oni.webp'),
  logo: require('../../assets/brand/icon.png'),
};
