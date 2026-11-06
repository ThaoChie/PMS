// e2e-camunda/run.js
// Script thực thi chính bộ kiểm thử E2E Puppeteer cho các tính năng Camunda/Flowable

import { launchBrowser } from './helpers/browser.js';
import { getPolicyApi, loginApi, DEV_USERS, BACKEND_URL, FRONTEND_URL } from './helpers/api.js';

// Suite A imports
import { runA1 } from './suite-a/a1-menu-nav.test.js';
import { runA2 } from './suite-a/a2-create-request.test.js';
import { runA3 } from './suite-a/a3-detail-view.test.js';
import { runA4 } from './suite-a/a4-approve-flow.test.js';
import { runA5 } from './suite-a/a5-reject-flow.test.js';
import { runA6 } from './suite-a/a6-cancel-flow.test.js';
import { runA7 } from './suite-a/a7-close-project-block.test.js';
import { runA8 } from './suite-a/a8-workflow-change.test.js';
import { runA9 } from './suite-a/a9-notifications.test.js';
import { runA10 } from './suite-a/a10-rbac-permissions.test.js';

// Suite B imports
import { runB1 } from './suite-b/b1-menu-hidden.test.js';
import { runB2 } from './suite-b/b2-direct-url.test.js';
import { runB3 } from './suite-b/b3-close-project-success.test.js';

