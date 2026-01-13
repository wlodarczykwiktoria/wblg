import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = config.projects[0].use?.baseURL as string;
  await page.goto(baseURL);

  await page.evaluate(() => {
    localStorage.setItem('session_id', 'e2e-session');
  });

  await page.context().storageState({ path: 'playwright.storageState.json' });
  await browser.close();
}

export default globalSetup;