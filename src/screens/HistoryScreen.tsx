import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal } from 'react-native';
import { useGrocery } from '../context/GroceryContext';
import { Calendar } from 'react-native-calendars';

const APP_BG = '#6fa36f'; // Medium-dark green background
const CARD_BG = '#d8ecd8'; // Light green for cards/tiles
const PRIMARY = '#111'; // Black for strong contrast

export default function HistoryScreen({ navigation }: any) {
  const { items } = useGrocery();
  const historyDates = Array.from(new Set(items.map(i => i.date))).sort((a, b) => b.localeCompare(a));
  const [calendarVisible, setCalendarVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { marginTop: 32, marginBottom: 24 }]}>Your Grocery Lists</Text>
      <FlatList
        data={historyDates}
        keyExtractor={date => date}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tile} onPress={() => navigation.navigate('GroceryList', { date: item })}>
            <Text style={styles.tileText}>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No grocery lists yet.</Text>}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => setCalendarVisible(true)}>
        <Text style={styles.addBtnText}>Add New List</Text>
      </TouchableOpacity>
      <Modal visible={calendarVisible} transparent animationType="slide" onRequestClose={() => setCalendarVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: PRIMARY }}>Select Date</Text>
            <Calendar
              onDayPress={day => {
                setCalendarVisible(false);
                navigation.navigate('GroceryList', { date: day.dateString });
              }}
              markedDates={{ [new Date().toISOString().slice(0, 10)]: { selected: true, selectedColor: PRIMARY } }}
              theme={{ todayTextColor: PRIMARY, selectedDayBackgroundColor: PRIMARY, arrowColor: PRIMARY }}
            />
            <TouchableOpacity style={{ marginTop: 16, alignSelf: 'flex-end' }} onPress={() => setCalendarVisible(false)}>
              <Text style={{ color: PRIMARY, fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_BG, padding: 16 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 18, color: PRIMARY, textAlign: 'center' },
  tile: { flex: 1, backgroundColor: CARD_BG, margin: 8, borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#b3c6e6', shadowOpacity: 0.08, shadowRadius: 4 },
  tileText: { fontSize: 18, color: PRIMARY, fontWeight: 'bold' },
  addBtn: { backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  emptyText: { color: '#444', textAlign: 'center', marginTop: 32, fontSize: 16 },
});