console.log('======================================================================');
console.log('BỘ KIỂM THỬ E2E PUPPETEER — TÍCH HỢP CAMUNDA / FLOWABLE (EPMS)');
console.log('======================================================================');
console.log(`Backend URL:  ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log(`Chế độ xem:   ${process.env.HEADED === '1' ? 'HEADED (Mở cửa sổ trình duyệt)' : 'HEADLESS'}`);
console.log('');

async function main() {
  // 1. Kiểm tra trạng thái chính sách thật từ API
  console.log('Đang kiểm tra trạng thái chính sách phê duyệt từ backend...');
  let policy;
  try {
    const auth = await loginApi(DEV_USERS.PM1.email, DEV_USERS.PM1.password);
    policy = await getPolicyApi(auth.accessToken);
  } catch (err) {
    console.error(`Lỗi kết nối tới backend để lấy chính sách: ${err.message}`);
    process.exit(1);
  }

  console.log('Chính sách hiện tại:');
  console.log(`- camunda.enabled:                 ${policy.enabled}`);
  console.log(`- closeRequiresApproval:          ${policy.closeRequiresApproval}`);
  console.log(`- workflowChangeRequiresApproval:  ${policy.workflowChangeRequiresApproval}`);
  console.log('');

  const isSuiteAMatched = policy.enabled === true && policy.closeRequiresApproval === true;
  const isSuiteBMatched = policy.enabled === false;

  const results = [];
  const browser = await launchBrowser();

  const scenariosA = [
    { id: 'A1', name: 'Menu "Yêu cầu duyệt" hiện với người dùng đã đăng nhập', fn: runA1 },
    { id: 'A2', name: 'Tạo yêu cầu PROJECT_CLOSE từ modal (chặn rỗng, tạo thành công, báo trùng)', fn: runA2 },
    { id: 'A3', name: 'Người yêu cầu không thấy nút Duyệt/Từ chối cho yêu cầu của mình, thấy nút Hủy', fn: runA3 },
    { id: 'A4', name: 'PM2 duyệt cấp 1, Admin duyệt cấp 2 -> APPROVED, APPLIED và dự án CLOSED', fn: runA4 },
    { id: 'A5', name: 'Luồng từ chối: bắt buộc lý do, PM1 thấy REJECTED kèm lý do', fn: runA5 },
    { id: 'A6', name: 'Luồng hủy: hủy yêu cầu PENDING -> CANCELLED, tạo lại được yêu cầu mới', fn: runA6 },
    { id: 'A7', name: 'Trang cài đặt dự án cũ: bấm Đóng dự án bị chặn 422, hiện lỗi tiếng Việt', fn: runA7 },
    { id: 'A8', name: 'WORKFLOW_CONFIG_CHANGE: tạo hợp lệ, duyệt đủ cấp, đổi workflow dự án thật', fn: runA8 },
    { id: 'A9', name: 'Chuông thông báo: hiện thông báo duyệt, click đánh dấu đọc và không vào board', fn: runA9 },
    { id: 'A10', name: 'Phân quyền: Member bị chặn tạo yêu cầu, không thấy nút duyệt', fn: runA10 },
  ];

  const scenariosB = [
    { id: 'B1', name: 'Menu "Yêu cầu duyệt" KHÔNG hiện khi cờ tắt', fn: runB1 },
    { id: 'B2', name: 'Vào thẳng URL /approvals không làm vỡ ứng dụng', fn: runB2 },
    { id: 'B3', name: 'Đóng dự án qua trang cài đặt cũ hoạt động bình thường (chuyển CLOSED)', fn: runB3 },
  ];

  // Thực thi Suite A
  if (isSuiteAMatched) {
    console.log('>>> THỰC THI SUITE A (CỜ BẬT & POLICY BẬT) <<<');
    for (const sc of scenariosA) {
      process.stdout.write(`Đang chạy ${sc.id}: ${sc.name}... `);
      try {
        const res = await sc.fn(browser);
        console.log(`[PASS] (${res.screenshot})`);
        results.push({ id: sc.id, name: sc.name, status: 'PASS', evidence: res.screenshot });
      } catch (err) {
        console.log(`[FAIL] (${err.screenshot || 'no-screenshot'}): ${err.error || err.message}`);
        results.push({
          id: sc.id,
          name: sc.name,
          status: 'FAIL',
          evidence: err.screenshot || 'Lỗi thực thi',
          error: err.error || err.message,
        });
      }
    }
  } else {
    for (const sc of scenariosA) {
      const skipReason = `Cờ tắt (enabled=${policy.enabled}, closeReq=${policy.closeRequiresApproval})`;
      results.push({ id: sc.id, name: sc.name, status: 'SKIPPED', evidence: skipReason });
    }
  }

  // Thực thi Suite B
  if (isSuiteBMatched) {
    console.log('>>> THỰC THI SUITE B (CỜ TẮT) <<<');
    for (const sc of scenariosB) {
      process.stdout.write(`Đang chạy ${sc.id}: ${sc.name}... `);
      try {
        const res = await sc.fn(browser);
        console.log(`[PASS] (${res.screenshot})`);
        results.push({ id: sc.id, name: sc.name, status: 'PASS', evidence: res.screenshot, note: res.observedBehavior });
      } catch (err) {
        console.log(`[FAIL] (${err.screenshot || 'no-screenshot'}): ${err.error || err.message}`);
        results.push({
          id: sc.id,
          name: sc.name,
          status: 'FAIL',
          evidence: err.screenshot || 'Lỗi thực thi',
          error: err.error || err.message,
        });
      }
    }
  } else {
    for (const sc of scenariosB) {
      const skipReason = `Cờ đang bật (enabled=${policy.enabled}), kịch bản Suite B yêu cầu cờ tắt`;
      results.push({ id: sc.id, name: sc.name, status: 'SKIPPED', evidence: skipReason });
    }
  }

  await browser.close();

  // In bảng tổng kết
  console.log('');
  console.log('========================================================================================');
  console.log('BẢNG TỔNG KẾT KẾT QUẢ KIỂM THỬ E2E PUPPETEER');
  console.log('========================================================================================');
  console.log(
    'Mã'.padEnd(5) + ' | ' +
    'Trạng thái'.padEnd(10) + ' | ' +
    'Kịch bản'.padEnd(65) + ' | ' +
    'Bằng chứng / Lý do'
  );
  console.log('----------------------------------------------------------------------------------------');
  for (const r of results) {
    console.log(
      r.id.padEnd(5) + ' | ' +
      r.status.padEnd(10) + ' | ' +
      r.name.slice(0, 63).padEnd(65) + ' | ' +
      (r.evidence || '')
    );
  }
  console.log('========================================================================================');

  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const skipCount = results.filter((r) => r.status === 'SKIPPED').length;

  console.log(`Tổng cộng: ${passCount} PASS, ${failedCount} FAIL, ${skipCount} SKIPPED.`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Lỗi nghiêm trọng khi thực thi:', err);
  process.exit(1);
});
