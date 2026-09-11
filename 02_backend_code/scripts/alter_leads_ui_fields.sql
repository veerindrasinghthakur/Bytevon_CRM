-- Run once against the app database if columns are missing.
-- Safe to re-run: IF NOT EXISTS checks (PostgreSQL).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_title VARCHAR(150) NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS chat_link VARCHAR(500) NULL;
