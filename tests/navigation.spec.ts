import { expect, test } from '@playwright/test';

test('mobile navigation fills the viewport and supports keyboard close and navigation', async ({ page }, info) => {
  await page.goto('/');
  const toggle = page.locator('#open-navigation');
  const dialog = page.getByRole('dialog', { name: 'Navigation', exact: true });
  if (info.project.name === 'desktop') {
    await expect(toggle).toBeHidden();
    await expect(page.locator('.desktop-nav')).toBeVisible();
    await expect(dialog).toBeHidden();
    return;
  }
  await expect(toggle).toBeVisible();
  await expect(page.locator('.desktop-nav')).toBeHidden();
  const triggerBox = (await toggle.boundingBox())!;
  expect(triggerBox.width).toBe(44);
  expect(triggerBox.height).toBe(44);
  await toggle.click();
  await expect(dialog).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const close = dialog.getByRole('button', { name: 'Close menu', exact: true });
  await expect(close).toBeFocused();
  const closeBox = (await close.boundingBox())!;
  for (const key of ['x', 'y', 'width', 'height'] as const) expect(closeBox[key]).toBeCloseTo(triggerBox[key], 0);
  const box = (await dialog.boundingBox())!;
  expect(box.x).toBeCloseTo(0, 0);
  expect(box.y).toBeCloseTo(0, 0);
  expect(box.width).toBeCloseTo(page.viewportSize()!.width, 0);
  expect(box.height).toBeCloseTo(page.viewportSize()!.height, 0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  const backgroundScroll = await page.evaluate(() => scrollY);
  await page.mouse.move(100, 100);
  await page.mouse.wheel(0, 300);
  await page.screenshot({ path: info.outputPath('mobile-navigation.png') });
  expect(await page.evaluate(() => scrollY)).toBe(backgroundScroll);
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'About', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await expect(page.locator('html')).not.toHaveClass(/navigation-open/);
  await toggle.click();
  await close.click();
  await expect(dialog).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await dialog.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(dialog).toBeHidden();
  await toggle.click();
  await page.setViewportSize({ width: 1100, height: 812 });
  await expect(dialog).toBeHidden();
  await expect(page.locator('.desktop-nav')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/navigation-open/);
  await expect(page.locator('.desktop-nav a[aria-current]')).toBeFocused();
});

test('About has the approved bio and ASCII without decorative copy', async ({ page }, info) => {
  await page.goto('/about/');
  await expect(page.locator('main')).toContainText('Computer Science dropout');
  await expect(page.locator('main')).toContainText('working full-time as a Head IT Administrator');
  const portrait = page.getByRole('img', { name: "ASCII rendering of Yeuanne Berry's profile artwork" });
  await expect(portrait).toBeVisible();
  await expect(page.locator('main img')).toHaveCount(0);
  const art = page.locator('.ascii-portrait pre:visible');
  const lines = (await art.innerText()).split('\n');
  expect(lines).toHaveLength(info.project.name === 'phone' ? 29 : 48);
  expect(lines.every(line => line.length === (info.project.name === 'phone' ? 48 : 80))).toBe(true);
  await expect(art).toHaveAttribute('aria-hidden', 'true');
  expect((await portrait.boundingBox())!.width).toBeLessThan(page.viewportSize()!.width);
  await expect(page.locator('.site-footer')).not.toContainText('Built with care');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('about.png'), fullPage: true });
});

test('header and portraits serve enough WebP pixels on high-density screens', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL, viewport: info.project.use.viewport, deviceScaleFactor: 3 });
  const page = await context.newPage();
  try {
    for (const path of ['/', '/about/']) {
      await page.goto(path);
      for (const selector of path === '/' ? ['.header-avatar', 'main img[alt="Yeuanne Berry"]'] : ['.header-avatar']) {
        const image = page.locator(selector);
        await image.scrollIntoViewIfNeeded();
        const dimensions = await image.evaluate(async element => {
          const rendered = element as HTMLImageElement;
          await rendered.decode();
          const source = new Image();
          source.src = rendered.currentSrc;
          await source.decode();
          // CSS rotation enlarges the bounding rectangle, not the image itself.
          return { pixels: source.naturalWidth, width: parseFloat(getComputedStyle(rendered).width), source: rendered.currentSrc };
        });
        expect(dimensions.pixels).toBeGreaterThanOrEqual(Math.floor(dimensions.width * 3));
        const response = await context.request.get(dimensions.source);
        expect(response.headers()['content-type']).toContain('image/webp');
      }
    }
  } finally { await context.close(); }
});

test('a project website opens a separate tab and keeps the case study open', async ({ page, context }) => {
  // Fulfill locally so this checks browser behavior without visiting the project.
  await context.route('https://softlysang.com/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Project link check</title>' }));
  await page.goto('/work/softlysang/');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: /Visit SoftlySang/ }).first().click();
  const popup = await popupPromise;
  try {
    await expect(popup).toHaveTitle('Project link check');
    await expect(page).toHaveURL(/\/work\/softlysang\/$/);
  } finally { await popup.close(); }
});
