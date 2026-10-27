import { expect, test } from '@playwright/test';

test('reader disclosures share styled touch targets and native keyboard behavior', async ({ page }, info) => {
  const violations: string[] = [];
  page.on('console', message => { if (message.type() === 'error' && /content security policy/i.test(message.text())) violations.push(message.text()); });
  await page.goto('/docs/customize/');
  const selectors = info.project.name === 'phone'
    ? ['.mobile-chapters', '.mobile-toc', '.source-disclosure']
    : ['.source-disclosure'];
  for (const selector of selectors) {
    const disclosure = page.locator(selector);
    const summary = disclosure.locator(':scope > summary');
    await expect(summary).toBeVisible();
    await expect(disclosure).not.toHaveAttribute('open');
    expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(summary).toHaveCSS('background-color', 'rgb(32, 37, 34)');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(disclosure).toHaveAttribute('open', '');
    await expect(disclosure.locator(':scope > .disclosure-panel')).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(summary).toHaveCSS('color', 'rgb(195, 172, 119)');
    await page.keyboard.press('Space');
    await expect(disclosure).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
    await summary.click();
    await expect(disclosure).toHaveAttribute('open', '');
    await disclosure.evaluate(async element => { await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished)); });
    await disclosure.screenshot({ path: info.outputPath(`${selector.slice(1)}.png`) });
  }
  expect(violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mobile chapter and contents panels preserve actual navigation and current section', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'These two disclosures are mobile reader controls.');
  await page.goto('/docs/customize/');
  const chapters = page.locator('.mobile-chapters');
  await chapters.locator('summary').click();
  await expect(chapters.locator('a[aria-current="page"]')).toHaveText(/Make it your own/);
  await chapters.getByRole('link', { name: /Files & troubleshooting/ }).click();
  await expect(page).toHaveURL(/\/docs\/reference\/$/);
  await page.goto('/docs/customize/');
  const contents = page.locator('.mobile-toc');
  await contents.locator('summary').focus();
  await page.keyboard.press('Enter');
  const link = contents.getByRole('link', { name: 'Kitty includes', exact: true });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#kitty-includes$/);
  await expect(page.locator('#kitty-includes')).toBeInViewport();
  await expect(link).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('.on-this-page a[href="#kitty-includes"]')).toHaveAttribute('aria-current', 'location');
});

test('long disclosure content wraps and remains keyboard scrollable in a short viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 420 });
  await page.goto('/docs/customize/');
  const source = page.locator('.source-disclosure');
  await source.locator('summary').click();
  const panel = source.getByRole('region', { name: 'Source revision details' });
  await panel.evaluate(element => {
    const paragraph = document.createElement('p');
    paragraph.textContent = 'revision'.repeat(1000);
    element.append(paragraph);
  });
  expect(await panel.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(await panel.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect((await panel.boundingBox())!.height).toBeLessThanOrEqual(420 * .6 + 1);
  await panel.focus();
  await page.keyboard.press('PageDown');
  await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('disclosures work without JavaScript and reduce decorative motion', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL, viewport: info.project.use.viewport, javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto('/docs/customize/');
    const source = page.locator('.source-disclosure');
    await source.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(source).toHaveAttribute('open', '');
    await expect(source.getByRole('region', { name: 'Source revision details' })).toContainText('Revision');
    await expect(source.locator('.disclosure-panel')).toHaveCSS('animation-name', 'none');
    await expect(source.locator('.disclosure-chevron')).toHaveCSS('transition-duration', '0s');
    if (info.project.name === 'phone') {
      await page.locator('.mobile-toc > summary').click();
      await page.locator('.mobile-toc').getByRole('link', { name: 'Kitty includes', exact: true }).click();
      await expect(page).toHaveURL(/#kitty-includes$/);
      await page.locator('.mobile-chapters > summary').click();
      await page.locator('.mobile-chapters').getByRole('link', { name: /Files & troubleshooting/ }).click();
      await expect(page).toHaveURL(/\/docs\/reference\/$/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('reader-disclosure-no-js.png'), fullPage: true });
  } finally { await context.close(); }
});
