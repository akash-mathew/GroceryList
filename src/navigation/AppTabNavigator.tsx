import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import GroceryStack from './GroceryStack';
import SearchScreen from '../screens/SearchScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function AppTabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        id={undefined}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            if (route.name === 'Grocery List')
              return <Ionicons name="cart" size={size} color={color} />;
            if (route.name === 'Search')
              return <Ionicons name="search" size={size} color={color} />;
            if (route.name === 'Dashboard')
              return <FontAwesome name="bar-chart" size={size} color={color} />;
            return null;
          },
          tabBarActiveTintColor: '#111',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: { backgroundColor: '#f0f4fa', borderTopWidth: 0 },
        })}
      >
        <Tab.Screen
          name="Grocery List"
          component={GroceryStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
