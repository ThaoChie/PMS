-- V10__saved_filters.sql
CREATE TABLE IF NOT EXISTS saved_filters (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    criteria JSONB NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters (user_id);

CREATE TABLE IF NOT EXISTS saved_filter_shares (
    filter_id BIGINT NOT NULL REFERENCES saved_filters(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (filter_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_filter_shares_user_id ON saved_filter_shares (user_id);

CREATE TABLE IF NOT EXISTS filter_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    filter_id BIGINT NOT NULL REFERENCES saved_filters(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frequency VARCHAR(20) NOT NULL,
    next_run_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_filter_user_subscription UNIQUE (filter_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_filter_subscriptions_next_run ON filter_subscriptions (next_run_at);
