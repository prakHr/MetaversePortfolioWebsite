import { chromium } from 'playwright-core';

export default async function handler(req, res) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  
  // Example: Extract some data
  const title = await page.title();

  await browser.close();

  res.status(200).json({ title });
}
