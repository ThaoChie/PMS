# BÁO CÁO HOÀN THIỆN PHÂN HỆ DEV 3 — Cộng tác, Tìm kiếm, Báo cáo & Dashboard

> Người thực hiện: Đỗ Thị Kiều Linh (Dev 3) · Ngày: 04/11/2026
> Phạm vi: UC007 (Bình luận/@mention), UC008 (Log Work), UC011 (Tìm kiếm nâng cao),
> UC012 (Bộ lọc đã lưu), UC013 (Dashboard), UC019 (Thông báo).

---

## 1. Tình trạng trước khi sửa

Backend của phân hệ Dev 3 đã có đầy đủ (controller, service, repository, migration, job định kỳ, unit test).
Vấn đề nằm ở **frontend**: các service gọi API (`commentService`, `worklogService`, `filterService`,
`searchService`, `dashboardService`) và các component (`CommentEditor`, `CommentList`, `LogWorkModal`,
`WorklogList`, `SaveFilterModal`, `ShareFilterModal`, `SubscribeModal`, `WatchingWidget`,
`SavedFiltersWidget`, `AdvancedSearchPanel`) đã được viết nhưng **chưa được gắn vào trang nào**,
nên 5 chức năng chính bấm vào không chạy.

## 2. Những gì đã hoàn thiện

### 2.1. Bình luận & @mention (UC007)
- Thêm `features/comments/components/CommentSection.tsx`: container nối API thật
  (`GET/POST/PUT/DELETE /issues/{key}/comments`), có loading / empty / error + nút thử lại.
- Viết lại `CommentList.tsx`: hỗ trợ sửa/xóa tại chỗ, nhãn "(đã sửa)", tô đậm phần `@Tên` được nhắc.
- Quyền sửa/xóa: chỉ tác giả bình luận hoặc PM/Admin dự án (khớp BR-COL-01).
- `@mention` lấy danh sách thành viên thật từ `GET /projects/{id}/members`; lọc bỏ người ngoài dự án
  trước khi gửi lên (BR-COL-02).
- Đã gắn vào **cả hai** màn chi tiết: `IssueDetailDrawer.tsx` và `IssueDetailPage.tsx`.

### 2.2. Ghi nhận thời gian làm việc (UC008)
- Thêm `features/worklog/components/WorklogSection.tsx`: nút "Ghi nhận thời gian", danh sách worklog,
  **thanh tiến độ thời gian** so sánh Ước lượng / Đã dành / Còn lại (đỏ khi vượt ước lượng).
- Chỉ **Assignee** của công việc thấy nút ghi nhận — đúng UC008 (không ai log hộ, kể cả PM/Admin);
  người khác thấy dòng giải thích.
- `LogWorkModal` bổ sung kiểm tra: thời gian phải hợp lệ (`WORKLOG_002`), ngày làm việc không được
  lớn hơn hôm nay (`WORKLOG_001`, chặn cả bằng thuộc tính `max` của input ngày) + hiện lỗi ngay trong modal.
- Sau khi ghi nhận, màn chi tiết tự tải lại vì backend trừ `remainingEstimate`.

### 2.3. Bộ lọc đã lưu (UC012)
- Viết lại `features/filters/pages/SavedFilters.tsx`: nối `filterService` (tải, xóa, chia sẻ, đăng ký
  / hủy đăng ký email định kỳ), hiển thị tiêu chí lọc dạng chip, chủ sở hữu / "được chia sẻ với tôi".
- Gắn `ShareFilterModal` (chọn thành viên dự án) và `SubscribeModal` (DAILY/WEEKLY — BR-SRCH-03).
- Chỉ chủ sở hữu được sửa/xóa/chia sẻ; các nút khác bị khóa kèm chú thích.
- Thêm nút **"Lưu bộ lọc này"** trong panel lọc ở trang Danh sách công việc (`SaveFilterModal`).

### 2.4. Tìm kiếm nâng cao (UC011)
- Viết lại `AdvancedSearchPanel.tsx` theo đúng hợp đồng API: `EPIC/TASK/BUG/SUB_TASK`,
  `HIGHEST/HIGH/MEDIUM/LOW/LOWEST` (trước đây hard-code sai: `Story`, `Critical`).
- **Trạng thái lấy từ Workflow của dự án** (`GET /projects/{id}/workflow`) thay vì danh sách cứng.
- Lọc được nhiều giá trị cùng lúc (loại, trạng thái, ưu tiên) + người thực hiện + khoảng ngày tạo.
- `IssueList.tsx` chuyển sang gọi **`POST /issues/search`** ở backend (có index `pg_trgm`) thay vì
  tải 100 issue rồi lọc bằng JavaScript; ô từ khóa có debounce 400ms.
- Tiêu chí lọc được **đồng bộ vào URL** → copy link là chia sẻ được đúng bộ lọc.
- Chip **bộ lọc nhanh** dùng giá trị backend hiểu được: `MY_OPEN`, `REPORTED_BY_ME`, `OPEN`, `DONE`,
  `CRITICAL`, `RECENTLY_UPDATED`.
- Xuất Excel/CSV nay truyền **đúng tiêu chí đang lọc** (trước đây xuất toàn bộ dự án).
- Ô tìm kiếm nhanh trên thanh Header (`QuickSearchModal`) cũng chuyển sang API tìm kiếm thật.

### 2.5. Dashboard cá nhân (UC013)
- `Dashboard.tsx` gọi **`GET /dashboard`** (trước đây chỉ gọi danh sách issue của dự án).
- Gắn thêm 2 widget còn thiếu: **Việc tôi đang theo dõi** (A-07) và **Bộ lọc đã lưu**.
- "Hoạt động gần đây" lấy từ audit log do backend trả về (A-08) thay vì danh sách thông báo.
- Sửa điều hướng của widget Bộ lọc (`filters` → `saved-filters`, trước đó bấm vào không đi đâu).

