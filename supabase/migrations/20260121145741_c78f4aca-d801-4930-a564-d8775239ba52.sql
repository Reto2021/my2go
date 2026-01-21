-- Add 'radio' as a valid transaction_source enum value
ALTER TYPE transaction_source ADD VALUE IF NOT EXISTS 'radio';