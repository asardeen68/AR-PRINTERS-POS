import { Product, Sale, Purchase, ShopProfile } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

const DB_NAME = 'ARPrintersDB';
const DB_VERSION = 1;

const DEFAULT_PROFILE: ShopProfile = {
  name: 'AR PRINTERS',
  address: 'Mukkarawewa, Horowpothana',
  phone: '0778824235',
  email: 'arprintersmk@gmail.com',
  footerNote: 'Thank you for your business!',
  logo: ''
};

// Database Initialization Helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create Object Stores if they don't exist
      if (!db.objectStoreNames.contains('products')) {
        const prodStore = db.createObjectStore('products', { keyPath: 'id' });
        // Seed initial products
        INITIAL_PRODUCTS.forEach(p => prodStore.add(p));
      }
      
      if (!db.objectStoreNames.contains('sales')) {
        db.createObjectStore('sales', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('purchases')) {
        db.createObjectStore('purchases', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('settings')) {
        const settingsStore = db.createObjectStore('settings', { keyPath: 'id' });
        settingsStore.add({ id: 'profile', ...DEFAULT_PROFILE });
      }
    };
  });
};

// Generic Helpers
const getAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getOne = async <T>(storeName: string, key: string): Promise<T | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const putItem = async <T>(storeName: string, item: T): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const deleteItem = async (storeName: string, key: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
};

export const db = {
  getProducts: async (): Promise<Product[]> => {
    return getAll<Product>('products');
  },

  addProduct: async (product: Product): Promise<void> => {
    return putItem('products', product);
  },

  updateProduct: async (product: Product): Promise<void> => {
    return putItem('products', product);
  },

  // Retained for compatibility if needed, but implementation uses individual puts
  saveProducts: async (products: Product[]): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction('products', 'readwrite');
    const store = transaction.objectStore('products');
    products.forEach(p => store.put(p));
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  },

  getSales: async (): Promise<Sale[]> => {
    return getAll<Sale>('sales');
  },

  saveSale: async (sale: Sale): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(['sales', 'products'], 'readwrite');
    
    // 1. Save Sale
    const salesStore = transaction.objectStore('sales');
    salesStore.add(sale);

    // 2. Update Inventory
    const productStore = transaction.objectStore('products');
    
    // We need to iterate items and update stock. 
    // IDB transactions are committed when the event loop is free, 
    // so we can issue multiple requests.
    for (const item of sale.items) {
        const request = productStore.get(item.id);
        request.onsuccess = () => {
            const product = request.result as Product;
            if (product) {
                product.stock -= item.quantity;
                productStore.put(product);
            }
        };
    }

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  },

  updateSale: async (updatedSale: Sale): Promise<void> => {
    return putItem('sales', updatedSale);
  },

  getPurchases: async (): Promise<Purchase[]> => {
    return getAll<Purchase>('purchases');
  },

  savePurchase: async (purchase: Purchase): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(['purchases', 'products'], 'readwrite');
    
    // 1. Save Purchase
    const purchaseStore = transaction.objectStore('purchases');
    purchaseStore.add(purchase);

    // 2. Update Inventory
    const productStore = transaction.objectStore('products');
    
    for (const item of purchase.items) {
        const request = productStore.get(item.productId);
        request.onsuccess = () => {
            const product = request.result as Product;
            if (product) {
                product.stock += item.quantity;
                product.cost = item.unitCost; // Update last cost price
                productStore.put(product);
            }
        };
    }

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
  },

  getShopProfile: async (): Promise<ShopProfile> => {
    const profile = await getOne<{id: string} & ShopProfile>('settings', 'profile');
    if (profile) {
        // Remove the 'id' key before returning to match ShopProfile interface
        const { id, ...rest } = profile;
        return rest as ShopProfile;
    }
    return DEFAULT_PROFILE;
  },

  saveShopProfile: async (profile: ShopProfile): Promise<void> => {
    return putItem('settings', { id: 'profile', ...profile });
  }
};