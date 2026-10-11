# Ibadan Life — Test build checklist

This repository is an early mobile-first 3D life-simulation test build, not a finished commercial release. Do not describe a feature as working unless its acceptance check passes.

## Run the automated checks

GitHub Actions runs JavaScript syntax checks and the Playwright mobile smoke suite on pull requests. The smoke suite starts a fresh character, verifies the random background, checks local save/restore, buys and places furniture, opens jobs and missions, and tests NPC interaction.

Latest validation run: check the repository's Actions tab for the newest `Deploy Ibadan Life to GitHub Pages` run.

## Test on an Android phone

1. Open the deployed game in Chrome and let the first 3D scene finish loading.
2. Create a character; check that the starting background is random and that the character can be edited later.
3. Enter the game, tap the top `+` finance shortcut, and verify it opens the Bank panel rather than doing nothing.
4. Open Shop, buy a low-cost item, place it, refresh, and check that wallet and inventory persist.
5. Open Phone → My Account and save profile changes.
6. Test Jobs, Business, Advertise, Missions, Housing, Garage, Map and Travel. Record any action that only displays a placeholder or a planned-feature message.
7. Close and reopen the game. Confirm that the same life is restored.
8. Try portrait and landscape orientations and check that overlays can be closed without getting stuck.

## Current feature truth

- **Local save:** stored in this browser on this device. Clearing site data or changing devices can remove it.
- **Multiplayer/chat:** UI and SQL migration are prepared, but not live until a dedicated Ibadan Life backend is configured and two separate accounts pass a round-trip chat test.
- **Cloud saves:** database table exists in the migration; automatic cloud restore/sync has not been verified.
- **Advertising:** current in-game campaigns and billboards use fictional game money. They do not charge real businesses or generate revenue.
- **Real-money purchases/VIP/rewarded ads:** not connected. No payment or ad SDK should be treated as live.
- **Travel:** the current build has trip actions, but it does not yet provide a complete navigable simulation for every Nigerian state.
- **3D/mobile performance:** automated browser checks are not a substitute for testing on the Infinix Smart 6 and other real devices.

## Safety and release gates

- Keep Supabase URL and publishable key blank until a dedicated project is approved and configured. Never put a service-role/secret key in frontend code.
- Do not run the multiplayer SQL migration against Acerola AI's existing production project.
- Do not accept real-money payments until server-side verification, refunds, purchase restoration, transparent pricing, privacy disclosures and the required adult-owned payment arrangements are ready.
- Keep this test build free of paid services and unexpected charges.
