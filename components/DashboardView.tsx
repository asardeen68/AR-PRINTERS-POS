import React, { useMemo } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp } from 'lucide-react';
import { Product, Sale } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ products, sales }) => {
  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, curr) => acc + curr.total, 0);
    const totalOrders = sales.length;
    const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;
    
    // Calculate profit (Total Sales - Cost of Goods Sold)
    const totalCost = sales.reduce((acc, sale) => {
      const saleCost = sale.items.reduce((itemAcc, item) => itemAcc + (item.cost * item.quantity), 0);
      return acc + saleCost;
    }, 0);
    const totalProfit = totalSales - totalCost;

    return { totalSales, totalOrders, lowStockCount, totalProfit };
  }, [products, sales]);

  const salesData = useMemo(() => {
    // Group sales by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const daySales = sales.filter(s => s.date.startsWith(date));
      return {
        date: date.slice(5), // MM-DD
        amount: daySales.reduce((sum, s) => sum + s.total, 0)
      };
    });
  }, [sales]);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-slate-800">{value}</h3>
          {subtext && <p className="text-xs text-green-600 mt-1 flex items-center">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <span className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`Rs. ${stats.totalSales.toFixed(2)}`} 
          icon={DollarSign} 
          color="bg-green-500" 
          subtext="+12.5% from last month"
        />
        <StatCard 
          title="Total Orders" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          color="bg-blue-500"
          subtext={`${sales.filter(s => s.date.startsWith(new Date().toISOString().split('T')[0])).length} today`}
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats.lowStockCount} 
          icon={AlertTriangle} 
          color="bg-amber-500"
          subtext="Requires attention"
        />
        <StatCard 
          title="Est. Profit" 
          value={`Rs. ${stats.totalProfit.toFixed(2)}`} 
          icon={TrendingUp} 
          color="bg-purple-500"
          subtext="Based on avg. cost"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Sales Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#0891b2" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Low Stock Alerts</h3>
            <button className="text-sm text-cyan-600 font-medium hover:text-cyan-700">View All</button>
          </div>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {products.filter(p => p.stock <= p.minStockLevel).length === 0 ? (
              <p className="text-slate-500 italic">Inventory is healthy.</p>
            ) : (
              products.filter(p => p.stock <= p.minStockLevel).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 font-bold border border-red-100">
                      !
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{product.name}</p>
                      <p className="text-xs text-red-600">Stock: {product.stock} (Min: {product.minStockLevel})</p>
                    </div>
                  </div>
                  <button className="px-3 py-1 bg-white border border-red-200 text-red-600 rounded text-xs hover:bg-red-50">Reorder</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};