/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Package, 
  Users, 
  Calendar, 
  PlusCircle, 
  AlertCircle,
  Bell,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppData } from './types';
import { loadData, saveData } from './lib/storage';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Rentals from './pages/Rentals';

export type Page = 'dashboard' | 'inventory' | 'customers' | 'rentals';

export default function App() {
  const [data, setData] = useState<AppData>(loadData());
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync with local storage on state change
  useEffect(() => {
    saveData(data);
  }, [data]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'rentals', label: 'Locações', icon: Calendar },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard data={data} setData={setData} />;
      case 'inventory': return <Inventory data={data} setData={setData} />;
      case 'customers': return <Customers data={data} setData={setData} />;
      case 'rentals': return <Rentals data={data} setData={setData} />;
      default: return <Dashboard data={data} setData={setData} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#141414] border-r border-gray-800 p-6 sticky top-0 h-screen no-print">
        <div className="mb-10">
          <h1 className="text-2xl font-black tracking-tighter text-amber-500 uppercase">
            BR <span className="text-white">Andaimes</span>
          </h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
            Gestão de Patrimônio
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                currentPage === item.id 
                ? 'bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/20' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-600 font-mono">v1.2.0 • 2026</p>
        </div>
      </aside>

      {/* Mobile Nav */}
      <header className="md:hidden bg-[#141414] border-b border-gray-800 p-4 sticky top-0 z-50 flex items-center justify-between no-print">
        <h1 className="text-xl font-black tracking-tighter text-amber-500 uppercase">
          BR <span className="text-white">Andaimes</span>
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-[65px] bg-[#0a0a0a] z-40 p-6 flex flex-col gap-4"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id as Page);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl ${
                  currentPage === item.id ? 'bg-amber-500 text-black' : 'bg-[#141414] text-gray-400'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-lg font-bold">{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 relative overflow-x-hidden print:p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

