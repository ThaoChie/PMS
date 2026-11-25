package com.pms.backend.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.pms.backend.common.TimeFormat;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // Đăng ký SAU JavaTimeModule để ghi đè cách ghi/đọc LocalDateTime
        mapper.registerModule(localDateTimeWithZoneModule());
        return mapper;
    }

    /**
     * Mọi LocalDateTime gửi ra API đều KÈM MÚI GIỜ của máy chủ.
     *
     * Entity lưu LocalDateTime theo giờ máy chủ; Render chạy UTC. Gửi "2026-11-25T03:00:00" (không múi giờ)
     * thì trình duyệt ở Việt Nam hiểu là 03:00 giờ VN -> mọi mốc thời gian lệch 7 tiếng ("7 giờ trước").
     * Gửi "2026-11-25T03:00:00Z" thì trình duyệt tự quy đổi đúng. Áp dụng một lần cho toàn bộ API
     * (công việc, lịch sử, tệp đính kèm, phê duyệt, lời mời, thành viên, dự án...).
     *
     * Chiều đọc vào chấp nhận cả chuỗi có múi giờ lẫn không, để dữ liệu JSON cũ đã lưu
     * (điều kiện bộ lọc, dữ liệu phê duyệt...) và dữ liệu mới đều đọc lại được.
     */
    static SimpleModule localDateTimeWithZoneModule() {
        SimpleModule m = new SimpleModule("LocalDateTimeWithZone");
        m.addSerializer(LocalDateTime.class, new JsonSerializer<>() {
            @Override
            public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
                gen.writeString(TimeFormat.isoWithZone(value));
            }
        });
        m.addDeserializer(LocalDateTime.class, new JsonDeserializer<>() {
            @Override
            public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
                String s = p.getValueAsString();
                if (s == null || s.isBlank()) return null;
                s = s.trim();
                boolean hasZone = s.endsWith("Z") || s.matches(".*[+-]\\d{2}:?\\d{2}$");
                if (hasZone && s.contains("T")) {
                    return OffsetDateTime.parse(s).atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
                }
                return LocalDateTime.parse(s);
            }
        });
        return m;
    }
}
