-- Migration: Add manual adjustment fields to daily_entries table
-- Created: 2026-02-19
-- Description: Adds manual_adj_amount and adj_reason_code fields for per-entry adjustments

-- Add manual_adj_amount column with default 0.00
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_entries' AND column_name = 'manual_adj_amount'
    ) THEN
        ALTER TABLE daily_entries ADD COLUMN manual_adj_amount NUMERIC(10, 2) DEFAULT 0.00;
        COMMENT ON COLUMN daily_entries.manual_adj_amount IS 'Manual adjustment amount (positive for bonus, negative for deduction)';
    END IF;
END $$;

-- Add adj_reason_code column (nullable string)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'daily_entries' AND column_name = 'adj_reason_code'
    ) THEN
        ALTER TABLE daily_entries ADD COLUMN adj_reason_code VARCHAR(20);
        COMMENT ON COLUMN daily_entries.adj_reason_code IS 'Reason code for adjustment: LATE, WET, QUALITY, BONUS, OTHER';
    END IF;
END $$;

-- Create check constraint for valid reason codes (if supported)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_adj_reason_code'
    ) THEN
        ALTER TABLE daily_entries ADD CONSTRAINT chk_adj_reason_code 
        CHECK (adj_reason_code IS NULL OR adj_reason_code IN ('LATE', 'WET', 'QUALITY', 'BONUS', 'OTHER'));
    END IF;
END $$;

-- Create index for filtering by reason code (for reporting)
CREATE INDEX IF NOT EXISTS idx_daily_entries_adj_reason ON daily_entries(adj_reason_code) 
WHERE deleted_at IS NULL AND adj_reason_code IS NOT NULL;

-- Recalculate net_amount for existing entries to include manual_adj_amount
-- Note: This is a one-time update. net_amount = total_amount - commission_amount + manual_adj_amount
-- Since existing entries have manual_adj_amount = 0 (default), no recalculation is needed.
-- The formula change is handled in the application layer.
