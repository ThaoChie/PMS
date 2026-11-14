package com.pms.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.pms.backend.dto.NotificationResponse;
import com.pms.backend.enu.NotificationType;
import com.pms.backend.model.Notification;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;

/** JSON của thông báo phải khớp frontend + API_DOCUMENTATION: khóa "isRead" và thời điểm kèm múi giờ. */
class NotificationResponseJsonTest {

    // Cấu hình như Spring Boot mặc định: có JavaTimeModule, ghi ngày dạng chuỗi ISO
    private final ObjectMapper mapper = new ObjectMapper()
            .findAndRegisterModules()
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private Notification sample(boolean read) {
        Notification n = new Notification();
        n.setId(12L);
        n.setType(NotificationType.MENTION);
        n.setTitle("t");
        n.setMessage("m");
        n.setRead(read);
        n.setCreatedAt(LocalDateTime.of(2026, 11, 14, 3, 0, 0));
        return n;
    }

    @Test
    void trangThaiDaDoc_dungKhoaIsRead() throws Exception {
        JsonNode json = mapper.readTree(mapper.writeValueAsString(NotificationResponse.from(sample(true))));
        assertTrue(json.has("isRead"), "phai co khoa isRead: " + json);
        assertTrue(json.get("isRead").asBoolean());
        assertFalse(json.has("read"), "khong con khoa read cu: " + json);
    }

    @Test
    void thoiDiemTao_kemMuiGio() throws Exception {
        JsonNode json = mapper.readTree(mapper.writeValueAsString(NotificationResponse.from(sample(false))));
        String createdAt = json.get("createdAt").asText();
        // Có offset (+07:00, Z, ...) -> trình duyệt tính đúng, không lệch theo múi giờ máy chủ
        assertTrue(createdAt.matches(".*(Z|[+-]\\d{2}:\\d{2})$"), "createdAt phai co mui gio: " + createdAt);
        OffsetDateTime parsed = OffsetDateTime.parse(createdAt);
        assertEquals(LocalDateTime.of(2026, 11, 14, 3, 0, 0), parsed.toLocalDateTime());
    }
}
