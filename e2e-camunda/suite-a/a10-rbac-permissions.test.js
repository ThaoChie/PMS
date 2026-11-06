// e2e-camunda/suite-a/a10-rbac-permissions.test.js
// A10: Phân quyền: Member thường không tạo được yêu cầu (nút/API bị chặn);
// người không phải người duyệt không thấy nút duyệt

import { injectAuthSession } from '../helpers/auth.js';
import {
  setupProjectWithTwoPMs,
  inviteAndAcceptMemberApi,
  createApprovalRequestApi,
  loginApi,
  DEV_USERS,
  FRONTEND_URL,
} from '../helpers/api.js';
import { takeScreenshot, waitForCondition, clickWhenReady } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA10(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A10${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A10-${timestamp}`;

  try {
    // 1. Chuẩn bị dự án với PM1, PM2 và mời Member (Tom Wright) với vai trò MEMBER
    const { project, pm1Auth } = await setupProjectWithTwoPMs(projectKey, projectName);
    const memberAuth = await loginApi(DEV_USERS.MEMBER.email, DEV_USERS.MEMBER.password);
    await inviteAndAcceptMemberApi(pm1Auth.accessToken, memberAuth.accessToken, project.id, DEV_USERS.MEMBER.email, 'MEMBER');

    // 2. Kiểm thử: Member thường gọi API tạo yêu cầu duyệt -> Phải bị chặn 403 FORBIDDEN
    const memberCreateRes = await createApprovalRequestApi(memberAuth.accessToken, {
      projectId: project.id,
      type: 'PROJECT_CLOSE',
      reason: 'Member cố tình tạo yêu cầu duyệt đóng dự án',
    });
    assert.strictEqual(
      memberCreateRes.status,
      403,
      `API phải chặn Member tạo yêu cầu duyệt với mã 403, thực tế trả về: ${memberCreateRes.status}`
    );

    // 3. PM1 tạo yêu cầu hợp lệ để PM2 duyệt
    const validReqRes = await createApprovalRequestApi(pm1Auth.accessToken, {
      projectId: project.id,
      type: 'PROJECT_CLOSE',
      reason: 'Yêu cầu kiểm thử xem Member có thấy nút duyệt hay không',
    });
    const requestId = validReqRes.body.data.id;

    // 4. Member đăng nhập vào giao diện và mở chi tiết yêu cầu
    await injectAuthSession(page, memberAuth.user, memberAuth.accessToken);
    await page.goto(`${FRONTEND_URL}/approvals`, { waitUntil: 'networkidle0' });

    await clickWhenReady(page, '[data-testid="tab-project-requests"]');
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

    // 5. Kiểm tra: Member KHÔNG THẤY nút Phê duyệt hay Từ chối
    const approveBtn = await page.$('[data-testid="btn-approve-request"]');
    const rejectBtn = await page.$('[data-testid="btn-reject-request"]');
    assert.strictEqual(approveBtn, null, 'Member không được thấy nút Phê duyệt');
    assert.strictEqual(rejectBtn, null, 'Member không được thấy nút Từ chối');

    const screenshot = await takeScreenshot(page, 'A10_member_forbidden_and_no_decision_buttons');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A10_rbac_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
