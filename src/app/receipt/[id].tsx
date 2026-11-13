import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Share, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { playerById, type Quote, type Session } from '@/domain';
import { feedback } from '@/feedback';
import { findSessionWithQuote, useStore } from '@/state/store';
import { BlockButton } from '@/ui/BlockButton';
import { Receipt, type ReceiptRef } from '@/ui/Receipt';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts } from '@/ui/theme';

const PRINT_MS = 900;

function shareText(session: Session, quote: Quote): string {
  const dare = session.dares.find((d) => d.quoteId === quote.id);
  const who = dare ? playerById(session, dare.owedBy).name : null;
  const head = who ? `${who} muss: ${quote.dare}` : `Quote überlebt: ${quote.dare}`;
  return `${head}\nQuote ${quote.range} · ${session.name}\ngequotet mit Auf 3`;
}

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { store, settle } = useStore();
  const session = findSessionWithQuote(store, id);
  const quote = session?.quotes.find((q) => q.id === id);
  const ref = useRef<ReceiptRef>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    feedback.print();
    Animated.timing(progress, {
      toValue: 1,
      duration: PRINT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  if (!session || !quote) return <Redirect href="/" />;
  const dare = session.dares.find((d) => d.quoteId === quote.id);

  const share = async () => {
    try {
      if (Platform.OS !== 'web' && ref.current && (await isAvailableAsync())) {
        const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
        await shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Beleg teilen' });
        return;
      }
      await Share.share({ message: shareText(session, quote) });
    } catch {
      setError('Teilen hat nicht geklappt.');
    }
  };

  const doSettle = (action: 'confirm' | 'veto') => {
    if (!dare) return;
    const res = settle(dare.id, action);
    if (!res.ok) {
      feedback.error();
      setError(res.error);
      return;
    }
    if (action === 'confirm') feedback.hit();
    else feedback.miss();
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <T variant="label">BELEG</T>
        <T variant="label">{quote.range ? `QUOTE ${quote.range}` : ''}</T>
      </View>
      <View style={styles.slot}>
        <Animated.View
          style={{
            transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-640, 0] }) }],
          }}>
          <Receipt ref={ref} session={session} quote={quote} />
        </Animated.View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: 10 }}>
        <BlockButton testID="share" label="TEILEN" onPress={share} />
        {dare && dare.status === 'open' ? (
          <View style={styles.row}>
            <BlockButton
              label={`Erledigt · ${playerById(session, dare.owedTo).name} bestätigt`}
              variant="ghost"
              size="md"
              ghostColor={colors.signal}
              onPress={() => doSettle('confirm')}
              style={{ flex: 1 }}
            />
          </View>
        ) : null}
        <BlockButton label="Zurück" variant="ghost" size="md" onPress={() => router.dismissTo('/')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  slot: { overflow: 'hidden', paddingRight: 8, paddingBottom: 8, alignItems: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
});
