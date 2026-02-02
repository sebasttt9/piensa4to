import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_DATA_CLIENT } from '../database/supabase.constants';

export interface CommerceTotals {
    revenueCurrent: number;
    revenuePrevious: number;
    revenueChangePct: number;
    ordersCurrent: number;
    ordersPrevious: number;
    avgTicketCurrent: number;
    avgTicketPrevious: number;
    avgTicketChangePct: number;
    newCustomersCurrent: number;
    newCustomersPrevious: number;
    newCustomersChangePct: number;
    activeCustomers: number;
    returningCustomers: number;
}

export interface CommerceMonthlyPoint {
    month: string;
    label: string;
    revenue: number;
    orders: number;
    customers: number;
}

export interface CommerceSegmentPerformance {
    segment: string;
    customers: number;
    revenue: number;
    avgTicket: number;
    revenueShare: number;
}

export interface CommerceProductPerformance {
    sku: string;
    name: string;
    quantity: number;
    revenue: number;
    growthPct: number | null;
    revenueShare: number;
}

export interface CommerceOverview {
    totals: CommerceTotals;
    monthlyRevenue: CommerceMonthlyPoint[];
    segmentPerformance: CommerceSegmentPerformance[];
    topProducts: CommerceProductPerformance[];
    currency: string;
    hasOrders: boolean;
}

interface SalesOrderRow {
    id: string;
    owner_id: string;
    organization_id: string;
    customer_id: string | null;
    status?: string | null;
    order_total?: number | string | null;
    currency_code?: string | null;
    order_date?: string | null;
    created_at?: string | null;
}

interface SalesOrderItemRow {
    order_id: string;
    owner_id: string;
    organization_id: string;
    sku?: string | null;
    product_name?: string | null;
    quantity?: number | string | null;
    unit_price?: number | string | null;
    line_total?: number | string | null;
    created_at?: string | null;
}

interface CustomerRow {
    id: string;
    owner_id: string;
    organization_id: string;
    status?: string | null;
    segment_key?: string | null;
    segment_id?: string | null;
    created_at?: string | null;
}

@Injectable()
export class CommerceService {
    private readonly salesOrdersTable = 'sales_orders';
    private readonly salesOrderItemsTable = 'sales_order_items';
    private readonly customersTable = 'customers';

    constructor(
        @Inject(SUPABASE_DATA_CLIENT)
        private readonly supabase: SupabaseClient,
    ) { }

    async getOverview(ownerId: string, organizationId?: string): Promise<CommerceOverview> {
        if (!organizationId) {
            throw new BadRequestException('La organización es requerida para consultar el desempeño comercial.');
        }

        const { now, currentMonthKey, previousMonthKey, sixMonthsAgo } = this.buildTemporalContext();

        const [orders, items, customers] = await Promise.all([
            this.fetchSalesOrders(ownerId, organizationId, sixMonthsAgo),
            this.fetchSalesOrderItems(ownerId, organizationId, sixMonthsAgo),
            this.fetchCustomers(ownerId, organizationId),
        ]);

        const currency = orders.find((order) => order.currency_code)?.currency_code ?? 'USD';
        const orderTotals = this.computeOrderAggregates(orders, customers, currentMonthKey, previousMonthKey);
        const monthlyRevenue = this.computeMonthlySeries(orders, customers, sixMonthsAgo, now);
        const segmentPerformance = this.computeSegmentPerformance(orders, customers);
        const topProducts = this.computeTopProducts(orders, items, currentMonthKey, previousMonthKey);

        return {
            totals: {
                revenueCurrent: orderTotals.revenueCurrent,
                revenuePrevious: orderTotals.revenuePrevious,
                revenueChangePct: this.computeChangePct(orderTotals.revenuePrevious, orderTotals.revenueCurrent),
                ordersCurrent: orderTotals.ordersCurrent,
                ordersPrevious: orderTotals.ordersPrevious,
                avgTicketCurrent: orderTotals.avgTicketCurrent,
                avgTicketPrevious: orderTotals.avgTicketPrevious,
                avgTicketChangePct: this.computeChangePct(orderTotals.avgTicketPrevious, orderTotals.avgTicketCurrent),
                newCustomersCurrent: orderTotals.newCustomersCurrent,
                newCustomersPrevious: orderTotals.newCustomersPrevious,
                newCustomersChangePct: this.computeChangePct(orderTotals.newCustomersPrevious, orderTotals.newCustomersCurrent),
                activeCustomers: orderTotals.activeCustomers,
                returningCustomers: orderTotals.returningCustomers,
            },
            monthlyRevenue,
            segmentPerformance,
            topProducts,
            currency,
            hasOrders: orders.length > 0,
        };
    }

