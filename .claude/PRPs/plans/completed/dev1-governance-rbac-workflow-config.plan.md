# Plan: DEV 1 - Governance, RBAC, Project Lifecycle, Workflow & Custom Fields

## Summary
Kế hoạch toàn diện cho **DEV 1** nhằm hoàn thiện, bảo mật hóa và tối ưu hóa 5 phân hệ cốt lõi: Xác thực & Hồ sơ, Vòng đời Dự án & Thành viên, Phân quyền tác động lớn (GitHub-style), Động cơ Quy trình (Workflow Engine) và Trường thông tin tùy chỉnh (Dynamic Custom Fields). Kế hoạch đảm bảo ranh giới kỹ thuật độc lập tuyệt đối (Vertical Slice), không gây xung đột với Dev 2 (Kanban & Issues) và Dev 3 (Collaboration & Analytics).

## User Story
Là một **Quản trị viên & Quản lý Dự án (PM)**, tôi muốn một hệ thống quản trị, phân quyền và cấu hình quy trình mạnh mẽ, bảo mật và linh hoạt, để mọi thành viên trong dự án có thể phối hợp làm việc trơn tru, đúng quyền hạn, không bị rò rỉ dữ liệu hoặc sai lệch trạng thái công việc.

## Problem → Solution
- **Hiện trạng:** Mã nguồn đã có nền móng ~85-95% cho các tính năng của Dev 1 (build thành công, 62 unit tests xanh). Tuy nhiên, vẫn còn những điểm lệch giữa các tài liệu đặc tả cũ (`context (1).md`, `project_structure (4).md`, `API_DOCUMENTATION.md`) và codebase thực tế (`TEAM_TASK_ALLOCATION.md`, `V15`, `V16`), cùng với các edge case cần được rà soát và kiểm thử tự động chặt chẽ (chặn đóng dự án, bảo vệ PM cuối cùng, ma trận transition không có chu trình chết, validation trường tùy chỉnh).
- **Giải pháp:** Thiết lập ranh giới module chuẩn mực; chuẩn hóa toàn bộ các hợp đồng DTO/API của Dev 1; rà soát và gia cố các chốt chặn bảo mật (`@projectSecurity`); viết thêm unit tests bao phủ các ca biên (edge cases); và cung cấp API metadata trường tùy chỉnh chuẩn xác cho Dev 2 mà không can thiệp vào mã nguồn của Dev 2/Dev 3.

## Metadata
- **Complexity**: Large (Phân hệ nền tảng đa chức năng, bảo mật đa tầng, ảnh hưởng toàn hệ thống)
- **Source Documents**: `TEAM_TASK_ALLOCATION.md`, `SRS_PMS.docx`, `API_DOCUMENTATION.md`, `context (1).md`, `project_structure (4).md`, `README.md`
- **Target Branch**: `feature/dev1-governance-quantri_phanquyen_cauhinhHT`
- **Flyway Range**: `V20__...` đến `V29__...` (nếu cần migration mới)
- **Estimated Files Affected**: ~12-16 files (Backend & Frontend)

---

## UX Design

### Before (Hiện tại)
```
┌────────────────────────────────────────────────────────────────────────┐
│ - Các màn hình cài đặt dự án, thành viên, workflow, custom fields      │
│   đã hoạt động cơ bản nhưng cần đảm bảo trải nghiệm lưu quyền mượt mà. │
│ - Đã có nút "Lưu" quyền tác động lớn kèm popup xác nhận nhưng cần      │
│   kiểm tra tính toàn vẹn trạng thái khi bấm Hủy/Lưu nhiều lần.         │
└────────────────────────────────────────────────────────────────────────┘
```

### After (Mục tiêu hoàn thiện xuất sắc)
```
┌────────────────────────────────────────────────────────────────────────┐
│ [Màn hình Members & Permissions]                                       │
│ ├── Danh sách thành viên: Badge vai trò rõ ràng, chặn xóa PM cuối      │
│ └── Phân quyền GitHub-style: 4 Switch có mô tả chi tiết                │
│     ├── Bật/Tắt -> Nút "Hủy" & "Lưu" nổi bật                           │
│     └── Popup cảnh báo thay đổi -> Xác nhận -> Toast xanh chuẩn UX     │
│                                                                        │
│ [Màn hình Workflow Settings]                                           │
│ ├── Ma trận Transition trực quan, cảnh báo trạng thái mồ côi (Orphan)  │
│ └── Kiểm tra ràng buộc: Luôn có Initial status và Done category        │
│                                                                        │
│ [Màn hình Custom Fields]                                               │
│ └── Quản lý động 5 loại dữ liệu (TEXT, NUMBER, DATE, SELECT, CHECKBOX) │
│     với validation rules rõ ràng, cấp metadata cho Form của Dev 2      │
└────────────────────────────────────────────────────────────────────────┘
```

