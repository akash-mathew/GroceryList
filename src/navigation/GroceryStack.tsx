import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HistoryScreen from '../screens/HistoryScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import UnpurchasedItemsScreen from '../screens/UnpurchasedItemsScreen';

const Stack = createStackNavigator();

export default function GroceryStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="GroceryList" component={GroceryListScreen} />
      <Stack.Screen 
        name="UnpurchasedItems" 
        component={UnpurchasedItemsScreen}
        options={{ headerShown: true, title: 'Unpurchased Items' }}
      />
    </Stack.Navigator>
  );
}
