/**
 * Ablauf einer Quote im Ein-Handy-Modus:
 *   Weitergeben → Range → (Weitergeben → Tippen) × 2 → AUF 3 → Countdown → Reveal
 *   → bei Fehlschlag in Runde 1: Gegenquote, gleiche Range, gleiche Schritte.
 * Die Spielregeln entscheidet die Domänenlogik, dieser Screen inszeniert nur.
 */
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  formatOneIn,
  formatPercent,
  hunterOf,
  loserIfHit,
  oddsFor,
  playerById,
  playerIdFor,
  rangeVerdict,
  revealLine,
  timesPicked,
  type Quote,
  type Role,
  type RoundNo,
  type Session,
} from '@/domain';
import { feedback } from '@/feedback';
import { useFaceDown } from '@/feedback/useFaceDown';
import { useStore } from '@/state/store';
import { BlockButton } from '@/ui/BlockButton';
import { Display } from '@/ui/Display';
import { Keypad } from '@/ui/Keypad';
import { PixelAvatar } from '@/ui/PixelAvatar';
import { RangeSlider } from '@/ui/RangeSlider';
import { Screen } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { colors, fonts, layout } from '@/ui/theme';

/** Runde 1: Das Target hält nach dem Setzen der Range das Handy, also tippt es zuerst. */
const PICK_ORDER: Record<RoundNo, Role[]> = { 1: ['target', 'challenger'], 2: ['challenger', 'target'] };

function isComplete(r: { picks: { challenger?: number; target?: number } }) {
  return r.picks.challenger !== undefined && r.picks.target !== undefined;
}

function initialRevealedRound(q: Quote | undefined): number {
  if (!q) return 0;
  if (q.status === 'resolved') return q.rounds.length;
  if (q.status === 'picking') return q.rounds.length - 1;
  return 0;
}

export default function QuoteFlow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, quoteEvent, settle } = useStore();
  const quote = session?.quotes.find((q) => q.id === id);

  const [passedTo, setPassedTo] = useState<Role | null>(null);
  const [revealedRound, setRevealedRound] = useState(() => initialRevealedRound(quote));
  const [showReveal, setShowReveal] = useState<number | null>(() =>
    quote?.status === 'resolved' && quote.rounds.length > 0 ? quote.rounds.length : null,
  );
  const [counting, setCounting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !quote) return <Redirect href="/" />;

  const challenger = playerById(session, quote.challengerId);
  const target = playerById(session, quote.targetId);
  const nameOf = (role: Role) => (role === 'challenger' ? challenger.name : target.name);

  const pendingRound = quote.rounds
    .filter(isComplete)
    .map((r) => r.no)
    .filter((n) => n > revealedRound)
    .reduce<number | null>((max, n) => (max === null || n > max ? n : max), null);

  const act = (res: { ok: true } | { ok: false; error: string }) => {
    if (!res.ok) {
      feedback.error();
      setError(res.error);
      return false;
    }
    setError(null);
    return true;
  };

  if (quote.status === 'declined') {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <T variant="pixelXL" style={{ color: colors.warn }}>
          ABGE{'\n'}LEHNT.
        </T>
        <T variant="bodyStrong">
          {target.name} kneift. Zählt im Mut-Ranking wie eine 50.
        </T>
        <BlockButton label="OK" onPress={() => router.dismissTo('/')} />
      </Screen>
    );
  }

  if (showReveal !== null) {
    const round = quote.rounds[showReveal - 1];
    return (
      <Reveal
        session={session}
        quote={quote}
        roundNo={round.no}
        onCounter={() => {
          setShowReveal(null);
          setPassedTo(null);
        }}
        onReceipt={() => router.replace(`/receipt/${quote.id}`)}
        onVeto={(dareId) => {
          if (act(settle(dareId, 'veto'))) router.replace(`/receipt/${quote.id}`);
        }}
        onDone={() => router.dismissTo('/')}
      />
    );
  }

  if (pendingRound !== null) {
    const round = quote.rounds[pendingRound - 1];
    if (counting) {
      return (
        <Countdown
          onDone={() => {
            setCounting(false);
            setRevealedRound(pendingRound);
            setShowReveal(pendingRound);
            const hit = round.picks.challenger === round.picks.target;
            if (hit) feedback.hit();
            else if (round.no === 1) feedback.counter();
            else feedback.miss();
          }}
        />
      );
    }
    return (
      <Ready
        challengerName={challenger.name}
        targetName={target.name}
        roundNo={round.no}
        onGo={() => {
          feedback.count();
          setCounting(true);
        }}
      />
    );
  }

  if (quote.status === 'awaitingRange') {
    if (passedTo !== 'target') {
      return <Pass name={target.name} purpose="range" onConfirm={() => setPassedTo('target')} />;
    }
    return (
      <RangeStage
        challengerName={challenger.name}
        dare={quote.dare}
        error={error}
        onSet={(range) => {
          if (act(quoteEvent(quote.id, { type: 'setRange', range }))) feedback.lock();
        }}
        onDecline={() => act(quoteEvent(quote.id, { type: 'decline' }))}
      />
    );
  }

  if (quote.status === 'picking' && quote.range !== null) {
    const round = quote.rounds[quote.rounds.length - 1];
    const role = PICK_ORDER[round.no].find((r) => round.picks[r] === undefined)!;
    const other: Role = role === 'challenger' ? 'target' : 'challenger';
    if (passedTo !== role) {
      return <Pass name={nameOf(role)} purpose="pick" roundNo={round.no} onConfirm={() => setPassedTo(role)} />;
    }
    return (
      <PickStage
        key={`${round.no}-${role}`}
        name={nameOf(role)}
        range={quote.range}
        roundNo={round.no}
        otherReady={round.picks[other] !== undefined ? nameOf(other) : null}
        error={error}
        onLock={(value) => {
          if (act(quoteEvent(quote.id, { type: 'pick', role, value }))) {
            feedback.lock();
            setPassedTo(null);
          }
        }}
      />
    );
  }

  return <Redirect href="/" />;
}

