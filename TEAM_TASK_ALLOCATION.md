# KẾ HOẠCH PHÂN CHIA NHIỆM VỤ PHÁT TRIỂN HỆ THỐNG PMS (EPMS)
> **Dành cho Đội ngũ 3 Lập trình viên Fullstack**  
> *Mục tiêu:* Phân bổ công việc độc lập theo phân hệ nghiệp vụ (Vertical Slice / Domain-Driven), tối đa hóa tính tự chủ, giảm thiểu tối đa rủi ro xung đột mã nguồn (merge conflict) và chồng chéo dữ liệu.

---

## 1. TỔNG QUAN CHIẾN LƯỢC & NGUYÊN TẮC PHỐI HỢP

### 1.1. Triết lý phân chia: Vertical Slice Architecture
Mỗi lập trình viên chịu trách nhiệm trọn vẹn từ tầng **Cơ sở dữ liệu (Database / Flyway) → Nghiệp vụ Backend (Entity, Service, Controller) → Giao diện Frontend (Store, Services, Components, Pages)** cho phân hệ được giao.
- **Không chia theo tầng ngang (Layered):** Tránh việc 1 người chuyên làm Backend và 1 người chuyên làm Frontend dẫn đến nút cổ chai (bottleneck) khi chờ đợi API hoặc không hiểu hết ngữ cảnh nghiệp vụ.
- **Tách biệt ranh giới module (Clear Domain Boundaries):** Mã nguồn của mỗi thành viên tập trung vào các thư mục và bảng CSDL riêng biệt.

---

### 1.2. Bộ quy tắc chống xung đột (Conflict Prevention Protocol)

#### A. Quy ước Đánh số Migration CSDL (Flyway)
Để tránh xung đột số thứ tự migration trong bảng `flyway_schema_history` khi nhiều nhánh cùng merge vào `main`, đội ngũ áp dụng quy ước dải số:
- **Dev 1 (Governance & Platform):** Sử dụng dải version `V20__...` đến `V29__...`
- **Dev 2 (Execution & Work Tracking):** Sử dụng dải version `V30__...` đến `V39__...`
- **Dev 3 (Collaboration & Analytics):** Sử dụng dải version `V40__...` đến `V49__...`
*(Hoặc dùng Timestamp chuẩn: `V202610301015__ten_migration.sql`)*

#### B. Quy tắc Nhánh Git (Git Branching Model)
- Nhánh chính: `main` (luôn luôn build xanh và chạy ổn định).
- Nhánh tính năng cá nhân:
  - Dev 1: `feature/dev1-governance-<ten-task>`
  - Dev 2: `feature/dev2-execution-<ten-task>`
  - Dev 3: `feature/dev3-analytics-<ten-task>`
- Trước khi tạo Pull Request: `git checkout main && git pull origin main`, sau đó `git rebase main` trên nhánh tính năng của mình để giải quyết xung đột cục bộ.

#### C. Thỏa thuận Dữ liệu dùng chung (Shared Contracts & Types)
- Các file mô hình TypeScript chung đặt tại: `frontend/src/types/index.ts`.
- Khi cần bổ sung thuộc tính mới vào đối tượng chung (`Issue`, `Project`, `User`), phải thêm dạng **Optional** (`attribute?: type`) để không gây lỗi biên dịch cho mã nguồn của thành viên khác.

---

## 2. CHI TIẾT CONTEXT & DANH SÁCH CHỨC NĂNG CHO TỪNG DEV

---

###  DEV 1: MODULE QUẢN TRỊ DỰ ÁN, PHÂN QUYỀN & CẤU HÌNH HỆ THỐNG
*(Governance, RBAC, Project Lifecycle, Workflow & Custom Fields)*

#### 2.1. Ngữ cảnh & Mục tiêu nghiệp vụ (Context)
Dev 1 xây dựng "bộ khung xương" cho toàn bộ hệ thống: bảo mật, tài khoản, cấu trúc dự án, cơ chế phân quyền linh hoạt theo dự án, quy trình làm việc (Workflow) và khả năng tùy biến dữ liệu thông qua các Trường thông tin tùy chỉnh (Custom Fields). Đây là nền tảng để Dev 2 và Dev 3 gắn các nghiệp vụ chi tiết lên trên.

