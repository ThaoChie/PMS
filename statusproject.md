# Trạng thái Dự án EPMS

Cập nhật lần cuối: **06/11/2026**
Commit mới nhất: `02f9d58` — fix(worklog): cho phép PM/Admin ghi nhận thời gian làm việc

---

## Tổng quan công nghệ

| Lớp | Công nghệ | Phiên bản |
|---|---|---|
| Frontend | React + TypeScript + Vite | 19 / 5.7 / 8 |
| State | Zustand | 5 |
| HTTP | Axios | 1.20 |
| Test FE | Vitest | 5.1 |
| Backend | Spring Boot / Java | 3.2.0 / 17 |
| DB | PostgreSQL 16 + Flyway | — |
| File | MinIO (S3-compatible) | — |
| Auth | JWT (stateless) + Google OAuth | — |

Quy mô hiện tại: **69 file `.tsx`** (frontend) · **235 file `.java`** (backend)

---

## Các phân hệ frontend (features/)

| Module | Trang / component chính | Trạng thái |
|---|---|---|
| `auth` | Login, Register, ForgotPassword, ResetPassword | ✅ Hoàn thành |
| `projects` | ProjectList, ProjectSettings, CustomFieldsSettings | ✅ Hoàn thành |
| `issues` | IssueList, IssueDetailPage, IssueDetailDrawer, CreateIssueModal, IssueTable, SubtaskSection, LinkedIssuesSection, AttachmentList, ShareIssueModal, ExportButton | ✅ Hoàn thành |
| `board` | Kanban Board (IssueCard, KanbanColumn) | ✅ Hoàn thành |
| `comments` | CommentSection (gắn vào IssueDetailPage + Drawer) | ✅ Hoàn thành |
| `worklog` | WorklogSection (thanh tiến độ, LogWorkModal) | ✅ Hoàn thành |
| `filters` | SavedFilters, SaveFilterModal, ShareFilterModal, SubscribeModal | ✅ Hoàn thành |
| `search` | AdvancedSearchPanel, QuickFilterChips, QuickSearchModal | ✅ Hoàn thành |
| `dashboard` | Dashboard + 4 widget (AssignedIssues, RecentActivity, Watching, SavedFilters) | ✅ Hoàn thành |
| `reports` | Reports (BugReportTab, ProductivityTab, ProgressTab) | ✅ Hoàn thành |
| `notifications` | NotificationBell, NotificationDropdown, NotificationCenter | ✅ Hoàn thành |
| `members` | MembersPage (bảng + invite + đổi vai trò) | ✅ Hoàn thành |
| `workflow` | WorkflowSettings | ✅ Hoàn thành |
| `profile` | ProfilePage (ảnh đại diện, đổi mật khẩu) | ✅ Hoàn thành |

---

## Sprint 1 — Hạ tầng · Auth & RBAC · Vòng đời dự án ✅

