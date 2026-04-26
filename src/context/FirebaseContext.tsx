/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db, loginWithGoogle, logout, loginAnonymously } from '../lib/firebase';
import { AppData, Product, Customer, Rental } from '../types';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  data: AppData;
  login: () => Promise<any>;
  logout: () => Promise<void>;
  updateData: (newData: Partial<AppData>) => Promise<void>;
  actions: {
    saveProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    saveCustomer: (customer: Customer) => Promise<void>;
    deleteCustomer: (id: string) => Promise<void>;
    saveRental: (rental: Rental) => Promise<void>;
    deleteRental: (id: string) => Promise<void>;
    saveSettings: (ownerWhatsApp: string) => Promise<void>;
  };
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppData>({
    products: [],
    customers: [],
    rentals: [],
    ownerWhatsApp: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        loginAnonymously().catch(console.error);
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setData({ products: [], customers: [], rentals: [], ownerWhatsApp: '' });
      return;
    }

    // Sync Products
    const qProducts = query(collection(db, 'products'));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as Product);
      setData(prev => ({ ...prev, products: items }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));

    // Sync Customers
    const qCustomers = query(collection(db, 'customers'));
    const unsubCustomers = onSnapshot(qCustomers, (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as Customer);
      setData(prev => ({ ...prev, customers: items }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'customers'));

    // Sync Rentals
    const qRentals = query(collection(db, 'rentals'));
    const unsubRentals = onSnapshot(qRentals, (snapshot) => {
      const items = snapshot.docs.map(d => d.data() as Rental);
      setData(prev => ({ ...prev, rentals: items }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'rentals'));

    // Sync Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const settings = snapshot.data();
        setData(prev => ({ ...prev, ownerWhatsApp: settings.ownerWhatsApp }));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/global'));

    return () => {
      unsubProducts();
      unsubCustomers();
      unsubRentals();
      unsubSettings();
    };
  }, [user]);

  const actions = {
    saveProduct: async (product: Product) => {
      try {
        await setDoc(doc(db, 'products', product.id), product);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
      }
    },
    deleteProduct: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
      }
    },
    saveCustomer: async (customer: Customer) => {
      try {
        await setDoc(doc(db, 'customers', customer.id), customer);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `customers/${customer.id}`);
      }
    },
    deleteCustomer: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'customers', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `customers/${id}`);
      }
    },
    saveRental: async (rental: Rental) => {
      try {
        await setDoc(doc(db, 'rentals', rental.id), rental);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `rentals/${rental.id}`);
      }
    },
    deleteRental: async (id: string) => {
      try {
        await deleteDoc(doc(db, 'rentals', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `rentals/${id}`);
      }
    },
    saveSettings: async (ownerWhatsApp: string) => {
      try {
        await setDoc(doc(db, 'settings', 'global'), { ownerWhatsApp });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'settings/global');
      }
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      user, 
      loading, 
      data, 
      login: loginWithGoogle, 
      logout,
      updateData: async () => {}, // Not used directly in sync mode
      actions
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};
