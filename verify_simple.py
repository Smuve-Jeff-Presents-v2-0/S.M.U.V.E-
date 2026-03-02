from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:4200")
        page.evaluate("localStorage.setItem('smuve_user_profile', '{\"name\":\"Test User\",\"rank\":\"Platinum Architect\"}')")
        page.goto("http://localhost:4200/tha-spot")
        page.wait_for_timeout(5000)
        page.screenshot(path="tha_spot_final.png", full_page=True)
        browser.close()

if __name__ == "__main__":
    verify()
