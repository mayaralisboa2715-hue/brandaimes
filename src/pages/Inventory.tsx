/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { calculateProductStock } from '../lib/storage';
import { AppData, Product } from '../types';

interface InventoryProps {
  data: AppData;
  setData?: any;
}

export default function Inventory({ data }: InventoryProps) {
  const { actions } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', totalQuantity: 0 });

  const productsWithStock = calculateProductStock(data.products, data.rentals);
  const filteredProducts = productsWithStock.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await actions.saveProduct({ ...editingProduct, ...formData });
    } else {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        ...formData
      };
      await actions.saveProduct(newProduct);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', totalQuantity: 0 });
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Deseja realmente excluir este item?')) {
      await actions.deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight">Inventário</h2>
          <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Controle de Acervo</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-400 transition-colors uppercase text-sm tracking-wide"
        >
          <Plus className="w-5 h-5" /> Adicionar Equipamento
        </button>
      </div>

      <div className="bg-[#141414] p-4 rounded-2xl border border-gray-800 flex items-center gap-3">
        <Search className="text-gray-500 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar no estoque..."
          className="bg-transparent border-none outline-none flex-1 text-sm uppercase tracking-wider"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="bg-[#141414] border border-gray-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-800/50 rounded-xl group-hover:bg-amber-500/10 transition-colors">
                <Package className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingProduct(product);
                    setFormData({ name: product.name, totalQuantity: product.totalQuantity });
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-gray-500 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="p-2 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold mb-4 uppercase truncate">{product.name}</h3>
            
            <div className="grid grid-cols-3 gap-2 text-center border-t border-gray-800 pt-4 mt-2">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total</p>
                <p className="text-lg font-black">{product.totalQuantity}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Em Obra</p>
                <p className="text-lg font-black text-amber-500">{product.rented}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Disp.</p>
                <p className={`text-lg font-black ${product.available > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {product.available}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-black uppercase mb-6">
              {editingProduct ? 'Editar Equipamento' : 'Novo Equipamento'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest underline decoration-amber-500 underline-offset-4">
                  Nome do Produto
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors uppercase font-bold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="EX: ANDAIME 1.0X1.0M"
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest underline decoration-amber-500 underline-offset-4">
                  Quantidade Total em Acervo
                </label>
                <input 
                  type="number" 
                  required
                  min="0"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors font-mono font-bold text-lg"
                  value={formData.totalQuantity}
                  onChange={(e) => setFormData({ ...formData, totalQuantity: parseInt(e.target.value) || 0 })}
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
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
