import os
from playwright.sync_api import sync_playwright, expect

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Inject auth
        page.goto("http://localhost:4200")
        page.evaluate("localStorage.setItem('smuve_user_profile', '{\"name\":\"Test User\",\"rank\":\"Platinum Architect\"}')")
        page.reload()

        # Go to Tha Spot
        page.goto("http://localhost:4200/tha-spot")

        # Wait for content
        page.wait_for_selector('.game-grid', timeout=10000)

        # Take screenshot
        page.screenshot(path="final_tha_spot.png")
        print("Screenshot saved to final_tha_spot.png")

        browser.close()

if __name__ == "__main__":
    verify()
