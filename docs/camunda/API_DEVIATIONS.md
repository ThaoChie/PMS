# Báo cáo Sai lệch và Lưu ý Triển khai API (API Deviations & Notes)

Tài liệu này ghi nhận các điểm lưu ý kỹ thuật, ngoại lệ và quyết định kiến trúc giữa tài liệu thiết kế ban đầu và mã nguồn thực tế triển khai trong module Tích hợp Quy trình (Camunda/Flowable).

---

## 1. Cơ chế Chặn Thao tác Trực tiếp khi Bật Chính sách Phê duyệt

- **Thiết kế ban đầu:** Dự kiến chặn tại Controller hoặc Service.
- **Thực tế triển khai:** 
  - Tuân thủ nghiêm ngặt nguyên tắc **CHỈ THÊM, KHÔNG SỬA** (`CLAUDE.md` mục 2 & 5.6), không can thiệp vào `ProjectController.java` hay `WorkflowController.java`.
  - Sử dụng [`ApprovalPolicyInterceptor`](file:///Users/thaochie/Documents/PMS/backend/src/main/java/com/pms/backend/config/ApprovalPolicyInterceptor.java) đăng ký qua [`ApprovalWebMvcConfigurer`](file:///Users/thaochie/Documents/PMS/backend/src/main/java/com/pms/backend/config/ApprovalWebMvcConfigurer.java) để chặn trực tiếp các URL `/api/projects/{id}/close`, `/projects/{id}/close`, `/api/projects/{id}/workflow`, `/projects/{id}/workflow`.
  - Trả về mã HTTP `422 Unprocessable Entity` với mã lỗi `APPROVAL_005`: *"Thao tác này bắt buộc phải thực hiện qua yêu cầu duyệt. Vui lòng vào trang Yêu cầu duyệt để gửi yêu cầu"*.
  - Đã loại bỏ hoàn toàn `ApprovalPolicyFilter` để tránh trùng lặp tầng servlet filter.

---

## 2. Lựa chọn Engine Thực tế (Flowable 7.1 thay cho Camunda 7/8)

- **Thiết kế ban đầu:** Đặt tên module là "Camunda Integration".
- **Thực tế triển khai:** 
  - Sau quá trình khảo sát (`SURVEY.md`) và quyết định kiến trúc đã được phê duyệt (`ADR-engine.md`), hệ thống sử dụng **Flowable Core 7.1.0 nhúng** (Embedded Engine) với giấy phép Apache 2.0 thân thiện, hỗ trợ native Spring Boot 3.2.0 và Java 17.
  - Các khái niệm `CamundaConfig`, `application-camunda.yml`, cờ `camunda.enabled` được giữ nguyên tên để nhất quán với tài liệu đặc tả ban đầu.

---

## 3. Quản trị viên Toàn hệ thống và Duyệt Cấp 2 (`app_admins`)

- **Bối cảnh:** Bảng `users` trong hệ thống đã có vai trò `ADMIN`, nhưng một số môi trường có thể có nhiều người dùng admin hoặc cấu hình đặc thù.
- **Thực tế triển khai:**
  - Bảng `app_admins` được tạo từ migration `V19__approval_system.sql`.
  - Môi trường DEV được nạp dữ liệu tự động qua migration lặp lại [`R__02_seed_approval_admins.sql`](file:///Users/thaochie/Documents/PMS/backend/src/main/resources/db/migration/R__02_seed_approval_admins.sql) (liên kết với `admin@epms.com`).
  - Ở tầng Service (`ApprovalRequestServiceImpl.java`), hệ thống kiểm tra người duyệt Cấp 2 phải tồn tại trong `app_admins` **ngay tại thời điểm duyệt**, ngăn chặn trường hợp tài khoản đã bị thu hồi quyền admin sau khi yêu cầu được tạo.

---

## 4. Loại Thông báo cho Quy trình Nhắc việc (Due Date Reminder)

- **Đặc tả:** Gửi thông báo đến Assignee khi Issue sắp đến hạn.
- **Thực tế triển khai:**
  - Delegate `ScanDueIssuesDelegate.java` sử dụng loại `NotificationType.ASSIGNED` sẵn có để gửi thông báo và email nhắc việc, không sửa enum `NotificationType` cũ để giữ nguyên tính toàn vẹn hệ thống.
  - Chống gửi lặp trong ngày thông qua bảng `reminder_log` (`UNIQUE (type, ref_id, sent_on)`).

---

## 5. Định dạng Điều hướng Thông báo Frontend

- **Hiện trạng:** Component [`Topbar.tsx:160-164`](file:///Users/thaochie/Documents/PMS/frontend/src/components/layout/Topbar.tsx#L160-L164) chỉ điều hướng sang `'invitations'` hoặc `'board'`.
- **Thực tế triển khai:**
  - Các thông báo phê duyệt `APPROVAL_REQUESTED` và `APPROVAL_RESULT` từ backend để `data = null` (dẫn tới `sourceId = null`). Nhờ đó, người dùng khi bấm vào thông báo này trên Topbar sẽ **không** bị nhảy nhầm sang Kanban board.
  - Để truy cập màn hình duyệt, người dùng chọn mục **Yêu cầu duyệt** trên thanh điều hướng bên trái (Sidebar).