### Interaction Changes
| Vị trí tương tác | Trước | Sau khi Dev 1 hoàn thiện | Ghi chú |
|---|---|---|---|
| `/projects/:id/members` | Cấu hình phân quyền đã có UI | Đảm bảo đồng bộ tức thì, nút Hủy khôi phục 100% dữ liệu gốc | Đã có backend endpoint `PUT /permissions` |
| Xóa/Hạ vai trò PM | Báo lỗi chung | Báo lỗi nghiệp vụ rõ ràng: `LAST_PM_REMOVAL` | Bảo vệ tính toàn vẹn của dự án |
| Đóng dự án | Trạng thái chuyển `CLOSED` | Chặn triệt để mọi API tạo/sửa Issue (`PROJECT_CLOSED`), chỉ cho phép đọc & xuất báo cáo | Bảo vệ dữ liệu lịch sử |
| `/projects/:id/workflow` | Form cấu hình workflow | Bắt lỗi chu trình mồ côi, kiểm tra ít nhất 1 Done status | Bảo vệ Kanban của Dev 2 không bị gãy |
| `/projects/:id/custom-fields` | Quản lý trường tùy chỉnh | Hỗ trợ 5 loại dữ liệu, danh sách option cho Select, min/max cho Number | Dev 2 chỉ đọc metadata để render |

---

## Mandatory Reading

| Độ ưu tiên | File cần đọc | Dòng | Mục đích nắm bắt |
|---|---|---|---|
| **P0 (Cực kỳ quan trọng)** | `backend/src/main/java/com/pms/backend/security/ProjectSecurity.java` | 1-89 | Cơ chế kiểm tra vai trò `isPmOrAdmin`, `isMember`, `canManageCustomFields`, `assertProjectWritable` |
| **P0 (Cực kỳ quan trọng)** | `backend/src/main/java/com/pms/backend/service/impl/ProjectServiceImpl.java` | 65-145, 200-240 | Logic tạo dự án, gán PM, seed workflow mặc định, cập nhật quyền hạn dự án |
| **P0 (Cực kỳ quan trọng)** | `backend/src/main/java/com/pms/backend/service/impl/MembershipServiceImpl.java` | 45-85 | Logic đổi vai trò, xóa thành viên, chốt chặn `LAST_PM_REMOVAL` |
| **P0 (Cực kỳ quan trọng)** | `backend/src/main/java/com/pms/backend/service/impl/WorkflowServiceImpl.java` | 70-160 | Ràng buộc nghiệp vụ workflow: initial status, done category, duplicate names |
| **P1 (Quan trọng)** | `backend/src/main/java/com/pms/backend/service/impl/CustomFieldServiceImpl.java` | 1-120 | CRUD Custom Field và validation metadata |
| **P1 (Quan trọng)** | `frontend/src/features/members/pages/Members.tsx` | 255-410 | Giao diện phân quyền GitHub-style, modal xác nhận lưu/hủy quyền |
| **P1 (Quan trọng)** | `frontend/src/features/workflow/pages/WorkflowSettings.tsx` | 1-200 | Màn hình cấu hình Workflow |
| **P2 (Tham khảo)** | `backend/src/main/java/com/pms/backend/security/IssueSecurity.java` | 75-125 | Cách Dev 2 đọc quyền do Dev 1 quản lý (`allowMemberDeleteIssue`, `canConvert`) |

---

## Patterns to Mirror (Tuân thủ tuyệt đối quy ước dự án)

### 1. NAMING_CONVENTION
```java
// SOURCE: backend/src/main/java/com/pms/backend/controller/ProjectController.java:19-25
@RestController
@RequestMapping({"/api/projects", "/projects"})
public class ProjectController {
    private final IProjectService projectService;
    private final IUserService userService;
    // Constructor injection, Interface-based, camelCase endpoints
}
```

