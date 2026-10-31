# Plan: Dev 1 Project Execution & Puppeteer E2E Manual Test Suite

## Summary
Kế hoạch khởi động toàn diện hệ thống (PostgreSQL 18, Spring Boot Backend trên port 8080, Vite Frontend trên port 5173) và triển khai bộ kịch bản tự động hóa kiểm thử giao diện người dùng (End-to-End Browser Testing) bằng **Puppeteer** để kiểm tra, nghiệm thu thực tế toàn bộ 5 module chức năng của **DEV 1**:
1. Xác thực & Hồ sơ người dùng (Auth, Login Email/Password, Google OAuth flow, Profile, Password).
2. Quản lý Vòng đời Dự án & Thành viên (Project CRUD, Close Project, Member list, Invite member, Safe PM removal).
3. Phân quyền tác động lớn GitHub-Style (Toggle 4 quyền nhạy cảm, Confirm Modal, Toast thông báo, Cancel rollback).
4. Động cơ Quy trình làm việc (Workflow Statuses, Category, Transitions matrix, Approval requirement).
5. Quản lý Trường tùy chỉnh (Custom Fields 5 kiểu: TEXT, NUMBER, DATE, DROPDOWN options, CHECKBOX, Metadata API).
Kịch bản Puppeteer sẽ tự động mở trình duyệt Google Chrome thật trên máy, thao tác click, nhập liệu, chụp ảnh màn hình (`screenshots/*.png`) từng bước làm bằng chứng nghiệm thu hoàn chỉnh.

## User Story
```
As a Product Owner / Team Lead / Dev 1 Engineer,
I want to execute an automated Puppeteer manual test suite against the live running application,
So that I can visually verify and prove that all Dev 1 governance, RBAC, workflow, and custom field features work flawlessly without manual repetitive clicks.
```

## Problem → Solution
- **Current State:** Các chức năng của Dev 1 đã được code và vượt qua 14/14 bài Unit Test ở tầng backend và frontend build thành công. Tuy nhiên, việc kiểm thử thủ công từng màn hình bằng tay mất thời gian và thiếu ảnh chụp bằng chứng khách quan cho từng ca kiểm thử.
- **Desired State:** Một script Puppeteer chuyên dụng (`tests/e2e/dev1-manual-test.js`) tự động khởi chạy Chrome, điều hướng qua toàn bộ các luồng của Dev 1, xác nhận kết quả UI (assertions), chụp ảnh màn hình lưu vào thư mục `tests/e2e/screenshots/` và tạo bảng báo cáo kết quả kiểm thử (Test Run Matrix) chi tiết.

## Metadata
- **Complexity:** Medium (Tự động hóa E2E, không sửa đổi logic nghiệp vụ của các Dev khác)
- **Source PRD:** `TEAM_TASK_ALLOCATION.md` (Phần 2: Dev 1) & `docs/API_DOCUMENTATION.md`
- **Estimated Files:** 4 files (Puppeteer test runner script, package helper, screenshots directory, test report artifact)

---

## UX Design

### Browser Automation Flow
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PUPPETEER E2E TEST WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘
   │
   ├─► 1. AUTH & PROFILE
   │     ├─ Open http://localhost:5173
   │     ├─ Verify Logo, Title, Inputs, "Hoặc tiếp tục với", Google button
   │     ├─ Test Login Email/Pass (pm@epms.com / Password123@) -> Capture 01_login_success.png
   │     ├─ Navigate to Profile -> Verify name, avatar upload, password form -> Capture 02_profile.png
   │
   ├─► 2. PROJECT LIFECYCLE & SETTINGS
   │     ├─ View Project List -> Verify summary cards (members count, open tasks)
   │     ├─ Open Project Settings -> Verify name, description, key, close project panel
   │     ├─ Test Edit Project Details -> Verify update toast -> Capture 03_project_settings.png
   │
   ├─► 3. GITHUB-STYLE PROJECT PERMISSIONS (RBAC)
   │     ├─ Navigate to Members & Roles tab (/members) -> Capture 04_members_list.png
   │     ├─ Verify 4 toggle switches (delete issue, delete subtask, convert subtask, custom fields)
   │     ├─ Toggle a permission -> Verify "Lưu" button activates
   │     ├─ Click "Lưu" -> Verify Confirmation Warning Popup -> Capture 05_permission_modal.png
   │     ├─ Confirm -> Verify green Toast "Lưu quyền thành công"
   │     ├─ Verify Safe PM Removal: Last PM cannot be deleted or downgraded
   │
   ├─► 4. WORKFLOW ENGINE
   │     ├─ Navigate to Workflow Settings -> Capture 06_workflow_matrix.png
   │     ├─ Verify statuses: To Do, In Progress, Pending Approval, Done
   │     ├─ Verify transitions matrix and approval requirement badge (PM/QA approval)
   │
   ├─► 5. DYNAMIC CUSTOM FIELDS
   │     ├─ Navigate to Custom Fields (/custom-fields) -> Capture 07_custom_fields_list.png
   │     ├─ Open Create Field Modal -> Verify 5 types (TEXT, NUMBER, DATE, DROPDOWN, CHECKBOX)
   │     ├─ Fill test field (e.g., "Mức độ ảnh hưởng" - DROPDOWN with options: Cao, Vừa, Thấp)
   │     ├─ Save field -> Verify appears in list with badge -> Capture 08_custom_field_created.png
   │
   └─► 6. GENERATE TEST SUMMARY & REPORT
         └─ Summarize test steps, assertions passed, and list generated screenshot artifacts.