#### 2.2. Chi tiết các chức năng cần phát triển

##### 1. Xác thực & Hồ sơ người dùng (Authentication & User Profile)
- **Đăng ký / Đăng nhập:**
  - Hỗ trợ đăng nhập qua Email/Mật khẩu và Google OAuth 2.0.
  - Quản lý phiên làm việc bằng JWT Token (Access Token lưu bộ nhớ/cookie, Refresh Token bảo mật).
  - Quản lý trạng thái xác thực bằng Zustand (`authStore.ts`).
- **Hồ sơ cá nhân:**
  - Cập nhật thông tin: Họ tên, số điện thoại, avatar (tải ảnh hoặc chọn ảnh mẫu).
  - Chức năng đổi mật khẩu, kiểm tra mật khẩu hiện tại và độ mạnh mật khẩu mới.

##### 2. Quản lý Vòng đời Dự án & Thành viên (Project & Member Management)
- **Quản lý Dự án (Project Lifecycle):**
  - Mọi người dùng đã xác thực đều có quyền tạo dự án mới. Khi tạo thành công, người tạo mặc định trở thành Quản lý dự án (`PM / Project Admin`).
  - Danh sách dự án cá nhân tham gia kèm thông tin tổng quan (tên, mã key, số thành viên, số lượng công việc).
  - Cài đặt dự án: Cập nhật thông tin dự án, đổi mã Prefix (Key), thay đổi icon/màu sắc, cơ chế Đóng / Lưu trữ dự án (Archive/Close).
- **Quản lý Thành viên & Lời mời (Project Members & Invitations):**
  - Mời thành viên mới vào dự án qua email với các vai trò: `PM`, `DEVELOPER`, `QA`, `MEMBER`.
  - Cơ chế tạo mã token lời mời có thời hạn, gửi email thông báo kèm đường dẫn chấp nhận/từ chối lời mời (`/invitations`).
  - Thay đổi vai trò của thành viên trong dự án.
  - Xóa thành viên khỏi dự án kèm điều kiện an toàn: *Không cho phép xóa hoặc hạ vai trò của PM duy nhất còn lại trong dự án*.

##### 3. Quản lý Quyền hạn tác động lớn (Project Permissions - GitHub Style)
- **Cấu hình phân quyền dự án:**
  - Đặt trực tiếp trong trang **Thành viên & Vai trò** (`/projects/:id/members`).
  - Quản trị viên/PM có thể bật/tắt các quyền nhạy cảm cho thành viên thông thường:
    1. *Cho phép thành viên xóa công việc (Allow members to delete issues).*
    2. *Cho phép thành viên xóa công việc con (Allow members to delete subtasks).*
    3. *Cho phép chuyển đổi công việc thành subtask (Allow convert to subtask).*
    4. *Cho phép tạo & quản lý trường tùy chỉnh (Allow manage custom fields).*
  - **Quy trình tương tác:** Có nút **"Lưu"** kích hoạt khi có thay đổi, hiển thị Popup xác nhận cảnh báo thay đổi, bấm *Xác nhận* lưu vào DB và bắn Toast thông báo; bấm *Hủy* phục hồi nguyên vẹn trạng thái cũ.
  - **Bảo mật Backend:** Đảm bảo kiểm tra quyền tại tầng Security (`@projectSecurity`, `@issueSecurity`).

##### 4. Động cơ Quy trình làm việc (Workflow Engine)
- **Cấu hình Trạng thái & Chuyển tiếp (Statuses & Transitions):**
  - Mỗi dự án có bộ workflow riêng (mặc định: `To Do` → `In Progress` → `Pending Approval` → `Done`).
  - Cho phép PM tạo thêm trạng thái mới, phân loại thể loại (`TODO`, `IN_PROGRESS`, `DONE`).
  - Cấu hình ma trận các bước chuyển tiếp hợp lệ (ví dụ: chỉ cho phép từ `In Progress` chuyển sang `Pending Approval`).
  - Bước duyệt bắt buộc (`is_approval_required`): Cấu hình bước chuyển trạng thái yêu cầu có sự phê duyệt của PM/QA trước khi đóng task.

