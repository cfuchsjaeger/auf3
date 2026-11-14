import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openDares, playerById, TITLE_LABEL, titlesFor, titlesOf } from '@/domain';
import { useStore } from '@/state/store';
import { BlockButton } from '@/ui/BlockButton';
import { PlayerChip } from '@/ui/PlayerChip';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

function daysAgo(ms: number): string {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days <= 0) return 'seit heute';
  if (days === 1) return 'seit gestern';
  return `seit ${days} Tagen`;
}

export default function Start() {
  const { session, store } = useStore();
  if (!session) return <Welcome hasArchive={store.archive.length > 0} />;

  const open = openDares(session);
  const oldest = open[0];
  const running = [...session.quotes].reverse().find((q) => q.status === 'awaitingRange' || q.status === 'picking');
  const others = session.players.filter((p) => p.id !== store.meId);
  const titles = titlesFor(session);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text style={styles.wordmark}>AUF 3</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrechnung ${session.name}`}
          onPress={() => router.push('/ledger')}
          style={({ pressed }) => [styles.pill, pressed && { borderColor: colors.signal }]}>
          <View style={styles.pillDot} />
          <Text numberOfLines={1} style={styles.pillText}>
            {session.name.toUpperCase()} · {session.players.length}
          </Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <BlockButton
          testID="quote-button"
          label="QUOTE"
          size="hero"
          accessibilityHint="Neue Quote stellen"
          onPress={() => router.push('/quote/new')}
          style={{ width: 280 }}
        />
        <T variant="body" style={styles.tagline}>
          Tippen. Jemanden aussuchen. Fertig.
        </T>
      </View>

      {running ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/quote/${running.id}`)}
          style={({ pressed }) => [styles.card, styles.cardSignal, pressed && styles.cardPressed]}>
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="label">LAUFENDE QUOTE</T>
            <T variant="bodyStrong" numberOfLines={1}>
              {playerById(session, running.challengerId).name} → {playerById(session, running.targetId).name}:{' '}
              {running.dare}
            </T>
          </View>
          <Text style={[styles.bigNumber, { color: colors.signal }]}>▶</Text>
        </Pressable>
      ) : null}

      {open.length > 0 && oldest ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/ledger')}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
          <View style={{ flex: 1, gap: 2 }}>
            <T variant="label">OFFENE SCHULDEN</T>
            <T variant="bodyStrong">
              {playerById(session, oldest.owedBy).name} schuldet {playerById(session, oldest.owedTo).name}{' '}
              {daysAgo(oldest.createdAt)}.
            </T>
          </View>
          <Text style={styles.bigNumber}>{open.length}</Text>
        </Pressable>
      ) : null}

      <View style={{ gap: 10 }}>
        <T variant="label">DIREKT QUOTEN</T>
        <View style={styles.grid}>
          {others.map((p) => (
            <PlayerChip
              key={p.id}
              name={p.name}
              badge={titlesOf(titles, p.id).map((t) => TITLE_LABEL[t])[0]}
              onPress={() => router.push({ pathname: '/quote/new', params: { target: p.id } })}
            />
          ))}
        </View>
      </View>

      <BlockButton testID="open-crews" label="Gruppen" variant="ghost" size="md" onPress={() => router.push('/crews')} />
    </Screen>
  );
}

function Welcome({ hasArchive }: { hasArchive: boolean }) {
  return (
    <Screen style={{ justifyContent: 'space-between' }}>
      <View style={{ gap: 28, marginTop: 40 }}>
        <Text style={[styles.wordmark, styles.wordmarkXL]}>AUF 3</Text>
        <T variant="title">Das Quotenspiel.{'\n'}Für den Tisch.</T>
        <View style={{ gap: 14 }}>
          {[
            ['1', 'Jemand quotet dich. Du setzt die Quote: 2 ist mutig, 50 ist feig.'],
            ['2', 'Beide tippen geheim eine Zahl. Handy umdrehen, auf 3 aufdecken.'],
            ['3', 'Gleiche Zahl: du musst. Daneben: Gegenquote, gleiche Range.'],
          ].map(([n, text]) => (
            <View key={n} style={{ flexDirection: 'row', gap: 14 }}>
              <Text style={styles.step}>{n}</Text>
              <T variant="body" style={{ flex: 1, color: colors.text2 }}>
                {text}
              </T>
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <BlockButton testID="start-event" label="EVENT STARTEN" onPress={() => router.push('/setup')} />
        <BlockButton testID="open-crews" label="Gruppen" variant="ghost" size="md" onPress={() => router.push('/crews')} />
        {hasArchive ? (
          <BlockButton
            label="Letztes Event ansehen"
            variant="ghost"
            size="md"
            onPress={() => router.push({ pathname: '/ledger', params: { archive: '0' } })}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  wordmark: { fontFamily: fonts.pixelBold, fontSize: 22, letterSpacing: 1, color: colors.signal },
  wordmarkXL: { fontSize: 64, lineHeight: 70 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: layout.border,
    borderColor: colors.text,
    paddingHorizontal: 10,
    minHeight: layout.touch,
    flexShrink: 1,
  },
  pillDot: { width: 10, height: 10, backgroundColor: colors.signal },
  pillText: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.5, color: colors.text, flexShrink: 1 },
  hero: { alignItems: 'center', gap: 18, paddingVertical: 12 },
  tagline: { color: colors.text2, textAlign: 'center' },
  card: {
    borderWidth: layout.border,
    borderColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardSignal: { borderColor: colors.signal },
  cardPressed: { backgroundColor: colors.surface },
  bigNumber: { fontFamily: fonts.pixelBold, fontSize: 32, color: colors.warn },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  step: { fontFamily: fonts.pixelBold, fontSize: 22, color: colors.signal, width: 20 },
});
