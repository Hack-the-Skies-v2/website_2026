# Organizer console (live portal applications)

The console at `/organizers` reviews **live** hacker and mentor rows from Supabase `applications` (`id`, `type`, `email`, `answers`, …). Access requires `public.users.admin = true`.

## Setup

1. Apply [`supabase/migrations/20260920000000_organizer_review.sql`](supabase/migrations/20260920000000_organizer_review.sql) in the SQL Editor (creates `application_grades` keyed to `applications.id`). If you ran an older copy that referenced `applications(user_id)`, re-run this file — the grades table may never have been created.
2. Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `RESEND_KEY`. Optional: `RESEND_FROM`, `NEXT_PUBLIC_SITE_URL`, `TEST_DECISION_EMAIL` (mock preview only).
3. Mark organizer accounts as admin:

```sql
update public.users set admin = true where id = '<auth-user-uuid>';
```

4. Sign in at `/organizers/sign-in` (uses `/auth?next=/organizers`).

## Behaviour

- Hackers and mentors are separated; Start reviewing opens the least graded pending app first.
- Accept / Reject update `applications.status` and email `applications.email` via Resend when configured.
- Not sure keeps the app in Pending (no email).
- Mock UI remains at `/organizers/preview` for layout testing without live data.
