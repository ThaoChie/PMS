# SURVEY — Khảo sát code EPMS cho tích hợp Camunda

> Người thực hiện: Phase 0, task 0.1–0.3  
> Ngày: 06/11/2026  
> **Lưu ý:** mọi đường dẫn và chữ ký hàm đã xác minh bằng đọc code thật. Nếu tên class/file thay đổi, survey này cần cập nhật.

---

## 1. Cấu trúc package backend

```
com.pms.backend
├── common/          ApiResponse, AuditLogAspect, BaseEntity
├── config/          AsyncConfig, SchedulingConfig, DatabaseConfig, SecurityConfig, ...
├── controller/      ProjectController, WorkflowController, ...
├── dao/             *Repository (Spring Data JPA)
├── dto/             request/response DTOs
├── enu/             ErrorCode, NotificationType, ProjectRole, ProjectStatus, ...
├── exception/       BusinessException, ResourceNotFoundException, ForbiddenException, ...
├── hibernateDao/    BaseHibernateDao, ProjectListHibernateDao, IssueSearchDao, ...
├── job/             InvitationExpiryJob, FilterDigestJob
├── mapper/          UserMapper, ...
├── model/           Project, User, Issue, Notification, ...
├── security/        AuthUserPrincipal, ProjectSecurity, IssueSecurity, SecurityConfig, ...
├── service/
│   ├── interfaces/  IProjectService, IWorkflowService, INotificationService, ...
│   └── impl/        ProjectServiceImpl, WorkflowServiceImpl, NotificationServiceImpl, ...
├── util/            DurationParser, HtmlSanitizer, ...
└── wrapper/         PageWrapper
```

**Nguồn thật:**  
`backend/src/main/java/com/pms/backend/{common,config,controller,dao,dto,enu,exception,hibernateDao,job,mapper,model,security,service,util,wrapper}/`

---

## 2. ProjectService — đóng dự án

**Interface:** `backend/src/main/java/com/pms/backend/service/interfaces/IProjectService.java`

```java
ProjectResponse closeProject(Long projectId);
```

**Impl:** `backend/src/main/java/com/pms/backend/service/impl/ProjectServiceImpl.java`

```java
@Transactional
public ProjectResponse closeProject(Long projectId) {
    Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

    if (project.getStatus() == ProjectStatus.CLOSED) {
        throw new BusinessException(ErrorCode.CONFLICT, "Dự án đã ở trạng thái đóng trước đó");
    }

    project.setStatus(ProjectStatus.CLOSED);
    project = projectRepository.save(project);

    auditService.log("CLOSE_PROJECT", "PROJECT", project.getId(), project.getId(),
                     "Status: ACTIVE", "Status: CLOSED");
    // ...
}
```

**Kiểm tra quyền:** Chỉ ở **controller**, không ở service.

```java
// ProjectController.java (dòng 83–86)
@PostMapping("/{id}/close")
@PreAuthorize("@projectSecurity.isPmOrAdmin(#id)")
public ApiResponse<ProjectResponse> closeProject(@PathVariable Long id) {
    return ApiResponse.success(projectService.closeProject(id));
}
```

**→ Kết luận:** `closeProject()` ở service không tự kiểm tra quyền. Interceptor mới có thể chặn `POST /api/projects/{id}/close` trước khi tới controller, không cần sửa ProjectServiceImpl.

---

## 3. WorkflowService — cập nhật cấu hình Workflow

**Interface:** `backend/src/main/java/com/pms/backend/service/interfaces/IWorkflowService.java`

```java
WorkflowResponse updateWorkflow(Long projectId, SaveWorkflowRequest request);
```

**DTO payload:** `backend/src/main/java/com/pms/backend/dto/SaveWorkflowRequest.java`

```java
public class SaveWorkflowRequest {
    @NotEmpty List<WorkflowStatusDto> statuses;
    List<WorkflowTransitionDto> transitions;
}
```

**Impl:** `backend/src/main/java/com/pms/backend/service/impl/WorkflowServiceImpl.java`

```java
@Transactional
public WorkflowResponse updateWorkflow(Long projectId, SaveWorkflowRequest request) {
    Project project = projectRepository.findById(projectId)
            .orElseThrow(...);
    projectSecurity.assertProjectWritable(project);
    // ... validation + save statuses/transitions
    auditService.log("UPDATE_WORKFLOW", "PROJECT", projectId, ...);
}
```

**Kiểm tra quyền:** Có `projectSecurity.assertProjectWritable()` trong service (kiểm tra `CLOSED`), nhưng kiểm tra vai trò PM/Admin chỉ ở **controller**:

