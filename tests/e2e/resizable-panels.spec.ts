import { expect, test } from '@playwright/test';

test.describe('Resizable Panels', () => {
    test('displays panels side by side on desktop', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // Check that the resizable panel group is visible on desktop
        const panelGroup = page.locator('[role="separator"]').first();
        await expect(panelGroup).toBeVisible();

        // Verify both editor and output panels are visible
        const editor = page.getByRole('code').first();
        await expect(editor).toBeVisible();

        const outputTab = page.getByRole('tab', { name: 'Output' });
        await expect(outputTab).toBeVisible();
    });

    test('displays panels stacked on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // The panel separator should not exist on mobile (not rendered, not just hidden)
        const panelSeparator = page.locator('[role="separator"]').first();
        await expect(panelSeparator).not.toBeAttached();

        // Both editor and output should still be accessible in stacked layout
        const editor = page.getByRole('code').first();
        await expect(editor).toBeVisible();

        const outputTab = page.getByRole('tab', { name: 'Output' });
        await expect(outputTab).toBeVisible();
    });

    test('panels maintain functionality on mobile', async ({ page }) => {
        test.slow();

        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Wait for the editor to be ready
        const editor = page.getByRole('code').first();
        await editor.click();
        await page.keyboard.press('Control+KeyA');
        await page.keyboard.type('<?php echo "Mobile test"; ?>');

        // Run the code
        await page.getByTestId('run-code-button').click();

        // Verify output appears in the stacked layout
        const outputPre = page.locator('pre#output-pre');
        await expect(outputPre).toBeVisible({ timeout: 30000 });
        await expect(outputPre.getByText('Mobile test')).toBeVisible();
    });
});
