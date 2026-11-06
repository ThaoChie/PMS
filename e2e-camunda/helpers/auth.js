// e2e-camunda/helpers/auth.js
// Các hàm hỗ trợ đăng nhập qua giao diện UI hoặc nạp phiên nhanh qua localStorage

import { FRONTEND_URL } from './api.js';
import { waitForCondition } from './browser.js';

export async function loginViaUI(page, email, password) {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle0' });

  // Chờ các trường email và password xuất hiện
  await page.waitForSelector('input[type="email"]', { visible: true, timeout: 10000 });
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);

  // Bấm nút đăng nhập
  await page.click('button[type="submit"]');

  // Chờ đăng nhập hoàn tất: sidebar xuất hiện
  await waitForCondition(
    async () => {
      const aside = await page.$('aside');
      return aside !== null;
    },
    15000,
    200,
    'Đăng nhập qua UI không hoàn thành kịp thời gian'
  );
}

export async function injectAuthSession(page, user, token) {
  await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'domcontentloaded' });

  const mappedUser = {
    id: String(user.id),
    name: user.fullName || user.name || user.email,
    email: user.email,
    initials: (user.fullName || user.name || 'U').slice(0, 2).toUpperCase(),
    role: (user.role || 'pm').toLowerCase(),
    status: 'Active',
    avatarUrl: user.avatarUrl || null,
  };

  await page.evaluate(({ token, mappedUser }) => {
    localStorage.setItem('epms_access_token', token);
    localStorage.setItem('epms_user', JSON.stringify(mappedUser));
  }, { token, mappedUser });

  // Tải lại trang để ứng dụng nạp phiên từ localStorage
  await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0' });

  // Đảm bảo giao diện đã nhận phiên đăng nhập
  await page.waitForSelector('aside', { visible: true, timeout: 10000 });
}
