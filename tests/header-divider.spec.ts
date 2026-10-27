import { expect, test } from '@playwright/test';

test('mobile header divider keeps its full span and position when the menu opens', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'Mobile portrait and landscape checks run in the phone project.');
  for (const classicScrollbar of [false, true]) {
    for (const viewport of [{ width: 375, height: 812 }, { width: 812, height: 375 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      if (classicScrollbar) await page.evaluate(() => {
        // Mutate the test page's local stylesheet without adding inline CSS or
        // weakening the production CSP to emulate a classic scrollbar.
        const sheet = Array.from(document.styleSheets).find(style => style.href?.startsWith(location.origin));
        if (!sheet) throw new Error('Expected a local stylesheet for the scrollbar fixture.');
        sheet.insertRule('html { overflow-y: scroll; }', 0);
        sheet.insertRule('::-webkit-scrollbar { width: 14px; }', 0);
      });
      const closed = (await page.locator('.site-header').boundingBox())!;
      const trigger = (await page.locator('#open-navigation').boundingBox())!;
      await page.locator('#open-navigation').click();
      const divider = page.locator('.mobile-menu-header');
      const open = (await divider.boundingBox())!;
      expect(open.x).toBeCloseTo(closed.x, 0);
      expect(open.x + open.width).toBeCloseTo(closed.x + closed.width, 0);
      expect(open.y + open.height).toBeCloseTo(closed.y + closed.height, 0);
      await expect(divider).toHaveCSS('border-bottom-width', '1px');
      const close = (await page.locator('#close-navigation').boundingBox())!;
      for (const key of ['x', 'y', 'width', 'height'] as const) expect(close[key]).toBeCloseTo(trigger[key], 0);
      await page.locator('.mobile-nav').evaluate(element => { element.scrollTop = element.scrollHeight; });
      expect((await divider.boundingBox())!.y).toBe(open.y);
      if (!classicScrollbar) await page.screenshot({ path: info.outputPath(`header-open-${viewport.width}.png`) });
      await page.keyboard.press('Escape');
      await expect(page.locator('#open-navigation')).toBeFocused();
      if (!classicScrollbar) await page.screenshot({ path: info.outputPath(`header-closed-${viewport.width}.png`) });
    }
  }
});
