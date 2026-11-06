# ADR-001 — Lựa chọn Process Engine cho tích hợp Camunda

> **Trạng thái:** Đã duyệt: phương án A, kèm điều kiện trên (06/11/2026)  
> **Người soạn:** Phase 0 survey, 06/11/2026  
> **Ràng buộc cứng từ CLAUDE.md & Điều kiện phê duyệt:**  
> (a) Spring Boot **3.2.0** — không được nâng version.  
> (b) **Không thêm bảng vào DB hiện có** của PMS (ưu tiên).  
> (c) Khi `camunda.enabled=false` ứng dụng khởi động bình thường, **không thử kết nối** engine.  
> (d) Không dùng spring-boot-starter tự cấu hình nếu nó tạo engine/kết nối DB khi cờ camunda.enabled tắt; ưu tiên thư viện lõi + bean tạo engine có @ConditionalOnProperty.

---

## Bối cảnh

EPMS cần điều phối hai quy trình:  
1. **Duyệt nhiều cấp** cho `PROJECT_CLOSE` và `WORKFLOW_CONFIG_CHANGE` (chờ người duyệt qua Message Event, timer nhắc/escalate/hết hạn).  
2. **Nhắc Issue sắp đến hạn** chạy theo cron hằng ngày.

Cả hai quy trình đều **ngắn và ổn định** (không cần long-running phức tạp). Trạng thái thật lưu ở DB PMS; engine chỉ điều phối luồng và timer.

---

## Dữ liệu tra cứu (tài liệu chính thức)

> Tất cả URL đã xác minh ngày 06/11/2026.

### Camunda 8 — License Self-Managed

Từ **Camunda 8.6** (phát hành 08/10/2024), tất cả component cốt lõi (Zeebe, Operate, Tasklist, Identity, Optimize) chuyển sang **Camunda License v1**:

- **Dev / Non-Production:** miễn phí, không cần key.
- **Production (self-hosted):** bắt buộc **Enterprise Edition** có `global.licenseKey`, giá khởi điểm €99/tháng (Starter plan).
- Phiên bản ≤ 8.5 (trước khi thay đổi license): vẫn theo license cũ nhưng **EoL từ 14/10/2025** — đã hết hỗ trợ hơn 1 năm tính đến ngày khảo sát.