// ---------------------------------------------------------------------------

function Pass({
  name,
  purpose,
  roundNo,
  onConfirm,
}: {
  name: string;
  purpose: 'range' | 'pick';
  roundNo?: RoundNo;
  onConfirm: () => void;
}) {
  return (
    <Screen style={{ justifyContent: 'space-between' }}>
      <T variant="label">{purpose === 'pick' && roundNo === 2 ? 'GEGENQUOTE' : 'WEITERGEBEN'}</T>
      <View style={{ gap: 20, alignItems: 'flex-start' }}>
        <T variant="label">HANDY AN</T>
        <PixelAvatar name={name} size={80} />
        <T variant="pixelXL" style={{ color: colors.signal }}>
          {name.toUpperCase()}
        </T>
        <T variant="bodyStrong" style={{ color: colors.text2 }}>
          {purpose === 'range' ? `${name} setzt die Quote.` : 'Geheim tippen. Alle anderen schauen weg.'}
        </T>
      </View>
      <BlockButton testID="pass-confirm" label={`ICH BIN ${name.toUpperCase()}`} onPress={onConfirm} />
    </Screen>
  );
}

function RangeStage({
  challengerName,
  dare,
  error,
  onSet,
  onDecline,
}: {
  challengerName: string;
  dare: string;
  error: string | null;
  onSet: (range: number) => void;
  onDecline: () => void;
}) {
  const [range, setRange] = useState(10);
  const odds = oddsFor(range);
  return (
    <Screen scroll>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <PixelAvatar name={challengerName} size={30} />
          <T variant="label">{challengerName.toUpperCase()} QUOTET DICH</T>
        </View>
        <T variant="title">„{dare}“</T>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
        <T variant="label" style={{ textAlign: 'center' }}>
          DEINE QUOTE
        </T>
        <Display testID="range-value" value={String(range)} />
        <RangeSlider value={range} onChange={setRange} />
        <View style={styles.riskRow}>
          <View style={{ gap: 2 }}>
            <T variant="label">DEIN RISIKO</T>
            <Text style={styles.risk}>{formatOneIn(range)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', flexShrink: 1, gap: 2 }}>
            <Text style={[styles.verdict, range <= 6 && { color: colors.warn }]}>{rangeVerdict(range)}</Text>
            <T variant="body" style={{ color: colors.text2, fontSize: 13, textAlign: 'right' }}>
              Gegenrisiko {challengerName}: {formatPercent(odds.challengerMust)}
            </T>
          </View>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: 10 }}>
        <BlockButton testID="range-submit" label="QUOTE GEBEN" onPress={() => onSet(range)} />
        <BlockButton label="Ablehnen · zählt als 50" variant="ghost" size="md" onPress={onDecline} />
      </View>
    </Screen>
  );
}

