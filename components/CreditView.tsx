import React, { useMemo, useState } from 'react';
import { User, Phone, Calendar, CheckCircle, Search, ChevronRight, ArrowLeft, History, Filter } from 'lucide-react';
import { Sale } from '../types';
import { db } from '../services/db';

interface CreditViewProps {
  sales: Sale[];
  onUpdate: () => void;
}

export const CreditView: React.FC<CreditViewProps> = ({ sales, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<{name: string, contact: string} | null>(null);
  const [showSettled, setShowSettled] = useState(false); // Toggle to show/hide cleared customers

  const customers = useMemo(() => {
    const customerMap = new Map();
    sales.forEach(sale => {
      // Logic for AR Printers: we consider it a credit record if method is Credit OR it was previously Credit (tagged)
      const isActuallyCredit = sale.paymentMethod === 'Credit';
      const wasCreditOriginally = sale.id.startsWith('settled-');

      if (isActuallyCredit || wasCreditOriginally) {
        const key = `${sale.customerName}-${sale.customerContact || 'nocontact'}`;
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            name: sale.customerName,
            contact: sale.customerContact || '',
            totalCredit: 0,
            totalPaid: 0,
            lastDate: sale.date
          });
        }
        const c = customerMap.get(key);
        
        c.totalCredit += sale.total;
        if (sale.paymentStatus === 'Paid') {
          c.totalPaid += sale.total;
        }
        if (new Date(sale.date) > new Date(c.lastDate)) c.lastDate = sale.date;
      }
    });

    return Array.from(customerMap.values())
      .map(c => ({...c, outstanding: c.totalCredit - c.totalPaid}))
      .filter(c => showSettled || c.outstanding > 0.01) // Filter out settled accounts unless toggled
      .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.contact.includes(searchTerm))
      .sort((a, b) => b.outstanding - a.outstanding);
  }, [sales, searchTerm, showSettled]);

  const customerHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales
      .filter(s => {
        const matchesName = s.customerName === selectedCustomer.name;
        const matchesContact = (s.customerContact || '') === selectedCustomer.contact;
        const isDebtRelated = s.paymentMethod === 'Credit' || s.id.startsWith('settled-');
        return matchesName && matchesContact && isDebtRelated;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, selectedCustomer]);

  const handleSettle = async (sale: Sale) => {
    if (window.confirm(`Mark Bill #${sale.id.slice(-6)} as Settled? This will record Rs.${sale.total.toFixed(0)} as a CASH SALE in today's report.`)) {
      // Update the sale: mark as Paid, switch method to Cash, and tag the ID to maintain ledger history logic
      await db.updateSale({ 
        ...sale, 
        paymentStatus: 'Paid',
        paymentMethod: 'Cash',
        id: sale.id.startsWith('settled-') ? sale.id : `settled-${sale.id}`
      });
      onUpdate();
    }
  };

  if (!selectedCustomer) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Credit Ledger</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Manage client accounts and receivables</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowSettled(!showSettled)} 
              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 transition-all ${
                showSettled ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'border-slate-200 text-slate-400 hover:text-slate-600'
              }`}
            >
                <Filter size={14} /> {showSettled ? 'Viewing All' : 'Pending Only'}
            </button>
            <div className="bg-red-50 border-2 border-red-100 px-6 py-3 rounded-2xl flex flex-col items-center sm:items-end">
                <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Grand Receivables</span>
                <span className="text-2xl font-black text-red-700 tracking-tighter font-mono">Rs.{customers.reduce((acc, c) => acc + c.outstanding, 0).toFixed(0)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Search customer records..." className="w-full pl-10 pr-4 py-3 border-2 border-slate-100 rounded-xl focus:border-cyan-500 outline-none font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-8 py-5">Client Name</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5 text-right">Last Billing</th>
                  <th className="px-8 py-5 text-right">Net Balance</th>
                  <th className="px-8 py-5 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.length === 0 ? (
                  <tr><td colSpan={5} className="px-8 py-24 text-center text-slate-300 font-black uppercase text-xl opacity-20"><CheckCircle size={64} className="mx-auto mb-4" />No Outstanding Debt</td></tr>
                ) : (
                    customers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 cursor-pointer group transition-colors" onClick={() => setSelectedCustomer({name: c.name, contact: c.contact})}>
                      <td className="px-8 py-6">
                          <p className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none">{c.name}</p>
                          <span className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest mt-1 block">Account History Available</span>
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-bold font-mono">{c.contact || '---'}</td>
                      <td className="px-8 py-6 text-right text-slate-400 font-bold">{new Date(c.lastDate).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-right">
                          <span className={`font-black text-2xl tracking-tighter font-mono ${c.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            Rs.{c.outstanding.toFixed(0)}
                          </span>
                      </td>
                      <td className="px-8 py-6 text-center text-slate-300 group-hover:text-cyan-600 transition-colors"><ChevronRight size={24} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 lg:pb-0">
       <div className="flex items-center gap-6">
        <button onClick={() => setSelectedCustomer(null)} className="p-3 bg-white shadow-sm rounded-full text-slate-600 transition-all border border-slate-200 hover:bg-slate-50"><ArrowLeft size={24} /></button>
        <div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">{selectedCustomer.name}</h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mt-1"><Phone size={12} className="text-cyan-600" /> {selectedCustomer.contact || 'No Phone Record'}</p>
        </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 -mr-12 -mt-12 rounded-full" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Active Debt</p>
                <p className="text-4xl font-black text-red-600 tracking-tighter font-mono">Rs.{(customerHistory.filter(s => s.paymentStatus === 'Pending').reduce((acc, s) => acc + s.total, 0)).toFixed(0)}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Historic Credit</p>
                <p className="text-4xl font-black text-slate-900 tracking-tighter font-mono">Rs.{(customerHistory.reduce((acc, s) => acc + s.total, 0)).toFixed(0)}</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Order Frequency</p>
                <p className="text-4xl font-black text-cyan-600 tracking-tighter">{customerHistory.length} <span className="text-lg text-slate-300">Bills</span></p>
            </div>
       </div>

       <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-[11px] flex items-center gap-3"><History size={16} className="text-cyan-600" /> Ledger Timeline</h3>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sorted by Date (Newest First)</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[850px]">
                <thead className="bg-white text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b">
                    <tr>
                        <th className="px-8 py-5">Date / Time</th>
                        <th className="px-8 py-5">Serial #</th>
                        <th className="px-8 py-5">Bill Contents</th>
                        <th className="px-8 py-5 text-right">Invoice Total</th>
                        <th className="px-8 py-5 text-center">Payment Status</th>
                        <th className="px-8 py-5 text-right">Operations</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {customerHistory.map(sale => (
                        <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6">
                                <div className="font-black text-slate-900 text-sm uppercase">{new Date(sale.date).toLocaleDateString()}</div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase">{new Date(sale.date).toLocaleTimeString()}</div>
                            </td>
                            <td className="px-8 py-6 font-mono text-xs text-slate-500 font-bold">#{sale.id.slice(-6).toUpperCase()}</td>
                            <td className="px-8 py-6">
                                <div className="text-[11px] font-bold text-slate-600 uppercase truncate w-64">
                                    {sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                                </div>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-slate-900 font-mono text-lg">Rs.{sale.total.toFixed(0)}</td>
                            <td className="px-8 py-6 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                                    sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {sale.paymentStatus}
                                </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                {sale.paymentStatus === 'Pending' ? (
                                    <button 
                                        onClick={() => handleSettle(sale)} 
                                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-green-700 transition-all shadow-md active:scale-95 flex items-center gap-2 ml-auto"
                                    >
                                        <CheckCircle size={14} /> Settle to Cash
                                    </button>
                                ) : (
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic flex items-center justify-end gap-2">
                                        <CheckCircle size={14} className="text-green-500" /> Cleared on Cash
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
       </div>
    </div>
  );
};
