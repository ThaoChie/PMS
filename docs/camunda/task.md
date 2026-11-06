# TASK — Tích hợp Camunda vào EPMS (chỉ thêm, không sửa code hiện có)

> Đặt file này ở `docs/camunda/task.md` (không ghi đè `task.md` cũ của EPMS).
> Đọc trước: `CLAUDE.md` (luật, allowlist), skill `camunda-integration` (cách làm).
> Trạng thái nền: Sprint 1-3 đã xong, Sprint 4 đang chạy (báo cáo, test, triển khai). **Không đụng vào những phần đó.**

## 0. Phạm vi

**Làm (TRONG):**
1. **Duyệt nhiều cấp** cho 2 loại yêu cầu: `PROJECT_CLOSE` (đóng dự án), `WORKFLOW_CONFIG_CHANGE` (đổi cấu hình Workflow).
2. **Nhắc việc / escalate:** (a) yêu cầu duyệt bị treo quá hạn; (b) Issue sắp đến hạn, chạy theo lịch hằng ngày.

**Không làm (NGOÀI), kể cả khi thấy "tiện tay":**
- Workflow trạng thái Issue, bước APPROVE/REJECT của Issue (đã có, giữ nguyên).
- **Timer hết hạn lời mời.** `InvitationExpiryJob` đã chạy đúng SRS. Đưa vào Camunda buộc phải sửa `InvitationService`/job hiện có, vi phạm nguyên tắc "chỉ thêm". Chỉ làm nếu người dùng yêu cầu bằng văn bản và duyệt từng điểm chạm.
- `NotificationCleanupJob`, sort cho search, xóa file deprecated, E2E, code-splitting: việc tồn đọng khác, không thuộc task này.

## 1. Quy tắc nghiệp vụ của duyệt nhiều cấp

| Mục | Quy tắc |
|---|---|
| Ai tạo yêu cầu | PM của dự án đó |
| Cấp 1 | Một PM **khác** của dự án (bất kỳ ai trong số đó duyệt được) |
| Cấp 2 | Một người có vai trò hệ thống `ADMIN`, **không phải** người yêu cầu |
| Người yêu cầu | Không được tự duyệt bất kỳ cấp nào |
| Cấp không có người hợp lệ | Đánh dấu `SKIPPED` |
| Mọi cấp đều không có người duyệt | **Từ chối tạo yêu cầu** (400), không tự động duyệt |
| Trùng yêu cầu | Mỗi (dự án, loại) chỉ có 1 yêu cầu `PENDING` tại một thời điểm (`APPROVAL_001`) |
| Reject | Bắt buộc có `comment`; kết thúc cả yêu cầu, không áp dụng thay đổi |
| Hủy | Chỉ người tạo, khi còn `PENDING` |
| `payload` của `WORKFLOW_CONFIG_CHANGE` | Đúng shape request cập nhật Workflow **hiện có** (đọc DTO thật); kiểm tra hợp lệ ngay lúc tạo bằng chính validate hiện có; dự án đã `CLOSED` thì từ chối |
| Quá hạn | Chỉ **nhắc** (mỗi N giờ), **escalate** (báo thêm Admin sau M giờ), **hết hạn yêu cầu** (`EXPIRED` sau K ngày). **Không bao giờ tự duyệt** |
| Áp dụng thay đổi | Sau khi cấp cuối `APPROVED`: gọi hàm công khai có sẵn (đóng dự án / cập nhật Workflow). Thất bại → `apply_status=FAILED`, thông báo người yêu cầu và Admin |
| Chính sách bật/tắt | Toàn cục: `approval.project-close.enabled`, `approval.workflow-change.enabled` (mặc định `false`). Khi bật, gọi trực tiếp đóng dự án/đổi Workflow qua API cũ bị chặn với `APPROVAL_005` |

Cấu hình (trong `application-camunda.yml`, đọc qua `@ConfigurationProperties` mới): `reminder-after-hours` (mặc định 24), `escalate-after-hours` (72), `expire-after-days` (14), `due-date-reminder-cron`, `due-date-reminder-hours-before`.

## 2. Đặc tả API (module mới)

