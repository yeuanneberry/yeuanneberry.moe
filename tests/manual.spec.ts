import { expect, test, type Page } from '@playwright/test';

const ids = ['overview', 'start', 'customize', 'apply-recover', 'update', 'reference'];
const results = (page: Page) => page.locator('.search-results .chapter-result');
async function ready(page: Page) {
  await page.goto('/docs/');
  await expect(page.getByRole('searchbox', { name: 'Search the manual' })).toBeEnabled();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('reader searches complete article bodies with trimmed case-insensitive terms', async ({ page }, info) => {
  await ready(page);
  await expect(results(page)).toHaveCount(6);
  const search = page.getByRole('searchbox', { name: 'Search the manual' });
  await search.fill('  FONT_SIZE  ');
  await expect(results(page)).toHaveCount(1);
  await expect(results(page)).toHaveAttribute('href', '/docs/customize/');
  await expect(results(page)).toContainText('font_size');
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('reader-search.png'), fullPage: true });
});

test('section filters intersect with search and reset restores focus', async ({ page }) => {
  await ready(page);
  const section = page.getByRole('combobox', { name: 'Section', exact: true });
  const search = page.getByRole('searchbox', { name: 'Search the manual' });
  await section.selectOption('Setup');
  await expect(results(page)).toHaveCount(3);
  await search.fill('font_size');
  await expect(page.getByRole('heading', { name: 'No chapters found' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('0 chapters found');
  await page.getByRole('button', { name: 'Reset search' }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(section).toHaveValue('All chapters');
  await expect(results(page)).toHaveCount(6);
});

test('skip navigation and search controls work from the keyboard', async ({ page }) => {
  await ready(page);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('main-content');
  await page.getByRole('searchbox', { name: 'Search the manual' }).focus();
  await page.keyboard.type('symlink');
  await expect(results(page)).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox', { name: 'Section', exact: true })).toBeFocused();
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
    await expect(results(page)).toHaveCount(6);
    await expect(page.getByRole('searchbox', { name: 'Search the manual' })).toBeDisabled();
    await page.locator('.search-results a[href="/docs/customize/"]').click();
    await expect(page.getByRole('heading', { level: 1, name: 'Customize without a second baseline' })).toBeVisible();
    if (info.project.name === 'phone') await page.getByText('Browse chapters', { exact: false }).click();
    await page.locator('.chapter-nav a[href="/docs/reference/"]:visible').click();
    await expect(page.locator('.prose table')).toBeVisible();
    await noOverflow(page);
  } finally { await page.close(); }
});

test('reader hydrates without console, asset or request failures', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await ready(page);
  await page.getByRole('searchbox', { name: 'Search the manual' }).fill('rollback');
  await expect(results(page).first()).toBeVisible();
  for (const id of ids) await page.goto(`/docs/${id}/`);
  expect(errors).toEqual([]);
});
