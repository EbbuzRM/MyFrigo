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
        # Wait for page to load
        await page.wait_for_timeout(3000)
        
        # Look for existing products in inventory
        product_cards = page.locator('.product-card, [data-testid*="product"], .item, .card')
        
        if await product_cards.count() > 0:
            # Click on first product card to mark as consumed
            first_product = product_cards.first()
            await first_product.click()
            print("First product card clicked")
            
            # Wait for product details to load
            await page.wait_for_timeout(2000)
            
            # Look for consume/mark as consumed button
            consume_button = page.locator('button:has-text("Consume"), button:has-text("Mark as Consumed"), button:has-text("Eat"), [data-testid*="consume"], [data-testid*="eat"]')
            
            if await consume_button.count() > 0 and await consume_button.is_visible():
                await consume_button.click()
                print("Consume button clicked")
            else:
                print("Consume button not found")
            
            # Wait for confirmation or navigation
            await page.wait_for_timeout(3000)
            
            # Look for confirmation dialog
            confirm_button = page.locator('button:has-text("Yes"), button:has-text("Confirm"), button:has-text("OK")')
            
            if await confirm_button.count() > 0 and await confirm_button.is_visible():
                await confirm_button.click()
                print("Confirmation clicked")
            else:
                print("No confirmation dialog found")
            
            # Wait for consume action to complete
            await page.wait_for_timeout(3000)
            
            # Check if we're back on inventory page
            current_url = page.url
            print(f"Current URL after consume action: {current_url}")
            
            # Look for success indicators
            success_indicators = page.locator('text="consumed", text="marked", .success, [role="alert"]')
            
            if await success_indicators.count() > 0:
                print("Success indicator found - product appears to have been marked as consumed")
            elif "products" in current_url.lower() or "inventory" in current_url.lower():
                print("Back on inventory page - product may have been marked as consumed")
            else:
                print("No clear success indicator - check if product was marked as consumed")
            
            # Now test viewing consumption history
            # Look for history/navigation button
            history_button = page.locator('button:has-text("History"), a:has-text("History"), [data-testid*="history"]')
            
            if await history_button.count() > 0 and await history_button.is_visible():
                await history_button.click()
                print("History button clicked")
            else:
                # Try direct navigation to history page
                await page.goto("http://localhost:8081/history")
                await page.wait_for_timeout(3000)
            
            # Wait for history page to load
            await page.wait_for_timeout(3000)
            
            # Check if we're on history page
            current_url = page.url
            print(f"Current URL on history page: {current_url}")
            
            # Look for consumed products in history
            history_items = page.locator('.history-item, .consumed-item, [data-testid*="history"], [data-testid*="consumed"]')
            
            if await history_items.count() > 0:
                print(f"Found {await history_items.count()} items in consumption history")
            else:
                print("No items found in consumption history")
            
            # Look for specific product that was just consumed
            if "Test Product" in await page.content():
                print("Recently consumed product found in history")
            else:
                print("Recently consumed product not found in history")
                
        else:
            print("No product cards found - cannot test marking as consumed")
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    