### 2.6. Thông báo (UC019) — phần backend
- `NotificationController` không còn gọi thẳng `NotificationRepository`; chuyển qua
  `INotificationService` theo quy tắc `controller → service → repository` (project_structure.md 3.2).
- Bổ sung vào service: `getNotifications`, `countUnread`, `markAsRead` (có kiểm tra chống IDOR),
  `markAllAsRead`; thêm endpoint `PUT /notifications/read-all` cho khớp tài liệu API.
- Thêm `NotificationServiceTest` (7 ca kiểm thử): không tự gửi thông báo cho chính mình, lưu + gửi
  email cho người khác, lỗi email không làm hỏng giao dịch chính, chống IDOR khi đánh dấu đã đọc,
  lọc theo nhóm/chưa đọc.

### 2.7. Chuẩn hóa & dọn dẹp
- Mọi chuỗi tiếng Việt mới đều nằm trong `constants/messages.ts` (thêm nhóm `COMMENT`, `WORKLOG`,
  `FILTER`, `SEARCH`, `DASHBOARD`) — đúng Definition of Done mục 5.
- Thêm `ISSUE_TYPE_OPTIONS`, `PRIORITY_OPTIONS`, `QUICK_FILTER_OPTIONS` vào `constants/enums.ts`
  để dùng chung, không hard-code enum ở component.
- Dịch các chuỗi tiếng Anh còn sót trong `WatchingWidget`, `CommentEditor`.
- Đánh dấu `@deprecated` cho 3 file không còn được dùng: `components/charts/BurndownChart.tsx`,
  `components/charts/BarChartCard.tsx`, `features/issues/components/ActivityTimeline.tsx`
  (giữ file để không phá import của thành viên khác — cả nhóm thống nhất rồi xóa sau).

## 3. Lỗi biên dịch có sẵn đã sửa kèm

`npx tsc --noEmit` ban đầu báo **11 lỗi** (ở cả phần của Dev 1 và Dev 2) → nay **0 lỗi**:

| File | Lỗi | Cách sửa |
|---|---|---|
| `Board.tsx`, `IssueDetailDrawer.tsx`, `IssueDetailPage.tsx`, `QuickSearchModal.tsx` | map user thiếu `initials`, `status`, `reporter` | dùng chung `mapUserResponseToUser` |
| `IssueDetailDrawer.tsx` | so sánh trạng thái với chuỗi ngoài kiểu `IssueStatus`; thiếu `updatedAt` | so sánh theo chuỗi đã chuẩn hóa; bổ sung `updatedAt` |
| `IssueDetailPage.tsx` | gọi `workflowService.transition()` — **hàm không tồn tại** | gọi `executeTransition(issueKey, transitionId)` theo đúng Workflow |
| `features/reports/index.ts` | export `progressData`, `productivityData`, `bugData` không tồn tại | sửa lại barrel export |

## 4. Lưu ý về `docker-compose.yml` (môi trường DEV)

README hướng dẫn chạy `docker compose up --build -d`, nhưng trong repo **không có** `docker-compose.yml`
— file này đang bị `.gitignore` (dòng 38) nên không được commit, repo chỉ còn `docker-compose.prod.yml`.
Vì vậy mỗi người phải **tự tạo file này ở thư mục gốc** mới chạy được local.

Nội dung đã dùng và kiểm tra `docker compose config` hợp lệ (gồm `db`, `backend`, `frontend`,
`proxy` gộp về `http://localhost:3000`, `mailhog` xem email ở `http://localhost:8025`,
`minio` cho tệp đính kèm) — xem file `docker-compose.yml` mình gửi kèm trong nhóm chat,
hoặc hỏi mình để copy lại.

Ngoài ra: nếu `npm ci` khi build Docker frontend báo lỗi thiếu `package-lock.json` thì chạy
`npm install` trong thư mục `frontend` một lần để sinh lại.

## 5. Kết quả kiểm thử

| Hạng mục | Kết quả |
|---|---|
| `npx tsc --noEmit` (frontend) | ✅ 0 lỗi |
| `npm run build` (frontend) | ✅ build thành công (chỉ còn cảnh báo kích thước chunk > 500kB — có sẵn từ trước) |
| `docker compose config` | ✅ hợp lệ |
| Biên dịch backend (`mvn clean compile`) | ⏳ **chưa chạy được trên máy này** (chưa cài Maven, Docker Desktop đang tắt) — cần chạy lại khi mở Docker |

## 6. Việc cần làm tiếp

1. Chạy `docker compose up --build -d`, sau đó kiểm tra tay 5 luồng: bình luận → @mention → nhận thông báo →
   log work → lọc nâng cao → lưu & chia sẻ bộ lọc → xuất Excel.
2. Chạy test backend: `docker compose exec backend sh` hoặc `mvn test` (có `NotificationServiceTest` mới).
3. Frontend chưa cài `vitest` nên `src/tests/utils.test.ts` chưa chạy được — nếu nhóm muốn đạt DoD về
   test FE thì cần thêm `vitest` + script `test` vào `package.json`.
4. Sắp xếp sort theo cột trên trang Danh sách công việc hiện chỉ áp dụng khi **không** có điều kiện lọc
   nâng cao (API `POST /issues/search` của backend chưa nhận tham số `sort`) — nếu cần, bổ sung sort
   cho endpoint search ở backend.
