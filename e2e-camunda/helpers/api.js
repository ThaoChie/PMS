// e2e-camunda/helpers/api.js
// Các hàm tiện ích gọi REST API backend để chuẩn bị dữ liệu nhanh

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

// Ràng buộc cứng: Từ chối chạy nếu URL backend không phải localhost
function validateLocalhost() {
  const url = new URL(BACKEND_URL);
  const hostname = url.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0' && hostname !== '::1') {
    throw new Error(`TỪ CHỐI CHẠY: URL backend '${BACKEND_URL}' không phải localhost. Chỉ được phép chạy E2E trên môi trường dev local.`);
  }
}

validateLocalhost();

export const DEV_USERS = {
  ADMIN: {
    email: 'admin@epms.com',
    password: 'Password123@',
    role: 'admin',
    name: 'Admin System',
  },
  PM1: {
    email: 'pm@epms.com',
    password: 'Password123@',
    role: 'pm',
    name: 'Alex Chen (PM)',
  },
  PM2: {
    email: 'dev@epms.com',
    password: 'Password123@',
    role: 'pm', // Khi được mời làm PM
    name: 'Marcus Jones (Dev)',
  },
  MEMBER: {
    email: 'member@epms.com',
    password: 'Password123@',
    role: 'member',
    name: 'Tom Wright (Member)',
  },
};

export async function loginApi(email, password) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Đăng nhập API thất bại cho ${email}: ${data.message || res.statusText}`);
  }
  return {
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
    user: data.data.user,
  };
}

export async function getPolicyApi(token) {
  const res = await fetch(`${BACKEND_URL}/api/approval-requests/policy`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    return { enabled: false, closeRequiresApproval: false, workflowChangeRequiresApproval: false };
  }
  const data = await res.json();
  return data.data || { enabled: false, closeRequiresApproval: false, workflowChangeRequiresApproval: false };
}

export async function createProjectApi(token, { key, name, description }) {
  const res = await fetch(`${BACKEND_URL}/api/projects`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectKey: key,
      name,
      description: description || `Project description for ${key}`,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`Tạo dự án ${key} thất bại: ${data.message || res.statusText}`);
  }
  return data.data;
}

export async function inviteAndAcceptMemberApi(pm1Token, userToken, projectId, userEmail, role = 'PM') {
  // PM1 mời
  const invRes = await fetch(`${BACKEND_URL}/api/projects/${projectId}/invitations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pm1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: userEmail, role }),
  });
  const invData = await invRes.json();
  if (!invRes.ok || !invData.success) {
    throw new Error(`Mời ${userEmail} vào dự án ${projectId} thất bại: ${invData.message || invRes.statusText}`);
  }

  // User lấy danh sách lời mời
  const myInvRes = await fetch(`${BACKEND_URL}/api/invitations/mine`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const myInvData = await myInvRes.json();
  const invitation = myInvData.data?.find((i) => i.project?.id === projectId || i.projectId === projectId) || myInvData.data?.[0];
  if (!invitation) {
    throw new Error(`Không tìm thấy lời mời cho ${userEmail} tại dự án ${projectId}`);
  }

  // User chấp nhận lời mời
  const acceptRes = await fetch(`${BACKEND_URL}/api/invitations/${invitation.id}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const acceptData = await acceptRes.json();
  if (!acceptRes.ok || !acceptData.success) {
    throw new Error(`Chấp nhận lời mời #${invitation.id} thất bại: ${acceptData.message || acceptRes.statusText}`);
  }
  return true;
}

export async function setupProjectWithTwoPMs(key, name) {
  const pm1Auth = await loginApi(DEV_USERS.PM1.email, DEV_USERS.PM1.password);
  const pm2Auth = await loginApi(DEV_USERS.PM2.email, DEV_USERS.PM2.password);

  const project = await createProjectApi(pm1Auth.accessToken, {
    key,
    name,
    description: `Dự án E2E Test ${key}`,
  });

  await inviteAndAcceptMemberApi(pm1Auth.accessToken, pm2Auth.accessToken, project.id, DEV_USERS.PM2.email, 'PM');

  return {
    project,
    pm1Auth,
    pm2Auth,
  };
}

export async function createApprovalRequestApi(token, { projectId, type, reason, payload }) {
  const res = await fetch(`${BACKEND_URL}/api/approval-requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, type, reason, payload }),
  });
  const data = await res.json();
  return { status: res.status, body: data };
}

export async function getApprovalRequestApi(token, requestId) {
  const res = await fetch(`${BACKEND_URL}/api/approval-requests/${requestId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.data;
}

export async function getProjectApi(token, projectId) {
  const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.data;
}

export async function getProjectWorkflowApi(token, projectId) {
  const res = await fetch(`${BACKEND_URL}/api/projects/${projectId}/workflow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.data;
}

export async function getNotificationsApi(token) {
  const res = await fetch(`${BACKEND_URL}/api/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data?.data?.content && Array.isArray(data.data.content)) {
    return data.data.content;
  }
  return Array.isArray(data?.data) ? data.data : [];
}

export { BACKEND_URL, FRONTEND_URL };
