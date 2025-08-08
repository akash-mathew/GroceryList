import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGrocery } from '../context/GroceryContext';

const PRIMARY = '#111';
const APP_BG = '#6fa36f'; // Match DashboardScreen background
const CARD_BG = '#d8ecd8';

export default function RemindersScreen() {
  // Context hooks and state
  const { items, reminders, addReminder, removeReminder, purchasedItems } = useGrocery();
  
  // Safety check - ensure context data is loaded
  if (!items || !reminders) {
    return (
      <View style={[styles.container, { backgroundColor: APP_BG, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyText}>Loading...</Text>
      </View>
    );
  }
  
  const [modalVisible, setModalVisible] = useState(false);
  const [productInput, setProductInput] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'kg' | 'liter' | 'piece'>('kg');
  const [days, setDays] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get all unique product names from history (both purchased and unpurchased)
  const allProductNames = useMemo(() => 
    Array.from(new Set((items || []).map(i => i.name).filter(name => name && name.trim()))), 
    [items]
  );
  
  // Common grocery items for suggestions
  const commonItems = [
    'Milk', 'Bread', 'Eggs', 'Butter', 'Cheese', 'Yogurt', 'Chicken', 'Beef', 'Fish',
    'Rice', 'Pasta', 'Potatoes', 'Onions', 'Tomatoes', 'Carrots', 'Apples', 'Bananas',
    'Oranges', 'Oil', 'Salt', 'Sugar', 'Flour', 'Coffee', 'Tea', 'Juice', 'Water'
  ];

  // Update suggestions based on input
  useEffect(() => {
    if (productInput && productInput.trim()) {
      const query = productInput.toLowerCase();
      const filtered = [
        ...allProductNames.filter(name => name && name.toLowerCase().includes(query)),
        ...commonItems.filter(name => 
          name && name.toLowerCase().includes(query) && 
          !allProductNames.includes(name)
        )
      ].slice(0, 8); // Limit to 8 suggestions
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [productInput, allProductNames]);

  const handleRemoveReminder = (product: string) => {
    removeReminder(product);
  };

  const handleEditReminder = (index: number) => {
    const r = reminders[index];
    setProductInput(r.product);
    setQuantity(r.quantity.toString());
    setUnit(r.unit);
    setDays(r.interval.days ? r.interval.days.toString() : '');
    setEditIndex(index);
    setModalVisible(true);
  };

  const handleAddOrEditReminder = () => {
    if (!productInput.trim() || !quantity || !days) return;
    const newReminder = {
      product: productInput.trim(),
      quantity: Number(quantity),
      unit,
      interval: {
        days: Number(days),
      },
      notified: false,
    };
    if (editIndex !== null) {
      // Remove old and add new
      removeReminder(reminders[editIndex].product);
      addReminder(newReminder);
    } else {
      addReminder(newReminder);
    }
    setModalVisible(false);
    setProductInput('');
    setQuantity('');
    setUnit('kg');
    setDays('');
    setEditIndex(null);
    setShowSuggestions(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: APP_BG }]}> {/* Match other screens */}
      <FlatList
        data={reminders || []}
        keyExtractor={(item, index) => `reminder-${index}`}
        style={styles.remindersList}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        renderItem={({ item, index }) => {
          const intervalText = `${item.interval.days} day${item.interval.days !== 1 ? 's' : ''}`;
          
          return (
            <View style={styles.reminderTile}>
              <Text style={styles.reminderText}>
                {item.product} {item.quantity} {item.unit} ({intervalText})
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => handleEditReminder(index)} style={styles.iconBtn} accessibilityLabel="Edit reminder">
                  <Ionicons name="create-outline" size={22} color="#2356c7" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveReminder(item.product)} style={styles.iconBtn} accessibilityLabel="Delete reminder">
                  <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <View style={{ padding: 20 }}>
            <Text style={styles.emptyText}>No reminders set.</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Ionicons name="add-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.addBtnText}>Add Reminder</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editIndex !== null ? 'Edit Reminder' : 'Add Reminder'}
            </Text>
            <Text style={styles.label}>Item:</Text>
            <View style={styles.productListContainer}>
              <TextInput
                placeholder="Enter product name..."
                value={productInput}
                onChangeText={setProductInput}
                style={[styles.input, { marginBottom: suggestions.length > 0 ? 8 : 12 }]}
              />
              {suggestions.length > 0 ? (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item, index) => `suggestion-${index}-${item}`}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => {
                        setProductInput(item);
                        setSuggestions([]);
                      }}
                    >
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  style={styles.suggestionsList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                />
              ) : null}
            </View>
            <TextInput
              placeholder="Quantity (e.g. 1)"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.label}>Unit:</Text>
            <View style={styles.unitRow}>
              {['kg', 'liter', 'piece'].map(u => (
                <TouchableOpacity
                  key={u}
                  style={[styles.unitBtn, unit === u && styles.selectedUnitBtn]}
                  onPress={() => setUnit(u as any)}
                >
                  <Text style={{ color: unit === u ? '#fff' : PRIMARY }}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Days until reminder:</Text>
            <TextInput
              placeholder="Enter days (e.g. 7)"
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setModalVisible(false); setEditIndex(null); }} style={styles.cancelBtn}>
                <Text style={{ color: PRIMARY, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddOrEditReminder} style={styles.saveBtn}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                  {editIndex !== null ? 'Save' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  remindersList: { flex: 1 },
  reminderTile: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CARD_BG, marginVertical: 8, borderRadius: 10, padding: 16, elevation: 1 },
  reminderText: { fontSize: 18, color: PRIMARY, flex: 1 },
  iconBtn: { marginLeft: 8, padding: 4, borderRadius: 16 },
  addBtn: { flexDirection: 'row', backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 32, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400, elevation: 4 },
  modalTitle: { fontWeight: 'bold', fontSize: 20, marginBottom: 12, color: PRIMARY, textAlign: 'center' },
  label: { marginBottom: 8, fontWeight: 'bold', color: PRIMARY },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 12, fontSize: 16, backgroundColor: '#f8f8f8', color: '#000' },
  productListContainer: { marginBottom: 12 },
  productItem: { padding: 8, borderRadius: 8, backgroundColor: '#f8f8f8', marginBottom: 4 },
  selectedProductItem: { backgroundColor: '#d8ecd8' },
  unitRow: { flexDirection: 'row', marginBottom: 12 },
  unitBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#f8f8f8', marginHorizontal: 4, alignItems: 'center' },
  unitBtnText: { color: '#000', fontWeight: '500' },
  selectedUnitBtn: { backgroundColor: '#2356c7' },
  selectedUnitBtnText: { color: '#fff', fontWeight: '500' },
  intervalRow: { flexDirection: 'row', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  cancelBtn: { marginRight: 16, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#e6e6e6' },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#27ae60' },
  suggestionsList: { maxHeight: 120, backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  suggestionText: { fontSize: 16, color: '#333' },
});
