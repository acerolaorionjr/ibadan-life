# Ibadan Life multiplayer setup

## Research decisions

Lagos Life's official site lists account-based saves, public chat rooms, venue chat, direct messages and online presence. Supabase documents Realtime Broadcast/Presence and recommends RLS for authorization. Ibadan Life uses database-backed room/DM messages with RLS plus private Realtime Presence channels.

References:
- https://lagoslife.com.ng/
- https://lagoslife.com.ng/privacy
- https://supabase.com/docs/guides/realtime/authorization
- https://supabase.com/docs/guides/realtime/presence
- https://supabase.com/docs/guides/database/secure-data

## Important isolation rule

Do **not** apply `supabase/ibadan_life_multiplayer.sql` to Acerola AI's Supabase project. Create a dedicated Supabase project for Ibadan Life first. The game repository currently has no safe dedicated backend credentials/configuration.

## Configure the dedicated project

1. Create a Supabase project specifically for Ibadan Life.
2. In its SQL Editor, run the full contents of `supabase/ibadan_life_multiplayer.sql`.
3. In Auth settings, enable email/password sign-in and configure the allowed site URL and redirect URL for the deployed Ibadan Life site.
4. In Realtime settings, disable **Allow public access** so the Presence topic is private. Keep Realtime enabled.
5. Copy the project URL and **publishable** key (or legacy anon/public key if that project still uses it). Never use a service-role or secret key in browser code.
6. Put the values in `multiplayer-config.js`:
   ```js
   window.IBADAN_SUPABASE_CONFIG = {
     url: "https://YOUR_PROJECT_REF.supabase.co",
     publishableKey: "sb_publishable_..."
   };
   ```
7. Deploy the site, sign up with two test accounts in separate browsers, join Town Square, and verify that a message sent in one browser appears in the other. Test a DM, block/report, and refresh/save restore before public launch.

## What the code provides

- Sign-up and sign-in via Supabase Auth
- Server-created player profiles and authenticated profile directory
- Public/venue room chat with server-side message history
- Direct messages, online presence, block/report controls
- Row Level Security on profiles, saves, rooms, messages, DMs and reports
- A separate cloud-save table, reserved for the next save/restore integration step

## Current limitation

The game is not live-multiplayer until the dedicated project is configured and the two-account acceptance test passes. This repository does not include a project secret, and the browser must never receive a service-role key. Cloud-save syncing and multiplayer avatar movement are follow-on work; the existing game remains playable as a local single-player build.
