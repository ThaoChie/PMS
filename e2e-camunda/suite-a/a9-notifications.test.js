// e2e-camunda/suite-a/a9-notifications.test.js
// A9: Thông báo: người duyệt thấy thông báo yêu cầu duyệt trên chuông;
// bấm vào chỉ đánh dấu đã đọc và KHÔNG chuyển sang board (hành vi đã thống nhất, data = null)

import { injectAuthSession } from '../helpers/auth.js';
import { setupProjectWithTwoPMs, createApprovalRequestApi, getNotificationsApi, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA9(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A9${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A9-${timestamp}`;

  try {
    // 1. Chuẩn bị dự án và yêu cầu duyệt qua API
    const { project, pm1Auth, pm2Auth } = await setupProjectWithTwoPMs(projectKey, projectName);
    const createRes = await createApprovalRequestApi(pm1Auth.accessToken, {
      projectId: project.id,
      type: 'PROJECT_CLOSE',
      reason: `Kiểm thử chuông thông báo phê duyệt cho PM2 (${projectKey})`,
    });
    const requestId = createRes.body.data.id;

    // Chờ backend gửi thông báo đến PM2 qua API
    await waitForCondition(
      async () => {
        const notifs = await getNotificationsApi(pm2Auth.accessToken);
        return notifs.some(
          (n) => n.type === 'approval' || n.title?.includes('duyệt') || (n.description && n.description.includes(projectName))
        );
      },
      8000,
      300,
      'Backend chưa gửi thông báo phê duyệt tới PM2'
    );

    // 2. PM2 đăng nhập vào frontend
    await injectAuthSession(page, pm2Auth.user, pm2Auth.accessToken);
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0' });

    // 3. Tìm chuông thông báo trên Topbar
    const bellBtn = await page.waitForSelector('header div.relative button', {
      visible: true,
      timeout: 8000,
    });
    assert.ok(bellBtn, 'Phải có chuông thông báo trên giao diện');

    // Bấm chuông thông báo để mở dropdown
    await bellBtn.click();

    // Chờ dropdown thông báo mở ra
    await waitForCondition(
      async () => {
        const text = await page.evaluate(() => document.body.innerText);
        return text.includes('Thông báo') && (text.includes('duyệt') || text.includes(projectName));
      },
      8000,
      200,
      'Dropdown thông báo không mở hoặc không chứa thông báo phê duyệt'
    );
    await takeScreenshot(page, 'A9_notification_bell_dropdown');

    // 4. Bấm vào mục thông báo phê duyệt
    const clickedItem = await page.evaluate((prjName) => {
      const items = Array.from(document.querySelectorAll('div.cursor-pointer, div[class*="hover:bg"]'));
      const target = items.find((el) => el.innerText.includes('duyệt') || (prjName && el.innerText.includes(prjName)));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, projectName);
    assert.ok(clickedItem, 'Không bấm được vào mục thông báo phê duyệt');

    // Đợi 1 giây để xử lý click và chuyển trang (nếu có)
    await new Promise((r) => setTimeout(r, 1000));

    // 5. Kiểm tra: KHÔNG được chuyển sang trang Bảng công việc (board)
    const afterUrl = page.url();
    const isBoard = afterUrl.includes('/board');
    assert.strictEqual(isBoard, false, `Bấm vào thông báo phê duyệt KHÔNG được chuyển sang board, URL hiện tại: ${afterUrl}`);

    const screenshot = await takeScreenshot(page, 'A9_notification_read_no_board_redirect');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A9_notification_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
