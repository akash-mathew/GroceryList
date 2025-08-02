import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GroceryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: 'kg' | 'liter' | 'piece';
  shop?: string;
  date: string; // YYYY-MM-DD
};

export type Shop = {
  id: string;
  name: string;
};

type GroceryContextType = {
  items: GroceryItem[];
  shops: Shop[];
  getItemsByDate: (date: string | null) => GroceryItem[];
  addItem: (item: Omit<GroceryItem, 'id'>) => void;
  updateItem: (item: GroceryItem) => void;
  deleteItem: (id: string) => void;
};

const GroceryContext = createContext<GroceryContextType>({} as GroceryContextType);

export const useGrocery = () => useContext(GroceryContext);

export const GroceryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

  // Sync shops from items - ensures all shops from items are in the shops array
  const syncShopsFromItems = (currentItems: GroceryItem[], currentShops: Shop[]) => {
    const shopNamesFromItems = Array.from(new Set(
      currentItems.map(item => item.shop).filter(Boolean)
    ));
    
    const existingShopNames = new Set(currentShops.map(shop => shop.name));
    const newShops: Shop[] = [];
    
    shopNamesFromItems.forEach(shopName => {
      if (!existingShopNames.has(shopName)) {
        newShops.push({ id: Date.now().toString() + Math.random(), name: shopName });
      }
    });
    
    if (newShops.length > 0) {
      setShops(prev => [...prev, ...newShops]);
    }
  };

  useEffect(() => {
    (async () => {
      const itemsData = await AsyncStorage.getItem('grocery_items');
      const shopsData = await AsyncStorage.getItem('grocery_shops');
      const loadedItems = itemsData ? JSON.parse(itemsData) : [];
      const loadedShops = shopsData ? JSON.parse(shopsData) : [];
      
      setItems(loadedItems);
      setShops(loadedShops);
      
      // Sync shops after loading
      setTimeout(() => syncShopsFromItems(loadedItems, loadedShops), 100);
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('grocery_items', JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    AsyncStorage.setItem('grocery_shops', JSON.stringify(shops));
  }, [shops]);

  const getItemsByDate = (date: string | null) => {
    if (!date) return [];
    return items.filter(item => item.date === date);
  };

  const addItem = (item: Omit<GroceryItem, 'id'>) => {
    setItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
    if (item.shop && !shops.find(s => s.name === item.shop)) {
      setShops(prev => [...prev, { id: Date.now().toString(), name: item.shop! }]);
    }
  };

  const updateItem = (item: GroceryItem) => {
    setItems(prev => prev.map(i => (i.id === item.id ? item : i)));
    // Add shop to shops array if it doesn't exist
    if (item.shop && !shops.find(s => s.name === item.shop)) {
      setShops(prev => [...prev, { id: Date.now().toString(), name: item.shop! }]);
    }
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <GroceryContext.Provider value={{ items, shops, getItemsByDate, addItem, updateItem, deleteItem }}>
      {children}
    </GroceryContext.Provider>
  );
};
