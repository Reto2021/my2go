-- Enable pg_net extension if not exists (for HTTP requests from cron)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;