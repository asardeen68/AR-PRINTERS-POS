import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Business Cards (100pcs)', category: 'Printing', price: 15.00, cost: 5.00, stock: 50, minStockLevel: 10 },
  { id: '2', name: 'A4 Glossy Paper', category: 'Materials', price: 0.50, cost: 0.20, stock: 500, minStockLevel: 100 },
  { id: '3', name: 'Banner Printing (per sqft)', category: 'Printing', price: 2.50, cost: 0.80, stock: 1000, minStockLevel: 200 },
  { id: '4', name: 'T-Shirt Sublimation', category: 'Merchandise', price: 25.00, cost: 8.00, stock: 20, minStockLevel: 5 },
  { id: '5', name: 'Mug Printing', category: 'Merchandise', price: 10.00, cost: 3.50, stock: 35, minStockLevel: 10 },
  { id: '6', name: 'Spiral Binding', category: 'Services', price: 3.00, cost: 0.50, stock: 200, minStockLevel: 50 },
];

export const TAX_RATE = 0.08; // 8% Tax