- [x] Docker Compose dev (PostgreSQL 16, MailHog, MinIO)
- [x] Khởi tạo Spring Boot 3 / Java 17 — package chuẩn, `BaseHibernateDao`, `AppProperties`
- [x] `ApiResponse`, `PageWrapper`, `ErrorCode`, `GlobalExceptionHandler`, `BaseEntity` + JPA Auditing
- [x] `AuditLogAspect` (Spring AOP) — tự động ghi mọi hành động tạo/sửa/xóa/đổi trạng thái
- [x] Frontend khởi tạo: React 19, Vite, TypeScript, AntD v5, Zustand, Axios, Vitest, theme tokens
- [x] Flyway V1–V5: `users`, `projects`, `project_members`, `project_invitations`, `workflow_statuses/transitions`, `audit_logs`, `notifications`
- [x] `AuditService`, `NotificationService` (backend), `MailService` (Async + Thymeleaf)
- [x] Auth: đăng nhập Email/Password, Google OAuth2, Register, ForgotPassword, ResetPassword
- [x] JWT stateless — access 30 phút, refresh token xoay vòng, `httpOnly` cookie
- [x] `ProjectSecurity` + `IssueSecurity` bean — `@PreAuthorize` tại controller
- [x] `GET/PUT /users/me`, avatar upload (magic bytes, UUID), đổi mật khẩu (chặn tài khoản Google)
- [x] `axiosClient`: auto-refresh 401 (hàng đợi), `authStore` khôi phục phiên
- [x] `AppShell` (Sidebar, Topbar, chuông thông báo), `ProtectedRoute`, `usePermission`
- [x] CRUD Project: tạo (auto PM + DefaultWorkflowSeeder), cập nhật, đóng (`CLOSED` guard)
- [x] Mời thành viên: invite/accept/decline, hết hạn, `InvitationExpiryJob`
- [x] Quản lý thành viên: đổi vai trò, xóa, chặn xóa PM duy nhất (`LAST_PM_REMOVAL`)
- [x] Seed dev: 1 Admin, 1 PM, 3 Member, 1 dự án mẫu (không chạy ở `prod`)

---

## Sprint 2 — Issue lõi · Workflow · Thông báo ✅

- [x] CRUD Issue: tạo, sửa, xóa, chuyển trạng thái (Workflow), Epic Link (chống vòng lặp), Reject reason bắt buộc
- [x] Sub-task: tạo nhanh inline, chuyển đổi issue sang sub-task
- [x] Phê duyệt issue theo workflow (`APPROVE`/`REJECT`)
- [x] Assign Issue — cập nhật `remainingEstimate` realtime
- [x] Export Excel/CSV (truyền đúng tiêu chí đang lọc)
- [x] Chia sẻ Issue (ShareIssueModal)
- [x] Custom Fields: tạo/sửa/xóa field theo dự án, gán giá trị cho Issue
- [x] File đính kèm (Attachment) — MinIO, whitelist MIME + magic bytes
- [x] Linked Issues (liên kết 2 chiều giữa các issue)
- [x] API thông báo (`GET/PUT /notifications`, `PUT /notifications/read-all`)
- [x] UI thông báo: chuông + dropdown + trang NotificationCenter
- [x] Workflow Settings: PM/Admin tùy chỉnh status và transition

---

## Sprint 3 — Cộng tác · Tìm kiếm · Dashboard ✅

*(Hoàn thiện bởi merge DEV3 — 04/11/2026)*

- [x] **Bình luận & @mention (UC007)**: `CommentSection` gắn vào cả IssueDetailDrawer và IssueDetailPage; `@mention` lấy thành viên thật; chỉ tác giả / PM / Admin sửa-xóa
- [x] **Log Work (UC008)**: `WorklogSection` + thanh tiến độ Ước lượng/Đã dùng/Còn lại (đỏ khi vượt); chỉ Assignee log; validate thời gian + ngày không được tương lai (BR-WORKLOG)
  - Fix thêm (commit `02f9d58`): cho phép PM/Admin cũng ghi nhận thời gian
- [x] **Bộ lọc đã lưu (UC012)**: `SavedFilters` nối API thật; chia sẻ bộ lọc; đăng ký email DAILY/WEEKLY; chỉ chủ sở hữu sửa/xóa/chia sẻ
- [x] **Tìm kiếm nâng cao (UC011)**: `AdvancedSearchPanel` gọi `POST /issues/search` (backend có `pg_trgm`); lọc nhiều giá trị, debounce 400ms; tiêu chí đồng bộ vào URL; `QuickSearchModal` trên Header dùng API thật
- [x] **Dashboard cá nhân (UC013)**: gọi `GET /dashboard`; 4 widget (công việc được giao, hoạt động gần đây, đang theo dõi, bộ lọc đã lưu)
- [x] **Watchers**: xem/thêm/xóa người theo dõi issue
- [x] Sửa 11 lỗi TypeScript compile (`npx tsc --noEmit` → 0 lỗi)
- [x] Chuẩn hóa constants: `messages.ts` (COMMENT/WORKLOG/FILTER/SEARCH/DASHBOARD), `enums.ts` (ISSUE_TYPE_OPTIONS, PRIORITY_OPTIONS, QUICK_FILTER_OPTIONS)

