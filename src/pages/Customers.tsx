/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, Search, MessageCircle, MapPin } from 'lucide-react';
import { AppData, Customer } from '../types';

import { useFirebase } from '../context/FirebaseContext';

interface CustomersProps {
  data: AppData;
  setData?: any;
}

export default function Customers({ data }: CustomersProps) {
  const { actions } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', whatsapp: '', address: '' });

  const filteredCustomers = data.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.whatsapp.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      await actions.saveCustomer({ ...editingCustomer, ...formData });
    } else {
      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        ...formData
      };
      await actions.saveCustomer(newCustomer);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setFormData({ name: '', whatsapp: '', address: '' });
  };

  const deleteCustomer = async (id: string) => {
    if (confirm('Deseja realmente remover este cliente?')) {
      await actions.deleteCustomer(id);
    }
  };

  const formatPhoneNumber = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length <= 11) {
      return raw.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return val;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Clientes</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Base de Dados</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-400 transition-colors uppercase text-sm tracking-wide"
        >
          <Plus className="w-5 h-5" /> Novo Cliente
        </button>
      </div>

      <div className="bg-[#141414] p-4 rounded-2xl border border-gray-800 flex items-center gap-3">
        <Search className="text-gray-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar por nome ou WhatsApp..."
          className="bg-transparent border-none outline-none flex-1 text-sm uppercase tracking-wider"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-[#141414] border border-gray-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-gray-800/50 rounded-xl group-hover:bg-amber-500/10 transition-colors">
                <Users className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingCustomer(customer);
                    setFormData({ name: customer.name, whatsapp: customer.whatsapp, address: customer.address });
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-gray-500 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteCustomer(customer.id)}
                  className="p-2 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-black mb-4 uppercase tracking-tight truncate leading-none">
              {customer.name}
            </h3>
            
            <div className="space-y-3">
              <a 
                href={`https://api.whatsapp.com/send?phone=55${customer.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-green-500 transition-colors group/link"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-mono tracking-wider">{formatPhoneNumber(customer.whatsapp)}</span>
              </a>
              <div className="flex items-start gap-3 text-gray-500">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="text-xs uppercase leading-relaxed line-clamp-2">{customer.address}</span>
              </div>
            </div>

            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rotate-45 translate-x-8 -translate-y-8" />
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black uppercase mb-6">
              {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest underline decoration-amber-500 underline-offset-4">
                  Nome Completo / Razão Social
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors uppercase font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest underline decoration-amber-500 underline-offset-4">
                  WhatsApp (Apenas Números)
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="21999999999"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors font-mono font-bold"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest underline decoration-amber-500 underline-offset-4">
                  Endereço de Entrega / Obra
                </label>
                <textarea 
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors uppercase text-sm h-24 resize-none"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 bg-gray-800 text-white py-4 rounded-xl font-bold uppercase text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-2 bg-amber-500 text-black py-4 rounded-xl font-bold uppercase text-sm shadow-lg shadow-amber-500/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
