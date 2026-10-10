# Ibadan Life — Lagos Life Parity Roadmap

Last reviewed: 10 October 2026

This roadmap is a feature-by-feature engineering checklist for building an original Ibadan life simulator with comparable *breadth of gameplay* to Lagos Life. It is not a plan to copy Lagos Life's source code, artwork, text, or exact interface.

## Research baseline

The official Lagos Life site and Google Play listing currently describe:
- Six needs that change over time: hunger, energy, fun, social, hygiene, and bladder.
- Nine skills, 261 actions, 25 careers with five levels, 23 places, five homes, 61 furniture items, and 24 groceries.
- Six travel modes, route costs/time, and multiple Nigerian cities (Lagos, Abuja, and Port Harcourt).
- A weekly governor election whose policies affect fares, pay, and prices.
- Shared billboard and lagoon-plot rentals visible to other players.
- Traits, aspirations, wishes, moodlets, reward perks, radio stations, and events.
- Signed-in cloud saves, leaderboard, public chat rooms, venue chat, direct messages, and online presence; offline play is device-local and has no multiplayer chat.
- Account controls for blocking and reporting players.

Sources:
- https://lagoslife.com.ng/
- https://play.google.com/store/apps/details?id=com.greatcallie.lagoslife
- https://lagoslife.com.ng/support

## Current Ibadan Life source audit

The current game is a single-page Three.js/PWA game in `index.html` and `game.js`. It already includes a 3D city scene, touch/camera controls, NPCs, six needs, starting backgrounds, editable character profile, local save/restore, jobs and progression, housing/rent, vehicles, missions, a phone/app menu, buy mode, travel UI, business/advertising concepts, and NPC social interactions.

Important gaps verified in the current source:
- `Messages` currently opens scripted NPC interactions; it is not a player-to-player messaging system.
- Game saves are stored in browser `localStorage`; there is no cloud account/save sync in the game source.
- The game source contains no Supabase client, account authentication flow, realtime channel, or server-backed presence.
- A 3D city scene exists, but the gameplay breadth and content counts above have not yet reached Lagos Life's published scope.
- The source's current tests cover smoke-level gameplay flows; they do not prove real-device performance, multiplayer correctness, or production security.

## Implementation order

### P0 — Make multiplayer real and safe
- [ ] Choose a dedicated backend/project for Ibadan Life; do not mix game tables into Acerola AI's production data without an explicit decision.
- [ ] Create account registration/sign-in/sign-out and a stable player profile.
- [ ] Add server-backed save slots and safe local/offline reconciliation.
- [ ] Add realtime public rooms, venue rooms, direct messages, and online presence.
- [ ] Enforce server-side access rules; users may only read/write messages allowed by the room or conversation policy.
- [ ] Add block, report, mute, message limits, basic spam protection, and account/data deletion.
- [ ] Add a multiplayer test with two separate browser contexts/accounts. A single-client demo is not sufficient.

### P1 — Match core life-simulation depth
- [ ] Six needs decay over game time; every action has clear duration, cost, and effects.
- [ ] Expand skills and actions into a data-driven catalogue.
- [ ] Build a career ladder with multiple levels, skill requirements, shifts, XP, promotions, and predictable pay.
- [ ] Expand homes, rent cycles, furniture catalogue, storage, buy/place/sell/return flows, groceries, and cooking.
- [ ] Finish vehicle ownership, route pricing, travel time, traffic, and state-to-state travel.
- [ ] Add traits, aspirations, wishes, moodlets, perks, and events that change gameplay rather than acting as labels.

### P2 — Make Ibadan feel like Ibadan
- [ ] Add distinct, navigable neighbourhoods and recognizable public places (for example, Dugbe, Bodija, Mokola, UI, and Challenge) with locally grounded prices and routines.
- [ ] Add danfo/bus, keke, okada, walking, ride-hailing, and owned-vehicle route choices with time and fare trade-offs.
- [ ] Add market shopping, school/university life, offices, hospitals/clinics as non-graphic service locations, worship/community spaces, leisure venues, and local events.
- [ ] Add a day/week calendar, rent deadlines, recurring jobs, and city-wide price changes.
- [ ] Expand NPC schedules, relationships, dialogue, and consequences while keeping NPC interactions distinct from real-player chat.

### P3 — Shared economy and community
- [ ] Shared billboards and business listings with in-game prices, expiry, ownership, and anti-abuse validation.
- [ ] Player-owned businesses with costs, stock/services, revenue, reputation, and progression.
- [ ] Leaderboards and public profile options with privacy controls.
- [ ] Elections/policies that measurably affect fares, wages, and selected prices.
- [ ] Radio/audio options, notifications, daily rewards, achievements, and seasonal events where they add meaningful gameplay.

### P4 — Release quality
- [ ] Installable PWA and a documented Android packaging path.
- [ ] Small-screen UI, low-memory graphics settings, resilient offline play, and clear network status.
- [ ] Automated syntax and smoke tests on each deployment.
- [ ] Manual Android Chrome tests for touch, account flows, reconnects, save recovery, chat abuse controls, and performance.
- [ ] Privacy policy, community rules, support/reporting process, and clear purchase disclosures before public launch.

## Acceptance rules

A feature is **not complete** because a button or mock screen exists. Multiplayer requires two real accounts and a live round-trip test. Cloud saves require signing in on a second browser/device and recovering the same save. Purchases require verified server-side payment callbacks and must never trust a client-supplied balance. Every release should record what was tested and what remains unverified.
