package com.pms.backend.enu;

public enum LinkType {
    BLOCKS,
    RELATES_TO,
    DUPLICATES;

    public String getInwardDescription() {
        return switch (this) {
            case BLOCKS -> "is blocked by";
            case RELATES_TO -> "relates to";
            case DUPLICATES -> "is duplicated by";
        };
    }

    public String getOutwardDescription() {
        return switch (this) {
            case BLOCKS -> "blocks";
            case RELATES_TO -> "relates to";
            case DUPLICATES -> "duplicates";
        };
    }
}
