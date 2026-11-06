// e2e-camunda/suite-a/a8-workflow-change.test.js
// A8: WORKFLOW_CONFIG_CHANGE: tạo yêu cầu với payload hợp lệ, duyệt đủ cấp,
// xác nhận cấu hình Workflow của dự án đã đổi (qua API); payload không hợp lệ bị từ chối khi tạo

import { injectAuthSession } from '../helpers/auth.js';
import {
  setupProjectWithTwoPMs,
  getProjectWorkflowApi,
  getApprovalRequestApi,
  loginApi,
  DEV_USERS,
  FRONTEND_URL,
  BACKEND_URL,
} from '../helpers/api.js';
import { takeScreenshot, waitForCondition, clickWhenReady } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA8(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A8${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A8-${timestamp}`;

  try {
    // 1. Chuẩn bị dự án qua API
    const { project, pm1Auth, pm2Auth } = await setupProjectWithTwoPMs(projectKey, projectName);
    const adminAuth = await loginApi(DEV_USERS.ADMIN.email, DEV_USERS.ADMIN.password);

    // Lấy workflow mặc định hiện tại của dự án
    const currentWf = await getProjectWorkflowApi(pm1Auth.accessToken, project.id);
    assert.ok(currentWf.statuses && currentWf.statuses.length > 0, 'Dự án phải có workflow mặc định');

    // 2. PM1 đăng nhập và vào trang approvals
    await injectAuthSession(page, pm1Auth.user, pm1Auth.accessToken);
    await page.goto(`${FRONTEND_URL}/approvals`, { waitUntil: 'networkidle0' });

    // 3. Mở modal và thử payload KHÔNG hợp lệ
    await clickWhenReady(page, '[data-testid="btn-open-create-modal"]');
    await page.waitForSelector('[data-testid="create-approval-modal"]', { visible: true });

    await page.select('[data-testid="select-approval-project"]', String(project.id));
    await page.select('[data-testid="select-approval-type"]', 'WORKFLOW_CONFIG_CHANGE');
    await page.type('[data-testid="textarea-approval-reason"]', 'Thử nghiệm payload workflow lỗi');

    // Nhập payload không hợp lệ: danh sách rỗng {"statuses":[]}
    await page.type('[data-testid="textarea-approval-payload"]', '{"statuses":[]}');
    await page.click('[data-testid="btn-submit-approval"]');

    // Phải hiển thị lỗi từ chối khi tạo
    await waitForCondition(
      async () => {
        const errEl = await page.$('[data-testid="create-approval-error"]');
        if (!errEl) return false;
        const text = await page.evaluate((el) => el.textContent, errEl);
        return text.includes('không được trống') || text.includes('VALIDATION_ERROR') || text.includes('lỗi');
      },
      8000,
      200,
      'Phải từ chối tạo yêu cầu khi payload workflow không hợp lệ'
    );
    await takeScreenshot(page, 'A8_invalid_workflow_payload_rejected');

    // 4. Chuẩn bị payload hợp lệ: Đổi tên status đầu tiên thành 'To Do (E2E Approved)'
    const validStatuses = currentWf.statuses.map((s, idx) => ({
      id: s.id,
      name: idx === 0 ? 'To Do (E2E Approved)' : s.name,
      category: s.category,
      position: s.position,
      isInitial: s.isInitial,
    }));
    const validTransitions = (currentWf.transitions || []).map((t) => ({
      fromStatusName: t.fromStatus?.name || t.fromStatusName,
      toStatusName: t.toStatus?.name || t.toStatusName,
      name: t.name || 'Transition',
    }));
    const validPayloadJson = JSON.stringify({ statuses: validStatuses, transitions: validTransitions }, null, 2);

    // Xóa payload cũ và nhập payload hợp lệ
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="textarea-approval-payload"]');
      if (el) el.value = '';
    });
    await page.type('[data-testid="textarea-approval-payload"]', validPayloadJson);
    await page.click('[data-testid="btn-submit-approval"]');

    // Chờ modal đóng
    await waitForCondition(
      async () => {
        const modal = await page.$('[data-testid="create-approval-modal"]');
        return modal === null;
      },
      8000,
      200,
      'Modal phải đóng sau khi gửi payload hợp lệ'
    );

    // Lấy ID yêu cầu vừa tạo qua API
    const listRes = await fetch(`${BACKEND_URL}/api/projects/${project.id}/approval-requests`, {
      headers: { Authorization: `Bearer ${pm1Auth.accessToken}` },
    });
    const listData = await listRes.json();
    const wfReq = listData.data?.content?.[0] || (Array.isArray(listData.data) ? listData.data[0] : null);
    assert.ok(wfReq, 'Phải tìm thấy yêu cầu đổi workflow vừa tạo');
    const requestId = wfReq.id;

    // 5. Duyệt 2 cấp qua API (để tập trung kiểm tra nghiệp vụ và engine áp dụng workflow)
    await fetch(`${BACKEND_URL}/api/approval-requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pm2Auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: 'PM2 duyệt cấp 1 workflow' }),
    });

    await fetch(`${BACKEND_URL}/api/approval-requests/${requestId}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminAuth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: 'Admin duyệt cấp 2 workflow' }),
    });

    // 6. Chờ yêu cầu chuyển sang APPROVED và applyStatus APPLIED
    let finalReq;
    await waitForCondition(
      async () => {
        finalReq = await getApprovalRequestApi(adminAuth.accessToken, requestId);
        return finalReq.status === 'APPROVED' && finalReq.applyStatus === 'APPLIED';
      },
      10000,
      300,
      'Yêu cầu đổi workflow chưa đạt trạng thái APPLIED'
    );

    // 7. Xác nhận qua API: Cấu hình Workflow thực tế của dự án đã được đổi!
    const updatedWf = await getProjectWorkflowApi(pm1Auth.accessToken, project.id);
    assert.ok(updatedWf, 'Không lấy được workflow của dự án qua API');
    const newFirstName = updatedWf.statuses[0]?.name;
    assert.strictEqual(
      newFirstName,
      'To Do (E2E Approved)',
      `Tên trạng thái đầu tiên phải được đổi thành 'To Do (E2E Approved)', thực tế: '${newFirstName}'`
    );

    const screenshot = await takeScreenshot(page, 'A8_workflow_change_applied');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A8_workflow_change_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
