export enum AppView {
  DASHBOARD = 'DASHBOARD',
  POS = 'POS',
  INVENTORY = 'INVENTORY',
  PURCHASES = 'PURCHASES',
  REPORTS = 'REPORTS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  CREDIT_LEDGER = 'CREDIT_LEDGER',
  SETTINGS = 'SETTINGS'
}

export interface ShopProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  footerNote: string;
  logo?: string; // Base64 data string
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStockLevel: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  date: string; // ISO string
  customerName: string;
  customerContact?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate?: number; // Added to track specific tax rate used
  discount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Online' | 'Credit';
  paymentStatus: 'Paid' | 'Pending';
}

export interface Purchase {
  id: string;
  date: string;
  supplier: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    total: number;
  }[];
  total: number;
}

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  lowStockCount: number;
  totalProfit: number;
}