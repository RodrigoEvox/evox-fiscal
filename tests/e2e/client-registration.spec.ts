import { test, expect } from '@playwright/test';

test.describe('Client Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clientes');
  });

  test('should open Novo Cliente modal', async ({ page }) => {
    const novoClienteButton = page.locator('button:has-text("Novo Cliente")');
    await expect(novoClienteButton).toBeVisible();
    await novoClienteButton.click();
    
    // Modal should be visible
    const modal = page.locator('text=Novo Cliente');
    await expect(modal).toBeVisible();
  });

  test('should fill CNPJ and trigger lookup', async ({ page }) => {
    const novoClienteButton = page.locator('button:has-text("Novo Cliente")');
    await novoClienteButton.click();
    
    // Fill CNPJ field
    const cnpjInput = page.locator('input[placeholder*="CNPJ"]').first();
    await cnpjInput.fill('44041520000118');
    
    // Click Consultar button
    const consultarButton = page.locator('button:has-text("Consultar")');
    await expect(consultarButton).toBeVisible();
    await consultarButton.click();
    
    // Wait for API response and check if fields are filled
    await page.waitForTimeout(2000);
    
    // Check if PORTE field is filled
    const porteField = page.locator('input[placeholder*="Porte"]');
    const porteValue = await porteField.inputValue();
    expect(porteValue).toBeTruthy();
  });

  test('should display SITUAÇÃO CADASTRAL after CNPJ lookup', async ({ page }) => {
    const novoClienteButton = page.locator('button:has-text("Novo Cliente")');
    await novoClienteButton.click();
    
    const cnpjInput = page.locator('input[placeholder*="CNPJ"]').first();
    await cnpjInput.fill('44041520000118');
    
    const consultarButton = page.locator('button:has-text("Consultar")');
    await consultarButton.click();
    
    await page.waitForTimeout(2000);
    
    // Check if SITUAÇÃO CADASTRAL field is filled
    const situacaoField = page.locator('input[placeholder*="Situação"]');
    const situacaoValue = await situacaoField.inputValue();
    expect(situacaoValue).toBeTruthy();
  });

  test('should have Regime Tributário field with history', async ({ page }) => {
    const novoClienteButton = page.locator('button:has-text("Novo Cliente")');
    await novoClienteButton.click();
    
    // Check for Regime Tributário dropdown
    const regimeDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /Regime|regime/ });
    await expect(regimeDropdown.first()).toBeVisible();
    
    // Check for Histórico de Regimes section
    const historicoText = page.locator('text=Histórico de Regimes');
    await expect(historicoText).toBeVisible();
  });

  test('should allow adding regime history', async ({ page }) => {
    const novoClienteButton = page.locator('button:has-text("Novo Cliente")');
    await novoClienteButton.click();
    
    // Find and click the "Adicionar" button for regime history
    const adicionarButton = page.locator('button:has-text("Adicionar")').last();
    if (await adicionarButton.isVisible()) {
      await adicionarButton.click();
      
      // Check if form fields appear for adding regime
      const regimeInput = page.locator('input[placeholder*="regime"], select');
      await expect(regimeInput.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should validate modal size is large', async ({ page }) => {
    const novoClienteButton = page.locator('button:has-text("Novo Cliente")');
    await novoClienteButton.click();
    
    const modalContent = page.locator('[role="dialog"]');
    const boundingBox = await modalContent.boundingBox();
    
    // Modal should be large (at least 80% of viewport width)
    expect(boundingBox?.width).toBeGreaterThan(800);
  });
});
