package com.pms.backend.wrapper;

import java.util.Collections;
import java.util.List;

public class PageWrapper<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public PageWrapper() {
        this.content = Collections.emptyList();
    }

    public PageWrapper(List<T> content, int page, int size, long totalElements) {
        this.content = content != null ? content : Collections.emptyList();
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 0;
    }

    public static <T> PageWrapper<T> of(List<T> content, int page, int size, long totalElements) {
        return new PageWrapper<>(content, page, size, totalElements);
    }

    public static <T> PageWrapper<T> from(org.springframework.data.domain.Page<T> page) {
        if (page == null) {
            return empty(0, 0);
        }
        return new PageWrapper<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements());
    }

    public static <T> PageWrapper<T> empty(int page, int size) {
        return new PageWrapper<>(Collections.emptyList(), page, size, 0);
    }

    public List<T> getContent() { return content; }
    public void setContent(List<T> content) { this.content = content; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
}
