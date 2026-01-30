import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'PEN' | 'MXN' | 'COP' | 'ARS' | 'CLP' | 'BRL';

export interface CurrencyInfo {
  code: Currency;
  symbol: string;
  name: string;
  locale: string;
  rateToUSD: number; 
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar estadounidense', locale: 'en-US', rateToUSD: 1 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES', rateToUSD: 0.85 },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol peruano', locale: 'es-PE', rateToUSD: 3.75 },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso mexicano', locale: 'es-MX', rateToUSD: 18.50 },
  COP: { code: 'COP', symbol: '$', name: 'Peso colombiano', locale: 'es-CO', rateToUSD: 4100 },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso argentino', locale: 'es-AR', rateToUSD: 950 },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso chileno', locale: 'es-CL', rateToUSD: 950 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Real brasileño', locale: 'pt-BR', rateToUSD: 5.20 },
};

interface CurrencyContextType {
  currency: CurrencyInfo;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number, fromCurrency?: Currency) => string;
  convertAmount: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
  convertToCurrent: (amount: number, fromCurrency: Currency) => number;
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

  const convertAmount = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    // Convertir a USD primero, luego a la moneda destino
    const amountInUSD = amount / CURRENCIES[fromCurrency].rateToUSD;
    return amountInUSD * CURRENCIES[toCurrency].rateToUSD;
  };

  const convertToCurrent = (amount: number, fromCurrency: Currency): number => {
    return convertAmount(amount, fromCurrency, currencyCode);
  };

  const formatAmount = (amount: number, fromCurrency?: Currency): string => {
    // Si se especifica una moneda de origen, convertir primero
    const finalAmount = fromCurrency ? convertToCurrent(amount, fromCurrency) : amount;

    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
    }).format(finalAmount);
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatAmount, 
      convertAmount, 
      convertToCurrent 
    }}>
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