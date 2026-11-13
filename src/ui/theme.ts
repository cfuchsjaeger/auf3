/** Design-Tokens aus dem UI-Konzept (Plan, Revision 3). Scharfe Ecken, harte Schatten, drei Farben. */
export const colors = {
  ground: '#0B0B0C',
  surface: '#151517',
  line: '#2A2A2E',
  lineStrong: '#3A3A3F',
  text: '#F2F2EE',
  text2: '#9A9A94',
  signal: '#C6FF3D',
  warn: '#FF6A3D',
  lcd: '#0F140A',
  paper: '#F2F2EE',
  ink: '#0B0B0C',
  inkMuted: '#55554F',
} as const;

export const fonts = {
  pixel: 'Silkscreen_400Regular',
  pixelBold: 'Silkscreen_700Bold',
  body: 'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  bodyBold: 'SpaceGrotesk_700Bold',
} as const;

export const layout = {
  gutter: 20,
  border: 2,
  shadow: 6,
  touch: 44,
} as const;