function PickStage({
  name,
  range,
  roundNo,
  otherReady,
  error,
  onLock,
}: {
  name: string;
  range: number;
  roundNo: RoundNo;
  otherReady: string | null;
  error: string | null;
  onLock: (value: number) => void;
}) {
  const [entry, setEntry] = useState('');
  const valid = entry !== '' && Number(entry) >= 1 && Number(entry) <= range;
  const lock = () => valid && onLock(Number(entry));
  const flipAvailable = useFaceDown(valid, lock);

  return (
    <Screen>
      <View style={styles.pickHeader}>
        <T variant="label">
          QUOTE {range} · {roundNo === 1 ? 'RUNDE 1' : 'GEGENQUOTE'}
        </T>
        {otherReady ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, backgroundColor: colors.signal }} />
            <Text style={styles.readyText}>{otherReady.toUpperCase()} IST BEREIT</Text>
          </View>
        ) : null}
      </View>
      <T variant="bodyStrong">{name} tippt, geheim.</T>
      <Display
        testID="pick-value"
        value={entry === '' ? '_' : entry}
        corner={`1 – ${range}`}
        align="right"
        height={140}
        fontSize={104}
      />
      <Keypad value={entry} max={range} onChange={setEntry} onSubmit={lock} submitLabel="SPERREN" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.flipHint}>
        <Text style={styles.flipTitle}>{flipAvailable ? 'HANDY UMDREHEN' : 'SPERREN, DANN WEITERGEBEN'}</Text>
        <T variant="body" style={{ color: colors.text2, fontSize: 13 }}>
          {flipAvailable
            ? 'Display nach unten sperrt deine Zahl. Oder SPERREN drücken.'
            : 'Niemand sieht deine Zahl. Danach ist die andere Person dran.'}
        </T>
      </View>
    </Screen>
  );
}

function Ready({
  challengerName,
  targetName,
  roundNo,
  onGo,
}: {
  challengerName: string;
  targetName: string;
  roundNo: RoundNo;
  onGo: () => void;
}) {
  return (
    <Screen style={{ justifyContent: 'space-between' }}>
      <T variant="label">{roundNo === 1 ? 'RUNDE 1' : 'GEGENQUOTE'} · BEIDE ZAHLEN GESPERRT</T>
      <View style={styles.cards}>
        {[challengerName, targetName].map((n) => (
          <View key={n} style={styles.lockedCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <PixelAvatar name={n} size={30} />
              <T variant="label">{n.toUpperCase()}</T>
            </View>
            <Text style={[styles.cardNumber, { color: colors.lineStrong }]}>?</Text>
          </View>
        ))}
      </View>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <BlockButton testID="auf3" label="AUF 3" size="hero" onPress={onGo} style={{ width: 280 }} />
        <T variant="body" style={{ color: colors.text2 }}>
          Alle schauen her.
        </T>
      </View>
    </Screen>
  );
}

const COUNT_STEP_MS = 620;

function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  const finish = useEffectEvent(onDone);

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setN(2);
        feedback.count();
      }, COUNT_STEP_MS),
      setTimeout(() => {
        setN(1);
        feedback.count();
      }, COUNT_STEP_MS * 2),
      setTimeout(() => finish(), COUNT_STEP_MS * 3),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text
        testID="countdown"
        accessibilityLiveRegion="assertive"
        style={{ fontFamily: fonts.pixelBold, fontSize: 220, lineHeight: 230, color: colors.signal }}>
        {n}
      </Text>
    </Screen>
  );
}

/** Ziffern laufen kurz durch wie ein Slot, dann stehen sie. */
function SlotNumber({ value, max, color }: { value: number; max: number; color: string }) {
  const [shown, setShown] = useState(() => 1 + Math.floor(Math.random() * max));
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const spin = setInterval(() => setShown(1 + Math.floor(Math.random() * max)), 45);
    const stop = setTimeout(() => {
      clearInterval(spin);
      setShown(value);
      setSettled(true);
    }, 480);
    return () => {
      clearInterval(spin);
      clearTimeout(stop);
    };
  }, [value, max]);
  return (
    <Text
      accessibilityLabel={settled ? String(value) : 'läuft'}
      style={[styles.cardNumber, { color, opacity: settled ? 1 : 0.6 }]}>
      {shown}
    </Text>
  );
}

