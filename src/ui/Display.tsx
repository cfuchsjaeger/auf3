/**
 * Das LCD-Feld. Jede Ziffer steht in einer festen Zelle mit schwacher "8" dahinter,
 * wie ein Taschenrechner, dessen ungenutzte Segmente man im Dunkeln noch sieht.
 * Feste Zellen sind nötig, weil die Pixelschrift proportional ist.
 */
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, layout } from './theme';

export function Display({
  value,
  label,
  corner,
  height = 170,
  fontSize = 120,
  align = 'center',
  color = colors.signal,
  testID,
}: {
  value: string;
  label?: string;
  corner?: string;
  height?: number;
  fontSize?: number;
  align?: 'center' | 'right';
  color?: string;
  testID?: string;
}) {
  const chars = value.split('');
  const cells = Math.max(2, chars.length);
  const padded = [...Array<string>(cells - chars.length).fill(''), ...chars];
  const cellWidth = Math.round(fontSize * 0.82);
  const lineHeight = Math.round(fontSize * 1.05);

  return (
    <View
      style={[styles.box, { height, alignItems: align === 'right' ? 'flex-end' : 'center' }]}
      accessible
      accessibilityLabel={label ? `${label}: ${value}` : value}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {corner ? <Text style={[styles.label, styles.corner]}>{corner}</Text> : null}
      <View style={styles.row}>
        {padded.map((ch, i) => (
          <View key={i} style={{ width: cellWidth, height: lineHeight, alignItems: 'center', justifyContent: 'center' }}>
            <Text aria-hidden style={[styles.digit, styles.ghost, { fontSize, lineHeight }]}>
              8
            </Text>
            <Text style={[styles.digit, { fontSize, lineHeight, color }]}>{ch}</Text>
          </View>
        ))}
      </View>
      {/* Für Tests und Screenreader: der Wert als ein Text. */}
      <Text testID={testID} style={styles.hidden}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.lcd,
    borderWidth: layout.border,
    borderColor: colors.line,
    paddingHorizontal: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: { flexDirection: 'row' },
  label: {
    position: 'absolute',
    top: 10,
    left: 14,
    fontFamily: fonts.pixel,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.text2,
  },
  corner: { left: undefined, right: 14 },
  digit: { fontFamily: fonts.pixelBold, color: colors.signal, textAlign: 'center' },
  ghost: { position: 'absolute', opacity: 0.07 },
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