### 2. ERROR_HANDLING
```java
// SOURCE: backend/src/main/java/com/pms/backend/service/impl/MembershipServiceImpl.java:56-60
long pmCount = memberRepository.countByProjectIdAndRole(projectId, ProjectRole.PM);
if (pmCount <= 1) {
    throw new BusinessException(ErrorCode.LAST_PM_REMOVAL, "Không thể hạ vai trò của Project Manager duy nhất trong dự án");
}
```

### 3. SECURITY_ASSERTION
```java
// SOURCE: backend/src/main/java/com/pms/backend/security/ProjectSecurity.java:70-73
public boolean canManageCustomFields(Long projectId) {
    if (isPmOrAdmin(projectId)) return true;
    if (!isMember(projectId)) return false;
    return projectRepository.findById(projectId)
            .map(p -> Boolean.TRUE.equals(p.getAllowMemberManageCustomFields()))
            .orElse(false);
}
```

### 4. AUDIT_LOGGING
```java
// SOURCE: backend/src/main/java/com/pms/backend/service/impl/MembershipServiceImpl.java:65
auditService.log("CHANGE_ROLE", "PROJECT_MEMBER", member.getId(), projectId, oldRole.name(), newRole.name());
```

### 5. TEST_STRUCTURE (MOCKITO UNIT TEST)
```java
// SOURCE: backend/src/test/java/com/pms/backend/service/MembershipServiceTest.java:26-30
@ExtendWith(MockitoExtension.class)
public class MembershipServiceTest {
    @Mock private ProjectMemberRepository memberRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private ProjectSecurity projectSecurity;
    @InjectMocks private MembershipServiceImpl membershipService;
}
```

---

## Files to Change / Inspect (Phạm vi của Dev 1)

| File | Hành động | Trách nhiệm |
|---|---|---|
| `backend/src/main/java/com/pms/backend/security/ProjectSecurity.java` | REVIEW / HARDEN | Kiểm tra quyền truy cập dự án, PM guard, custom field management |
| `backend/src/main/java/com/pms/backend/service/impl/ProjectServiceImpl.java` | REVIEW / HARDEN | Vòng đời dự án, seed workflow, gửi lời mời ban đầu |
| `backend/src/main/java/com/pms/backend/service/impl/MembershipServiceImpl.java` | REVIEW / HARDEN | Đổi vai trò, xóa thành viên, chốt chặn không xóa PM duy nhất |
| `backend/src/main/java/com/pms/backend/service/impl/WorkflowServiceImpl.java` | REVIEW / HARDEN | Kiểm tra trạng thái hợp lệ, ma trận transition, orphan warning |
| `backend/src/main/java/com/pms/backend/service/impl/CustomFieldServiceImpl.java` | REVIEW / HARDEN | Metadata trường tùy chỉnh, hỗ trợ các kiểu TEXT, NUMBER, DATE, SELECT, CHECKBOX |
| `frontend/src/features/members/pages/Members.tsx` | POLISH / VERIFY | Khối GitHub-style permissions, modal xác nhận, toast |
| `frontend/src/features/workflow/pages/WorkflowSettings.tsx` | POLISH / VERIFY | Màn hình cấu hình Workflow trực quan |
| `frontend/src/features/projects/pages/CustomFieldsSettings.tsx` | POLISH / VERIFY | Màn hình quản lý trường tùy chỉnh |
| `backend/src/test/java/com/pms/backend/service/ProjectSecurityEdgeCaseTest.java` | CREATE | Bộ test mới bao phủ các ca biên bảo mật của Dev 1 |

---

## NOT Building (Những việc tuyệt đối KHÔNG đụng vào để tránh xung đột)

- **KHÔNG** đụng vào `IssueController.java`, `IssueServiceImpl.java`, `Board.tsx`, `KanbanColumn.tsx`, `IssueTable.tsx`, `IssueDetailDrawer.tsx` (Đây là địa hạt của **DEV 2**).
- **KHÔNG** đụng vào `CommentController.java`, `WorklogController.java`, `NotificationController.java`, `ReportController.java`, `DashboardController.java`, `Recharts` (Đây là địa hạt của **DEV 3**).
- **KHÔNG** sửa đổi cấu trúc bảng `issues`, `comments`, `worklogs`, `notifications`.
- **KHÔNG** thêm các trường bắt buộc vào model dùng chung (`Project`, `User`) mà không có giá trị mặc định / optional.