**Nguồn:**
- [Camunda Licensing Update Apr 2024](https://camunda.com/blog/2024/04/licensing-update-camunda-8-self-managed/)
- [docs.camunda.io/docs/reference/licenses](https://docs.camunda.io/docs/reference/licenses/) — 06/11/2026
- [Supported environments](https://docs.camunda.io/docs/reference/supported-environments/) — 06/11/2026

### Camunda 8 — Hạ tầng Self-Managed

| Chế độ | Thành phần bắt buộc | RAM ước tính |
|---|---|---|
| Full stack (UI Operate/Tasklist) | Zeebe + Elasticsearch/OpenSearch + Operate + Tasklist + Identity | ≥ 8 GB |
| Zeebe standalone (không UI) | Chỉ Zeebe | ~512 MB–1 GB |

Từ Camunda **8.10** có cấu hình lightweight thay Elasticsearch bằng H2 file — nhưng 8.10 yêu cầu Spring Boot ≥ 3.5, không tương thích dự án.

**Nguồn:** [Docker deploy docs 8.7](https://unsupported.docs.camunda.io/8.7/docs/self-managed/setup/deploy/other/docker/) — 06/11/2026

### Camunda 8 — Java Client và Spring Boot 3.2 compatibility

| Artifact | GroupId / ArtifactId | Spring Boot tương thích | Ghi chú |
|---|---|---|---|
| `zeebe-client-java` | `io.camunda / zeebe-client-java` | 3.x (cấu hình thủ công) | Deprecated từ 8.8, bị xóa ở 8.10 |
| `spring-boot-starter-camunda-sdk` | `io.camunda / spring-boot-starter-camunda-sdk` | 3.2.x (phiên bản 8.5.x ≤ 8.5.15) | 8.6+ không dùng được; 8.5 đã EoL |
| `camunda-java-client` | `io.camunda / camunda-java-client` | 3.5.x / 4.1.x (8.8+) | Không tương thích Spring Boot 3.2 |

> **Kết luận tương thích:** Phiên bản Camunda 8 DUY NHẤT tương thích Spring Boot 3.2 là **8.5.x** — nhưng đã EoL từ 14/10/2025. Các phiên bản 8.6+ (đang được hỗ trợ) yêu cầu Spring Boot ≥ 3.5.

**Nguồn:**
- [Spring Zeebe SDK 8.5](https://unsupported.docs.camunda.io/8.5/docs/apis-tools/spring-zeebe-sdk/getting-started/) — 06/11/2026
- [GitHub issue Boot 3.2 incompatibility](https://github.com/camunda/camunda/issues/15400) — 06/11/2026

### Camunda 8 — Docker local (Zeebe standalone)

```bash
docker run --name zeebe -p 26500:26500 -p 8080:8080 camunda/zeebe:8.5.15
```

| Port | Mục đích |
|---|---|
| `26500` | gRPC (Java client kết nối) |
| `8080` | REST API gateway |
| `26501–26502` | Internal cluster (không cần expose) |

Image: [`camunda/zeebe`](https://hub.docker.com/r/camunda/zeebe) — DockerHub, 06/11/2026.

### Các engine nhúng thay thế

| Engine | License | Spring Boot 3.2 | Nhúng vào JVM | Tình trạng (06/11/2026) |
|---|---|---|---|---|
| **Flowable 7.1+** | Apache 2.0 | ✅ (7.1+ hỗ trợ SB 3.x) | ✅ | Ổn định, nhiều release 2024–2026 |
| **Operaton** (fork Camunda 7) | Apache 2.0 | ❌ (1.x cần SB 3.5; 2.0 cần SB 4.0) | ✅ | Ra mắt 10/2024, ~413 stars |
| **Camunda 7 Community** | Apache 2.0 | ❌ (legacy, EoL 10/2025) | ✅ | EoL — không khuyến nghị |

**Nguồn:**
- [Flowable GitHub](https://github.com/flowable/flowable-engine) — 06/11/2026
- [Operaton GitHub](https://github.com/operaton/operaton) — 06/11/2026

---

## Phương án đánh giá

### Phương án A — Flowable 7.1+ nhúng, datasource riêng ★ Khuyến nghị

**Mô tả:** Nhúng Flowable Process Engine vào cùng JVM với backend PMS. Toàn bộ bean Flowable khai báo với `@ConditionalOnProperty("camunda.enabled")`. Datasource Flowable trỏ đến **schema riêng** trong Postgres (hoặc một DB riêng) — không chạm bảng PMS.

**Cách khai báo cờ tắt:**
```java
@Configuration
@ConditionalOnProperty(name = "camunda.enabled", havingValue = "true")
public class FlowableConfig {
    @Bean
    @ConfigurationProperties("flowable.datasource")
    public DataSource flowableDataSource() { ... }

    @Bean
    public ProcessEngine processEngine(DataSource flowableDataSource) { ... }
}
```

Khi `camunda.enabled=false` (mặc định): Spring không khởi tạo bean trên; không có kết nối DB phụ; Flowable không tạo bảng; ứng dụng chạy hoàn toàn bình thường.

**Docker local** (`docker-compose.camunda.yml`): Chỉ cần thêm một database riêng trong Postgres, hoặc dùng schema `flowable` trong Postgres hiện có (tùy cấu hình `flowable.datasource.url`). Không cần container engine riêng.

| Tiêu chí | Đánh giá |
|---|---|
| License production | ✅ Apache 2.0, miễn phí |
| Spring Boot 3.2 | ✅ Tương thích (Flowable 7.1+) |
| Không đụng DB PMS | ✅ Datasource riêng → bảng Flowable (~50 bảng) trong schema riêng |
| Không tự kết nối khi tắt | ✅ `@ConditionalOnProperty` → không có bean, không có kết nối |
| Hạ tầng thêm | ✅ Không container mới (nếu dùng schema riêng trong Postgres hiện có) |
| BPMN support | ✅ Message events, Timer, Service Task — đủ cho cả 2 quy trình |
| Tooling | ⚠️ Ít hơn Camunda 8 (không có Operate UI); đủ dùng cho use-case này |
| Cộng đồng | ✅ Ổn định, nhiều release 2024–2026 |
| Cần học thêm | ⚠️ API Flowable khác Camunda 8 Zeebe; nhưng khái niệm BPMN giống |

**Chi phí vận hành:** Không có license phí. Không có container engine riêng (khi dùng schema chung). Bảng Flowable tạo trong schema `flowable` của cùng Postgres, không ảnh hưởng schema `public` của PMS.

---

### Phương án B — Camunda 8.5.15 + zeebe-client-java thuần (không starter)

**Mô tả:** Chạy Zeebe 8.5.15 trong Docker riêng. Backend PMS dùng `zeebe-client-java:8.5.x` tự khởi tạo bean `ZeebeClient` với `@ConditionalOnProperty`. Không dùng Spring Boot Starter (tránh auto-configure kết nối ngay khi boot).

```java
@Bean
@ConditionalOnProperty(name = "camunda.enabled", havingValue = "true")
public ZeebeClient zeebeClient(CamundaProperties props) {
    return ZeebeClient.newClientBuilder()
        .grpcAddress(URI.create(props.getGrpcAddress()))
        .credentialsProvider(...)
        .build();
}
```

**Dependency:**
```xml
<dependency>
    <groupId>io.camunda</groupId>
    <artifactId>zeebe-client-java</artifactId>
    <version>8.5.15</version>
</dependency>
```

| Tiêu chí | Đánh giá |
|---|---|
| License production | ❌ **Enterprise Edition bắt buộc** (Camunda License v1, từ €99/tháng) |
| Spring Boot 3.2 | ✅ 8.5.x tương thích |
| **EoL** | ❌ **Camunda 8.5 EoL từ 14/10/2025 — đã hết hỗ trợ 13+ tháng** |
| Không đụng DB PMS | ✅ Zeebe process store hoàn toàn riêng (trong container Zeebe) |
| Không tự kết nối khi tắt | ✅ `@ConditionalOnProperty` → không có bean, không có gRPC connection |
| Hạ tầng thêm | ⚠️ Container `camunda/zeebe:8.5.15` cần chạy; nếu down thì worker không nhận job |
| BPMN support | ✅ Đầy đủ — Zeebe hỗ trợ Message events, Timer, Service Task |
| Tooling | ✅ Camunda Modeler, Operate (nếu thêm Elasticsearch) |
| Rủi ro bảo mật | ⚠️ Engine EOL = không nhận security patch |

---

### Phương án C — Camunda 8 phiên bản hiện tại (8.10+) + nâng Spring Boot

**Mô tả:** Nâng Spring Boot lên 3.5+ để dùng được Camunda 8 phiên bản mới nhất với client `camunda-java-client`.

| Tiêu chí | Đánh giá |
|---|---|
| **Nâng Spring Boot** | ❌ **Cấm theo CLAUDE.md §2 ("Nâng/hạ version Spring Boot... bị cấm")** |

**→ Loại bỏ.** Không khả thi theo nguyên tắc dự án.

---

## So sánh tóm tắt

| Tiêu chí | A: Flowable nhúng | B: Camunda 8.5.15 | C: Camunda 8.10+ |
|---|---|---|---|
| License production | ✅ Miễn phí | ❌ Enterprise (trả phí) | ❌ Enterprise (trả phí) |
| Spring Boot 3.2 | ✅ | ✅ | ❌ Cần SB 3.5+ |
| EoL / hỗ trợ | ✅ Đang duy trì | ❌ EOL 10/2025 | ✅ Đang hỗ trợ |
| Không đụng DB PMS | ✅ Datasource riêng | ✅ Container riêng | ✅ Container riêng |
| Không tự kết nối | ✅ ConditionalOnProperty | ✅ ConditionalOnProperty | ✅ ConditionalOnProperty |
| Hạ tầng thêm | ✅ Tối thiểu | ⚠️ Container Zeebe | ⚠️ Container Zeebe + ES |
| Security patch | ✅ | ❌ EOL | ✅ |

---

## Khuyến nghị

**→ Chọn Phương án A: Flowable 7.1+ nhúng với datasource riêng.**

Lý do chính:
1. **Không cần license phí** — phù hợp dự án học thuật/startup.
2. **Tương thích Spring Boot 3.2** mà không vi phạm quy tắc nâng version.
3. **Không đụng DB PMS** nếu cấu hình `flowable.datasource.*` trỏ đến schema `flowable` riêng trong cùng Postgres, hoặc một DB khác.
4. **Không tự kết nối khi tắt** — toàn bộ bean Flowable đặt sau `@ConditionalOnProperty("camunda.enabled")`.
5. **Không container engine riêng** khi dùng schema chung — đơn giản hóa vận hành.
6. Phương án B (Camunda 8.5) bị loại trừ vì đã EoL > 1 năm và cần trả phí Enterprise cho production.

**Điều kiện áp dụng Phương án A:**
- Thêm `flowable-spring-boot-starter-process:7.1.x` vào `pom.xml` (allowlist #1).
- Tạo file `application-camunda.yml` mới với `flowable.datasource.*` và `camunda.enabled=true`.
- File BPMN `.bpmn` viết theo chuẩn BPMN 2.0 — tương thích cả Flowable lẫn Camunda, không lock-in.

**Lưu ý quan trọng:** Nếu nhóm **dự kiến migrate sang Camunda 8** khi Spring Boot được nâng (công việc Sprint 4 tồn đọng riêng), có thể tách API layer Wrapper để việc thay thế engine sau này chỉ cần sửa implementation của Wrapper, không sửa business logic.

---

## Phụ lục: .gitignore và secrets

**Trạng thái hiện tại** (kiểm tra ngày 06/11/2026):
- `docker-compose.camunda.yml` → **chưa có trong `.gitignore`** — file này không chứa secret (chỉ cấu hình Docker), an toàn để commit.
- `application-camunda.yml` → **chưa có trong `.gitignore`** — nếu file này chỉ chứa template biến môi trường (`${FLOWABLE_DB_URL}`) thì có thể commit. Nếu có thể vô tình ghi secret vào đây, nên thêm vào `.gitignore` để an toàn.

> **Câu hỏi cho người dùng (Q3 từ SURVEY.md):** Có muốn thêm `application-camunda.yml` vào `.gitignore` không? Việc này cần sửa `.gitignore` — file hiện có ngoài allowlist. Nếu template hoàn toàn không có giá trị thật thì có thể commit bình thường.
