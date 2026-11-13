import { Pressable, StyleSheet, Text } from 'react-native';

import { feedback } from '@/feedback';
import { PixelAvatar } from './PixelAvatar';
import { colors, fonts, layout } from './theme';

export function PlayerChip({
  name,
  selected = false,
  disabled = false,
  onPress,
  badge,
}: {
  name: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${name}, ${badge}` : name}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPressIn={() => feedback.tick()}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <PixelAvatar name={name} size={40} />
      <Text numberOfLines={1} style={[styles.name, selected && styles.nameSelected]}>
        {name}
      </Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: '23%',
    minWidth: 72,
    backgroundColor: colors.surface,
    borderWidth: layout.border,
    borderColor: colors.line,
    paddingTop: 12,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 8,
  },
  selected: { borderColor: colors.signal },
  pressed: { borderColor: colors.text },
  disabled: { opacity: 0.3 },
  name: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.text, maxWidth: '90%' },
  nameSelected: { color: colors.signal },
  badge: { fontFamily: fonts.pixel, fontSize: 9, color: colors.signal, letterSpacing: 1 },
});