##### 5. Quản lý Trường thông tin tùy chỉnh (Dynamic Custom Fields)
- **Cấu hình trường tùy chỉnh cấp dự án:**
  - Tách thành trang/màn hình quản lý riêng: `/projects/:id/custom-fields`.
  - Hỗ trợ các kiểu dữ liệu: `TEXT`, `NUMBER`, `DATE`, `DROPDOWN / SELECT`, `CHECKBOX`.
  - Cấu hình quy tắc kiểm tra dữ liệu (Validation Rules): Bắt buộc (`required`), giá trị mặc định, danh sách tùy chọn (options cho dropdown), giá trị min/max.
  - Cung cấp API metadata để Dev 2 render động các trường này trên form tạo và chi tiết công việc.

#### 2.3. Ranh giới Kỹ thuật (Files & APIs phụ trách)
- **Backend:**
  - Controllers: `AuthController.java`, `UserController.java`, `ProjectController.java`, `ProjectMemberController.java`, `InvitationController.java`, `WorkflowController.java`, `CustomFieldController.java`.
  - Services: `IAuthService`, `IUserService`, `IProjectService`, `IWorkflowService`, `ICustomFieldService` (và các class Impl tương ứng).
  - Security: `JwtTokenProvider`, `ProjectSecurity.java`.
  - Database: Bảng `users`, `projects`, `project_members`, `invitations`, `workflows`, `workflow_statuses`, `workflow_transitions`, `custom_fields`.
- **Frontend:**
  - Thư mục: `src/features/auth/`, `src/features/profile/`, `src/features/projects/`, `src/features/members/`, `src/features/workflow/`.
  - Stores: `authStore.ts`, `projectStore.ts`.
  - Routes: `/login`, `/register`, `/profile`, `/projects`, `/projects/:id/members`, `/projects/:id/settings`, `/projects/:id/workflows`, `/projects/:id/custom-fields`.

---

###  DEV 2: MODULE QUẢN LÝ CÔNG VIỆC, PHÂN CẤP & BẢNG KANBAN
*(Work Tracking, Issue Lifecycle, Subtasks, Kanban Board, Details & Media)*

#### 2.1. Ngữ cảnh & Mục tiêu nghiệp vụ (Context)
Dev 2 chịu trách nhiệm về phân hệ có tần suất sử dụng cao nhất: Quản lý Issue, vòng đời công việc, mối quan hệ phân cấp Cha - Con (Epic → Story/Task/Bug → Subtask), trực quan hóa quy trình bằng bảng kéo thả Kanban, và màn hình chi tiết tương tác công việc.

#### 2.2. Chi tiết các chức năng cần phát triển

##### 1. Quản lý Vòng đời & Phân loại Công việc (Issue Lifecycle)
- **Hệ thống phân cấp công việc:**
  - Quản lý 4 loại công việc cấp cao: `Epic`, `Story`, `Task`, `Bug` và 1 loại cấp con: `Sub-task`.
  - Mã công việc tự sinh theo định dạng: `{PROJECT_KEY}-{NUMBER}` (ví dụ: `PTTKHT-1`, `PTTKHT-2`).
  - Hỗ trợ đầy đủ các trường thông tin: Tiêu đề (Summary), Mô tả chi tiết (Description hỗ trợ Rich text/Markdown), Trạng thái (Status), Độ ưu tiên (`Critical`, `High`, `Medium`, `Low`, `Lowest`), Người thực hiện (Assignee), Người tạo (Reporter), Ngày hết hạn (Due date), Điểm ước lượng (Story points / Estimate).
  - Nhập liệu và lưu trữ giá trị cho các **Trường tùy chỉnh (Custom Fields)** do Dev 1 định nghĩa.

