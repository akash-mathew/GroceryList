import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { debugLogger } from '../utils/debugLogger';
import { scheduleProductReminder } from '../utils/reminderNotifications';

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

// Simplified reminder setting for a product - only days now
export type ProductReminder = {
  product: string;
  quantity: number;
  unit: 'kg' | 'liter' | 'piece';
  interval: { days: number }; // Simplified to days only
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
  addReminder: (reminder: ProductReminder, skipRetroactive?: boolean) => void;
  removeReminder: (product: string) => void;
  markReminderNotified: (product: string) => void;
  purchasedItems: { [productName: string]: string }; // Changed to store date strings
  setPurchasedItems: React.Dispatch<React.SetStateAction<{ [productName: string]: string }>>;
  scheduleRemindersForPurchasedItems: (itemId: string, groceryDate: string) => Promise<void>;
  checkForUnpurchasedItems: () => Promise<void>;
  getUnpurchasedItemsByDate: (date: string) => GroceryItem[];
  moveItemsToDate: (itemIds: string[], targetDate: string) => void;
  markAllItemsAsPurchased: (itemIds: string[], groceryDate: string) => void;
  deleteItems: (itemIds: string[]) => void;
};

const GroceryContext = createContext<GroceryContextType>({} as GroceryContextType);

export const useGrocery = () => useContext(GroceryContext);

