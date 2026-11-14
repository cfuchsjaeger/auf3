// Zwei Handys, zwei Konten: Gruppe gründen, per WhatsApp einladen, per Link beitreten,
// zweite Gruppe, mit Code beitreten, Event aus Gruppe starten, Gruppe verlassen.
// Braucht ein laufendes lokales Supabase (npx supabase start --workdir e2e). Aufruf: npm run test:e2e:gruppen
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const OUT = process.argv[2] ?? path.join(__dirname, 'screenshots');
const BASE = process.env.BASE_URL ?? 'http://localhost:8099/';
fs.mkdirSync(OUT, { recursive: true });

async function phone(browser, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  // Externe Links abfangen, statt Tabs zu öffnen.
  await ctx.addInitScript(() => {
    window.__opened = [];
    window.open = (url) => {
      window.__opened.push(String(url));
      return null;
    };
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(`${label}: ${e}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${label}: ${m.text()}`));
  return { page, errors, tid: (id) => page.getByTestId(id), btn: (name) => page.locator(`[role=button][aria-label="${name}"]:visible`) };
}

const step = (msg) => console.log('✓', msg);

(async () => {
  const browser = await chromium.launch();
  const a = await phone(browser, 'Fuchs');
  const b = await phone(browser, 'Leon');
  const shot = (p, n) => p.page.screenshot({ path: `${OUT}/${n}.png` });

  try {
    // Fuchs gründet eine Gruppe.
    await a.page.goto(BASE);
    await a.tid('open-crews').first().click();
    await a.tid('name-input').fill('Fuchs');
    await shot(a, 'g01-name');
    await a.tid('name-submit').click();
    await a.tid('crew-name-input').fill('Schniadlerboys');
    await a.tid('crew-create').click();
    await a.page.getByText('Noch allein. Lad die anderen ein.').waitFor();
    const code1 = (await a.tid('invite-code').innerText()).replace('-', '');
    if (!/^[A-HJ-KM-NP-Z2-9]{8}$/.test(code1)) throw new Error(`unerwarteter Code ${code1}`);
    await shot(a, 'g02-gruppe-allein');
    step(`Gruppe gegründet, Code ${code1}`);

    await a.tid('invite-whatsapp').click();
    const opened = await a.page.evaluate(() => window.__opened);
    const wa = opened.find((u) => u.startsWith('https://wa.me/?text='));
    if (!wa) throw new Error(`kein WhatsApp-Link geöffnet: ${opened.join(', ')}`);
    const text = decodeURIComponent(wa.slice('https://wa.me/?text='.length));
    if (!text.includes('Fuchs lädt dich in die Gruppe „Schniadlerboys“') || !text.includes(`auf3://join?code=${code1}`)) {
      throw new Error(`Einladungstext unvollständig:\n${text}`);
    }
    step('WhatsApp-Einladung mit Link und Code');

    // Leon öffnet den Link. Kleinbuchstaben und Bindestrich wie aus einem Chat abgetippt.
    const typed = `${code1.slice(0, 4)}-${code1.slice(4)}`.toLowerCase();
    await b.page.goto(`${BASE}join?code=${typed}`);
    await b.tid('name-input').fill('Leon');
    await b.tid('name-submit').click();
    await b.tid('join-preview').waitFor();
    await b.page.getByText('SCHNIADLERBOYS', { exact: true }).waitFor();
    await b.page.getByText('1 Person').waitFor();
    await shot(b, 'g03-einladung-vorschau');
    step('Leon sieht Vorschau vor dem Beitritt');
    await b.tid('join-submit').click();
    await b.tid('member-Fuchs').waitFor();
    await b.tid('member-Leon').waitFor();
    await b.page.getByText('2 LEUTE').waitFor();
    await shot(b, 'g04-leon-in-gruppe');
    step('Leon ist beigetreten');

    // Fuchs sieht Leon nach dem Neuladen.
    await a.page.reload();
    await a.tid('member-Leon').waitFor();
    step('Fuchs sieht Leon in der Gruppe');

    // Zweite Gruppe: Fuchs gründet, Leon tritt mit Code bei.
    await a.btn('Zurück').click();
    await a.tid('crew-name-input').fill('Kroatien 2027');
    await a.tid('crew-create').click();
    await a.page.getByText('KROATIEN 2027', { exact: true }).waitFor();
    const code2 = (await a.tid('invite-code').innerText()).replace('-', '');

    await b.btn('Zurück').click();
    await b.tid('crew-join').click();
    await b.tid('join-code-input').fill('ABCD-EFG0');
    await b.page.getByText('Dieser Code kann nicht stimmen.', { exact: false }).waitFor();
    await b.tid('join-code-input').fill('ABCD-EFGH');
    await b.page.getByText('Diese Einladung gibt es nicht.').waitFor();
    step('ungültige und unbekannte Codes werden erklärt');
    await b.tid('join-code-input').fill(code2);
    await b.tid('join-submit').click();
    await b.page.getByText('KROATIEN 2027', { exact: true }).waitFor();
    await b.btn('Zurück').click();
    await b.tid('crew-Schniadlerboys').waitFor();
    await b.tid('crew-Kroatien 2027').waitFor();
    await shot(b, 'g05-zwei-gruppen');
    step('Leon ist in zwei Gruppen');

    // Event aus der Gruppe starten.
    await a.btn('Zurück').click();
    await a.tid('crew-Schniadlerboys').click();
    await a.tid('crew-start-event').click();
    await a.page.getByText('NEUES EVENT · SCHNIADLERBOYS').waitFor();
    await a.page.locator('[aria-label="Fuchs, das bin ich"]:visible').waitFor();
    await a.page.locator('[aria-label="Leon, als ich markieren"]:visible').waitFor();
    await shot(a, 'g06-event-aus-gruppe');
    await a.tid('player-input').fill('Tom');
    await a.tid('player-add').click();
    await a.tid('setup-go').click();
    await a.tid('quote-button').waitFor();
    await a.btn('Leon').waitFor();
    await a.btn('Tom').waitFor();
    step('Event mit Gruppenmitgliedern und Gast gestartet');

    // Leon verlässt die zweite Gruppe.
    await b.tid('crew-Kroatien 2027').click();
    await b.btn('Gruppe verlassen').click();
    await b.btn('Wirklich verlassen').click();
    await b.tid('crew-Schniadlerboys').waitFor();
    if (await b.tid('crew-Kroatien 2027').count()) throw new Error('Gruppe nach Verlassen noch sichtbar');
    step('Leon hat Kroatien 2027 verlassen');

    // Konto übersteht Neuladen.
    await b.page.reload();
    await b.page.getByText('Du bist Leon.').waitFor();
    step('Konto bleibt nach Neuladen angemeldet');

    const errors = [...a.errors, ...b.errors];
    console.log(errors.length ? `Konsolenfehler:\n${errors.join('\n')}` : 'keine Konsolenfehler');
  } catch (e) {
    console.error('FEHLER:', e.message.split('\n')[0]);
    await shot(a, 'zz-fehler-fuchs').catch(() => {});
    await shot(b, 'zz-fehler-leon').catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
