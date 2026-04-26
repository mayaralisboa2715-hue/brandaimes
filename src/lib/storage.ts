/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData, Product, Customer, Rental } from '../types';

const STORAGE_KEY = 'br_andaimes_data';

const initialData: AppData = {
  products: [
    { id: 'p1', name: 'ANDAIME 1.0M X 1.0M', totalQuantity: 100 },
    { id: 'p2', name: 'SAPATA REGULAVEL', totalQuantity: 40 },
    { id: 'p3', name: 'RODIZIO POLIURETANO', totalQuantity: 20 },
    { id: 'p4', name: 'DIAGONAL 1.0M', totalQuantity: 50 }
  ],
  customers: [],
  rentals: []
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return initialData;
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load data', e);
    return initialData;
  }
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Helpers for calculations
export const calculateProductStock = (products: Product[], rentals: Rental[]) => {
  return products.map(product => {
    const rentedQuantity = rentals
      .filter(r => r.status !== 'Devolvido')
      .reduce((sum, r) => {
        const item = r.items.find(i => i.productId === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);

    return {
      ...product,
      rented: rentedQuantity,
      available: product.totalQuantity - rentedQuantity
    };
  });
};

export const getRentalStatus = (endDate: string, currentStatus: string): 'No Prazo' | 'Atrasada' | 'Devolvido' => {
  if (currentStatus === 'Devolvido') return 'Devolvido';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deliveryDate = new Date(endDate);
  deliveryDate.setHours(0, 0, 0, 0);
  
  // Atrasada a partir do dia seguinte à data de devolução
  return today > deliveryDate ? 'Atrasada' : 'No Prazo';
};
