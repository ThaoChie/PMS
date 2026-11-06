# CLAUDE.md — EPMS: quy tắc cho phần tích hợp Camunda

> Đặt file này ở **gốc repo**. Nếu repo đã có `CLAUDE.md`, **không ghi đè**: chép nguyên khối này vào cuối file cũ.
> Các tên lớp/file dưới đây lấy từ tài liệu trạng thái dự án (06/11/2026), mình chưa xem code. **Luôn xác minh bằng cách đọc code thật; nếu khác thì theo code.**

## 1. Mục tiêu

Thêm tích hợp Camunda vào EPMS cho **đúng 2 việc** và không làm gì khác:
1. **Duyệt nhiều cấp** (`ApprovalRequest`) cho yêu cầu *đóng dự án* và *đổi cấu hình Workflow*.
2. **Nhắc việc / escalate** bằng thông báo: yêu cầu duyệt bị treo quá hạn, và Issue sắp đến hạn (quy trình chạy theo lịch).

Kế hoạch chi tiết: `docs/camunda/task.md`. Quy trình thao tác chuẩn: skill `camunda-integration`.

## 2. Nguyên tắc bất khả xâm phạm: CHỈ THÊM, KHÔNG SỬA

Phần còn lại của dự án đã hoàn thành và đang chạy. Bạn **không được** thay đổi hành vi của nó.

**Cấm tuyệt đối:**
- Sửa, đổi tên, xóa, format lại, refactor bất kỳ file hiện có ngoài **ALLOWLIST** ở mục 3.
- Sửa/xóa **test hiện có** (17 file test backend, test frontend). Chỉ được thêm test mới.
- Sửa **migration Flyway đã tồn tại**. Chỉ thêm migration mới, số = (số lớn nhất hiện có) + 1.
- Nâng/hạ version Spring Boot, Java hoặc bất kỳ thư viện đang dùng.
- Đụng vào: Workflow trạng thái Issue (`WorkflowService` và transition, bước `APPROVE/REJECT` của Issue), `InvitationExpiryJob`, `AuditLogAspect`, cấu hình security, `docker-compose.prod.yml`, `render.yaml`, `vercel.json`, `application.yml`.
- Dọn các việc tồn đọng ngoài phạm vi (NotificationCleanupJob, sort cho search, xóa 3 file deprecated, code-splitting...). Chỉ ghi nhận trong báo cáo nếu thấy.
- Đưa **trạng thái/transition của Issue** vào Camunda, hoặc để Camunda thay đổi trạng thái Issue dưới mọi hình thức.

**Mọi file khác bắt buộc là file MỚI.** Khi muốn sửa file hiện có không nằm trong allowlist: **dừng lại và hỏi người dùng**, nêu lý do và phương án thay thế (thường là AOP/Interceptor/sự kiện đặt trong file mới).

## 3. ALLOWLIST (các file hiện có được phép sửa, chỉ theo cách thêm)

| # | File (xác minh đường dẫn thật) | Được phép |
|---|---|---|
| 1 | `backend/pom.xml` | Thêm dependency/property của Camunda client. Không đổi version cái khác |
| 2 | Lớp mã lỗi hiện có (`ErrorCode`) | Thêm hằng `APPROVAL_001`…`APPROVAL_006`, chỉ khi **không thể** đặt mã lỗi ở file mới (Chấp nhận ngoại lệ đổi dấu ';' của hằng trước đó thành ',') |
| 3 | Enum `NotificationType` | Thêm `REMINDER`, chỉ khi không có loại phù hợp sẵn. Nếu cột DB có ràng buộc CHECK thì kèm migration mới |
| 4 | Router frontend | Thêm route cho trang Yêu cầu duyệt |
| 5 | Sidebar / `AppShell` | Thêm **1 dòng** render component mới `ApprovalNavItem` |
| 6 | `messages.ts`, `enums.ts` (frontend) | Chỉ **append** khối mới (VD `APPROVAL`) |

Mỗi lần sửa một file trong allowlist: ghi vào báo cáo (file, dòng thêm, lý do). Ngoài danh sách này là vi phạm.

**Kiểm tra bắt buộc trước khi báo xong:**
```bash
git diff --name-status <nhánh-gốc>...HEAD | grep -v '^A'
```
Kết quả chỉ được chứa các file trong allowlist, trạng thái `M`, và `git diff --stat` của chúng phải chỉ có dòng **thêm**. Có dòng xóa/sửa ở file hiện có là lỗi, phải hoàn tác.

## 4. Quy ước hiện có phải tuân theo (đọc code để xác nhận)

