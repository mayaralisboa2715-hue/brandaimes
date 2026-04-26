/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  Calendar, 
  AlertTriangle,
  Bell,
  CheckCircle2,
  MessageCircle,
  Truck,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, addDays, isSameDay } from 'date-fns';
import { AppData, Rental } from '../types';
import { calculateProductStock, getRentalStatus } from '../lib/storage';

import { Page } from '../App';

interface DashboardProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  onNavigate?: (page: Page) => void;
}

export default function Dashboard({ data, setData, onNavigate }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update stats every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const productsWithStock = calculateProductStock(data.products, data.rentals);
    const activeRentals = data.rentals.filter(r => r.status !== 'Devolvido');
    
    // Status das locações baseado na data atual
    const currentStatusList = activeRentals.map(r => getRentalStatus(r.endDate, r.status));
    
    const totalPieces = data.products.reduce((sum, p) => sum + p.totalQuantity, 0);
    const inFieldPieces = productsWithStock.reduce((sum, p) => sum + p.rented, 0);
    const delays = currentStatusList.filter(s => s === 'Atrasada').length;

    return {
      totalPieces,
      inFieldPieces,
      activeRentals: activeRentals.length,
      delays,
      productsWithStock
    };
  }, [data]);

  const tomorrowRentals = useMemo(() => {
    const tomorrow = addDays(new Date(), 1);
    return data.rentals.filter(r => {
      if (r.status === 'Devolvido') return false;
      const endDate = new Date(r.endDate);
      return isSameDay(endDate, tomorrow);
    });
  }, [data]);

  // Alerta sonoro quando detecta vencimentos para amanhã no carregamento
  useEffect(() => {
    if (tomorrowRentals.length > 0) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play blocked by browser', e));
    }
  }, [tomorrowRentals.length]);

  const chartData = useMemo(() => {
    return stats.productsWithStock
      .sort((a, b) => b.rented - a.rented)
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name,
        'Em Obra': p.rented,
        'Disponível': p.available
      }));
  }, [stats]);

  const pieData = [
    { name: 'No Prazo', value: stats.activeRentals - stats.delays, color: '#f59e0b' },
    { name: 'Atrasadas', value: stats.delays, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const sendReminder = (rental: Rental, recipient: 'customer' | 'owner') => {
    const customer = data.customers.find(c => c.id === rental.customerId);
    if (!customer) return;
    
    const endFmt = format(new Date(rental.endDate), 'dd/MM/yyyy');
    let message = '';
    let phone = '';

    if (recipient === 'customer') {
      message = `Olá ${customer.name}! Passando para lembrar que seu contrato na BR Andaimes vence amanhã (${endFmt}).\n\nPor favor, deixe os itens limpos para a retirada. Caso precise renovar, entre em contato.`;
      phone = customer.whatsapp;
    } else {
      const itemsList = rental.items.map(i => {
        const p = data.products.find(prod => prod.id === i.productId);
        return `${i.quantity}x ${p?.name}`;
      }).join('\n');
      
      message = `*VENCE AMANHÃ*\n\nCliente: ${customer.name}\nEndereço: ${customer.address}\n\n*Equipamentos:*\n${itemsList}`;
      phone = data.ownerWhatsApp || '';
    }

    if (!phone) {
      alert('Número não configurado!');
      return;
    }

    const url = `https://api.whatsapp.com/send?phone=55${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Dashboard</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            Status do Sistema • Atualizado em {format(currentTime, 'HH:mm:ss')} 
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          icon={Package} 
          label="Peças no Acervo" 
          value={stats.totalPieces} 
          sub="Total cadastrado" 
        />
        <StatCard 
          icon={Truck} 
          label="Peças em Obra" 
          value={stats.inFieldPieces} 
          sub="Atualmente alugado" 
          color="text-amber-500"
        />
        <StatCard 
          icon={Calendar} 
          label="Locações Ativas" 
          value={stats.activeRentals} 
          sub="Contratos abertos" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#141414] border border-gray-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Top Equipamentos
              </h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#737373', fontSize: 10, fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 10 }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px', fontSize: '12px', textTransform: 'uppercase' }}
                  />
                  <Bar dataKey="Em Obra" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Disponível" fill="#262626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black uppercase text-sm tracking-widest text-amber-500 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Vencem Amanhã
              </h3>
              <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                {tomorrowRentals.length}
              </span>
            </div>

            <div className="space-y-3">
              {tomorrowRentals.length > 0 ? (
                tomorrowRentals.map(rental => {
                  const customer = data.customers.find(c => c.id === rental.customerId);
                  return (
                    <div key={rental.id} className="bg-[#141414] border border-gray-800 p-4 rounded-2xl group hover:border-amber-500 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-black uppercase text-sm truncate leading-none">{customer?.name}</p>
                      </div>
                      <p 
                        onClick={() => onNavigate?.('rentals')}
                        className="text-[10px] font-mono text-gray-500 uppercase mb-4 cursor-pointer hover:text-amber-500"
                      >
                        OS: {rental.id} • {rental.items.length} ITENS
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => sendReminder(rental, 'customer')}
                          className="flex items-center justify-center gap-2 bg-amber-500 text-black py-3 rounded-xl text-[10px] font-black uppercase hover:bg-amber-400"
                        >
                          <Users className="w-3 h-3" /> p/ Cliente
                        </button>
                        <button 
                          onClick={() => sendReminder(rental, 'owner')}
                          className="flex items-center justify-center gap-2 bg-gray-800 text-white py-3 rounded-xl text-[10px] font-black uppercase hover:bg-gray-700"
                        >
                          <TrendingUp className="w-3 h-3" /> p/ Admin
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 text-gray-800 mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-bold text-gray-600">Nenhum contrato vence amanhã</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#141414] border border-gray-800 rounded-3xl p-6">
            <h3 className="font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" /> Clientes Ativos
            </h3>
            <div className="space-y-4">
              {data.customers.slice(0, 5).map(customer => (
                <div key={customer.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-black bg-gradient-to-tr from-amber-500/20 to-transparent">
                    {customer.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase truncate">{customer.name}</p>
                    <p className="text-[9px] font-mono text-gray-600 uppercase truncate">{customer.address}</p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-800" />
                </div>
              ))}
              {data.customers.length === 0 && (
                <p className="text-[10px] uppercase font-bold text-gray-600 text-center py-4">Nenhum cliente cadastrado</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="bg-[#141414] border border-gray-800 rounded-3xl p-8 max-w-xl">
        <h3 className="font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-amber-500" /> Configuração do Proprietário
        </h3>
        <div className="space-y-4">
          <label className="block text-[10px] uppercase font-black text-gray-500 tracking-widest leading-none mb-1">
            Seu Número WhatsApp (Receber Alertas de Vencimento)
          </label>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Ex: 21999999999"
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors font-mono font-bold"
              value={data.ownerWhatsApp || ''}
              onChange={(e) => setData({ ...data, ownerWhatsApp: e.target.value.replace(/\D/g, '') })}
            />
            <div className="px-6 py-3 bg-green-500/10 text-green-500 rounded-xl font-bold text-xs uppercase flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Configurado
            </div>
          </div>
          <p className="text-[10px] text-gray-600 font-medium">Este número receberá o resumo dos equipamentos que devem retornar no dia seguinte.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "text-white", highlight = false }: any) {
  return (
    <div className={`bg-[#141414] border rounded-3xl p-6 transition-all ${highlight ? 'border-red-500/50 shadow-lg shadow-red-500/5' : 'border-gray-800'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gray-800/50 ${color.replace('text', 'text-amber-500')}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">{label}</p>
      <p className={`text-4xl font-black mb-1 leading-none ${color}`}>{value}</p>
      <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">{sub}</p>
    </div>
  );
}
