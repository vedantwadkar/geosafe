import React, { forwardRef } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { getSafetyLevel } from '@/lib/api';

interface NativeMapProps {
  location: { latitude: number; longitude: number };
  safetyScore: number | null;
}

const NativeMap = forwardRef<any, NativeMapProps>(({ location, safetyScore }, _ref) => {
  const level = safetyScore !== null ? getSafetyLevel(safetyScore) : null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="map" size={72} color={Colors.textMuted} />
        <Text style={styles.title}>Safety Map</Text>
        <Text style={styles.coords}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
        {level && safetyScore !== null && (
          <View style={[styles.badge, { backgroundColor: level.bg, borderColor: level.color }]}>
            <View style={[styles.dot, { backgroundColor: level.color }]} />
            <Text style={[styles.badgeText, { color: level.color }]}>
              {safetyScore.toFixed(1)} - {level.label}
            </Text>
          </View>
        )}
        <Pressable
          style={styles.openBtn}
          onPress={() => {
            const url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
            window.open(url, '_blank');
          }}
        >
          <Ionicons name="open-outline" size={16} color={Colors.accent} />
          <Text style={styles.openBtnText}>Open in Google Maps</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 40,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  coords: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  openBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.accent,
  },
});

export default NativeMap;
