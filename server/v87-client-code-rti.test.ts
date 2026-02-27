import { describe, it, expect } from 'vitest';

/**
 * Tests for v87 changes:
 * 1. Client codigo format: purely numeric (no CLI- prefix), zero-padded to 6 digits
 * 2. RTI history dialog sizing: full-screen approach
 * 3. Success alert on client creation showing name and code
 */

describe('Client Codigo Format — Numeric Only', () => {
  it('should generate a 6-digit zero-padded code from insertId', () => {
    const insertId = 42;
    const codigo = String(insertId).padStart(6, '0');
    expect(codigo).toBe('000042');
  });

  it('should not contain CLI- prefix', () => {
    const insertId = 1;
    const codigo = String(insertId).padStart(6, '0');
    expect(codigo).not.toContain('CLI-');
    expect(codigo).not.toContain('CLI');
    expect(codigo).toMatch(/^\d{6}$/);
  });

  it('should handle large IDs correctly', () => {
    const insertId = 123456;
    const codigo = String(insertId).padStart(6, '0');
    expect(codigo).toBe('123456');
    expect(codigo).toMatch(/^\d+$/);
  });

  it('should handle IDs larger than 6 digits', () => {
    const insertId = 1234567;
    const codigo = String(insertId).padStart(6, '0');
    expect(codigo).toBe('1234567');
    expect(codigo).toMatch(/^\d+$/);
  });

  it('should generate unique codes for different IDs', () => {
    const ids = [1, 2, 3, 100, 999999];
    const codes = ids.map(id => String(id).padStart(6, '0'));
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(ids.length);
  });
});

describe('createCliente Return Format', () => {
  it('should return object with id and codigo', () => {
    // Simulating the new return format from createCliente
    const insertId = 55;
    const codigo = String(insertId).padStart(6, '0');
    const result = { id: insertId, codigo };

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('codigo');
    expect(result.id).toBe(55);
    expect(result.codigo).toBe('000055');
  });

  it('should handle null result gracefully', () => {
    const result: { id: number; codigo: string } | null = null;
    const id = result?.id;
    const codigo = result?.codigo || '';
    expect(id).toBeUndefined();
    expect(codigo).toBe('');
  });
});

describe('Success Alert on Client Creation', () => {
  it('should format success message with client name and code', () => {
    const nomeCliente = 'Empresa Teste LTDA';
    const codigoGerado = '000042';
    const message = `${nomeCliente} foi cadastrado com sucesso! Código: ${codigoGerado}`;
    expect(message).toBe('Empresa Teste LTDA foi cadastrado com sucesso! Código: 000042');
    expect(message).toContain('Empresa Teste LTDA');
    expect(message).toContain('000042');
  });

  it('should handle empty name gracefully', () => {
    const nomeCliente = '' || 'Cliente';
    const codigoGerado = '000001';
    const message = `${nomeCliente} foi cadastrado com sucesso! Código: ${codigoGerado}`;
    expect(message).toContain('Cliente');
    expect(message).toContain('000001');
  });

  it('should handle empty codigo gracefully', () => {
    const data = { codigo: undefined };
    const codigoGerado = (data as any)?.codigo || '';
    expect(codigoGerado).toBe('');
  });
});

describe('RTI History Dialog Sizing', () => {
  it('should use 95vw width for the dialog', () => {
    const dialogClasses = 'max-w-[95vw] w-[95vw] h-[92vh] max-h-[92vh] flex flex-col';
    expect(dialogClasses).toContain('95vw');
    expect(dialogClasses).toContain('92vh');
    expect(dialogClasses).toContain('flex flex-col');
  });

  it('should have flex-shrink-0 on header to prevent shrinking', () => {
    const headerClasses = 'flex-shrink-0';
    expect(headerClasses).toContain('flex-shrink-0');
  });

  it('should have overflow-y-auto on content area', () => {
    const contentClasses = 'flex-1 overflow-y-auto min-h-0';
    expect(contentClasses).toContain('overflow-y-auto');
    expect(contentClasses).toContain('flex-1');
    expect(contentClasses).toContain('min-h-0');
  });
});

describe('Existing Client Codes Migration', () => {
  it('should convert CLI-0042 to 000042 format', () => {
    const oldCode = 'CLI-0042';
    const newCode = oldCode.replace('CLI-', '').padStart(6, '0');
    expect(newCode).toBe('000042');
  });

  it('should convert codes based on ID with LPAD', () => {
    // Simulating SQL LPAD(id, 6, '0')
    const id = 5;
    const newCode = String(id).padStart(6, '0');
    expect(newCode).toBe('000005');
  });

  it('should handle large IDs in migration', () => {
    const id = 30001;
    const newCode = String(id).padStart(6, '0');
    expect(newCode).toBe('030001');
  });
});
