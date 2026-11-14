/** Der Abend als ein langer Bon: alle aufgelösten Quoten, Beleg an Beleg, teilbar als Bild. */
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { playerById, type Quote, type Session } from '@/domain';
import { feedback } from '@/feedback';
import { useStore } from '@/state/store';
import { BlockButton } from '@/ui/BlockButton';
import { fitPixelSize } from '@/ui/keypad-logic';
import { Receipt, type ReceiptRef } from '@/ui/Receipt';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts } from '@/ui/theme';

function summary(session: Session, quotes: Quote[]): string {
  const lines = quotes.map((q) => {
    const c = playerById(session, q.challengerId).name;
    const t = playerById(session, q.targetId).name;
    const dare = session.dares.find((d) => d.quoteId === q.id);
    const result =
      q.status === 'declined'
        ? `${t} lehnt ab`
        : dare
          ? `${playerById(session, dare.owedBy).name} muss`
          : 'niemand muss';
    return `${c} → ${t} (Quote ${q.range ?? '–'}): ${q.dare} · ${result}`;
  });
  return [`${session.name} · ${quotes.length} Quoten`, ...lines, 'gequotet mit Auf 3'].join('\n');
}

export default function Chronik() {
  const params = useLocalSearchParams<{ archive?: string }>();
  const { store } = useStore();
  const session = params.archive !== undefined ? store.archive[Number(params.archive)] : store.session;
  const ref = useRef<ReceiptRef>(null);
  const [error, setError] = useState<string | null>(null);

  if (!session) return <Redirect href="/" />;

  const quotes = [...session.quotes]
    .filter((q) => q.status === 'resolved' || q.status === 'declined')
    .sort((a, b) => a.createdAt - b.createdAt);
  const hits = quotes.filter((q) => q.outcome?.kind === 'hit').length;

  const share = async () => {
    feedback.print();
    try {
      if (Platform.OS !== 'web' && ref.current && (await isAvailableAsync())) {
        const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
        await shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Chronik teilen' });
        return;
      }
      await Share.share({ message: summary(session, quotes) });
    } catch {
      setError('Teilen hat nicht geklappt.');
    }
  };

  const size = fitPixelSize(session.name, 340, 30);

  return (
    <Screen scroll>
      <View style={{ gap: 6 }}>
        <T variant="label">CHRONIK</T>
        <Text style={[styles.title, { fontSize: size, lineHeight: size + 4 }]}>{session.name.toUpperCase()}</Text>
        <T variant="body" style={{ color: colors.text2 }}>
          {quotes.length} {quotes.length === 1 ? 'Quote' : 'Quoten'} · {hits} Treffer
        </T>
      </View>

      {quotes.length === 0 ? (
        <T variant="body" style={{ color: colors.text2 }}>
          Noch nichts passiert. Quotet jemanden.
        </T>
      ) : (
        <View ref={ref} collapsable={false} style={styles.roll} testID="chronik-roll">
          {quotes.map((q, i) => (
            <View key={q.id} style={i > 0 ? styles.gap : undefined}>
              <Receipt session={session} quote={q} />
            </View>
          ))}
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: 10 }}>
        {quotes.length > 0 ? <BlockButton testID="share-chronik" label="ALS BON TEILEN" onPress={share} /> : null}
        <BlockButton label="Zurück" variant="ghost" size="md" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.pixelBold, color: colors.signal, letterSpacing: 1 },
  roll: { backgroundColor: colors.ground, paddingVertical: 4, alignItems: 'center' },
  gap: { marginTop: 18 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
});