```

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 (critical) | `frontend/src/features/auth/pages/Login.tsx` | 1-130 | Inspect login selectors, Google button, form inputs |
| P0 (critical) | `frontend/src/features/members/pages/Members.tsx` | 20-100 | Inspect permissions toggles, save button, confirm modal |
| P1 (important) | `frontend/src/features/projects/pages/ProjectSettings.tsx` | 50-105 | Inspect project settings inputs, close project panel |
| P1 (important) | `frontend/src/features/workflow/pages/WorkflowSettings.tsx` | 1-80 | Inspect workflow layout and status components |
| P1 (important) | `frontend/src/features/projects/pages/CustomFieldsSettings.tsx` | 30-100 | Inspect custom fields table, create modal, input fields |

---

## Patterns to Mirror

### PUPPETEER_CHROME_LAUNCH
```javascript
// Launch using existing local Google Chrome on Windows
const browser = await puppeteer.launch({
  headless: 'new', // or false for visual watching
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768'],
  defaultViewport: { width: 1366, height: 768 }
});
```

### AUTH_SESSION_INSPECTION
```javascript
// Wait for network response or localStorage token
await page.waitForFunction(() => !!localStorage.getItem('epms_access_token'), { timeout: 10000 });
```

---

## Files to Create

| File | Action | Justification |
|---|---|---|
| `e2e/package.json` | CREATE | Lightweight isolated package for Puppeteer runner (avoids bloating frontend dependencies) |
| `e2e/dev1-manual-test.js` | CREATE | Comprehensive automated manual test suite covering all 5 Dev 1 modules |
| `e2e/screenshots/*.png` | GENERATE | Output screenshot evidence of each tested screen and modal |
| `dev1-puppeteer-test-report.md` | CREATE (Artifact) | Full test execution report with screenshots and verification status |

## NOT Building
- Không can thiệp vào các tệp của Dev 2 (`Board.tsx`, `IssueTable.tsx`, `KanbanColumn.tsx`, `IssueController.java`).
- Không can thiệp vào các tệp của Dev 3 (`CommentController.java`, `WorklogController.java`, `NotificationController.java`, `ReportController.java`).
- Không sửa đổi cấu trúc cơ sở dữ liệu PostgreSQL đã được Flyway thiết lập.

---

## Step-by-Step Tasks

### Task 1: Verify & Start System Daemons (PostgreSQL, Backend, Frontend)
- **ACTION**: Check local database `pms` connection, launch Spring Boot backend daemon (`USE_LOCAL_DB=true`) on port 8080, and Vite dev server on port 5173.
- **VALIDATE**: `curl http://localhost:8080/api/health` returns `{"status":"UP"}` and `curl http://localhost:5173` returns HTML 200.

### Task 2: Set Up Isolated Puppeteer Runner Environment
- **ACTION**: Create directory `e2e/` with a lightweight `package.json` installing `puppeteer-core` (or `puppeteer`) targeting the installed Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- **VALIDATE**: `node -e "require('puppeteer')"` runs without errors.

### Task 3: Author Dev 1 E2E Test Suite (`e2e/dev1-manual-test.js`)
- **ACTION**: Write sequential test scenarios covering:
  1. Login Page UI & Email Login (`pm@epms.com` / `Password123@`)
  2. Profile Page (User details, password section)
  3. Projects Overview & Project Settings (Edit info, close project card)
  4. Project Members & GitHub-Style Permissions (Toggle 4 permissions, trigger confirm modal, verify save toast, check safe PM guard)
  5. Workflow Settings (Inspect statuses and transitions)
  6. Custom Fields Manager (Inspect list, create new dropdown custom field with options, verify list update)
- **VALIDATE**: Ensure each step captures high-resolution screenshots to `e2e/screenshots/`.

### Task 4: Execute Puppeteer Test Suite
- **ACTION**: Run `node e2e/dev1-manual-test.js`.
- **VALIDATE**: All 6 scenarios complete with exit code 0, 8+ screenshots generated cleanly.

### Task 5: Compile Final Test Report Artifact
- **ACTION**: Create markdown report with step-by-step audit, verification results, and screenshot attachments.

---

## Testing Strategy & Test Cases

| Scenario ID | Test Name | Expected Result | Screenshot Artifact |
|---|---|---|---|
| TC-DEV1-01 | Login Page UI & Form | Google button visible, Email login succeeds, token saved | `01_login_page.png`, `02_login_success.png` |
| TC-DEV1-02 | Profile & Security | Displays user info, change password form available | `03_profile_page.png` |
| TC-DEV1-03 | Project Settings | Project info form loaded, Close project panel present | `04_project_settings.png` |
| TC-DEV1-04 | Members & GitHub RBAC | 4 permission toggles loaded, Confirm Modal pops up on save, Toast appears | `05_members_page.png`, `06_permissions_modal.png` |
| TC-DEV1-05 | Workflow Engine | Default statuses displayed with categories & transitions | `07_workflow_page.png` |
| TC-DEV1-06 | Custom Fields Management | Custom fields table rendered, new field created with options | `08_custom_fields_page.png`, `09_custom_field_created.png` |

---

## Validation Commands
```bash
# 1. Check Backend Health
curl http://localhost:8080/api/health

# 2. Check Frontend Dev Server
curl http://localhost:5173

# 3. Run Puppeteer E2E Test Suite
node e2e/dev1-manual-test.js

# 4. Verify Generated Screenshots
dir e2e\screenshots\
```

---

## Acceptance Criteria
- [ ] Backend and Frontend running on ports 8080 and 5173.
- [ ] Puppeteer runner completes all test scenarios without unhandled exceptions.
- [ ] All 8+ screenshots captured and verified.
- [ ] Dev 1 tasks verified functional in browser environment.
- [ ] No files outside Dev 1 touched.
- [ ] Code stays on local branch `dev1` with zero push to GitHub.
