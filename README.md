# EPMS — Enterprise Project Management System

Hệ thống Quản lý Dự án Doanh nghiệp (EPMS / PMS) là ứng dụng web quản lý công việc và tiến độ dự án dựa trên đơn vị **Issue** được thiết kế tối ưu hóa cho các đội ngũ phát triển phần mềm trong doanh nghiệp.

---

##  1. Giới thiệu tổng quan về dự án

### 1.1. Mục tiêu
- **Quản lý công việc tập trung:** Thay thế việc quản lý thủ công rời rạc qua email, bảng tính bằng hệ thống quản lý Issue, Task, Bug, Epic và Sub-task trực quan.
- **Quy trình chuẩn hóa (Workflow):** Hỗ trợ vòng đời phát triển dự án với các bước chuyển trạng thái (Transitions), bước duyệt (Approval / Reject) minh bạch.
- **Cộng tác thời gian thực:** Bình luận, trao đổi, `@mention` thành viên, đính kèm tài liệu và ghi nhận thời gian làm việc (Log Work).
- **Minh bạch & Báo cáo:** Cung cấp bảng Kanban, theo dõi tiến độ, báo cáo năng suất, báo cáo lỗi (Bug Report) và lưu các bộ lọc tìm kiếm nâng cao.

### 1.2. Phân quyền người dùng (2 tầng RBAC)
- **Tầng Hệ thống (`system_role`):**
  - `ADMIN`: Quản trị viên toàn hệ thống, toàn quyền quản lý tài khoản và dự án.
  - `PM`: Quản lý dự án, được quyền tạo và quản lý các dự án được giao.
  - `MEMBER`: Thành viên thông thường.
- **Tầng Dự án (`project_role`):**
  - `PM`: Trưởng dự án (quản lý thành viên, cấu hình workflow, phân công công việc).
  - `DEVELOPER`: Lập trình viên (thực hiện task, log work, chuyển trạng thái issue).
  - `QA`: Kiểm thử viên (quản lý và kiểm tra bug, duyệt bước kiểm thử).
  - `MEMBER`: Thành viên tham gia theo dõi và phối hợp.

### 1.3. Kiến trúc kỹ thuật (Tech Stack)

| Thành phần | Công nghệ sử dụng | Chi tiết |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | Quản lý state với Zustand, Icons Lucide, Biểu đồ Recharts, HTTP Client Axios |
| **Backend** | Spring Boot 3.2, Java 17 | Spring Security 6 (JWT), Spring Data JPA (Hibernate 6), Spring AOP (Audit Log) |
| **Database** | PostgreSQL 15 | Quản lý dữ liệu quan hệ, quan hệ đa bảng, cascade & index tối ưu |
| **Storage** | MinIO (Object Storage) | Lưu trữ tệp tin đính kèm (Attachments) |
| **Môi trường & Đóng gói** | Docker, Docker Compose, Nginx | Đóng gói Multi-stage build độc lập, reverse proxy qua Nginx |

---

## 2. Hướng dẫn chạy dự án trên máy Local 

Dự án đã được cấu hình toàn bộ môi trường chạy thông qua **Docker Compose** và **Multi-stage Dockerfile**. 

