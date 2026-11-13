/**
 * Taschenrechner-Tastenfeld. Mehrstellige Eingabe, weil Quoten bis 50 gehen.
 * Eingaben, die die Range sprengen würden, werden mit Fehler-Haptik verweigert.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { feedback } from '@/feedback';
import { nextEntry } from './keypad-logic';
import { colors, fonts, layout } from './theme';

export function Keypad({
  value,
  max,
  onChange,
  onSubmit,
  submitLabel = 'OK',
}: {
  value: string;
  max: number;
  onChange: (next: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
}) {
  const press = (digit: number) => {
    const next = nextEntry(value, digit, max);
    if (next === null) {
      feedback.error();
      return;
    }
    onChange(next);
  };
  const keys: { label: string; a11y: string; onPress: () => void; kind: 'digit' | 'fn' | 'ok'; disabled?: boolean }[] = [
    ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => ({
      label: String(d),
      a11y: String(d),
      onPress: () => press(d),
      kind: 'digit' as const,
    })),
    { label: 'DEL', a11y: 'Löschen', onPress: () => onChange(value.slice(0, -1)), kind: 'fn', disabled: !value },
    { label: '0', a11y: '0', onPress: () => press(0), kind: 'digit' },
    { label: submitLabel, a11y: submitLabel, onPress: onSubmit, kind: 'ok', disabled: !value },
  ];

  return (
    <View style={styles.grid}>
      {keys.map((k) => (
        <Pressable
          key={k.label}
          accessibilityRole="button"
          accessibilityLabel={k.a11y}
          accessibilityState={{ disabled: !!k.disabled }}
          disabled={k.disabled}
          onPressIn={() => !k.disabled && feedback.key()}
          onPress={k.onPress}
          style={({ pressed }) => [
            styles.key,
            k.kind === 'fn' && styles.fn,
            k.kind === 'ok' && styles.ok,
            pressed && (k.kind === 'ok' ? styles.okPressed : styles.pressed),
            k.disabled && styles.disabled,
          ]}>
          {({ pressed }) => (
            <Text
              style={[
                styles.label,
                k.kind !== 'digit' && styles.small,
                k.kind === 'ok' && styles.okLabel,
                k.kind === 'ok' && k.label.length > 3 && styles.okLabelLong,
                pressed && k.kind === 'digit' && styles.pressedLabel,
              ]}>
              {k.label}
            </Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  key: {
    width: '31%',
    height: 64,
    backgroundColor: colors.surface,
    borderWidth: layout.border,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fn: { backgroundColor: 'transparent' },
  ok: { backgroundColor: colors.signal, borderColor: colors.signal },
  pressed: { backgroundColor: colors.text, borderColor: colors.text },
  okPressed: { backgroundColor: colors.text, borderColor: colors.text },
  disabled: { opacity: 0.3 },
  label: { fontFamily: fonts.pixelBold, fontSize: 28, color: colors.text },
  small: { fontSize: 16, color: colors.text2 },
  okLabel: { color: colors.ink, fontSize: 18 },
  okLabelLong: { fontSize: 13, letterSpacing: 0.5 },
  pressedLabel: { color: colors.ink },
});
