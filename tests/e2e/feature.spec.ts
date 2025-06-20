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
    await page.goto('/');

    const outputPre = page.locator('pre#output-pre');
    await expect(outputPre).toBeVisible();

    await expect(outputPre.getByText('Hello, World!')).toBeVisible();
});

test('run custom code', async ({ page }) => {
    await page.goto('/');

    // Replace all the text in the editor with our test code.
    const editor = page.getByRole("code").nth(0);
    await editor.click();
    await page.keyboard.press('Control+KeyA');
    await page.keyboard.type('<?php echo "Example test here\n";\n');

    // Test that WordPress is loaded and available.
    await page.keyboard.type('echo "WordPress Loaded: " . ( function_exists("get_option") ? "Yes" : "No" ); ?>');

    const outputPre = page.locator('pre#output-pre');
    await expect(outputPre).toBeVisible();

    // Ensure the default output is still visible.
    await expect(outputPre.getByText('Hello, World!')).toBeVisible();

    // Run the code and wait for the output to appear.
    await page.getByTestId('run-code-button').click();

    await expect(outputPre.getByText('Example test here')).toBeVisible();
    await expect(outputPre.getByText('WordPress Loaded: Yes')).toBeVisible();
});
