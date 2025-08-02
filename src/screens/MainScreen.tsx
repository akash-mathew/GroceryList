import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Linking, Alert, ScrollView, Modal, ImageBackground, Image } from 'react-native';
import { useGrocery } from '../context/GroceryContext';
import dayjs from 'dayjs';
import { Calendar } from 'react-native-calendars';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const APP_BG = '#6fa36f'; // Medium-dark green background
const PRIMARY = '#111'; // Black for strong contrast
const ACCENT = '#e6f0ff'; // Light blue accent
const CARD_BG = '#d8ecd8'; // Light green for cards/tiles
const BORDER = '#d1d5db';
const SHADOW = '#b3c6e6';

// Common grocery items knowledge base
const COMMON_GROCERY_ITEMS = [
  'Milk', 'Eggs', 'Bread', 'Butter', 'Cheese', 'Rice', 'Wheat', 'Flour', 'Sugar', 'Salt',
  'Potato', 'Onion', 'Tomato', 'Garlic', 'Ginger', 'Apple', 'Banana', 'Orange', 'Chicken', 'Fish', 'Oil',
  'Tea', 'Coffee', 'Yogurt', 'Curd', 'Paneer', 'Spinach', 'Carrot', 'Beans', 'Peas', 'Cucumber',
  'Chili', 'Coriander', 'Lemon', 'Biscuit', 'Jam', 'Honey', 'Ketchup', 'Soap', 'Shampoo', 'Toothpaste',
  'Detergent', 'Dal', 'Lentils', 'Pasta', 'Noodles', 'Mutton', 'Beef', 'Tofu', 'Mushroom', 'Capsicum',
  'Pumpkin', 'Cabbage', 'Cauliflower', 'Broccoli', 'Grapes', 'Papaya', 'Pineapple', 'Watermelon', 'Coconut',
  'Peanut', 'Almond', 'Cashew', 'Raisin', 'Dates', 'Oats', 'Cornflakes', 'Cereal', 'Butter', 'Ghee',
  'Mustard', 'Vinegar', 'Soy Sauce', 'Sausage', 'Bacon', 'Ham', 'Turkey', 'Ice Cream', 'Chocolate', 'Candy',
  'Juice', 'Soda', 'Soft Drink', 'Mineral Water', 'Bottled Water', 'Snacks', 'Chips', 'Namkeen', 'Pickle', 'Sauce',
  'Mayonnaise', 'Vermicelli', 'Custard', 'Jelly', 'Soup', 'Soup Mix', 'Ready Meal', 'Frozen Veg', 'Frozen Fruit', 'Frozen Meat'
];

