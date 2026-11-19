package com.pms.backend.enu;

public enum WorkloadLevel {
    UNDERLOAD("Thiếu tải"),
    BALANCED("Cân đối"),
    OVERLOAD("Quá tải");

    private final String displayName;

    WorkloadLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