---

## Sprint 4 — Báo cáo · Kiểm thử · Triển khai ⏳ Đang tiến hành

- [x] **Báo cáo (UC019)**: BugReportTab, ProductivityTab, ProgressTab — gọi `GET /reports/*`
- [x] **Backend unit tests** (17 file): `IssueServiceTest`, `ProjectServiceTest`, `WorkflowServiceTest`, `WorklogServiceTest`, `CommentServiceTest`, `NotificationServiceTest`, `ReportServiceTest`, `SavedFilterServiceTest`, `CustomFieldServiceTest`, `ExportServiceTest`, `MembershipServiceTest`, `FilterDigestJobTest`, `RbacMatrixTest`, `IssueSecurityTest`, `ProjectSecurityEdgeCaseTest`, `LoginRateLimiterTest`, `DurationParserTest`
- [x] **Frontend unit test**: `src/tests/utils.test.ts` (1 file)
- [ ] **Job dọn dẹp định kỳ**: `InvitationExpiryJob` ✅ có; `NotificationCleanupJob` (xóa notification > 30 ngày) ❌ chưa làm
- [ ] **E2E test** (thư mục `e2e/` có nhưng bị `.gitignore`, nội dung chưa rõ)
- [ ] **Sort theo cột** trong trang Danh sách khi dùng bộ lọc nâng cao — backend `POST /issues/search` chưa nhận tham số `sort`
- [ ] **`docker-compose.yml`** bị `.gitignore` — mỗi thành viên phải tự tạo local (xem DEV3_CHANGELOG.md §4)
- [ ] **Triển khai production**: `render.yaml` + `vercel.json` đã có, `docker-compose.prod.yml` đã có — chưa xác nhận deploy thành công

---

## Các vấn đề còn tồn đọng

| # | Hạng mục | Mức độ | Ghi chú |
|---|---|---|---|
| 1 | `NotificationCleanupJob` (xóa notification > 30 ngày) | Trung bình | Thiếu trong Sprint 4 |
| 2 | Sort theo cột khi search nâng cao | Thấp | Backend `POST /issues/search` cần thêm `sort` param |
| 3 | `docker-compose.yml` không có trong repo | Thấp | Do `.gitignore`; cần hướng dẫn trong README |
| 4 | Build backend chưa xác nhận trên máy clean | Trung bình | `mvn test` chưa chạy được do chưa cài Maven/Docker |
| 5 | Frontend chỉ có 1 test file | Thấp | Cần mở rộng Vitest coverage |
| 6 | 3 file deprecated chưa xóa | Thấp | `BurndownChart.tsx`, `BarChartCard.tsx`, `ActivityTimeline.tsx` — cả nhóm đồng ý xóa sau |
| 7 | Chunk size cảnh báo > 500kB khi build FE | Thấp | Có sẵn từ trước, chưa xử lý code-splitting |

---

## Checklist triển khai cuối

- [ ] `mvn clean test` backend — xanh toàn bộ 17 test
- [ ] `npx vitest run` frontend — xanh
- [ ] `npm run build` frontend — 0 lỗi TypeScript
- [ ] `docker compose -f docker-compose.prod.yml up --build -d` — tất cả service khởi động
- [ ] Kiểm tra tay: đăng nhập → tạo dự án → tạo issue → bình luận → @mention → log work → lọc nâng cao → lưu bộ lọc → xuất Excel → xem dashboard → xem báo cáo
- [ ] Xóa 3 file deprecated sau khi cả nhóm xác nhận
- [ ] Thêm `NotificationCleanupJob`
- [ ] Bổ sung `sort` cho `POST /issues/search`
