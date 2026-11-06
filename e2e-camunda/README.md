# Bộ kiểm thử End-to-End (E2E) Puppeteer — Camunda / Flowable Integration

Thư mục này chứa bộ kiểm thử tự động End-to-End bằng Puppeteer cho các tính năng phê duyệt nhiều cấp và tích hợp quy trình nghiệp vụ BPMN trong EPMS.

---

## 1. Yêu cầu Môi trường

- **Node.js:** Phiên bản 20+ hoặc 24+ (sử dụng Node test runner hoặc module ES tiêu chuẩn).
- **Trình duyệt Chrome:** Cài đặt sẵn trên máy (mặc định trỏ tới `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` trên macOS, hoặc tải tự động qua Puppeteer).
- **Cơ sở dữ liệu:**
  - PostgreSQL chính (port `5432` hoặc Neon DB) cho dữ liệu nghiệp vụ PMS.
  - PostgreSQL phụ (port `5433`, service `epms-flowable-postgres`) cho Flowable Engine khi chạy profile `camunda`.
- **Dịch vụ Email giả lập (MailHog):** Port `1025` (SMTP), port `8025` (Web UI/API).

---

## 2. Hướng dẫn Khởi động Hệ thống trước khi chạy Test

### Chế độ A: Cờ BẬT (Chạy Suite A — Phê duyệt 2 cấp & BPMN)

1. **Khởi động Flowable Database:**
   ```bash
   docker compose -f docker-compose.camunda.yml up -d
   ```

2. **Khởi động Backend với profile `dev,camunda` và kích hoạt Policy duyệt:**
   ```bash
   cd backend
   mvn spring-boot:run \
     -Dspring-boot.run.profiles=dev,camunda \
     -Dspring-boot.run.arguments="--approval.project-close-enabled=true --approval.workflow-change-enabled=true"
   ```
   *(Backend sẽ lắng nghe tại `http://localhost:8080`)*

3. **Khởi động Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   *(Frontend sẽ chạy tại `http://localhost:5174` hoặc `http://localhost:5173` và tự động proxy các request `/api` sang backend `http://localhost:8080`)*

---

### Chế độ B: Cờ TẮT (Chạy Suite B — Chế độ nguyên bản không có Engine)

1. **Khởi động Backend chế độ mặc định (không nạp profile camunda):**
   ```bash
   cd backend
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

2. **Khởi động Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

---

## 3. Cài đặt và Chạy Bộ kiểm thử E2E

1. **Cài đặt thư viện kiểm thử:**
   ```bash
   cd e2e-camunda
   npm install
   ```

2. **Chạy kiểm thử tự động (Tự động phát hiện Suite theo trạng thái chính sách thật):**
   ```bash
   cd e2e-camunda
   node run.js
   ```

3. **Chạy ở chế độ xem trực tiếp giao diện trình duyệt (Headed Mode):**
   ```bash
   HEADED=1 node run.js
   ```

4. **Tùy biến URL Backend hoặc Frontend (nếu khác cổng mặc định):**
   ```bash
   FRONTEND_URL=http://localhost:5174 BACKEND_URL=http://localhost:8080 node run.js
   ```

---

## 4. Nơi lưu Ảnh chụp Màn hình (Artifacts)

Tất cả ảnh chụp màn hình kiểm thử thành công và lỗi (nếu có) được lưu tại:
```
e2e-camunda/artifacts/*.png
```
Thư mục này có file `.gitignore` riêng để không commit các file ảnh nhị phân sinh ra trong quá trình chạy test.

---

## 5. Danh mục Kịch bản Kiểm thử

### Suite A (Khi cờ camunda.enabled=true và policy duyệt bật):
- **A1:** Menu "Yêu cầu duyệt" hiển thị trên Sidebar đối với người dùng đã đăng nhập và điều hướng chính xác.
- **A2:** PM1 tạo yêu cầu đóng dự án từ Modal: thiếu lý do bị chặn; tạo hợp lệ thành công; tạo lần 2 cùng loại báo lỗi trùng `APPROVAL_001`.
- **A3:** PM1 (người tạo yêu cầu) mở chi tiết: KHÔNG thấy nút Phê duyệt / Từ chối cho yêu cầu của chính mình, thấy nút Hủy.
- **A4:** PM2 thấy yêu cầu ở tab "Chờ tôi duyệt", duyệt Cấp 1; Admin duyệt Cấp 2; yêu cầu đạt `APPROVED`, `APPLIED` và dự án thực sự chuyển sang trạng thái `CLOSED`.
- **A5:** Luồng từ chối: Từ chối bắt buộc nhập lý do (thiếu thì bị chặn); sau khi từ chối, PM1 thấy trạng thái `REJECTED` kèm lý do.
- **A6:** Luồng hủy: PM1 hủy yêu cầu `PENDING` $\rightarrow$ `CANCELLED`; sau đó tạo lại được yêu cầu mới cho dự án.
- **A7:** Trang Cài đặt dự án hiện có: Bấm "Đóng dự án…" trực tiếp bị chặn với mã 422, giao diện hiển thị thông báo tiếng Việt hướng dẫn sang "Yêu cầu duyệt"; dự án không bị đóng.
- **A8:** `WORKFLOW_CONFIG_CHANGE`: Tạo yêu cầu với payload hợp lệ, duyệt đủ 2 cấp, cấu hình Workflow thực tế của dự án được cập nhật; payload không hợp lệ bị từ chối khi tạo.
- **A9:** Thông báo: Người duyệt thấy thông báo yêu cầu duyệt trên chuông; bấm vào chỉ đánh dấu đã đọc và KHÔNG chuyển hướng sang Board.
- **A10:** Phân quyền: Member thường bị chặn tạo yêu cầu (mã 403); người không có quyền duyệt không thấy nút duyệt.

### Suite B (Khi cờ camunda.enabled=false):
- **B1:** Menu "Yêu cầu duyệt" KHÔNG xuất hiện trên Sidebar.
- **B2:** Truy cập trực tiếp URL `/approvals` không làm ứng dụng bị lỗi hay vỡ màn hình trắng.
- **B3:** Đóng dự án qua trang Cài đặt dự án hoạt động trực tiếp như trước (dự án chuyển `CLOSED` ngay lập tức).
