/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  totalQuantity: number;
}

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
}

export interface RentalItem {
  productId: string;
  quantity: number;
}

export type RentalStatus = 'No Prazo' | 'Atrasada' | 'Devolvido';

export interface Rental {
  id: string;
  customerId: string;
  items: RentalItem[];
  startDate: string; // ISO string
  endDate: string;   // ISO string
  status: RentalStatus;
  createdAt: string;
}

export interface AppData {
  products: Product[];
  customers: Customer[];
  rentals: Rental[];
  ownerWhatsApp?: string;
}
