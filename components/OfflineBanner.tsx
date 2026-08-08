// components/OfflineBanner.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONTS } from '../constants/theme';
import { timeAgo } from '../lib/offlineCache';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  isOffline: boolean;
  lastSynced: number | null;
}

export default function OfflineBanner({ isOffline, lastSynced }: Props) {
  if (!isOffline) return null;
  return (
    <View style={styles.banner}>
      
      <Text style={styles.text}>
        <Ionicons name="cloud-offline-outline" size={20} color='#ff0000' />
        Offline  showing saved Data{lastSynced ? ` from ${timeAgo(lastSynced)}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.accentLight,
    borderRadius: RADIUS.md,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
