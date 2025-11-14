import { test, expect } from "@playwright/test";

test.describe("Storybook Components", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:6006");
  });

  test("EmptyContent component should render correctly", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-emptycontent--default"
    );

    // Check if the component is visible
    await expect(page.locator('[data-testid="empty-content"]')).toBeVisible();

    // Check if title is displayed
    await expect(page.getByText("데이터 없음")).toBeVisible();
  });

  test("LoadingScreen component should render correctly", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-loadingscreen--default"
    );

    // Check if loading progress is visible
    await expect(page.locator(".MuiLinearProgress-root")).toBeVisible();
  });

  test("Label component should render correctly", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-label--default"
    );

    // Check if label is visible
    await expect(page.getByText("Label")).toBeVisible();
  });

  test("Iconify component should render correctly", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-iconify--default"
    );

    // Check if icon is visible
    await expect(page.locator("svg")).toBeVisible();
  });

  test("Logo component should render correctly", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-logo--single"
    );

    // Check if logo is visible
    await expect(page.locator("img")).toBeVisible();
  });

  test("Accessibility check for EmptyContent", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-emptycontent--default"
    );

    // Check for proper alt text
    await expect(page.locator("img")).toHaveAttribute("alt", "Empty content");
  });

  test("Responsive design check", async ({ page }) => {
    await page.goto(
      "http://localhost:6006/?path=/story/components-emptycontent--default"
    );

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="empty-content"]')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="empty-content"]')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[data-testid="empty-content"]')).toBeVisible();
  });
});
