import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
import { GroceryProvider } from './src/context/GroceryContext';
import AppTabNavigator from './src/navigation/AppTabNavigator';
import { debugLogger } from './src/utils/debugLogger';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Handle notification responses (when user taps notification)
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      debugLogger.log(`📱 Notification tapped: ${JSON.stringify(data)}`);
      
      if (data.type === 'unpurchased_items') {
        // Navigate to UnpurchasedItemsScreen
        navigationRef.current?.navigate('Grocery List', {
          screen: 'UnpurchasedItems',
          params: {
            date: data.date,
            itemIds: data.items,
          }
        });
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GroceryProvider>
      <AppTabNavigator ref={navigationRef} />
    </GroceryProvider>
  );
}
