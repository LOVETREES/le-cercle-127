// Palette et typographie reprises du site lecercle127.com (nuit et or).
export const colors = {
  night: '#080b17',
  surface: '#111528',
  surfaceRaised: '#1a1f38',
  border: 'rgba(216, 182, 107, 0.28)',
  gold: '#d8b66b',
  goldDeep: '#b8924a',
  goldSoft: '#e8cf8f',
  onGold: '#1b1730',
  text: '#f2ede2',
  muted: '#a9a4b8',
  danger: '#e48a8a',
  success: '#9fd3b0',
} as const;

// La couleur de chaque Sœur, la même que sur le site.
export const sisters = {
  oni: '#d9cdfb',
  alka: '#a9c2f7',
  naia: '#8fdad3',
  terra: '#a9c98a',
  ignis: '#eb9a68',
  astria: '#f2dea8',
  irma: '#f3f1fb',
} as const;

/** Une couleur hexadécimale avec de la transparence (bordures et fonds teintés). */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export const fonts = {
  title: 'CormorantGaramond_500Medium',
  titleItalic: 'CormorantGaramond_500Medium_Italic',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodyBold: 'Manrope_600SemiBold',
} as const;

// Échelle des tailles de texte.
export const textSize = { xs: 11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, display: 34 } as const;

export const space = { xxs: 2, xs: 4, sm: 8, ms: 12, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
