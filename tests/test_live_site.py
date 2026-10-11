import os
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

import pytest

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None


@pytest.mark.skipif(sync_playwright is None or not os.environ.get("IBADAN_LIFE_URL"), reason="Set IBADAN_LIFE_URL to run deployed-site QA")
def test_deployed_game_starts_and_core_controls_work():
    base_url = os.environ["IBADAN_LIFE_URL"]
    parts = urlsplit(base_url)
    query = dict(parse_qsl(parts.query))
    query["test"] = "1"
    url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
        )
        context = browser.new_context(
            viewport={"width": 360, "height": 800},
            screen={"width": 360, "height": 800},
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        response = page.goto(url, wait_until="domcontentloaded", timeout=60000)
        assert response is not None and response.status < 400, f"Game URL returned HTTP {response.status if response else 'no response'}"
        page.locator("#startScreen").wait_for(state="visible", timeout=30000)
        page.locator("#characterName").fill("QA Test Player")
        page.locator("#characterGender").select_option("Woman")
        page.locator("#rollBackground").click()
        page.locator("#originReveal:not([hidden])").wait_for(state="visible", timeout=10000)
        page.locator("#startGame").click()
        page.wait_for_function(
            "() => document.querySelector('#startScreen').style.display === 'none'",
            timeout=30000,
        )

        # The finance shortcut should open the bank; it must not grant money on tap.
        before = page.evaluate("Number(document.querySelector('#money').innerText.replace(/[₦,]/g, ''))")
        page.locator("#addMoney").click()
        page.locator("#phoneOverlay.show").wait_for(state="visible", timeout=10000)
        assert "Bank" in page.locator("#appPanel h3").inner_text()
        after = page.evaluate("Number(document.querySelector('#money').innerText.replace(/[₦,]/g, ''))")
        assert after == before, f"Tapping the bank shortcut changed money unexpectedly: {before} -> {after}"
        page.locator("#closePhone").click()

        # Quick shift should pay once, then enforce its cooldown on rapid repeated taps.
        before_shift = page.evaluate("Number(document.querySelector('#money').innerText.replace(/[₦,]/g, ''))")
        page.locator('[data-action="work"]').click()
        after_first_shift = page.evaluate("Number(document.querySelector('#money').innerText.replace(/[₦,]/g, ''))")
        page.locator('[data-action="work"]').click()
        after_second_tap = page.evaluate("Number(document.querySelector('#money').innerText.replace(/[₦,]/g, ''))")
        assert after_first_shift in (before_shift, before_shift + 2500, before_shift + 3500), (
            f"Unexpected first shift balance: {before_shift} -> {after_first_shift}"
        )
        assert after_second_tap == after_first_shift, (
            f"Repeated quick-shift tap paid twice: {after_first_shift} -> {after_second_tap}"
        )

        # Capture runtime exceptions so the report fails on actual browser errors.
        assert not errors, "Browser runtime errors: " + " | ".join(errors)
        context.close()
        browser.close()
