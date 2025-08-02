import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useGrocery } from '../context/GroceryContext';

export default function CalendarScreen({ navigation }: any) {
  const { getItemsByDate } = useGrocery();
  const [selected, setSelected] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Calendar</Text>
      <Calendar
        onDayPress={day => {
          setSelected(day.dateString);
          navigation.navigate('Grocery List', { date: day.dateString });
        }}
        markedDates={{
          [selected]: { selected: true, selectedColor: '#007AFF' },
        }}
        theme={{
          todayTextColor: '#007AFF',
          selectedDayBackgroundColor: '#007AFF',
          arrowColor: '#007AFF',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#222' },
});