export default function MainScreen({ initialDate }: { initialDate?: string }) {
  const today = dayjs().format('YYYY-MM-DD');
  const { items, shops, getItemsByDate, addItem, deleteItem, updateItem } = useGrocery();
  const [selectedDate, setSelectedDate] = useState(initialDate || today);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('kg');
  const [shop, setShop] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalId, setEditModalId] = useState<string | null>(null);

  // Edit form state for each item
  const [editForm, setEditForm] = useState<{ [id: string]: { name: string; quantity: string; unit: string; shop: string } }>({});

  // Item name suggestions
  const [itemSuggestions, setItemSuggestions] = useState<{ type: 'item' | 'shop'; value: string }[]>([]);
  const [shopSuggestions, setShopSuggestions] = useState<string[]>([]);
  const handleNameChange = (text: string) => {
    setName(text);
    if (!text.trim()) {
      setItemSuggestions([]);
      return;
    }
    // User's item history (case-insensitive, unique)
    const userItemHistory = Array.from(new Set(items.map(i => i.name))).filter(Boolean);
    // Suggestions from user history
    const userSuggestions = userItemHistory.filter(n => n.toLowerCase().includes(text.toLowerCase()) && n.toLowerCase() !== text.toLowerCase()).map(n => ({ type: 'item' as const, value: n }));
    // Suggestions from common items
    const commonSuggestions = COMMON_GROCERY_ITEMS.filter(
      n => n.toLowerCase().includes(text.toLowerCase()) && n.toLowerCase() !== text.toLowerCase()
    ).map(n => ({ type: 'item' as const, value: n }));
    // Combine and deduplicate by value (case-insensitive)
    const allItemSuggestions = [...userSuggestions, ...commonSuggestions];
    const uniqueItemSuggestions = [];
    const seen = new Set<string>();
    for (const s of allItemSuggestions) {
      const key = s.value.toLowerCase();
      if (!seen.has(key)) {
        uniqueItemSuggestions.push(s);
        seen.add(key);
      }
    }
    setItemSuggestions(uniqueItemSuggestions);
  };
  const handleShopChange = (text: string) => {
    setShop(text);
    if (!text.trim()) {
      setShopSuggestions([]);
      return;
    }
    // Get shops from both the shops array and items array for better coverage
    const shopsFromArray = shops.map(s => s.name).filter(Boolean);
    const shopsFromItems = Array.from(new Set(items.map(i => i.shop).filter(Boolean)));
    const allShops = Array.from(new Set([...shopsFromArray, ...shopsFromItems]));
    
    const filteredShops = allShops.filter(s => s && s.toLowerCase().includes(text.toLowerCase()));
    setShopSuggestions(filteredShops);
  };

  const groceryItems = getItemsByDate(selectedDate);

  // Shop suggestions logic
  const shopSuggestionsList = shop.length > 0
    ? shops.filter(s => s.name.toLowerCase().includes(shop.toLowerCase()))
    : [];

  // Get all unique dates with grocery items
  const historyDates = Array.from(new Set(items.map(i => i.date))).sort((a, b) => b.localeCompare(a));

  // Only show history if there are items for any date
  const hasHistory = items.length > 0;

  // Share to WhatsApp
  const shareToWhatsApp = async () => {
    // Group items by checked/unchecked
    const unchecked = groceryItems.filter(i => !checkedItems[i.id]);
    const checked = groceryItems.filter(i => checkedItems[i.id]);
    // Format unchecked items normally
    const uncheckedList = unchecked.map(i => `• ${i.name} ${i.quantity} ${i.unit}${i.shop ? ' @' + i.shop : ''}`).join('\n');
    // Format checked items with strikethrough using WhatsApp markdown (~text~)
    const checkedList = checked.map(i => `• ~${i.name} ${i.quantity} ${i.unit}${i.shop ? ' @' + i.shop : ''}~`).join('\n');
    let list = uncheckedList;
    if (checkedList) {
      list += (list ? '\n' : '') + checkedList;
    }
    const content = `Grocery List for ${selectedDate}:\n${list}`;
    const url = `whatsapp://send?text=${encodeURIComponent(content)}`;
    await Linking.openURL(url);
  };

  const renderHeader = () => (
    <>
      {/* Heading: Grocery List for <date> and calendar icon separate */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, paddingRight: 18, paddingLeft: 44 }}>
        <Text style={[styles.header]}>{`Grocery List for ${selectedDate}`}</Text>
        <TouchableOpacity onPress={() => setCalendarVisible(v => !v)} style={{ marginRight: 24 }}>
          <Ionicons name="calendar" size={28} color={PRIMARY} />
        </TouchableOpacity>
      </View>
      {calendarVisible && (
        <Calendar
          onDayPress={day => {
            setSelectedDate(day.dateString);
            setCalendarVisible(false);
          }}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: PRIMARY } }}
          style={{ marginBottom: 16, borderRadius: 12 }}
          theme={{ todayTextColor: PRIMARY, selectedDayBackgroundColor: PRIMARY, arrowColor: PRIMARY }}
        />
      )}
    </>
  );

  // Add item with validation
  const handleAddItem = () => {
    if (!name.trim()) return;
    // Only check for duplicate by name and shop (ignore unit/quantity)
    const duplicate = groceryItems.find(i => i.name.trim().toLowerCase() === name.trim().toLowerCase() && (i.shop || '').trim().toLowerCase() === (shop || '').trim().toLowerCase());
    if (duplicate) {
      Alert.alert(
        'Duplicate Item',
        'This item and shop combination already exists for the selected date. You can only edit the existing item.',
        [
          { text: 'Edit Existing Item', onPress: () => {
              setEditModalId(duplicate.id);
              setEditForm({ [duplicate.id]: { name: duplicate.name, quantity: duplicate.quantity.toString(), unit: duplicate.unit, shop: duplicate.shop || '' } });
              setModalVisible(false);
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }
    addItem({ name, quantity: Number(quantity), unit: unit as any, shop, date: selectedDate });
    setName(''); setQuantity('1'); setUnit('kg'); setShop('');
  };

  // Add checked state to items
  const [checkedItems, setCheckedItems] = useState<{ [id: string]: boolean }>({});

  // Split items into unchecked and checked
  const uncheckedItems = groceryItems.filter(i => !checkedItems[i.id]);
  const checkedItemsList = groceryItems.filter(i => checkedItems[i.id]);

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <FlatList
          data={uncheckedItems}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <TouchableOpacity onPress={() => setCheckedItems(c => ({ ...c, [item.id]: true }))} style={styles.checkCircle}>
                <Ionicons name={checkedItems[item.id] ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={checkedItems[item.id] ? '#27ae60' : '#bbb'} />
              </TouchableOpacity>
              <Text
                style={[{ fontSize: 16, flexShrink: 1, flex: 1 }, checkedItems[item.id] && { textDecorationLine: 'line-through', color: '#aaa' }]}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {item.name} - {item.quantity} {item.unit} {item.shop ? `@ ${item.shop}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                <TouchableOpacity onPress={() => {
                  setEditModalId(item.id);
                  setEditForm({ [item.id]: { name: item.name, quantity: item.quantity.toString(), unit: item.unit, shop: item.shop || '' } });
                }}>
                  <Ionicons name="create-outline" size={22} color={PRIMARY} style={{ marginRight: 8 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteItem(item.id)}>
                  <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No items in the list</Text>
          }
          ListFooterComponent={
            <>
              {/* Checked items group above Add Item button */}
              {checkedItemsList.length > 0 && (
                <View style={styles.checkedGroup}>
                  <Text style={styles.checkedHeader}>Checked Items</Text>
                  {checkedItemsList.map(item => (
                    <View style={styles.listItem} key={item.id}>
                      <TouchableOpacity onPress={() => setCheckedItems(c => ({ ...c, [item.id]: false }))} style={styles.checkCircle}>
                        <Ionicons name={'checkmark-circle'} size={24} color={'#27ae60'} />
                      </TouchableOpacity>
                      <Text
                        style={[{ fontSize: 16, textDecorationLine: 'line-through', color: '#aaa', flexShrink: 1, flex: 1 }]}
                        numberOfLines={4}
                        ellipsizeMode="tail"
                      >
                        {item.name} - {item.quantity} {item.unit} {item.shop ? `@ ${item.shop}` : ''}
                      </Text>
                      <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                        <TouchableOpacity onPress={() => {
                          setEditModalId(item.id);
                          setEditForm({ [item.id]: { name: item.name, quantity: item.quantity.toString(), unit: item.unit, shop: item.shop || '' } });
                        }}>
                          <Ionicons name="create-outline" size={22} color={PRIMARY} style={{ marginRight: 8 }} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteItem(item.id)}>
                          <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {/* Add Item button below checked items */}
              <TouchableOpacity style={styles.addItemBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
                <Text style={[styles.addItemBtnText, { color: '#fff' }]}>Add Item</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                {groceryItems.length > 0 && (
                  <>
                    <TouchableOpacity style={styles.clearBtn} onPress={() => {
                      groceryItems.forEach(i => deleteItem(i.id));
                    }}>
                      <Ionicons name="trash" size={22} color="#fff" />
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shareBtnSmall, { marginLeft: 12 }]} onPress={shareToWhatsApp}>
                      <FontAwesome name="whatsapp" size={20} color="#fff" style={{ marginRight: 4 }} />
                      <Ionicons name="share-social" size={18} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        />
        {/* Add Modal for add/edit form */}
        <Modal
          visible={modalVisible || !!editModalId}
          animationType="slide"
          transparent
          onRequestClose={() => { setModalVisible(false); setEditModalId(null); }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editModalId ? 'Edit Item' : 'Add Item'}</Text>
              <TextInput
                style={[styles.input, { color: '#000' }]}
                placeholder="Item name"
                placeholderTextColor="#666"
                value={editModalId ? editForm[editModalId]?.name || '' : name}
                onChangeText={editModalId ? (text => setEditForm(f => ({ ...f, [editModalId]: { ...f[editModalId], name: text } }))) : handleNameChange}
              />
              {/* Suggestions for item name */}
              {!editModalId && name.length > 0 && itemSuggestions.filter(s => s.type === 'item').length > 0 && (
                <View style={styles.suggestionBox}>
                  <Text style={styles.suggestionLabel}>Suggestions:</Text>
                  {itemSuggestions.filter(s => s.type === 'item').map((s, idx) => (
                    <TouchableOpacity key={s.value + '-' + idx} onPress={() => { setName(s.value); setItemSuggestions([]); }}>
                      <Text style={[styles.suggestionItem, { color: '#000' }]}>{s.value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TextInput
                style={[styles.input, { color: '#000' }]}
                placeholder="Qty"
                placeholderTextColor="#666"
                value={editModalId ? editForm[editModalId]?.quantity || '' : quantity}
                onChangeText={editModalId ? (text => setEditForm(f => ({ ...f, [editModalId]: { ...f[editModalId], quantity: text } }))) : setQuantity}
                keyboardType="numeric"
              />
              <Picker
                selectedValue={editModalId ? editForm[editModalId]?.unit || 'kg' : unit}
                style={styles.picker}
                onValueChange={editModalId ? (text => setEditForm(f => ({ ...f, [editModalId]: { ...f[editModalId], unit: text } }))) : setUnit}
                mode="dropdown"
              >
                <Picker.Item label="kg" value="kg" />
                <Picker.Item label="liter" value="liter" />
                <Picker.Item label="piece" value="piece" />
              </Picker>
              <TextInput
                style={[styles.input, { color: '#000' }]}
                placeholder="Shop (optional)"
                placeholderTextColor="#666"
                value={editModalId ? editForm[editModalId]?.shop || '' : shop}
                onChangeText={editModalId ? (text => setEditForm(f => ({ ...f, [editModalId]: { ...f[editModalId], shop: text } }))) : handleShopChange}
              />
              {/* Suggestions for shop */}
              {!editModalId && shop.length > 0 && shopSuggestions.length > 0 && (
                <View style={styles.suggestionBox}>
                  <Text style={styles.suggestionLabel}>Shop Suggestions:</Text>
                  {shopSuggestions.map((s, idx) => (
                    <TouchableOpacity key={s + '-' + idx} onPress={() => { setShop(s); setShopSuggestions([]); }}>
                      <Text style={[styles.suggestionItem, { color: '#000' }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#ccc' }]}
                  onPress={() => {
                    if (editModalId) {
                      updateItem({
                        id: editModalId,
                        name: editForm[editModalId]?.name || '',
                        quantity: Number(editForm[editModalId]?.quantity || '1'),
                        unit: editForm[editModalId]?.unit as any,
                        shop: editForm[editModalId]?.shop,
                        date: selectedDate
                      });
                      setEditModalId(null);
                      setEditForm(f => { const c = { ...f }; delete c[editModalId]; return c; });
                    } else {
                      handleAddItem();
                      setModalVisible(false);
                    }
                  }}
                >
                  <Text style={[styles.buttonText, { color: '#333' }]}>{editModalId ? 'Save' : 'Add'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#ccc', marginLeft: 8 }]}
                  onPress={() => { setModalVisible(false); setEditModalId(null); }}
                >
                  <Text style={[styles.buttonText, { color: '#333' }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bgImage: undefined, // Remove background image
  overlay: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, padding: 16, backgroundColor: APP_BG },
  header: { fontSize: 32, fontWeight: 'bold', color: PRIMARY, letterSpacing: 1, marginBottom: 0 },
  dateRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: ACCENT, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: BORDER },
  dateText: { fontSize: 18, color: PRIMARY, fontWeight: 'bold' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 14, justifyContent: 'center', marginTop: 18, marginBottom: 6, shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  addItemBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 10, marginRight: 8, minWidth: 90, marginBottom: 8, backgroundColor: CARD_BG, fontSize: 16, color: PRIMARY, shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  inputSmall: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 6, marginRight: 6, minWidth: 60, marginBottom: 4, backgroundColor: CARD_BG, fontSize: 14, color: PRIMARY, shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: BORDER, backgroundColor: CARD_BG, borderRadius: 8, marginBottom: 6, paddingHorizontal: 8, shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  suggestionBox: { backgroundColor: '#f7faff', borderRadius: 8, marginBottom: 8, padding: 8, borderWidth: 1, borderColor: '#cce0ff' },
  suggestionLabel: { color: '#2356c7', fontWeight: 'bold', marginBottom: 4, fontSize: 14 },
  suggestionItem: { paddingVertical: 6, paddingHorizontal: 8, color: PRIMARY, fontSize: 16, borderRadius: 6, marginBottom: 2 },
  button: { backgroundColor: PRIMARY, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginLeft: 8, shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  buttonText: { color: PRIMARY, fontWeight: 'bold', fontSize: 16 },
  editButton: { color: PRIMARY, marginRight: 10, fontWeight: 'bold' },
  deleteButton: { color: 'red', marginLeft: 10, fontWeight: 'bold' },
  emptyText: { color: '#000', textAlign: 'center', marginTop: 24, fontSize: 16 },
  dateBtn: { color: PRIMARY, textDecorationLine: 'underline', fontWeight: 'bold' },
  historyBox: { marginVertical: 12, backgroundColor: ACCENT, borderRadius: 10, padding: 10, shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  historyHeader: { fontWeight: 'bold', marginBottom: 6, color: PRIMARY },
  historyDate: { padding: 8, borderRadius: 8, backgroundColor: CARD_BG, marginRight: 8, color: PRIMARY },
  historyDateActive: { backgroundColor: PRIMARY, color: '#fff' },
  shareBtn: { flexDirection: 'row', backgroundColor: '#25D366', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12, justifyContent: 'center', shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  shareBtnSmall: { flexDirection: 'row', backgroundColor: '#25D366', borderRadius: 8, padding: 8, alignItems: 'center', marginLeft: 8, shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  addBtn: { marginRight: 16 },
  clearBtn: { flexDirection: 'row', backgroundColor: '#e74c3c', borderRadius: 8, padding: 8, alignItems: 'center', marginLeft: 8, shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2 },
  clearBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 4 },
  dateFieldRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dateFieldLabel: { fontWeight: 'bold', color: PRIMARY, marginRight: 8 },
  dateField: { flexDirection: 'row', alignItems: 'center', backgroundColor: CARD_BG, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: BORDER, shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  dateFieldText: { fontSize: 16, color: '#222' },
  picker: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    fontSize: 16,
    minWidth: 80,
    height: 56,
    marginRight: 8,
    marginBottom: 8,
    color: '#222',
    justifyContent: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1
  },
  pickerSmall: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: CARD_BG,
    fontSize: 14,
    minWidth: 60,
    height: 52,
    marginRight: 6,
    marginBottom: 4,
    color: '#222',
    justifyContent: 'center',
    shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: CARD_BG, borderRadius: 12, padding: 20, width: '90%', maxWidth: 400, shadowColor: SHADOW, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4, borderWidth: 2, borderColor: ACCENT },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: PRIMARY },
  checkCircle: { marginRight: 10 },
  checkedGroup: { marginTop: 24, backgroundColor: '#eafbe7', borderRadius: 10, padding: 10 },
  checkedHeader: { fontWeight: 'bold', color: '#27ae60', marginBottom: 8, fontSize: 16 },
});
