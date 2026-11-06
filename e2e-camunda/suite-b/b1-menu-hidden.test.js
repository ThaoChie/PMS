// e2e-camunda/suite-b/b1-menu-hidden.test.js
// B1: Khi cờ Camunda tắt: Menu "Yêu cầu duyệt" KHÔNG hiện trên Sidebar

import { injectAuthSession } from '../helpers/auth.js';
import { loginApi, DEV_USERS, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runB1(browser) {
  const page = await browser.newPage();
  try {
    const auth = await loginApi(DEV_USERS.PM1.email, DEV_USERS.PM1.password);
    await injectAuthSession(page, auth.user, auth.accessToken);
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0' });

    await page.waitForSelector('aside', { visible: true, timeout: 8000 });

    // Đợi kiểm tra policy tải xong
    await new Promise((r) => setTimeout(r, 1000));

    // Khẳng định: Menu "Yêu cầu duyệt" KHÔNG hiển thị trên Sidebar
    const navItem = await page.$('[data-testid="approval-nav-item"]');
    assert.strictEqual(navItem, null, 'Khi cờ tắt, menu "Yêu cầu duyệt" không được hiển thị');

    const sidebarText = await page.$eval('aside', (el) => el.innerText);
    assert.ok(!sidebarText.includes('Yêu cầu duyệt'), 'Sidebar không được chứa văn bản "Yêu cầu duyệt" khi cờ tắt');

    const screenshot = await takeScreenshot(page, 'B1_menu_approval_hidden');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'B1_menu_hidden_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
