import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useGrocery } from '../context/GroceryContext';
import { debugLogger } from '../utils/debugLogger';

const DebugPanel: React.FC = () => {
  const { reminders, purchasedItems, checkForUnpurchasedItems } = useGrocery();
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadScheduledNotifications();
  }, []);

  const loadScheduledNotifications = async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledNotifications(notifications);
      debugLogger.log(`📅 Found ${notifications.length} scheduled notifications`);
    } catch (error) {
      debugLogger.log(`❌ Error loading scheduled notifications: ${error}`);
    }
  };

  const testImmediateNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from the Debug Panel',
          data: { type: 'test' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 2000), // 2 seconds from now
        },
      });
      Alert.alert('Success', 'Test notification scheduled for 2 seconds from now');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule test notification');
      console.error(error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Success', 'All scheduled notifications cleared');
      loadScheduledNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to clear notifications');
      console.error(error);
    }
  };

  const testUnpurchasedCheck = async () => {
    try {
      await checkForUnpurchasedItems();
      Alert.alert('Success', 'Unpurchased items check completed');
      loadScheduledNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to check unpurchased items');
      console.error(error);
    }
  };

  const getActiveReminders = () => {
    return reminders.filter(r => {
      const purchaseDate = purchasedItems[r.product];
      if (!purchaseDate) return false;
      
      const now = new Date().getTime();
      const purchase = new Date(purchaseDate).getTime();
      const triggerTime = purchase + (r.interval.days * 24 * 60 * 60 * 1000);
      
      return triggerTime > now; // Future trigger
    });
  };

  const getTimeUntilReminders = () => {
    return reminders.map(r => {
      const purchaseDate = purchasedItems[r.product];
      if (!purchaseDate) return null;
      
      const now = new Date().getTime();
      const purchase = new Date(purchaseDate).getTime();
      const triggerTime = purchase + (r.interval.days * 24 * 60 * 60 * 1000);
      
      if (triggerTime <= now) return null;
      
      const timeRemaining = Math.round((triggerTime - now) / 1000 / 60 / 60 / 24); // days
      return {
        product: r.product,
        daysRemaining: timeRemaining,
        triggerDate: new Date(triggerTime).toISOString().split('T')[0]
      };
    }).filter(Boolean);
  };

  const activeReminders = getActiveReminders();
  const timeUntilReminders = getTimeUntilReminders();
  const purchasedCount = Object.keys(purchasedItems).length;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛠️ Debug Panel</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.button} onPress={testImmediateNotification}>
          <Text style={styles.buttonText}>Send Test Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={testUnpurchasedCheck}>
          <Text style={styles.buttonText}>Test Unpurchased Check</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllNotifications}>
          <Text style={styles.buttonText}>Clear All Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={loadScheduledNotifications}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <Text style={styles.stat}>Total Reminders: {reminders.length}</Text>
        <Text style={styles.stat}>Active Reminders: {activeReminders.length}</Text>
        <Text style={styles.stat}>Purchased Items: {purchasedCount}</Text>
        <Text style={styles.stat}>Scheduled Notifications: {scheduledNotifications.length}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Reminders</Text>
        {timeUntilReminders.length > 0 ? (
          timeUntilReminders.map((reminder, index) => (
            <View key={index} style={styles.reminderItem}>
              <Text style={styles.reminderProduct}>{reminder?.product}</Text>
              <Text style={styles.reminderTime}>
                {reminder?.daysRemaining} days ({reminder?.triggerDate})
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No active reminders</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduled Notifications</Text>
        {scheduledNotifications.length > 0 ? (
          scheduledNotifications.map((notification, index) => (
            <View key={index} style={styles.notificationItem}>
              <Text style={styles.notificationTitle}>{notification.content.title}</Text>
              <Text style={styles.notificationBody}>{notification.content.body}</Text>
              <Text style={styles.notificationTrigger}>
                {notification.trigger.type === 'date' 
                  ? new Date(notification.trigger.value).toLocaleString()
                  : 'Unknown trigger'
                }
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No scheduled notifications</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Purchased Items</Text>
        {Object.entries(purchasedItems).map(([product, date]) => (
          <View key={product} style={styles.purchasedItem}>
            <Text style={styles.purchasedProduct}>{product}</Text>
            <Text style={styles.purchasedDate}>{date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  stat: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  reminderItem: {
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    marginBottom: 4,
  },
  reminderProduct: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  reminderTime: {
    fontSize: 14,
    color: '#666',
  },
  notificationItem: {
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  notificationBody: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  notificationTrigger: {
    fontSize: 12,
    color: '#999',
  },
  purchasedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f0f9f0',
    borderRadius: 4,
    marginBottom: 4,
  },
  purchasedProduct: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  purchasedDate: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default DebugPanel;
