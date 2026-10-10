import http.server
import socketserver
import threading
from pathlib import Path

import pytest

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None


@pytest.mark.skipif(sync_playwright is None, reason="Playwright is not installed")
def test_mobile_game_start_buy_mode_and_save():
    root = Path(__file__).resolve().parents[1]
    handler = lambda *args, **kwargs: http.server.SimpleHTTPRequestHandler(
        *args, directory=str(root), **kwargs
    )
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as server:
        port = server.server_address[1]
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--use-gl=swiftshader",
                        "--enable-webgl",
                        "--ignore-gpu-blocklist",
                    ],
                )
                context = browser.new_context(
                    viewport={"width": 390, "height": 844},
                    screen={"width": 390, "height": 844},
                    is_mobile=True,
                    has_touch=True,
                    service_workers="block",
                )
                page = context.new_page()
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{port}/index.html", wait_until="domcontentloaded")
                page.locator("#startScreen").wait_for(state="visible", timeout=15000)
                page.locator('.startOption[data-start="average"]').click()
                page.locator("#startGame").click()
                page.wait_for_function(
                    "() => document.querySelector('#startScreen').style.display === 'none'"
                )

                page.locator('.bottom button[data-tab="shop"]').click()
                page.locator("#buyOverlay.show").wait_for(state="visible")
                page.locator('[data-buy="plant"]').click()
                assert "plant" in page.evaluate("localStorage.getItem('ibadanLifeInventory') || ''")
                assert "₦20,500" in page.locator("#catalogueMoney").inner_text()

                page.locator('[data-buy="plant"]').click()
                assert "plant" not in page.evaluate("localStorage.getItem('ibadanLifeInventory') || ''")
                page.wait_for_timeout(3500)
                page.reload(wait_until="domcontentloaded")
                page.wait_for_function(
                    "() => document.querySelector('#startScreen').style.display === 'none'",
                    timeout=15000,
                )
                assert "₦20,500" in page.locator("#money").inner_text()

                page.locator('.bottom button[data-tab="phone"]').click()
                page.locator('.phoneGrid [data-app="jobs"]').click()
                page.locator('#appPanel [data-app-action="jobs"]').first.click()
                page.locator("#lifeModal.show").wait_for(state="visible")
                page.locator("#lifeChoices .choice").first.click()
                page.wait_for_function("Object.keys(JSON.parse(localStorage.getItem('ibadanLifeSave') || '{}').careerProgress || {}).length > 0")
                page.locator('.bottom button[data-tab="phone"]').click()
                page.locator('.phoneGrid [data-app="missions"]').click()
                page.locator('#appPanel [data-app-action="missions"]').click()
                page.locator("#lifeModal.show").wait_for(state="visible")
                page.locator("#lifeChoices .choice").first.click()
                page.wait_for_function("() => JSON.parse(localStorage.getItem('ibadanLifeSave') || '{}').activeMission === 'market-delivery'")
                assert "Bodija parcel delivery" in page.locator("#task").inner_text()

                page.locator('.bottom button[data-tab="phone"]').click()
                page.locator('.phoneGrid [data-app="vehicles"]').click()
                page.locator('#appPanel [data-app-action="vehicles"]').first.click()
                page.locator("#lifeModal.show").wait_for(state="visible")
                assert "Garage" in page.locator("#lifeTitle").inner_text()
                page.locator("#closeLife").click()

                page.locator('[data-action="drive"]').click()
                page.wait_for_function("() => JSON.parse(localStorage.getItem('ibadanLifeSave') || '{}').driving === true")
                page.locator('[data-action="drive"]').click()
                page.wait_for_function("() => JSON.parse(localStorage.getItem('ibadanLifeSave') || '{}').driving === false")
                page.keyboard.down("a")
                page.keyboard.down("s")
                page.wait_for_timeout(1400)
                page.keyboard.up("a")
                page.keyboard.up("s")
                page.locator('[data-action="interact"]').click()
                page.locator("#lifeModal.show").wait_for(state="visible")
                assert "Friendship level" in page.locator("#lifeDesc").inner_text()
                page.locator("#lifeChoices .choice").first.click()
                page.wait_for_function("Object.keys(JSON.parse(localStorage.getItem('ibadanLifeRelationships') || '{}')).length > 0")
                page.locator('.bottom button[data-tab="phone"]').click()
                page.locator('.phoneGrid [data-app="housing"]').click()
                page.locator('#appPanel [data-app-action="housing"]').first.click()
                page.locator("#lifeModal.show").wait_for(state="visible")
                assert "Modest apartment" in page.locator("#lifeTitle").inner_text()
                page.locator("#closeLife").click()

                page.evaluate("""() => {
                    const save = JSON.parse(localStorage.getItem('ibadanLifeSave') || '{}');
                    save.money = 500000;
                    localStorage.setItem('ibadanLifeSave', JSON.stringify(save));
                }""")
                page.reload(wait_until="domcontentloaded")
                page.wait_for_function(
                    "() => document.querySelector('#startScreen').style.display === 'none'",
                    timeout=15000,
                )
                page.locator('.bottom button[data-tab="phone"]').click()
                page.locator('.phoneGrid [data-app="business"]').click()
                page.locator('#appPanel [data-app-action="business"]').first.click()
                page.locator("#lifeModal.show").wait_for(state="visible")
                page.locator("#lifeChoices .choice").first.click()
                page.wait_for_function(
                    "() => JSON.parse(localStorage.getItem('ibadanLifeBusinesses') || '[]').length === 1"
                )
                page.locator('.bottom button[data-tab="phone"]').click()
                page.locator('.phoneGrid [data-app="advertise"]').click()
                page.locator('#appPanel [data-app-action="advertise"]').first.click()
                page.locator("#lifeModal.show").wait_for(state="visible")
                page.locator("#lifeChoices .choice").first.click()
                page.wait_for_function(
                    "() => JSON.parse(localStorage.getItem('ibadanLifeSave') || '{}').billboardAd === 'Mini-mart'"
                )
                assert not errors, "Browser runtime errors: " + " | ".join(errors)
                context.close()
                browser.close()
        finally:
            server.shutdown()
            thread.join(timeout=2)