##### 2. Quản lý Công việc con (Subtasks & Hierarchy View)
- **Quản lý Subtask trong danh sách bảng (`IssueTable`):**
  - Hiển thị cấu trúc cây lồng nhau (Tree view): Công việc con thụt dòng rõ ràng (`pl-6` cột mã với icon nhánh `↳`, `pl-8` cột tóm tắt với chấm bullet `•`).
  - Hai nút thao tác ở cuối hàng:
    - Nút `+`: Mở khung inline tạo nhanh subtask/bug trực tiếp dưới công việc cha.
    - Nút `^ / v`: Thu gọn / Xổ ra xem các subtask kèm huy hiệu số lượng công việc con (hiển thị đồng bộ `[ 0 v ]` hoặc `[ 2 v ]` trên tất cả các hàng để đảm bảo cân đối thị giác).
- **Chuyển đổi công việc (Convert Issue):**
  - Chuyển đổi một Issue độc lập thành Subtask của một Issue khác.
  - Tách một Subtask ra thành một Issue độc lập.
  - Kiểm tra điều kiện ràng buộc quyền: Phụ thuộc vào quyền `allowMemberConvertSubtask` do Dev 1 quản lý.

##### 3. Bảng Kanban tương tác kéo thả (Kanban Board)
- **Hiển thị luồng công việc trên bảng Kanban (`features/board`):**
  - Các cột trên bảng tự động ánh xạ theo danh sách trạng thái của Workflow dự án (Do Dev 1 cung cấp).
  - Thẻ card công việc hiển thị trực quan: Mã key, loại công việc, tiêu đề, nhãn (labels), avatar assignee, badge độ ưu tiên, số lượng subtask con đã hoàn thành (`2/5`).
  - Kéo thả thẻ công việc giữa các cột (`@hello-pangea/dnd`):
    - Kiểm tra tính hợp lệ của bước chuyển trạng thái (chỉ cho phép thả vào các cột nằm trong danh sách Transition cho phép).
    - Nếu bước chuyển yêu cầu duyệt (`is_approval_required`), hiển thị modal xác nhận gửi yêu cầu phê duyệt cho PM/QA.
    - Cơ chế **Optimistic Update**: Cập nhật vị trí thẻ trên UI tức thì, nếu API backend báo lỗi sẽ tự động hoàn trả thẻ về vị trí cũ kèm thông báo lỗi.
  - Bộ lọc nhanh trên bảng: Lọc việc của tôi ("My Issues"), lọc theo Epic, lọc theo loại công việc.

##### 4. Màn hình Chi tiết Công việc (Issue Detail Drawer & Page)
- **Hai chế độ xem:**
  - Drawer trượt từ cạnh phải (`IssueDetailDrawer`) giúp xem và xử lý nhanh mà không rời khỏi ngữ cảnh trang bảng/kanban.
  - Trang chi tiết độc lập toàn màn hình (`IssueDetailPage` tại route `/projects/:id/issues/:key`).
  - Hỗ trợ nút **Copy link** công việc để chia sẻ trực tiếp cho đồng nghiệp.
- **Chỉnh sửa nội dung trực tiếp (Inline Editing):**
  - Nhấp trực tiếp để sửa tiêu đề, đổi mô tả, chuyển trạng thái, thay đổi assignee, đổi độ ưu tiên, cập nhật custom fields mà không cần bấm nút "Lưu" toàn trang.
  - Đánh dấu hoa thị màu đỏ `*` nổi bật cho các trường bắt buộc nhập (`text-[#E53E3E] font-bold`).
- **Liên kết công việc (Issue Links):**
  - Tạo liên kết giữa các issue: `blocks` (chặn), `is blocked by` (bị chặn bởi), `relates to` (liên quan đến), `duplicates` (trùng lặp).

##### 5. Quản lý Nhãn & Tệp đính kèm (Labels & Attachments)
- **Hệ thống nhãn (Labels):** Tạo nhãn nhanh, gắn nhiều nhãn cho công việc, gợi ý nhãn có sẵn trong dự án.
- **Tệp đính kèm (Attachments):**
  - Tải lên nhiều tệp (ảnh chụp màn hình, file log, tài liệu Word/PDF).
  - Tích hợp lưu trữ qua MinIO / Object Storage.
  - Xem trước hình ảnh trực tiếp (Image lightbox/preview) và tải tệp về máy an toàn.

