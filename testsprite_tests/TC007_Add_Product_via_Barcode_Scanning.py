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
        
        # Look for barcode scanning option
        barcode_button = page.locator('button:has-text("Barcode"), button:has-text("Scan"), button:has-text("Camera"), [data-testid*="barcode"], [data-testid*="scan"]')
        
        if await barcode_button.count() > 0 and await barcode_button.is_visible():
            await barcode_button.click()
            print("Barcode scanning option clicked")
        else:
            print("Barcode scanning button not found")
        
        # Wait for camera/scanner interface
        await page.wait_for_timeout(3000)
        
        # Simulate barcode scanning (mock a successful scan)
        # Look for scan result input or confirmation
        scan_result = page.locator('input[name="barcode"], input[placeholder*="barcode"], input[placeholder*="scan"]')
        
        if await scan_result.count() > 0 and await scan_result.is_visible():
            # Simulate scanning a barcode
            test_barcode = "123456789012"
            await scan_result.fill(test_barcode)
            print(f"Barcode {test_barcode} entered")
            
            # Look for confirm/submit button
            confirm_button = page.locator('button:has-text("Confirm"), button:has-text("Submit"), button:has-text("Add")')
            
            if await confirm_button.count() > 0 and await confirm_button.is_visible():
                await confirm_button.click()
                print("Barcode confirmation clicked")
            else:
                print("Confirm button not found")
        else:
            print("Barcode scan result input not found")
        
        # Wait for response and check for success
        await page.wait_for_timeout(5000)
        
        # Check if product was added
        current_url = page.url
        print(f"Current URL after barcode scan: {current_url}")
        
        # Look for success indicators
        success_indicators = page.locator('text="success", text="added", text="saved", .success, [role="alert"]')
        
        if await success_indicators.count() > 0:
            print("Success indicator found - product appears to have been added via barcode")
        elif "products" in current_url.lower() or "inventory" in current_url.lower():
            print("Redirected to products/inventory - product may have been added via barcode")
        else:
            print("No clear success indicator - check if product was added via barcode")
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    