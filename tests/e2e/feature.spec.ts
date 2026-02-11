import { test, expect } from '@playwright/test';

test('displays the header', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toBeVisible();

    await expect(header.getByRole('heading', { name: 'REPL for WordPress' })).toBeVisible();
    await expect(header.getByText('WordPress Playground')).toBeVisible();

    await expect(header.getByRole('button', { name: 'Show Console' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Show Browser' })).toBeVisible();

    // Check if the "Share" button is visible and disabled.
    const shareButton = header.getByRole('button', { name: 'Share' });
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toBeDisabled();
});

test('displays the console when the button is clicked', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Error Console')).toBeHidden();

    const showButton = page.getByRole('button', { name: 'Show Console' });
    await expect(showButton).toBeVisible();
    await showButton.click();

    await expect(page.getByText('Error Console')).toBeVisible();

    // Close the console and check if it is hidden again.
    const closeButton = page.getByRole('button', { name: 'Hide Console' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(page.getByText('Error Console')).toBeHidden();
});

test('displays the browser when the button is clicked', async ({ page }) => {
    await page.goto('/');

    const showButton = page.getByRole('button', { name: 'Show Browser' });
    await expect(showButton).toBeVisible();
    await showButton.click();

    await expect(page.locator('iframe[title="WordPress Playground"]')).toBeVisible();

    // Close the browser and check if it is hidden again.
    const closeButton = page.getByRole('button', { name: 'Hide Browser' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(page.locator('iframe[title="WordPress Playground"]')).toBeHidden();
});

test('runs the default code', async ({ page }) => {
    test.slow();

    await page.goto('/');

    const outputPre = page.locator('pre#output-pre');
    await expect(outputPre).toBeVisible({ timeout: 30000 });

    await expect(outputPre.getByText('Hello, World!')).toBeVisible();
});

test('run custom code', async ({ page }) => {
    test.slow();

    await page.goto('/');

    // Replace all the text in the editor with our test code.
    const editor = page.getByRole("code").nth(0);
    await editor.click();
    await page.keyboard.press('Control+KeyA');
    await page.keyboard.type('<?php echo "Example test here\n";\n');

    // Test that WordPress is loaded and available.
    await page.keyboard.type('echo "WordPress Loaded: " . ( function_exists("get_option") ? "Yes" : "No" ); ?>');

    const outputPre = page.locator('pre#output-pre');
    await expect(outputPre).toBeVisible({ timeout: 30000 });

    // Ensure the default output is still visible.
    await expect(outputPre.getByText('Hello, World!')).toBeVisible();

    // Run the code and wait for the output to appear.
    await page.getByTestId('run-code-button').click();

    await expect(outputPre.getByText('Example test here')).toBeVisible();
    await expect(outputPre.getByText('WordPress Loaded: Yes')).toBeVisible();
});

test('displays the welcome panel with examples', async ({ page }) => {
    await page.goto('/');

    // The welcome panel should be visible with the heading
    const welcomeHeading = page.getByRole('heading', { name: 'Welcome to REPL for WordPress!' });
    await expect(welcomeHeading).toBeVisible();

    // Check that example buttons are visible
    await expect(page.getByRole('button', { name: /Query Posts/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Filter/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Shortcode/i })).toBeVisible();

    // Click on an example and verify it loads
    await page.getByRole('button', { name: /Query Posts/i }).click();

    // The welcome panel (both heading and the entire overlay) should disappear after clicking an example
    await expect(welcomeHeading).toBeHidden();
    
    // Verify that the welcome message text is also gone
    await expect(page.getByText('Get started with one of these examples')).toBeHidden();

    // The editor should now contain the example code
    const editor = page.getByRole("code").nth(0);
    await expect(editor).toContainText('WP_Query');
});

test('loads plugin from URL query parameter', async ({ page }) => {
    test.slow();

    // Navigate to the page with a plugin query parameter
    await page.goto('/?plugin=hello-dolly');

    // Wait for the playground to be ready - we can check for the output to appear
    const outputPre = page.locator('pre#output-pre');
    await expect(outputPre).toBeVisible({ timeout: 60000 });

    // Run a simple code to test that WordPress is loaded
    const editor = page.getByRole("code").nth(0);
    await editor.click();
    await page.keyboard.press('Control+KeyA');
    await page.keyboard.type('<?php\n');
    await page.keyboard.type('// Check if hello-dolly plugin is active\n');
    await page.keyboard.type('$plugins = get_option("active_plugins");\n');
    await page.keyboard.type('echo "Active plugins: " . implode(", ", $plugins);\n');
    await page.keyboard.type('?>');

    // Run the code
    await page.getByTestId('run-code-button').click();

    // Wait for the output and check if hello-dolly is mentioned
    await expect(outputPre).toContainText('hello-dolly', { timeout: 30000 });
});

test('loads theme from URL query parameter', async ({ page }) => {
    test.slow();

    // Navigate to the page with a theme query parameter
    await page.goto('/?theme=twentytwentyfour');

    // Wait for the playground to be ready
    const outputPre = page.locator('pre#output-pre');
    await expect(outputPre).toBeVisible({ timeout: 60000 });

    // Run code to check if the theme is installed
    const editor = page.getByRole("code").nth(0);
    await editor.click();
    await page.keyboard.press('Control+KeyA');
    await page.keyboard.type('<?php\n');
    await page.keyboard.type('// Check installed themes\n');
    await page.keyboard.type('$themes = wp_get_themes();\n');
    await page.keyboard.type('echo "Installed themes: " . implode(", ", array_keys($themes));\n');
    await page.keyboard.type('?>');

    // Run the code
    await page.getByTestId('run-code-button').click();

    // Wait for the output and check if twentytwentyfour is mentioned
    await expect(outputPre).toContainText('twentytwentyfour', { timeout: 30000 });
});

