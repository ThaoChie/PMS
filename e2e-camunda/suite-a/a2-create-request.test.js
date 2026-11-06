// e2e-camunda/suite-a/a2-create-request.test.js
// A2: PM1 tạo yêu cầu PROJECT_CLOSE từ modal: thiếu lý do bị chặn; tạo hợp lệ thành công; tạo lần 2 cùng loại báo trùng (APPROVAL_001)

import { injectAuthSession } from '../helpers/auth.js';
import { setupProjectWithTwoPMs, DEV_USERS, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition, clickWhenReady, typeWhenReady } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA2(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A2${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A2-${timestamp}`;

  try {
    // Chuẩn bị dữ liệu nhanh qua API: Tạo dự án riêng cho kịch bản A2
    const { project, pm1Auth } = await setupProjectWithTwoPMs(projectKey, projectName);

    // Đăng nhập PM1 qua injectAuthSession
    await injectAuthSession(page, pm1Auth.user, pm1Auth.accessToken);

    // Điều hướng vào trang approvals
    await page.goto(`${FRONTEND_URL}/approvals`, { waitUntil: 'networkidle0' });

    // 1. Mở modal tạo yêu cầu duyệt
    await clickWhenReady(page, '[data-testid="btn-open-create-modal"]');
    await page.waitForSelector('[data-testid="create-approval-modal"]', { visible: true, timeout: 5000 });

    // Chọn dự án vừa tạo
    await page.select('[data-testid="select-approval-project"]', String(project.id));
    await page.select('[data-testid="select-approval-type"]', 'PROJECT_CLOSE');

    // 2. Kiểm thử: Thiếu lý do bị chặn (bỏ trống ô textarea)
    // Lưu ý: textarea có thuộc tính `required` của HTML5 và kiểm tra validate frontend
    // Bấm nút gửi trực tiếp mà không nhập lý do
    await page.evaluate(() => {
      const textarea = document.querySelector('[data-testid="textarea-approval-reason"]');
      if (textarea) textarea.value = '';
    });
    await page.click('[data-testid="btn-submit-approval"]');

    // Modal vẫn phải mở (chưa gửi đi được)
    const isModalStillOpen = await page.$eval('[data-testid="create-approval-modal"]', (el) => !!el);
    assert.ok(isModalStillOpen, 'Modal không được đóng khi chưa nhập lý do');

    // 3. Nhập lý do hợp lệ và gửi yêu cầu
    const validReason = `Hoàn thành nghiệm thu toàn bộ tính năng dự án ${projectKey} để bàn giao`;
    await page.type('[data-testid="textarea-approval-reason"]', validReason);
    await page.click('[data-testid="btn-submit-approval"]');

    // Chờ modal đóng lại sau khi gửi thành công
    await waitForCondition(
      async () => {
        const modal = await page.$('[data-testid="create-approval-modal"]');
        return modal === null;
      },
      8000,
      200,
      'Modal phải đóng sau khi tạo yêu cầu hợp lệ'
    );

    // Chuyển sang tab "Yêu cầu trong dự án" để kiểm tra yêu cầu vừa tạo xuất hiện
    await clickWhenReady(page, '[data-testid="tab-project-requests"]');

    // Chọn dự án vừa tạo trong filter nếu có
    const projectFilter = await page.$('[data-testid="filter-project"]');
    if (projectFilter) {
      await page.select('[data-testid="filter-project"]', String(project.id));
    }

    await waitForCondition(
      async () => {
        const cards = await page.$$('[data-testid="approval-request-card"]');
        for (const card of cards) {
          const text = await page.evaluate((el) => el.textContent, card);
          if (text.includes(projectKey) || text.includes(validReason)) return true;
        }
        return false;
      },
      8000,
      200,
      'Yêu cầu vừa tạo phải xuất hiện trong danh sách'
    );

    // 4. Tạo lần 2 cùng loại cho dự án này -> Phải báo trùng APPROVAL_001
    await clickWhenReady(page, '[data-testid="btn-open-create-modal"]');
    await page.waitForSelector('[data-testid="create-approval-modal"]', { visible: true });

    await page.select('[data-testid="select-approval-project"]', String(project.id));
    await page.select('[data-testid="select-approval-type"]', 'PROJECT_CLOSE');
    await page.type('[data-testid="textarea-approval-reason"]', 'Thử tạo yêu cầu đóng lần 2 cho cùng dự án');
    await page.click('[data-testid="btn-submit-approval"]');

    // Kiểm tra thông báo lỗi xuất hiện trong modal
    await waitForCondition(
      async () => {
        const errEl = await page.$('[data-testid="create-approval-error"]');
        if (!errEl) return false;
        const msg = await page.evaluate((el) => el.textContent, errEl);
        return msg.includes('đang chờ xử lý') || msg.includes('APPROVAL_001');
      },
      8000,
      200,
      'Phải hiển thị thông báo lỗi trùng yêu cầu đóng (APPROVAL_001)'
    );

    const screenshot = await takeScreenshot(page, 'A2_create_request_success_and_duplicate_blocked');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A2_create_request_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
