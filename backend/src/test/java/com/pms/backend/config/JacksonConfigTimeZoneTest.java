package com.pms.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.*;

/** Toàn bộ API: LocalDateTime gửi ra phải kèm múi giờ (máy chủ Render chạy UTC). */
class JacksonConfigTimeZoneTest {

    private TimeZone saved;
    private ObjectMapper mapper;

    @BeforeEach
    void setUp() {
        saved = TimeZone.getDefault();
        TimeZone.setDefault(TimeZone.getTimeZone("UTC")); // giống máy chủ Render
        mapper = new JacksonConfig().objectMapper();
    }

    @AfterEach
    void tearDown() {
        TimeZone.setDefault(saved);
    }

    record IssueLike(String key, LocalDateTime createdAt, LocalDate dueDate) {}

    @Test
    void ghiRa_kemMuiGio_vaQuyDoiDungGioVietNam() throws Exception {
        String json = mapper.writeValueAsString(new IssueLike("PRJ-1", LocalDateTime.of(2026, 11, 25, 3, 0), LocalDate.of(2026, 11, 30)));
        Map<?, ?> m = mapper.readValue(json, Map.class);
        String createdAt = (String) m.get("createdAt");
        assertTrue(createdAt.endsWith("Z"), "phai kem mui gio: " + json);
        assertEquals(LocalDateTime.of(2026, 11, 25, 10, 0),
                OffsetDateTime.parse(createdAt).atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDateTime(),
                "03:00 UTC phai la 10:00 gio VN");
        assertEquals("2026-11-30", m.get("dueDate"), "LocalDate (ngay) giu nguyen, khong gan gio");
    }

    @Test
    void docVao_chapNhanCaCoVaKhongMuiGio() throws Exception {
        LocalDateTime cu = mapper.readValue("\"2026-11-25T03:00:00\"", LocalDateTime.class);      // du lieu JSON cu da luu
        LocalDateTime moi = mapper.readValue("\"2026-11-25T03:00:00Z\"", LocalDateTime.class);    // du lieu moi
        LocalDateTime vn = mapper.readValue("\"2026-11-25T10:00:00+07:00\"", LocalDateTime.class);
        assertEquals(LocalDateTime.of(2026, 11, 25, 3, 0), cu);
        assertEquals(cu, moi);
        assertEquals(cu, vn, "10:00 +07:00 = 03:00 UTC");
    }

    @Test
    void khuHoiGiuNguyenGiaTri() throws Exception {
        LocalDateTime t = LocalDateTime.of(2026, 11, 25, 3, 4, 5, 123_000_000);
        assertEquals(t, mapper.readValue(mapper.writeValueAsString(t), LocalDateTime.class));
    }
}
