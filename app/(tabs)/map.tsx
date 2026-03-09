import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { fetchSafetyScore, getSafetyLevel } from '@/lib/api';
import { getCurrentLocation } from '@/lib/location';
import NativeMap from '@/components/NativeMap';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [safetyScore, setSafetyScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestAndFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissionGranted(false);
          setLoading(false);
          return;
        }
      }
      setPermissionGranted(true);

      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
        try {
          const result = await fetchSafetyScore(loc.latitude, loc.longitude);
          setSafetyScore(result.safety_score);
        } catch {
          setError('Could not fetch safety score');
        }
      } else {
        setError('Unable to get location');
      }
    } catch {
      setError('Location error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    requestAndFetch();
  }, []);

  const handleRecenter = () => {
    if (location && mapRef.current?.animateToRegion) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await requestAndFetch();
  };

  const level = safetyScore !== null ? getSafetyLevel(safetyScore) : null;
  const topPad = Platform.OS === 'web' ? 67 + insets.top : insets.top;

  if (!permissionGranted && !loading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.centerContent}>
          <Ionicons name="location-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.centerTitle}>Location Required</Text>
          <Text style={styles.centerText}>Enable location to view safety map</Text>
          <Pressable style={styles.actionBtn} onPress={requestAndFetch}>
            <Text style={styles.actionBtnText}>Enable</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.centerText}>Loading safety map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location ? (
        <NativeMap ref={mapRef} location={location} safetyScore={safetyScore} />
      ) : (
        <View style={styles.centerContent}>
          <Text style={styles.centerText}>Location unavailable</Text>
        </View>
      )}

      {Platform.OS !== 'web' && (
        <>
          <View style={[styles.topOverlay, { top: insets.top + 12 }]}>
            {level && safetyScore !== null ? (
              <View style={[styles.scoreBadge, { backgroundColor: level.bg, borderColor: level.color }]}>
                <View style={[styles.badgeDot, { backgroundColor: level.color }]} />
                <Text style={[styles.badgeScore, { color: level.color }]}>{safetyScore.toFixed(1)}</Text>
                <Text style={[styles.badgeLabel, { color: level.color }]}>{level.label}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.controlsColumn, { bottom: 100 }]}>
            <Pressable
              style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.7 }]}
              onPress={handleRecenter}
            >
              <Ionicons name="locate" size={22} color={Colors.accent} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.7 }]}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={22} color={Colors.accent} />
            </Pressable>
          </View>
        </>
      )}

      {Platform.OS === 'web' && (
        <View style={[styles.webControls, { top: 67 + insets.top + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.7 }]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={22} color={Colors.accent} />
          </Pressable>
        </View>
      )}

      {error ? (
        <View style={[styles.errorBanner, { bottom: Platform.OS === 'web' ? 118 : 110 }]}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 40,
  },
  centerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  centerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  actionBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.primary,
  },
  topOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeScore: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  badgeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  controlsColumn: {
    position: 'absolute',
    right: 16,
    gap: 10,
  },
  webControls: {
    position: 'absolute',
    right: 20,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  errorBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  errorBannerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#fff',
  },
});
