import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Minus, Printer, CheckCircle, ShoppingCart, CreditCard, Download, X, MessageCircle, Share2, Store, Keyboard, Tag, Layers, User, Banknote, Trash2, Globe, Mail, Phone } from 'lucide-react';
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
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>(''); 
  
  const [lastInvoice, setLastInvoice] = useState<Sale | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual entry states
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
    const input = document.getElementById('manual-item-name');
    if (input) input.focus();
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
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: isNaN(numValue) ? 0 : Math.max(0, numValue) };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const total = subtotal - discountAmount;
    const change = paidAmount ? parseFloat(paidAmount) - total : 0;
    return { subtotal, total, change };
  };

  const { subtotal, total, change } = calculateTotals();

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'Credit' && (!customerName.trim() || !customerContact.trim())) {
        alert("Customer Name and Contact are mandatory for Credit sales.");
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
      tax: 0,
      discount: discountAmount,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'Credit' ? 'Pending' : 'Paid'
    };

    try {
        await db.saveSale(newSale);
        setLastInvoice(newSale);
        setShowPreview(true);
        setCart([]);
        setCustomerName('');
        setCustomerContact('');
        setPaymentMethod('Cash');
        setDiscountAmount(0);
        setPaidAmount('');
        onSaleComplete();
    } catch (error) {
        console.error(error);
        alert("Failed to process sale.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleClosePreview = () => setShowPreview(false);
  const handlePrint = () => window.print();

  const handleDownloadPdf = () => {
    const element = document.getElementById('invoice-preview');
    if (!lastInvoice) return;
    const opt = {
      margin: 5,
      filename: `AR_Printers_Inv_${lastInvoice.id.slice(-6)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(element).save();
    } else {
      alert("PDF generator not loaded. Please ensure you have an internet connection to load the PDF library initially.");
    }
  };

  const handleSharePdf = async () => {
    if (!lastInvoice) return;
    setIsSharing(true);
    const element = document.getElementById('invoice-preview');
    const opt = {
      margin: 5,
      filename: `Invoice_${lastInvoice.id.slice(-6)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    try {
      if (typeof html2pdf === 'undefined') throw new Error("Library not loaded");
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const file = new File([pdfBlob], `AR_Printers_Inv_${lastInvoice.id.slice(-6)}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ 
            files: [file], 
            title: `Invoice #${lastInvoice.id.slice(-6)}`,
            text: `Receipt for ${lastInvoice.customerName} from AR Printers.`
        });
      } else {
        alert("Web Share API not supported on this device. Use the download button instead.");
      }
    } catch (e) { 
        console.error(e); 
        alert("Could not share PDF. Please download it first.");
    } finally { 
        setIsSharing(false); 
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 overflow-hidden">
      
      {/* LEFT: ENTRY & SELECTION */}
      <div className="w-full lg:w-[55%] flex flex-col space-y-4 no-print overflow-hidden">
        {/* Quick Entry Form */}
        <div className="bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Keyboard size={14} /> Direct Item Entry
          </h3>
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 md:col-span-5">
              <input id="manual-item-name" type="text" placeholder="Item Name" className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl font-bold focus:border-cyan-500 outline-none text-sm" value={manualName} onChange={(e) => setManualName(e.target.value)} />
            </div>
            <div className="col-span-4 md:col-span-2">
              <input type="number" placeholder="Qty" className="w-full px-3 py-3 border-2 border-slate-100 rounded-xl font-black text-center focus:border-cyan-500 outline-none text-sm" value={manualQty} onChange={(e) => setManualQty(e.target.value)} />
            </div>
            <div className="col-span-5 md:col-span-3">
              <input type="number" placeholder="Price" className="w-full px-3 py-3 border-2 border-slate-100 rounded-xl font-black text-center focus:border-cyan-500 outline-none text-sm" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} />
            </div>
            <div className="col-span-3 md:col-span-2">
              <button onClick={addManualItem} className="w-full h-full bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 shadow-lg active:scale-95 flex items-center justify-center transition-all"><Plus size={24} strokeWidth={3} /></button>
            </div>
          </div>
        </div>

        {/* Product Inventory Browser */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Search products..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase bg-white outline-none" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 content-start">
            {filteredProducts.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="p-4 bg-white border-2 border-slate-50 rounded-2xl text-left hover:border-cyan-500 transition-all group flex flex-col justify-between h-32 relative overflow-hidden">
                <div className="absolute -right-2 -top-2 opacity-5 group-hover:opacity-10"><Tag size={48} /></div>
                <div>
                  <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-tighter">{p.category}</span>
                  <h4 className="font-bold text-slate-800 mt-2 text-[11px] leading-tight uppercase line-clamp-2">{p.name}</h4>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-slate-900">Rs.{p.price.toFixed(0)}</span>
                  <div className="p-1 bg-slate-100 rounded-lg group-hover:bg-cyan-600 group-hover:text-white transition-colors"><Plus size={14} /></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: BILL SUMMARY */}
      <div className="w-full lg:w-[45%] flex flex-col space-y-4 no-print overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-3"><ShoppingCart size={20} className="text-cyan-600"/> Current Bill</h2>
            <button onClick={() => setCart([])} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"><Trash2 size={14}/> Clear</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20"><ShoppingCart size={60} /><p className="font-bold mt-2 uppercase tracking-widest text-sm">Cart is Empty</p></div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl group relative border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[11px] text-slate-900 uppercase leading-none truncate">{item.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Rs. {item.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center bg-white rounded-lg p-1 border shadow-sm">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-500"><Minus size={14} /></button>
                    <input 
                        type="number"
                        className="w-10 text-center font-black text-xs bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.quantity}
                        onChange={(e) => setManualQuantity(item.id, e.target.value)}
                    />
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-green-500"><Plus size={14} /></button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <p className="font-black text-slate-900 text-xs">Rs.{(item.price * item.quantity).toFixed(0)}</p>
                  </div>

                  <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Customer Name</label>
                <input type="text" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-cyan-500 outline-none" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Contact Phone</label>
                <input type="text" className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:border-cyan-500 outline-none" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} placeholder="07XXXXXXXX" />
              </div>
            </div>
          </div>
        </div>

        {/* Totals & Finish */}
        <div className="bg-slate-900 rounded-2xl p-5 lg:p-6 text-white shadow-xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Discount (Rs.)</label>
              <input type="number" className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-amber-400 font-black text-lg outline-none focus:border-amber-500" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cash Given (Rs.)</label>
              <input type="number" className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl text-green-400 font-black text-lg outline-none focus:border-green-500" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-slate-800">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Net Payable</span>
              <span className="text-4xl font-black text-white font-mono">Rs.{total.toFixed(0)}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Balance</span>
              <span className={`text-2xl font-black font-mono ${change >= 0 ? 'text-cyan-400' : 'text-red-500'}`}>Rs.{change.toFixed(0)}</span>
            </div>
          </div>

          <div className="space-y-3">
             <div className="grid grid-cols-4 gap-2">
               {(['Cash', 'Card', 'Online', 'Credit'] as const).map(m => (
                 <button key={m} onClick={() => setPaymentMethod(m)} className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${paymentMethod === m ? (m === 'Credit' ? 'bg-red-600 border-red-400 text-white shadow-lg' : 'bg-cyan-600 border-cyan-400 text-white shadow-lg') : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{m}</button>
               ))}
             </div>
             
             <button onClick={handleCheckout} disabled={cart.length === 0 || isProcessing} className={`w-full py-5 rounded-2xl font-black uppercase text-xl flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${paymentMethod === 'Credit' ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' : 'bg-green-600 hover:bg-green-500 shadow-green-500/20'}`}>
                {isProcessing ? <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"/> : <><CheckCircle size={28} /> {paymentMethod === 'Credit' ? 'Record Credit' : 'Complete Bill'}</>}
             </button>
          </div>
        </div>
      </div>

      {/* INVOICE MODAL */}
      {showPreview && lastInvoice && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-2 lg:p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl max-h-screen lg:max-h-[95vh] flex flex-col w-full max-w-5xl">
            <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50 no-print gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-black text-slate-900 uppercase">Billing Successful</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Serial #{lastInvoice.id.slice(-6)}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 lg:gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-black transition-all"><Printer size={16} /> Print</button>
                <button onClick={handleSharePdf} disabled={isSharing} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-indigo-700 transition-all"><Share2 size={16} /> {isSharing ? 'Sharing...' : 'Share'}</button>
                <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-cyan-700 transition-all"><Download size={16} /> PDF</button>
                <button onClick={handleClosePreview} className="ml-2 p-2.5 text-slate-400 hover:bg-slate-200 rounded-full transition-all"><X size={24} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-slate-100 flex justify-center">
              <div id="invoice-preview" className="bg-white p-6 lg:p-12 w-full lg:w-[210mm] min-h-[297mm] flex flex-col shadow-2xl border border-slate-200">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start border-b-8 border-slate-900 pb-8 mb-8 gap-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left">
                        {shopProfile.logo ? (
                            <img src={shopProfile.logo} alt="Shop Logo" className="w-24 h-24 lg:w-32 lg:h-32 object-contain" />
                        ) : (
                            <div className="bg-slate-900 text-white p-6 rounded-3xl"><Store size={40} /></div>
                        )}
                        <div>
                            <h1 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase leading-none">{shopProfile.name}</h1>
                            <p className="text-[10px] lg:text-xs font-bold text-slate-400 tracking-[0.4em] uppercase mt-2 italic">Official Printing & Solutions Hub</p>
                            <div className="mt-4 space-y-1 text-slate-600 font-bold text-[9px] lg:text-[10px] uppercase">
                                <p className="flex items-center justify-center sm:justify-start gap-2"><Phone size={10} className="text-cyan-600" /> {shopProfile.phone}</p>
                                <p className="flex items-center justify-center sm:justify-start gap-2"><Mail size={10} className="text-cyan-600" /> {shopProfile.email}</p>
                                {shopProfile.website && <p className="flex items-center justify-center sm:justify-start gap-2"><Globe size={10} className="text-cyan-600" /> {shopProfile.website}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="text-center sm:text-right">
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-100 uppercase tracking-widest mb-2 select-none">Receipt</h2>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Serial ID</p>
                            <p className="font-mono text-xl lg:text-2xl font-black text-slate-900">#{lastInvoice.id.slice(-6)}</p>
                            <p className="text-xs lg:text-sm font-black text-slate-500 uppercase">{new Date(lastInvoice.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                    <div className="bg-slate-50 p-5 rounded-3xl border-l-8 border-cyan-500">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Billed To</h3>
                        <p className="font-black text-2xl lg:text-3xl text-slate-900 uppercase leading-tight">{lastInvoice.customerName}</p>
                        <p className="text-sm lg:text-base font-bold text-slate-500 mt-1">{lastInvoice.customerContact || 'Direct Customer'}</p>
                    </div>
                    <div className="text-center sm:text-right p-2 sm:p-5">
                        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Business Address</h3>
                        <p className="font-black text-slate-800 text-[10px] lg:text-xs whitespace-pre-line leading-relaxed uppercase">{shopProfile.address}</p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-4 border-slate-900 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                                <th className="py-4 pl-4">Item Details</th>
                                <th className="py-4 text-center w-20 lg:w-24">Qty</th>
                                <th className="py-4 text-right w-32 lg:w-40">Price</th>
                                <th className="py-4 text-right w-36 lg:w-44 pr-4">Line Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm lg:text-base font-bold text-slate-700">
                            {lastInvoice.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 lg:py-5 pl-4 uppercase tracking-tight">{item.name}</td>
                                    <td className="py-4 lg:py-5 text-center text-slate-400">{item.quantity}</td>
                                    <td className="py-4 lg:py-5 text-right text-slate-400 font-mono">Rs.{item.price.toFixed(0)}</td>
                                    <td className="py-4 lg:py-5 text-right font-black text-slate-900 pr-4 font-mono text-lg">Rs.{(item.price * item.quantity).toFixed(0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="mt-10 flex justify-end">
                    <div className="w-full sm:w-[380px] space-y-4 bg-slate-900 text-white p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] shadow-xl relative overflow-hidden">
                        <div className="absolute -left-10 -top-10 opacity-5 text-white pointer-events-none"><ShoppingCart size={150} /></div>
                        
                        <div className="flex justify-between items-center text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-400">
                            <span>Subtotal Amount</span>
                            <span className="font-mono">Rs.{lastInvoice.subtotal.toFixed(0)}</span>
                        </div>
                        {lastInvoice.discount > 0 && (
                            <div className="flex justify-between items-center text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-amber-500">
                                <span>Discount Apply</span>
                                <span className="font-mono">- Rs.{lastInvoice.discount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-5 lg:pt-6 border-t border-slate-700">
                            <span className="text-lg lg:text-xl font-black uppercase tracking-tighter text-cyan-400">Total Due</span>
                            <span className="text-3xl lg:text-4xl font-black font-mono">Rs.{lastInvoice.total.toFixed(0)}</span>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-700/50 mt-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            <div className="flex justify-between">
                                <span>Mode of Payment:</span>
                                <span className="text-white uppercase">{lastInvoice.paymentMethod}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center border-t border-slate-100 pt-8">
                    <p className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-[0.3em] mb-2">{shopProfile.footerNote}</p>
                    <p className="text-[8px] lg:text-[9px] text-slate-300 font-black uppercase tracking-[0.8em] italic">Electronic Document • AR Printers Authorized</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
