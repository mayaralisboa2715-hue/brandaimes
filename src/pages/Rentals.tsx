/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Search, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  MessageCircle, 
  ChevronRight,
  Clock,
  Printer,
  ArrowLeft
} from 'lucide-react';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppData, Rental, RentalItem, Customer, Product } from '../types';
import { calculateProductStock, getRentalStatus } from '../lib/storage';

interface RentalsProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

export default function Rentals({ data, setData }: RentalsProps) {
  const [view, setView] = useState<'list' | 'create' | 'print'>('list');
  const [activeRental, setActiveRental] = useState<Rental | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState<RentalItem[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));

  const productsWithStock = calculateProductStock(data.products, data.rentals);
  const filteredRentals = data.rentals
    .filter(r => {
      const customer = data.customers.find(c => c.id === r.customerId);
      return customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.includes(searchTerm);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAddItem = (productId: string) => {
    const existing = selectedItems.find(i => i.productId === productId);
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { productId, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || selectedItems.length === 0) return;

    const newRental: Rental = {
      id: `OS-${Date.now().toString().slice(-6)}`,
      customerId: selectedCustomerId,
      items: selectedItems,
      startDate,
      endDate,
      status: 'No Prazo',
      createdAt: new Date().toISOString()
    };

    setData(prev => ({ ...prev, rentals: [...prev.rentals, newRental] }));
    resetForm();
    setView('list');
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedItems([]);
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  };

  const markAsReturned = (id: string) => {
    setData(prev => ({
      ...prev,
      rentals: prev.rentals.map(r => r.id === id ? { ...r, status: 'Devolvido' } : r)
    }));
  };

  const sendWhatsAppMessage = (rental: Rental, type: 'saida' | 'devolucao' | 'lembrete') => {
    const customer = data.customers.find(c => c.id === rental.customerId);
    if (!customer) return;

    let message = '';
    const itemsList = rental.items.map(i => {
      const p = data.products.find(prod => prod.id === i.productId);
      return `${i.quantity}x ${p?.name}`;
    }).join('\n');

    const startFmt = format(new Date(rental.startDate), 'dd/MM/yyyy');
    const endFmt = format(new Date(rental.endDate), 'dd/MM/yyyy');

    if (type === 'saida') {
      message = `Olá ${customer.name}! Segue a nota de saída da BR Andaimes:\n\n*Equipamentos:*\n${itemsList}\n\n*Saída:* ${startFmt}\n*Previsão de Volta:* ${endFmt}\n\nObrigado pela preferência!`;
    } else if (type === 'devolucao') {
      message = `Olá ${customer.name}! Confirmamos o recebimento e conferência dos itens referentes à OS ${rental.id}. Tudo certo!\n\nAté a próxima!`;
    } else {
      message = `Olá ${customer.name}! Passando para lembrar que seu contrato na BR Andaimes vence amanhã (${endFmt}).\n\nPor favor, deixe os itens limpos para a retirada. Caso precise renovar, entre em contato.`;
    }

    const url = `https://api.whatsapp.com/send?phone=55${customer.whatsapp.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (view === 'print' && activeRental) {
    const customer = data.customers.find(c => c.id === activeRental.customerId);
    return (
      <div className="bg-white text-black min-h-screen p-8 font-sans max-w-[210mm] mx-auto shadow-2xl">
        <div className="no-print flex justify-between mb-8">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-blue-600 font-bold uppercase text-xs">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded font-bold uppercase text-xs flex items-center gap-2">
            <Printer className="w-4 h-4" /> Imprimir (A4)
          </button>
        </div>

        <div className="flex justify-between items-center border-b-2 border-black pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
              <img 
                src="https://i.ibb.co/d47cMrT8/Whats-App-Image-2026-04-25-at-23-29-44.jpg" 
                alt="Logo BR Andaimes" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase leading-none">BR ANDAIMES LTDA</h1>
              <p className="text-[10px] text-gray-600 font-mono mt-1">CNPJ: 56.058.801/0001-62</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-widest text-gray-500">ORDEM DE SERVIÇO</h2>
            <p className="text-2xl font-black">{activeRental.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8 border border-black p-6 rounded-sm">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Cliente</p>
            <p className="font-bold text-lg">{customer?.name}</p>
            <p className="text-sm mt-1">{customer?.whatsapp}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Local da Obra</p>
            <p className="text-sm border-l-2 border-gray-300 pl-3">{customer?.address}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-100 p-4 text-center">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Data de Saída</p>
            <p className="font-black text-xl">{format(new Date(activeRental.startDate), 'dd/MM/yyyy')}</p>
          </div>
          <div className="bg-gray-100 p-4 text-center">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Previsão de Devolução</p>
            <p className="font-black text-xl">{format(new Date(activeRental.endDate), 'dd/MM/yyyy')}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black mb-12">
          <thead>
            <tr className="bg-black text-white">
              <th className="border border-black p-3 text-left uppercase text-xs">UND</th>
              <th className="border border-black p-3 text-left uppercase text-xs">DESCRIÇÃO TÉCNICA DO EQUIPAMENTO</th>
            </tr>
          </thead>
          <tbody>
            {activeRental.items.map((item, idx) => {
              const product = data.products.find(p => p.id === item.productId);
              return (
                <tr key={idx}>
                  <td className="border border-black p-4 text-center font-bold">{item.quantity}</td>
                  <td className="border border-black p-4 font-bold uppercase">{product?.name}</td>
                </tr>
              );
            })}
            {/* Espaçadores para manter o layout A4 */}
            {Array.from({ length: Math.max(0, 8 - activeRental.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black p-4">&nbsp;</td>
                <td className="border border-black p-4">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <h4 className="font-black text-sm uppercase underline decoration-2 underline-offset-4">TERMOS E CONDIÇÕES</h4>
            <ul className="text-[10px] space-y-2 uppercase leading-tight text-gray-700">
              <li>• Taxa de limpeza: R$ 5,00 por peça se entregue suja de massa/tinta.</li>
              <li>• Pagamento obrigatório no ato do recebimento dos itens.</li>
              <li>• Reposição em caso de perda: Valor de mercado vigente.</li>
            </ul>
          </div>
          <div className="flex flex-col justify-end">
            <div className="border-t-2 border-black pt-4 text-center">
              <p className="text-[10px] uppercase font-bold">RESPONSÁVEL PELA EXPEDIÇÃO</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1">BR ANDAIMES - {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg text-center border-2 border-dashed border-gray-300">
          <p className="text-xs font-bold uppercase mb-2">Chave PIX para Pagamento</p>
          <p className="text-xl font-black font-mono">56.058.801/0001-62</p>
          <p className="text-[10px] text-gray-500 uppercase mt-1">BR ANDAIMES LTDA</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Locações</h2>
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Gestão de Contratos</p>
            </div>
            <button 
              onClick={() => setView('create')}
              className="bg-amber-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-400 transition-colors uppercase text-sm tracking-wide"
            >
              <Plus className="w-5 h-5" /> Iniciar Novo Aluguel
            </button>
          </div>

          <div className="bg-[#141414] p-4 rounded-2xl border border-gray-800 flex items-center gap-3">
            <Search className="text-gray-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por cliente ou código..."
              className="bg-transparent border-none outline-none flex-1 text-sm uppercase tracking-wider"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredRentals.map(rental => {
              const customer = data.customers.find(c => c.id === rental.customerId);
              const status = getRentalStatus(rental.endDate, rental.status);
              
              return (
                <div key={rental.id} className="bg-[#141414] border border-gray-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-amber-500/30 transition-all">
                  <div className={`p-4 rounded-2xl ${status === 'Devolvido' ? 'bg-green-500/10 text-green-500' : status === 'Atrasada' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {status === 'Devolvido' ? <CheckCircle className="w-8 h-8" /> : status === 'Atrasada' ? <AlertCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono bg-gray-800 px-2 py-0.5 rounded text-gray-400 font-bold">{rental.id}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        status === 'Devolvido' ? 'bg-green-500 text-black' : 
                        status === 'Atrasada' ? 'bg-red-500 text-white' : 
                        'bg-amber-500 text-black'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <h3 className="text-xl font-black uppercase truncate leading-none mb-2">{customer?.name}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 font-mono uppercase">
                      <span>Início: {format(new Date(rental.startDate), 'dd/MM/yy')}</span>
                      <span>Fim: {format(new Date(rental.endDate), 'dd/MM/yy')}</span>
                      <span className="text-amber-500/80 font-bold">{rental.items.length} ITENS</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => { setActiveRental(rental); setView('print'); }}
                      className="flex-1 md:flex-none p-3 bg-gray-800 rounded-xl hover:bg-white hover:text-black transition-all"
                      title="Imprimir OS"
                    >
                      <FileText className="w-5 h-5 mx-auto" />
                    </button>
                    <button 
                      onClick={() => sendWhatsAppMessage(rental, 'saida')}
                      className="flex-1 md:flex-none p-3 bg-gray-800 rounded-xl hover:bg-green-600 transition-all text-green-500 hover:text-white"
                      title="Enviar Nota de Saída"
                    >
                      <MessageCircle className="w-5 h-5 mx-auto" />
                    </button>
                    {status !== 'Devolvido' && (
                      <button 
                        onClick={() => markAsReturned(rental.id)}
                        className="flex-1 md:flex-none px-4 py-3 bg-amber-500 text-black font-bold rounded-xl uppercase text-xs"
                      >
                        DEVOLVER
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="max-w-4xl mx-auto bg-[#141414] border border-gray-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase">Novo Contrato de Aluguel</h2>
            <button onClick={() => { setView('list'); resetForm(); }} className="text-gray-500 hover:text-white">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest italic">Selecionar Cliente</label>
                <select 
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors font-bold uppercase text-sm h-[46px]"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">-- SELECIONE --</option>
                  {data.customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest italic">Data Saída</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 outline-none focus:border-amber-500 transition-colors uppercase text-xs font-mono"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest italic">Previsão Volta</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 outline-none focus:border-amber-500 transition-colors uppercase text-xs font-mono"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest italic">Adicionar Itens ao Carrinho</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {productsWithStock.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddItem(p.id)}
                    disabled={p.available <= 0}
                    className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-amber-500 transition-all text-left group disabled:opacity-30"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 group-hover:text-amber-500 uppercase">{p.name}</p>
                      <p className="text-xs font-mono text-gray-600">{p.available} DISP.</p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-700 group-hover:text-amber-500" />
                  </button>
                ))}
              </div>

              {selectedItems.length > 0 && (
                <div className="mt-8 border-t border-gray-800 pt-6">
                  <h4 className="text-sm font-black uppercase mb-4 text-amber-500">Itens no Contrato</h4>
                  <div className="space-y-3">
                    {selectedItems.map(item => {
                      const product = data.products.find(p => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-800">
                          <span className="font-bold uppercase text-sm">{product?.name}</span>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    setSelectedItems(selectedItems.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity - 1 } : i));
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg hover:bg-gray-700 font-black"
                              >-</button>
                              <span className="w-8 text-center font-mono font-black">{item.quantity}</span>
                              <button 
                                type="button" 
                                onClick={() => handleAddItem(item.productId)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-lg hover:bg-gray-700 font-black"
                              >+</button>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItem(item.productId)}
                              className="text-red-500/50 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6">
              <button 
                type="button" 
                onClick={() => { setView('list'); resetForm(); }}
                className="flex-1 bg-gray-800 text-white py-4 rounded-2xl font-bold uppercase text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={selectedItems.length === 0 || !selectedCustomerId}
                className="flex-2 bg-amber-500 text-black py-4 rounded-2xl font-bold uppercase text-sm shadow-lg shadow-amber-500/20 disabled:opacity-20"
              >
                Gerar Contrato e OS
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