    private async fetchSalesOrders(ownerId: string, organizationId: string, from: Date): Promise<SalesOrderRow[]> {
        const { data, error } = await this.supabase
            .from(this.salesOrdersTable)
            .select('id, owner_id, organization_id, customer_id, order_total, currency_code, order_date, created_at, status')
            .eq('owner_id', ownerId)
            .eq('organization_id', organizationId)
            .gte('order_date', from.toISOString());

        if (error) {
            throw new InternalServerErrorException('No se pudieron obtener las órdenes de venta.');
        }

        return (data ?? []) as SalesOrderRow[];
    }

    private async fetchSalesOrderItems(ownerId: string, organizationId: string, from: Date): Promise<SalesOrderItemRow[]> {
        const { data, error } = await this.supabase
            .from(this.salesOrderItemsTable)
            .select('order_id, owner_id, organization_id, sku, product_name, quantity, unit_price, line_total, created_at')
            .eq('owner_id', ownerId)
            .eq('organization_id', organizationId)
            .gte('created_at', from.toISOString());

        if (error) {
            throw new InternalServerErrorException('No se pudieron obtener los productos vendidos.');
        }

        return (data ?? []) as SalesOrderItemRow[];
    }

    private async fetchCustomers(ownerId: string, organizationId: string): Promise<CustomerRow[]> {
        const { data, error } = await this.supabase
            .from(this.customersTable)
            .select('id, owner_id, organization_id, status, segment_key, segment_id, created_at')
            .eq('owner_id', ownerId)
            .eq('organization_id', organizationId);

        if (error) {
            throw new InternalServerErrorException('No se pudieron obtener los clientes.');
        }

        return (data ?? []) as CustomerRow[];
    }

    private computeOrderAggregates(
        orders: SalesOrderRow[],
        customers: CustomerRow[],
        currentMonthKey: string,
        previousMonthKey: string,
    ) {
        let revenueCurrent = 0;
        let revenuePrevious = 0;
        let ordersCurrent = 0;
        let ordersPrevious = 0;
        let currentTicketAccumulator = 0;
        let previousTicketAccumulator = 0;

        const activeCustomersSet = new Set<string>();
        const currentMonthCustomers = new Set<string>();
        const previousMonthCustomers = new Set<string>();

        orders.forEach((order) => {
            const amount = this.toNumber(order.order_total);
            const monthKey = this.extractMonthKey(order.order_date ?? order.created_at);

            if (monthKey === currentMonthKey) {
                revenueCurrent += amount;
                ordersCurrent += 1;
                currentTicketAccumulator += amount;
                if (order.customer_id) {
                    currentMonthCustomers.add(order.customer_id);
                }
            } else if (monthKey === previousMonthKey) {
                revenuePrevious += amount;
                ordersPrevious += 1;
                previousTicketAccumulator += amount;
                if (order.customer_id) {
                    previousMonthCustomers.add(order.customer_id);
                }
            }

            if (order.customer_id) {
                activeCustomersSet.add(order.customer_id);
            }
        });

        const avgTicketCurrent = ordersCurrent > 0 ? currentTicketAccumulator / ordersCurrent : 0;
        const avgTicketPrevious = ordersPrevious > 0 ? previousTicketAccumulator / ordersPrevious : 0;

        const currentCustomers = customers.filter((customer) => this.extractMonthKey(customer.created_at) === currentMonthKey).length;
        const previousCustomers = customers.filter((customer) => this.extractMonthKey(customer.created_at) === previousMonthKey).length;

        const returningCustomers = Array.from(currentMonthCustomers).filter((customerId) => previousMonthCustomers.has(customerId)).length;

        return {
            revenueCurrent,
            revenuePrevious,
            ordersCurrent,
            ordersPrevious,
            avgTicketCurrent,
            avgTicketPrevious,
            newCustomersCurrent: currentCustomers,
            newCustomersPrevious: previousCustomers,
            activeCustomers: activeCustomersSet.size,
            returningCustomers,
        };
    }

