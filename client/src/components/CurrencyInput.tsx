import { useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps {
  value: string | number;
  onChange: (rawValue: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * CurrencyInput — Input monetário com auto-formatação em Reais (BRL)
 * 
 * Ao digitar, o campo formata automaticamente com separadores de milhar (ponto),
 * vírgula decimal e duas casas decimais.
 * 
 * Exemplo de digitação: 1 → 0,01 → 12 → 0,12 → 123 → 1,23 → 1234 → 12,34 → 12345 → 123,45
 * 
 * O valor armazenado internamente (rawValue passado ao onChange) é uma string numérica
 * com ponto decimal (ex: "1234.56") para compatibilidade com o backend.
 */
export function CurrencyInput({ value, onChange, placeholder = 'R$ 0,00', className = '', disabled = false, id }: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert raw numeric value to display format
  const toDisplay = useCallback((raw: string | number): string => {
    if (!raw && raw !== 0) return '';
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.-]/g, ''));
    if (isNaN(num) || num === 0) {
      // Check if the user typed something (raw string has digits)
      const digits = String(raw).replace(/\D/g, '');
      if (digits.length > 0) {
        const cents = parseInt(digits, 10);
        return formatFromCents(cents);
      }
      return '';
    }
    // Convert to cents and format
    const cents = Math.round(num * 100);
    return formatFromCents(cents);
  }, []);

  function formatFromCents(cents: number): string {
    if (cents === 0) return 'R$ 0,00';
    const negative = cents < 0;
    const absCents = Math.abs(cents);
    const reais = Math.floor(absCents / 100);
    const centavos = absCents % 100;
    const reaisStr = reais.toLocaleString('pt-BR');
    const centavosStr = centavos.toString().padStart(2, '0');
    return `${negative ? '-' : ''}R$ ${reaisStr},${centavosStr}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const inputValue = e.target.value;
    // Extract only digits
    const digits = inputValue.replace(/\D/g, '');
    
    if (digits.length === 0) {
      onChange('');
      return;
    }

    const cents = parseInt(digits, 10);
    const numericValue = cents / 100;
    
    // Pass the raw numeric value as string with dot decimal
    onChange(numericValue.toFixed(2));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Allow: backspace, delete, tab, escape, enter, arrows
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
    
    // Allow only digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }

  const displayValue = toDisplay(value);

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}

export default CurrencyInput;
