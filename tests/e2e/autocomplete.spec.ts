import { expect, test } from '@playwright/test';

test('WordPress function autocomplete appears in editor', async ({ page }) => {
    await page.goto('/');

    // Wait for the editor to be ready
    const editor = page.getByRole('code').nth(0);
    await expect(editor).toBeVisible();

    // Clear the editor
    await editor.click();
    await page.keyboard.press('Control+KeyA');
    await page.keyboard.press('Backspace');

    // Type the opening PHP tag
    await page.keyboard.type('<?php ');

    // Start typing a WordPress function to trigger autocomplete
    await page.keyboard.type('get_opt');

    // Wait for the autocomplete suggestion list to appear
    // Monaco editor uses aria-label="Editor content" for the suggestion widget
    const suggestion = page.locator('.monaco-list-row').filter({ hasText: 'get_option' });

    // Check if the autocomplete suggestion appears
    await expect(suggestion).toBeVisible({ timeout: 5000 });

    // Verify it shows the function detail
    await expect(suggestion).toContainText('get_option');
});

test('WordPress function autocomplete can be selected', async ({ page }) => {
    test.slow();

    await page.goto('/');

    // Wait for the editor to be ready
    const editor = page.getByRole('code').nth(0);
    await expect(editor).toBeVisible();

    // Clear the editor
    await editor.click();
    await page.keyboard.press('Control+KeyA');
    await page.keyboard.press('Backspace');

    // Type the opening PHP tag
    await page.keyboard.type('<?php ');

    // Start typing a WordPress function
    await page.keyboard.type('wp_enqueue_scr');

    // Wait for autocomplete to appear
    await page.waitForSelector('.monaco-list-row', { timeout: 5000 });

    // Press Enter to select the first suggestion
    await page.keyboard.press('Enter');

    // Verify the function was inserted (check for opening parenthesis)
    const editorContent = await editor.textContent();
    expect(editorContent).toContain('wp_enqueue_script');
});
