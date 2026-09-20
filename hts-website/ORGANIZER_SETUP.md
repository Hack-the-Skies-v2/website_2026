# Organizer console setup

The organizer console uses Supabase Google OAuth, but Google Workspace domain membership is **not** authorization. Access is granted only when an email is in `organizer_allowlist`, which creates an `organizers` membership row after that person signs in.

1. Create or select the Supabase project for Hack the Skies.
2. Run [the organizer access script](supabase/organizer-access.sql) in its SQL editor, after the existing application schema has been deployed.
3. Run [the grades script](supabase/organizer-grades.sql) so organizers can score each application question.
4. In Supabase Auth, enable Google and add both local and production callback URLs in **Redirect URLs**: `http://localhost:3000/auth/callback` and `https://YOUR_DOMAIN/auth/callback`.
5. Add the Supabase URL and anonymous key to `.env.local`, following `.env.example`. Add `RESEND_KEY` too.
6. Before an organizer signs in, allowlist their specific address in the SQL editor:

   ```sql
   insert into public.organizer_allowlist (email) values ('organizer@your-domain.com');
   ```

7. Replace the temporary decision copy in `src/lib/application-emails.ts` with the approved acceptance and rejection emails before sending live decisions. Hacker and mentor tracks already use separate subjects and body copy.

Organizers sign in at `/organizers/sign-in`. The console at `/organizers` lists live applications from Supabase (hackers and mentors). Open an applicant to score each answer, then accept or reject from the review screen or in bulk from the list — each decision emails the applicant immediately. A direct visit to `/organizers`, direct Server Action request, or direct database request is denied unless the signed-in person is an allowlisted organizer.
