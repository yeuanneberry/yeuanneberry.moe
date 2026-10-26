import { expect, test, type Page } from '@playwright/test';

const ids = ['overview', 'start', 'customize', 'apply-recover', 'update', 'reference'];
const chapters = (page: Page) => page.locator('.chapter-list .chapter-result');
const tocLinks = (page: Page, id: string) => page.locator(`.on-this-page a[href="#${id}"], .mobile-toc a[href="#${id}"]`);
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('all six chapters are immediately browsable without search or hydration', async ({ page }, info) => {
  await page.goto('/docs/');
  await expect(chapters(page)).toHaveCount(6);
  expect(await chapters(page).evaluateAll(links => links.map(link => link.getAttribute('href')))).toEqual(ids.map(id => `/docs/${id}/`));
  for (const chapter of await chapters(page).all()) {
    await expect(chapter.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(chapter.locator('p')).not.toBeEmpty();
  }
  await expect(page.getByRole('searchbox')).toHaveCount(0);
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await expect(page.locator('astro-island')).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('reader-index.png'), fullPage: true });
});

test('skip navigation and chapter links work from the keyboard', async ({ page }) => {
  await page.goto('/docs/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('main-content');
  await chapters(page).first().focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/docs\/overview\/$/);
});

test('contents highlight follows reading in both directions without changing history or focus', async ({ page }, info) => {
  await page.goto('/docs/customize/');
  const first = 'keep-reusable-and-personal-choices-separate';
  await expect(tocLinks(page, first)).toHaveCount(2);
  for (const link of await tocLinks(page, first).all()) await expect(link).toHaveAttribute('aria-current', 'location');
  await page.locator('#main-content').focus();
  const initialHistory = await page.evaluate(() => history.length);
  for (const id of ['themes-and-app-preferences', 'kitty-includes']) {
    await page.locator(`#${id}`).evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 20));
    for (const link of await tocLinks(page, id).all()) await expect(link).toHaveAttribute('aria-current', 'location');
    await expect(page).toHaveURL(/\/docs\/customize\/$/);
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('main-content');
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  for (const link of await tocLinks(page, 'hardware-and-identity').all()) await expect(link).toHaveAttribute('aria-current', 'location');
  expect(await page.evaluate(() => history.length)).toBe(initialHistory);
  if (info.project.name === 'desktop') {
    await page.screenshot({ path: info.outputPath('reader-active-section.png') });
    await page.getByRole('link', { name: 'Back to top' }).click();
  } else await page.evaluate(() => window.scrollTo(0, 0));
  for (const link of await tocLinks(page, first).all()) await expect(link).toHaveAttribute('aria-current', 'location');
});

test('contents honor initial hashes, keyboard jumps and short sections near the bottom', async ({ page }, info) => {
  await page.goto('/docs/customize/#kitty-includes');
  for (const link of await tocLinks(page, 'kitty-includes').all()) await expect(link).toHaveAttribute('aria-current', 'location');
  await page.reload();
  for (const link of await tocLinks(page, 'kitty-includes').all()) await expect(link).toHaveAttribute('aria-current', 'location');
  const toc = info.project.name === 'phone' ? page.locator('.mobile-toc') : page.locator('.on-this-page');
  if (info.project.name === 'phone') await toc.locator('summary').click();
  const target = toc.getByRole('link', { name: 'Hardware and identity', exact: true });
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#hardware-and-identity$/);
  for (const link of await tocLinks(page, 'hardware-and-identity').all()) await expect(link).toHaveAttribute('aria-current', 'location');
  // The preceding section can land at the viewport limit on a tall screen.
  await toc.getByRole('link', { name: 'Themes and app preferences', exact: true }).click();
  for (const link of await tocLinks(page, 'themes-and-app-preferences').all()) await expect(link).toHaveAttribute('aria-current', 'location');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: info.project.use.viewport!.width, height: 600 });
  await page.locator('#kitty-includes').evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 20));
  for (const link of await tocLinks(page, 'kitty-includes').all()) await expect(link).toHaveAttribute('aria-current', 'location');
});

test('deep links, mobile chapters, headings and adjacent reading work', async ({ page }, info) => {
  await page.goto('/docs/customize/');
  await page.reload();
  if (info.project.name === 'phone') await page.getByText('Browse chapters', { exact: false }).click();
  await expect(page.locator('.chapter-nav a[aria-current="page"]:visible')).toContainText('Make it your own');
  const toc = info.project.name === 'phone' ? page.locator('.mobile-toc') : page.locator('.on-this-page');
  if (info.project.name === 'phone') await toc.getByText('On this page', { exact: true }).click();
  await toc.getByRole('link', { name: 'Kitty includes', exact: true }).click();
  await expect(page.locator('#kitty-includes')).toBeInViewport();
  await page.getByRole('navigation', { name: 'Adjacent chapters' }).getByRole('link', { name: /Next/ }).click();
  await expect(page).toHaveURL(/\/docs\/apply-recover\/$/);
});

test('every chapter has full content, valid local links and no private source references', async ({ page, request }, info) => {
  for (const id of ids) {
    expect((await page.goto(`/docs/${id}/`))?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    expect((await page.locator('.prose').innerText()).length).toBeGreaterThan(900);
    await expect(page.locator('.source-note a')).toHaveAttribute('href', new RegExp(`^https://github\\.com/yeuanneberry/berry-desktop/blob/[0-9a-f]{40}/docs/${id}\\.md$`));
    await expect(page.locator('.prose')).not.toContainText(/\bLKT\b|lktcomph|\/home\/yeuanne|berry-shared/);
    const links = await page.locator('a').evaluateAll(elements => elements.map(element => element.getAttribute('href')!));
    expect(links.some(href => /github\.com\/yeuanneberry\/berry-(config|ai)(\/|$)/.test(href))).toBe(false);
    for (const href of new Set(links.filter(href => href.startsWith('/')))) expect((await request.get(href)).status(), href).toBe(200);
    for (const anchor of new Set(links.filter(href => href.startsWith('#')).map(href => href.slice(1)))) await expect(page.locator(`[id="${anchor}"]`)).toHaveCount(1);
    const relative = await page.locator('.prose a').evaluateAll(elements => elements.map(element => element.getAttribute('href')!).filter(href => !/^(https?:|\/docs\/|#)/.test(href)));
    expect(relative).toEqual([]);
    await noOverflow(page);
    if (id === 'reference') await page.screenshot({ path: info.outputPath('reader-reference.png'), fullPage: true });
  }
});

test('documentation and chapter navigation work without JavaScript', async ({ browser, baseURL }, info) => {
  const page = await browser.newPage({ baseURL, viewport: info.project.use.viewport, javaScriptEnabled: false });
  try {
    await page.goto('/docs/');
    await expect(chapters(page)).toHaveCount(6);
    await expect(page.getByRole('searchbox')).toHaveCount(0);
    await page.locator('.chapter-list a[href="/docs/customize/"]').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Customize without a second baseline' })).toBeVisible();
    if (info.project.name === 'phone') await page.getByText('Browse chapters', { exact: false }).click();
    await page.locator('.chapter-nav a[href="/docs/reference/"]:visible').click();
    await expect(page.locator('.prose table')).toBeVisible();
    await noOverflow(page);
  } finally { await page.close(); }
});

test('reader loads without console, asset or request failures', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto('/docs/');
  await expect(chapters(page).first()).toBeVisible();
  for (const id of ids) await page.goto(`/docs/${id}/`);
  expect(errors).toEqual([]);
});
