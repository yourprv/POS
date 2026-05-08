Rolling Archive Edge Function
=============================

This Edge Function performs a rolling daily archive of the `ledger` table.

What it does
- Archives all `ledger` rows created exactly 3 days ago (UTC full day window).
- Exports rows to CSV and uploads to the existing `ledger-archives` storage bucket as `archive_YYYY_MM_DD.csv` (underscores).
- Only after a successful upload it deletes the rows for the same timestamp window.

Deploy
------
From your project root run:

```
supabase functions deploy rolling-archive
```

Scheduling (pg_cron)
--------------------
Use the `pg_cron` extension to schedule the function nightly at 00:05 UTC.

Run the following Supabase CLI command to create a daily cron job (cron expression: `5 0 * * *`):

```
supabase db query "SELECT cron.schedule('rolling_archive', '5 0 * * *', $$SELECT public.invoke_rolling_archive();$$);"
```

Notes:
- The SQL above schedules whatever SQL you put in the third argument. Common patterns:
  - Create a Postgres wrapper `public.invoke_rolling_archive()` that issues an HTTP POST to the Edge Function endpoint (using an HTTP extension such as `pg_net` or `http`) with appropriate headers, then schedule that wrapper.
  - Or replace the `SELECT public.invoke_rolling_archive();` portion with the exact SQL that performs the HTTP call if you prefer.
- Replace any placeholders with your actual project-specific values if necessary.
- Ensure `pg_cron` (and any HTTP extension you use) is available in your DB.

Environment
-----------
- The function requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to be set in the Function's environment. `SUPABASE_SERVICE_ROLE_KEY` is required to delete rows (bypasses RLS).

VACUUM reminder
---------------
After large deletions, run:

```
VACUUM ANALYZE ledger;
```

in the Supabase SQL Editor to reclaim space and refresh planner stats. For aggressive reclaim use `VACUUM FULL ledger;` (locks the table temporarily).
