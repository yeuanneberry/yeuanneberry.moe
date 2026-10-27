import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

test('CSP permits the exact early controller and reviewed syntax styles', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const navigation = await readFile('apps/web/src/scripts/navigation.js', 'utf8');
  const hash = (text: string) => `sha256-${createHash('sha256').update(text).digest('base64')}`;
  let checkedStyles = 0;
  for (const route of ['/', '/docs/start/', '/docs/customize/']) {
    await page.goto(route);
    const policy = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
    expect(policy).toContain(hash(navigation));
    expect(policy).not.toMatch(/'unsafe-inline'|'unsafe-eval'/);
    expect(policy).toContain("script-src-attr 'none'");
    expect(policy).not.toContain('cloudflareinsights.com');
    for (const element of await page.locator('.prose [style]').all()) {
      const style = (await element.getAttribute('style'))!;
      expect(policy).toContain(hash(style));
      const color = /^color:#([0-9a-f]{6})$/i.exec(style);
      if (color) {
        const channels = color[1]!.match(/../g)!.map(value => parseInt(value, 16));
        await expect(element).toHaveCSS('color', `rgb(${channels.join(', ')})`);
      }
      checkedStyles++;
    }
  }
  await expect(page.locator('.prose pre').first()).toHaveCSS('background-color', 'rgb(36, 41, 46)');
  expect(checkedStyles).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
