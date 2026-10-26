import { expect, test, type Page } from '@playwright/test';

const projects = [
  { slug: 'masqify', title: 'Masqify', role: 'Full implementation', url: 'https://masqify.me/' },
  { slug: 'tapin', title: 'TapIn', role: 'Full implementation', url: 'https://tapinattendance.app/' },
  { slug: 'yappers', title: 'Yappers', role: 'Frontend implementation', url: 'https://yappersph.vercel.app/' },
  { slug: 'softlysang', title: 'SoftlySang', role: 'Design & full implementation', url: 'https://softlysang.com/' },
  { slug: 'lkt', title: 'LKT', role: 'Full implementation', url: 'https://lkt.com.ph/' },
] as const;

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function imagesLoaded(page: Page) {
  // Lazy previews below the viewport still need to be verified, not skipped.
  for (const image of await page.locator('main img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(element => {
      const image = element as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    })).toBe(true);
    const src = await image.getAttribute('src');
    expect(new URL(src!, page.url()).origin).toBe(new URL(page.url()).origin);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

test('personal home has the approved portrait, usable navigation and picture favicon', async ({ page, request }, info) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Yeuanne Berry/);
  await expect(page.getByRole('img', { name: 'Yeuanne Berry', exact: true })).toBeVisible();
  const primary = page.getByRole('navigation', { name: 'Primary', exact: true });
  for (const [name, path] of [['Home', '/'], ['Work', '/work/'], ['Code', '/code/'], ['Berry docs', '/docs/'], ['About', '/about/']]) {
    await expect(primary.getByRole('link', { name, exact: true })).toHaveAttribute('href', path);
  }
  const favicon = page.locator('link[rel="icon"][type="image/png"]');
  await expect(favicon).toHaveCount(1);
  const faviconURL = new URL((await favicon.getAttribute('href'))!, page.url()).href;
  const response = await request.get(faviconURL);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/png');
  const bytes = await response.body();
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBe(32);
  expect(bytes.readUInt32BE(20)).toBe(32);
  expect(await page.evaluate(async url => {
    const image = new Image();
    image.src = url;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, faviconURL)).toEqual([32, 32]);
  await imagesLoaded(page);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('portfolio-home.png'), fullPage: true });
  await primary.getByRole('link', { name: 'Work', exact: true }).click();
  await expect(page).toHaveURL(/\/work\/$/);
});

test('all five work cards lead to readable case studies with accurate contribution credits', async ({ page }, info) => {
  await page.goto('/work/');
  await expect(page.locator('.work-card')).toHaveCount(projects.length);
  for (const project of projects) {
    const card = page.locator('.work-card').filter({ has: page.getByRole('heading', { name: project.title, exact: true }) });
    await expect(card).toContainText(project.role);
    await expect(card).toContainText('Delivered through Yappers');
    await expect(card.getByRole('heading').getByRole('link')).toHaveAttribute('href', `/work/${project.slug}/`);
  }
  await imagesLoaded(page);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath('portfolio-work.png'), fullPage: true });

  for (const project of projects) {
    await page.goto('/work/');
    await page.getByRole('heading', { name: project.title, exact: true }).getByRole('link').click();
    await expect(page).toHaveURL(new RegExp(`/work/${project.slug}/$`));
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${project.title}.`);
    await expect(page.locator('.case-facts')).toContainText(project.role);
    await expect(page.locator('.case-facts')).toContainText('Yappers');
    if (project.slug === 'softlysang') {
      await expect(page.locator('.case-copy')).toContainText('including the visuals and implementation');
      await expect(page.locator('.case-copy')).toContainText('birthday gift for my mother');
      await expect(page.locator('.case-credit')).toHaveText('Visuals and implementation by me.');
    } else {
      await expect(page.locator('.case-copy')).toContainText(/branding and theme were outside my contribution/i);
    }
    await expect(page.locator('main a[href*="github.com"]')).toHaveCount(0);
    await expect(page.getByRole('link', { name: `Visit ${project.title}`, exact: false }).first()).toHaveAttribute('href', project.url);
    await page.getByRole('navigation', { name: 'Project sections' }).getByRole('link', { name: /My contribution/ }).click();
    await expect(page).toHaveURL(/#my-contribution$/);
    await expect(page.locator('#my-contribution')).toBeInViewport();
    await imagesLoaded(page);
    await noOverflow(page);
    if (project.slug === 'softlysang') await page.screenshot({ path: info.outputPath('portfolio-case.png'), fullPage: true });
  }
});

test('public code collection separates forks from original repositories', async ({ page, request }) => {
  await page.goto('/code/');
  const cards = page.locator('.repository-card');
  expect(await cards.count()).toBeGreaterThanOrEqual(4);
  const original = cards.filter({ has: page.locator('a[href$="/Immersion-and-Programming-Colab-PT"]') });
  await expect(original).toHaveCount(1);
  await expect(original.getByRole('link').first()).toHaveAttribute('href', /^https:\/\/github\.com\/yeuanneberry\//);
  await expect(cards.filter({ hasText: /\bfork\b/i }).first()).toBeVisible();
  for (const card of await cards.all()) {
    await expect(card.getByRole('link').first()).toHaveAttribute('href', /^https:\/\/github\.com\/yeuanneberry\/[A-Za-z0-9_.-]+\/?$/);
  }
  const localLinks = await page.locator('main a[href^="/"]').evaluateAll(elements => [...new Set(elements.map(element => element.getAttribute('href')!))]);
  for (const href of localLinks) expect((await request.get(href)).status(), href).toBe(200);
  await noOverflow(page);
});

test('work browsing and case navigation remain usable without JavaScript', async ({ browser, baseURL }, info) => {
  const page = await browser.newPage({ baseURL, viewport: info.project.use.viewport, javaScriptEnabled: false });
  try {
    await page.goto('/work/');
    await expect(page.locator('.work-card')).toHaveCount(5);
    await page.getByRole('heading', { name: 'SoftlySang', exact: true }).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('SoftlySang.');
    await page.getByRole('navigation', { name: 'Project sections' }).getByRole('link', { name: /What I delivered/ }).click();
    await expect(page.locator('#delivery')).toBeInViewport();
    await page.getByRole('navigation', { name: 'More projects' }).getByRole('link', { name: /Next project/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('LKT.');
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL(/\/about\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await noOverflow(page);
  } finally { await page.close(); }
});

test('portfolio uses approved public links and has no missing assets or browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  for (const path of ['/', '/work/', '/code/', '/about/', ...projects.map(project => `/work/${project.slug}/`)]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    const links = await page.locator('a').evaluateAll(elements => elements.map(element => element.href));
    const allowedHosts = new Set([
      new URL(page.url()).host, 'github.com',
      ...projects.map(project => new URL(project.url).host),
    ]);
    for (const link of links) expect(allowedHosts.has(new URL(link).host), link).toBe(true);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await imagesLoaded(page);
    await noOverflow(page);
  }
  expect(errors).toEqual([]);
});
