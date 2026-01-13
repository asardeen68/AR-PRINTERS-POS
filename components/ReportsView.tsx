import React, { useState, useMemo } from 'react';
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, FileText } from 'lucide-react';
import { Sale, Purchase, Product, ShopProfile } from '../types';

declare const html2pdf: any;

interface ReportsViewProps {
  sales: Sale[];
  purchases: Purchase[];
  products: Product[];
  shopProfile: ShopProfile;
}

type ReportType = 'SALES' | 'PURCHASES' | 'INVENTORY' | 'PROFIT';

export const ReportsView: React.FC<ReportsViewProps> = ({ sales, purchases, products, shopProfile }) => {
  const [activeTab, setActiveTab] = useState<ReportType>('SALES');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter Data
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = s.date.split('T')[0];
      return d >= startDate && d <= endDate;
    });
  }, [sales, startDate, endDate]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const d = p.date.split('T')[0];
      return d >= startDate && d <= endDate;
    });
  }, [purchases, startDate, endDate]);

  const downloadPDF = () => {
    const element = document.getElementById('report-container');
    const opt = {
      margin: 10,
      filename: `${shopProfile.name.replace(/\s+/g, '_')}_${activeTab}_Report_${startDate}_to_${endDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const SummaryCard = ({ title, value, color }: any) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-xs font-bold text-slate-500 uppercase">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-start no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
          <p className="text-slate-500 text-sm">Generate and download business reports</p>
        </div>
        <div className="flex gap-4 items-end">
           <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" 
            />
           </div>
           <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" 
            />
           </div>
           <button 
            onClick={downloadPDF}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg flex items-center gap-2 hover:bg-slate-800 text-sm font-bold"
           >
            <Download size={16} /> Download PDF
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 no-print">
        {[
          { id: 'SALES', label: 'Sales Report', icon: TrendingUp },
          { id: 'PURCHASES', label: 'Purchase Report', icon: TrendingDown },
          { id: 'PROFIT', label: 'Profit & Loss', icon: DollarSign },
          { id: 'INVENTORY', label: 'Stock Value', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportType)}
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id 
              ? 'border-cyan-600 text-cyan-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content - This part gets printed/downloaded */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8" id="report-container">
        
        {/* PDF Header */}
        <div className="mb-8 border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-4">
               {shopProfile.logo && (
                   <img src={shopProfile.logo} alt="Logo" className="h-12 w-auto object-contain" />
               )}
               <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 uppercase">{shopProfile.name}</h1>
                  <p className="text-slate-500 whitespace-pre-line text-sm">{shopProfile.address}</p>
               </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-cyan-700 uppercase">{activeTab.replace('_', ' ')} REPORT</h2>
              <p className="text-sm text-slate-600 font-medium">Period: {startDate} to {endDate}</p>
            </div>
          </div>
        </div>

        {activeTab === 'SALES' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <SummaryCard title="Total Revenue" value={`Rs. ${filteredSales.reduce((sum, s) => sum + s.total, 0).toFixed(2)}`} color="text-green-600" />
              <SummaryCard title="Total Invoices" value={filteredSales.length} color="text-slate-800" />
              <SummaryCard title="Cash Sales" value={`Rs. ${filteredSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.total, 0).toFixed(2)}`} color="text-slate-600" />
              <SummaryCard title="Credit Sales" value={`Rs. ${filteredSales.filter(s => s.paymentMethod === 'Credit').reduce((sum, s) => sum + s.total, 0).toFixed(2)}`} color="text-amber-600" />
            </div>

            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td className="px-4 py-2 text-slate-600">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-mono text-xs">{sale.id.slice(-8)}</td>
                    <td className="px-4 py-2 font-medium">{sale.customerName}</td>
                    <td className="px-4 py-2 text-slate-500">{sale.paymentMethod}</td>
                    <td className="px-4 py-2 text-right font-bold">Rs. {sale.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'PURCHASES' && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4 mb-6">
              <SummaryCard title="Total Expenses" value={`Rs. ${filteredPurchases.reduce((sum, p) => sum + p.total, 0).toFixed(2)}`} color="text-red-600" />
              <SummaryCard title="Total Orders" value={filteredPurchases.length} color="text-slate-800" />
            </div>

            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Items Purchased</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map(purchase => (
                  <tr key={purchase.id}>
                    <td className="px-4 py-2 text-slate-600">{new Date(purchase.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 font-medium">{purchase.supplier}</td>
                    <td className="px-4 py-2 text-slate-500">
                        {purchase.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="px-4 py-2 text-right font-bold">Rs. {purchase.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'PROFIT' && (
          <div className="space-y-6">
             {/* 
                Profit Calculation Logic:
                Revenue = Total Sales
                COGS (Cost of Goods Sold) = Sum of (Item Cost * Qty) for all items in Sales
                Gross Profit = Revenue - COGS
                Expenses = Sum of Purchases (This acts as Cash Flow view, but for true P&L we usually use COGS. 
                However, for a simple shop, user might want Revenue - Purchases. 
                We will display Gross Profit based on COGS as it's more accurate for profitability)
             */}
            {(() => {
                const revenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
                const cogs = filteredSales.reduce((acc, sale) => {
                    const saleCost = sale.items.reduce((itemAcc, item) => itemAcc + (item.cost * item.quantity), 0);
                    return acc + saleCost;
                }, 0);
                const grossProfit = revenue - cogs;
                const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

                return (
                    <>
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                            <h3 className="text-green-800 font-bold uppercase text-sm">Total Revenue</h3>
                            <p className="text-3xl font-extrabold text-green-700 mt-2">Rs. {revenue.toFixed(2)}</p>
                        </div>
                         <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                            <h3 className="text-red-800 font-bold uppercase text-sm">Cost of Goods Sold</h3>
                            <p className="text-3xl font-extrabold text-red-700 mt-2">Rs. {cogs.toFixed(2)}</p>
                        </div>
                         <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                            <h3 className="text-slate-400 font-bold uppercase text-sm">Net Profit</h3>
                            <p className="text-3xl font-extrabold text-white mt-2">Rs. {grossProfit.toFixed(2)}</p>
                            <p className="text-cyan-400 text-sm mt-1 font-bold">Margin: {margin.toFixed(1)}%</p>
                        </div>
                    </div>

                    <div className="border rounded-xl p-4">
                        <h3 className="font-bold text-slate-800 mb-4">Detailed Breakdown</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-slate-500">
                                    <th className="text-left py-2">Metric</th>
                                    <th className="text-right py-2">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                <tr>
                                    <td className="py-3">Sales Income</td>
                                    <td className="py-3 text-right font-medium">Rs. {revenue.toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td className="py-3">Product Costs (COGS)</td>
                                    <td className="py-3 text-right text-red-600 font-medium">- Rs. {cogs.toFixed(2)}</td>
                                </tr>
                                <tr className="bg-slate-50">
                                    <td className="py-3 font-bold">Gross Profit</td>
                                    <td className="py-3 text-right font-bold text-slate-900">Rs. {grossProfit.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    </>
                );
            })()}
          </div>
        )}

        {activeTab === 'INVENTORY' && (
             <div className="space-y-6">
                 {(() => {
                    const totalStockValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
                    const totalStockCost = products.reduce((acc, p) => acc + (p.stock * p.cost), 0);

                    return (
                        <>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <SummaryCard title="Total Inventory Value (Retail)" value={`Rs. ${totalStockValue.toFixed(2)}`} color="text-cyan-600" />
                            <SummaryCard title="Total Inventory Cost (Asset)" value={`Rs. ${totalStockCost.toFixed(2)}`} color="text-slate-600" />
                        </div>
                         <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-xs">
                                <tr>
                                <th className="px-4 py-3">Product</th>
                                <th className="px-4 py-3">Stock</th>
                                <th className="px-4 py-3 text-right">Unit Cost</th>
                                <th className="px-4 py-3 text-right">Asset Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map(p => (
                                <tr key={p.id}>
                                    <td className="px-4 py-2 font-medium">{p.name} <span className="text-xs text-slate-400">({p.category})</span></td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            p.stock <= p.minStockLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-slate-500">Rs. {p.cost.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-right font-bold text-slate-800">Rs. {(p.stock * p.cost).toFixed(2)}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                        </>
                    );
                 })()}
             </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
            <p>Generated by {shopProfile.name} POS System on {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};