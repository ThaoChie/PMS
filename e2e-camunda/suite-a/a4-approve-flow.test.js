// e2e-camunda/suite-a/a4-approve-flow.test.js
// A4: PM2 thấy yêu cầu ở tab "Chờ tôi duyệt", duyệt cấp 1; timeline cập nhật; Admin duyệt cấp 2;
// yêu cầu thành APPROVED, applyStatus APPLIED, và dự án thật sự CLOSED (xác nhận cả trên giao diện danh sách dự án lẫn qua API)

import { injectAuthSession } from '../helpers/auth.js';
import {
  setupProjectWithTwoPMs,
  createApprovalRequestApi,
  getApprovalRequestApi,
  getProjectApi,
  loginApi,
  DEV_USERS,
  FRONTEND_URL,
} from '../helpers/api.js';
import { takeScreenshot, waitForCondition, clickWhenReady } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA4(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A4${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A4-${timestamp}`;

  try {
    // 1. Chuẩn bị dự án và yêu cầu duyệt qua API
    const { project, pm1Auth, pm2Auth } = await setupProjectWithTwoPMs(projectKey, projectName);
    const adminAuth = await loginApi(DEV_USERS.ADMIN.email, DEV_USERS.ADMIN.password);

    const createRes = await createApprovalRequestApi(pm1Auth.accessToken, {
      projectId: project.id,
      type: 'PROJECT_CLOSE',
      reason: `Đóng dự án ${projectKey} sau khi hoàn tất kiểm thử E2E hai cấp duyệt`,
    });
    const requestId = createRes.body.data.id;

    // 2. PM2 đăng nhập và duyệt Cấp 1
    await injectAuthSession(page, pm2Auth.user, pm2Auth.accessToken);
    await page.goto(`${FRONTEND_URL}/approvals`, { waitUntil: 'networkidle0' });

    // Kiểm tra tab "Chờ tôi duyệt"
    await clickWhenReady(page, '[data-testid="tab-pending-for-me"]');

    // Chờ thẻ yêu cầu xuất hiện
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
      `PM2 không thấy yêu cầu #${requestId} ở tab Chờ tôi duyệt`
    );

    // Chờ Drawer mở ra và nhập ghi chú phê duyệt
    await page.waitForSelector('[data-testid="btn-approve-request"]', { visible: true, timeout: 5000 });
    await page.type('[data-testid="input-approve-comment"]', 'PM2 đồng ý phê duyệt Cấp 1');
    await page.click('[data-testid="btn-approve-request"]');

    // Chờ Drawer đóng hoặc hoàn tất phê duyệt Cấp 1
    await waitForCondition(
      async () => {
        const req = await getApprovalRequestApi(pm2Auth.accessToken, requestId);
        return req.steps[0].status === 'APPROVED';
      },
      8000,
      200,
      'Cấp 1 chưa được cập nhật sang APPROVED trên API'
    );
    await takeScreenshot(page, 'A4_pm2_approved_level1');

    // 3. Admin đăng nhập và duyệt Cấp 2
    await injectAuthSession(page, adminAuth.user, adminAuth.accessToken);
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
      `Admin không thấy yêu cầu #${requestId} ở tab Chờ tôi duyệt (Cấp 2)`
    );

    await page.waitForSelector('[data-testid="btn-approve-request"]', { visible: true, timeout: 5000 });
    await page.type('[data-testid="input-approve-comment"]', 'Admin phê duyệt Cấp 2 và đóng dự án');
    await page.click('[data-testid="btn-approve-request"]');

    // 4. Chờ Flowable hoàn thành: status = APPROVED, applyStatus = APPLIED
    let finalReq;
    await waitForCondition(
      async () => {
        finalReq = await getApprovalRequestApi(adminAuth.accessToken, requestId);
        return finalReq.status === 'APPROVED' && finalReq.applyStatus === 'APPLIED';
      },
      10000,
      300,
      'Yêu cầu chưa chuyển sang APPROVED/APPLIED sau khi Admin duyệt'
    );
    assert.strictEqual(finalReq.status, 'APPROVED');
    assert.strictEqual(finalReq.applyStatus, 'APPLIED');

    // 5. Xác nhận trạng thái dự án thật sự CLOSED qua API
    const updatedProject = await getProjectApi(pm1Auth.accessToken, project.id);
    assert.ok(updatedProject, 'Không lấy được thông tin dự án qua API');
    assert.strictEqual(updatedProject.status, 'CLOSED', 'Dự án phải chuyển sang CLOSED trên API');

    // 6. Xác nhận trên giao diện danh sách dự án của PM1 (người tạo/sở hữu dự án)
    await injectAuthSession(page, pm1Auth.user, pm1Auth.accessToken);
    await page.goto(`${FRONTEND_URL}/projects`, { waitUntil: 'networkidle0' });
    await waitForCondition(
      async () => {
        const content = await page.evaluate(() => document.body.innerText);
        return content.includes(projectKey) && (content.includes('Đã đóng') || content.includes('Closed') || content.includes('CLOSED'));
      },
      8000,
      200,
      'Giao diện danh sách dự án chưa hiển thị dự án ở trạng thái CLOSED'
    );

    const screenshot = await takeScreenshot(page, 'A4_admin_approved_level2_project_closed');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A4_approve_flow_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
