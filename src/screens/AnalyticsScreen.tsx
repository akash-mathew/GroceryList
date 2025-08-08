import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useGrocery } from '../context/GroceryContext';
import { BarChart } from 'react-native-chart-kit';
import { subMonths, format } from 'date-fns';

export default function AnalyticsScreen() {
  const { items } = useGrocery();
  
  // Group by month for last 6 months
  const months = useMemo(() => 
    Array.from({ length: 6 }, (_, i) => format(subMonths(new Date(), 5 - i), 'yyyy-MM')), 
    []
  );
  
  const data = useMemo(() => {
    return months.map(month => {
      const count = items.filter(item => item.date && item.date.startsWith(month)).length;
      return count;
    });
  }, [items, months]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Monthly Items Added (Last 6 Months)</Text>
      <BarChart
        data={{
          labels: months.map(m => m.slice(2)),
          datasets: [{ data: data.length > 0 ? data : [0] }],
        }}
        width={Dimensions.get('window').width - 32}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#f8fafc',
          backgroundGradientTo: '#f8fafc',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: () => '#222',
          style: { borderRadius: 16 },
        }}
        style={{ borderRadius: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#222', textAlign: 'center' },
});