### 2.1. Yêu cầu tiên quyết (Prerequisites)
1. **Docker Desktop:** Đã cài đặt và đang chạy ([Tải Docker Desktop](https://www.docker.com/products/docker-desktop/)).
   - Đảm bảo biểu tượng Docker ở thanh trạng thái hiển thị trạng thái đang hoạt động (*Docker Desktop is running*).
2. **Visual Studio Code (VS Code):** Đã cài đặt ([Tải VS Code](https://code.visualstudio.com/)).
   - *(Khuyến nghị)* Cài đặt thêm Extension **Docker** (của Microsoft) trên VS Code để theo dõi container và log trực quan.

---

### 2.2. Các bước khởi chạy chi tiết

#### Bước 1: Mở dự án trong VS Code
1. Khởi động VS Code.
2. Chọn menu **File** > **Open Folder...** và chọn thư mục `PMS`.
3. Mở Terminal tích hợp của VS Code bằng tổ hợp phím:
   - **macOS:** `Cmd + \``
   - **Windows / Linux:** `Ctrl + \``
   (Hoặc vào menu **Terminal** > **New Terminal**).

#### Bước 2: Kiểm tra cấu hình Docker Compose
Tệp `docker-compose.yml` ở thư mục gốc đã định nghĩa sẵn 3 dịch vụ chính:
- `db`: PostgreSQL 15 Alpine (Cổng `5432:5432`)
- `backend`: Spring Boot 3 (Cổng `8080:8080`)
- `frontend`: React SPA phục vụ bởi Nginx (Cổng `3000:80`)

*(Tùy chọn)* Nếu muốn chỉnh sửa cấu hình bí mật JWT hay mật khẩu DB, bạn có thể xem trực tiếp tại `docker-compose.yml`.

#### Bước 3: Khởi chạy toàn bộ hệ thống bằng Docker Compose
Tại cửa sổ Terminal của VS Code, gõ lệnh sau để tải image, build source code và khởi chạy các container:

```bash
docker compose up --build -d
```

> **Giải thích lệnh:**
> - `--build`: Tự động kích hoạt build source code cho Backend (bằng Maven container) và Frontend (bằng Node container).
> - `-d` (Detached mode): Chạy ngầm các container dưới nền, giải phóng cửa sổ terminal.

Quá trình build lần đầu tiên có thể mất từ 3–5 phút để tải các thư viện phụ thuộc (Maven dependencies và npm packages).

---

### 2.3. Kiểm tra trạng thái và theo dõi Logs

#### 1. Kiểm tra trạng thái các container
Gõ lệnh:
```bash
docker compose ps
```
Bạn sẽ thấy 3 dịch vụ đều ở trạng thái `running` (hoặc `Up`):
- `pms-db`
- `pms-backend`
- `pms-frontend`

#### 2. Xem logs hệ thống theo thời gian thực
Để theo dõi quá trình khởi động của Spring Boot hoặc Nginx:
```bash
# Xem log của tất cả dịch vụ:
docker compose logs -f

# Hoặc xem riêng từng dịch vụ:
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```
*(Nhấn `Ctrl + C` để thoát màn hình theo dõi logs).*

> **Mẹo trên VS Code:** Nếu bạn đã cài **Docker Extension**, bạn chỉ cần mở tab Docker ở thanh Activity Bar bên trái, click chuột phải vào từng container và chọn **View Logs**.

---

### 2.4. Địa chỉ truy cập các dịch vụ

Sau khi các container đã khởi động hoàn tất:

| Dịch vụ | Địa chỉ truy cập | Ghi chú |
|---|---|---|
| **Giao diện người dùng (Frontend)** | [http://localhost:3000](http://localhost:3000) | Ứng dụng web React |
| **API Backend** | [http://localhost:8080/api/v1](http://localhost:8080/api/v1) | Endpoint RESTful API |
| **Cơ sở dữ liệu (PostgreSQL)** | `localhost:5432` | Tên DB: `pms`<br>Username: `pms_user`<br>Password: `pms_password` |

---

### 2.5. Các thao tác quản lý thường dùng

- **Dừng hệ thống (tạm dừng các container):**
  ```bash
  docker compose stop
  ```

- **Khởi động lại các container đã dừng:**
  ```bash
  docker compose start
  ```

- **Dừng và giải phóng container, mạng nội bộ:**
  ```bash
  docker compose down
  ```

- **Dừng và xóa toàn bộ dữ liệu database (Reset sạch DB):**
  ```bash
  docker compose down -v
  ```

- **Rebuild lại khi có thay đổi trong mã nguồn Backend hoặc Frontend:**
  ```bash
  docker compose up --build -d
  ```

- **Truy cập vào terminal bên trong container (Exec):**
  ```bash
  # Vào container backend:
  docker compose exec backend bash

  # Vào container PostgreSQL:
  docker compose exec db psql -U pms_user -d pms
  ```

---

## 🛠️ 3. Xử lý các sự cố thường gặp (Troubleshooting)

1. **Lỗi "Cannot connect to the Docker daemon":**
   - **Nguyên nhân:** Ứng dụng Docker Desktop chưa được bật.
   - **Cách xử lý:** Mở ứng dụng Docker Desktop trên máy và chờ tới khi Docker báo sẵn sàng, sau đó chạy lại lệnh.

2. **Lỗi xung đột cổng (Port already in use - 5432, 8080 hoặc 3000):**
   - **Nguyên nhân:** Máy của bạn đã có dịch vụ khác (như PostgreSQL local, Tomcat hoặc tiến trình Node) đang chiếm dụng cổng.
   - **Cách xử lý:**
     - Tắt dịch vụ đang chiếm cổng trên máy host:
       - *macOS/Linux:* `lsof -i :<port>` sau đó `kill -9 <PID>`
       - *Windows:* `netstat -ano | findstr :<port>` sau đó tắt bằng Task Manager.
     - Hoặc đổi cổng host bên trái trong `docker-compose.yml` (Ví dụ đổi `"3000:80"` thành `"3001:80"`).

3. **Backend khởi động báo lỗi kết nối Database:**
   - **Nguyên nhân:** Container database chưa hoàn tất việc khởi tạo bảng thì backend đã gửi request kết nối.
   - **Cách xử lý:** Docker Compose đã có cấu hình `depends_on: db`. Nếu gặp lỗi tạm thời trong lần khởi tạo đầu tiên, chỉ cần khởi động lại service backend:
     ```bash
     docker compose restart backend
     ```

4. **Muốn xóa cache và build lại từ đầu:**
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up -d
   ```

---

## 📂 4. Cấu trúc thư mục dự án

```text
PMS/
├── backend/                  # Mã nguồn Spring Boot 3 API
│   ├── src/                  # Controllers, Models, Services, Security...
│   ├── pom.xml               # Cấu hình Maven dependencies
│   └── Dockerfile            # Multi-stage Dockerfile cho Backend
├── frontend/                 # Mã nguồn React SPA
│   ├── src/                  # Components, Pages, Stores, Services...
│   ├── package.json          # Cấu hình NPM dependencies
│   ├── nginx.conf            # Cấu hình Nginx phục vụ web & reverse proxy
│   └── Dockerfile            # Multi-stage Dockerfile cho Frontend
├── docs/                     # Tài liệu thiết kế và đặc tả dự án
├── docker-compose.yml        # Orchestration cấu hình chạy toàn bộ hệ thống
├── API_DOCUMENTATION.md      # Đặc tả chi tiết các RESTful API endpoints
├── context.md                # Tài liệu bối cảnh và nghiệp vụ tổng quan
└── README.md                 # Hướng dẫn dự án & cài đặt
```
