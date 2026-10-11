"""Broad live-site exploratory QA for Ibadan Life.
Set IBADAN_LIFE_URL to enable; otherwise skipped during source-only validation.
"""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import pytest
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None
URL = os.environ.get("IBADAN_LIFE_URL", "")
pytestmark = pytest.mark.skipif(sync_playwright is None or not URL, reason="Set IBADAN_LIFE_URL to run live browser QA")

def test_mobile_life_simulation_exploration():
    parts = urlsplit(URL)
    query = dict(parse_qsl(parts.query))
    query["qa_agent"] = "1"
    url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))
    results = {"tested_apps": [], "tested_actions": [], "tested_tabs": [], "runtime_errors": []}
    out = Path("qa-output")
    out.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"])
        context = browser.new_context(viewport={"width": 360, "height": 800}, screen={"width": 360, "height": 800}, is_mobile=True, has_touch=True)
        page = context.new_page()
        page.on("pageerror", lambda error: results["runtime_errors"].append(str(error)))
        page.on("console", lambda msg: results["runtime_errors"].append("console.error: " + msg.text) if msg.type == "error" else None)
        try:
            response = page.goto(url, wait_until="domcontentloaded", timeout=60000)
            assert response is not None and response.status < 400, f"HTTP failure: {response.status if response else 'no response'}"
            page.locator("#startScreen").wait_for(state="visible", timeout=30000)
            page.locator("#characterName").fill("QA Agent")
            page.locator("#characterGender").select_option("Woman")
            page.locator("#rollBackground").click()
            page.locator("#originReveal:not([hidden])").wait_for(state="visible", timeout=10000)
            page.locator("#startGame").click()
            page.wait_for_function("() => document.querySelector('#startScreen').style.display === 'none'", timeout=30000)
            page.wait_for_timeout(1200)
            for button in page.locator("[data-action]").all():
                action = button.get_attribute("data-action")
                if button.is_visible():
                    button.click(timeout=3000)
                    results["tested_actions"].append(action)
                    page.wait_for_timeout(120)
            assert page.locator("#money").inner_text().startswith("₦"), "Wallet display missing"
            app_names = page.locator("[data-app]").evaluate_all("(els) => els.map(e => e.dataset.app)")
            assert app_names, "No phone apps found"
            for name in app_names:
                page.locator("#phoneOverlay").evaluate("(el) => {el.classList.add('show'); el.setAttribute('aria-hidden','false')}")
                page.locator(f'[data-app="{name}"]').click(timeout=5000)
                heading = page.locator("#appPanel h3")
                assert heading.count() > 0 and heading.first.inner_text().strip(), f"App '{name}' failed to render a heading"
                results["tested_apps"].append({"app": name, "heading": heading.first.inner_text().strip()})
                # Try the primary action for each app. In a fresh test context,
                # any simulated purchases or edits cannot affect a real player.
                primary = page.locator(f'[data-app-action="{name}"]')
                if primary.count():
                    action_label = primary.first.inner_text().strip()
                    primary.first.click(timeout=5000)
                    results["tested_actions"].append(f"app:{name}:{action_label}")
                    if page.locator("#lifeModal.show").count():
                        choice = page.locator("#lifeChoices .choice")
                        if choice.count():
                            choice.first.click(timeout=5000)
                    if page.locator("#buyOverlay.show").count():
                        page.locator("#closeBuy").click(timeout=5000)
                    if page.locator("#lifeModal.show").count():
                        page.locator("#closeLife").click(timeout=5000)
                    page.wait_for_timeout(100)
            page.locator("#closePhone").click()
            for tab in page.locator(".bottom button").all():
                name = tab.get_attribute("data-tab")
                tab.click(timeout=5000)
                results["tested_tabs"].append(name)
                if name == "map":
                    assert page.locator("#appPanel h3").inner_text().strip(), "Map tab failed to render app panel"
                elif name == "phone":
                    page.locator("#phoneOverlay").wait_for(state="visible", timeout=5000)
                    page.locator("#closePhone").click()
                elif name == "shop":
                    page.locator("#buyOverlay.show").wait_for(state="visible", timeout=5000)
                    page.locator("#closeBuy").click()
                elif name == "home" and page.locator("#lifeModal.show").count():
                    page.locator("#closeLife").click()
            page.locator("#addMoney").click()
            page.locator('[data-app="profile"]').click()
            page.locator("#profileName").fill("QA Saved Profile")
            if page.locator("#profileTrait1").input_value() == page.locator("#profileTrait2").input_value():
                page.locator("#profileTrait2").select_option(label="Calm")
            page.locator("#profileForm button[type=submit]").click()
            assert page.evaluate("JSON.parse(localStorage.getItem('ibadanLifeSave') || 'null')") is not None, "Game save was not written"
            assert page.evaluate("JSON.parse(localStorage.getItem('ibadanLifeProfile') || 'null').name") == "QA Saved Profile", "Profile edit did not persist"
            page.screenshot(path=str(out / "mobile-game-final.png"), full_page=True)
            assert not results["runtime_errors"], "Browser errors: " + " | ".join(results["runtime_errors"])
            (out / "exploration.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
        except Exception:
            page.screenshot(path=str(out / "mobile-game-failure.png"), full_page=True)
            (out / "exploration.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
            raise
        finally:
            context.close()
            browser.close()
