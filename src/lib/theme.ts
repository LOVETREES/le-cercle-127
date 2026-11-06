// Palette et typographie reprises du site lecercle127.com (nuit et or).
export const colors = {
  night: '#080b17',
  surface: '#111528',
  surfaceRaised: '#1a1f38',
  border: 'rgba(216, 182, 107, 0.28)',
  gold: '#d8b66b',
  goldDeep: '#b8924a',
  text: '#f2ede2',
  muted: '#a9a4b8',
  danger: '#e48a8a',
  success: '#9fd3b0',
} as const;

export const fonts = {
  title: 'CormorantGaramond_500Medium',
  titleItalic: 'CormorantGaramond_500Medium_Italic',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodyBold: 'Manrope_600SemiBold',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
