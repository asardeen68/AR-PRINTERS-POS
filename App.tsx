import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BillingView } from './components/BillingView';
import { InventoryView } from './components/InventoryView';
import { AIView } from './components/AIView';
import { CreditView } from './components/CreditView';
import { PurchaseView } from './components/PurchaseView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { AppView, Product, Sale, Purchase, ShopProfile } from './types';
import { db } from './services/db';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // Use a default state initially, will be populated by DB
  const [shopProfile, setShopProfile] = useState<ShopProfile>({
    name: 'Loading...', address: '', phone: '', email: '', footerNote: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Load
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    }
  }, [isAuthenticated]);

  const refreshData = async () => {
    try {
        const [prodData, salesData, purchData, profileData] = await Promise.all([
            db.getProducts(),
            db.getSales(),
            db.getPurchases(),
            db.getShopProfile()
        ]);
        
        setProducts(prodData);
        setSales(salesData);
        setPurchases(purchData);
        setShopProfile(profileData);
    } catch (error) {
        console.error("Failed to load data from local database:", error);
    } finally {
        setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderView = () => {
    if (isLoading) {
        return <div className="flex items-center justify-center h-full text-slate-500">Loading Local Database...</div>;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView products={products} sales={sales} />;
      case AppView.POS:
        return <BillingView products={products} shopProfile={shopProfile} onSaleComplete={refreshData} />;
      case AppView.INVENTORY:
        return <InventoryView products={products} onUpdate={refreshData} />;
      case AppView.AI_ASSISTANT:
        return <AIView products={products} sales={sales} />;
      case AppView.CREDIT_LEDGER:
        return <CreditView sales={sales} onUpdate={refreshData} />;
      case AppView.PURCHASES:
        return <PurchaseView products={products} onUpdate={refreshData} />;
      case AppView.REPORTS:
        return <ReportsView sales={sales} purchases={purchases} products={products} shopProfile={shopProfile} />;
      case AppView.SETTINGS:
        return <SettingsView initialProfile={shopProfile} onSave={refreshData} />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 ml-64 p-8 h-screen overflow-y-auto print:ml-0 print:p-0">
        <div className="max-w-7xl mx-auto h-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;