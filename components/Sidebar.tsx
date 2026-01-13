import React, { useEffect, useState } from 'react';
import { LayoutDashboard, ShoppingCart, Package, Truck, BarChart3, Bot, Printer, Users, Download, Settings } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
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
    { id: AppView.SETTINGS, label: 'Shop Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-20 no-print">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="bg-cyan-500 p-2 rounded-lg">
          <Printer size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">AR PRINTERS</h1>
          <p className="text-xs text-slate-400">POS System v1.0</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-cyan-600 text-white shadow-md' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <Download size={16} /> Install App
          </button>
        )}

        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
            MA
          </div>
          <div>
            <p className="text-sm font-medium">Mohamed Asarudeen</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
};