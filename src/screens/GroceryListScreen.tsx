import React, { useMemo } from 'react';
import MainScreen from './MainScreen';
import { useRoute, useNavigation } from '@react-navigation/native';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

export default function GroceryListScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  // Always use the date from params if present, otherwise default to today
  const selectedDate = useMemo(() => route.params?.date || dayjs().format('YYYY-MM-DD'), [route.params]);

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        style={styles.floatingBack}
        onPress={() => navigation.navigate('History')}
        hitSlop={{ top: 16, left: 16, right: 16, bottom: 16 }}
        accessibilityLabel="Back to Lists"
      >
        <Ionicons name="arrow-back" size={28} color="#111" />
      </TouchableOpacity>
      <MainScreen initialDate={selectedDate} />
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBack: {
    position: 'absolute',
    top: 32,
    left: 16,
    zIndex: 10,
    backgroundColor: 'transparent',
    padding: 4,
    borderRadius: 20,
  },
});
