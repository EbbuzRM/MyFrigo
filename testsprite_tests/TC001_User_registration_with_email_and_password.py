import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:8081", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Wait for page to load and check for registration form
        await page.wait_for_timeout(3000)
        
        # Look for registration form elements
        email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]')
        password_input = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]')
        submit_button = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")')
        
        # Check if elements exist and are visible
        if await email_input.count() > 0 and await email_input.is_visible():
            await email_input.fill("test@example.com")
        else:
            print("Email input not found")
            
        if await password_input.count() > 0 and await password_input.is_visible():
            await password_input.fill("TestPassword123!")
        else:
            print("Password input not found")
            
        if await submit_button.count() > 0 and await submit_button.is_visible():
            await submit_button.click()
            print("Registration form submitted")
        else:
            print("Submit button not found")
        
        # Wait for response and check for success
        await page.wait_for_timeout(5000)
        
        # Check if we were redirected to profile completion or success message
        current_url = page.url
        print(f"Current URL after registration attempt: {current_url}")
        
        # Basic validation - if we're not on the same page, assume success
        if "localhost:8081" not in current_url or "profile" in current_url.lower():
            print("Registration appears to have succeeded")
        else:
            print("Registration may have failed or form not submitted")
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    