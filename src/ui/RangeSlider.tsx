/**
 * Quoten-Leiste von 2 bis 50 zum Wischen. Jeder Schritt ist ein haptischer Rastpunkt.
 * Plus und Minus für präzise Eingabe, Screenreader bedienen sie als einstellbaren Regler.
 */
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { MAX_RANGE, MIN_RANGE } from '@/domain';
import { feedback } from '@/feedback';
import { rangeFromPosition } from './keypad-logic';
import { colors, fonts, layout } from './theme';

const STEPS = MAX_RANGE - MIN_RANGE + 1;

export function RangeSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [width, setWidth] = useState(1);
  // Zuletzt gemeldeter Wert. Nur in Event-Handlern gelesen, damit schnelle Wischbewegungen
  // vor dem nächsten Render nicht doppelt ticken.
  const lastEmitted = useRef(value);

  const set = (next: number) => {
    const clamped = Math.min(MAX_RANGE, Math.max(MIN_RANGE, next));
    if (clamped === lastEmitted.current) return;
    lastEmitted.current = clamped;
    feedback.tick();
    onChange(clamped);
  };

  const fromTouch = (e: GestureResponderEvent) =>
    set(rangeFromPosition(e.nativeEvent.locationX / width, MIN_RANGE, MAX_RANGE));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <StepButton label="−" a11y="Quote verringern" onPress={() => set(value - 1)} disabled={value <= MIN_RANGE} />
        <View
          style={styles.track}
          onLayout={(e) => setWidth(Math.max(1, e.nativeEvent.layout.width))}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Quote"
          accessibilityValue={{ min: MIN_RANGE, max: MAX_RANGE, now: value }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => set(value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={fromTouch}
          onResponderMove={fromTouch}>
          {Array.from({ length: STEPS }, (_, i) => {
            const n = MIN_RANGE + i;
            const major = n % 10 === 0 || n === MIN_RANGE;
            return (
              <View
                key={n}
                pointerEvents="none"
                style={[styles.tick, major && styles.major, n <= value && styles.filled, n === value && styles.active]}
              />
            );
          })}
        </View>
        <StepButton label="+" a11y="Quote erhöhen" onPress={() => set(value + 1)} disabled={value >= MAX_RANGE} />
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: colors.warn }]}>2 · MUTIG</Text>
        <Text style={styles.legendText}>WISCHEN</Text>
        <Text style={styles.legendText}>50 · FEIG</Text>
      </View>
    </View>
  );
}

function StepButton({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.step, pressed && styles.stepPressed, disabled && { opacity: 0.3 }]}>
      <Text style={styles.stepLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: {
    flex: 1,
    height: 52,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  tick: { width: 2, height: 12, backgroundColor: colors.lineStrong },
  major: { height: 22 },
  filled: { backgroundColor: colors.text2 },
  active: { width: 4, height: 44, backgroundColor: colors.signal },
  legend: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 54 },
  legendText: { fontFamily: fonts.pixel, fontSize: 10, color: colors.text2, letterSpacing: 0.5 },
  step: {
    width: layout.touch,
    height: layout.touch,
    borderWidth: layout.border,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPressed: { borderColor: colors.text },
  stepLabel: { fontFamily: fonts.pixelBold, fontSize: 22, color: colors.text, lineHeight: 26 },
});
