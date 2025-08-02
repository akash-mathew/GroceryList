import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useGrocery } from '../context/GroceryContext';

const APP_BG = '#6fa36f'; // Medium-dark green background
const CARD_BG = '#d8ecd8'; // Light green for cards/tiles
const PRIMARY = '#111'; // Black for strong contrast
const ACCENT = '#e6f0ff'; // Light blue accent
const BORDER = '#d1d5db';
const SHADOW = '#b3c6e6';

export default function SearchScreen() {
  const { items, shops } = useGrocery();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: 'item' | 'shop'; value: string }[]>([]);
  const [selected, setSelected] = useState<{ type: 'item' | 'shop'; value: string } | null>(null);
  const [suggestions, setSuggestions] = useState<{ type: 'item' | 'shop'; value: string }[]>([]);

  const handleSearch = () => {
    if (!query.trim()) return;
    const itemResults = Array.from(new Set(items.map(i => i.name)))
      .filter(name => name && name.toLowerCase().includes(query.toLowerCase()))
      .map(name => ({ type: 'item' as const, value: name }));
    
    // Use dedicated shops array for shop results, with fallback to items
    let shopResults = shops
      .filter(s => s.name && s.name.toLowerCase().includes(query.toLowerCase()))
      .map(s => ({ type: 'shop' as const, value: s.name }));
    
    // Fallback: also check shops from items if shops array is empty or incomplete
    if (shopResults.length === 0) {
      const shopNamesFromItems = Array.from(new Set(items.map(i => i.shop).filter(Boolean)))
        .filter(shopName => shopName && shopName.toLowerCase().includes(query.toLowerCase()))
        .map(shopName => ({ type: 'shop' as const, value: shopName }));
      shopResults = shopNamesFromItems;
    }
    
    setResults([...itemResults, ...shopResults]);
    setSelected(null);
  };

  const handleInputChange = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }
    // Only suggest from user history
    const itemSuggestions = Array.from(new Set(items.map(i => i.name)))
      .filter(name => name && name.toLowerCase().includes(text.toLowerCase()))
      .map(name => ({ type: 'item' as const, value: name }));
    
    // Use dedicated shops array for shop suggestions, with fallback to items
    let shopSuggestions = shops
      .filter(s => s.name && s.name.toLowerCase().includes(text.toLowerCase()))
      .map(s => ({ type: 'shop' as const, value: s.name }));
    
    // Fallback: also check shops from items if shops array is empty or incomplete
    if (shopSuggestions.length === 0) {
      const shopNamesFromItems = Array.from(new Set(items.map(i => i.shop).filter(Boolean)))
        .filter(shopName => shopName && shopName.toLowerCase().includes(text.toLowerCase()))
        .map(shopName => ({ type: 'shop' as const, value: shopName }));
      shopSuggestions = shopNamesFromItems;
    }
    
    setSuggestions([...itemSuggestions, ...shopSuggestions]);
  };

  const itemHistory = selected?.type === 'item'
    ? items.filter(i => i.name === selected.value)
    : [];
  const shopHistory = selected?.type === 'shop'
    ? items.filter(i => i.shop === selected.value)
    : [];

  return (
    <View style={styles.container}>
      <View style={[styles.searchBarRow, { marginTop: 32 }]}>
        <TextInput
          style={styles.input}
          placeholder="Search for item or shop..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
          <Text style={{ color: '#fff' }}>Search</Text>
        </TouchableOpacity>
      </View>
      {/* Suggestions FlatList (for { type, value }) */}
      {suggestions.length > 0 && !selected && (
        <FlatList
          data={suggestions}
          keyExtractor={item => item.type + item.value}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelected(item); setSuggestions([]); }}>
              <Text style={styles.resultItem}>{item.type === 'item' ? '🛒' : '🏬'} {item.value}</Text>
            </TouchableOpacity>
          )}
          style={{ maxHeight: 120, backgroundColor: '#f9f9f9', borderRadius: 8, marginBottom: 8 }}
        />
      )}
      {/* Table for selected item or shop */}
      {selected && (
        <View style={styles.tableContainer}>
          <Text style={styles.tableHeaderTitle}>{selected.type === 'item' ? `Item: ${selected.value}` : `Shop: ${selected.value}`}</Text>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderCell}>Date</Text>
            {selected.type === 'shop' && <Text style={styles.tableHeaderCell}>Item</Text>}
            <Text style={styles.tableHeaderCell}>Qty</Text>
            <Text style={styles.tableHeaderCell}>Unit</Text>
            {/* Remove Shop column for shop search */}
            {selected.type === 'item' && <Text style={styles.tableHeaderCell}>Shop</Text>}
          </View>
          <FlatList
            data={selected.type === 'item'
              ? items.filter(i => i.name && i.name.trim().toLowerCase() === selected.value.trim().toLowerCase())
              : items.filter(i => i.shop && i.shop.trim().toLowerCase() === selected.value.trim().toLowerCase())}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.tableRowStyled}>
                <Text style={styles.tableCellStyled}>{item.date}</Text>
                {selected.type === 'shop' && <Text style={styles.tableCellStyled}>{item.name}</Text>}
                <Text style={styles.tableCellStyled}>{item.quantity}</Text>
                <Text style={styles.tableCellStyled}>{item.unit}</Text>
                {/* Remove Shop cell for shop search */}
                {selected.type === 'item' && <Text style={styles.tableCellStyled}>{item.shop}</Text>}
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No {selected.type === 'item' ? 'item' : 'shop'} history found for "{selected.value}".</Text>}
          />
        </View>
      )}
      {/* No results found message for search */}
      {query.trim() && !selected && suggestions.length === 0 && (
        <Text style={styles.emptyText}>No item or shop found for "{query}".</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: APP_BG },
  header: { fontSize: 32, fontWeight: 'bold', color: PRIMARY, letterSpacing: 1, marginBottom: 0, marginTop: 8, textAlign: 'left' },
  searchBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 8, marginRight: 8, backgroundColor: CARD_BG, fontSize: 16, color: '#000' },
  searchBtn: { backgroundColor: PRIMARY, padding: 10, borderRadius: 6 },
  resultItem: { fontSize: 18, paddingVertical: 6 },
  historyBox: { marginTop: 20, backgroundColor: ACCENT, borderRadius: 8, padding: 12 },
  historyHeader: { fontWeight: 'bold', marginBottom: 8, color: PRIMARY },
  tableContainer: { backgroundColor: CARD_BG, borderRadius: 14, marginTop: 16, padding: 12, elevation: 4, shadowColor: SHADOW, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 2, borderColor: PRIMARY, paddingBottom: 8, marginBottom: 6, backgroundColor: ACCENT, borderRadius: 8 },
  tableHeaderCell: { flex: 1, fontWeight: 'bold', color: PRIMARY, fontSize: 15, textAlign: 'center' },
  tableRowStyled: { flexDirection: 'row', alignItems: 'center', backgroundColor: ACCENT, borderRadius: 8, marginBottom: 6, paddingVertical: 8, paddingHorizontal: 4, shadowColor: SHADOW, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  tableCellStyled: { flex: 1, fontSize: 14, color: '#222', textAlign: 'center' },
  emptyText: { textAlign: 'center', color: '#111', padding: 16, fontSize: 16 },
  tableHeaderTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: PRIMARY, textAlign: 'center' },
});