---

## Step-by-Step Tasks (Chi tiết kế hoạch triển khai A - Z)

### Giai đoạn 1: Kiểm thử & Khảo sát thực tế hệ thống (Audit & Verification)
* **Task 1.1**: Khởi động song song Backend (cổng 8080) và Frontend (cổng 5173).
* **Task 1.2**: Đăng nhập bằng tài khoản mẫu `pm@epms.com` / `Password123@`.
* **Task 1.3**: Kiểm tra toàn bộ luồng giao diện của Dev 1:
  - Tạo dự án mới kèm danh sách email mời ban đầu.
  - Vào trang cài đặt thành viên & phân quyền: Bật/tắt các quyền GitHub-style, nhấn Hủy xem có phục hồi không, nhấn Lưu xem modal xác nhận và toast thông báo có hiển thị chuẩn không.
  - Vào trang cài đặt Workflow: Thêm trạng thái mới, tạo bước chuyển tiếp, kiểm tra cảnh báo trạng thái mồ côi.
  - Vào trang Quản lý trường tùy chỉnh: Tạo trường loại `SELECT` (nhập options), trường `NUMBER` (min/max), trường `CHECKBOX`, kiểm tra lưu và cập nhật.

### Giai đoạn 2: Gia cố Backend & Xử lý toàn diện các Ca biên (Backend Hardening & Edge Cases)
* **Task 2.1: Gia cố chốt chặn bảo vệ PM duy nhất (Last PM Guard)**
  - Đảm bảo trong cả 2 trường hợp: (1) Xóa thành viên là PM, và (2) Hạ vai trò của PM xuống Member/Dev/QA, nếu số lượng PM trong dự án $\le 1$ thì phải chặn đứng và trả về `ErrorCode.LAST_PM_REMOVAL`.
* **Task 2.2: Gia cố quy tắc Đóng dự án (Project Closed Guard)**
  - Đảm bảo khi dự án ở trạng thái `CLOSED`, hàm `assertProjectWritable` chặn mọi thao tác sửa đổi thông tin dự án, sửa workflow, sửa custom fields, mời thêm thành viên.
* **Task 2.3: Gia cố quy tắc kiểm tra Workflow Transitions**
  - Kiểm tra xem có trạng thái nào bị cô lập hoàn toàn không thể đến hoặc không thể đi (orphan status).
  - Kiểm tra bắt buộc phải có ít nhất 1 trạng thái thuộc category `TODO` đánh dấu `is_initial = true` và ít nhất 1 trạng thái thuộc category `DONE`.
* **Task 2.4: Hoàn thiện Validation cho Dynamic Custom Fields**
  - Đảm bảo khi tạo trường kiểu `DROPDOWN / SELECT`, bắt buộc phải có danh sách options không rỗng.
  - Đảm bảo kiểu `NUMBER` có thể kiểm tra min/max hợp lệ.
  - Đảm bảo tên trường (field name) không bị trùng lặp trong cùng một dự án.

### Giai đoạn 3: Tối ưu trải nghiệm Frontend (UI/UX Polish)
* **Task 3.1: Kiểm tra tính toàn vẹn của Khối Phân quyền dự án (Members.tsx)**
  - Đảm bảo trạng thái `hasChanges` chỉ bật khi thực sự có checkbox bị thay đổi so với dữ liệu server.
  - Khi bấm **Hủy**, phục hồi nguyên vẹn giá trị ban đầu mà không cần reload trang.
  - Khi bấm **Lưu**, hiển thị modal xác nhận với nút Xác nhận và Hủy. Khi lưu thành công, bắn Toast xanh và cập nhật baseline state.
* **Task 3.2: Kiểm tra Form Custom Fields (CustomFieldsSettings.tsx)**
  - Đảm bảo giao diện thêm options cho Dropdown mượt mà (thêm, xóa từng option tag).
  - Hiển thị badge kiểu dữ liệu màu sắc phân biệt (`TEXT`, `NUMBER`, `DATE`, `SELECT`, `CHECKBOX`).
