import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import SearchScreen from './SearchScreen';
import AnalyticsScreen from './AnalyticsScreen';

const TopTab = createMaterialTopTabNavigator();

export default function SearchAnalyticsScreen() {
  return (
    <TopTab.Navigator
      id={undefined}
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarIndicatorStyle: { backgroundColor: '#007AFF' },
        tabBarStyle: { backgroundColor: '#f0f4fa' },
      }}
    >
      <TopTab.Screen name="Purchase History" component={SearchScreen} />
      <TopTab.Screen name="Analytics" component={AnalyticsScreen} />
    </TopTab.Navigator>
  );
}
