import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { ProductReminder } from '../context/GroceryContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function scheduleProductReminder(reminder: ProductReminder, purchaseTimestamp: number, quantityPurchased: number) {
  try {
    console.log('=== SCHEDULING REMINDER ===');
    console.log('Product:', reminder.product);
    console.log('Purchase timestamp:', purchaseTimestamp, new Date(purchaseTimestamp));
    console.log('Interval:', reminder.interval);
    console.log('Quantity purchased:', quantityPurchased);
    
    // Calculate interval in ms
    const days = reminder.interval.days || 0;
    const hours = reminder.interval.hours || 0;
    const minutes = reminder.interval.minutes || 0;
    const baseQuantity = reminder.quantity;
    const totalMs = (
      ((days * 24 * 60) + (hours * 60) + minutes) * 60 * 1000
    ) * (quantityPurchased / baseQuantity);
    const triggerDate = new Date(purchaseTimestamp + totalMs);

    console.log('Calculated interval (ms):', totalMs);
    console.log('Trigger date:', triggerDate);
    console.log('Current time:', new Date());
    console.log('Minutes until trigger:', (triggerDate.getTime() - Date.now()) / (1000 * 60));

    // Check permissions
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Notification permission status:', status);
    
    if (status !== 'granted') {
      console.error('Notification permissions not granted!');
      return;
    }

    const notificationResult = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Grocery Reminder',
        body: `Time to buy ${reminder.product} again!`,
        data: { product: reminder.product },
      },
      trigger: { type: 'date' as any, date: triggerDate, repeats: false },
    });
    
    console.log('Notification scheduled successfully:', notificationResult);
    console.log('=== END SCHEDULING ===');
  } catch (error) {
    console.error('Error scheduling reminder:', error);
  }
}

// Test function for immediate notification (for testing purposes)
export async function testNotificationInSeconds(seconds: number = 5, product: string = 'Test Item') {
  try {
    console.log('=== TEST NOTIFICATION CALLED ===');
    console.log('Seconds:', seconds);
    console.log('Product:', product);
    
    // Check if we're in Expo Go (notifications won't work)
    const isExpoGo = __DEV__ && !Constants.appOwnership;
    console.log('Is Expo Go:', isExpoGo);
    console.log('__DEV__:', __DEV__);
    console.log('Constants.appOwnership:', Constants.appOwnership);
    
    if (isExpoGo) {
      // In Expo Go, just show an alert explaining the limitation
      alert(`🚀 Notification Test\n\nIn Expo Go, notifications don't work, but this would normally:\n\n• Schedule a notification for "${product}"\n• Show in ${seconds} seconds\n• With title: "🛒 Grocery Reminder Test"\n\nTo test real notifications, you need a development build.`);
      return true;
    }

    // Request permissions first
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Permission status:', status);
    
    if (status !== 'granted') {
      alert('Notification permissions not granted!');
      return false;
    }

    const triggerDate = new Date(Date.now() + seconds * 1000);
    console.log('Scheduling for:', triggerDate);
    
    const result = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛒 Grocery Reminder Test',
        body: `Test notification for ${product} - This would normally remind you to buy this item!`,
        data: { product: product, isTest: true },
      },
      trigger: { type: 'date' as any, date: triggerDate, repeats: false },
    });
    
    console.log('Notification scheduled result:', result);
    return true;
  } catch (error) {
    console.error('Test notification failed:', error);
    return false;
  }
}

// Function to test immediate notification (for debugging)
export async function testImmediateNotification() {
  try {
    console.log('=== IMMEDIATE NOTIFICATION TEST ===');
    
    // Check permissions
    const { status } = await Notifications.requestPermissionsAsync();
    console.log('Permission status:', status);
    
    if (status !== 'granted') {
      console.error('Permissions not granted');
      return false;
    }

    // Schedule notification for 5 seconds from now
    const result = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Debug Test',
        body: 'This is a debug notification',
        data: { debug: true },
      },
      trigger: { type: 'date' as any, date: new Date(Date.now() + 5000), repeats: false },
    });
    
    console.log('Debug notification scheduled:', result);
    alert('Debug notification scheduled for 5 seconds from now');
    return true;
  } catch (error) {
    console.error('Debug notification failed:', error);
    return false;
  }
}
