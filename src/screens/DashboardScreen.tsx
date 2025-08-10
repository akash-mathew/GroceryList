import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Platform, Alert, ScrollView } from 'react-native';
import { useGrocery } from '../context/GroceryContext';
import { subMonths, isWithinInterval, parseISO } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BarChart, PieChart } from 'react-native-chart-kit';

const APP_BG = '#6fa36f'; // Medium-dark green background
const CARD_BG = '#d8ecd8'; // Light green for cards/tiles
const PRIMARY = '#111'; // Black for strong contrast
const ACCENT = '#e6f0ff'; // Light blue accent
const BORDER = '#d1d5db';
const SHADOW = '#b3c6e6';

const TIME_FILTERS = [
  { key: 'week', label: 'Last Week' },
  { key: 'month', label: 'Last Month' },
  { key: 'custom', label: 'Custom Range' },
];

interface DashboardScreenProps {
  onAddRef?: (elementId: string, ref: any) => void;
}

export default function DashboardScreen({ onAddRef }: DashboardScreenProps) {
  const { items, checkForUnpurchasedItems, purchasedItems } = useGrocery();
  const now = new Date();
  const [mainSection, setMainSection] = useState<'breakdown' | 'insights'>('insights');
  const [timeFilter, setTimeFilter] = useState('week');
  const [customStart, setCustomStart] = useState<Date | null>(subMonths(now, 1));
  const [customEnd, setCustomEnd] = useState<Date | null>(now);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [activeTile, setActiveTile] = useState<'item' | 'shop'>('item');
  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'liter' | 'piece'>('kg');

  const isCustomInvalid = timeFilter === 'custom' && (
    !customStart || !customEnd || customStart > customEnd
  );

  const safeParseDate = (dateStr: string) => {
    try {
      return parseISO(dateStr);
    } catch {
      return null;
    }
  };

  const validItems = Array.isArray(items)
    ? items.filter(item => {
        if (!item || typeof item !== 'object') return false;
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') return false;
        if (!item.date || typeof item.date !== 'string') return false;
        if (isNaN(Number(item.quantity))) return false;
        const d = safeParseDate(item.date);
        if (!d || isNaN(d.getTime())) return false;
        return true;
      })
    : [];

  const filteredItems = useMemo(() => {
    if (!validItems || !Array.isArray(validItems)) return [];
    if (timeFilter === 'custom' && customStart && customEnd && !isCustomInvalid) {
      return validItems.filter(item => {
        const d = safeParseDate(item.date);
        return d && isWithinInterval(d, { start: customStart, end: customEnd });
      });
    }
    if (timeFilter === 'week') {
      const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return validItems.filter(item => {
        const d = safeParseDate(item.date);
        return d && isWithinInterval(d, { start: fromDate, end: now });
      });
    }
    if (timeFilter === 'month') {
      const fromDate = subMonths(now, 1);
      return validItems.filter(item => {
        const d = safeParseDate(item.date);
        return d && isWithinInterval(d, { start: fromDate, end: now });
      });
    }
    return validItems.filter(item => safeParseDate(item.date));
  }, [validItems, timeFilter, customStart, customEnd, isCustomInvalid]);

  // Add: default Insights range = last 6 months
  const insightsItems = useMemo(() => {
    const fromDate = subMonths(now, 6);
    return validItems.filter(item => {
      const d = safeParseDate(item.date);
      return d && isWithinInterval(d, { start: fromDate, end: now });
    });
  }, [validItems]);

  // --- Grocery Item Analytics ---
  const itemCountData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredItems.forEach(item => {
      const name = item.name && item.name.trim() !== '' ? item.name : 'Unnamed';
      counts[name] = (counts[name] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      labels: sorted.map(([name]) => name.length > 12 ? name.slice(0, 12) + '…' : name),
      values: sorted.map(([, count]) => count),
    };
  }, [filteredItems]);
  // Total quantity bought per item (selectable unit)
  const itemQtyData = useMemo(() => {
    const qtys: Record<string, number> = {};
    filteredItems.filter(item => item.unit === selectedUnit).forEach(item => {
      const name = item.name && item.name.trim() !== '' ? item.name : 'Unnamed';
      qtys[name] = (qtys[name] || 0) + Number(item.quantity);
    });
    const sorted = Object.entries(qtys).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      labels: sorted.map(([name]) => name.length > 12 ? name.slice(0, 12) + '…' : name),
      values: sorted.map(([, qty]) => qty),
    };
  }, [filteredItems, selectedUnit]);

  // --- Grocery Shop Analytics ---
  const shopCountData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredItems.forEach(item => {
      if (item.shop) counts[item.shop] = (counts[item.shop] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
      labels: sorted.map(([name]) => name.length > 12 ? name.slice(0, 12) + '…' : name),
      values: sorted.map(([, count]) => count),
    };
  }, [filteredItems]);

  // --- Insights data over last 6 months ---
  const insightsPurchasedVsUnpurchased = useMemo(() => {
    const total = insightsItems.length;
    let purchased = 0;
    insightsItems.forEach(item => {
      if (purchasedItems[item.name]) purchased += 1;
    });
    const unpurchased = total - purchased;
    return { total, purchased, unpurchased, missPct: total ? Math.round((unpurchased / total) * 100) : 0 };
  }, [insightsItems, purchasedItems]);

  const insightsMonthlyAggregates = useMemo(() => {
    const map: Record<string, number> = {};
    insightsItems.forEach(i => {
      const d = safeParseDate(i.date);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + 1;
    });
    const keys = Object.keys(map).sort();
    return keys.map(k => ({ key: k, total: map[k] }));
  }, [insightsItems]);

  // Expose an API for the tutorial to control this screen
  useEffect(() => {
    if (onAddRef) {
      onAddRef('analytics-api', {
        setSection: (section: 'breakdown' | 'insights') => setMainSection(section),
        getSection: () => mainSection,
      });
    }
  }, [onAddRef, mainSection]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: APP_BG }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.container}>
        {/* Floating tabs for main sections */}
        <View style={styles.sectionSwitchRow}>
          <TouchableOpacity style={[styles.sectionSwitch, mainSection === 'breakdown' && styles.sectionSwitchActive]} onPress={() => setMainSection('breakdown')}>
            <Text style={mainSection === 'breakdown' ? styles.tileSwitchTextActive : styles.tileSwitchText}>Breakdown</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sectionSwitch, mainSection === 'insights' && styles.sectionSwitchActive]} onPress={() => setMainSection('insights')}>
            <Text style={mainSection === 'insights' ? styles.tileSwitchTextActive : styles.tileSwitchText}>Insights</Text>
          </TouchableOpacity>
        </View>
        
        {/* Show filters only for Breakdown */}
        {mainSection === 'breakdown' && (
          <>
            {/* Time filters visible for both sections */}
            <View 
              ref={ref => onAddRef && onAddRef('time-filter', ref)}
              style={[styles.filterRow, { marginTop: 8 }]}
            >
              {TIME_FILTERS.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filterBtn, timeFilter === f.key && styles.filterBtnActive]}
                  onPress={() => setTimeFilter(f.key)}
                >
                  <Text style={timeFilter === f.key ? styles.filterTextActive : styles.filterText}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {timeFilter === 'custom' && (
              <View style={styles.customRangeRow}>
                <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.customDateBtn}>
                  <Text style={styles.customDateText}>{customStart ? customStart.toISOString().slice(0, 10) : 'Start'}</Text>
                </TouchableOpacity>
                <Text style={{ marginHorizontal: 4 }}>to</Text>
                <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.customDateBtn}>
                  <Text style={styles.customDateText}>{customEnd ? customEnd.toISOString().slice(0, 10) : 'End'}</Text>
                </TouchableOpacity>
                {isCustomInvalid && (
                  <Text style={styles.errorText}>Start date must be before end date.</Text>
                )}
              </View>
            )}
            {showStartPicker && (
              <DateTimePicker
                value={customStart || subMonths(now, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowStartPicker(false);
                  if (date) setCustomStart(date);
                }}
              />
            )}
            {showEndPicker && (
              <DateTimePicker
                value={customEnd || now}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowEndPicker(false);
                  if (date) setCustomEnd(date);
                }}
              />
            )}
          </>
        )}

        {mainSection === 'breakdown' && (
          <>
            <View 
              ref={ref => onAddRef && onAddRef('analytics-toggle', ref)}
              style={styles.tileSwitchRow}
            >
              <TouchableOpacity style={[styles.tileSwitch, activeTile === 'item' && styles.tileSwitchActive]} onPress={() => setActiveTile('item')}>
                <Text style={activeTile === 'item' ? styles.tileSwitchTextActive : styles.tileSwitchText}>Grocery Item</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tileSwitch, activeTile === 'shop' && styles.tileSwitchActive]} onPress={() => setActiveTile('shop')}>
                <Text style={activeTile === 'shop' ? styles.tileSwitchTextActive : styles.tileSwitchText}>Grocery Shop</Text>
              </TouchableOpacity>
            </View>

            {activeTile === 'item' && (
              <View 
                ref={ref => onAddRef && onAddRef('charts', ref)}
                style={styles.analyticsBox}
              >
                <Text style={styles.analyticsTitle}>Number of Times Bought (Top 10)</Text>
                {itemCountData.labels.length > 0 ? (
                  <BarChart
                    data={{ labels: itemCountData.labels, datasets: [{ data: itemCountData.values }] }}
                    width={Dimensions.get('window').width - 32}
                    height={200}
                    yAxisLabel={''}
                    yAxisSuffix={''}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars
                    withInnerLines
                    withVerticalLabels={true}
                    withHorizontalLabels={false}
                  />
                ) : <Text style={styles.emptyText}>No data for selected range.</Text>}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                  <Text style={styles.analyticsTitle}>Total Quantity Bought</Text>
                  <View style={{ marginLeft: 12, flexDirection: 'row', backgroundColor: ACCENT, borderRadius: 8, borderWidth: 1, borderColor: PRIMARY, overflow: 'hidden' }}>
                    {['kg', 'liter', 'piece'].map(u => (
                      <TouchableOpacity key={u} style={{ paddingVertical: 4, paddingHorizontal: 12, backgroundColor: selectedUnit === u ? PRIMARY : 'transparent' }} onPress={() => setSelectedUnit(u as any)}>
                        <Text style={{ color: selectedUnit === u ? '#fff' : PRIMARY, fontWeight: 'bold' }}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {itemQtyData.labels.length > 0 ? (
                  <BarChart
                    data={{ labels: itemQtyData.labels, datasets: [{ data: itemQtyData.values }] }}
                    width={Dimensions.get('window').width - 32}
                    height={200}
                    yAxisLabel={''}
                    yAxisSuffix={selectedUnit}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars
                    withInnerLines
                    withVerticalLabels={true}
                    withHorizontalLabels={false}
                  />
                ) : <Text style={styles.emptyText}>No data for selected range.</Text>}
              </View>
            )}

            {activeTile === 'shop' && (
              <View style={styles.analyticsBox}>
                <Text style={styles.analyticsTitle}>Number of Purchases per Shop (Top 10)</Text>
                {shopCountData.labels.length > 0 ? (
                  <BarChart
                    data={{ labels: shopCountData.labels, datasets: [{ data: shopCountData.values }] }}
                    width={Dimensions.get('window').width - 32}
                    height={200}
                    yAxisLabel={''}
                    yAxisSuffix={''}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    fromZero
                    showValuesOnTopOfBars
                    withInnerLines
                    withVerticalLabels={true}
                    withHorizontalLabels={false}
                  />
                ) : <Text style={styles.emptyText}>No data for selected range.</Text>}
              </View>
            )}
          </>
        )}

        {mainSection === 'insights' && (
          <>
            <View style={styles.analyticsBox}>
              <Text style={styles.analyticsTitle}>Purchase Analysis (Last 6 Months)</Text>
              {insightsPurchasedVsUnpurchased.total > 0 ? (
                <PieChart
                  data={[
                    { name: 'Purchased', population: insightsPurchasedVsUnpurchased.purchased, color: '#4CAF50', legendFontColor: PRIMARY, legendFontSize: 14 },
                    { name: 'Unpurchased', population: insightsPurchasedVsUnpurchased.unpurchased, color: '#FF6B6B', legendFontColor: PRIMARY, legendFontSize: 14 },
                  ]}
                  width={Dimensions.get('window').width - 32}
                  height={200}
                  chartConfig={{ color: (o=1)=>`rgba(17,17,17,${o})` }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                />
              ) : (
                <Text style={styles.emptyText}>No data available</Text>
              )}
            </View>

            <View style={styles.analyticsBox}>
              <Text style={styles.analyticsTitle}>Shopping Activity by Month (Last 6 Months)</Text>
              {insightsMonthlyAggregates.length > 0 ? (
                <BarChart
                  data={{
                    labels: insightsMonthlyAggregates.map(m => m.key.slice(2)),
                    datasets: [{ data: insightsMonthlyAggregates.map(m => m.total) }],
                  }}
                  width={Dimensions.get('window').width - 32}
                  height={200}
                  yAxisLabel={''}
                  yAxisSuffix={''}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  fromZero
                  showValuesOnTopOfBars
                  withInnerLines
                  withVerticalLabels
                  withHorizontalLabels={false}
                />
              ) : (
                <Text style={styles.emptyText}>No activity</Text>
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_BG, padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: PRIMARY },
  header: { fontSize: 32, fontWeight: 'bold', color: PRIMARY, letterSpacing: 1, marginBottom: 0, marginTop: 8, textAlign: 'left' },
  filterRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'center' },
  filterBtn: { padding: 8, borderRadius: 8, backgroundColor: '#eee', marginRight: 8 },
  filterBtnActive: { backgroundColor: PRIMARY },
  filterText: { color: '#333' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  customRangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'center' },
  customDateBtn: { backgroundColor: CARD_BG, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: BORDER, marginHorizontal: 2 },
  customDateText: { color: '#222', fontSize: 14 },
  errorText: { color: 'red', marginLeft: 8, fontSize: 13 },
  sectionSwitchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 8 },
  sectionSwitch: { flex: 1, backgroundColor: ACCENT, borderRadius: 10, marginHorizontal: 6, paddingVertical: 10, alignItems: 'center' },
  sectionSwitchActive: { backgroundColor: PRIMARY },
  tileSwitchRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  tileSwitch: { flex: 1, backgroundColor: ACCENT, borderRadius: 10, marginHorizontal: 6, paddingVertical: 12, alignItems: 'center' },
  tileSwitchActive: { backgroundColor: PRIMARY },
  tileSwitchText: { color: PRIMARY, fontWeight: 'bold', fontSize: 16 },
  tileSwitchTextActive: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  analyticsBox: { backgroundColor: CARD_BG, borderRadius: 14, padding: 14, marginBottom: 16, elevation: 2, shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 8 },
  analyticsTitle: { fontSize: 17, fontWeight: 'bold', color: PRIMARY, marginBottom: 8, marginTop: 8 },
  chart: { borderRadius: 16, marginBottom: 16, backgroundColor: ACCENT },
  emptyText: { textAlign: 'center', color: '#999', padding: 16, fontSize: 16 },
  infoText: { color: PRIMARY, fontSize: 13, textAlign: 'center', marginTop: 4 },
});

const chartConfig = {
  backgroundColor: APP_BG,
  backgroundGradientFrom: APP_BG,
  backgroundGradientTo: ACCENT,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(35,86,199,${opacity})`, // PRIMARY color
  labelColor: () => PRIMARY,
  style: { borderRadius: 16 },
  propsForBackgroundLines: { stroke: '#cce0ff' },
  propsForLabels: { fontWeight: 'bold', fontSize: 13 },
  barPercentage: 0.6,
};
