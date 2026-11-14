import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import {
  computeStats,
  formatDecimal,
  headToHead,
  leaderboard,
  MAX_RANGE,
  MIN_RANGE,
  mutRoast,
  playerById,
  TITLE_HINT,
  TITLE_LABEL,
  titlesFor,
  titlesOf,
  type Board,
  type PlayerStats,
  type Title,
} from '@/domain';
import { feedback } from '@/feedback';
import { useStore } from '@/state/store';
import { BlockButton } from '@/ui/BlockButton';
import { fitPixelSize } from '@/ui/keypad-logic';
import { PixelAvatar } from '@/ui/PixelAvatar';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

const TABS: { key: Board; label: string; hint: string }[] = [
  { key: 'mut', label: 'MUT', hint: '' },
  { key: 'lesen', label: 'LESEN', hint: 'Lesen = Treffer als Jäger minus erwartete Treffer. Wer den anderen kennt, liegt im Plus.' },
  { key: 'ehre', label: 'EHRE', hint: 'Ehre = erledigte Dares geteilt durch abgerechnete. Ein Veto drückt den Wert.' },
];

function display(board: Board, value: number | null): string {
  if (value === null) return '–';
  if (board === 'mut') return `Ø ${formatDecimal(value)}`;
  if (board === 'lesen') return `${value >= 0 ? '+' : '−'}${formatDecimal(Math.abs(value))}`;
  return `${Math.round(value * 100)} %`;
}

function barShare(board: Board, value: number | null, all: (number | null)[]): number {
  if (value === null) return 0;
  if (board === 'mut') return (MAX_RANGE - value) / (MAX_RANGE - MIN_RANGE);
  if (board === 'ehre') return value;
  const nums = all.filter((v): v is number => v !== null);
  const min = Math.min(...nums, 0);
  const max = Math.max(...nums, 0);
  return max === min ? 0.5 : (value - min) / (max - min);
}