#### 2.3. Ranh giới Kỹ thuật (Files & APIs phụ trách)
- **Backend:**
  - Controllers: `IssueController.java`.
  - Services: `IIssueService`, `IIssueLinkService`, `IAttachmentService`.
  - Security: `IssueSecurity.java` (`canEdit`, `canDelete`, `canConvert`).
  - Database: Bảng `issues`, `labels`, `issue_labels`, `attachments`, `issue_links`, `custom_field_values`.
- **Frontend:**
  - Thư mục: `src/features/issues/`, `src/features/board/`.
  - Stores: `issueStore.ts`, `boardStore.ts`.
  - Routes: `/projects/:id/issues`, `/projects/:id/board`, `/projects/:id/issues/:key`.

---

###  DEV 3: MODULE CỘNG TÁC, TÌM KIẾM, BÁO CÁO & DASHBOARD
*(Collaboration, In-App Notifications, Worklogs, Search, Filters & Analytics)*

#### 2.1. Ngữ cảnh & Mục tiêu nghiệp vụ (Context)
Dev 3 đảm nhận phân hệ thúc đẩy sự cộng tác nhóm và khai thác dữ liệu: hệ thống trao đổi bình luận, nhắc tên `@mention`, ghi nhận thời gian làm việc (log work), trung tâm thông báo thời gian thực, công cụ tìm kiếm lọc nâng cao, cùng bảng tổng hợp Dashboard và các báo cáo phân tích trực quan.

#### 2.2. Chi tiết các chức năng cần phát triển

##### 1. Thảo luận & Tương tác Cộng tác (Comments & @Mention)
- **Bình luận công việc (`features/comments`):**
  - Hiển thị dòng thời gian thảo luận (Timeline) sắp xếp theo thời gian thực.
  - Khung soạn thảo bình luận hỗ trợ Rich text hoặc Markdown cơ bản.
  - Tính năng nhắc tên thành viên (`@mention`): Khi gõ `@`, hiển thị danh sách dropdown thành viên dự án để chọn nhanh; người được nhắc tên sẽ nhận được thông báo ngay lập tức.
  - Quyền sửa / xóa bình luận: Chỉ người viết bình luận hoặc PM dự án mới có quyền sửa/xóa.

##### 2. Ghi nhận Thời gian làm việc (Worklog & Time Tracking)
- **Nhật ký làm việc (`features/worklog`):**
  - Modal **Log Work**: Cho phép thành viên nhập số giờ/ngày đã làm (ví dụ: `2h 30m`, `1d`), ngày thực hiện công việc và mô tả tóm tắt nội dung đã làm.
  - Cập nhật tự động thời gian còn lại (Remaining Estimate).
  - Hiển thị thanh tiến độ thời gian (Time Progress Bar): So sánh giữa `Estimated Time` và `Time Spent`.
  - Danh sách lịch sử log work trong chi tiết công việc, hiển thị ai đã log bao nhiêu thời gian và vào lúc nào.

##### 3. Trung tâm Thông báo Đa kênh (Notification System)
- **Thông báo trong ứng dụng (In-app Notifications):**
  - Biểu tượng Chuông thông báo trên thanh Header kèm số lượng thông báo chưa đọc.
  - Dropdown danh sách thông báo: Phân loại theo loại sự kiện (được giao việc mới, có người mention trong comment, trạng thái task thay đổi, có yêu cầu phê duyệt).
  - Nhấp vào thông báo sẽ tự động đánh dấu đã đọc và chuyển hướng người dùng đến đúng màn hình chi tiết của công việc đó.
  - Chức năng "Đánh dấu tất cả là đã đọc".
- **Kênh thông báo Email (Background Worker):**
  - Tự động gửi email thông báo khi có sự kiện quan trọng (mời vào dự án, giao việc khẩn cấp) thông qua Spring Mail / MailHog.

