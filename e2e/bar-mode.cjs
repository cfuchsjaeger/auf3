// Spielt einen kompletten Abend im Bar-Modus durch (Web-Build, Handygröße) und legt Screenshots ab.
// Aufruf: npm run test:e2e
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const OUT = process.argv[2] ?? path.join(__dirname, 'screenshots');
const BASE = process.env.BASE_URL ?? 'http://localhost:8099/';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
  const btn = (name) => page.locator(`[role=button][aria-label="${name}"]:visible`);
  const tid = (id) => page.getByTestId(id);
  const step = (msg) => console.log('✓', msg);

  global.__page = page;
  page.setDefaultTimeout(8000);
  await page.goto(BASE);
  await tid('start-event').waitFor();
  await page.waitForTimeout(400);
  await shot('01-welcome'); step('Willkommen');

  await tid('start-event').click();
  for (const n of ['Max', 'Tom', 'Luki', 'Flo']) {
    await tid('player-input').fill(n);
    await tid('player-add').click();
  }
  await tid('player-input').fill('tom');
  await tid('player-add').click();
  await page.getByText('tom ist schon dabei.').waitFor();
  step('doppelter Name abgelehnt');
  await tid('player-input').fill('');
  await shot('02-setup');
  await tid('setup-go').click();
  await tid('quote-button').waitFor();
  await shot('03-start'); step('Event gestartet');

  // Quote 1: Max quotet Tom, Treffer in Runde 1.
  await tid('quote-button').click();
  await tid('dare-input').waitFor();
  await btn('Tom').last().click();
  await tid('dare-input').fill('Dem Kellner ein Lied widmen. Laut.');
  await shot('04-new-quote');
  await tid('quote-submit').click();
  await page.getByText('Tom setzt die Quote.').waitFor();
  await shot('05-pass'); step('Weitergeben an Tom');
  await tid('pass-confirm').click();
  await tid('range-value').waitFor();
  await btn('Quote verringern').click();
  await btn('Quote erhöhen').click();
  if ((await tid('range-value').innerText()) !== '10') throw new Error('Range-Schritte falsch');
  await shot('06-range'); step('Range 10, Plus und Minus');
  await tid('range-submit').click();

  await tid('pick-value').waitFor();
  await page.getByText('Tom tippt, geheim.').waitFor();
  await btn('5').click(); await btn('1').click();
  if ((await tid('pick-value').innerText()) !== '5') throw new Error('Range-Grenze im Tastenfeld verletzt');
  step('51 bei Range 10 verweigert');
  await btn('Löschen').click();
  await btn('7').click();
  await shot('07-pick');
  await btn('SPERREN').click();
  await page.getByText('Geheim tippen. Alle anderen schauen weg.').waitFor();
  await tid('pass-confirm').click();
  await page.getByText('Max tippt, geheim.').waitFor();
  await page.getByText('TOM IST BEREIT').waitFor();
  await btn('7').click();
  await btn('SPERREN').click();
  await tid('auf3').waitFor();
  await shot('08-ready'); step('beide gesperrt');
  await tid('auf3').click();
  await tid('countdown').waitFor();
  await shot('09-countdown');
  await tid('reveal-title').waitFor({ timeout: 4000 });
  await page.waitForTimeout(700);
  if (!(await tid('reveal-title').innerText()).includes('TREF')) throw new Error('kein Treffer angezeigt');
  await shot('10-reveal-hit'); step('Treffer, Tom muss');
  await tid('receipt-button').click();
  await tid('share').waitFor();
  await page.waitForTimeout(1100);
  await shot('11-receipt'); step('Beleg gedruckt');
  await btn('Zurück').click();

  // Quote 2: Max quotet Luki, daneben, Gegenquote trifft Max.
  await tid('quote-button').click();
  await tid('dare-input').waitFor();
  await btn('Luki').last().click();
  await tid('dare-input').fill('Handstand an der Bar.');
  await tid('quote-submit').click();
  await page.getByText('Luki setzt die Quote.').waitFor();
  await tid('pass-confirm').click();
  for (let i = 0; i < 7; i++) await btn('Quote verringern').click();
  if ((await tid('range-value').innerText()) !== '3') throw new Error('Range nicht 3');
  await shot('12-range-low');
  await tid('range-submit').click();
  await btn('1').click(); await btn('SPERREN').click();
  await tid('pass-confirm').click();
  await btn('2').click(); await btn('SPERREN').click();
  await tid('auf3').click();
  await tid('counter-button').waitFor({ timeout: 4000 });
  await page.waitForTimeout(700);
  await shot('13-reveal-miss'); step('Daneben, Gegenquote');
  await tid('counter-button').click();
  await page.getByText('GEGENQUOTE').first().waitFor();
  await tid('pass-confirm').click();
  await page.getByText('Max tippt, geheim.').waitFor();
  await btn('3').click(); await btn('SPERREN').click();
  await tid('pass-confirm').click();
  await btn('3').click(); await btn('SPERREN').click();
  await tid('auf3').click();
  await tid('receipt-button').waitFor({ timeout: 4000 });
  await page.getByText('MAX MUSS').waitFor();
  step('Gegenquote trifft, Max muss');
  await btn('Veto · kostet Ehre').click();
  await page.getByText('VETO').first().waitFor();
  step('Veto auf dem Beleg');
  await btn('Zurück').click();

  // Quote 3: Tom quotet Flo, Flo lehnt ab.
  await tid('quote-button').click();
  await tid('dare-input').waitFor();
  await page.locator('[role=button][aria-label^="Tom"]:visible').first().click();
  await btn('Flo').last().click();
  await tid('dare-input').fill('Tanzen.');
  await tid('quote-submit').click();
  await page.getByText('Flo setzt die Quote.').waitFor();
  await tid('pass-confirm').click();
  await page.getByText('TOM QUOTET DICH').waitFor();
  const track = page.locator('[aria-label="Quote"]:visible');
  const box = await track.boundingBox();
  await page.mouse.move(box.x + 4, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(box.x + (box.width * i) / 12 - 2, box.y + box.height / 2);
  await page.mouse.up();
  const swiped = await tid('range-value').innerText();
  if (swiped !== '50') throw new Error(`Wischen bis rechts ergab ${swiped}, erwartet 50`);
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  const tapped = Number(await tid('range-value').innerText());
  if (tapped < 12 || tapped > 16) throw new Error(`Tippen bei 25 % ergab ${tapped}`);
  step(`Wischen auf 50, Tippen bei einem Viertel auf ${tapped}`);
  await btn('Ablehnen · zählt als 50').click();
  await page.getByText('Flo kneift.', { exact: false }).waitFor();
  await btn('OK').click();
  await page.waitForURL(BASE);
  await tid('quote-button').waitFor();
  step('Ablehnen');

  // Persistenz: Neu laden, Stand muss bleiben.
  await page.reload();
  await tid('quote-button').waitFor();
  await page.getByText('OFFENE SCHULDEN').waitFor();
  await shot('14-start-after-reload'); step('Stand nach Neuladen erhalten');

  await page.getByRole('button', { name: /Abrechnung/ }).click();
  await page.getByText('3 Quoten · 2 Treffer · 1 Veto').waitFor();
  await shot('15-ledger-mut');
  await page.getByRole('tab', { name: 'LESEN' }).click();
  await shot('16-ledger-lesen');
  await page.getByRole('tab', { name: 'EHRE' }).click();
  await shot('17-ledger-ehre'); step('Abrechnung mit drei Ranglisten');
  await page.getByRole('button', { name: /erledigt, bestätigt von Max/ }).click();
  await page.getByText('Niemand schuldet niemandem was. Verdächtig.').waitFor();
  step('Schuld bestätigt');
  await btn('Event beenden').click();
  await btn('Wirklich beenden').click();
  await page.getByText('ABGESCHLOSSEN').waitFor();
  step('Event beendet und archiviert');

  console.log(errors.length ? `Konsolenfehler:\n${errors.join('\n')}` : 'keine Konsolenfehler');
  await browser.close();
})().catch(async (e) => {
  console.error('FEHLER:', e.message.split('\n')[0]);
  try {
    await global.__page.screenshot({ path: `${OUT}/zz-failure.png` });
    const btns = await global.__page.locator('[role=button]').evaluateAll((els) => els.map((e) => `${e.getAttribute('aria-label')}:${e.getBoundingClientRect().width > 0}`));
    console.error(btns.join(' | '));

  } catch {}
  process.exit(1);
});
