// Local storage utilities for inventory, sales, and purchases

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  date?: string;
}

export interface Sale {
  id: string;
  date: string;
  total: number;
  items?: string;
}

export interface Purchase {
  id: string;
  date: string;
  total: number;
  items?: string;
}

const INVENTORY_KEY = 'datapulse_inventory';
const SALES_KEY = 'datapulse_sales';
const PURCHASES_KEY = 'datapulse_purchases';

// Initialize with some demo data
const demoInventory: InventoryItem[] = [
  { id: '1', name: 'Panel LED 60x60', quantity: 45, price: 1200 },
  { id: '2', name: 'Kit Herramientas Pro', quantity: 23, price: 2100 },
  { id: '3', name: 'Pintura Acrílica 20L', quantity: 8, price: 450 },
  { id: '4', name: 'Taladro Inalámbrico X2', quantity: 5, price: 3200 },
  { id: '5', name: 'Adhesivo Cerámico', quantity: 12, price: 350 },
  { id: '6', name: 'Sellador Silicona', quantity: 9, price: 280 },
];

const demoSales: Sale[] = Array.from({ length: 15 }, (_, i) => ({
  id: `sale-${i}`,
  date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  total: Math.floor(Math.random() * 5000) + 2000,
}));

const demoPurchases: Purchase[] = Array.from({ length: 10 }, (_, i) => ({
  id: `purchase-${i}`,
  date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  total: Math.floor(Math.random() * 3000) + 1000,
}));

export function getInventory(): InventoryItem[] {
  try {
    const stored = localStorage.getItem(INVENTORY_KEY);
    return stored ? JSON.parse(stored) : demoInventory;
  } catch {
    return demoInventory;
  }
}

export function getSales(): Sale[] {
  try {
    const stored = localStorage.getItem(SALES_KEY);
    return stored ? JSON.parse(stored) : demoSales;
  } catch {
    return demoSales;
  }
}

export function getPurchases(): Purchase[] {
  try {
    const stored = localStorage.getItem(PURCHASES_KEY);
    return stored ? JSON.parse(stored) : demoPurchases;
  } catch {
    return demoPurchases;
  }
}

export function addSale(sale: Sale): void {
  const sales = getSales();
  sales.push(sale);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export function addPurchase(purchase: Purchase): void {
  const purchases = getPurchases();
  purchases.push(purchase);
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(purchases));
}

export function updateInventory(items: InventoryItem[]): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
}
