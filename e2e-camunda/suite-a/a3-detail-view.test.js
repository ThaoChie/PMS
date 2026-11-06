// e2e-camunda/suite-a/a3-detail-view.test.js
// A3: PM1 (người yêu cầu) mở chi tiết: KHÔNG thấy nút Approve/Reject cho yêu cầu của chính mình, thấy nút Hủy

import { injectAuthSession } from '../helpers/auth.js';
import { setupProjectWithTwoPMs, createApprovalRequestApi, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition, clickWhenReady } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA3(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A3${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A3-${timestamp}`;

  try {
    // 1. Chuẩn bị dự án và yêu cầu duyệt qua API
    const { project, pm1Auth } = await setupProjectWithTwoPMs(projectKey, projectName);
    const createRes = await createApprovalRequestApi(pm1Auth.accessToken, {
      projectId: project.id,
      type: 'PROJECT_CLOSE',
      reason: `Yêu cầu đóng dự án kiểm tra nút duyệt/hủy của PM1 (${projectKey})`,
    });
    const requestId = createRes.body.data.id;

    // 2. PM1 đăng nhập và điều hướng vào màn approvals
    await injectAuthSession(page, pm1Auth.user, pm1Auth.accessToken);
    await page.goto(`${FRONTEND_URL}/approvals`, { waitUntil: 'networkidle0' });

    // Chuyển sang tab "Yêu cầu trong dự án"
    await clickWhenReady(page, '[data-testid="tab-project-requests"]');

    // Chờ filter-project xuất hiện và chọn dự án vừa tạo
    await page.waitForSelector('[data-testid="filter-project"]', { timeout: 8000 });
    await page.select('[data-testid="filter-project"]', String(project.id));

    // Chờ thẻ yêu cầu xuất hiện và bấm vào để mở Detail Drawer
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
      `Không tìm thấy thẻ yêu cầu #${requestId} để mở drawer`
    );

    // Chờ Drawer mở ra
    await page.waitForSelector('[data-testid="approval-detail-drawer"]', { visible: true, timeout: 5000 });

    // 3. Khẳng định: PM1 KHÔNG thấy nút Phê duyệt / Từ chối (vì là người yêu cầu)
    const approveBtn = await page.$('[data-testid="btn-approve-request"]');
    const rejectBtn = await page.$('[data-testid="btn-reject-request"]');
    assert.strictEqual(approveBtn, null, 'PM1 là người yêu cầu không được thấy nút Phê duyệt');
    assert.strictEqual(rejectBtn, null, 'PM1 là người yêu cầu không được thấy nút Từ chối');

    // 4. Khẳng định: PM1 thấy nút Hủy yêu cầu
    const cancelBtn = await page.$('[data-testid="btn-cancel-request"]');
    assert.ok(cancelBtn, 'PM1 phải thấy nút Hủy yêu cầu');
    const cancelText = await page.evaluate((el) => el.textContent, cancelBtn);
    assert.ok(cancelText.includes('Hủy yêu cầu này'), `Nút hủy phải có chữ 'Hủy yêu cầu này', thực tế: '${cancelText}'`);

    const screenshot = await takeScreenshot(page, 'A3_requester_cannot_approve_own_request');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A3_detail_view_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
