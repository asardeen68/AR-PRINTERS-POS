import React, { useState, useEffect } from 'react';
import { Plus, Save, Truck, Search, History, Trash2, PackagePlus } from 'lucide-react';
import { Product, Purchase } from '../types';
import { db } from '../services/db';

interface PurchaseViewProps {
  products: Product[];
  onUpdate: () => void;
}

export const PurchaseView: React.FC<PurchaseViewProps> = ({ products, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'NEW' | 'HISTORY'>('NEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [supplier, setSupplier] = useState('');
  
  // Cart for the current purchase order
  const [purchaseItems, setPurchaseItems] = useState<{
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
  }[]>([]);

  // History State
  const [history, setHistory] = useState<Purchase[]>([]);

  useEffect(() => {
    if (viewMode === 'HISTORY') {
        const loadHistory = async () => {
            const data = await db.getPurchases();
            setHistory(data.reverse());
        };
        loadHistory();
    }
  }, [viewMode]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToPurchase = (product: Product) => {
    setPurchaseItems(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) return prev; // Already in list
      return [...prev, { 
        productId: product.id, 
        productName: product.name, 
        quantity: 1, 
        unitCost: product.cost 
      }];
    });
  };

  const updateItem = (productId: string, field: 'quantity' | 'unitCost', value: number) => {
    setPurchaseItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setPurchaseItems(prev => prev.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0);
  };

  const handleSavePurchase = async () => {
    if (!supplier || purchaseItems.length === 0) {
      alert("Please enter a supplier name and add at least one item.");
      return;
    }

    const newPurchase: Purchase = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      supplier,
      items: purchaseItems.map(item => ({
        ...item,
        total: item.quantity * item.unitCost
      })),
      total: calculateTotal()
    };

    await db.savePurchase(newPurchase);
    onUpdate();
    
    // Reset form
    setSupplier('');
    setPurchaseItems([]);
    alert("Purchase saved and stock updated!");
  };

  if (viewMode === 'HISTORY') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History size={24} /> Purchase History
          </h2>
          <button 
            onClick={() => setViewMode('NEW')}
            className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-cyan-700"
          >
            <Plus size={16} /> New Purchase
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Items</th>
                <th className="px-6 py-4 text-right">Total Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{p.supplier}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {p.items.length} items ({p.items.map(i => i.productName).join(', ').slice(0, 30)}...)
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">Rs. {p.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-6">
      {/* Product Selector */}
      <div className="w-1/3 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Products</h2>
            <button onClick={() => setViewMode('HISTORY')} className="text-sm text-cyan-600 font-medium">View History</button>
        </div>
        
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search to add..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto p-2">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToPurchase(product)}
              className="w-full text-left p-3 hover:bg-slate-50 rounded-lg border-b border-slate-100 last:border-0 transition-colors group"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-slate-800 text-sm">{product.name}</h4>
                  <p className="text-xs text-slate-500">Current Stock: {product.stock}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 bg-cyan-100 text-cyan-700 p-1.5 rounded-full">
                  <Plus size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Purchase Order Form */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Truck size={20} className="text-cyan-600" /> New Purchase Order (Stock In)
          </h2>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-bold">Total Payable</p>
            <p className="text-2xl font-extrabold text-slate-900">Rs. {calculateTotal().toFixed(2)}</p>
          </div>
        </div>

        <div className="p-6 border-b border-slate-200">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Supplier Name</label>
          <input 
            type="text" 
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            placeholder="e.g. Atlas Stationery Suppliers"
            value={supplier}
            onChange={e => setSupplier(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {purchaseItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <PackagePlus size={48} className="mb-4 opacity-20" />
              <p>Select products from the left to add to this purchase order.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-bold text-slate-400 uppercase text-left border-b border-slate-100">
                  <th className="pb-3 pl-2">Product</th>
                  <th className="pb-3 w-32">Unit Cost (Rs.)</th>
                  <th className="pb-3 w-24">Quantity</th>
                  <th className="pb-3 w-24 text-right">Line Total</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseItems.map(item => (
                  <tr key={item.productId} className="group">
                    <td className="py-3 pl-2 font-medium text-slate-800">{item.productName}</td>
                    <td className="py-3">
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="w-24 p-1.5 border border-slate-200 rounded text-right focus:border-cyan-500 outline-none"
                        value={item.unitCost}
                        onChange={e => updateItem(item.productId, 'unitCost', parseFloat(e.target.value))}
                      />
                    </td>
                    <td className="py-3">
                       <input 
                        type="number" 
                        min="1"
                        className="w-20 p-1.5 border border-slate-200 rounded text-center focus:border-cyan-500 outline-none"
                        value={item.quantity}
                        onChange={e => updateItem(item.productId, 'quantity', parseInt(e.target.value))}
                      />
                    </td>
                    <td className="py-3 text-right font-bold text-slate-700">
                      Rs. {(item.quantity * item.unitCost).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      <button onClick={() => removeItem(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={handleSavePurchase}
            disabled={purchaseItems.length === 0}
            className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center gap-2"
          >
            <Save size={18} /> Complete Purchase
          </button>
        </div>
      </div>
    </div>
  );
};