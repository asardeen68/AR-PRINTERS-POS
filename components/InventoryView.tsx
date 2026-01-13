import React, { useState } from 'react';
import { Plus, Edit2, Save, X } from 'lucide-react';
import { Product } from '../types';
import { db } from '../services/db';

interface InventoryViewProps {
  products: Product[];
  onUpdate: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ products, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', category: 'General', price: 0, cost: 0, stock: 0, minStockLevel: 5
  });

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    // Merge editForm into the original product to ensure all fields are present
    const original = products.find(p => p.id === editingId);
    if (!original) return;
    
    const updatedProduct = { ...original, ...editForm } as Product;
    await db.updateProduct(updatedProduct);
    
    onUpdate();
    setEditingId(null);
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) return;
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name!,
      category: newProduct.category || 'General',
      price: Number(newProduct.price),
      cost: Number(newProduct.cost),
      stock: Number(newProduct.stock),
      minStockLevel: Number(newProduct.minStockLevel)
    };
    
    await db.addProduct(product);
    onUpdate();
    
    setIsAdding(false);
    setNewProduct({ name: '', category: 'General', price: 0, cost: 0, stock: 0, minStockLevel: 5 });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Inventory Management</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {isAdding && (
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-7 gap-4 items-end animate-in fade-in slide-in-from-top-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-500">Name</label>
            <input className="w-full p-2 border rounded" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Product Name" />
          </div>
          <div>
             <label className="text-xs font-semibold text-slate-500">Category</label>
            <input className="w-full p-2 border rounded" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="Category" />
          </div>
          <div>
             <label className="text-xs font-semibold text-slate-500">Price</label>
            <input type="number" className="w-full p-2 border rounded" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
          </div>
          <div>
             <label className="text-xs font-semibold text-slate-500">Stock</label>
            <input type="number" className="w-full p-2 border rounded" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} />
          </div>
          <div>
             <label className="text-xs font-semibold text-slate-500">Min Lvl</label>
            <input type="number" className="w-full p-2 border rounded" value={newProduct.minStockLevel} onChange={e => setNewProduct({...newProduct, minStockLevel: parseInt(e.target.value)})} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddProduct} className="bg-green-600 text-white p-2 rounded flex-1">Save</button>
            <button onClick={() => setIsAdding(false)} className="bg-gray-400 text-white p-2 rounded"><X size={16}/></button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Selling Price</th>
              <th className="px-6 py-4">Cost Price</th>
              <th className="px-6 py-4">Stock Level</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-slate-50">
                {editingId === product.id ? (
                  <>
                    <td className="px-6 py-4"><input className="border p-1 w-full rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                    <td className="px-6 py-4"><input className="border p-1 w-full rounded" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} /></td>
                    <td className="px-6 py-4"><input type="number" className="border p-1 w-20 rounded" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} /></td>
                    <td className="px-6 py-4"><input type="number" className="border p-1 w-20 rounded" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: parseFloat(e.target.value)})} /></td>
                    <td className="px-6 py-4"><input type="number" className="border p-1 w-20 rounded" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: parseInt(e.target.value)})} /></td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800"><Save size={18} /></button>
                      <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-700"><X size={18} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                    <td className="px-6 py-4 text-slate-500">{product.category}</td>
                    <td className="px-6 py-4 text-slate-900">Rs. {product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-500">Rs. {product.cost.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        product.stock <= product.minStockLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {product.stock} Units
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEditClick(product)} className="text-slate-400 hover:text-cyan-600">
                        <Edit2 size={18} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};