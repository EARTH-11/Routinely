// app/student/SettingsTab.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity,ScrollView,Linking, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { clearStudentSession } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { COLORS, RADIUS, SHADOW, FONTS } from '../../constants/theme';
import { StudentSession, Mentor } from '../../types';
import { RootStackParamList } from '../../App';

interface Props { session: StudentSession; }
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsTab({ session }: Props) {
  const navigation = useNavigation<Nav>();
  const [mentors, setMentors] = useState<Mentor[]>([]);

  const fetchMentors = useCallback(async () => {
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('batch_id', session.batch_id)
      .order('sort_order')
      .order('name');
    setMentors(data ?? []);
  }, [session.batch_id]);

  useEffect(() => { fetchMentors(); }, [fetchMentors]);

  async function handleChangeSection() {
    Alert.alert(
      'Change Section',
      'This will clear your current section selection. You can pick a new one.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            await clearStudentSession();
            navigation.replace('SectionPicker');
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>


     <ScrollView style={styles.scrollContainer} >
      <View style={styles.content}> 
        {/* Current section info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your Section</Text>
          <Text style={styles.sectionDisplay}>{session.display_name}</Text>
          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}> {session.batch_name}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}> {session.section_name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={handleChangeSection}>
            <Text style={styles.changeBtnText}>Change Section</Text>
          </TouchableOpacity>
        </View>

         {/* Admin/Rep login */}
        <View style={styles.card}>
        <Text style={styles.cardLabel}>Admin / Class Representaive Login</Text>
        <TouchableOpacity
          style={styles.adminBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.adminBtnText}>Admin / CR Login</Text>
        </TouchableOpacity>
        </View>
      
           {/* Mentors */}
           {mentors.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}> Batch Mentor</Text>
            {mentors.map((mentor, i) => (
              <View
                key={mentor.id}
                style={[styles.mentorRow, i < mentors.length - 1 && styles.mentorRowDivider]}
              > 
                {!!mentor.designation && <Text style={styles.mentorDesignation}>{mentor.designation}</Text>}
                <Text style={styles.mentorName}>{mentor.name}</Text>
                <Text
                  style={styles.mentorPhone}
                  onPress={() => Linking.openURL(`tel:${mentor.phone}`)}
                >
                  {mentor.phone}
                </Text>
              </View>
              
            ))}
          </View>
        )}
   
         {/* previous questions */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Previous  Year Questions</Text>
          <Text style={styles.aboutText}>Log-in with your versity Gmail account</Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://drive.google.com/drive/u/2/mobile/folders/1iVr5YD-83b1cEh-ibfovMhyQW_zWgXe9?pli=1/...')}>
            Previous Year Questions Link [Google-Drive]
          </Text>
          <Text style={styles.aboutText}>Git Hub Link</Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://github.com/siamrana2321/HUB_Question_Bank')}>
            Previous Year Questions Link [Git-Hub]
          </Text>
        </View>

        {/* Important links  */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Relevent Info & Links</Text>
          <Text style={styles.aboutText}>CSE ALL BATCH [Google Classroom] </Text>
          <Text style={styles.mentorName}>j3wav3n</Text>
          <Text style={styles.aboutText}>Bus Schedule Group </Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://m.me/j/AbbcyhraszdX2Yrx/?send_source=gc%3Acopy_invite_link_t')}>
            BUS SCHEDULE GROUP [Messenger]
          </Text>
          <Text style={styles.aboutText}>University Fackebook Page</Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.facebook.com/hub.ac')}>
            University Facebook Page
          </Text>
          <Text style={styles.aboutText}>University LinkedIn Page</Text>
          <Text style={styles.linkText} onPress={() => Linking.openURL('https://www.linkedin.com/company/hamdard-university-bangladesh/')}>
            University LinkedIn Page
          </Text>
        </View>

        {/* App info  */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>About</Text>
          <Text style={styles.aboutText}>Routinely · Student View</Text>
          <Text style={styles.aboutSub}>Read-only · Updates live from your section cr</Text>
           <Text style={styles.aboutSub}>If you want to provide Idea, feedback or report an issue, please contact us at the email address</Text>
          <Text style={styles.aboutSub}>Feedback  · 315251046@hamdarduniversity.edu.bd</Text>
          <Text style={styles.aboutSub}>Ideas  · 315251072@hamdarduniversity.edu.bd</Text>
          <Text style={styles.aboutText}>About Developers</Text>
          <Text style={styles.aboutSub}>Lead Dev · Rahid Hasan [315251046] </Text>
          <Text style={styles.aboutSub}>Frontend · Bappy Bormon [315251055] </Text>
          <Text style={styles.aboutSub}>Layout · Hamim Hasan Limon [315251072] </Text>
        </View>
       
      </View>
    </ScrollView>
   </View>
  
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    ...SHADOW.sm,
  },
  scrollContainer: { flex: 1 },
  headerTitle: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.textPrimary },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 20,
    ...SHADOW.sm,
  },
  linkText:{
    color:'#0066ff',
    marginVertical: 4,
    textDecorationLine: 'underline',
    backgroundColor: '#d9eafc'
  },
  linkButton: {
    backgroundColor: '#1E1E1E',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },

  cardLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  sectionDisplay: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  changeBtn: {
    borderWidth: 1.5,
    borderColor: '#000302',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeBtnText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, padding: 5, borderRadius: RADIUS.md },
  aboutText: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  aboutSub: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  adminBtn: {
     borderWidth: 1.5,
    borderColor: '#000302',
    borderRadius: RADIUS.md,
    paddingVertical: 5,
    alignItems: 'center',
  },
  adminBtnText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, padding: 8, borderRadius: RADIUS.md },
  mentorRow: { paddingVertical: 0},
  mentorRowDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  mentorName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: '#0066ff' },
  mentorDesignation: { fontSize: FONTS.sizes.xs, color: '#383636', marginTop: 0},
  mentorPhone: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, fontWeight: '600', marginTop: 4 },
});
