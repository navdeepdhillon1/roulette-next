-- Fix INTEGER overflow for timestamp-based fields
-- Change spin_number from INTEGER to BIGINT to support timestamp values

ALTER TABLE betting_card_steps
ALTER COLUMN spin_number TYPE BIGINT;

-- Also ensure bet_number can handle larger values if needed
ALTER TABLE betting_card_steps
ALTER COLUMN bet_number TYPE BIGINT;
