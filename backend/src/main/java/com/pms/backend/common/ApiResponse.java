package com.pms.backend.common;

import com.fasterxml.jackson.annotation.JsonInclude;

public class ApiResponse<T> {
    private boolean success;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String code;
    private String message;
    private T data;

    public ApiResponse(boolean success, String message, T data) {
        this(success, null, message, data);
    }

    public ApiResponse(boolean success, String code, String message, T data) {
        this.success = success;
        this.code = code;
        this.message = message;
        this.data = data;
    }
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public static <T> ApiResponse<T> success(T data) { return new ApiResponse<>(true, "Success", data); }
    public static <T> ApiResponse<T> error(String message) { return new ApiResponse<>(false, message, null); }
    public static <T> ApiResponse<T> error(String code, String message) { return new ApiResponse<>(false, code, message, null); }
}