Dùng **đúng khung phản hồi và tiền tố URL của dự án hiện có** (`ApiResponse`, `PageWrapper`; đọc code để khớp tên field). Nếu khác với bản đặc tả này, theo code và ghi chênh lệch vào `docs/camunda/API_DEVIATIONS.md`.

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| GET | `/approval-requests/policy` | Đã đăng nhập | `{ enabled, closeRequiresApproval, workflowChangeRequiresApproval }`. **Luôn có mặt** kể cả khi cờ tắt (trả `enabled:false`) |
| POST | `/projects/{projectId}/approval-requests` | PM dự án | Tạo yêu cầu |
| GET | `/projects/{projectId}/approval-requests` | Thành viên dự án | Danh sách, lọc `status`, `type`, phân trang |
| GET | `/approval-requests/pending-for-me` | Đã đăng nhập | Yêu cầu đang chờ **tôi** duyệt ở cấp hiện tại |
| GET | `/approval-requests/{id}` | Thành viên dự án | Chi tiết kèm các cấp |
| PUT | `/approval-requests/{id}/approve` | Người duyệt đúng cấp | Body `{ comment? }` |
| PUT | `/approval-requests/{id}/reject` | Người duyệt đúng cấp | Body `{ comment }` (bắt buộc) |
| PUT | `/approval-requests/{id}/cancel` | Người tạo | Khi còn `PENDING` |

Trừ `/policy`, các endpoint trên chỉ tồn tại khi `camunda.enabled=true` (cờ tắt → 404).

**Request tạo:** `{ "type": "PROJECT_CLOSE" | "WORKFLOW_CONFIG_CHANGE", "reason": string(1-1000), "payload": object|null }`

**Response `ApprovalRequestResponse`:**
```ts
{
  id: string; type: "PROJECT_CLOSE"|"WORKFLOW_CONFIG_CHANGE";
  status: "PENDING"|"APPROVED"|"REJECTED"|"CANCELLED"|"EXPIRED";
  applyStatus: "NOT_APPLIED"|"APPLIED"|"FAILED";
  project: { id; key; name }; requester: UserSummary; reason: string; payload: object|null;
  steps: { level: number; approverRole: "PM"|"ADMIN";
           status: "WAITING"|"PENDING"|"APPROVED"|"REJECTED"|"SKIPPED";
           decidedBy: UserSummary|null; comment: string|null; decidedAt: string|null }[];
  currentLevel: number|null; canIDecide: boolean;
  createdAt: string; completedAt: string|null;
}
```

**Mã lỗi (thêm vào hệ mã lỗi hiện có):**

| Mã | HTTP | Ý nghĩa |
|---|---|---|
| `APPROVAL_001` | 409 | Đã có yêu cầu cùng loại đang `PENDING` cho dự án |
| `APPROVAL_002` | 422 | Yêu cầu không còn `PENDING` |
| `APPROVAL_003` | 403 | Không phải người duyệt ở cấp hiện tại, hoặc tự duyệt yêu cầu của mình |
| `APPROVAL_004` | 400 | Reject thiếu `comment` |
| `APPROVAL_005` | 422 | Thao tác này bắt buộc qua yêu cầu duyệt (thông điệp tiếng Việt chỉ rõ vào trang "Yêu cầu duyệt") |
| `APPROVAL_006` | 503 | Dịch vụ điều phối tạm thời không khả dụng, thử lại |

