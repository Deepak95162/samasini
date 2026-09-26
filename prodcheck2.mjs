import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('console', (msg) => errors.push(`[console.${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => errors.push(`[pageerror] ${err}`));
page.on('requestfailed', (req) => errors.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`));
page.on('response', (res) => { if (res.status() >= 400) errors.push(`[http ${res.status()}] ${res.url()}`); });

await page.goto('https://console.samasini.com/', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'dev@mulai.com');
await page.fill('input[type="password"]', 'fraud123');
await page.click('button[type="submit"]');
await page.waitForSelector('text=Customer Journey');
await page.waitForTimeout(4000); // let some transactions accumulate

const rowCount = await page.locator('a[href^="/transactions/"]').count();
console.log('transaction link rows found:', rowCount);

const urlBefore = page.url();
if (rowCount > 0) {
  await page.locator('a[href^="/transactions/"]').first().click();
  await page.waitForTimeout(1000);
}
const urlAfter = page.url();
console.log('url before:', urlBefore);
console.log('url after:', urlAfter);
await page.screenshot({ path: 'prodcheck2.png', fullPage: true });

console.log('EVENTS:', JSON.stringify(errors, null, 2));
await browser.close();
