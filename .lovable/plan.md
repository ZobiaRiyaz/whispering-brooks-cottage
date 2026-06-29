## Chalet Rivera — Admin Dashboard Build Plan

### 1. Backend (Lovable Cloud)
Create these tables via migration:
- **inquiries** — guest submissions: name, email, phone, check_in, check_out, guests, message, status (`new` / `contacted` / `confirmed` / `declined`), admin_notes, created_at
- **blocked_dates** — admin-blocked date ranges: start_date, end_date, reason
- **cottage_content** — single-row editable site content: hero_headline, hero_subtitle, description, amenities (jsonb), gallery (jsonb), contact_email
- **user_roles** + `app_role` enum (`admin`) + `has_role()` security-definer function — secure role storage (never on profile table)

RLS:
- `inquiries` — anyone can INSERT (public form); only admins can SELECT/UPDATE
- `blocked_dates` — public SELECT (so calendar can show availability); admin write
- `cottage_content` — public SELECT; admin UPDATE
- `user_roles` — admin-only writes; users read their own

### 2. Authentication
- Email + password + Google sign-in (managed Google OAuth, no setup needed by you)
- Public `/auth` page (sign in / sign up)
- Protected `_authenticated/admin/*` routes gated by `has_role('admin')`
- First user to sign up is auto-promoted to admin (via trigger), subsequent users are non-admin

### 3. Public site changes
- Booking inquiry form on `/` now saves to `inquiries` table
- Inline date picker checks `blocked_dates` and disables unavailable ranges
- Site copy (hero, description, amenities) read from `cottage_content`, so edits in admin appear immediately
- Email notification sent to your address on each new inquiry (via Lovable Emails — built-in, no third-party setup)

### 4. Admin dashboard (`/admin`)
Sidebar layout with these pages:
- **Dashboard** — stats: total inquiries, new (unread), upcoming confirmed stays, occupancy this month
- **Inquiries** — table with filter by status; row click opens detail drawer to update status + notes
- **Calendar** — month view; click-drag to block dates; shows confirmed bookings + manual blocks
- **Content** — form to edit hero text, description, amenities list, contact email
- **Sign out** button in sidebar

### 5. Technical notes
- TanStack Start server functions (`createServerFn`) for all admin writes, with `requireSupabaseAuth` middleware + role check
- Public reads (cottage content, blocked dates) via publishable-key server client
- Form validation with Zod
- Email via Lovable's built-in email infrastructure — I'll set up the domain prerequisite; you'll see a "Set up email domain" prompt to point a subdomain (the email notification won't actually send until that's verified, but everything else works)

### 6. Out of scope (ask if you want these added)
- Payment / deposit collection
- iCal export to sync with Airbnb/Booking.com
- Guest-facing account login (current design = guests submit inquiry, admin manages)
- Multiple admins / inviting other admins

I'll build this end-to-end if the plan looks good. Want me to proceed?
