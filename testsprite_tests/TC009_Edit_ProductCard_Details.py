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
        
        # Look for existing products in inventory
        product_cards = page.locator('.product-card, [data-testid*="product"], .item, .card')
        
        if await product_cards.count() > 0:
            # Click on first product card to edit
            first_product = product_cards.first()
            await first_product.click()
            print("First product card clicked for editing")
            
            # Wait for edit form to load
            await page.wait_for_timeout(3000)
            
            # Look for editable fields
            name_field = page.locator('input[name="name"], input[placeholder*="name"]')
            expiration_field = page.locator('input[name="expiration"], input[type="date"], input[placeholder*="expiration"]')
            category_field = page.locator('select[name="category"], input[name="category"]')
            
            # Edit product details
            if await name_field.count() > 0 and await name_field.is_visible():
                await name_field.fill("Updated Test Product")
                print("Product name updated")
            else:
                print("Name field not found for editing")
                
            if await expiration_field.count() > 0 and await expiration_field.is_visible():
                # Set new expiration date
                future_date = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
                await expiration_field.fill(future_date)
                print("Expiration date updated")
            else:
                print("Expiration field not found for editing")
                
            if await category_field.count() > 0 and await category_field.is_visible():
                await category_field.select_option({ index: 1 })  # Select second option
                print("Category updated")
            else:
                print("Category field not found for editing")
            
            # Look for save/update button
            save_button = page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Done")')
            
            if await save_button.count() > 0 and await save_button.is_visible():
                await save_button.click()
                print("Save button clicked")
            else:
                print("Save button not found")
            
            # Wait for save to complete
            await page.wait_for_timeout(3000)
            
            # Check if we're back on inventory page
            current_url = page.url
            print(f"Current URL after save: {current_url}")
            
            # Look for success indicators
            success_indicators = page.locator('text="saved", text="updated", .success, [role="alert"]')
            
            if await success_indicators.count() > 0:
                print("Success indicator found - product appears to have been updated")
            elif "products" in current_url.lower() or "inventory" in current_url.lower():
                print("Back on inventory page - product may have been updated")
            else:
                print("No clear success indicator - check if product was updated")
        else:
            print("No product cards found - cannot test editing")
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    