* **Task 3.3: Kiểm tra giao diện Workflow Settings**
  - Hiển thị danh sách Status theo thứ tự position.
  - Hiển thị rõ ràng các bước chuyển tiếp hợp lệ (Transitions) và cờ duyệt (`isApprovalRequired`).

### Giai đoạn 4: Viết bổ sung Unit Tests tự động (Test Automation)
* **Task 4.1**: Viết thêm bộ test `ProjectSecurityTest` kiểm tra:
  - Thành viên thường không thể gọi API cấu hình Workflow (403 Forbidden).
  - Thành viên thường chỉ được quản lý Custom Fields khi cờ `allowMemberManageCustomFields = true`.
* **Task 4.2**: Viết thêm test cho `WorkflowServiceTest`:
  - Test ném lỗi khi cập nhật workflow không có status `DONE`.
  - Test ném lỗi khi cập nhật workflow không có status `isInitial`.
  - Test ném lỗi khi có 2 status trùng tên.
* **Task 4.3**: Viết thêm test cho `CustomFieldServiceTest`:
  - Test tạo custom field hợp lệ và kiểm tra metadata trả về.
  - Test ném lỗi khi tạo field `SELECT` mà không truyền options.

### Giai đoạn 5: Kiểm tra chất lượng & Tiêu chuẩn hoàn thành (Definition of Done)
* **Task 5.1**: Chạy `mvn test` đảm bảo 100% tests pass (không có lỗi hay cảnh báo đỏ).
* **Task 5.2**: Chạy `npm run build` ở thư mục frontend đảm bảo 0 lỗi TypeScript, 0 lỗi build.
* **Task 5.3**: Kiểm tra git status đảm bảo sạch sẽ, chỉ chứa các thay đổi thuộc phân hệ Dev 1.

---

## Testing Strategy & Edge Cases Checklist

### Unit Tests Checklist
- [ ] Xóa thành viên PM khi có 2 PM trong dự án -> Thành công.
- [ ] Xóa thành viên PM khi chỉ có 1 PM duy nhất -> Ném `LAST_PM_REMOVAL` (409 Conflict).
- [ ] Hạ vai trò PM xuống MEMBER khi chỉ có 1 PM duy nhất -> Ném `LAST_PM_REMOVAL`.
- [ ] Dự án đã `CLOSED` -> Mọi thao tác sửa đổi ném `PROJECT_CLOSED` (409 Conflict).
- [ ] Cập nhật workflow không có status `DONE` -> Ném `VALIDATION_ERROR` (400 Bad Request).
- [ ] Cập nhật workflow không có status ban đầu `isInitial` -> Ném `VALIDATION_ERROR`.
- [ ] Tạo custom field `SELECT` rỗng options -> Ném `VALIDATION_ERROR`.
- [ ] Thành viên thường tạo custom field khi PM tắt quyền -> Ném `AccessDeniedException` (403 Forbidden).
- [ ] Thành viên thường tạo custom field khi PM bật quyền -> Cho phép thành công.

---

## Validation Commands

```bash
# 1. Kiểm tra build Frontend & Type-check:
cd d:\Web_T7\frontend && npm run build

# 2. Biên dịch Backend & Test:
cd d:\Web_T7\backend && mvn clean test

# 3. Kiểm tra trạng thái Git nhánh Dev 1:
cd d:\Web_T7 && git status
```

---

## Completion Criteria & Risks
- **Tiêu chuẩn hoàn thành**: Toàn bộ 5 phân hệ của Dev 1 chạy ổn định, không có lỗi console, không có lỗi TypeScript, 100% unit tests xanh.
- **Rủi ro & Biện pháp phòng tránh**:
  - *Rủi ro*: Sửa đổi logic phân quyền làm ảnh hưởng đến Dev 2 khi gọi `@issueSecurity`.
  - *Biện pháp*: Giữ nguyên signature của các phương thức trong `ProjectSecurity`, chỉ bổ sung các điều kiện kiểm tra an toàn.
  - *Rủi ro*: Xung đột migration CSDL Flyway.
  - *Biện pháp*: Dev 1 chỉ sử dụng dải số `V20__...` đến `V29__...`, tuyệt đối không sửa lại các file migration cũ từ `V1` đến `V16`.