```java
// WorkflowController.java (dòng 27–32)
@PutMapping
@PreAuthorize("@projectSecurity.isPmOrAdmin(#projectId)")
public ApiResponse<WorkflowResponse> updateWorkflow(
        @PathVariable Long projectId,
        @RequestBody SaveWorkflowRequest request) {
    return ApiResponse.success(workflowService.updateWorkflow(projectId, request));
}
```

**URL endpoint:** `PUT /api/projects/{projectId}/workflow`

**→ Kết luận:** Interceptor mới chặn `PUT /api/projects/{projectId}/workflow`. Payload của `WORKFLOW_CONFIG_CHANGE` phải có shape `SaveWorkflowRequest` (statuses + transitions). Validation có thể gọi lại service hay deserialize + bean validation.

---

## 4. AuditLogAspect — cách lấy người thực hiện

**File:** `backend/src/main/java/com/pms/backend/common/AuditLogAspect.java`

```java
@Aspect @Component
public class AuditLogAspect {
    @AfterReturning(pointcut = "execution(* com.pms.backend.service..*.create*(..)) || ...")
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
        String username = "system";
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !authentication.getPrincipal().equals("anonymousUser")) {
            username = authentication.getName();  // ← lấy từ SecurityContext
        }
        logger.info("AUDIT LOG - User: {} - Action: {} - Result: {}", username, ...);
    }
}
```

**→ Kết luận:** Aspect lấy người thực hiện qua `SecurityContextHolder.getContext().getAuthentication().getName()`. Worker Camunda không có HTTP request → phải dựng `SecurityContext` thủ công bằng `UsernamePasswordAuthenticationToken` (hoặc custom `Authentication`) trước khi gọi service, rồi xóa sau.

**Mẫu cho worker:**
```java
SecurityContext ctx = SecurityContextHolder.createEmptyContext();
ctx.setAuthentication(new UsernamePasswordAuthenticationToken(
    decidingUser.getEmail(), null, List.of()));
SecurityContextHolder.setContext(ctx);
try {
    projectService.closeProject(projectId);   // audit ghi đúng decidingUser
} finally {
    SecurityContextHolder.clearContext();
}
```

---

## 5. NotificationService và NotificationType

**Interface:** `backend/src/main/java/com/pms/backend/service/interfaces/INotificationService.java`  
**Impl:** `backend/src/main/java/com/pms/backend/service/impl/NotificationServiceImpl.java`

**Chữ ký hàm gửi thông báo:**
```java
void notify(NotificationType type, List<User> recipients,
            String title, String message, String link,
            String data, User sender);
```

**Giá trị enum hiện có** (`backend/.../enu/NotificationType.java`):
```java
public enum NotificationType {
    MENTION,
    ASSIGNED,
    STATUS_CHANGED,
    APPROVAL_REQUESTED,   // ← dùng được khi tạo yêu cầu duyệt
    APPROVAL_RESULT,      // ← dùng được khi approve/reject/cancel
    INVITE_RECEIVED,
    INVITE_RESPONDED
}
```

**Kiểu lưu DB** (`backend/.../resources/db/migration/V5__notifications.sql`):
```sql
CREATE TABLE IF NOT EXISTS notifications (
    type VARCHAR(50) NOT NULL,   -- ← không có CHECK constraint
    ...
);
```

