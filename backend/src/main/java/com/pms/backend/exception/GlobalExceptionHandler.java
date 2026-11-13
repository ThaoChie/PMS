package com.pms.backend.exception;

import com.pms.backend.common.ApiResponse;
import com.pms.backend.enu.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Object>> handleCustomValidationException(ValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Object>> handleBusinessException(BusinessException ex) {
        ErrorCode code = ex.getErrorCode();
        return ResponseEntity.status(code.getStatus())
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Object>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Bạn không có quyền thực hiện hành động này"));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Object>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthException(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Xác thực không thành công: " + ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Dữ liệu không hợp lệ: " + errors.values().stream().findFirst().orElse("Vui lòng kiểm tra lại")));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoResourceFound(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Endpoint không tồn tại: " + ex.getResourcePath()));
    }

    /**
     * Vi pham rang buoc toan ven du lieu.
     *
     * TRUOC DAY: moi vi pham deu tra ve "Email hoac thong tin da ton tai trong he thong",
     * ke ca khi khong lien quan gi den email (vi du ghi nhan thoi gian lam viec).
     * Thong bao sai lam nguoi dung hoang mang va che mat ten rang buoc that su,
     * khien lap trinh vien khong the chan doan duoc loi.
     *
     * NAY: doi chieu ten rang buoc de tra thong bao dung ngu canh, dong thoi
     * ghi ca ten rang buoc va nguyen nhan goc vao log de con truy vet.
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrity(org.springframework.dao.DataIntegrityViolationException ex) {
        String constraint = extractConstraintName(ex);
        String rootCause = rootCauseMessage(ex);

        // Ghi day du de con truy vet tren may chu (khong lo ra cho nguoi dung).
        log.error("Data integrity violation [constraint={}]: {}", constraint, rootCause, ex);

        String message = messageForConstraint(constraint, rootCause);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(message));
    }

    private String rootCauseMessage(Throwable ex) {
        Throwable cur = ex;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        return cur.getMessage() != null ? cur.getMessage() : ex.toString();
    }

    /** Lay ten rang buoc tu ConstraintViolationException cua Hibernate, hoac do tu thong bao cua PostgreSQL. */
    private String extractConstraintName(Throwable ex) {
        Throwable cur = ex;
        while (cur != null) {
            if (cur instanceof org.hibernate.exception.ConstraintViolationException cve
                    && cve.getConstraintName() != null) {
                return cve.getConstraintName().toLowerCase();
            }
            cur = cur.getCause() != cur ? cur.getCause() : null;
        }
        String msg = rootCauseMessage(ex);
        java.util.regex.Matcher m =
                java.util.regex.Pattern.compile("constraint \"([^\"]+)\"").matcher(msg);
        return m.find() ? m.group(1).toLowerCase() : "";
    }

    private String messageForConstraint(String constraint, String rootCause) {
        if (constraint.contains("users_lower_email") || constraint.contains("users_email")) {
            return "Email này đã được sử dụng trong hệ thống.";
        }
        if (constraint.contains("project_member")) {
            return "Người dùng này đã là thành viên của dự án.";
        }
        if (constraint.contains("issue_watchers")) {
            return "Bạn đã theo dõi công việc này rồi.";
        }
        if (constraint.contains("recent_views")) {
            return "Không thể cập nhật lịch sử truy cập. Vui lòng thử lại.";
        }
        if (constraint.contains("project_key") || constraint.contains("projects_project")) {
            return "Mã dự án này đã tồn tại.";
        }
        if (constraint.contains("issue_key") || constraint.contains("issues_issue")) {
            return "Mã công việc này đã tồn tại.";
        }
        if (constraint.contains("labels_project_name")) {
            return "Nhãn này đã tồn tại trong dự án.";
        }
        if (constraint.contains("issue_link")) {
            return "Liên kết giữa hai công việc này đã tồn tại.";
        }
        if (constraint.contains("attachment_blobs")) {
            return "Tệp đính kèm này đã tồn tại.";
        }
        if (constraint.contains("custom_field")) {
            return "Trường tùy chỉnh này đã tồn tại.";
        }

        // Chua biet ro rang buoc nao: phan loai theo kieu vi pham,
        // tuyet doi KHONG doan bua la loi email.
        String lower = rootCause == null ? "" : rootCause.toLowerCase();
        if (lower.contains("null value") || lower.contains("not-null")) {
            return "Thiếu thông tin bắt buộc. Vui lòng kiểm tra lại dữ liệu nhập.";
        }
        if (lower.contains("foreign key") || lower.contains("violates foreign key")) {
            return "Dữ liệu liên quan không tồn tại hoặc đang được sử dụng ở nơi khác.";
        }
        return "Thao tác xung đột với dữ liệu hiện có. Vui lòng tải lại trang và thử lại.";
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Tep vuot qua gioi han multipart cua servlet.
     * Mac dinh Spring nem loi nay ra handler chung -> tra ve HTTP 500 "loi he thong",
     * khien nguoi dung tuong la loi server. Tra 413 kem thong bao ro rang hon.
     */
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleMaxUploadSize(
            org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        log.warn("Upload rejected, file exceeds multipart limit: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error("Tệp tải lên vượt quá dung lượng cho phép (tối đa 10MB)."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        log.error("Unhandled exception caught in GlobalExceptionHandler", ex);
        String detail = ex.getMessage();
        if (detail == null || detail.isBlank()) {
            detail = ex.getClass().getSimpleName();
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Đã xảy ra lỗi hệ thống: " + detail));
    }
}