##### 4. Tìm kiếm Toàn văn & Quản lý Bộ lọc (Search & Saved Filters)
- **Tìm kiếm nhanh toàn cục (Global Quick Search):**
  - Ô tìm kiếm trên thanh Header cho phép tìm kiếm nhanh theo mã task (`PTTKHT-1`) hoặc từ khóa tiêu đề.
  - Backend sử dụng PostgreSQL Trigram Index (`pg_trgm`) để tìm kiếm mờ (fuzzy search) với tốc độ cao (<50ms).
- **Bộ lọc nâng cao (Advanced Filters):**
  - Drawer lọc công việc đa tiêu chí: Lọc kết hợp theo Dự án, Loại công việc, Trạng thái, Người thực hiện, Độ ưu tiên, Nhãn, Khoảng thời gian, Giá trị Custom Field.
  - Chức năng **Lưu bộ lọc (Saved Filters)**: Người dùng có thể lưu cấu hình bộ lọc hiện tại với tên gọi riêng (ví dụ: "Lỗi nghiêm trọng cần fix ngay", "Task của tôi trong tuần này") để dùng lại trên thanh menu phụ.

##### 5. Bảng tin Dashboard & Báo cáo Phân tích (Dashboard & Visual Analytics)
- **Bảng tin Dự án (Project Dashboard):**
  - Các thẻ chỉ số KPI tổng quan: Tổng số công việc, Số công việc đã hoàn thành, Số việc đang xử lý, Số việc quá hạn (Overdue).
  - Dòng hoạt động gần đây (Recent Activities / Audit Log): Ghi nhận lịch sử ai vừa tạo/sửa/đổi trạng thái công việc trong dự án.
- **Báo cáo Biểu đồ trực quan (`features/reports` dùng Recharts):**
  - *Biểu đồ Phân bổ Trạng thái (Pie/Donut Chart):* Tỷ lệ % các công việc theo trạng thái.
  - *Biểu đồ Năng suất Thành viên (Bar Chart):* Số lượng công việc và điểm story points được giao cho từng thành viên.
  - *Báo cáo Lỗi (Bug Analytics):* Tỷ lệ phát sinh bug theo thời gian, tỷ lệ bug đã xử lý so với tồn đọng.
- **Xuất dữ liệu báo cáo (Export Data):**
  - Xuất danh sách công việc và thống kê ra file **Excel (`.xlsx`)** sử dụng Apache POI (hỗ trợ tiếng Việt đầy đủ).
  - Xuất file **CSV** chuẩn UTF-8 có BOM.

#### 2.3. Ranh giới Kỹ thuật (Files & APIs phụ trách)
- **Backend:**
  - Controllers: `NotificationController.java`, `SearchController.java`, `SavedFilterController.java`, `DashboardController.java`, `ReportController.java`.
  - Services: `INotificationService`, `ISearchService`, `ISavedFilterService`, `IDashboardService`, `IReportService`, `ICommentService`, `IWorklogService`.
  - Database: Bảng `notifications`, `comments`, `worklogs`, `saved_filters`, `audit_logs`, `watchers`.
- **Frontend:**
  - Thư mục: `src/features/comments/`, `src/features/worklog/`, `src/features/notifications/`, `src/features/search/`, `src/features/filters/`, `src/features/dashboard/`, `src/features/reports/`.
  - Stores: `notificationStore.ts`, `filterStore.ts`.
  - Routes: `/projects/:id/dashboard`, `/projects/:id/reports`, `/projects/:id/filters`.

---

## 3. LỘ TRÌNH PHỐI HỢP THEO SPRINT (3 SPRINTS ROADMAP)

