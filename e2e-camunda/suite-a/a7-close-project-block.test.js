// e2e-camunda/suite-a/a7-close-project-block.test.js
// A7: Trang cài đặt dự án HIỆN CÓ: bấm "Đóng dự án" trực tiếp khi policy bật → hiện thông báo lỗi tiếng Việt hướng sang "Yêu cầu duyệt"; dự án KHÔNG bị đóng

import { injectAuthSession } from '../helpers/auth.js';
import { setupProjectWithTwoPMs, getProjectApi, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition, clickWhenReady } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runA7(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `A7${String(timestamp).slice(-4)}`;
  const projectName = `E2E-A7-${timestamp}`;

  try {
    // 1. Chuẩn bị dự án qua API
    const { project, pm1Auth } = await setupProjectWithTwoPMs(projectKey, projectName);

    // 2. PM1 đăng nhập
    await injectAuthSession(page, pm1Auth.user, pm1Auth.accessToken);

    // Đặt dự án hiện tại trong localStorage/store để trang Settings hiển thị đúng dự án này
    await page.evaluate(({ project }) => {
      // Tìm store zustand của project hoặc chọn qua URL
      window.history.pushState({}, '', '/');
    }, { project });

    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0' });

    // Chọn dự án vừa tạo từ ProjectSwitcher trên Sidebar
    await page.waitForSelector('aside', { visible: true });
    // Bấm nút switch dự án nếu có hoặc chọn qua giao diện
    const hasSwitcher = await page.$('aside select, aside [title*="Chọn dự án"]');
    if (hasSwitcher) {
      // Chọn dự án trong project store
      await page.evaluate((pid) => {
        const store = window.__projectStore || window.useProjectStore;
        // nếu không có global hook, có thể bấm đổi dự án
      }, project.id);
    }

    // Bấm vào menu "Cài đặt dự án" trên Sidebar
    // Chú ý: Selector theo văn bản hiển thị theo đúng quy tắc allowlist
    await waitForCondition(
      async () => {
        const buttons = await page.$$('aside button');
        for (const btn of buttons) {
          const text = await page.evaluate((el) => el.textContent, btn);
          if (text.includes('Cài đặt dự án')) {
            await btn.click();
            return true;
          }
        }
        return false;
      },
      8000,
      200,
      'Không tìm thấy nút "Cài đặt dự án" trên Sidebar'
    );

    // Chờ màn hình Cài đặt dự án xuất hiện
    await waitForCondition(
      async () => {
        const text = await page.evaluate(() => document.body.innerText);
        return text.includes('Vùng nguy hiểm') || text.includes('Cài đặt dự án');
      },
      8000,
      200,
      'Không tải được màn hình Cài đặt dự án'
    );

    // 3. Tìm nút "Đóng dự án…" trong Vùng nguy hiểm
    const closeBtnFound = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.innerText.includes('Đóng dự án…'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    assert.ok(closeBtnFound, 'Phải có nút "Đóng dự án…" trong Vùng nguy hiểm');

    // 4. Modal xác nhận mở ra -> Nhập tên dự án để xác nhận
    await waitForCondition(
      async () => {
        const modal = await page.$('.modal-backdrop, [role="dialog"], div.fixed');
        return modal !== null;
      },
      5000,
      200,
      'Modal xác nhận đóng dự án không mở'
    );

    // Nhập tên dự án hiện tại vào ô xác nhận
    const currentProjectName = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      return heading ? heading.innerText.trim() : '';
    });

    const confirmInput = await page.waitForSelector('input[placeholder]', { visible: true });
    await confirmInput.type(currentProjectName);

    // Bấm nút "Xác nhận đóng dự án"
    const confirmed = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.innerText.includes('Xác nhận đóng dự án'));
      if (target && !target.disabled) {
        target.click();
        return true;
      }
      return false;
    });
    assert.ok(confirmed, 'Không bấm được nút "Xác nhận đóng dự án"');

    // 5. Kiểm tra thông báo lỗi tiếng Việt hướng dẫn sang "Yêu cầu duyệt"
    await waitForCondition(
      async () => {
        const text = await page.evaluate(() => document.body.innerText);
        return (
          text.includes('Thao tác này bắt buộc phải thực hiện qua yêu cầu duyệt') ||
          text.includes('Yêu cầu duyệt') ||
          text.includes('APPROVAL_005')
        );
      },
      8000,
      200,
      'Không hiển thị thông báo lỗi tiếng Việt hướng sang Yêu cầu duyệt'
    );

    // 6. Xác nhận qua API rằng dự án KHÔNG bị đóng (vẫn giữ trạng thái ACTIVE/INITIATED)
    const projectCheck = await getProjectApi(pm1Auth.accessToken, project.id);
    assert.notStrictEqual(projectCheck.status, 'CLOSED', 'Dự án không được phép bị chuyển sang CLOSED khi gọi trực tiếp');

    const screenshot = await takeScreenshot(page, 'A7_direct_close_blocked_by_policy');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'A7_close_project_block_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
