-- Fix notifications_type_check constraint to include BOOKING_CANCELLED
-- This runs automatically on a fresh database volume.
-- If the DB already exists, apply manually:
--   docker exec smart_campus_db psql -U postgres -d smart_campus_db -f /docker-entrypoint-initdb.d/01_fix_notification_type_check.sql

DO $$
BEGIN
    -- Only alter if BOOKING_CANCELLED is missing from the constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'notifications_type_check'
          AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    END IF;
END $$;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type::text = ANY (ARRAY[
        'BOOKING_APPROVED',
        'BOOKING_REJECTED',
        'BOOKING_CANCELLED',
        'TICKET_STATUS_CHANGED',
        'TICKET_ASSIGNED',
        'NEW_COMMENT',
        'SYSTEM'
    ]::text[]));

