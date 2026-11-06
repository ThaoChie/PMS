// e2e-camunda/suite-a/a1-menu-nav.test.js
// A1: Menu "Yêu cầu duyệt" hiện với người dùng đã đăng nhập và điều hướng chính xác

import { loginViaUI } from '../helpers/auth.js';
import { DEV_USERS, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA1(browser) {
  const page = await browser.newPage();
  try {
    // Đăng nhập bằng tài khoản PM1 qua UI
    await loginViaUI(page, DEV_USERS.PM1.email, DEV_USERS.PM1.password);

    // Kiểm tra menu "Yêu cầu duyệt" xuất hiện trong sidebar
    const navItem = await page.waitForSelector('[data-testid="approval-nav-item"]', {
      visible: true,
      timeout: 10000,
    });
    assert.ok(navItem, 'Menu "Yêu cầu duyệt" phải xuất hiện trên Sidebar');

    const navText = await page.evaluate((el) => el.textContent, navItem);
    assert.ok(navText.includes('Yêu cầu duyệt'), `Văn bản menu phải chứa 'Yêu cầu duyệt', thực tế: '${navText}'`);

    // Bấm vào menu "Yêu cầu duyệt"
    await navItem.click();

    // Chờ màn hình Quản lý yêu cầu phê duyệt hiển thị
    await waitForCondition(
      async () => {
        const titleEl = await page.$('h1');
        if (!titleEl) return false;
        const text = await page.evaluate((el) => el.textContent, titleEl);
        return text.includes('Quản lý yêu cầu phê duyệt');
      },
      8000,
      200,
      'Không tải được màn hình Quản lý yêu cầu phê duyệt'
    );

    const screenshot = await takeScreenshot(page, 'A1_menu_approval_visible');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A1_menu_approval_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