**Backend:** Spring Boot 3.2.0, Java 17, PostgreSQL 16 + Flyway, MinIO, MailHog.
- Package `com.pms.backend.*` theo lớp: `common`, `config`, `controller`, `dao`, `dto`, `enu`, `exception`, `hibernateDao`, `mapper`, `model`, `security`, `service`, `Wrapper`.
- Thứ tự lớp cho mỗi tính năng: `enu → model → dto → mapper → dao → hibernateDao → service → controller`.
- Dùng sẵn: `ApiResponse`, `PageWrapper`, `ErrorCode`, `GlobalExceptionHandler`, `BaseEntity` (+ JPA Auditing), `BaseHibernateDao`, `AppProperties`, `NotificationService`, `MailService` (Async), `AuditLogAspect`, `ProjectSecurity`, `IssueSecurity`.
- Phân quyền bằng `@PreAuthorize` ở controller, tái sử dụng `@projectSecurity`/`@issueSecurity`; thiếu hàm phù hợp thì viết bean **mới** `ApprovalSecurity`.
- Controller không chứa logic nghiệp vụ; lỗi nghiệp vụ ném qua exception chuẩn và để `GlobalExceptionHandler` xử lý.

**Frontend:** React 19, TypeScript, Vite, Ant Design v5, Zustand 5, Axios (`axiosClient` có auto-refresh 401), Vitest.
- Mỗi phân hệ nằm trong `src/features/<ten>/`; chuỗi hiển thị tiếng Việt đặt trong `messages.ts`; luôn có trạng thái Loading và Toast kết quả.

## 5. Quy tắc kiến trúc Camunda

1. **Cờ mặc định TẮT:** `camunda.enabled=false`. Bật bằng profile `camunda` (file mới `application-camunda.yml`). Khi tắt: ứng dụng khởi động và chạy **y hệt** như chưa có Camunda, **không** cần server Camunda, **không** thử kết nối.
2. **Không dùng starter tự cấu hình** nếu nó kết nối ngay khi khởi động hoặc không tương thích Spring Boot 3.2.0. Mặc định dùng client Java thuần, tạo bean trong `config` với `@ConditionalOnProperty`, đóng gói trong `Wrapper`. Chốt cuối ở ADR (task.md, Phase 0).
3. **Mọi lệnh gọi Camunda đi qua `Wrapper`** (interface + bản thật + bản `NoOp`). `service` chỉ phụ thuộc interface.
4. **Cơ sở dữ liệu của PMS là nguồn sự thật** về trạng thái yêu cầu duyệt. Camunda chỉ điều phối thứ tự và thời gian (chờ, nhắc, escalate).
5. **Job Worker chỉ gọi `service`**, không gọi `dao`/`hibernateDao` trực tiếp. Gọi hàm công khai có sẵn của `ProjectService`/`WorkflowService` (gọi, **không sửa**). Worker không có người đăng nhập nên phải tự đặt `SecurityContext` bằng người duyệt cuối (hoặc `SYSTEM`) để audit ghi đúng người thực hiện. Đọc `AuditLogAspect` để biết cách lấy người thực hiện.
6. **Chặn gọi trực tiếp khi bật chính sách duyệt** bằng `HandlerInterceptor` đăng ký qua `WebMvcConfigurer` **mới**, không sửa controller cũ.
7. **Idempotent:** worker có thể chạy lại; kiểm tra trạng thái trước khi áp dụng thay đổi.
8. **Bí mật và địa chỉ engine** đọc từ biến môi trường, không hard-code, không commit.
9. **Không dùng Tasklist** cho người duyệt. Người duyệt thao tác qua API/giao diện của PMS; tiến trình chờ bằng *Intermediate Message Catch Event* (hoặc cách tương đương có lý do trong ADR).

## 6. Lệnh kiểm tra

```bash
# Backend (từ thư mục backend)
mvn clean test                 # 17 test cũ phải vẫn xanh khi cờ TẮT
mvn -Pcamunda-it verify        # test tích hợp có engine (nếu đã tạo profile)
# Frontend (từ thư mục frontend)
npx tsc --noEmit && npx vitest run && npm run build
```
Nếu không chạy được (thiếu Maven/Docker...), **nói rõ là chưa chạy**, không viết "xanh" khi chưa chạy.

## 7. Quy trình làm việc

- Nhánh: `feature/camunda-integration` (tách từ `main`). **Không** push/merge vào `main`, **không** force push.
- Commit nhỏ theo task, kiểu conventional như repo (`feat(camunda): …`, `test(camunda): …`, `docs(camunda): …`).
- Làm theo **Phase** trong `docs/camunda/task.md`; hết mỗi Phase dừng lại báo cáo. Phase 0 có **cổng duyệt** (engine, license, tương thích Boot): chưa được người dùng duyệt thì không viết code ở Phase sau.
- **Dừng và hỏi** khi: cần sửa file ngoài allowlist; tài liệu mâu thuẫn code; phiên bản/license chưa rõ; test cũ bị đỏ vì thay đổi của bạn.

## 8. Cách báo cáo cuối mỗi Phase (dưới 250 từ)

Đã làm gì · file mới/migration mới · file hiện có đã sửa (phải thuộc allowlist) · đã chạy lệnh nào, kết quả thật · điều chưa làm được/giả định · câu hỏi cần người dùng quyết.
