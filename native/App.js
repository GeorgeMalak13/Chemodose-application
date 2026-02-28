import React, { useState, useMemo, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  StatusBar,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { 
  ChevronLeft, 
  Search, 
  Activity, 
  Droplets, 
  Scale, 
  Info,
  Calculator,
  Settings
} from 'lucide-react-native';
import * as math from 'mathjs';

// Note: In a real RN app, you'd import these from your data files
const DEFAULT_DRUGS = []; // This would be populated with your drug data

export default function App() {
  const [drugs, setDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch drugs from your API or local DB
  useEffect(() => {
    // Simulated fetch
    // fetch('https://your-api.com/api/drugs')...
  }, []);

  const filteredDrugs = useMemo(() => 
    drugs.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  [searchQuery, drugs]);

  const handleDrugSelect = (drug) => {
    setSelectedDrug(drug);
    const initialInputs = {};
    drug.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialInputs[field.id] = field.defaultValue;
      }
    });
    setInputs(initialInputs);
  };

  const handleInputChange = (fieldId, value) => {
    const numValue = parseFloat(value);
    setInputs(prev => ({
      ...prev,
      [fieldId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const results = useMemo(() => {
    if (!selectedDrug || !inputs.weight) return [];
    
    return selectedDrug.formulas.map((f) => {
      try {
        const value = math.evaluate(f.formula, inputs);
        return {
          label: f.label,
          value: typeof value === 'number' ? value.toFixed(2) : String(value),
          unit: f.unit,
          description: f.description
        };
      } catch (err) {
        return { label: f.label, value: 'Error', unit: '' };
      }
    });
  }, [selectedDrug, inputs]);

  if (!selectedDrug) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chemodose</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Settings size={24} color="#253665" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search drugs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredDrugs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.drugCard}
              onPress={() => handleDrugSelect(item)}
            >
              <View style={styles.drugInfo}>
                <Text style={styles.drugName}>{item.name}</Text>
                <Text style={styles.drugCategory}>{item.category}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.type}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedDrug(null)} style={styles.backButton}>
            <ChevronLeft size={28} color="#941B1E" />
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View>
                <Text style={styles.infoTitle}>{selectedDrug.name}</Text>
                <Text style={styles.infoSubtitle}>{selectedDrug.category}</Text>
              </View>
              <Activity size={32} color="#941B1E" />
            </View>
          </View>

          <Text style={styles.sectionTitle}>REQUIRED INPUTS</Text>
          {selectedDrug.fields.map((field) => (
            <View key={field.id} style={styles.inputCard}>
              <Text style={styles.inputLabel}>{field.label} ({field.unit})</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(inputs[field.id] || '')}
                onChangeText={(val) => handleInputChange(field.id, val)}
                placeholder="0.00"
              />
            </View>
          ))}

          <Text style={styles.sectionTitle}>CALCULATED RESULTS</Text>
          {results.map((result, index) => (
            <View key={index} style={styles.resultCard}>
              <Text style={styles.resultLabel}>{result.label}</Text>
              <View style={styles.resultValueRow}>
                <Text style={styles.resultValue}>{result.value}</Text>
                <Text style={styles.resultUnit}>{result.unit}</Text>
              </View>
              {result.description && (
                <View style={styles.descriptionRow}>
                  <Info size={12} color="#941B1E" />
                  <Text style={styles.descriptionText}>{result.description}</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#253665',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#941B1E',
    marginLeft: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  drugCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  drugName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#253665',
  },
  drugCategory: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#941B1E',
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 25,
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#253665',
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#941B1E',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 15,
    marginTop: 10,
  },
  inputCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 20,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 5,
  },
  input: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  resultCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#941B1E',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 5,
  },
  resultValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultValue: {
    fontSize: 32,
    fontWeight: '300',
    color: '#253665',
  },
  resultUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 5,
  },
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 5,
  }
});