```
GIAI ĐOẠN 1 (Sprint 1)        GIAI ĐOẠN 2 (Sprint 2)        GIAI ĐOẠN 3 (Sprint 3)
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  Xây dựng Khung lõi  │ ──► │ Tương tác Chuyên sâu │ ──► │  Tối ưu & Hoàn thiện │
│   & Dữ liệu cơ bản   │     │ & Kết nối Liên module│     │   E2E & Production   │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

### Sprint 1: Xây dựng Nền tảng lõi & Tính năng độc lập (Foundation & Independence)
* **Dev 1:** Hoàn thiện Auth JWT, Mời thành viên, CRUD Dự án, Seed dữ liệu Workflow mặc định, Dựng bảng Custom Fields.
* **Dev 2:** Xây dựng CRUD Issue lõi, Form tạo công việc hỗ trợ trường tùy chỉnh, Giao diện danh sách Issue dạng bảng (`IssueTable`) hỗ trợ thụt lề cây công việc con.
* **Dev 3:** Xây dựng hạ tầng Notification backend, Khung bình luận đơn giản, Giao diện Dashboard cơ bản với các thẻ chỉ số KPI tĩnh/mockup.
* *Mục tiêu cuối Sprint 1:* Người dùng đăng nhập được, tạo được dự án, mời thành viên, tạo được Issue và Subtask hiển thị trên bảng.

### Sprint 2: Tương tác Chuyên sâu & Kết nối Liên module (Cross-Module Integration)
* **Dev 1:** Hoàn thiện giao diện cấu hình Workflow trực quan, Ma trận Phân quyền tác động lớn (GitHub-style) kèm modal xác nhận & toast lưu quyền.
* **Dev 2:** Bảng Kanban kéo thả hoàn chỉnh (tích hợp ràng buộc Workflow từ Dev 1), Màn hình Drawer & Page chi tiết công việc với Inline Editing, Upload tệp đính kèm.
* **Dev 3:** Tích hợp chuông thông báo in-app (bắt sự kiện từ Dev 1 & Dev 2), Tích hợp `@mention` trong bình luận, Modal Log Work tính toán thời gian, Bổ sung bộ lọc nâng cao.
* *Mục tiêu cuối Sprint 2:* Vòng đời công việc chạy trơn tru từ tạo việc → kéo thả kanban → log time → thảo luận mention → nhận thông báo.

### Sprint 3: Báo cáo Nâng cao, Tối ưu Hiệu năng & Đóng gói (Analytics, Polish & Release)
* **Dev 1:** Rà soát bảo mật phân quyền đa tầng (`@PreAuthorize`), Xử lý các edge case (chặn xóa PM cuối cùng, bảo vệ dữ liệu khi đóng dự án).
* **Dev 2:** Tối ưu trải nghiệm kéo thả trên Kanban, tối ưu responsive trên tablet, hoàn thiện tính năng convert issue sang subtask.
* **Dev 3:** Xây dựng đầy đủ các biểu đồ Recharts (Burndown, Workload, Bug distribution), tính năng xuất báo cáo Excel/CSV, tối ưu tốc độ câu truy vấn báo cáo.
* *Mục tiêu cuối Sprint 3:* Hệ thống đạt tiêu chuẩn kiểm thử tích hợp (Integration Test / E2E), không còn lỗi console, hiệu năng phản hồi <500ms, sẵn sàng đóng gói Docker triển khai.

---

## 4. CHECKLIST TIÊU CHUẨN HOÀN THÀNH (DEFINITION OF DONE - DOD)

Trước khi một thành viên tạo Pull Request để merge vào nhánh `main`, tính năng phải đáp ứng 100% các tiêu chí sau:

1. [ ] **Code Clean & Lint:** Không có lỗi TypeScript (`npm run build` không lỗi, không có warning đỏ).
2. [ ] **Backend Compile:** `mvn clean compile` hoặc `mvn test-compile` thành công 100%.
3. [ ] **Migration An toàn:** File migration Flyway mới được đặt tên đúng dải số quy định, đã kiểm tra chạy mượt mà trên CSDL Postgres local.
4. [ ] **Bảo mật & Phân quyền:** Tất cả các endpoint API mới đều có `@PreAuthorize` kiểm tra đúng vai trò dự án (`@projectSecurity` hoặc `@issueSecurity`).
5. [ ] **Trải nghiệm UI:** Có trạng thái Loading (Skeleton / Spinner) khi gọi API, thông báo lỗi bằng tiếng Việt rõ ràng, Toast phản hồi kết quả thao tác thành công.
6. [ ] **Không xung đột nhánh:** Đã rebase thành công với `main` mới nhất trước khi yêu cầu review code.
