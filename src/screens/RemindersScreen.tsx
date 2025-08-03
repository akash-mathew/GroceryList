import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useGrocery } from '../context/GroceryContext';

const PRIMARY = '#111';
const APP_BG = '#6fa36f'; // Match DashboardScreen background
const CARD_BG = '#d8ecd8';

export default function RemindersScreen() {
  // Context hooks and state
  const { items, reminders, addReminder, removeReminder, purchasedItems } = useGrocery();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'kg' | 'liter' | 'piece'>('kg');
  const [days, setDays] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [search, setSearch] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // Only show checked items (purchased) for reminders
  const checkedItems = items.filter(i => purchasedItems[i.id] && purchasedItems[i.id] > 0);
  const checkedItemNames: string[] = Array.from(new Set(checkedItems.map(i => String(i.name)).filter(name => name && name.trim())));
  const filteredItems = search
    ? checkedItemNames.filter(n => typeof n === 'string' && n.toLowerCase().includes(search.toLowerCase()))
    : checkedItemNames;

  const handleRemoveReminder = (product: string) => {
    removeReminder(product);
  };

  const handleEditReminder = (index: number) => {
    const r = reminders[index];
    setSelectedItem(r.product);
    setQuantity(r.quantity.toString());
    setUnit(r.unit);
    setDays(r.interval.days ? r.interval.days.toString() : '');
    setHours(r.interval.hours ? r.interval.hours.toString() : '');
    setMinutes(r.interval.minutes ? r.interval.minutes.toString() : '');
    setEditIndex(index);
    setModalVisible(true);
  };

  const handleAddOrEditReminder = () => {
    if (!selectedItem || !quantity) return;
    const newReminder = {
      product: selectedItem,
      quantity: Number(quantity),
      unit,
      interval: {
        days: days ? Number(days) : undefined,
        hours: hours ? Number(hours) : undefined,
        minutes: minutes ? Number(minutes) : undefined,
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
    setSelectedItem(null);
    setQuantity('');
    setUnit('kg');
    setDays('');
    setHours('');
    setMinutes('');
    setEditIndex(null);
    setSearch('');
  };

  return (
    <View style={[styles.container, { backgroundColor: APP_BG }]}> {/* Match other screens */}
      <FlatList
        data={reminders}
        keyExtractor={(item, index) => `reminder-${index}`}
        style={styles.remindersList}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        renderItem={({ item, index }) => {
          const intervalParts: string[] = [];
          if (item.interval.days) intervalParts.push(`${item.interval.days}d`);
          if (item.interval.hours) intervalParts.push(`${item.interval.hours}h`);
          if (item.interval.minutes) intervalParts.push(`${item.interval.minutes}m`);
          const intervalText = intervalParts.join(' ') || 'No interval';
          
          return (
            <View style={styles.reminderTile}>
              <Text style={styles.reminderText}>
                {String(item.product)} {String(item.quantity)} {String(item.unit)} ({String(intervalText)})
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => handleEditReminder(index)} style={styles.iconBtn} accessibilityLabel="Edit reminder">
                  <Ionicons name="create-outline" size={22} color="#2356c7" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveReminder(String(item.product))} style={styles.iconBtn} accessibilityLabel="Delete reminder">
                  <Ionicons name="trash-outline" size={22} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No reminders set.</Text>
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
              <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#f8f8f8', marginBottom: 12 }}>
                <Picker
                  selectedValue={selectedItem}
                  onValueChange={setSelectedItem}
                  style={{ height: 60 }}
                >
                  <Picker.Item label="Select item" value={null} />
                  {checkedItemNames.map(n => (
                    <Picker.Item key={`item-${n}`} label={String(n)} value={String(n)} />
                  ))}
                </Picker>
              </View>
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
                  <Text style={{ color: unit === u ? '#fff' : PRIMARY }}>{String(u)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.intervalRow}>
              <TextInput
                placeholder="Days"
                value={days}
                onChangeText={setDays}
                keyboardType="numeric"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                placeholder="Hours"
                value={hours}
                onChangeText={setHours}
                keyboardType="numeric"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                placeholder="Minutes"
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]} 
              />
            </View>
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
});
