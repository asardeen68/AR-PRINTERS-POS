import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Printer, CheckCircle, ShoppingCart, CreditCard, Download, X, MessageCircle, Share2, Store, Keyboard, Tag, Layers, User, Banknote, Trash2 } from 'lucide-react';
import { Product, CartItem, Sale, ShopProfile } from '../types';
import { db } from '../services/db';

declare const html2pdf: any;

interface BillingViewProps {
  products: Product[];
  shopProfile: ShopProfile;
  onSaleComplete: () => void;
}

export const BillingView: React.FC<BillingViewProps> = ({ products, shopProfile, onSaleComplete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Online' | 'Credit'>('Cash');
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>(''); // Amount given by customer
  
  const [lastInvoice, setLastInvoice] = useState<Sale | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual entry states for new items not in inventory
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('1');

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (selectedCategory === 'All' || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, selectedCategory, searchTerm]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const addManualItem = () => {
    if (!manualName.trim() || !manualPrice) return;
    const priceNum = parseFloat(manualPrice);
    const qtyNum = parseInt(manualQty) || 1;
    if (isNaN(priceNum)) return;

    const manualItem: CartItem = {
      id: `manual-${Date.now()}`,
      name: manualName.trim(),
      category: 'Manual',
      price: priceNum,
      cost: 0,
      stock: 0,
      minStockLevel: 0,
      quantity: qtyNum
    };

    setCart(prev => [...prev, manualItem]);
    setManualName('');
    setManualPrice('');
    setManualQty('1');
    document.getElementById('manual-item-name')?.focus();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const setManualQuantity = (id: string, value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: 0 } : item));
    } else {
      setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, numValue) } : item));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * (taxPercentage / 100);
    const total = (subtotal + tax) - discountAmount;
    const change = paidAmount ? parseFloat(paidAmount) - total : 0;
    return { subtotal, tax, total, change };
  };

  const { subtotal, tax, total, change } = calculateTotals();

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Credit' && (!customerName.trim() || !customerContact.trim())) {
        alert("Customer Name and Contact Number are required for Credit Sales to update the Ledger.");
        return;
    }

    setIsProcessing(true);
    
    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      customerName: customerName || 'Walk-in Customer',
      customerContact: customerContact || '',
      items: [...cart],
      subtotal,
      tax,
      taxRate: taxPercentage,
      discount: discountAmount,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'Credit' ? 'Pending' : 'Paid'
    };

    try {
        await db.saveSale(newSale);
        setLastInvoice(newSale);
        
        if (sendWhatsApp && customerContact) {
          triggerWhatsApp(newSale);
        }

        setShowPreview(true);
        setCart([]);
        setCustomerName('');
        setCustomerContact('');
        setPaymentMethod('Cash');
        setTaxPercentage(0);
        setDiscountAmount(0);
        setPaidAmount('');
        onSaleComplete();
    } catch (error) {
        console.error("Transaction failed", error);
        alert("Failed to save sale.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const triggerWhatsApp = (sale: Sale) => {
    let phone = sale.customerContact?.replace(/[^0-9]/g, '') || '';
    if (phone.startsWith('0')) phone = '94' + phone.substring(1);

    const itemsList = sale.items
      .map(i => `• ${i.name} x${i.quantity} : Rs. ${(i.price * i.quantity).toFixed(2)}`)
      .join('%0A');

    const message = 
      `*🧾 ${shopProfile.name} - Invoice #${sale.id.slice(-8)}*` +
      `%0ADate: ${new Date(sale.date).toLocaleDateString()}` +
      `%0A%0A*Items:*%0A${itemsList}` +
      `%0A----------------` +
      `%0ASubtotal: Rs. ${sale.subtotal.toFixed(2)}` +
      (sale.discount > 0 ? `%0ADiscount: Rs. ${sale.discount.toFixed(2)}` : '') +
      `%0A*Total: Rs. ${sale.total.toFixed(2)}*` +
      `%0AStatus: ${sale.paymentStatus.toUpperCase()}` +
      `%0A%0A${shopProfile.footerNote}`;

    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    const element = document.getElementById('invoice-preview');
    if (!lastInvoice) return;
    const opt = {
      margin: 10,
      filename: `Invoice_${lastInvoice.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleSharePdf = async () => {
    if (!lastInvoice) return;
    setIsSharing(true);
    const element = document.getElementById('invoice-preview');
    const opt = {
      margin: 10,
      filename: `Invoice_${lastInvoice.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const file = new File([pdfBlob], `Invoice_${lastInvoice.id}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Invoice #${lastInvoice.id.slice(-8)}` });
      } else {
        alert("Sharing not supported in this browser.");
      }
    } catch (e) { console.error(e); } finally { setIsSharing(false); }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex gap-4 overflow-hidden">
      
      {/* LEFT PANE: PRODUCT SELECTION & ENTRY (50%) */}
      <div className="flex-1 flex flex-col space-y-4 no-print overflow-hidden">
        
        {/* Quick Entry Form */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xs font-black text-cyan-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Keyboard size={16} /> Quick Direct Entry
          </h3>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-5">
              <input id="manual-item-name" type="text" placeholder="Item Name" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl font-bold focus:border-cyan-500 outline-none transition-all text-sm" value={manualName} onChange={(e) => setManualName(e.target.value)} />
            </div>
            <div className="col-span-2">
              <input type="number" placeholder="Qty" className="w-full px-3 py-3 border-2 border-slate-100 rounded-xl font-black text-center focus:border-cyan-500 outline-none text-sm" value={manualQty} onChange={(e) => setManualQty(e.target.value)} />
            </div>
            <div className="col-span-3">
              <input type="number" placeholder="Price" className="w-full px-3 py-3 border-2 border-slate-100 rounded-xl font-black text-center focus:border-cyan-500 outline-none text-sm" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} />
            </div>
            <div className="col-span-2">
              <button onClick={addManualItem} className="w-full h-full bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 shadow-lg active:scale-95 flex items-center justify-center"><Plus size={24} strokeWidth={3} /></button>
            </div>
          </div>
        </div>

        {/* Product Inventory Browser */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search inventory..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase bg-white outline-none" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="p-4 bg-white border-2 border-slate-50 rounded-2xl text-left hover:border-cyan-500 transition-all group flex flex-col justify-between h-36 relative overflow-hidden">
                <div className="absolute -right-2 -top-2 opacity-5 group-hover:opacity-10 transition-opacity"><Tag size={60} /></div>
                <div>
                  <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase">{p.category}</span>
                  <h4 className="font-bold text-slate-800 mt-2 text-sm leading-tight uppercase line-clamp-2">{p.name}</h4>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black text-slate-900">Rs. {p.price.toFixed(2)}</span>
                  <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-cyan-600 group-hover:text-white transition-colors"><Plus size={16} /></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: BILL REVIEW (50%) */}
      <div className="flex-1 flex flex-col space-y-4 no-print overflow-hidden">
        
        {/* Cart Review */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3"><ShoppingCart size={20} className="text-cyan-600"/> Current Bill</h2>
            <div className="flex items-center gap-3">
               <span className="bg-cyan-600 text-white px-3 py-1 rounded-lg text-xs font-black">{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
               <button onClick={() => setCart([])} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"><Trash2 size={14}/> Clear Bill</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><ShoppingCart size={60} /><p className="font-bold mt-2 uppercase tracking-widest text-sm">Cart is empty</p></div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl group relative border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-900 uppercase leading-none">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Unit Price: Rs. {item.price.toFixed(2)}</p>
                  </div>
                  
                  {/* Manual Quantity Adjustment */}
                  <div className="flex items-center bg-white rounded-lg p-1 border shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:text-red-500 transition-colors"><Minus size={14} /></button>
                    <input 
                        type="number"
                        className="w-12 text-center font-black text-sm bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.quantity === 0 ? '' : item.quantity}
                        onChange={(e) => setManualQuantity(item.id, e.target.value)}
                        onBlur={(e) => { if(!e.target.value) setManualQuantity(item.id, "1"); }}
                    />
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:text-green-500 transition-colors"><Plus size={14} /></button>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <p className="font-black text-slate-900 text-sm">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                  </div>

                  {/* Clearly visible Delete Button */}
                  <button 
                    onClick={() => removeFromCart(item.id)} 
                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all ml-2"
                    title="Remove item"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {/* Customer Details */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Customer Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in Customer" />
                </div>
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Contact Phone</label>
                <input type="text" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="07XXXXXXXX" />
              </div>
            </div>
          </div>
        </div>

        {/* Calculation & Settlement */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Discount (Rs.)</label>
              <input type="number" className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-amber-400 font-black text-lg outline-none focus:border-amber-500 transition-all" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cash Tendered (Rs.)</label>
              <div className="relative">
                <Banknote size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="number" className="w-full pl-10 pr-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-green-400 font-black text-xl outline-none focus:border-green-500 transition-all" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-slate-800">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Grand Total</span>
              <span className="text-4xl font-black text-white">Rs. {total.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Balance Due</span>
              <span className={`text-2xl font-black ${change >= 0 ? 'text-cyan-400' : 'text-red-500'}`}>Rs. {change.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
             <div className="grid grid-cols-4 gap-2">
               {(['Cash', 'Card', 'Online', 'Credit'] as const).map(m => (
                 <button key={m} onClick={() => setPaymentMethod(m)} className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${paymentMethod === m ? (m === 'Credit' ? 'bg-red-600 border-red-400 text-white shadow-lg' : 'bg-cyan-600 border-cyan-400 text-white shadow-lg') : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}>{m}</button>
               ))}
             </div>
             
             <button onClick={handleCheckout} disabled={cart.length === 0 || isProcessing} className={`w-full py-5 rounded-2xl font-black uppercase text-xl flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${paymentMethod === 'Credit' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
                {isProcessing ? <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"/> : <><CheckCircle size={28} /> {paymentMethod === 'Credit' ? 'Confirm Credit Sale' : 'Finish Transaction'}</>}
             </button>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && lastInvoice && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-h-[95vh] overflow-hidden flex flex-col w-full max-w-5xl">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tighter"><CheckCircle className="text-green-500" size={32} /> Bill Generated</h2>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">INV-#{lastInvoice.id.slice(-8)}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={handlePrint} className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all text-sm font-black uppercase tracking-widest"><Printer size={20} /> Print</button>
                <button onClick={handleSharePdf} disabled={isSharing} className="flex items-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-black uppercase tracking-widest"><Share2 size={20} /> Share</button>
                <button onClick={handleDownloadPdf} className="flex items-center gap-3 px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-all text-sm font-black uppercase tracking-widest"><Download size={20} /> PDF</button>
                <button onClick={handleClosePreview} className="ml-4 p-3 text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={28} /></button>
              </div>
            </div>

            <div className="overflow-y-auto p-12 bg-slate-200 flex justify-center">
              <div id="invoice-preview" className="bg-white p-16 w-[210mm] min-h-[297mm] flex flex-col shadow-xl">
                <div className="flex justify-between border-b-8 border-slate-900 pb-10 mb-10">
                  <div className="flex gap-8 items-center">
                    {shopProfile.logo ? <img src={shopProfile.logo} className="w-24 h-24 object-contain" /> : <div className="bg-slate-900 text-white p-5 rounded-3xl"><Store size={48} /></div>}
                    <div>
                      <h1 className="text-5xl font-black tracking-tighter uppercase">{shopProfile.name}</h1>
                      <p className="text-lg font-bold text-slate-400 tracking-[0.3em] uppercase">Premium Printing Services</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-black text-slate-200 uppercase tracking-[0.2em]">Retail Bill</h2>
                    <p className="font-mono text-2xl font-black">#{lastInvoice.id.slice(-8)}</p>
                    <p className="text-lg text-slate-500 font-bold uppercase">{new Date(lastInvoice.date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-16 mb-12">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Customer Info</h3>
                    <p className="font-black text-2xl uppercase">{lastInvoice.customerName}</p>
                    <p className="text-lg text-slate-600 font-bold">{lastInvoice.customerContact || 'Walk-in Client'}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Business Info</h3>
                    <p className="font-black text-slate-900 text-lg uppercase">{shopProfile.name}</p>
                    <p className="whitespace-pre-line text-sm opacity-60 leading-relaxed font-medium">{shopProfile.address}</p>
                    <p className="pt-2 font-black text-slate-800 uppercase text-xs tracking-widest">TEL: {shopProfile.phone}</p>
                  </div>
                </div>

                <div className="mb-10 flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-4 border-slate-900 text-[11px] font-black uppercase tracking-[0.2em]">
                        <th className="py-4 pl-4">Description</th>
                        <th className="py-4 text-center w-24">Qty</th>
                        <th className="py-4 text-right w-40">Unit Price</th>
                        <th className="py-4 text-right w-40 pr-4">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-50 text-lg font-bold">
                      {lastInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-6 pl-4 uppercase tracking-tighter">{item.name}</td>
                          <td className="py-6 text-center text-slate-400">{item.quantity}</td>
                          <td className="py-6 text-right text-slate-400">Rs. {item.price.toFixed(2)}</td>
                          <td className="py-6 text-right font-black pr-4">Rs. {(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mb-10">
                  <div className="w-96 space-y-4 bg-slate-50 p-10 rounded-[3rem]">
                    <div className="flex justify-between text-lg font-bold text-slate-400 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>Rs. {lastInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    {lastInvoice.discount > 0 && (
                      <div className="flex justify-between text-lg font-bold text-amber-500 uppercase tracking-widest">
                        <span>Discount</span>
                        <span>- Rs. {lastInvoice.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-6 border-t-4 border-slate-900">
                      <span className="text-2xl font-black uppercase">Grand Total</span>
                      <span className="text-4xl font-black underline underline-offset-8 decoration-cyan-500 decoration-8">Rs. {lastInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t-8 border-slate-100 pt-12 text-center">
                  <p className="text-2xl font-black uppercase tracking-[0.3em] mb-4">{shopProfile.footerNote}</p>
                  <p className="text-xs text-slate-300 font-black uppercase tracking-[0.8em] italic">Certified Official Document • AR Printers System</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