**Thông báo phát sinh** (qua `NotificationService` hiện có): tạo yêu cầu/chuyển cấp → người duyệt; duyệt xong/từ chối/hủy/hết hạn/áp dụng lỗi → người tạo; nhắc/escalate → người duyệt (+ Admin). Dùng loại thông báo hiện có phù hợp, chỉ thêm `REMINDER` nếu thật sự không có (allowlist #3).

## 3. Cơ sở dữ liệu (migration MỚI, số = lớn nhất hiện có + 1; theo phong cách migration cũ)

- `approval_requests`: id, project_id, type, status, apply_status, apply_error, requester_id, reason, payload_json (jsonb), process_instance_key (null được), completed_at + các cột audit theo `BaseEntity`.
- `approval_steps`: id, request_id, level, approver_role, status, decided_by, comment, decided_at, reminder_count.
- `reminder_log`: id, type, ref_id, sent_on (date), `UNIQUE(type, ref_id, sent_on)`, để chống gửi nhắc lặp.
- Chỉ mục: `(project_id, type, status)`, `(request_id, level)`.
- Nếu cột loại thông báo có ràng buộc CHECK và cần thêm `REMINDER`: thêm migration mới điều chỉnh ràng buộc.

---

## PHASE 0 — Khảo sát (chỉ đọc) và quyết định công nghệ  ⛔ CỔNG DUYỆT

Không viết code. Chỉ tạo tài liệu mới trong `docs/camunda/`.

- [ ] 0.1 Khảo sát code, ghi `docs/camunda/SURVEY.md` với **đường dẫn thật** của: các package `com.pms.backend.*`; `ProjectService`/`WorkflowService` (chữ ký hàm đóng dự án và cập nhật Workflow, có kiểm tra quyền ở service hay chỉ ở controller); `AuditLogAspect` (lấy người thực hiện từ đâu); `NotificationService`, `NotificationType` (giá trị hiện có, kiểu lưu DB, có CHECK không); `ErrorCode`, `PageWrapper`, `ApiResponse`; `ProjectSecurity` (các hàm sẵn có); `SecurityConfig` (route mới có tự được xác thực không); `InvitationExpiryJob`; Flyway: số migration lớn nhất; router/sidebar/`AppShell`, `messages.ts`, `enums.ts`, `axiosClient`, cấu trúc một feature mẫu (`features/notifications`).
- [ ] 0.2 Kiểm tra `.gitignore`: `docker-compose.camunda.yml` và `application-camunda.yml` có bị ignore không (`git check-ignore -v`). Bị ignore thì **hỏi**, không tự sửa `.gitignore`.
- [ ] 0.3 Xác định đường đi cho **mọi** điểm chạm hiện có, ưu tiên theo thứ tự: file mới → AOP/Interceptor/Scheduler mới → allowlist → hỏi. Ghi bảng "điểm chạm → cách xử lý" vào SURVEY.
- [ ] 0.4 Nghiên cứu **tài liệu chính thức** (WebSearch/WebFetch) về Camunda ở phiên bản hiện hành: (a) điều kiện **license** khi chạy production tự host; (b) yêu cầu hạ tầng (engine, lưu trữ/tìm kiếm đi kèm, RAM); (c) client Java hiện hành và **tương thích Spring Boot 3.2.0**; (d) cách chạy local bằng Docker. **Không khẳng định từ trí nhớ**; trích nguồn và ngày.
- [ ] 0.5 Viết `docs/camunda/ADR-engine.md`: các phương án (VD Camunda 8 + client Java thuần; Camunda 8 + starter; engine nhúng như Operaton/Flowable), ưu nhược, ảnh hưởng tới DB hiện có (engine nhúng sẽ thêm nhiều bảng vào Postgres), chi phí vận hành, **khuyến nghị**. Mặc định ưu tiên phương án **không tự cấu hình, không chạm DB hiện có**.
- [ ] **CỔNG:** dừng, báo cáo, chờ người dùng duyệt SURVEY và ADR.

## PHASE 1 — Nền tảng (sau khi được duyệt)

- [ ] 1.1 Nhánh `feature/camunda-integration` từ `main`.
- [ ] 1.2 `pom.xml` (allowlist #1): thêm dependency Camunda theo ADR. Kiểm tra: `mvn clean test` và app khởi động **khi không có engine** (cờ tắt).
- [ ] 1.3 `application-camunda.yml` (mới): `camunda.enabled=true`, địa chỉ/xác thực qua biến môi trường, `approval.*`, thời gian nhắc. Không sửa `application.yml`.
- [ ] 1.4 `config`: `CamundaProperties`, `ApprovalProperties`, `CamundaConfig` (bean chỉ tạo khi `camunda.enabled=true`, tự deploy file `.bpmn` ở `resources/bpmn/`).
- [ ] 1.5 `Wrapper`: interface `ProcessEngineClient` (start, publish message, cancel, health) + bản thật + `NoOpProcessEngineClient` (mặc định khi cờ tắt).
- [ ] 1.6 `docker-compose.camunda.yml` (mới, dùng riêng): engine + thành phần đi kèm theo ADR, kèm hướng dẫn chạy trong `docs/camunda/DEPLOY.md`. Không sửa compose khác.
- [ ] 1.7 Kiểm tra cờ tắt: không có kết nối nào tới engine, 17 test cũ vẫn xanh (hoặc nêu rõ nếu chưa chạy được).
- [ ] Báo cáo Phase 1.

## PHASE 2 — Backend duyệt nhiều cấp (chưa cần engine thật; dùng mock `Wrapper`)

- [ ] 2.1 Migration mới (mục 3).
- [ ] 2.2 `enu`: `ApprovalRequestType`, `ApprovalRequestStatus`, `ApprovalStepStatus`, `ApprovalApplyStatus`, `ApprovalApproverRole`.
- [ ] 2.3 `model`: `ApprovalRequest`, `ApprovalStep` (kế thừa `BaseEntity`). `dto` + `mapper` theo đặc tả mục 2. `dao` + `hibernateDao` (mới, kế thừa `BaseHibernateDao`) cho truy vấn danh sách/pending-for-me, đã gắn điều kiện theo phạm vi người dùng.
- [x] 2.4 Mã lỗi `APPROVAL_001..006` (đã thêm vào ErrorCode hiện có theo ngoại lệ đổi ';' thành ',' được người dùng duyệt).
- [ ] 2.5 `service` `ApprovalRequestService`: tạo (kiểm tra quyền PM, trùng, payload hợp lệ, tính cấp và `SKIPPED`), approve, reject (bắt buộc `comment`), cancel, danh sách, pending-for-me, `canIDecide`; **ghi DB trước, publish message sau khi commit**; lỗi publish → `APPROVAL_006` nhưng DB giữ nguyên.
- [ ] 2.6 `ApprovalApplyService`: áp dụng thay đổi sau khi duyệt xong, idempotent, đặt `SecurityContext` bằng người duyệt cuối/`SYSTEM`, gọi hàm công khai sẵn có, cập nhật `apply_status`.
- [ ] 2.7 `controller` `ApprovalRequestController` (có điều kiện theo cờ) + `ApprovalPolicyController` (luôn có). `@PreAuthorize` dùng `@projectSecurity`; thiếu thì tạo `ApprovalSecurity` mới.
- [ ] 2.8 `ApprovalPolicyInterceptor` + `WebMvcConfigurer` mới: khi cờ và chính sách bật, chặn đúng 2 route đóng dự án / cập nhật Workflow với `APPROVAL_005`; route khác không bị ảnh hưởng.
- [ ] 2.9 Thông báo qua `NotificationService`; email (nếu loại này đang gửi email) đi theo cơ chế hiện có, **không** gửi từ Camunda.
- [ ] 2.10 Unit test (mock `Wrapper`) theo skill mục D. Báo cáo Phase 2, **chốt hợp đồng API** để Frontend bắt đầu.

## PHASE 3 — BPMN và Worker

- [x] 3.1 `resources/bpmn/approval-request.bpmn`: chờ quyết định từng cấp bằng Message Catch Event; boundary timer nhắc/escalate (không ngắt) và hết hạn (ngắt); nhánh APPROVED/REJECTED/CANCELLED; cuối cùng service task `apply-change`.
- [x] 3.2 Delegate (package `delegate` mới): `notify-reminder`, `escalate`, `expire-request`, `apply-change`. Mọi delegate: idempotent, chỉ gọi `service`, không bao giờ tự duyệt.
- [x] 3.3 Wrapper thật (`CamundaProcessEngineClient`): start process sau commit, trigger message decision, cancel khi hủy/hết hạn; lưu `process_instance_key`; job đối soát `ApprovalReconciliationJob`.
- [x] 3.4 Test BPMN hợp lệ + test tích hợp engine Flowable H2 (`ApprovalProcessEngineIntegrationTest`): duyệt đủ cấp, reject, hết hạn bằng timer, job đối soát (105/105 tests pass).
- [x] Báo cáo Phase 3.

## PHASE 4 — Nhắc Issue sắp đến hạn (chạy theo lịch)

- [x] 4.1 `resources/bpmn/due-date-reminder.bpmn`: Timer Start theo cron cấu hình (`0 0 8 * * ?`) → delegate `scanDueIssuesDelegate`.
- [x] 4.2 DAO mới (read-only `DueIssueReminderRepository`) tìm Issue chưa Done có `dueDate` trong N giờ tới; gửi cho Assignee qua `NotificationService`; chống lặp bằng `reminder_log` (`ReminderLogRepository`). **Không sửa dữ liệu Issue**.
- [x] 4.3 Test (`DueDateReminderTest`): không gửi lặp trong cùng ngày, bỏ qua Issue đã Done/không có Assignee, không đổi trạng thái Issue.
- [x] Báo cáo Phase 4.

## PHASE 5 — Frontend (có thể chạy song song từ sau Phase 2, dùng mock theo đặc tả)

Tất cả trong `src/features/approvals/` (mới). Chỉ sửa 3 chỗ trong allowlist #4-#6.

- [ ] 5.1 `approvalService.ts` (dùng `axiosClient`), `approvalStore.ts` (Zustand), kiểu dữ liệu, `useApprovalPolicy` (gọi `/approval-requests/policy`, lỗi/404 thì coi là tắt).
- [ ] 5.2 Màn **Yêu cầu duyệt**: tab "Chờ tôi duyệt" và "Yêu cầu của tôi"; lọc theo trạng thái/loại; phân trang.
- [ ] 5.3 Chi tiết yêu cầu: timeline các cấp, `applyStatus`, nút Approve / Reject (Reject bắt buộc nhập lý do) / Hủy, hiển thị theo `canIDecide` và vai trò.
- [ ] 5.4 Modal **Gửi yêu cầu duyệt** (chọn loại, lý do, với Workflow thì nhập/dán `payload` đã kiểm tra hợp lệ) đặt trong trang mới, **không** thêm nút vào trang cài đặt dự án/Workflow hiện có. Khi người dùng bấm "Đóng dự án" cũ và nhận `APPROVAL_005`, thông báo của server (tiếng Việt) hướng dẫn họ sang trang này.
- [ ] 5.5 `ApprovalNavItem` (component mới, chỉ hiện khi policy `enabled`) + 1 dòng render trong sidebar (allowlist #5); route (allowlist #4): `/approvals`, `/projects/:id/approvals`.
- [ ] 5.6 Chuỗi tiếng Việt: append khối `APPROVAL` vào `messages.ts` (allowlist #6). Loading (Skeleton/Spinner), Toast kết quả, thông báo lỗi tiếng Việt.
- [ ] 5.7 Vitest cho store và hàm tiện ích; `npx tsc --noEmit`, `npx vitest run`, `npm run build` đều sạch.
- [ ] Báo cáo Phase 5.

## PHASE 6 — Kiểm toán, tài liệu, bàn giao

- [ ] 6.1 **Kiểm toán additive-only:** chạy `git diff --name-status <gốc>...HEAD | grep -v '^A'`; mọi file `M` phải thuộc allowlist và chỉ có dòng thêm. Dán kết quả vào báo cáo.
- [ ] 6.2 **Cờ tắt:** khởi động ứng dụng không engine; thử đóng dự án và đổi Workflow qua API cũ vẫn chạy như trước; `/approval-requests/policy` trả `enabled:false`; endpoint duyệt 404; sidebar không hiện mục mới.
- [ ] 6.3 **Cờ bật:** chạy `docker-compose.camunda.yml`, bật profile; chạy trọn luồng thủ công: tạo yêu cầu → cấp 1 duyệt → cấp 2 duyệt → dự án `CLOSED`; một luồng reject; một luồng nhắc.
- [ ] 6.4 `mvn clean test`, `npx tsc --noEmit`, `npx vitest run`, `npm run build`: ghi kết quả **thật**; cái nào không chạy được thì nêu rõ.
- [ ] 6.5 Tài liệu `docs/camunda/`: README (cách bật/tắt, biến môi trường, cách chạy local), sơ đồ 2 quy trình, bảng biến process, `DEPLOY.md` (chưa deploy production: ghi rõ chi phí/rủi ro đã nêu ở ADR), `API_DEVIATIONS.md` (nếu có).
- [ ] 6.6 Báo cáo tổng kết: danh sách file mới, file hiện có đã sửa (allowlist), việc chưa làm, rủi ro còn lại, các việc ngoài phạm vi đã thấy (không sửa).

## Definition of Done

- [ ] Mọi file hiện có không thuộc allowlist **không đổi**; file thuộc allowlist chỉ có dòng thêm.
- [ ] Cờ tắt: hành vi hệ thống và test cũ không đổi, không cần engine.
- [ ] Cờ bật: duyệt đủ cấp, reject, hủy, hết hạn, nhắc, escalate hoạt động; không có đường nào tự duyệt hoặc đổi trạng thái Issue.
- [ ] Phân quyền đúng; audit ghi đúng người thực hiện kể cả khi do worker áp dụng.
- [ ] Không bí mật trong git; không file bị `.gitignore` làm mất khỏi bàn giao.
- [ ] Báo cáo trung thực: lệnh nào đã chạy, kết quả thật.
