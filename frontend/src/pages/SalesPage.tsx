import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  LineChart,
  Loader2,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  UserCircle2,
} from 'lucide-react';
import { commerceAPI, inventoryItemsAPI, type CommerceOverview, type InventoryItem } from '../lib/services';
import { useCurrency } from '../context/CurrencyContext';
import './SalesPage.css';

const RECENT_CUSTOMERS_STORAGE_KEY = 'datapulse:sales-recent-customers';

type RegisterSalePayload = {
  itemId: string;
  itemName: string;
  soldQuantity: number;
  customerLabel: string;
  currencyCode: string;
  unitPrice: number;
};

interface MetricCardConfig {
  key: string;
  label: string;
  value: string;
  helper: string;
  trend: number;
  icon: typeof DollarSign;
  tone: 'violet' | 'emerald' | 'amber';
}

type TrendDirection = 'up' | 'down' | 'neutral';

const formatPercent = (value: number): string => {
  if (!Number.isFinite(value) || value === 0) {
    return '0.0%';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const resolveTrend = (value: number): TrendDirection => {
  if (!Number.isFinite(value) || value === 0) {
    return 'neutral';
  }
  return value > 0 ? 'up' : 'down';
};

const resolveCurrencyCode = (code: string | undefined, fallback: string): string => {
  if (!code) {
    return fallback;
  }
  return code;
};

export function SalesPage() {
  const { formatAmount, currency } = useCurrency();
  const queryClient = useQueryClient();

  const [selectedItemId, setSelectedItemId] = useState('');
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [customerSelection, setCustomerSelection] = useState<string>('final');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [saleFeedback, setSaleFeedback] = useState<{ variant: 'success' | 'error'; message: string } | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(RECENT_CUSTOMERS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => (typeof value === 'string' ? value.trim() : ''))
          .filter((value) => value.length > 0);
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(RECENT_CUSTOMERS_STORAGE_KEY, JSON.stringify(recentCustomers));
    } catch {
      // ignore storage errors
    }
  }, [recentCustomers]);

  const {
    data: inventoryItems,
    isLoading: isInventoryLoading,
    isError: isInventoryError,
    error: inventoryError,
  } = useQuery<InventoryItem[], Error>({
    queryKey: ['inventory-items'],
    queryFn: inventoryItemsAPI.list,
    staleTime: 2 * 60 * 1000,
  });

  const saleableItems = useMemo<InventoryItem[]>(
    () => (inventoryItems ?? []).filter((item) => item.status === 'approved'),
    [inventoryItems],
  );

  const selectedItem = useMemo<InventoryItem | null>(() => {
    if (saleableItems.length === 0) {
      return null;
    }
    return saleableItems.find((item) => item.id === selectedItemId) ?? null;
  }, [saleableItems, selectedItemId]);

  useEffect(() => {
    if (selectedItemId && !saleableItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId('');
    }
  }, [saleableItems, selectedItemId]);

  useEffect(() => {
    setSaleQuantity(1);
  }, [selectedItemId]);

  const { data, isLoading, isError, error, refetch } = useQuery<CommerceOverview, Error>({
    queryKey: ['commerce-overview'],
    queryFn: commerceAPI.getOverview,
    staleTime: 5 * 60 * 1000,
  });

  const resolvedCurrency = resolveCurrencyCode(data?.currency, currency.code);

  const resolvedCustomerLabel = useMemo(() => {
    if (customerSelection === 'final') {
      return 'Consumidor final';
    }
    if (customerSelection === '__new__') {
      return customCustomerName.trim();
    }
    return customerSelection;
  }, [customerSelection, customCustomerName]);

  const saleTotal = useMemo(() => {
    if (!selectedItem) {
      return 0;
    }
    const unitPrice = Number.isFinite(selectedItem.pvp) ? selectedItem.pvp : 0;
    return unitPrice * saleQuantity;
  }, [selectedItem, saleQuantity]);

  const saleUnitPrice = selectedItem?.pvp ?? 0;
  const inventoryAvailable = selectedItem?.quantity ?? 0;
  const saleCustomerDisplay = resolvedCustomerLabel || 'Consumidor final';
  const currencyCodeForSale = resolvedCurrency as typeof currency.code;
  const hasSaleableItems = saleableItems.length > 0;

  const registerSaleMutation = useMutation<{
    orderId: string;
    orderTotal: number;
    currencyCode: string;
    quantity: number;
    remainingQuantity: number;
    registeredAt: string;
  }, Error, RegisterSalePayload>({
    mutationFn: async (payload) =>
      commerceAPI.registerSale({
        itemId: payload.itemId,
        quantity: payload.soldQuantity,
        unitPrice: payload.unitPrice,
        currencyCode: payload.currencyCode,
        customerLabel: payload.customerLabel,
      }),
    onSuccess: (result, payload) => {
      const totalFormatted = formatAmount(
        result.orderTotal,
        result.currencyCode as typeof currency.code,
      );
      setSaleFeedback({
        variant: 'success',
        message: `${result.quantity.toLocaleString('es-ES')} unidades de ${payload.itemName} registradas para ${payload.customerLabel}. Total vendido: ${totalFormatted}. Stock restante: ${result.remainingQuantity.toLocaleString('es-ES')} unidades.`,
      });
      if (payload.customerLabel !== 'Consumidor final') {
        setRecentCustomers((prev) => {
          const filtered = prev.filter((name) => name !== payload.customerLabel);
          return [payload.customerLabel, ...filtered].slice(0, 8);
        });
        setCustomerSelection(payload.customerLabel);
      } else {
        setCustomerSelection('final');
      }
      setCustomCustomerName('');
      setSelectedItemId('');
      setSaleQuantity(1);
      void queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      void refetch();
    },
    onError: (mutationError) => {
      const message =
        mutationError instanceof Error ? mutationError.message : 'No se pudo registrar la venta.';
      setSaleFeedback({
        variant: 'error',
        message,
      });
    },
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.monthlyRevenue.map((point) => ({
      label: point.label,
      revenue: point.revenue,
      orders: point.orders,
      customers: point.customers,
    }));
  }, [data]);

  const metrics = useMemo<MetricCardConfig[]>(() => {
    if (!data) return [];
    const { totals } = data;
    const formatCurrency = (amount: number) => formatAmount(amount, resolvedCurrency as typeof currency.code);

    return [
      {
        key: 'revenue',
        label: 'Ingresos del mes',
        value: formatCurrency(totals.revenueCurrent),
        helper: `Vs mes anterior ${formatPercent(totals.revenueChangePct)}`,
        trend: totals.revenueChangePct,
        icon: DollarSign,
        tone: 'violet',
      },
      {
        key: 'orders',
        label: 'Ordenes procesadas',
        value: totals.ordersCurrent.toLocaleString('es-ES'),
        helper: `Mes anterior ${totals.ordersPrevious.toLocaleString('es-ES')}`,
        trend: totals.ordersCurrent - totals.ordersPrevious,
        icon: ShoppingCart,
        tone: 'emerald',
      },
      {
        key: 'avg-ticket',
        label: 'Ticket promedio',
        value: formatCurrency(totals.avgTicketCurrent),
        helper: `Variacion ${formatPercent(totals.avgTicketChangePct)}`,
        trend: totals.avgTicketChangePct,
        icon: Package,
        tone: 'amber',
      },
    ];
  }, [data, formatAmount, resolvedCurrency, currency.code]);

  const topProducts = useMemo(() => data?.topProducts ?? [], [data]);

  const handleRegisterSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedItem) {
      setSaleFeedback({
        variant: 'error',
        message: 'Selecciona un item de inventario para registrar la venta.',
      });
      return;
    }

    if (inventoryAvailable <= 0) {
      setSaleFeedback({
        variant: 'error',
        message: 'No hay stock disponible para este producto.',
      });
      return;
    }

    const normalizedQuantity = Number.isFinite(saleQuantity) ? Math.floor(saleQuantity) : 0;
    if (normalizedQuantity <= 0) {
      setSaleFeedback({
        variant: 'error',
        message: 'Ingresa una cantidad valida.',
      });
      return;
    }

    if (normalizedQuantity > inventoryAvailable) {
      setSaleFeedback({
        variant: 'error',
        message: `Solo hay ${inventoryAvailable.toLocaleString('es-ES')} unidades disponibles.`,
      });
      return;
    }

    const customerLabel = saleCustomerDisplay;
    if (customerSelection === '__new__' && customerLabel.length === 0) {
      setSaleFeedback({
        variant: 'error',
        message: 'Escribe el nombre del cliente o selecciona Consumidor final.',
      });
      return;
    }

    setSaleQuantity(normalizedQuantity);
    setSaleFeedback(null);

    try {
      await registerSaleMutation.mutateAsync({
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        soldQuantity: normalizedQuantity,
        customerLabel,
        currencyCode: currencyCodeForSale,
        unitPrice: Number.isFinite(selectedItem.pvp) ? selectedItem.pvp : 0,
      });
    } catch {
      // handled in mutation callbacks
    }
  };

  const renderTrendIcon = (trend: TrendDirection) => {
    if (trend === 'neutral') {
      return <TrendingUp className="sales-metric-card__trend-icon sales-metric-card__trend-icon--neutral" />;
    }
    if (trend === 'up') {
      return <ArrowUpRight className="sales-metric-card__trend-icon sales-metric-card__trend-icon--up" />;
    }
    return <ArrowDownRight className="sales-metric-card__trend-icon sales-metric-card__trend-icon--down" />;
  };

  return (
    <div className="sales-page">
      <header className="sales-page__header">
        <div>
          <h1 className="sales-page__title">Ventas</h1>
          <p className="sales-page__subtitle">
            Seguimiento integral de ingresos, ordenes y productos destacados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="sales-page__refresh"
          disabled={isLoading}
        >
          <RefreshCw className="sales-page__refresh-icon" />
          Actualizar
        </button>
      </header>

      <section className="sales-order" aria-label="Registrar venta rapida">
        <header className="sales-order__header">
          <div>
            <h2 className="sales-order__title">Registrar venta rapida</h2>
            <p className="sales-order__subtitle">
              Descuenta unidades aprobadas del inventario y asigna el cliente correspondiente.
            </p>
          </div>
          <span className={`sales-order__badge${selectedItem ? '' : ' sales-order__badge--muted'}`}>
            {selectedItem
              ? `Stock disponible: ${inventoryAvailable.toLocaleString('es-ES')} uds`
              : 'Selecciona un producto para ver el stock actual'}
          </span>
        </header>

        {saleFeedback && (
          <div className={`sales-order__feedback sales-order__feedback--${saleFeedback.variant}`} role="status">
            {saleFeedback.variant === 'success' ? (
              <CheckCircle2 className="sales-order__feedback-icon" />
            ) : (
              <AlertCircle className="sales-order__feedback-icon" />
            )}
            <span>{saleFeedback.message}</span>
          </div>
        )}

        {isInventoryError ? (
          <div className="sales-order__state sales-order__state--error" role="alert">
            <AlertCircle className="sales-order__state-icon" />
            <div>
              <p>No se pudo cargar el inventario disponible.</p>
              <p className="sales-order__state-helper">
                {inventoryError?.message ?? 'Intenta nuevamente en unos minutos.'}
              </p>
            </div>
          </div>
        ) : (
          <form className="sales-order__form" onSubmit={handleRegisterSale}>
            <div className="sales-order__grid">
              <div className="sales-order__field">
                <label className="sales-order__label" htmlFor="sales-order-item">Producto</label>
                <div className="sales-order__control">
                  <select
                    id="sales-order-item"
                    value={selectedItemId}
                    onChange={(event) => {
                      setSelectedItemId(event.target.value);
                      setSaleFeedback(null);
                    }}
                    className="sales-order__select"
                    disabled={isInventoryLoading || registerSaleMutation.isPending || !hasSaleableItems}
                  >
                    <option value="">Selecciona un item...</option>
                    {saleableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.quantity.toLocaleString('es-ES')} uds
                      </option>
                    ))}
                  </select>
                  {isInventoryLoading && <Loader2 className="sales-order__spinner" aria-hidden />}
                </div>
                {!hasSaleableItems && !isInventoryLoading && (
                  <p className="sales-order__hint sales-order__hint--warning">
                    No hay items aprobados disponibles. Administra productos desde Inventario.
                  </p>
                )}
              </div>

              <div className="sales-order__field sales-order__field--small">
                <label className="sales-order__label" htmlFor="sales-order-quantity">Cantidad</label>
                <input
                  id="sales-order-quantity"
                  type="number"
                  min={1}
                  value={saleQuantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (!Number.isFinite(value)) {
                      setSaleQuantity(1);
                      setSaleFeedback(null);
                      return;
                    }
                    const normalized = Math.max(1, Math.floor(value));
                    if (selectedItem) {
                      const capped = Math.min(normalized, Math.max(selectedItem.quantity, 1));
                      setSaleQuantity(capped);
                    } else {
                      setSaleQuantity(normalized);
                    }
                    setSaleFeedback(null);
                  }}
                  className="sales-order__input"
                  disabled={!selectedItem || registerSaleMutation.isPending}
                />
                <p className="sales-order__hint">
                  {selectedItem
                    ? `Disponible: ${inventoryAvailable.toLocaleString('es-ES')} unidades`
                    : 'Selecciona un producto para revisar el stock disponible.'}
                </p>
              </div>

              <div className="sales-order__field">
                <label className="sales-order__label" htmlFor="sales-order-customer">Cliente</label>
                <select
                  id="sales-order-customer"
                  value={customerSelection}
                  onChange={(event) => {
                    setCustomerSelection(event.target.value);
                    setSaleFeedback(null);
                  }}
                  className="sales-order__select"
                  disabled={registerSaleMutation.isPending}
                >
                  <option value="final">Consumidor final</option>
                  {recentCustomers.map((customer) => (
                    <option key={customer} value={customer}>
                      {customer}
                    </option>
                  ))}
                  <option value="__new__">Otro cliente...</option>
                </select>
                {customerSelection === '__new__' && (
                  <input
                    type="text"
                    className="sales-order__input sales-order__input--inline"
                    placeholder="Nombre del cliente"
                    value={customCustomerName}
                    onChange={(event) => {
                      setCustomCustomerName(event.target.value);
                      setSaleFeedback(null);
                    }}
                    disabled={registerSaleMutation.isPending}
                  />
                )}
                <p className="sales-order__hint">
                  Si no especificas un cliente se registrara como consumidor final.
                </p>
              </div>
            </div>

            <div className="sales-order__summary">
              <div className="sales-order__summary-row">
                <span>Cliente</span>
                <span className="sales-order__summary-value">
                  <UserCircle2 className="sales-order__summary-icon" />
                  {saleCustomerDisplay}
                </span>
              </div>
              <div className="sales-order__summary-row">
                <span>Detalle</span>
                <span>
                  {selectedItem
                    ? `${saleQuantity.toLocaleString('es-ES')} × ${formatAmount(saleUnitPrice, currencyCodeForSale)}`
                    : '-'}
                </span>
              </div>
              <div className="sales-order__summary-row sales-order__summary-row--total">
                <span>Total</span>
                <span>{formatAmount(saleTotal, currencyCodeForSale)}</span>
              </div>
            </div>

            <div className="sales-order__actions">
              <button
                type="submit"
                className="sales-order__submit"
                disabled={
                  registerSaleMutation.isPending ||
                  !selectedItem ||
                  isInventoryLoading ||
                  !hasSaleableItems
                }
              >
                {registerSaleMutation.isPending ? (
                  <>
                    <Loader2 className="sales-order__submit-icon sales-order__submit-icon--spinner" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="sales-order__submit-icon" />
                    Registrar venta
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>

      {isLoading && (
        <div className="sales-page__state" role="status">
          <LineChart className="sales-page__state-icon" />
          <p>Cargando informacion comercial...</p>
        </div>
      )}

      {isError && (
        <div className="sales-page__state sales-page__state--error" role="alert">
          <LineChart className="sales-page__state-icon" />
          <div>
            <p>No se pudo cargar el resumen de ventas.</p>
            <p className="sales-page__state-helper">{error?.message ?? 'Intenta nuevamente en unos minutos.'}</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && data && !data.hasOrders && (
        <div className="sales-page__state sales-page__state--empty" role="status">
          <ShoppingCart className="sales-page__state-icon" />
          <div>
            <p>Todavia no registras ventas.</p>
            <p className="sales-page__state-helper">
              Carga pedidos recientes para ver tendencias, productos estrella y segmentos relevantes.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && data && data.hasOrders && (
        <>
          <section className="sales-metrics" aria-label="Indicadores de ventas">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const trendDirection = resolveTrend(metric.trend);
              return (
                <article key={metric.key} className={`sales-metric-card sales-metric-card--${metric.tone}`}>
                  <div className="sales-metric-card__icon">
                    <Icon size={20} />
                  </div>
                  <div className="sales-metric-card__body">
                    <span className="sales-metric-card__label">{metric.label}</span>
                    <span className="sales-metric-card__value">{metric.value}</span>
                    <span className="sales-metric-card__helper">{metric.helper}</span>
                  </div>
                  <div className={`sales-metric-card__trend sales-metric-card__trend--${trendDirection}`}>
                    {renderTrendIcon(trendDirection)}
                  </div>
                </article>
              );
            })}
          </section>

          <section className="sales-chart" aria-label="Evolucion de ingresos y ordenes">
            <header className="sales-section-header">
              <div>
                <h2>Evolucion de ingresos</h2>
                <p>
                  Ingresos mensuales, volumen de ordenes y recuento de clientes analizados.
                </p>
              </div>
            </header>
            <div className="sales-chart__container">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') {
                        return [formatAmount(value, resolvedCurrency as typeof currency.code), 'Ingresos'];
                      }
                      const label = name === 'orders' ? 'Ordenes' : 'Clientes';
                      return [value.toLocaleString('es-ES'), label];
                    }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      backgroundColor: 'rgba(15, 23, 42, 0.94)',
                      color: '#e2e8f0',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#salesRevenueGradient)" name="revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="sales-products" aria-label="Productos destacados">
            <header className="sales-section-header">
              <div>
                <h2>Productos destacados</h2>
                <p>Top 5 productos por ingresos y unidades vendidas.</p>
              </div>
            </header>
            <div className="sales-products__list">
              {topProducts.map((product) => (
                <article key={product.sku} className="sales-product-card">
                  <div className="sales-product-card__icon">
                    <Package size={18} />
                  </div>
                  <div className="sales-product-card__body">
                    <div className="sales-product-card__title">
                      <span>{product.name}</span>
                      <span className="sales-product-card__sku">SKU {product.sku}</span>
                    </div>
                    <div className="sales-product-card__metrics">
                      <div className="sales-product-card__metric">
                        <span className="sales-product-card__metric-label">Ingresos</span>
                        <span className="sales-product-card__metric-value">
                          {formatAmount(product.revenue, resolvedCurrency as typeof currency.code)}
                        </span>
                      </div>
                      <div className="sales-product-card__metric">
                        <span className="sales-product-card__metric-label">Unidades</span>
                        <span className="sales-product-card__metric-value">{product.quantity.toLocaleString('es-ES')}</span>
                      </div>
                      <div className="sales-product-card__metric">
                        <span className="sales-product-card__metric-label">Participacion</span>
                        <span className="sales-product-card__metric-value">{(product.revenueShare * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {topProducts.length === 0 && (
                <div className="sales-page__state sales-page__state--inline" role="status">
                  <Package className="sales-page__state-icon" />
                  <p>No hay productos destacados suficientes para mostrar.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
