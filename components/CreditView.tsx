import React, { useMemo, useState } from 'react';
import { User, Phone, Calendar, CheckCircle, Search, ChevronRight, ArrowLeft, History } from 'lucide-react';
import { Sale } from '../types';
import { db } from '../services/db';

interface CreditViewProps {
  sales: Sale[];
  onUpdate: () => void;
}

export const CreditView: React.FC<CreditViewProps> = ({ sales, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<{name: string, contact: string} | null>(null);

  // Group sales by customer for the main list
  const customers = useMemo(() => {
    const customerMap = new Map();

    sales.forEach(sale => {
      // We track anyone who has EVER used Credit payment method
      if (sale.paymentMethod === 'Credit') {
        const key = `${sale.customerName}-${sale.customerContact || 'nocontact'}`;
        
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            name: sale.customerName,
            contact: sale.customerContact || '',
            totalCredit: 0,
            totalPaid: 0,
            pendingCount: 0,
            lastActivity: sale.date
          });
        }

        const customer = customerMap.get(key);
        customer.totalCredit += sale.total;
        
        if (sale.paymentStatus === 'Paid') {
            customer.totalPaid += sale.total;
        } else {
            customer.pendingCount += 1;
        }
        
        if (new Date(sale.date) > new Date(customer.lastActivity)) {
            customer.lastActivity = sale.date;
        }
      }
    });

    return Array.from(customerMap.values())
      .map(c => ({...c, outstanding: c.totalCredit - c.totalPaid}))
      .sort((a, b) => b.outstanding - a.outstanding); // Sort by highest debt
  }, [sales]);

  // Filter customers for main view
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact.includes(searchTerm)
  );

  // Get history for selected customer
  const customerHistory = useMemo(() => {
    if (!selectedCustomer) return [];
    return sales
      .filter(s => 
        s.paymentMethod === 'Credit' && 
        s.customerName === selectedCustomer.name && 
        (s.customerContact || '') === selectedCustomer.contact
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, selectedCustomer]);

  const handleSettle = async (sale: Sale) => {
    if (window.confirm(`Mark invoice #${sale.id.slice(-6)} as PAID?`)) {
      const updatedSale: Sale = {
        ...sale,
        paymentStatus: 'Paid',
      };
      await db.updateSale(updatedSale);
      onUpdate();
    }
  };

  const totalOutstandingAll = customers.reduce((acc, c) => acc + c.outstanding, 0);

  // View 1: Customer List
  if (!selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-bold text-slate-800">Credit Ledger</h2>
              <p className="text-slate-500">Overview of customer accounts</p>
          </div>
          <div className="bg-red-50 border border-red-100 px-6 py-3 rounded-xl flex flex-col items-end">
              <span className="text-xs font-semibold text-red-600 uppercase">Total Receivables</span>
              <span className="text-2xl font-bold text-red-700">Rs. {totalOutstandingAll.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex gap-4">
              <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                      type="text" 
                      placeholder="Search customers..." 
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Total Credit Taken</th>
                  <th className="px-6 py-4 text-right">Total Paid</th>
                  <th className="px-6 py-4 text-right">Balance Due</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <CheckCircle size={48} className="mx-auto mb-3 opacity-20 text-green-500" />
                          <p>No credit records found.</p>
                      </td>
                  </tr>
                ) : (
                    filteredCustomers.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedCustomer({name: customer.name, contact: customer.contact})}>
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {customer.name.charAt(0)}
                          </div>
                          {customer.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                          {customer.contact ? customer.contact : <span className="italic">N/A</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">
                          Rs. {customer.totalCredit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-green-600">
                          Rs. {customer.totalPaid.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold">
                          <span className={customer.outstanding > 0 ? 'text-red-600' : 'text-slate-400'}>
                              Rs. {customer.outstanding.toFixed(2)}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-cyan-600 hover:text-cyan-800">
                           <ChevronRight size={20} />
                        </button>
                      </td>
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

  // View 2: Customer History Detail
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <button 
            onClick={() => setSelectedCustomer(null)}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
        >
            <ArrowLeft size={24} />
        </button>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">{selectedCustomer.name}</h2>
            <p className="text-slate-500 flex items-center gap-2">
                <Phone size={14} /> {selectedCustomer.contact || 'No Contact Info'}
            </p>
        </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Total Outstanding</p>
                <p className="text-3xl font-bold text-red-600">
                    Rs. {customerHistory.filter(s => s.paymentStatus === 'Pending').reduce((acc, s) => acc + s.total, 0).toFixed(2)}
                </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Total Transactions</p>
                <p className="text-3xl font-bold text-slate-800">{customerHistory.length}</p>
            </div>
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <History size={18} /> Transaction History
              </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-slate-600 font-medium border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Invoice ID</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {customerHistory.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-500">
                            {new Date(sale.date).toLocaleDateString()}
                            <div className="text-xs text-slate-400">{new Date(sale.date).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600">{sale.id.slice(-8)}</td>
                        <td className="px-6 py-4">
                            {sale.items.map(i => i.name).join(', ').slice(0, 30)}
                            {sale.items.length > 1 && '...'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                            Rs. {sale.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                sale.paymentStatus === 'Paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                                {sale.paymentStatus.toUpperCase()}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            {sale.paymentStatus === 'Pending' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleSettle(sale); }}
                                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                                >
                                    Settle
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};