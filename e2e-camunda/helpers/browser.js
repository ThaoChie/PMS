// e2e-camunda/helpers/browser.js
// Quản lý Puppeteer browser instance, viewport, chụp ảnh màn hình và các helper chờ theo điều kiện

import puppeteer from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts');

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

export async function launchBrowser() {
  const isHeaded = process.env.HEADED === '1';
  const chromePath = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

  const launchOptions = {
    headless: isHeaded ? false : true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,800',
    ],
    defaultViewport: {
      width: 1280,
      height: 800,
    },
  };

  if (fs.existsSync(chromePath)) {
    launchOptions.executablePath = chromePath;
  }

  const browser = await puppeteer.launch(launchOptions);
  return browser;
}

export async function takeScreenshot(page, name) {
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitized}.png`;
  const filePath = path.join(ARTIFACTS_DIR, filename);
  await page.screenshot({ path: filePath, fullPage: true });
  return filename;
}

// Chờ điều kiện có timeout rõ ràng (không dùng sleep cố định)
export async function waitForCondition(checkFn, timeout = 10000, interval = 200, failureMessage = 'Timeout vượt quá điều kiện chờ') {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const res = await checkFn();
      if (res) return res;
    } catch {
      // Tiếp tục thử lại đến khi hết timeout
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`${failureMessage} (sau ${timeout}ms)`);
}

export async function waitForSelectorVisible(page, selector, timeout = 10000) {
  return await page.waitForSelector(selector, { visible: true, timeout });
}

export async function clickWhenReady(page, selector, timeout = 10000) {
  await page.waitForSelector(selector, { visible: true, timeout });
  await page.click(selector);
}

export async function typeWhenReady(page, selector, text, timeout = 10000) {
  await page.waitForSelector(selector, { visible: true, timeout });
  await page.focus(selector);
  // Xóa nội dung cũ nếu có
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.value = '';
  }, selector);
  await page.type(selector, text);
}
