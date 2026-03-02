import { useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  /** Raw numeric value as string with dot decimal (e.g. "1234.56") or number */
  value: string | number;
  /** Receives the raw numeric value as string with dot decimal (e.g. "1234.56") */
  onChange: (rawValue: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  /** Show R$ prefix inside the input. Default: true */
  showPrefix?: boolean;
}

/**
 * Formats cents (integer) to Brazilian currency display: R$ 1.234,56
 */
function formatFromCents(cents: number, includePrefix = true): string {
  if (cents === 0) return includePrefix ? 'R$ 0,00' : '0,00';
  const negative = cents < 0;
  const absCents = Math.abs(cents);
  const reais = Math.floor(absCents / 100);
  const centavos = absCents % 100;
  const reaisStr = reais.toLocaleString('pt-BR');
  const centavosStr = centavos.toString().padStart(2, '0');
  const prefix = includePrefix ? 'R$ ' : '';
  return `${negative ? '-' : ''}${prefix}${reaisStr},${centavosStr}`;
}

/**
 * Converts a raw value (string "1234.56" or number) to cents integer
 */
function toCents(raw: string | number): number {
  if (!raw && raw !== 0) return 0;
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * CurrencyInput — Input monetário com auto-formatação em Reais (BRL)
 * 
 * Ao digitar, o campo formata automaticamente com separadores de milhar (ponto),
 * vírgula decimal e duas casas decimais.
 * 
 * Exemplo de digitação: 1 → R$ 0,01 | 12 → R$ 0,12 | 123 → R$ 1,23 | 12345 → R$ 123,45
 * 
 * O valor armazenado internamente (rawValue passado ao onChange) é uma string numérica
 * com ponto decimal (ex: "1234.56") para compatibilidade com o backend.
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = 'R$ 0,00',
  className = '',
  disabled = false,
  id,
  showPrefix = true,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const toDisplay = useCallback((raw: string | number): string => {
    if (!raw && raw !== 0) return '';
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.-]/g, ''));
    if (isNaN(num) || num === 0) {
      // Check if the user typed something (raw string has digits)
      const digits = String(raw).replace(/\D/g, '');
      if (digits.length > 0) {
        const cents = parseInt(digits, 10);
        return formatFromCents(cents, showPrefix);
      }
      return '';
    }
    const cents = Math.round(num * 100);
    return formatFromCents(cents, showPrefix);
  }, [showPrefix]);

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
      className={cn('font-mono tabular-nums', className)}
      disabled={disabled}
      autoComplete="off"
    />
  );
}

export { formatFromCents, toCents };
export default CurrencyInput;
