# Hướng dẫn triển khai và vận hành Process Engine (Flowable)

> Tài liệu hướng dẫn thiết lập và triển khai Process Engine theo ADR-001 (Phương án A: Flowable 7.1+ nhúng, datasource riêng).

---

## 1. Kiến trúc tổng quan

- **Engine:** Flowable Process Engine nhúng trực tiếp trong JVM Spring Boot.
- **Datasource:** Tách biệt hoàn toàn (`flowableDataSource`) trỏ đến DB `epms_flowable` (hoặc schema riêng), không can thiệp vào schema chính của PMS.
- **Cờ kích hoạt:** `camunda.enabled=true` (thông qua profile `camunda`).
  - Khi cờ **TẮT** (`false`, mặc định): Không có bean Flowable, không có kết nối cơ sở dữ liệu phụ, ứng dụng dùng `NoOpProcessEngineClient` và hoạt động độc lập không cần engine.
  - Khi cờ **BẬT** (`true`): Spring Boot kích hoạt `CamundaConfig`, kết nối đến DB Flowable, tự deploy các file `.bpmn` trong `resources/bpmn/` và khởi tạo `FlowableProcessEngineClient`.

---

## 2. Thiết lập môi trường Local (Docker)

Để chạy cơ sở dữ liệu riêng cho Flowable ở local:

```bash
docker compose -f docker-compose.camunda.yml up -d
```

Service sẽ khởi động PostgreSQL 16 trên cổng `5433`, cơ sở dữ liệu `epms_flowable`.

Kiểm tra trạng thái container:
```bash
docker compose -f docker-compose.camunda.yml ps
```

---

## 3. Cấu hình biến môi trường

Các biến môi trường được định nghĩa trong `application-camunda.yml`:

| Biến môi trường | Mặc định | Mục đích |
|---|---|---|
| `FLOWABLE_DB_URL` | `jdbc:postgresql://localhost:5433/epms_flowable` | JDBC URL cơ sở dữ liệu Flowable |
| `FLOWABLE_DB_USERNAME` | `postgres` | Tài khoản DB Flowable |
| `FLOWABLE_DB_PASSWORD` | `postgres` | Mật khẩu DB Flowable |
| `APPROVAL_PROJECT_CLOSE_ENABLED` | `false` | Bắt buộc duyệt khi đóng dự án |
| `APPROVAL_WORKFLOW_CHANGE_ENABLED` | `false` | Bắt buộc duyệt khi sửa workflow |

---

## 4. Chạy ứng dụng

### Chế độ mặc định (Camunda / Flowable TẮT)
```bash
# Không cần Docker Flowable, khởi động bình thường
cd backend
mvn spring-boot:run
```

### Chế độ bật Camunda / Flowable
```bash
# 1. Đảm bảo Flowable Postgres đang chạy
docker compose -f docker-compose.camunda.yml up -d

# 2. Khởi động với profile camunda
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=camunda
```

---

## 5. Quản lý Quản trị viên hệ thống (bảng `app_admins`)

Duyệt Cấp 2 yêu cầu người duyệt có vai trò hệ thống `ADMIN` (khác người tạo yêu cầu). Do bảng `users` đã bỏ cột `system_role` ở migration V13, hệ thống sử dụng bảng chuyên biệt `app_admins (user_id PK)` để xác định Admin hệ thống.

### Cách nạp Admin an toàn

1. **Môi trường Dev (Local/Seed):**
   Có thể gán user mẫu `admin@epms.com` (id = 1) làm Admin hệ thống qua script SQL:
   ```sql
   INSERT INTO app_admins (user_id) VALUES (1) ON CONFLICT DO NOTHING;
   ```

2. **Môi trường Production (SIT/UAT/Prod):**
   Không tự động tạo tài khoản Admin qua migration công khai. Người quản trị cơ sở dữ liệu thực thi lệnh SQL trực tiếp để cấp quyền cho user cụ thể:
   ```sql
   INSERT INTO app_admins (user_id) 
   SELECT id FROM users WHERE email = 'admin_that@domain.com'
   ON CONFLICT DO NOTHING;
   ```

### Hành vi khi bảng `app_admins` rỗng (Chưa có Admin)

- **Dự án có nhiều PM:** Cấp 1 (PM khác) ở trạng thái `PENDING`, Cấp 2 (Admin) tự động chuyển sang `SKIPPED`. Yêu cầu duyệt vẫn được tiến hành với 1 cấp.
- **Dự án chỉ có 1 PM (chính người yêu cầu):** Do người yêu cầu không thể tự duyệt (Cấp 1 `SKIPPED`) và không có Admin (Cấp 2 `SKIPPED`), toàn bộ các cấp đều `SKIPPED`. Hệ thống sẽ từ chối tạo yêu cầu và trả về lỗi `400 VALIDATION_ERROR` ("Không có người duyệt hợp lệ cho bất kỳ cấp nào trong yêu cầu này") theo đúng quy tắc nghiệp vụ.

---

## 6. Đánh giá Rủi ro, Chi phí và Tài nguyên khi Triển khai Production

Theo phân tích chi tiết trong `ADR-engine.md`:

1. **Chi phí Bản quyền (License):** 0 USD. Flowable Core được phát hành theo giấy phép Apache 2.0 nguồn mở hoàn toàn, không có rủi ro bản quyền như Camunda 8 (Zeebe Source Available) hoặc Camunda 7 (ngừng bảo trì phiên bản cộng đồng).
2. **Chi phí Hạ tầng & Bộ nhớ (Compute & RAM):**
   - Engine nhúng trực tiếp trong JVM Spring Boot, chỉ tiêu tốn thêm khoảng ~100MB RAM khi kích hoạt async executor.
   - Cơ sở dữ liệu phụ `epms_flowable` có thể dùng chung cụm PostgreSQL với database chính (khác database/schema) để tối ưu chi phí, hoặc tách biệt thành 1 database instance nhỏ (chi phí ~5–15 USD/tháng trên Render/Neon/AWS RDS).
3. **Rủi ro Vận hành & Phục hồi:**
   - Database chính của PMS luôn là **nguồn sự thật** (`source of truth`) cho trạng thái nghiệp vụ.
   - Nếu Flowable database gặp sự cố, `ApprovalReconciliationJob` sẽ tự động quét và phục hồi các tiến trình BPMN bị gián đoạn ngay sau khi DB hoạt động trở lại.
   - Các API cốt lõi của PMS (quản lý issue, sprint, thành viên) hoàn toàn không bị ảnh hưởng nếu Flowable gặp sự cố.

