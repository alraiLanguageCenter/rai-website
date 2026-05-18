# Supabase setup — step by step

Once these steps are done, the site will be fully wired: announcements show on the homepage, schedule entries appear in the Schedule section, the placement test loads its questions, bookings persist, and the admin panel works.

## 1. Create the Supabase project

1. Go to <https://supabase.com> and sign up (free).
2. Click **"New project"**.
3. Pick a name (e.g. `rai-language-center`), set a strong database password (save it somewhere — you won't need it for the website but you might want it later), choose the region closest to Latakia (Europe / Frankfurt is a good pick), and click **Create**.
4. Wait ~2 minutes for the project to provision.

## 2. Copy the keys you need

In the Supabase dashboard for your project:

1. Left sidebar → **Project Settings** → **Data API**.
2. You'll see three things to copy:

| Field on Supabase | Paste into `.env.local` as |
|---|---|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL` (same value, twice) |
| **`anon` `public` key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **`service_role` `secret` key** (click the eye icon to reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ The **service role key bypasses all security**. Never expose it in the browser, never commit it to git. It only lives in `.env.local` (already in `.gitignore`) and in your Cloudflare environment variables when you deploy.

Your `.env.local` should look something like this:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...long-string...
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...different-long-string...
IP_HASH_PEPPER=any-long-random-string-of-your-choice
```

Generate a random pepper with any password generator — 32+ characters. It is used to hash visitor IPs before storing them, so we never persist raw IP addresses.

## 3. Run the database migration

1. In Supabase, left sidebar → **SQL editor** → **New query**.
2. Open the file `supabase/migrations/20260519000000_init.sql` from this project, copy the entire contents, paste it into the SQL editor.
3. Click **Run**. You should see "Success. No rows returned." or similar.
4. Sidebar → **Table editor**: you should now see 9 tables (`announcements`, `assessment_bookings`, `contact_submissions`, `quiz_questions`, `quiz_levels`, `quiz_recommendations`, `quiz_attempts`, `schedule_entries`, `admin_users`).

The migration also seeds CEFR levels A1→C2, 15 sample placement questions in AR+EN, and 6 book recommendations — so the free placement test works immediately.

## 4. Create the Storage bucket for flyers

1. Sidebar → **Storage** → **New bucket**.
2. Name: `flyers`.
3. Toggle **Public bucket** ON.
4. Click **Create bucket**.

Then add a write policy so authenticated admins can upload:

5. Inside the `flyers` bucket, click **Policies** → **New policy** → **Get started quickly** → pick the template **"Give users access to a folder only to authenticated users"** or **"Allow uploads to anyone"** and customize:
   - Operation: **INSERT**
   - Target roles: `authenticated`
   - Definition: `bucket_id = 'flyers'`
6. Save.

(For the most permissive setup that just works, you can also pick the **"Allow access to JPG images in a public folder to anonymous users"** template and modify it.)

## 5. Authentication settings

1. Sidebar → **Authentication** → **URL Configuration**.
2. **Site URL**: paste your deployment URL when you have it (for local dev: `http://localhost:3100`).
3. **Redirect URLs**: add both `http://localhost:3100/admin` and your future production URL `https://yourdomain.com/admin`. Comma-separated.
4. Save.

## 6. Create the first admin user (Nouha)

The site uses **magic-link login** — no passwords.

1. Start the dev server: `pnpm start` (or `pnpm dev`).
2. Open <http://localhost:3100/admin/login>.
3. Enter Nouha's email and click **Send magic link**.
4. She'll receive an email from Supabase — clicking the link signs her in.
5. **But she still won't have admin access yet** because she's not in the `admin_users` allow-list. Promote her with one SQL statement:
   - Supabase sidebar → **SQL editor** → New query.
   - Run:
     ```sql
     insert into admin_users (id, email, role)
     select id, email, 'admin' from auth.users where email = 'her-actual-email@example.com';
     ```
   - That copies her user-ID from the auth table into the admin allow-list.
6. Refresh `/admin` — she's in.

To add more admins later, repeat that SQL with their email.

## 7. Add the env vars to your deploy target

When you deploy to Cloudflare (or anywhere else), add the same six env vars in the hosting dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IP_HASH_PEPPER`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `NEXT_PUBLIC_SITE_URL` (your real production URL — used inside emails for the logo + links)
- `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID` when you connect WhatsApp

## 8. Email-sending domain (optional but recommended for production)

Right now the `RESEND_FROM` is `onboarding@resend.dev` — that works for testing, but emails will always show "via resend.dev" and be flagged as test traffic.

For production:

1. In Resend → **Domains** → **Add Domain**.
2. Add `railanguagecenter.com` (or a sub-domain like `mail.railanguagecenter.com`).
3. Resend gives you 3-4 DNS records (SPF, DKIM, optional DMARC). Add them to your DNS provider.
4. Wait ~5-30 min for verification.
5. Update `.env.local`: `RESEND_FROM="Rai Language Center <noreply@railanguagecenter.com>"`.

That's it. Once these six steps are done, the site is 100% live with persisted data, admin login, working forms, and branded email notifications.

---

## Quick smoke test

After setup, in this order:

1. Hit <http://localhost:3100/ar> — homepage loads.
2. Submit the contact form at the bottom. Reload. In Supabase Table editor → `contact_submissions` — your row appears.
3. Take the free placement test — questions load from `quiz_questions`. Finish it. Enter your email and click "Send result". You receive a branded RLC email with your level + book list.
4. Submit a booking via the `#book` form. In `/admin/bookings` (after promoting yourself to admin), click **Approve + notify** → student receives a branded confirmation email (and a WhatsApp message if those env vars are set).
5. Create an Announcement in `/admin/announcements`, upload a flyer image, publish → the homepage now shows the announcement.

If any of these steps fail, the error message in the toast (top-right corner) or the server logs (`pnpm start` terminal) will tell you exactly what to fix.
