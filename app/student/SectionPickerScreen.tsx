// app/student/SectionPickerScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Dimensions,Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { saveStudentSession } from '../../lib/auth';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { Batch, Section } from '../../types';
import { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SectionPicker'>;

const { width } = Dimensions.get('window');

export default function SectionPickerScreen() {
  const navigation = useNavigation<Nav>();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    const { data } = await supabase.from('batches').select('*').order('year', { ascending: false });
    setBatches(data ?? []);
    setLoading(false);
  }

  async function fetchSections(batch: Batch) {
    setSectionsLoading(true);
    setSelectedBatch(batch);
    const { data } = await supabase
      .from('sections')
      .select('*')
      .eq('batch_id', batch.id)
      .order('name');
    setSections(data ?? []);
    setSectionsLoading(false);
  }

  async function selectSection(section: Section) {
    const session = {
      batch_id: selectedBatch!.id,
      batch_name: selectedBatch!.name,
      section_id: section.id,
      section_name: section.name,
      display_name: section.display_name ?? `${selectedBatch!.name} - ${section.name}`,
    };
    await saveStudentSession(session);
    navigation.replace('StudentTabs', { session });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../assets/hub logo.png')}
                  style={styles.localImage}
         />         
        <Text style={styles.emoji1}>Hamdard University Bangladesh </Text>
        <Text style={styles.title}>Routinely</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Step 1 - Batch */}
          <View style={styles.stepContainer}>
            <Text style={styles.stepLabel}> Select Batch</Text>
            <View style={styles.grid}>
              {batches.map((batch) => (
                <TouchableOpacity
                  key={batch.id}
                  style={[
                    styles.batchCard,
                    selectedBatch?.id === batch.id && styles.batchCardActive,
                  ]}
                  onPress={() => fetchSections(batch)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.batchCardText,
                    selectedBatch?.id === batch.id && styles.batchCardTextActive,
                  ]}>
                    {batch.name}
                  </Text>
                  {batch.year && (
                    <Text style={[
                      styles.batchCardYear,
                      selectedBatch?.id === batch.id && styles.batchCardYearActive,
                    ]}>
                      {batch.year}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Step 2 - Section */}
          {selectedBatch && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}> Select Section</Text>
              {sectionsLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
              ) : sections.length === 0 ? (
                <Text style={styles.empty}>No sections added yet.</Text>
              ) : (
                <View style={styles.grid}>
                  {sections.map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      style={styles.sectionCard}
                      onPress={() => selectSection(section)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.sectionCardText}>{section.name}</Text>
                      <Text style={styles.sectionCardSub}>{selectedBatch.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Admin login link */}
      <TouchableOpacity
        style={styles.adminLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.adminLinkText}>Admin / Rep Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 70,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...SHADOW.md,
  },
  emoji: { fontSize: 30, marginBottom: 8 },
  emoji1: { fontSize: 20, marginBottom: 8 ,color:'#00875A',fontWeight:700},
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: '#144e3b',
    letterSpacing: -0.5,
  },
  scroll: { padding: 20, paddingBottom: 80 },
  stepContainer: { marginBottom: 28 },
  stepLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  localImage:{
    width:100,
    height:80,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  batchCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  batchCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  batchCardText: {
    fontSize: FONTS.sizes.base,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  batchCardTextActive: { color: COLORS.primary },
  batchCardYear: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  batchCardYearActive: { color: COLORS.primary },
  sectionCard: {
    width: (width - 52) / 2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: 18,
    alignItems: 'center',
    ...SHADOW.sm,
  },
  sectionCardText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: '#fff',
  },
  sectionCardSub: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  empty: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    marginTop: 8,
  },
  adminLink: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    padding: 10,
  },
  adminLinkText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    textDecorationLine: 'underline',
  },
});
