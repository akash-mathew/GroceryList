import { scheduleProductReminder } from '../utils/reminderNotifications';
// Reminder setting for a product
export type ProductReminder = {
  product: string;
  quantity: number;
  unit: 'kg' | 'liter' | 'piece';
  interval: { days?: number; hours?: number; minutes?: number };
  notified: boolean;
};

type GroceryContextType = {
  items: GroceryItem[];
  shops: Shop[];
  getItemsByDate: (date: string | null) => GroceryItem[];
  addItem: (item: Omit<GroceryItem, 'id'>) => void;
  updateItem: (item: GroceryItem) => void;
  deleteItem: (id: string) => void;
  reminders: ProductReminder[];
  addReminder: (reminder: ProductReminder) => void;
  removeReminder: (product: string) => void;
  markReminderNotified: (product: string) => void;
  purchasedItems: { [id: string]: number }; // Changed to store timestamps
  setPurchasedItems: React.Dispatch<React.SetStateAction<{ [id: string]: number }>>;
  scheduleRemindersForPurchasedItems: (itemId: string, purchaseTimestamp: number) => Promise<void>;
};
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

// ...existing code...

const GroceryContext = createContext<GroceryContextType>({} as GroceryContextType);

export const useGrocery = () => useContext(GroceryContext);

export const GroceryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [reminders, setReminders] = useState<ProductReminder[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<{ [id: string]: number }>({});
  const [isLoaded, setIsLoaded] = useState(false);
  // Reminder logic
  const addReminder = (reminder: ProductReminder) => {
    setReminders(prev => {
      // Only one reminder per product
      const filtered = prev.filter(r => r.product !== reminder.product);
      return [...filtered, reminder];
    });
  };

  const removeReminder = (product: string) => {
    setReminders(prev => prev.filter(r => r.product !== product));
  };

  const markReminderNotified = (product: string) => {
    setReminders(prev => prev.map(r => r.product === product ? { ...r, notified: true } : r));
  };

  // Function to schedule reminders when items are purchased
  const scheduleRemindersForPurchasedItems = async (itemId: string, purchaseTimestamp: number) => {
    console.log('=== scheduleRemindersForPurchasedItems called ===');
    console.log('Item ID:', itemId);
    console.log('Purchase timestamp:', purchaseTimestamp);
    
    const item = items.find(i => i.id === itemId);
    console.log('Found item:', item);
    
    if (!item) {
      console.log('No item found, returning');
      return;
    }
    
    const reminder = reminders.find(r => r.product === item.name);
    console.log('Found reminder:', reminder);
    console.log('All reminders:', reminders);
    
    if (reminder && item.quantity > 0) {
      console.log('Scheduling reminder for:', item.name);
      await scheduleProductReminder(reminder, purchaseTimestamp, item.quantity);
    } else {
      console.log('No reminder found or quantity is 0');
    }
  };

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
      try {
        const itemsData = await AsyncStorage.getItem('grocery_items');
        const shopsData = await AsyncStorage.getItem('grocery_shops');
        const purchasedData = await AsyncStorage.getItem('purchased_items');
        
        const loadedItems = itemsData ? JSON.parse(itemsData) : [];
        const loadedShops = shopsData ? JSON.parse(shopsData) : [];
        const loadedPurchased = purchasedData ? JSON.parse(purchasedData) : {};
        
        setItems(loadedItems);
        setShops(loadedShops);
        
        // Clean up stale purchased items that no longer exist in items
        const itemIds = new Set(loadedItems.map((item: GroceryItem) => item.id));
        const cleanedPurchased: { [id: string]: number } = {};
        Object.keys(loadedPurchased).forEach(id => {
          if (itemIds.has(id)) {
            // Convert boolean to timestamp if needed (for backward compatibility)
            if (typeof loadedPurchased[id] === 'boolean') {
              cleanedPurchased[id] = loadedPurchased[id] ? Date.now() : 0;
            } else {
              cleanedPurchased[id] = loadedPurchased[id];
            }
          }
        });
        
        setPurchasedItems(cleanedPurchased);
        setIsLoaded(true); // Mark as loaded to prevent initial save
        
        // Sync shops after loading
        setTimeout(() => syncShopsFromItems(loadedItems, loadedShops), 100);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('grocery_items', JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    AsyncStorage.setItem('grocery_shops', JSON.stringify(shops));
  }, [shops]);
  // Persistence function for purchased items
  const savePurchasedItems = async (newPurchasedItems: { [id: string]: number }) => {
    try {
      await AsyncStorage.setItem('purchased_items', JSON.stringify(newPurchasedItems));
    } catch (error) {
      console.error('Error saving purchased items:', error);
    }
  };

  useEffect(() => {
    if (!isLoaded) return; // Don't save during initial load
    savePurchasedItems(purchasedItems);
  }, [purchasedItems, isLoaded]);

  const getItemsByDate = (date: string | null) => {
    if (!date) return [];
    return items.filter(item => item.date === date);
  };

  const addItem = async (item: Omit<GroceryItem, 'id'>) => {
    const newItem = { ...item, id: Date.now().toString() };
    setItems(prev => [...prev, newItem]);
    if (item.shop && !shops.find(s => s.name === item.shop)) {
      setShops(prev => [...prev, { id: Date.now().toString(), name: item.shop! }]);
    }
    // Check for reminder for this product and if item is purchased
    const reminder = reminders.find(r => r.product === item.name);
    const purchaseTimestamp = purchasedItems[newItem.id];
    if (reminder && item.quantity > 0 && purchaseTimestamp && purchaseTimestamp > 0) {
      await scheduleProductReminder(reminder, purchaseTimestamp, item.quantity);
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
    // Also remove from purchasedItems to avoid stale data
    setPurchasedItems(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  return (
    <GroceryContext.Provider value={{ items, shops, getItemsByDate, addItem, updateItem, deleteItem, reminders, addReminder, removeReminder, markReminderNotified, purchasedItems, setPurchasedItems, scheduleRemindersForPurchasedItems }}>
      {children}
    </GroceryContext.Provider>
  );
};
