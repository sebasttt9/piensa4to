import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'PEN' | 'MXN' | 'COP' | 'ARS' | 'CLP' | 'BRL';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar estadounidense', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol peruano', locale: 'es-PE' },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso mexicano', locale: 'es-MX' },
  COP: { code: 'COP', symbol: '$', name: 'Peso colombiano', locale: 'es-CO' },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso argentino', locale: 'es-AR' },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso chileno', locale: 'es-CL' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real brasileño', locale: 'pt-BR' },
};

interface CurrencyContextType {
  currency: CurrencyInfo;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'datapulse.currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<Currency>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as Currency) || 'USD';
  });

  const currency = CURRENCIES[currencyCode];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currencyCode);
  }, [currencyCode]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyCode(newCurrency);
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}