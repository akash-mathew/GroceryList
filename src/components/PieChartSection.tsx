import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import PieChart from 'react-native-pie-chart';

interface PieChartSectionProps {
  data: { labels: string[]; values: number[] };
  title: string;
  colors?: string[];
}

const defaultColors = [
  '#2356c7', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad', '#16a085', '#2980b9', '#d35400', '#2c3e50', '#c0392b',
];

export default function PieChartSection({ data, title, colors = defaultColors }: PieChartSectionProps) {
  const widthAndHeight = Math.min(Dimensions.get('window').width - 64, 260);
  // Filter out zero values and their labels
  const filtered = data.values
    .map((v, i) => ({ value: v, label: data.labels[i] }))
    .filter(x => x.value > 0);
  const values = filtered.map(x => x.value);
  const labels = filtered.map(x => x.label);
  const total = values.reduce((a, b) => a + b, 0);
  // Ensure there is a color for every value, pad if needed
  const sliceColor = [...colors.slice(0, values.length)];
  while (sliceColor.length < values.length) {
    sliceColor.push('#cccccc');
  }
  // If only one value, PieChart requires at least two slices/colors
  const pieValues = values.length === 1 ? [values[0], 0.0001] : values;
  const pieColors = values.length === 1 ? [sliceColor[0], '#f0f0f0'] : sliceColor;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {values.length > 0 && total > 0 ? (
        <PieChart
          widthAndHeight={widthAndHeight}
          series={pieValues as any}
        />
      ) : (
        <Text style={styles.emptyText}>No data for selected range.</Text>
      )}
      <View style={styles.legendContainer}>
        {labels.map((label, idx) => (
          <View key={label} style={styles.legendRow}>
            <View style={[styles.legendColor, { backgroundColor: colors[idx % colors.length] }]} />
            <Text style={styles.legendLabel}>{label} ({values[idx]})</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 17, fontWeight: 'bold', color: '#2356c7', marginBottom: 8, marginTop: 8 },
  emptyText: { textAlign: 'center', color: '#999', padding: 16, fontSize: 16 },
  legendContainer: { marginTop: 12, width: '100%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendColor: { width: 16, height: 16, borderRadius: 8, marginRight: 8 },
  legendLabel: { fontSize: 14, color: '#222' },
});
