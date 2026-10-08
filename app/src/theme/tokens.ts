// Design tokens from the Claude Design handoff (JapExpress v3, Modernist system
// recoloured to the JapExpress brand). Corners: buttons 12, cards 14, inputs 10,
// badges 6, switches fully round; heavy 2px rules between sections.
export const color = {
  navy: '#1A3C6E',
  navyHover: '#24497F',
  orange: '#E87722',
  orangePressed: '#D2681A',
  orangeText: '#B85A10', // accent text on light ground (contrast-safe)
  orangeSoft: '#FDEBDC',
  orangeSoftText: '#9A4A0B',
  peach: '#F5B27A', // kicker text on navy
  ink: '#12233F',
  bg: '#F8F9FA',
  surface: '#EEF1F5',
  white: '#FFFFFF',
  line: '#D3D9E2',
  lineStrong: '#12233F',
  muted: '#5A6475',
  body: '#3C4A60',
  label: '#4A5568',
  faint: '#A3ABB8',
  track: '#B9C1CD',
  rangeFill: '#DCE4F0',
  blocked: '#E3E7ED',
  green: '#157F3D',
  greenSoft: '#E3F4E9',
  greenText: '#0F5E2C',
  night: '#0E1B2E',
  scrim: 'rgba(11,20,36,.55)',
  mtn: '#FFCB00',
  orangeMoney: '#FF6600',
  paypal: '#003087',
  gold: '#FFF4C2',
  goldText: '#6B5200',
} as const;

export const radius = { badge: 6, sm: 8, input: 10, button: 12, card: 14, sheet: 15, pill: 15 } as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const;

export const font = {
  regular: 'Archivo_400Regular',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  heavy: 'Archivo_800ExtraBold',
} as const;

export const rule = { strong: 2, hair: 1 } as const;
