import { ChevronDown, DollarSign } from 'lucide-react';
import { useCurrency, CURRENCIES, type Currency } from '../../context/CurrencyContext';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        onClick={() => {
          const dropdown = document.getElementById('currency-dropdown');
          dropdown?.classList.toggle('hidden');
        }}
      >
        <DollarSign className="h-4 w-4 text-slate-500" />
        <span className="font-mono text-sm">{currency.symbol}</span>
        <span className="hidden sm:inline">{currency.code}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      <div
        id="currency-dropdown"
        className="absolute right-0 z-10 mt-2 hidden w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      >
        <div className="py-1">
          {Object.values(CURRENCIES).map((curr) => (
            <button
              key={curr.code}
              type="button"
              className={`flex w-full items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 ${
                curr.code === currency.code ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
              }`}
              onClick={() => {
                setCurrency(curr.code as Currency);
                const dropdown = document.getElementById('currency-dropdown');
                dropdown?.classList.add('hidden');
              }}
            >
              <span className="font-mono text-base">{curr.symbol}</span>
              <div className="flex flex-col items-start">
                <span className="font-medium">{curr.code}</span>
                <span className="text-xs text-slate-500">{curr.name}</span>
              </div>
              {curr.code === currency.code && (
                <div className="ml-auto h-2 w-2 rounded-full bg-indigo-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}