    private computeMonthlySeries(
        orders: SalesOrderRow[],
        customers: CustomerRow[],
        from: Date,
        to: Date,
    ): CommerceMonthlyPoint[] {
        const points: CommerceMonthlyPoint[] = [];
        const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));

        while (cursor <= to) {
            const monthKey = this.extractMonthKey(cursor.toISOString());
            const label = this.formatMonthLabel(cursor);

            const monthlyOrders = orders.filter((order) => this.extractMonthKey(order.order_date ?? order.created_at) === monthKey);
            const monthlyCustomers = customers.filter((customer) => this.extractMonthKey(customer.created_at) === monthKey);

            const revenue = monthlyOrders.reduce((sum, order) => sum + this.toNumber(order.order_total), 0);
            const ordersCount = monthlyOrders.length;
            const customerCount = monthlyCustomers.length;

            points.push({
                month: monthKey,
                label,
                revenue,
                orders: ordersCount,
                customers: customerCount,
            });

            cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        }

        return points;
    }

    private computeSegmentPerformance(
        orders: SalesOrderRow[],
        customers: CustomerRow[],
    ): CommerceSegmentPerformance[] {
        if (orders.length === 0 || customers.length === 0) {
            return [];
        }

        const segmentByCustomer = new Map<string, string>();
        customers.forEach((customer) => {
            const segment = customer.segment_key ?? customer.segment_id ?? 'Sin segmento';
            segmentByCustomer.set(customer.id, segment);
        });

        const segmentTotals = new Map<string, { revenue: number; customers: Set<string>; orders: number }>();
        orders.forEach((order) => {
            const segment = order.customer_id ? segmentByCustomer.get(order.customer_id) ?? 'Sin segmento' : 'Sin segmento';
            const entry = segmentTotals.get(segment) ?? { revenue: 0, customers: new Set<string>(), orders: 0 };
            entry.revenue += this.toNumber(order.order_total);
            entry.orders += 1;
            if (order.customer_id) {
                entry.customers.add(order.customer_id);
            }
            segmentTotals.set(segment, entry);
        });

        const totalRevenue = Array.from(segmentTotals.values()).reduce((sum, entry) => sum + entry.revenue, 0);

        return Array.from(segmentTotals.entries())
            .map(([segment, entry]) => {
                const avgTicket = entry.orders > 0 ? entry.revenue / entry.orders : 0;
                const revenueShare = totalRevenue > 0 ? entry.revenue / totalRevenue : 0;
                return {
                    segment,
                    customers: entry.customers.size,
                    revenue: entry.revenue,
                    avgTicket,
                    revenueShare,
                };
            })
            .sort((a, b) => b.revenue - a.revenue);
    }

    private computeTopProducts(
        orders: SalesOrderRow[],
        items: SalesOrderItemRow[],
        currentMonthKey: string,
        previousMonthKey: string,
    ): CommerceProductPerformance[] {
        if (orders.length === 0 || items.length === 0) {
            return [];
        }

        const orderMonthLookup = new Map<string, string>();
        orders.forEach((order) => {
            orderMonthLookup.set(order.id, this.extractMonthKey(order.order_date ?? order.created_at));
        });

        const totals = new Map<string, { name: string; revenue: number; quantity: number; previousRevenue: number }>();

        items.forEach((item) => {
            const monthKey = orderMonthLookup.get(item.order_id);
            if (!monthKey) {
                return;
            }

            const key = item.sku ?? item.product_name ?? item.order_id;
            const name = item.product_name ?? item.sku ?? 'Producto';
            const revenue = this.resolveItemRevenue(item);
            const quantity = this.toNumber(item.quantity);
            const entry = totals.get(key) ?? { name, revenue: 0, quantity: 0, previousRevenue: 0 };

            if (monthKey === currentMonthKey) {
                entry.revenue += revenue;
                entry.quantity += quantity;
            } else if (monthKey === previousMonthKey) {
                entry.previousRevenue += revenue;
            }

            totals.set(key, entry);
        });

        const totalCurrentRevenue = Array.from(totals.values()).reduce((sum, entry) => sum + entry.revenue, 0);

        return Array.from(totals.entries())
            .filter(([, entry]) => entry.revenue > 0)
            .map(([sku, entry]) => {
                const growthPct = entry.previousRevenue > 0
                    ? this.computeChangePct(entry.previousRevenue, entry.revenue)
                    : (entry.previousRevenue === 0 && entry.revenue > 0 ? 100 : null);
                const revenueShare = totalCurrentRevenue > 0 ? entry.revenue / totalCurrentRevenue : 0;

                return {
                    sku,
                    name: entry.name,
                    quantity: entry.quantity,
                    revenue: entry.revenue,
                    growthPct,
                    revenueShare,
                };
            })
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }

    private buildTemporalContext() {
        const now = new Date();
        const currentMonthKey = this.extractMonthKey(now.toISOString());
        const previousMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        const previousMonthKey = this.extractMonthKey(previousMonthDate.toISOString());
        const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

        return { now, currentMonthKey, previousMonthKey, sixMonthsAgo };
    }

    private extractMonthKey(input?: string | null): string {
        if (!input) {
            return 'unknown';
        }
        const date = new Date(input);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    private formatMonthLabel(date: Date): string {
        return new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date);
    }

    private computeChangePct(previous: number, current: number): number {
        if (previous === 0) {
            return current > 0 ? 100 : 0;
        }
        return ((current - previous) / Math.abs(previous)) * 100;
    }

    private toNumber(value?: number | string | null): number {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        return 0;
    }

    private resolveItemRevenue(item: SalesOrderItemRow): number {
        if (item.line_total !== undefined && item.line_total !== null) {
            return this.toNumber(item.line_total);
        }
        if (item.unit_price !== undefined && item.quantity !== undefined) {
            return this.toNumber(item.unit_price) * this.toNumber(item.quantity);
        }
        return 0;
    }
}
