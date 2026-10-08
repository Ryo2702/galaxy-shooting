import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
  });
});

test('connects to a Wallet Standard Phantom provider and disconnects cleanly', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const address = 'So11111111111111111111111111111111111111112';
    const account = {
      address,
      publicKey: new Uint8Array(32),
      chains: ['solana:mainnet'],
      features: [],
    };
    const listeners = new Set();
    const wallet = {
      version: '1.0.0',
      name: 'Phantom',
      icon: 'data:image/svg+xml;base64,PHN2Zy8+',
      chains: ['solana:mainnet'],
      accounts: [],
      features: {
        'standard:connect': {
          version: '1.0.0',
          connect: async () => ({ accounts: [account] }),
        },
        'standard:disconnect': {
          version: '1.0.0',
          disconnect: async () => {
            window.__phantomDisconnected = true;
          },
        },
        'standard:events': {
          version: '1.0.0',
          on: (_event, listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
          },
        },
      },
    };
    addEventListener('wallet-standard:app-ready', (event) =>
      event.detail.register(wallet),
    );
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'Connect wallet', exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Connect wallet' })).toBeVisible();
  await expect(page.locator('.wallet-option')).toHaveCount(2);
  await page
    .locator('button.wallet-option')
    .filter({ hasText: 'Phantom' })
    .click();
  await expect(page.getByRole('dialog')).toContainText('Connected');
  await expect(page.getByTestId('wallet-address')).toHaveText('So11...1112');
  await page.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(page.locator('.wallet-option')).toHaveCount(2);
  expect(await page.evaluate(() => window.__phantomDisconnected)).toBe(true);
  expect(errors).toEqual([]);
});

test('reports an unavailable Phantom extension without redirecting', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Connect wallet', exact: true }).click();
  await page
    .locator('button.wallet-option')
    .filter({ hasText: 'Phantom' })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    'Phantom wallet extension not detected.',
  );
  await expect(
    page.getByRole('link', { name: 'Install Phantom', exact: true }),
  ).toHaveAttribute('href', 'https://phantom.com/download');
  await expect(page).toHaveURL(/127\.0\.0\.1|localhost/);
});

test('entry, destinations, discovery rewards, saved wallet and mobile controls', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('button', { name: 'INITIALIZE', exact: true }),
  ).toBeEnabled({ timeout: 30000 });
  await page.screenshot({ path: '/tmp/nova-entry.png' });
  await page.getByRole('button', { name: 'INITIALIZE', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'ENTER COMBAT', exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(2400);
  await page.screenshot({ path: '/tmp/nova-desktop.png' });
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'LOW', exact: true }).click();
  await page.getByRole('switch', { name: 'Reduced motion' }).click();
  await page.keyboard.press('Escape');
  await page
    .getByRole('button', { name: 'Investigate unknown signal' })
    .click();
  await expect(page.getByLabel('Open wallet, 1000 NOVA')).toBeVisible();
  await page.getByRole('button', { name: 'Wallet', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'Mission: Somewhere, out there',
  );
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/nova-wallet.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Galaxy map', exact: true }).click();
  await page.getByRole('button', { name: /VOID SECTOR.*137/ }).click();
  await expect(
    page.getByRole('button', { name: 'ENTER SECTOR' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Explore', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'INITIALIZE', exact: true }).click();
  await expect(page.getByLabel('Open wallet, 1000 NOVA')).toBeVisible();
  await page
    .getByRole('button', { name: 'Investigate unknown signal' })
    .click();
  await expect(page.getByLabel('Open wallet, 1000 NOVA')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '/tmp/nova-mobile.png' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Combat', exact: true }).click();
  await page.getByRole('button', { name: 'LAUNCH FLIGHT' }).click();
  await expect(page.getByRole('button', { name: 'Fire weapon' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(
    page.getByRole('button', { name: 'RESUME FLIGHT' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'RESUME FLIGHT' }).click();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'RESUME FLIGHT' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Return to the galaxy', exact: true })
    .click();
  expect(errors).toEqual([]);
});

test('live flight accepts controls, scores real hits, and awards NOVA', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0.5;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'INITIALIZE', exact: true }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'LOW', exact: true }).click();
  await page.getByRole('switch', { name: 'Reduced motion' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'ENTER COMBAT', exact: true }).click();
  await page.getByRole('button', { name: 'LAUNCH FLIGHT' }).click();
  await page.waitForTimeout(600);
  await page.mouse.move(720, 450);
  await page.keyboard.down('Space');
  await expect(
    page.locator('.combat-top > div > strong').first(),
  ).not.toHaveText('000000', { timeout: 15000 });
  await page.keyboard.up('Space');
  await page.screenshot({ path: '/tmp/nova-combat.png' });
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'RESUME FLIGHT' }),
  ).toBeVisible();
  const progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('nova-verse.progress.v1')),
  );
  expect(progress.asteroids).toBeGreaterThan(0);
  expect(progress.balance).toBeGreaterThan(0);
});

test('every panel is usable, focus stays in dialogs, and high graphics renders', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'INITIALIZE', exact: true }).click();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'HIGH', exact: true }).click();
  await page.getByRole('switch', { name: 'Space audio' }).click();
  await expect(
    page.getByRole('switch', { name: 'Space audio' }),
  ).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('switch', { name: 'Space audio' }).click();
  await page.keyboard.press('Shift+Tab');
  expect(
    await page.evaluate(
      () => !!document.activeElement.closest('[role="dialog"]'),
    ),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/nova-high.png' });
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'LOW', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'MISSIONS 4' }).click();
  await expect(page.getByRole('dialog')).toContainText('Somewhere, out there');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Flight log', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'The first record is yours to set.',
  );
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'About', exact: true }).click();
  await page.getByRole('button', { name: 'Discover the NOVA economy' }).click();
  await expect(page.getByRole('dialog')).toContainText('Meet NOVA.');
  await expect(page.getByRole('dialog')).toContainText('$0.00');
  expect(errors).toEqual([]);
});
