// e2e-camunda/suite-a/a5-reject-flow.test.js
// A5: Luồng từ chối: Reject bắt buộc nhập lý do (thiếu thì bị chặn); sau khi từ chối, PM1 thấy trạng thái REJECTED kèm lý do

import { injectAuthSession } from '../helpers/auth.js';
import { setupProjectWithTwoPMs, createApprovalRequestApi, getApprovalRequestApi, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition, clickWhenReady } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA5(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A5${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A5-${timestamp}`;

  try {
    // 1. Chuẩn bị dự án và yêu cầu duyệt qua API
    const { project, pm1Auth, pm2Auth } = await setupProjectWithTwoPMs(projectKey, projectName);
    const createRes = await createApprovalRequestApi(pm1Auth.accessToken, {
      projectId: project.id,
      type: 'PROJECT_CLOSE',
      reason: `Yêu cầu đóng ${projectKey} để kiểm thử luồng từ chối`,
    });
    const requestId = createRes.body.data.id;

    // 2. PM2 đăng nhập và mở chi tiết yêu cầu
    await injectAuthSession(page, pm2Auth.user, pm2Auth.accessToken);
    await page.goto(`${FRONTEND_URL}/approvals`, { waitUntil: 'networkidle0' });

    await clickWhenReady(page, '[data-testid="tab-pending-for-me"]');
    await waitForCondition(
      async () => {
        const card = await page.$(`[data-testid="approval-request-card"][data-request-id="${requestId}"]`);
        if (card) {
          await card.click();
          return true;
        }
        return false;
      },
      8000,
      200,
      `PM2 không thấy yêu cầu #${requestId}`
    );

    // Mở modal từ chối
    await clickWhenReady(page, '[data-testid="btn-reject-request"]');
    await page.waitForSelector('[data-testid="reject-approval-modal"]', { visible: true, timeout: 5000 });

    // 3. Kiểm thử: Thiếu lý do từ chối thì bị chặn
    await page.click('[data-testid="btn-confirm-reject"]');
    await waitForCondition(
      async () => {
        const errEl = await page.$('[data-testid="reject-error-message"]');
        if (!errEl) return false;
        const text = await page.evaluate((el) => el.textContent, errEl);
        return text.includes('Vui lòng nhập lý do từ chối');
      },
      5000,
      200,
      'Phải hiển thị thông báo lỗi bắt buộc nhập lý do từ chối'
    );
    await takeScreenshot(page, 'A5_reject_missing_reason_blocked');

    // 4. Nhập lý do từ chối và xác nhận
    const rejectReason = 'Từ chối đóng dự án do chưa hoàn thành kiểm thử hồi quy';
    await page.type('[data-testid="textarea-reject-comment"]', rejectReason);
    await page.click('[data-testid="btn-confirm-reject"]');

    // Chờ yêu cầu chuyển sang REJECTED trên API
    await waitForCondition(
      async () => {
        const req = await getApprovalRequestApi(pm2Auth.accessToken, requestId);
        return req.status === 'REJECTED';
      },
      8000,
      200,
      'Yêu cầu chưa chuyển sang REJECTED'
    );

    // 5. PM1 đăng nhập và kiểm tra lại trạng thái cùng lý do từ chối
    await injectAuthSession(page, pm1Auth.user, pm1Auth.accessToken);
    await page.goto(`${FRONTEND_URL}/approvals`, { waitUntil: 'networkidle0' });
    await clickWhenReady(page, '[data-testid="tab-project-requests"]');

    // Chờ filter-project xuất hiện và chọn dự án vừa tạo
    await page.waitForSelector('[data-testid="filter-project"]', { timeout: 8000 });
    await page.select('[data-testid="filter-project"]', String(project.id));

    await waitForCondition(
      async () => {
        const card = await page.$(`[data-testid="approval-request-card"][data-request-id="${requestId}"]`);
        if (card) {
          await card.click();
          return true;
        }
        return false;
      },
      8000,
      200,
      `PM1 không mở được chi tiết yêu cầu #${requestId}`
    );

    await page.waitForSelector('[data-testid="approval-detail-drawer"]', { visible: true });

    // Kiểm tra Drawer hiển thị trạng thái REJECTED và lý do từ chối
    const drawerText = await page.$eval('[data-testid="approval-detail-drawer"]', (el) => el.innerText);
    assert.ok(drawerText.includes('Từ chối') || drawerText.includes('REJECTED'), 'Drawer phải hiển thị trạng thái Từ chối');
    assert.ok(drawerText.includes(rejectReason), 'Drawer phải hiển thị lý do từ chối của PM2');

    const screenshot = await takeScreenshot(page, 'A5_rejected_with_reason');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A5_reject_flow_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
