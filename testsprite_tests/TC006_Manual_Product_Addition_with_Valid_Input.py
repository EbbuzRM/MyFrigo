import asyncio
from datetime import datetime, timedelta
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
        # Wait for page to load
        await page.wait_for_timeout(3000)
        
        # Look for add product button or navigation
        add_product_button = page.locator('button:has-text("Add"), button:has-text("Add Product"), button:has-text("+"), a:has-text("Add")')
        
        if await add_product_button.count() > 0 and await add_product_button.is_visible():
            await add_product_button.click()
            print("Add product button clicked")
        else:
            print("Add product button not found, trying direct navigation")
            # Try to navigate directly to add product page
            await page.goto("http://localhost:8081/add")
            await page.wait_for_timeout(3000)
        
        # Look for product form elements
        name_input = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="product"]')
        category_select = page.locator('select[name="category"], select[placeholder*="category"]')
        expiration_input = page.locator('input[name="expiration"], input[type="date"], input[placeholder*="expiration"]')
        submit_button = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add Product")')
        
        # Fill in product details
        if await name_input.count() > 0 and await name_input.is_visible():
            await name_input.fill("Test Product")
            print("Product name entered")
        else:
            print("Name input not found")
            
        if await category_select.count() > 0 and await category_select.is_visible():
            await category_select.select_option({ index: 0 })  # Select first option
            print("Category selected")
        else:
            print("Category select not found")
            
        if await expiration_input.count() > 0 and await expiration_input.is_visible():
            # Set expiration date to 7 days from now
            future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
            await expiration_input.fill(future_date)
            print("Expiration date entered")
        else:
            print("Expiration input not found")
            
        if await submit_button.count() > 0 and await submit_button.is_visible():
            await submit_button.click()
            print("Product form submitted")
        else:
            print("Submit button not found")
        
        # Wait for response and check for success
        await page.wait_for_timeout(5000)
        
        # Check if product was added
        current_url = page.url
        print(f"Current URL after product addition: {current_url}")
        
        # Look for success indicators
        success_indicators = page.locator('text="success", text="added", text="saved", .success, [role="alert"]')
        
        if await success_indicators.count() > 0:
            print("Success indicator found - product appears to have been added")
        elif "products" in current_url.lower() or "inventory" in current_url.lower():
            print("Redirected to products/inventory - product may have been added")
        else:
            print("No clear success indicator - check if product was added")
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    