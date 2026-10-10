# Ibadan Life

**A mobile-first 3D life simulation set in Ibadan, Nigeria.**

Play: https://acerolaorionjr.github.io/ibadan-life/

## Included
- 3D Ibadan-inspired city with roads, homes, offices, original market stalls, a bus stop, street lights, moving traffic and a day/night cycle.
- NPCs move between home areas, markets, campus and city destinations as the in-game day changes.
- Rent a city billboard for seven in-game days to advertise an owned business using game currency.
- Nearby NPC conversations with persistent friendship progress and social rewards.
- Objective-based city missions with visible destination markers and in-game rewards.
- Five-level career progression with shift XP, promotions and increasing pay.
- Personal vehicle garage, vehicle ownership and drive/park controls.
- Housing tiers, weekly rent, rent arrears and home upgrades.
- Touch controls for movement and camera rotation.
- Five starting backgrounds: Lapo, Average, Comfortable, Nepo Baby and Wealthy.
- Character-start choices affect money, debt, family support, home, vehicle, reputation and starting location.
- In-game phone with Jobs, Messages, Bank, Ride, Boutique, Food, Business, Advertising, Investments, Map, Travel, Events, Missions, Garage and Housing.
- Buy mode / catalogue and local browser persistence.
- Installable progressive web app support.

## Run locally
Serve this folder with any static HTTP server and open `index.html` through that server. Three.js is loaded from jsDelivr, so the first load requires an internet connection.

## Deployment
This repository deploys independently to GitHub Pages through `.github/workflows/deploy-pages.yml`.

## Verification status
GitHub Actions checks JavaScript syntax, required files and a mobile-browser smoke test covering game start, Buy Mode/save persistence, missions, garage/vehicle controls, NPC friendship, housing, business ownership and billboard rental. Real-device gameplay, performance and touch controls should still be tested in Android Chrome after deployment.
