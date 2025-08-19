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
        await page.goto("http://localhost:8082", wait_until="commit", timeout=10000)
        
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
        # Wait for page to load and check for login form
        await page.wait_for_timeout(3000)
        
        # Look for login form elements
        email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]')
        password_input = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"], input[placeholder*="Password"]')
        login_button = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')
        
        # Check if elements exist and are visible
        if await email_input.count() > 0 and await email_input.is_visible():
            await email_input.fill("wrong@example.com")
            print("Wrong email entered successfully")
        else:
            print("Email input not found")
            
        if await password_input.count() > 0 and await password_input.is_visible():
            await password_input.fill("WrongPassword123!")
            print("Wrong password entered successfully")
        else:
            print("Password input not found")
            
        if await login_button.count() > 0 and await login_button.is_visible():
            await login_button.click()
            print("Login button clicked with wrong credentials")
        else:
            print("Login button not found")
        
        # Wait for response and check for error
        await page.wait_for_timeout(5000)
        
        # Check if error message is displayed
        current_url = page.url
        print(f"Current URL after failed login attempt: {current_url}")
        
        # Look for error messages
        error_messages = page.locator('text="invalid", text="error", text="wrong", text="incorrect", [role="alert"], .error, .error-message')
        
        if await error_messages.count() > 0:
            print("Error message found - login correctly failed")
        elif "error" in current_url.lower():
            print("Error in URL - login correctly failed")
        else:
            print("No error message found - login may have succeeded unexpectedly")
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    