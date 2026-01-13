import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Truck, BarChart3, Bot, Printer, Users, Download, Settings, Menu, X } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        setDeferredPrompt(null);
      });
    }
  };

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: AppView.POS, label: 'Billing / POS', icon: ShoppingCart },
    { id: AppView.CREDIT_LEDGER, label: 'Credit Ledger', icon: Users },
    { id: AppView.INVENTORY, label: 'Inventory', icon: Package },
    { id: AppView.PURCHASES, label: 'Purchases', icon: Truck },
    { id: AppView.REPORTS, label: 'Reports', icon: BarChart3 },
    { id: AppView.AI_ASSISTANT, label: 'AI Advisor', icon: Bot },
    { id: AppView.SETTINGS, label: 'Settings', icon: Settings },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleNavClick = (view: AppView) => {
    onChangeView(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-md no-print">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-500 p-1.5 rounded-lg">
            <Printer size={18} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">AR PRINTERS</h1>
        </div>
        <button onClick={toggleSidebar} className="p-2 text-slate-400 hover:text-white transition-colors">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden no-print"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col shadow-xl z-50 transition-transform duration-300 no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64
      `}>
        <div className="p-6 border-b border-slate-700 hidden lg:flex items-center gap-3">
          <div className="bg-cyan-500 p-2 rounded-lg">
            <Printer size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AR PRINTERS</h1>
            <p className="text-xs text-slate-400">Offline POS System</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-cyan-600 text-white shadow-lg scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              <Download size={16} /> Install App
            </button>
          )}

          <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-black text-white shadow-inner">
              AR
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black truncate uppercase tracking-tighter">AR Printers HQ</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Admin Portal</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
