import * as Notifications from 'expo-notifications';
import { ProductReminder } from '../context/GroceryContext';
import { debugLogger } from './debugLogger';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleProductReminder(
  reminder: ProductReminder, 
  purchaseTimestamp: number, 
  quantityPurchased: number
) {
  try {
    debugLogger.log('=== SCHEDULING REMINDER ===');
    debugLogger.log(`Product: ${reminder.product}`);
    debugLogger.log(`Purchase: ${new Date(purchaseTimestamp).toLocaleString()}`);
    debugLogger.log(`Interval: ${reminder.interval.days} days`);
    debugLogger.log(`Quantity purchased: ${quantityPurchased}`);

    // Check notification permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      debugLogger.log('❌ Notifications not permitted');
      return;
    }

    // Calculate trigger time - now simplified to days only
    const days = reminder.interval.days;
    const triggerTimeMs = purchaseTimestamp + (days * 24 * 60 * 60 * 1000);
    const now = Date.now();
    
    debugLogger.log(`Trigger time: ${new Date(triggerTimeMs).toLocaleString()}`);
    debugLogger.log(`Time until trigger: ${Math.round((triggerTimeMs - now) / 1000 / 60 / 60 / 24)} days`);

    if (triggerTimeMs <= now) {
      debugLogger.log('❌ Trigger time is in the past, not scheduling');
      return;
    }

    // Cancel any existing notification for this product
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const existingNotification = scheduled.find(n => 
      n.content.data?.product === reminder.product
    );
    
    if (existingNotification) {
      debugLogger.log(`🗑️ Cancelling existing notification: ${existingNotification.identifier}`);
      await Notifications.cancelScheduledNotificationAsync(existingNotification.identifier);
    }

    // Schedule new notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛒 Grocery Reminder',
        body: `Time to buy ${reminder.product}! You purchased ${quantityPurchased} ${reminder.unit} ${days} days ago.`,
        data: { 
          product: reminder.product,
          quantity: quantityPurchased,
          unit: reminder.unit,
          intervalDays: days
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTimeMs),
      },
    });

    debugLogger.log(`✅ Notification scheduled with ID: ${notificationId}`);
    debugLogger.log('=== END SCHEDULING ===');

  } catch (error) {
    debugLogger.log(`❌ Error scheduling notification: ${error}`);
    console.error('Error scheduling notification:', error);
  }
}