**→ Kết luận:**  
- `APPROVAL_REQUESTED` và `APPROVAL_RESULT` đủ cho hầu hết thông báo duyệt.  
- Nhắc/escalate/hết hạn chưa có loại phù hợp → cần thêm **`REMINDER`** (allowlist #3).  
- **Không có CHECK constraint** trên cột `type` → chỉ cần thêm hằng số vào enum, không cần migration thêm.

---

## 6. ErrorCode

**File:** `backend/src/main/java/com/pms/backend/enu/ErrorCode.java`

Các hằng hiện có (trích):
```java
VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, RESOURCE_NOT_FOUND, CONFLICT,
PROJECT_KEY_EXISTS, PROJECT_CLOSED, MEMBER_ALREADY_EXISTS, LAST_PM_REMOVAL,
UNPROCESSABLE_ENTITY, USER_NOT_FOUND, ESTIMATE_INVALID, EPIC_LINK_CYCLE,
REQUIRED_FIELD_MISSING, INVITATION_EXPIRED, TOO_MANY_REQUESTS,
INTERNAL_SERVER_ERROR, ...
```

**→ Kết luận:** Không có hằng `APPROVAL_*`. Cần thêm `APPROVAL_001`…`APPROVAL_006`. Nên đặt trong file mới `ApprovalErrorCode.java` nếu `GlobalExceptionHandler` cho phép; nếu handler chỉ nhận `ErrorCode` enum thì dùng allowlist #2 (append vào enum hiện có).

> ⚠️ **Điểm cần hỏi người dùng:** `GlobalExceptionHandler` xử lý `BusinessException` với `ErrorCode`. Nếu tạo enum mới `ApprovalErrorCode` thì handler phải nhận interface chung. Nếu không muốn sửa handler → phải append vào `ErrorCode.java` (allowlist #2). Xem mục "Câu hỏi cho người dùng" ở cuối.

---

## 7. PageWrapper và ApiResponse

**PageWrapper:** `backend/src/main/java/com/pms/backend/wrapper/PageWrapper.java`
```java
public class PageWrapper<T> {
    List<T> content; int page; int size;
    long totalElements; int totalPages;
    // static factory: of(), from(Page<T>), empty()
}
```

**ApiResponse:** `backend/src/main/java/com/pms/backend/common/ApiResponse.java`
```java
public class ApiResponse<T> {
    boolean success; String message; T data;
    // static factory: success(T data), error(String message)
}
```

**→ Kết luận:** Response mới dùng `ApiResponse.success(pageWrapper)` hoặc `ApiResponse.success(approvalResponse)`.

---

## 8. ProjectSecurity — các hàm sẵn có

**File:** `backend/src/main/java/com/pms/backend/security/ProjectSecurity.java`  
**Bean name:** `@Component("projectSecurity")`

| Hàm | Chữ ký | Mô tả |
|---|---|---|
| `getCurrentUser()` | `AuthUserPrincipal getCurrentUser()` | Lấy principal từ SecurityContext |
| `isMember(projectId)` | `boolean isMember(Long projectId)` | Kiểm tra thành viên dự án |
| `hasRole(projectId, roles...)` | `boolean hasRole(Long projectId, String... roles)` | Kiểm tra vai trò |
| `isPmOrAdmin(projectId)` | `boolean isPmOrAdmin(Long projectId)` | Kiểm tra vai trò `PM` |
| `canManageCustomFields(projectId)` | `boolean canManageCustomFields(Long projectId)` | PM hoặc permission đặc biệt |
| `assertProjectWritable(Long)` | `void assertProjectWritable(Long projectId)` | Ném nếu `CLOSED` |
| `assertProjectWritable(Project)` | `void assertProjectWritable(Project project)` | Overload nhận entity |

**→ Kết luận:** Hàm `isPmOrAdmin` chỉ kiểm tra vai trò `PM`, **không** kiểm tra `ADMIN` hệ thống. Approval cần bean mới `ApprovalSecurity` (allowlist cho phép qua CLAUDE.md §4: "thiếu hàm phù hợp thì viết bean mới `ApprovalSecurity`").

**`AuthUserPrincipal`:** `getId()` → `Long`, `getEmail()` → `String`, `getUsername()` → email.

---

## 9. SecurityConfig — route mới có tự được xác thực không

**File:** `backend/src/main/java/com/pms/backend/security/SecurityConfig.java`

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
    .requestMatchers("/api/auth/**", "/auth/**").permitAll()
    .requestMatchers("/api/health", "/health", "/actuator/health").permitAll()
    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
    .anyRequest().authenticated()
)
```

**→ Kết luận:** Rule cuối `.anyRequest().authenticated()` bao phủ mọi route chưa khai báo. Các endpoint `/api/approval-requests/**` và `/api/projects/{id}/approval-requests/**` **tự động yêu cầu authentication** mà không cần sửa SecurityConfig.

---

## 10. InvitationExpiryJob

**File:** `backend/src/main/java/com/pms/backend/job/InvitationExpiryJob.java`

```java
@Component
public class InvitationExpiryJob {
    @Scheduled(cron = "${app.job.invitation-expiry-cron:0 0 2 * * ?}")
    @Transactional
    public void cleanupExpiredInvitations() { ... }
}
```

**→ Kết luận:** Job tự quản, dùng `InvitationRepository` trực tiếp, cron cấu hình qua `AppProperties`. Không có điểm nào cần hook vào Camunda, và CLAUDE.md cấm chạm vào file này.

---

## 11. Flyway — số migration lớn nhất

```
V1__init.sql
V2__...
V3__...
V4__...
V5__notifications.sql
V6__issues_labels.sql
V7__links_attachments_history.sql
V8__comments_worklogs.sql
V9__watchers_recent_views.sql
R__01_seed_dev_data.sql  (repeatable, không tính)
```

**→ Migration tiếp theo của Camunda phải đặt tên `V10__approval_tables.sql`.**

---

## 12. Frontend — Router và điều hướng

### 12.1 "Router" — không dùng React Router

Frontend dùng **state-based routing** tùy chỉnh. Không có thư viện React Router.

| File | Vai trò |
|---|---|
| `frontend/src/types/index.ts:10` | `type Screen = \| 'board' \| 'issues' \| ...` — danh sách màn hình |
| `frontend/src/App.tsx` | `renderScreen()` switch quyết định component nào render |
| `frontend/src/components/layout/Sidebar.tsx` | `NAV_ITEMS` và `SETTINGS_NAV` → menu điều hướng |

**Danh sách `Screen` hiện có:**
```typescript
type Screen = 'board' | 'issues' | 'saved-filters' | 'reports' | 'profile'
            | 'notifications' | 'projects' | 'project-settings' | 'custom-fields'
            | 'members-roles' | 'workflow' | 'dashboard' | 'invitations' | 'issue-detail';
```

**→ Cho Phase 5:** Allowlist #4 "Router frontend" ánh xạ đến:  
1. `frontend/src/types/index.ts` — thêm `'approvals'` vào union type `Screen`  
2. `frontend/src/App.tsx` — thêm `case 'approvals':` vào `renderScreen()`  

Allowlist #5 "Sidebar / AppShell" ánh xạ đến:  
- `frontend/src/components/layout/Sidebar.tsx` — thêm 1 item vào `NAV_ITEMS`

> ⚠️ **Điểm cần hỏi người dùng:** `types/index.ts` và `App.tsx` không được liệt kê tên cụ thể trong allowlist. Chúng là "Router frontend" trong dự án này. Xác nhận được phép sửa hai file này ở Phase 5?

### 12.2 Sidebar

**File:** `frontend/src/components/layout/Sidebar.tsx`

```typescript
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'board', label: 'Bảng công việc', icon: KanbanSquare },
  { id: 'issues', label: 'Danh sách công việc', icon: ListTodo },
  { id: 'saved-filters', label: 'Bộ lọc đã lưu', icon: Bookmark },
  { id: 'reports', label: 'Báo cáo', icon: BarChart3 },
  { id: 'invitations', label: 'Lời mời dự án', icon: Mail },
];
const SETTINGS_NAV = [
  { id: 'members-roles', ... },
  { id: 'workflow', ... },
  { id: 'custom-fields', ... },
  { id: 'project-settings', ... },
];
```

**→ Cho Phase 5:** Thêm 1 mục `ApprovalNavItem` vào `NAV_ITEMS` (hoặc render điều kiện khi `policy.enabled`).

### 12.3 messages.ts

**File:** `frontend/src/constants/messages.ts`

Các nhóm chuỗi hiện có (cuối file): `COMMENT`, `WORKLOG`, `FILTER`, `SEARCH`, `DASHBOARD`.  
**→ Allowlist #6:** append khối `APPROVAL` vào cuối.

### 12.4 enums.ts

**File:** `frontend/src/constants/enums.ts`

Các enum/const hiện có: `ProjectRole`, `IssueType`, `Priority`, `IssueStatus`, `StatusCategory`, `NotificationGroup`, `QuickFilter`, `ExportFormat`, `ISSUE_TYPE_OPTIONS`, `PRIORITY_OPTIONS`, `QUICK_FILTER_OPTIONS`.  
**→ Allowlist #6:** append enum `ApprovalRequestType`, `ApprovalRequestStatus`, v.v.

### 12.5 axiosClient

**File:** `frontend/src/api/axiosClient.ts`

- Base URL từ `VITE_API_BASE_URL` (mặc định `/api`)
- Auto-refresh 401 một lần, hàng đợi request
- Response interceptor trả `response.data` trực tiếp (không cần unwrap `.data` ở service)
- Dispatch event `epms:auth-unauthorized` khi refresh thất bại

**→ Dùng thẳng** `axiosClient` trong `approvalService.ts` mới, không cần cấu hình gì thêm.

### 12.6 Cấu trúc feature mẫu — `features/notifications`

```
frontend/src/features/notifications/
├── NotificationBell.tsx
├── NotificationCenter.tsx
├── NotificationDropdown.tsx
├── NotificationItem.tsx
└── index.ts
```

Không có thư mục con `components/`, `pages/`, `services/` trong notifications — cấu trúc phẳng.  
So sánh với `features/issues/` (có `components/` và `pages/`).

**→ Feature `approvals` nên theo cấu trúc** `src/features/approvals/` với `pages/` và `components/` nếu có nhiều component.

---

## 13. Các điểm chạm hiện có → cách xử lý (task 0.3)

| Điểm chạm | File/vị trí hiện có | Cách xử lý đề xuất | Loại |
|---|---|---|---|
| Chặn `POST /projects/{id}/close` khi chính sách bật | `ProjectController.java:83` | `ApprovalPolicyInterceptor` + `WebMvcConfigurer` **mới** khớp path pattern | File mới |
| Chặn `PUT /projects/{projectId}/workflow` khi chính sách bật | `WorkflowController.java:27` | Cùng interceptor trên | File mới |
| Gọi `closeProject()` sau khi duyệt xong | `ProjectServiceImpl.closeProject(Long)` | Worker `ApplyChangeWorker` gọi `projectService.closeProject()` trực tiếp; đặt `SecurityContext` trước | File mới (worker) |
| Gọi `updateWorkflow()` sau khi duyệt xong | `WorkflowServiceImpl.updateWorkflow(Long, SaveWorkflowRequest)` | Worker `ApplyChangeWorker` deserialize `payload_json` → `SaveWorkflowRequest`, gọi `workflowService.updateWorkflow()` | File mới (worker) |
| Ghi audit "ai áp dụng thay đổi" | `AuditLogAspect.java` đọc `SecurityContext` | Worker đặt `SecurityContext` trước khi gọi service (xem mục 4) | Không sửa Aspect |
| Thêm `REMINDER` vào `NotificationType` | `enu/NotificationType.java` | Allowlist #3: append hằng mới | **Sửa file allowlist #3** |
| Thêm `APPROVAL_001..006` vào `ErrorCode` | `enu/ErrorCode.java` | Allowlist #2: append hằng mới (nếu `GlobalExceptionHandler` không nhận interface) | **Sửa file allowlist #2** |
| Thêm route `approvals` | `types/index.ts` + `App.tsx` | Allowlist #4: thêm vào union type + thêm case renderScreen | **Sửa file (câu hỏi #1)** |
| Thêm mục sidebar | `Sidebar.tsx` | Allowlist #5: 1 mục `ApprovalNavItem` | **Sửa file allowlist #5** |
| Chuỗi tiếng Việt mới | `messages.ts`, `enums.ts` | Allowlist #6: append | **Sửa file allowlist #6** |
| Thêm Camunda dependency | `backend/pom.xml` | Allowlist #1: thêm dependency | **Sửa file allowlist #1** |

---

## 14. Câu hỏi cho người dùng

**Q1 (Allowlist #2 — ErrorCode):** Đã xác minh: `BusinessException(ErrorCode, String)` nhận **đúng kiểu `ErrorCode` enum**, không nhận interface. `GlobalExceptionHandler` cũng gọi `ex.getErrorCode().getStatus()`. Không có cách tạo enum mới riêng mà không sửa cả `BusinessException.java` lẫn `GlobalExceptionHandler.java` (đều ngoài allowlist). **Kết luận bắt buộc: append `APPROVAL_001..006` vào `ErrorCode.java`** (allowlist #2). Không cần hỏi thêm.

**Q2 (Allowlist #4 — Router):** "Router frontend" trong repo này là `types/index.ts` (Screen union) + `App.tsx` (renderScreen switch), không phải React Router. Hai file này không được liệt kê tên cụ thể trong allowlist. Xác nhận được phép sửa cả hai để thêm màn hình `approvals`?

**Q3 (.gitignore — secrets):** `application-camunda.yml` và `docker-compose.camunda.yml` chưa có trong `.gitignore`. `application-camunda.yml` sẽ chứa template biến môi trường (không phải giá trị thật). Có muốn thêm cả hai vào `.gitignore` không (cần sửa `.gitignore`, file hiện có nằm ngoài allowlist)?

---

## 15. Tóm tắt rủi ro khi tích hợp

| Rủi ro | Mức | Biện pháp |
|---|---|---|
| Engine Camunda không khởi động → app chết | Cao | `@ConditionalOnProperty`, `NoOpProcessEngineClient` mặc định |
| Start process trước commit DB | Cao | `@TransactionalEventListener(AFTER_COMMIT)` |
| Worker audit ghi sai người dùng | Trung bình | Đặt `SecurityContext` trong worker, dọn sau |
| Trùng reminder gửi nhiều lần | Trung bình | Bảng `reminder_log` với UNIQUE(type, ref_id, sent_on) |
| `WORKFLOW_CONFIG_CHANGE` payload không hợp lệ | Trung bình | Validate bằng Bean Validation ngay khi tạo yêu cầu |
| Engine thêm bảng vào DB hiện có (nếu dùng embedded) | Cao | Dùng riêng schema/DB cho engine — xem ADR |
