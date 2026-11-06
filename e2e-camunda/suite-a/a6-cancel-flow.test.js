// e2e-camunda/suite-a/a6-cancel-flow.test.js
// A6: Luồng hủy: PM1 hủy yêu cầu PENDING → CANCELLED; sau đó có thể tạo yêu cầu mới mà không bị lỗi trùng

import { injectAuthSession } from '../helpers/auth.js';
import { setupProjectWithTwoPMs, createApprovalRequestApi, getApprovalRequestApi, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition, clickWhenReady } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA6(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A6${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A6-${timestamp}`;

  try {
    // 1. Chuẩn bị dự án và yêu cầu duyệt qua API
    const { project, pm1Auth } = await setupProjectWithTwoPMs(projectKey, projectName);
    const createRes = await createApprovalRequestApi(pm1Auth.accessToken, {
      projectId: project.id,
      type: 'PROJECT_CLOSE',
      reason: `Yêu cầu đóng ${projectKey} để kiểm thử chức năng hủy`,
    });
    const requestId = createRes.body.data.id;

    // Lắng nghe hộp thoại confirm của trình duyệt
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 2. PM1 đăng nhập và mở chi tiết yêu cầu
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
      `Không tìm thấy yêu cầu #${requestId}`
    );

    await page.waitForSelector('[data-testid="approval-detail-drawer"]', { visible: true });

    // 3. PM1 bấm Hủy yêu cầu
    await clickWhenReady(page, '[data-testid="btn-cancel-request"]');

    // Chờ yêu cầu chuyển sang trạng thái CANCELLED trên API
    await waitForCondition(
      async () => {
        const req = await getApprovalRequestApi(pm1Auth.accessToken, requestId);
        return req.status === 'CANCELLED';
      },
      8000,
      200,
      'Yêu cầu chưa chuyển sang CANCELLED'
    );

    // Đóng drawer nếu còn mở
    const closeDrawerBtn = await page.$('[data-testid="btn-close-drawer"]');
    if (closeDrawerBtn) await closeDrawerBtn.click();

    // 4. Tạo yêu cầu mới cho cùng dự án này -> Phải thành công, không bị APPROVAL_001
    await clickWhenReady(page, '[data-testid="btn-open-create-modal"]');
    await page.waitForSelector('[data-testid="create-approval-modal"]', { visible: true });

    await page.select('[data-testid="select-approval-project"]', String(project.id));
    await page.select('[data-testid="select-approval-type"]', 'PROJECT_CLOSE');
    await page.type('[data-testid="textarea-approval-reason"]', 'Tạo yêu cầu đóng mới sau khi đã hủy yêu cầu cũ');
    await page.click('[data-testid="btn-submit-approval"]');

    // Chờ modal đóng thành công
    await waitForCondition(
      async () => {
        const modal = await page.$('[data-testid="create-approval-modal"]');
        return modal === null;
      },
      8000,
      200,
      'Phải tạo thành công yêu cầu mới sau khi hủy'
    );

    const screenshot = await takeScreenshot(page, 'A6_cancelled_and_recreated_success');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A6_cancel_flow_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
