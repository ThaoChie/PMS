// e2e-camunda/suite-b/b3-close-project-success.test.js
// B3: Khi cờ Camunda tắt: Đóng dự án qua trang cài đặt hiện có vẫn hoạt động như trước (dự án chuyển CLOSED trực tiếp)

import { injectAuthSession } from '../helpers/auth.js';
import { createProjectApi, getProjectApi, loginApi, DEV_USERS, FRONTEND_URL } from '../helpers/api.js';
import { takeScreenshot, waitForCondition } from '../helpers/browser.js';
import assert from 'node:assert/strict';

export async function runB3(browser) {
  const page = await browser.newPage();
  const timestamp = Date.now();
  const projectKey = `B3${String(timestamp).slice(-4)}`;
  const projectName = `E2E-B3-${timestamp}`;

  try {
    const pm1Auth = await loginApi(DEV_USERS.PM1.email, DEV_USERS.PM1.password);
    const project = await createProjectApi(pm1Auth.accessToken, {
      key: projectKey,
      name: projectName,
      description: 'Dự án test đóng trực tiếp khi cờ Camunda tắt',
    });

    await injectAuthSession(page, pm1Auth.user, pm1Auth.accessToken);
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0' });

    // Chọn dự án vừa tạo qua ProjectSwitcher trên Sidebar nếu chưa phải active
    await page.waitForSelector('aside', { visible: true });
    await page.evaluate((pName) => {
      const switcherBtn = Array.from(document.querySelectorAll('aside button')).find(
        (b) => b.querySelector('svg.lucide-chevron-down')
      );
      if (switcherBtn) switcherBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate((pName) => {
      const items = Array.from(document.querySelectorAll('aside div.absolute button'));
      const target = items.find((el) => el.innerText.includes(pName));
      if (target) target.click();
    }, projectName);
    await new Promise((r) => setTimeout(r, 1000));

    // Bấm vào menu "Cài đặt dự án" trên Sidebar
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

    // Mở modal Đóng dự án…
    await page.waitForSelector('button', { visible: true });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.innerText.includes('Đóng dự án…'));
      if (target) target.click();
    });

    // Nhập tên dự án để xác nhận
    const currentProjectName = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      return heading ? heading.innerText.trim() : '';
    });

    const confirmInput = await page.waitForSelector('input[placeholder]', { visible: true, timeout: 5000 });
    await confirmInput.type(currentProjectName);

    // Bấm xác nhận đóng dự án
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.innerText.includes('Xác nhận đóng dự án'));
      if (target && !target.disabled) target.click();
    });

    // Khi cờ tắt: Đóng dự án thành công trực tiếp (thông báo thành công)
    await waitForCondition(
      async () => {
        const text = await page.evaluate(() => document.body.innerText);
        return text.includes('đã được đóng thành công') || text.includes('Closed');
      },
      8000,
      200,
      'Không thấy thông báo đóng dự án thành công khi cờ tắt'
    );

    // Xác nhận qua API
    const updated = await getProjectApi(pm1Auth.accessToken, project.id);
    assert.strictEqual(updated.status, 'CLOSED', 'Dự án phải chuyển sang CLOSED trực tiếp');

    const screenshot = await takeScreenshot(page, 'B3_close_project_direct_success');
    return { status: 'PASS', screenshot };
  } catch (err) {
    const screenshot = await takeScreenshot(page, 'B3_close_project_error');
    throw { error: err.message, screenshot };
  } finally {
    await page.close();
  }
}
