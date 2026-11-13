/**
 * Der Beleg: das Artefakt, das geteilt wird. Weißes Papier, gestrichelte Trenner, Zackenkante.
 */
import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatOneIn, playerById, timesPicked, type Quote, type Session } from '@/domain';
import { colors, fonts } from './theme';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function receiptNumber(session: Session, quote: Quote): string {
  const index = session.quotes.findIndex((q) => q.id === quote.id);
  return `#${String(index + 1).padStart(4, '0')}`;
}

function formatStamp(ms: number) {
  const d = new Date(ms);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_LABEL = { open: 'OFFEN', done: 'ERLEDIGT', vetoed: 'VETO' } as const;

export type ReceiptRef = ComponentRef<typeof View>;

export function Receipt({ session, quote, ref }: { session: Session; quote: Quote; ref?: Ref<ReceiptRef> }) {
  const challenger = playerById(session, quote.challengerId);
  const target = playerById(session, quote.targetId);
  const dare = session.dares.find((d) => d.quoteId === quote.id);
  const lastRound = quote.rounds[quote.rounds.length - 1];
  const outcome = quote.outcome;
  const loser = dare ? playerById(session, dare.owedBy) : null;
  const habit = outcome?.kind === 'hit' && loser ? timesPicked(session, loser.id, outcome.value) : 0;

  return (
    <View ref={ref} collapsable={false} style={styles.wrap}>
      <View style={styles.paper}>
        <View style={styles.head}>
          <Text style={styles.brand}>AUF 3</Text>
          <Text style={styles.muted}>{session.name.toUpperCase()}</Text>
          <Text style={styles.muted}>{formatStamp(quote.resolvedAt ?? quote.createdAt)}</Text>
        </View>
        <View style={styles.rule} />
        <Line left="QUOTE" right={String(quote.range ?? '–')} />
        {quote.range ? <Line left="RISIKO" right={formatOneIn(quote.range).toUpperCase()} /> : null}
        {quote.rounds.map((r) =>
          r.picks.challenger !== undefined && r.picks.target !== undefined ? (
            <View key={r.no} style={styles.roundBlock}>
              <Text style={styles.muted}>{r.no === 1 ? 'RUNDE 1' : 'GEGENQUOTE'}</Text>
              <Line left={challenger.name.toUpperCase()} right={String(r.picks.challenger)} />
              <Line left={target.name.toUpperCase()} right={String(r.picks.target)} />
            </View>
          ) : null,
        )}
        <View style={styles.rule} />
        <Line
          left={outcome?.kind === 'hit' ? 'TREFFER' : quote.status === 'declined' ? 'ABGELEHNT' : 'DANEBEN'}
          right={outcome?.kind === 'hit' ? (outcome.round === 1 ? 'R1' : 'R2') : ''}
          strong
        />
        <View style={styles.dareBlock}>
          <Text style={styles.muted}>{loser ? `${loser.name.toUpperCase()} MUSS` : 'DIE AUFGABE'}</Text>
          <Text style={styles.dare}>{quote.dare}</Text>
        </View>
        <View style={styles.rule} />
        {dare ? <Line left="STATUS" right={STATUS_LABEL[dare.status]} /> : <Line left="STATUS" right="NIEMAND MUSS" />}
        {loser && outcome?.kind === 'hit' && habit >= 2 ? (
          <Line left={`${loser.name.toUpperCase()}S ${outcome.value}ER`} right={String(habit)} />
        ) : null}
        <View style={styles.barcode} aria-hidden>
          {Array.from({ length: 46 }, (_, i) => (
            <View key={i} style={{ width: [1, 2, 1, 3, 1, 2][(i * 7 + (lastRound?.no ?? 1)) % 6], backgroundColor: colors.ink }} />
          ))}
        </View>
        <Text style={[styles.muted, styles.center]}>gequotet mit Auf 3 {receiptNumber(session, quote)}</Text>
      </View>
      <View style={styles.zigzag} aria-hidden>
        {Array.from({ length: 25 }, (_, i) => (
          <View key={i} style={styles.tooth} />
        ))}
      </View>
    </View>
  );
}

function Line({ left, right, strong = false }: { left: string; right: string; strong?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.mono, strong && styles.strong]}>{left}</Text>
      <Text style={[styles.mono, strong && styles.strong]}>{right}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 300, alignSelf: 'center' },
  paper: { backgroundColor: colors.paper, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 16, gap: 10 },
  head: { alignItems: 'center', gap: 4 },
  brand: { fontFamily: fonts.pixelBold, fontSize: 20, color: colors.ink, letterSpacing: 2 },
  muted: { fontFamily: fonts.pixel, fontSize: 11, color: colors.inkMuted, letterSpacing: 0.5 },
  center: { textAlign: 'center' },
  rule: { borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.ink },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  mono: { fontFamily: fonts.pixel, fontSize: 12, color: colors.ink, letterSpacing: 0.5 },
  strong: { fontFamily: fonts.pixelBold, fontSize: 16 },
  roundBlock: { gap: 4 },
  dareBlock: { gap: 4 },
  dare: { fontFamily: fonts.bodyBold, fontSize: 17, lineHeight: 21, color: colors.ink },
  barcode: { flexDirection: 'row', height: 40, justifyContent: 'space-between', marginTop: 4 },
  zigzag: { flexDirection: 'row', height: 12, overflow: 'hidden' },
  tooth: {
    width: 12,
    height: 12,
    backgroundColor: colors.paper,
    transform: [{ translateY: -6 }, { rotate: '45deg' }],
  },
});
