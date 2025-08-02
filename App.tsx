import React from 'react';
import { GroceryProvider } from './src/context/GroceryContext';
import AppTabNavigator from './src/navigation/AppTabNavigator';

export default function App() {
  return (
    <GroceryProvider>
      <AppTabNavigator />
    </GroceryProvider>
  );
}
