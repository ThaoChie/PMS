# HƯỚNG DẪN DEPLOY TOÀN BỘ HỆ THỐNG PMS
> **Kiến trúc triển khai:**
> - **Database:** Neon (Serverless PostgreSQL)
> - **Backend:** Render (Spring Boot 3 / Docker Web Service)
> - **Frontend:** Vercel (React 19 + Vite SPA)

---

## BƯỚC 1: Khởi tạo Database trên Neon (PostgreSQL)

1. Truy cập [https://neon.tech](https://neon.tech) và đăng nhập (bằng GitHub hoặc Google).
2. Nhấn **"Create Project"**:
   - **Project name:** `pms-db`
   - **Postgres version:** `16` (hoặc mới nhất)
   - **Region:** Chọn gần bạn nhất (ví dụ: `ap-southeast-1` Singapore hoặc `us-east-2`).
3. Sau khi tạo xong, tại bảng điều khiển Dashboard của Neon:
   - Chuyển sang tab **Connection Details**.
   - Mục **Connection string**, chọn **Pooled connection** (khuyên dùng) hoặc **Direct connection**.
   - Sao chép toàn bộ chuỗi kết nối, có dạng:
     ```text
     postgresql://neondb_owner:npg_xxxxxx@ep-xxxxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   *(Hệ thống PMS đã tích hợp sẵn `DatabaseConfig.java` tự động parse URL này thành JDBC và cấu hình kết nối an toàn).*

---

## BƯỚC 2: Triển khai Backend lên Render

### Cách 1: Sử dụng Web Service thủ công (Khuyên dùng)
1. Đăng nhập [https://render.com](https://render.com) và chọn **"New +"** > **"Web Service"**.
2. Kết nối tới Git repository của dự án.
3. Cấu hình thông tin dịch vụ:
   - **Name:** `pms-backend` (hoặc tên tùy chọn)
   - **Region:** Singapore (cùng region với Neon để tối ưu độ trễ)
   - **Language / Runtime:** `Docker`
   - **Dockerfile Path:** `./backend/Dockerfile`
   - **Docker Build Context Directory:** `./backend`
   - **Instance Type:** `Free`
4. Cuộn xuống phần **Environment Variables**, bấm **"Add Environment Variable"** và thêm các biến sau:

| Tên biến (Key) | Giá trị (Value) | Ghi chú |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` (dán link từ Neon) | Hoặc dùng `SPRING_DATASOURCE_URL` dạng JDBC |
| `APP_JWT_SECRET` | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | Chuỗi bí mật ngẫu nhiên (tối thiểu 32 ký tự) |
| `APP_JWT_EXPIRATION` | `86400000` | Thời gian sống JWT (24h) |
| `PORT` | `8080` | Render tự gán hoặc dùng 8080 |
| `CORS_ALLOWED_ORIGINS` | `https://*.vercel.app,http://localhost:5173` | Sẽ cập nhật thêm URL chính thức của Vercel ở Bước 3 |

5. Mục **Health Check Path**: Nhập `/api/health`.
6. Bấm **"Deploy Web Service"** và chờ Render build Docker image.
7. Sau khi deploy thành công, Render sẽ cấp URL:
   `https://pms-backend-xxxx.onrender.com`
   - Kiểm tra thử bằng cách truy cập: `https://pms-backend-xxxx.onrender.com/api/health`
   - Kết quả trả về `{"status":"UP", ...}` là backend đã sẵn sàng!

### Cách 2: Sử dụng Render Blueprint (`render.yaml`)
Nếu dùng Blueprint: Chọn **"New +"** > **"Blueprint"** > Chọn repository, Render sẽ tự đọc file `render.yaml` và chỉ yêu cầu bạn điền thông tin database credentials.

---

## BƯỚC 3: Triển khai Frontend lên Vercel

1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2. Bấm **"Add New..."** > **"Project"** > Chọn Git repository của bạn.
3. Cấu hình Project trên Vercel:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Bấm **Edit** và chọn thư mục `frontend`
4. Mở rộng mục **Environment Variables** và cấu hình:

| Tên biến (Key) | Giá trị (Value) |
|---|---|
| `VITE_API_BASE_URL` | `https://pms-backend-xxxx.onrender.com/api` *(Lưu ý: có `/api` ở cuối)* |
| `VITE_GOOGLE_CLIENT_ID` | `your-google-client-id.apps.googleusercontent.com` *(Tùy chọn)* |

5. Bấm **"Deploy"**. Vercel sẽ tự động build và cấp domain (ví dụ: `https://pms-frontend-xxxx.vercel.app`).
6. Nhờ file [vercel.json](file:///Users/thaochie/Documents/PMS/frontend/vercel.json), các đường dẫn SPA (React Router) sẽ không bị lỗi 404 khi người dùng F5 / reload trang.

---

## BƯỚC 4: Hoàn tất & Cập nhật CORS

1. Lấy URL Vercel vừa được tạo (ví dụ: `https://pms-frontend-xxxx.vercel.app`).
2. Quay lại Dashboard của **Render** > Vào dịch vụ `pms-backend` > Chọn **Environment**.
3. Cập nhật biến `CORS_ALLOWED_ORIGINS`:
   ```text
   https://pms-frontend-xxxx.vercel.app,https://*.vercel.app,http://localhost:5173
   ```
4. Bấm **Save Changes** để Render tự redeploy cập nhật CORS.
5. Truy cập URL Vercel, đăng ký tài khoản mới và bắt đầu sử dụng hệ thống!
