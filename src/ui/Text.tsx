import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts } from './theme';

type Variant = 'label' | 'body' | 'bodyStrong' | 'title' | 'pixel' | 'pixelXL';

const VARIANTS: Record<Variant, TextStyle> = {
  label: { fontFamily: fonts.pixel, fontSize: 11, letterSpacing: 1, color: colors.text2 },
  body: { fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text, lineHeight: 22 },
  title: { fontFamily: fonts.bodyBold, fontSize: 26, color: colors.text, lineHeight: 30, letterSpacing: -0.3 },
  pixel: { fontFamily: fonts.pixelBold, fontSize: 20, color: colors.text, letterSpacing: 1.5 },
  pixelXL: { fontFamily: fonts.pixelBold, fontSize: 56, color: colors.text, letterSpacing: 2, lineHeight: 58 },
};

export function T({ variant = 'body', style, ...rest }: TextProps & { variant?: Variant }) {
  return <RNText {...rest} style={[VARIANTS[variant], style]} />;
}