export const GroceryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [reminders, setReminders] = useState<ProductReminder[]>([]);
  const [purchasedItems, setPurchasedItems] = useState<{ [productName: string]: string }>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Reminder logic
  const addReminder = (reminder: ProductReminder, skipRetroactive = false) => {
    debugLogger.log(`📝 addReminder called for: ${reminder.product}, skipRetroactive: ${skipRetroactive}`);
    debugLogger.log(`📝 Reminder details: ${reminder.quantity} ${reminder.unit}, interval: ${reminder.interval.days}d`);
    
    setReminders(prev => {
      // Only one reminder per product
      const filtered = prev.filter(r => r.product !== reminder.product);
      const newReminders = [...filtered, reminder];
      debugLogger.log(`📝 New reminders count: ${newReminders.length}`);
      
      // Check if this product was recently purchased and schedule notification accordingly
      // Skip retroactive scheduling when loading from storage to prevent startup scheduling
      if (!skipRetroactive) {
        checkAndScheduleRetroactiveReminder(reminder);
      }
      
      return newReminders;
    });
  };

  // Check if a product was recently purchased and schedule reminder accordingly
  const checkAndScheduleRetroactiveReminder = async (reminder: ProductReminder) => {
    debugLogger.log(`🔍 Checking retroactive reminder for: ${reminder.product}`);
    
    // Find the most recent purchase date of this product
    const recentPurchaseDate = purchasedItems[reminder.product];
    
    if (!recentPurchaseDate) {
      debugLogger.log(`❌ No recent purchase found for ${reminder.product}`);
      return;
    }
    
    const now = new Date();
    const purchaseDate = new Date(recentPurchaseDate);
    const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    debugLogger.log(`📅 Product ${reminder.product} was purchased ${daysSincePurchase} days ago (${recentPurchaseDate})`);
    
    const reminderDays = reminder.interval.days;
    debugLogger.log(`⏱️ Reminder interval: ${reminderDays} days`);
    
    // Check if we're still within the reminder period
    if (daysSincePurchase < reminderDays) {
      const remainingDays = reminderDays - daysSincePurchase;
      
      debugLogger.log(`✅ Scheduling retroactive reminder for ${reminder.product} in ${remainingDays} days`);
      
      // Find the item to get quantity (default to reminder quantity if not found)
      const item = items.find(i => i.name === reminder.product);
      const quantity = item ? item.quantity : reminder.quantity;
      
      // Schedule the notification with the remaining time
      await scheduleProductReminder(reminder, purchaseDate.getTime(), quantity);
    } else {
      debugLogger.log(`❌ Purchase was too long ago (${daysSincePurchase} days > ${reminderDays} days)`);
    }
  };

  const removeReminder = (product: string) => {
    setReminders(prev => prev.filter(r => r.product !== product));
  };

  const markReminderNotified = (product: string) => {
    setReminders(prev => prev.map(r => r.product === product ? { ...r, notified: true } : r));
  };

  // Function to schedule reminders when items are purchased (using grocery date)
  const scheduleRemindersForPurchasedItems = async (itemId: string, groceryDate: string) => {
    debugLogger.log('🔔 scheduleRemindersForPurchasedItems called');
    debugLogger.log(`Item ID: ${itemId}`);
    debugLogger.log(`Grocery date: ${groceryDate}`);
    
    const item = items.find(i => i.id === itemId);
    debugLogger.log(`Found item: ${item ? item.name : 'none'}`);
    
    if (!item) {
      debugLogger.log('❌ No item found, returning');
      return;
    }
    
    const reminder = reminders.find(r => r.product === item.name);
    debugLogger.log(`Found reminder: ${reminder ? `${reminder.product} (${reminder.interval.days}d)` : 'none'}`);
    
    if (reminder && item.quantity > 0) {
      debugLogger.log(`✅ Scheduling reminder for: ${item.name} (quantity: ${item.quantity}) from date: ${groceryDate}`);
      
      // Use the grocery date as the purchase date for calculation
      const purchaseTimestamp = new Date(groceryDate).getTime();
      await scheduleProductReminder(reminder, purchaseTimestamp, item.quantity);
    } else {
      debugLogger.log(`❌ No reminder scheduled - reminder exists: ${!!reminder}, quantity: ${item.quantity}`);
    }
  };

  // Function to check for unpurchased items from past dates and send reminders
  const checkForUnpurchasedItems = async () => {
    debugLogger.log('🔍 Checking for unpurchased items from past dates');
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Get all unique past dates that have items
    const pastDates = Array.from(new Set(
      items
        .filter(item => item.date < today) // Past dates only
        .map(item => item.date)
    )).sort();
    
    debugLogger.log(`📅 Found ${pastDates.length} past dates with items: ${pastDates.join(', ')}`);
    
    for (const date of pastDates) {
      const itemsForDate = getItemsByDate(date);
      const unpurchasedItems = itemsForDate.filter(item => !purchasedItems[item.name]);
      
      if (unpurchasedItems.length > 0) {
        debugLogger.log(`📝 Found ${unpurchasedItems.length} unpurchased items for ${date}`);
        
        // Check if we already sent a reminder for this date
        const reminderKey = `unpurchased_reminder_${date}`;
        const lastReminderSent = await AsyncStorage.getItem(reminderKey);
        
        // Only send reminder once per date (don't spam user)
        if (!lastReminderSent) {
          await scheduleUnpurchasedItemsReminder(date, unpurchasedItems);
          await AsyncStorage.setItem(reminderKey, today); // Mark as reminded today
        } else {
          debugLogger.log(`⏭️ Already sent reminder for ${date} on ${lastReminderSent}`);
        }
      }
    }
  };

  // Function to schedule notification for unpurchased items
  const scheduleUnpurchasedItemsReminder = async (date: string, unpurchasedItems: GroceryItem[]) => {
    try {
      debugLogger.log(`📬 Scheduling unpurchased items reminder for ${date}`);
      
      const itemsList = unpurchasedItems.map(item => `• ${item.name}`).join('\n');
      const count = unpurchasedItems.length;
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🛒 Unpurchased Items Reminder',
          body: `Your grocery list for ${date} has ${count} unpurchased item${count > 1 ? 's' : ''}. Tap to take action.`,
          data: { 
            type: 'unpurchased_items',
            date: date,
            items: unpurchasedItems.map(item => item.id)
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 5000), // Schedule for 5 seconds from now (immediate)
        },
      });
      
      debugLogger.log(`✅ Unpurchased items reminder scheduled for ${date}`);
      
    } catch (error) {
      debugLogger.log(`❌ Error scheduling unpurchased items reminder: ${error}`);
      console.error('Error scheduling unpurchased items reminder:', error);
    }
  };

  // Utility function to get unpurchased items for a specific date
  const getUnpurchasedItemsByDate = (date: string): GroceryItem[] => {
    const itemsForDate = getItemsByDate(date);
    return itemsForDate.filter(item => !purchasedItems[item.name]);
  };

  // Function to move items to a different date
  const moveItemsToDate = (itemIds: string[], targetDate: string) => {
    debugLogger.log(`📅 Moving ${itemIds.length} items to ${targetDate}`);
    
    setItems(prev => prev.map(item => {
      if (itemIds.includes(item.id)) {
        return { ...item, date: targetDate };
      }
      return item;
    }));
  };

  // Function to mark multiple items as purchased
  const markAllItemsAsPurchased = (itemIds: string[], groceryDate: string) => {
    debugLogger.log(`✅ Marking ${itemIds.length} items as purchased for ${groceryDate}`);
    
    const itemsToMark = items.filter(item => itemIds.includes(item.id));
    
    setPurchasedItems(prev => {
      const updated = { ...prev };
      itemsToMark.forEach(item => {
        updated[item.name] = groceryDate;
      });
      return updated;
    });
  };

  // Function to delete multiple items
  const deleteItems = (itemIds: string[]) => {
    debugLogger.log(`🗑️ Deleting ${itemIds.length} items`);
    
    setItems(prev => prev.filter(item => !itemIds.includes(item.id)));
    
    // Also remove from purchased items if they exist
    const itemsToDelete = items.filter(item => itemIds.includes(item.id));
    setPurchasedItems(prev => {
      const updated = { ...prev };
      itemsToDelete.forEach(item => {
        delete updated[item.name];
      });
      return updated;
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const itemsData = await AsyncStorage.getItem('grocery_items');
        const shopsData = await AsyncStorage.getItem('grocery_shops');
        const purchasedData = await AsyncStorage.getItem('purchased_items');
        const remindersData = await AsyncStorage.getItem('reminders');
        
        const loadedItems = itemsData ? JSON.parse(itemsData) : [];
        const loadedShops = shopsData ? JSON.parse(shopsData) : [];
        const loadedPurchased = purchasedData ? JSON.parse(purchasedData) : {};
        const loadedReminders = remindersData ? JSON.parse(remindersData) : [];
        
        setItems(loadedItems);
        setShops(loadedShops);
        
        // Load reminders directly without triggering retroactive scheduling
        setReminders(loadedReminders);
        
        debugLogger.log(`💾 Loaded ${loadedReminders.length} reminders from storage`);
        
        // Clean up stale purchased items that no longer exist in items
        // Convert from timestamp-based to date-based storage
        const existingProductNames = new Set(loadedItems.map((item: GroceryItem) => item.name));
        const cleanedPurchased: { [productName: string]: string } = {};
        Object.keys(loadedPurchased).forEach(productName => {
          if (existingProductNames.has(productName)) {
            // Convert timestamp to date if needed (for backward compatibility)
            const value = loadedPurchased[productName];
            if (typeof value === 'number') {
              cleanedPurchased[productName] = new Date(value).toISOString().split('T')[0];
            } else if (typeof value === 'string') {
              cleanedPurchased[productName] = value;
            }
          }
        });
        
        setPurchasedItems(cleanedPurchased);
        setIsLoaded(true); // Mark as loaded to prevent initial save
        
        // Check for unpurchased items after everything is loaded
        // Delay this check to allow the app to fully initialize
        setTimeout(() => {
          checkForUnpurchasedItems();
        }, 2000);
        
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
  
  useEffect(() => {
    if (isLoaded) { // Only save after initial load to prevent overwriting
      AsyncStorage.setItem('reminders', JSON.stringify(reminders));
      debugLogger.log(`💾 Saved ${reminders.length} reminders to storage`);
    }
  }, [reminders, isLoaded]);

  // Persistence function for purchased items
  const savePurchasedItems = async (newPurchasedItems: { [productName: string]: string }) => {
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

  const addItem = (item: Omit<GroceryItem, 'id'>) => {
    setItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
    if (item.shop && !shops.find(s => s.name === item.shop)) {
      setShops(prev => [...prev, { id: Date.now().toString(), name: item.shop! }]);
    }
  };

  const updateItem = (item: GroceryItem) => {
    setItems(prev => prev.map(i => (i.id === item.id ? item : i)));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <GroceryContext.Provider value={{ 
      items, 
      shops, 
      getItemsByDate, 
      addItem, 
      updateItem, 
      deleteItem, 
      reminders, 
      addReminder, 
      removeReminder, 
      markReminderNotified, 
      purchasedItems, 
      setPurchasedItems, 
      scheduleRemindersForPurchasedItems,
      checkForUnpurchasedItems,
      getUnpurchasedItemsByDate,
      moveItemsToDate,
      markAllItemsAsPurchased,
      deleteItems
    }}>
      {children}
    </GroceryContext.Provider>
  );
};
