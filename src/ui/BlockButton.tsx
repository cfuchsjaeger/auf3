/**
 * Der Blockbutton: scharfe Kanten, harter Versatzschatten. Beim Drücken rutscht die Fläche
 * in den Schatten. Haptik schon bei pressIn, damit es sich sofort anfühlt.
 */
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { feedback } from '@/feedback';
import { colors, fonts, layout } from './theme';

type Variant = 'signal' | 'dark' | 'ghost' | 'paper';
type Size = 'hero' | 'lg' | 'md';

const PALETTE: Record<Variant, { bg: string; fg: string; border: string; shadow: string | null }> = {
  signal: { bg: colors.signal, fg: colors.ink, border: colors.signal, shadow: colors.text },
  dark: { bg: colors.ink, fg: colors.text, border: colors.ink, shadow: colors.text },
  paper: { bg: colors.paper, fg: colors.ink, border: colors.paper, shadow: colors.signal },
  ghost: { bg: 'transparent', fg: colors.text2, border: colors.line, shadow: null },
};

const SIZES: Record<Size, { height: number; font: number; shadow: number }> = {
  hero: { height: 260, font: 44, shadow: 8 },
  lg: { height: 64, font: 20, shadow: layout.shadow },
  md: { height: 48, font: 14, shadow: 0 },
};

export function BlockButton({
  label,
  onPress,
  variant = 'signal',
  size = 'lg',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  ghostColor,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  /** Textfarbe für ghost-Buttons auf farbigem Grund. */
  ghostColor?: string;
  testID?: string;
}) {
  const p = PALETTE[variant];
  const s = SIZES[size];
  const shadow = p.shadow && !disabled ? s.shadow : 0;
  const fg = variant === 'ghost' && ghostColor ? ghostColor : p.fg;
  const border = variant === 'ghost' && ghostColor ? ghostColor : p.border;

  return (
    <View style={[{ paddingRight: shadow, paddingBottom: shadow }, style]}>
      {shadow > 0 && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { top: shadow, left: shadow, backgroundColor: p.shadow! }]}
        />
      )}
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPressIn={() => feedback.key()}
        onPress={onPress}
        style={({ pressed }) => [
          styles.face,
          {
            height: s.height,
            backgroundColor: p.bg,
            borderColor: border,
            opacity: disabled ? 0.35 : 1,
            transform: pressed && shadow ? [{ translateX: shadow }, { translateY: shadow }] : [],
          },
        ]}>
        <Text
          style={[
            styles.label,
            { color: fg, fontSize: s.font, fontFamily: size === 'md' ? fonts.bodyBold : fonts.pixelBold },
          ]}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { borderWidth: layout.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  label: { letterSpacing: 2, textAlign: 'center' },
});