function Reveal({
  session,
  quote,
  roundNo,
  onCounter,
  onReceipt,
  onVeto,
  onDone,
}: {
  session: Session;
  quote: Quote;
  roundNo: RoundNo;
  onCounter: () => void;
  onReceipt: () => void;
  onVeto: (dareId: string) => void;
  onDone: () => void;
}) {
  const round = quote.rounds[roundNo - 1];
  const c = round.picks.challenger!;
  const t = round.picks.target!;
  const hit = c === t;
  const challenger = playerById(session, quote.challengerId);
  const target = playerById(session, quote.targetId);
  const hunter = playerById(session, playerIdFor(quote, hunterOf(roundNo)));
  const loser = playerById(session, playerIdFor(quote, loserIfHit(roundNo)));
  const dare = session.dares.find((d) => d.quoteId === quote.id);
  const seed = `${quote.id}:${roundNo}`;
  const range = quote.range ?? 2;

  const line = hit
    ? revealLine({
        kind: 'hit',
        seed,
        loserName: loser.name,
        hunterName: hunter.name,
        value: c,
        loserTimesPickedValue: timesPicked(session, loser.id, c),
        round: roundNo,
      })
    : roundNo === 1
      ? revealLine({ kind: 'counter', seed, newHunterName: target.name })
      : revealLine({ kind: 'miss', seed });

  const ink = hit ? colors.ink : colors.text;
  const cards = (
    <View style={styles.cards}>
      {[
        { p: challenger, v: c },
        { p: target, v: t },
      ].map(({ p, v }) => (
        <View key={p.id} style={[styles.revealCard, !hit && { borderColor: colors.line, borderWidth: layout.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PixelAvatar name={p.name} size={30} />
            <T variant="label">{p.name.toUpperCase()}</T>
          </View>
          <SlotNumber value={v} max={range} color={colors.text} />
        </View>
      ))}
    </View>
  );

  if (hit) {
    return (
      <Screen background={colors.signal}>
        <View style={styles.revealHeader}>
          <Text style={[styles.revealMeta, { color: ink }]}>
            QUOTE {range} · {roundNo === 1 ? 'RUNDE 1' : 'GEGENQUOTE'}
          </Text>
          <Text style={[styles.revealMeta, { color: ink }]}>{formatOneIn(range).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
          <Text testID="reveal-title" style={[styles.revealTitle, { color: ink }]}>
            TREF{'\n'}FER.
          </Text>
          {cards}
          <View style={[styles.dareBox, { borderColor: ink }]}>
            <Text style={[styles.revealMeta, { color: ink }]}>{loser.name.toUpperCase()} MUSS</Text>
            <Text style={[styles.revealDare, { color: ink }]}>{quote.dare}</Text>
            <Text style={[styles.revealLine, { color: ink }]}>{line}</Text>
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <BlockButton testID="receipt-button" label="BELEG DRUCKEN" variant="dark" onPress={onReceipt} />
          {dare && dare.status === 'open' ? (
            <BlockButton
              label="Veto · kostet Ehre"
              variant="ghost"
              size="md"
              ghostColor={colors.ink}
              onPress={() => onVeto(dare.id)}
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  const counter = roundNo === 1;
  return (
    <Screen>
      <View style={styles.revealHeader}>
        <T variant="label">
          QUOTE {range} · {counter ? 'RUNDE 1' : 'GEGENQUOTE'}
        </T>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <Text testID="reveal-title" style={[styles.revealTitle, { color: counter ? colors.text : colors.text2 }]}>
          {counter ? 'DANE\nBEN.' : 'NIEMAND\nMUSS.'}
        </Text>
        {cards}
        <T variant="bodyStrong" style={{ color: counter ? colors.signal : colors.text2 }}>
          {line}
        </T>
      </View>
      {counter ? (
        <BlockButton testID="counter-button" label="GEGENQUOTE" onPress={onCounter} />
      ) : (
        <View style={{ gap: 10 }}>
          <BlockButton testID="done-button" label="FERTIG" onPress={onDone} />
          <BlockButton label="Beleg ansehen" variant="ghost" size="md" onPress={onReceipt} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: layout.border,
    borderColor: colors.line,
    paddingTop: 14,
    gap: 12,
  },
  risk: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.text },
  verdict: { fontFamily: fonts.pixelBold, fontSize: 16, color: colors.signal, letterSpacing: 1 },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.warn },
  pickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readyText: { fontFamily: fonts.pixel, fontSize: 11, color: colors.signal },
  flipHint: { borderWidth: layout.border, borderColor: colors.signal, padding: 14, gap: 4 },
  flipTitle: { fontFamily: fonts.pixelBold, fontSize: 14, color: colors.signal, letterSpacing: 1 },
  cards: { flexDirection: 'row', gap: 12 },
  lockedCard: {
    flex: 1,
    borderWidth: layout.border,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  revealCard: { flex: 1, backgroundColor: colors.ink, padding: 16, gap: 10 },
  cardNumber: { fontFamily: fonts.pixelBold, fontSize: 80, lineHeight: 86, color: colors.text },
  revealHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  revealMeta: { fontFamily: fonts.pixel, fontSize: 12, letterSpacing: 1 },
  revealTitle: { fontFamily: fonts.pixelBold, fontSize: 60, lineHeight: 62, letterSpacing: 2 },
  dareBox: { borderTopWidth: layout.border, paddingTop: 16, gap: 6 },
  revealDare: { fontFamily: fonts.bodyBold, fontSize: 24, lineHeight: 28 },
  revealLine: { fontFamily: fonts.bodyMedium, fontSize: 14, opacity: 0.8 },
});
