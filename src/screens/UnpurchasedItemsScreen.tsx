import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useGrocery } from '../context/GroceryContext';
import { debugLogger } from '../utils/debugLogger';

type RootStackParamList = {
  UnpurchasedItems: {
    date: string;
    itemIds: string[];
  };
};

type UnpurchasedItemsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UnpurchasedItems'>;

const UnpurchasedItemsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<UnpurchasedItemsScreenNavigationProp>();
  const { 
    getUnpurchasedItemsByDate, 
    moveItemsToDate, 
    markAllItemsAsPurchased, 
    deleteItems 
  } = useGrocery();
  
  const { date, itemIds } = route.params as { date: string; itemIds: string[] };
  const [unpurchasedItems, setUnpurchasedItems] = useState(() => 
    getUnpurchasedItemsByDate(date).filter(item => itemIds.includes(item.id))
  );

  useEffect(() => {
    debugLogger.log(`📱 UnpurchasedItemsScreen opened for date: ${date}`);
    debugLogger.log(`📝 Item IDs: ${itemIds.join(', ')}`);
  }, []);

  const handleMarkAllPurchased = () => {
    Alert.alert(
      'Mark All as Purchased',
      `Mark all ${unpurchasedItems.length} items as purchased for ${date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: () => {
            markAllItemsAsPurchased(itemIds, date);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Items',
      `Delete all ${unpurchasedItems.length} unpurchased items permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteItems(itemIds);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleMoveToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    Alert.alert(
      'Move to Today',
      `Move all ${unpurchasedItems.length} items to today's list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          onPress: () => {
            moveItemsToDate(itemIds, today);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleMoveToCustomDate = () => {
    // For now, we'll use a simple prompt. In a real app, you'd use a date picker
    Alert.prompt(
      'Move to Date',
      'Enter the date (YYYY-MM-DD) to move these items to:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move',
          onPress: (inputDate) => {
            if (inputDate && /^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
              moveItemsToDate(itemIds, inputDate);
              navigation.goBack();
            } else {
              Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Unpurchased Items</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.dateCard}>
          <Text style={styles.dateText}>Grocery List for {date}</Text>
          <Text style={styles.subtitle}>
            {unpurchasedItems.length} item{unpurchasedItems.length !== 1 ? 's' : ''} not purchased
          </Text>
        </View>

        <View style={styles.itemsList}>
          {unpurchasedItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  {item.quantity} {item.unit}
                  {item.shop && ` • ${item.shop}`}
                </Text>
              </View>
              <Feather name="shopping-cart" size={20} color="#666" />
            </View>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>What would you like to do?</Text>
          
          <TouchableOpacity style={[styles.actionButton, styles.purchasedButton]} onPress={handleMarkAllPurchased}>
            <Feather name="check-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Mark All as Purchased</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.moveButton]} onPress={handleMoveToToday}>
            <Feather name="calendar" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Move to Today's List</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.moveButton]} onPress={handleMoveToCustomDate}>
            <Feather name="arrow-right" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Move to Future Date</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteAll}>
            <Feather name="trash-2" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete All Items</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  itemsList: {
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  purchasedButton: {
    backgroundColor: '#4CAF50',
  },
  moveButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default UnpurchasedItemsScreen;
