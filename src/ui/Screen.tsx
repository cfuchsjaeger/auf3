import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout } from './theme';

export function Screen({
  children,
  scroll = false,
  background = colors.ground,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  background?: string;
  style?: ViewStyle;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.fill, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: background }]} edges={['top', 'bottom']}>
      <View style={styles.column}>{body}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  // Auf Tablet und Web bleibt das Layout handybreit.
  column: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  content: { paddingHorizontal: layout.gutter, paddingTop: 16, paddingBottom: 20, gap: 20, flexGrow: 1 },
});
