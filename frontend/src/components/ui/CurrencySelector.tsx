import { ChevronDown, DollarSign } from 'lucide-react';
import { useCurrency, CURRENCIES, type Currency } from '../../context/CurrencyContext';
import './CurrencySelector.css';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="currency-selector">
      <button
        type="button"
        className="currency-selector__button"
        onClick={() => {
          const dropdown = document.getElementById('currency-dropdown');
          dropdown?.classList.toggle('currency-selector__dropdown--hidden');
        }}
      >
        <DollarSign className="currency-selector__icon" />
        <span className="currency-selector__symbol">{currency.symbol}</span>
        <span className="currency-selector__code">{currency.code}</span>
        <ChevronDown className="currency-selector__chevron" />
      </button>

      <div
        id="currency-dropdown"
        className="currency-selector__dropdown currency-selector__dropdown--hidden"
      >
        <div className="currency-selector__dropdown-content">
          {Object.values(CURRENCIES).map((curr) => (
            <button
              key={curr.code}
              type="button"
              className={`currency-selector__option ${
                curr.code === currency.code ? 'currency-selector__option--active' : ''
              }`}
              onClick={() => {
                setCurrency(curr.code as Currency);
                const dropdown = document.getElementById('currency-dropdown');
                dropdown?.classList.add('currency-selector__dropdown--hidden');
              }}
            >
              <span className="currency-selector__option-symbol">{curr.symbol}</span>
              <div className="currency-selector__option-info">
                <span className="currency-selector__option-code">{curr.code}</span>
                <span className="currency-selector__option-name">{curr.name}</span>
              </div>
              {curr.code === currency.code && (
                <div className="currency-selector__option-indicator" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}