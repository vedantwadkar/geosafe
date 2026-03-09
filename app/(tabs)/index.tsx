import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { fetchSafetyScore, getSafetyLevel } from '@/lib/api';
import { getCurrentLocation } from '@/lib/location';
import { saveFeedback } from '@/lib/storage';
import * as Crypto from 'expo-crypto';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [safetyScore, setSafetyScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [userRating, setUserRating] = useState<number>(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pulseScale = useSharedValue(1);
  const scoreOpacity = useSharedValue(0);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const scoreAnimStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
  }));

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'web') {
      setPermissionGranted(true);
      return true;
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === 'granted';
    setPermissionGranted(granted);
    return granted;
  }, []);

  const fetchLocation = useCallback(async () => {
    setLocationLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation(loc);
      } else {
        setError('Unable to get location');
      }
    } catch {
      setError('Location error');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const fetchScore = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSafetyScore(location.latitude, location.longitude);
      setSafetyScore(result.safety_score);
      scoreOpacity.value = withSpring(1);
      pulseScale.value = withRepeat(withTiming(1.05, { duration: 1500 }), -1, true);
    } catch {
      setError('Could not fetch safety score. Check your connection.');
      setSafetyScore(null);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    (async () => {
      const granted = await requestPermission();
      if (granted) {
        await fetchLocation();
      }
    })();
  }, []);

  useEffect(() => {
    if (location) {
      fetchScore();
    }
  }, [location]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await fetchLocation();
  };

  const handleSubmitFeedback = async () => {
    if (!location) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveFeedback({
      id: Crypto.randomUUID(),
      latitude: location.latitude,
      longitude: location.longitude,
      rating: userRating,
      timestamp: Date.now(),
    });
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 3000);
  };

  const level = safetyScore !== null ? getSafetyLevel(safetyScore) : null;

  if (!permissionGranted && !locationLoading) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? 67 + insets.top : insets.top }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.permTitle}>Location Access Required</Text>
          <Text style={styles.permText}>GeoSafe needs your location to predict safety scores for your area.</Text>
          <Pressable style={styles.permButton} onPress={requestPermission}>
            <Text style={styles.permButtonText}>Enable Location</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={[styles.scrollContent, { paddingTop: Platform.OS === 'web' ? 67 + insets.top : insets.top + 16, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons name="shield-check" size={28} color={Colors.accent} />
        <Text style={styles.headerTitle}>GeoSafe</Text>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <Ionicons name="navigate" size={18} color={Colors.accent} />
          <Text style={styles.locationLabel}>Current Location</Text>
        </View>
        {locationLoading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginVertical: 12 }} />
        ) : location ? (
          <View style={styles.coordsRow}>
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>LAT</Text>
              <Text style={styles.coordValue}>{location.latitude.toFixed(6)}</Text>
            </View>
            <View style={styles.coordDivider} />
            <View style={styles.coordItem}>
              <Text style={styles.coordLabel}>LNG</Text>
              <Text style={styles.coordValue}>{location.longitude.toFixed(6)}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>Location unavailable</Text>
        )}
      </View>

      {level && safetyScore !== null ? (
        <Animated.View style={[styles.scoreCard, { borderColor: level.color }, scoreAnimStyle]}>
          <Text style={styles.scoreLabel}>Safety Score</Text>
          <Animated.View style={[styles.scoreCircle, { borderColor: level.color, backgroundColor: level.bg }, pulseStyle]}>
            <Text style={[styles.scoreValue, { color: level.color }]}>{safetyScore.toFixed(1)}</Text>
            <Text style={styles.scoreMax}>/10</Text>
          </Animated.View>
          <View style={[styles.levelBadge, { backgroundColor: level.bg }]}>
            <View style={[styles.levelDot, { backgroundColor: level.color }]} />
            <Text style={[styles.levelText, { color: level.color }]}>{level.label}</Text>
          </View>
        </Animated.View>
      ) : loading ? (
        <View style={styles.scoreCard}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.loadingText}>Analyzing area safety...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="warning" size={20} color={Colors.danger} />
          <Text style={styles.errorCardText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
        onPress={handleRefresh}
        disabled={loading || locationLoading}
      >
        {loading || locationLoading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        )}
        <Text style={styles.refreshButtonText}>
          {loading || locationLoading ? 'Refreshing...' : 'Refresh Safety Score'}
        </Text>
      </Pressable>

      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>How safe do you feel here?</Text>
        <Text style={styles.feedbackSubtitle}>Rate from 0 (unsafe) to 10 (very safe)</Text>
        <View style={styles.ratingRow}>
          {Array.from({ length: 11 }, (_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                setUserRating(i);
                Haptics.selectionAsync();
              }}
              style={[
                styles.ratingDot,
                userRating === i && {
                  backgroundColor: getSafetyLevel(i).color,
                  borderColor: getSafetyLevel(i).color,
                },
              ]}
            >
              <Text style={[styles.ratingDotText, userRating === i && { color: Colors.primary }]}>
                {i}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            feedbackSubmitted && styles.submitButtonDone,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handleSubmitFeedback}
          disabled={feedbackSubmitted || !location}
        >
          {feedbackSubmitted ? (
            <Ionicons name="checkmark-circle" size={20} color={Colors.safe} />
          ) : (
            <Ionicons name="send" size={18} color={Colors.accent} />
          )}
          <Text style={[styles.submitButtonText, feedbackSubmitted && { color: Colors.safe }]}>
            {feedbackSubmitted ? 'Feedback Submitted' : 'Submit Rating'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  permText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  permButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.primary,
  },
  locationCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  locationLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordItem: {
    flex: 1,
    alignItems: 'center',
  },
  coordLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  coordValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  coordDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.cardBorder,
  },
  scoreCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 14,
  },
  scoreLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 42,
  },
  scoreMax: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: -4,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorCardText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.danger,
    flex: 1,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    gap: 10,
    marginBottom: 16,
  },
  refreshButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.primary,
  },
  feedbackCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  feedbackTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  feedbackSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingDotText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  submitButtonDone: {
    borderColor: Colors.safe,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  submitButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.accent,
  },
});
