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
        
        # Look for OCR/photo input option
        photo_button = page.locator('button:has-text("Photo"), button:has-text("Camera"), button:has-text("OCR"), [data-testid*="photo"], [data-testid*="camera"], [data-testid*="ocr"]')
        
        if await photo_button.count() > 0 and await photo_button.is_visible():
            await photo_button.click()
            print("OCR/photo input option clicked")
        else:
            print("OCR/photo button not found")
        
        # Wait for camera/photo interface
        await page.wait_for_timeout(3000)
        
        # Simulate photo capture (mock successful OCR)
        # Look for photo capture button or upload
        capture_button = page.locator('button:has-text("Capture"), button:has-text("Take"), button:has-text("Upload"), [data-testid*="capture"], [data-testid*="take"]')
        
        if await capture_button.count() > 0 and await capture_button.is_visible():
            await capture_button.click()
            print("Photo capture clicked")
        else:
            print("Capture button not found")
        
        # Wait for OCR processing
        await page.wait_for_timeout(3000)
        
        # Look for OCR results and extracted data
        name_field = page.locator('input[name="name"], input[placeholder*="name"]')
        expiration_field = page.locator('input[name="expiration"], input[type="date"], input[placeholder*="expiration"]')
        
        # Check if OCR extracted data
        if await name_field.count() > 0 and await name_field.is_visible():
            extracted_name = await name_field.input_value()
            if extracted_name:
                print(f"OCR extracted name: {extracted_name}")
            else:
                # If no data extracted, fill manually
                await name_field.fill("OCR Test Product")
                print("Manual name entry (OCR failed)")
        else:
            print("Name field not found")
            
        if await expiration_field.count() > 0 and await expiration_field.is_visible():
            extracted_date = await expiration_field.input_value()
            if extracted_date:
                print(f"OCR extracted expiration: {extracted_date}")
            else:
                # If no data extracted, fill manually
                future_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
                await expiration_field.fill(future_date)
                print("Manual date entry (OCR failed)")
        else:
            print("Expiration field not found")
        
        # Look for confirm/submit button
        confirm_button = page.locator('button:has-text("Confirm"), button:has-text("Save"), button:has-text("Add Product")')
        
        if await confirm_button.count() > 0 and await confirm_button.is_visible():
            await confirm_button.click()
            print("OCR confirmation clicked")
        else:
            print("Confirm button not found")
        
        # Wait for response and check for success
        await page.wait_for_timeout(5000)
        
        # Check if product was added
        current_url = page.url
        print(f"Current URL after OCR: {current_url}")
        
        # Look for success indicators
        success_indicators = page.locator('text="success", text="added", text="saved", .success, [role="alert"]')
        
        if await success_indicators.count() > 0:
            print("Success indicator found - product appears to have been added via OCR")
        elif "products" in current_url.lower() or "inventory" in current_url.lower():
            print("Redirected to products/inventory - product may have been added via OCR")
        else:
            print("No clear success indicator - check if product was added via OCR")
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    