-- Migration: Add financial configuration fields to farmers table
-- Created: 2026-02-19
-- Description: Adds commission_pct and flat_fee_monthly fields for per-farmer financial configuration

-- Add commission_pct column with default 10.00%
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'farmers' AND column_name = 'commission_pct'
    ) THEN
        ALTER TABLE farmers ADD COLUMN commission_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00;
        COMMENT ON COLUMN farmers.commission_pct IS 'Commission percentage for this farmer (overrides system default)';
    END IF;
END $$;

-- Add flat_fee_monthly column with default 0.00
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'farmers' AND column_name = 'flat_fee_monthly'
    ) THEN
        ALTER TABLE farmers ADD COLUMN flat_fee_monthly NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
        COMMENT ON COLUMN farmers.flat_fee_monthly IS 'Monthly flat fee charged to this farmer';
    END IF;
END $$;

-- Create index for faster queries on commission_pct (optional, for reporting)
CREATE INDEX IF NOT EXISTS idx_farmers_commission_pct ON farmers(commission_pct) 
WHERE deleted_at IS NULL;