export default function Ledger() {
  const params = useLocalSearchParams<{ archive?: string }>();
  const { store, settle, endEvent, updateSettings } = useStore();
  const archived = params.archive !== undefined;
  const session = archived ? store.archive[Number(params.archive)] : store.session;
  const [board, setBoard] = useState<Board>('mut');
  const [confirmEnd, setConfirmEnd] = useState(false);

  if (!session) return <Redirect href="/" />;

  const stats = computeStats(session);
  const rows = leaderboard(session, board, stats);
  const titles = titlesFor(session, stats);
  const awarded = (Object.keys(TITLE_LABEL) as Title[]).filter((t) => titles[t]);
  const duels = session.players
    .flatMap((a, i) =>
      session.players.slice(i + 1).map((b) => ({ a, b, ...headToHead(session, a.id, b.id) })),
    )
    .filter((d) => d.duels > 0)
    .sort((x, y) => y.duels - x.duels);
  const hits = session.quotes.filter((q) => q.outcome?.kind === 'hit').length;
  const vetos = session.dares.filter((d) => d.status === 'vetoed').length;
  const open = session.dares.filter((d) => d.status === 'open');
  const ranked = rows.filter((r) => r.value !== null);
  const last = board === 'mut' && ranked.length >= 2 ? playerById(session, ranked[ranked.length - 1].playerId).name : null;
  const hint = board === 'mut' ? mutRoast(last, session.id) : TABS.find((t) => t.key === board)!.hint;

  return (
    <Screen scroll>
      <View style={{ gap: 6 }}>
        <T variant="label">{archived ? 'ABGESCHLOSSEN' : 'EVENT LÄUFT'}</T>
        <Text style={[styles.title, { fontSize: fitPixelSize(session.name, 340, 30), lineHeight: fitPixelSize(session.name, 340, 30) + 4 }]}>
          {session.name.toUpperCase()}
        </Text>
        <T variant="body" style={{ color: colors.text2 }}>
          {session.quotes.length} Quoten · {hits} Treffer · {vetos} Veto
        </T>
      </View>

      {awarded.length > 0 ? (
        <View style={styles.titleRow} testID="titles">
          {awarded.map((t) => (
            <View key={t} style={styles.titleCard} accessible accessibilityLabel={`${TITLE_LABEL[t]}: ${playerById(session, titles[t]!).name}. ${TITLE_HINT[t]}`}>
              <PixelAvatar name={playerById(session, titles[t]!).name} size={28} />
              <View style={{ gap: 2, flexShrink: 1 }}>
                <Text style={styles.titleLabel}>{TITLE_LABEL[t]}</Text>
                <Text style={styles.titleName} numberOfLines={1}>
                  {playerById(session, titles[t]!).name}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t, i) => {
          const active = t.key === board;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                feedback.tick();
                setBoard(t.key);
              }}
              style={[styles.tab, i > 0 && styles.tabDivider, active && styles.tabActive]}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 10 }}>
        {rows.map((row) => {
          const player = playerById(session, row.playerId);
          // Hervorheben erst, wenn es wirklich einen Vergleich gibt: Wer als Einziger Daten hat,
          // ist nicht automatisch vorne (z. B. 0 % Ehre nach einem Veto).
          const lead = row.rank === 1 && row.value !== null && ranked.length >= 2;
          const share = barShare(board, row.value, rows.map((r) => r.value));
          return (
            <View key={row.playerId} style={[styles.row, lead && styles.rowLead]}>
              <Text style={[styles.rank, lead && { color: colors.signal }]}>{row.value === null ? '–' : row.rank}</Text>
              <PixelAvatar name={player.name} size={36} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={styles.rowTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                    <Text style={styles.name}>{player.name}</Text>
                    {titlesOf(titles, player.id).map((t) => (
                      <Text key={t} style={styles.badge}>
                        {TITLE_LABEL[t]}
                      </Text>
                    ))}
                  </View>
                  <Text style={[styles.value, lead && { color: colors.signal }]}>{display(board, row.value)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { width: `${Math.round(share * 100)}%`, backgroundColor: lead ? colors.signal : colors.text },
                    ]}
                  />
                </View>
                <Detail board={board} s={stats[row.playerId]} />
              </View>
            </View>
          );
        })}
        <T variant="body" style={{ color: colors.text2, fontSize: 13 }}>
          {hint}
        </T>
      </View>

      {duels.length > 0 ? (
        <View style={styles.box} testID="duels">
          <T variant="label">DUELLE</T>
          {duels.map((d) => (
            <View key={`${d.a.id}-${d.b.id}`} style={styles.duel}>
              <Text style={[styles.duelName, d.aOverB > d.bOverA && styles.duelLead]}>{d.a.name}</Text>
              <Text style={styles.duelScore}>
                {d.aOverB} : {d.bOverA}
              </Text>
              <Text style={[styles.duelName, styles.duelRight, d.bOverA > d.aOverB && styles.duelLead]}>{d.b.name}</Text>
            </View>
          ))}
          <T variant="body" style={{ color: colors.text2, fontSize: 13 }}>
            Wer wen wie oft erwischt hat.
          </T>
        </View>
      ) : null}

      <View style={styles.box}>
        <T variant="label">SCHULDENSTAND</T>
        {open.length === 0 ? (
          <T variant="body" style={{ color: colors.text2 }}>
            Niemand schuldet niemandem was. Verdächtig.
          </T>
        ) : (
          open.map((d) => (
            <View key={d.id} style={styles.debt}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.debtWho}>
                  {playerById(session, d.owedBy).name} → {playerById(session, d.owedTo).name}
                </Text>
                <T variant="body" numberOfLines={2} style={{ color: colors.text2, fontSize: 13 }}>
                  {d.text}
                </T>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${d.text}: erledigt, bestätigt von ${playerById(session, d.owedTo).name}`}
                onPress={() => {
                  if (settle(d.id, 'confirm').ok) feedback.hit();
                }}
                style={({ pressed }) => [styles.debtButton, pressed && { backgroundColor: colors.text }]}>
                <Text style={styles.debtButtonLabel}>ERLEDIGT</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${d.text}: Veto von ${playerById(session, d.owedBy).name}`}
                onPress={() => {
                  if (settle(d.id, 'veto').ok) feedback.miss();
                }}
                style={({ pressed }) => [styles.debtButton, styles.vetoButton, pressed && { borderColor: colors.text }]}>
                <Text style={[styles.debtButtonLabel, { color: colors.warn }]}>VETO</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={styles.box}>
        <T variant="label">EINSTELLUNGEN</T>
        <Setting label="Ton" value={store.settings.sound} onChange={(v) => updateSettings({ sound: v })} />
        <Setting label="Haptik" value={store.settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
      </View>

      <View style={{ gap: 10 }}>
        {session.quotes.some((q) => q.status === 'resolved' || q.status === 'declined') ? (
          <BlockButton
            testID="open-chronik"
            label="Chronik des Abends"
            variant="ghost"
            size="md"
            ghostColor={colors.text}
            onPress={() => router.push(archived ? { pathname: '/chronik', params: { archive: params.archive } } : '/chronik')}
          />
        ) : null}
        {!archived ? (
          confirmEnd ? (
            <BlockButton
              label="Wirklich beenden"
              variant="signal"
              onPress={() => {
                if (endEvent().ok) {
                  feedback.lock();
                  router.replace({ pathname: '/ledger', params: { archive: '0' } });
                }
              }}
            />
          ) : (
            <BlockButton label="Event beenden" variant="ghost" size="md" onPress={() => setConfirmEnd(true)} />
          )
        ) : (
          <BlockButton label="Neues Event" variant="signal" onPress={() => router.replace('/setup')} />
        )}
        <BlockButton label="Zurück" variant="ghost" size="md" onPress={() => router.dismissTo('/')} />
      </View>
    </Screen>
  );
}

function Detail({ board, s }: { board: Board; s: PlayerStats }) {
  const text =
    board === 'mut'
      ? `${s.quotesAsTarget} ${s.quotesAsTarget === 1 ? 'Quote' : 'Quoten'} als Target`
      : board === 'lesen'
        ? `${s.hits} Treffer aus ${s.huntedRounds} ${s.huntedRounds === 1 ? 'Jagd' : 'Jagden'}${s.favoritePick && s.favoritePick.count >= 2 ? ` · tippt gern ${s.favoritePick.value}` : ''}`
        : `${s.daresDone} erledigt · ${s.daresVetoed} Veto · ${s.daresOpen} offen`;
  return <Text style={styles.detail}>{text}</Text>;
}

function Setting({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.setting}>
      <T variant="bodyStrong">{label}</T>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.line, true: colors.signal }}
        thumbColor={colors.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.pixelBold, fontSize: 30, lineHeight: 34, color: colors.signal, letterSpacing: 1 },
  tabs: { flexDirection: 'row', borderWidth: layout.border, borderColor: colors.text },
  tab: { flex: 1, height: layout.touch, alignItems: 'center', justifyContent: 'center' },
  tabDivider: { borderLeftWidth: layout.border, borderColor: colors.text },
  tabActive: { backgroundColor: colors.text },
  tabLabel: { fontFamily: fonts.pixel, fontSize: 12, letterSpacing: 1, color: colors.text },
  tabLabelActive: { fontFamily: fonts.pixelBold, color: colors.ink },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: layout.border,
    borderColor: colors.signal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '48%',
    flexGrow: 1,
  },
  titleLabel: { fontFamily: fonts.pixelBold, fontSize: 10, color: colors.signal, letterSpacing: 1 },
  titleName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  badge: {
    fontFamily: fonts.pixelBold,
    fontSize: 9,
    color: colors.ink,
    backgroundColor: colors.signal,
    paddingHorizontal: 5,
    paddingVertical: 2,
    letterSpacing: 0.5,
  },
  duel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  duelName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text2 },
  duelRight: { textAlign: 'right' },
  duelLead: { color: colors.text },
  duelScore: { fontFamily: fonts.pixelBold, fontSize: 18, color: colors.signal, letterSpacing: 1, minWidth: 64, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: layout.border,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLead: { borderColor: colors.signal },
  rank: { fontFamily: fonts.pixelBold, fontSize: 22, color: colors.text2, width: 26 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
  // Body-Schrift, weil die Pixelschrift kein Ø hat.
  value: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text2 },
  barTrack: { height: 8, backgroundColor: colors.line },
  bar: { height: 8 },
  detail: { fontFamily: fonts.body, fontSize: 12, color: colors.text2 },
  box: { borderWidth: layout.border, borderColor: colors.text, padding: 16, gap: 12 },
  debt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  debtWho: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  debtButton: {
    height: layout.touch,
    paddingHorizontal: 10,
    backgroundColor: colors.signal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetoButton: { backgroundColor: 'transparent', borderWidth: layout.border, borderColor: colors.line },
  debtButtonLabel: { fontFamily: fonts.pixelBold, fontSize: 11, color: colors.ink, letterSpacing: 0.5 },
  setting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: layout.touch },
});
